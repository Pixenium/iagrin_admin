import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { Video } from '../models/Video';
import { enqueueVideo } from '../services/videoProcessor';
import { isR2Configured } from '../services/r2';

const router = Router();

const uploadDir = path.join(__dirname, '../../../uploads');
const thumbDir = path.join(uploadDir, 'thumbnails');

for (const dir of [uploadDir, thumbDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska',
];

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext || '.mp4';
}

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val || '');
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
  };
  return map[ext] || 'video/mp4';
}

// GET /api/v1/videos/admin-list
router.get('/admin-list', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const sortField = (req.query.sort as string) || '-createdAt';

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { caption: searchRegex },
        { description: searchRegex },
        { authorName: searchRegex },
      ];
    }

    let sortObj: any = { createdAt: -1 };
    if (sortField.startsWith('-')) {
      sortObj = { [sortField.slice(1)]: -1 };
    } else {
      sortObj = { [sortField]: 1 };
    }

    const [items, total] = await Promise.all([
      Video.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Video.countDocuments(filter),
    ]);

    const rows = items.map((item) => ({
      ...item,
      id: (item._id as mongoose.Types.ObjectId).toString(),
      _id: undefined,
    }));

    res.json({
      success: true,
      data: {
        rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error(`[videos] admin-list error:`, err);
    res.status(500).json({
      success: false,
      step: 'admin-list',
      message: err.message,
      stack: err.stack,
    });
  }
});

// GET /api/v1/videos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = paramStr(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    const video = await Video.findById(id).lean();
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.json({
      success: true,
      data: {
        ...video,
        id: (video._id as mongoose.Types.ObjectId).toString(),
        _id: undefined,
      },
    });
  } catch (err: any) {
    console.error(`[videos] get error:`, err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// POST /api/v1/videos/upload
router.post('/upload', async (req: Request, res: Response) => {
  try {
    console.log(`\n===== VIDEO UPLOAD INITIATED =====`);
    const { contentType, contentLength, caption, category } = req.body;

    console.log(`Request body:`, JSON.stringify({ contentType, contentLength, caption, category }));

    let mimeType = contentType || 'video/mp4';
    let ext = '.mp4';

    if (contentType) {
      const found = ALLOWED_MIME_TYPES.find((t) => contentType.startsWith(t));
      if (!found) {
        return res.status(400).json({
          success: false,
          step: 'Validation',
          message: `Unsupported content type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }
      ext = '.' + contentType.split('/')[1];
      if (ext === '.quicktime') ext = '.mov';
    }

    if (contentLength !== undefined) {
      const len = Number(contentLength);
      if (len <= 0) {
        return res.status(400).json({
          success: false,
          step: 'Validation',
          message: 'Cannot upload an empty file',
        });
      }
      const maxSize = 500 * 1024 * 1024;
      if (len > maxSize) {
        return res.status(400).json({
          success: false,
          step: 'Validation',
          message: `File too large. Maximum: ${maxSize / 1024 / 1024}MB`,
        });
      }
    }

    const video = new Video({
      caption: caption || '',
      category: category || 'for_you',
      mimeType,
      status: 'draft',
    });

    await video.save();
    const videoId = (video._id as mongoose.Types.ObjectId).toString();
    console.log(`Video created: ${videoId}`);

    const objectKey = `videos/${videoId}${ext}`;

    res.json({
      success: true,
      data: {
        videoId,
        uploadUrl: `/api/v1/videos/upload-file/${videoId}?objectKey=${encodeURIComponent(objectKey)}`,
        objectKey,
        localMode: true,
      },
    });

    console.log(`Upload session created for video ${videoId}`);
  } catch (err: any) {
    console.error(`[videos] upload error at ${__filename}:`, err);
    res.status(500).json({
      success: false,
      step: 'Upload Init',
      message: err.message,
      stack: err.stack,
    });
  }
});

// PUT /api/v1/videos/upload-file/:id
router.put('/upload-file/:id', async (req: Request, res: Response) => {
  const videoId = paramStr(req.params.id);

  try {
    console.log(`\n===== VIDEO FILE UPLOAD: ${videoId} =====`);

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const contentType = req.headers['content-type'] || video.mimeType || 'video/mp4';
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    console.log(`Content-Type: ${contentType}`);
    console.log(`Content-Length: ${contentLength}`);

    if (contentLength === 0) {
      return res.status(400).json({
        success: false,
        step: 'Validation',
        message: 'Cannot upload an empty file (zero bytes)',
      });
    }

    const ext = getExtension(video.originalFileName || `video.${contentType.split('/')[1] || 'mp4'}`);
    const tempFilePath = path.join(uploadDir, `${videoId}${ext}`);

    const writeStream = fs.createWriteStream(tempFilePath);
    let bytesReceived = 0;

    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', (err) => {
        reject(new Error(`File write error: ${err.message}`));
      });
      req.on('error', (err) => {
        writeStream.destroy();
        reject(new Error(`Request stream error: ${err.message}`));
      });
    });

    if (bytesReceived === 0) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        success: false,
        step: 'Validation',
        message: 'Received empty file (zero bytes)',
      });
    }

    const fileSize = fs.statSync(tempFilePath).size;

    console.log(`File saved to: ${tempFilePath}`);
    console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Update video record
    video.status = 'uploading';
    video.size = fileSize;
    video.originalFileName = `video${ext}`;
    video.mimeType = contentType;
    video.objectKey = `videos/${videoId}${ext}`;
    await video.save();

    console.log(`Video ${videoId} uploaded successfully. Starting async processing...`);

    res.json({
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: { videoId, size: fileSize },
    });

    // Enqueue for background processing
    const io: Server = req.app.locals.io;
    enqueueVideo(videoId, tempFilePath, ext, contentType, io);
  } catch (err: any) {
    console.error(`[videos] upload-file error for ${videoId}:`, err);
    console.error(`Stack:`, err.stack);

    try {
      await Video.updateOne(
        { _id: new mongoose.Types.ObjectId(videoId) },
        {
          $set: {
            status: 'failed',
            errorStep: 'File Upload',
            errorMessage: err.message,
            errorStack: err.stack || '',
            errorDetails: JSON.stringify({ headers: req.headers }),
          },
        }
      );
    } catch (dbErr) {
      console.error(`CRITICAL: Could not update video ${videoId} error status:`, dbErr);
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        step: 'File Upload',
        message: err.message,
        stack: err.stack,
        details: JSON.stringify({ headers: req.headers }),
      });
    }
  }
});

// POST /api/v1/videos/:id/publish
router.post('/:id/publish', async (req: Request, res: Response) => {
  const videoId = paramStr(req.params.id);

  try {
    console.log(`\n===== VIDEO PUBLISH: ${videoId} =====`);
    console.log(`Request body:`, JSON.stringify(req.body));

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const { caption, description, category, authorName, language, isFeatured, isTrending, status } = req.body;

    if (caption !== undefined) video.caption = caption;
    if (description !== undefined) video.description = description;
    if (category !== undefined) video.category = category;
    if (authorName !== undefined) video.authorName = authorName;
    if (language !== undefined) video.language = language;
    if (isFeatured !== undefined) video.isFeatured = isFeatured;
    if (isTrending !== undefined) video.isTrending = isTrending;

    await video.save();
    console.log(`Video ${videoId} metadata updated`);

    if (video.status === 'published') {
      const io: Server = req.app.locals.io;
      io.emit('videos:published', { videoId });
    }

    res.json({
      success: true,
      message: 'Video published successfully',
      data: {
        videoId,
        status: video.status,
        playbackUrl: video.playbackUrl,
        thumbnailUrl: video.thumbnailUrl,
      },
    });

    console.log(`Video ${videoId} published. Status: ${video.status}`);
  } catch (err: any) {
    console.error(`[videos] publish error for ${videoId}:`, err);
    res.status(500).json({
      success: false,
      step: 'Publish',
      message: err.message,
      stack: err.stack,
    });
  }
});

// PATCH /api/v1/videos/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = paramStr(req.params.id);
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    const validStatuses = ['draft', 'uploading', 'processing', 'published', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const update: any = { status };
    if (status === 'published') {
      update.publishedAt = new Date();
    }

    await Video.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: update });

    const io: Server = req.app.locals.io;
    io.emit('videos:changed', { videoId: id, status });

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err: any) {
    console.error(`[videos] status update error:`, err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// DELETE /api/v1/videos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = paramStr(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const objectKey = video.objectKey;
    if (objectKey && isR2Configured()) {
      try {
        const { deleteFromR2 } = require('../services/r2');
        await deleteFromR2(objectKey);
      } catch (r2Err) {
        console.error(`Warning: Could not delete from R2: ${r2Err}`);
      }
    }

    const localFile = path.join(uploadDir, `${id}${path.extname(video.originalFileName || '.mp4')}`);
    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }

    const localThumb = path.join(uploadDir, 'thumbnails', `${id}.jpg`);
    if (fs.existsSync(localThumb)) {
      fs.unlinkSync(localThumb);
    }

    await Video.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    const io: Server = req.app.locals.io;
    io.emit('videos:deleted', { videoId: id });

    res.json({ success: true, message: 'Video deleted' });
  } catch (err: any) {
    console.error(`[videos] delete error:`, err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

export default router;
