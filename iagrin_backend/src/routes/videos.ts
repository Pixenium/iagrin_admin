import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

const router = Router();

// Setup local storage for video uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// POST /api/v1/videos/upload
// Initializes upload, returns localMode = true and an uploadUrl
router.post('/upload', async (req, res) => {
  try {
    const videoId = new mongoose.Types.ObjectId().toString();
    const objectKey = `videos/${videoId}.mp4`;
    
    // In local mode, we tell frontend to PUT to our own endpoint
    res.json({
      success: true,
      data: {
        videoId,
        uploadUrl: `http://localhost:4000/api/v1/videos/upload-file/${videoId}?objectKey=${encodeURIComponent(objectKey)}`,
        objectKey,
        localMode: true
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/videos/upload-file/:id
// Handles the actual file upload from the frontend
router.put('/upload-file/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const filePath = path.join(uploadDir, `${videoId}.mp4`);
    
    // Pipe the raw request stream to the file
    const stream = fs.createWriteStream(filePath);
    req.pipe(stream);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.json({ success: true, message: 'File uploaded locally' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/videos/:id/publish
router.post('/:id/publish', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');
    
    const videoId = req.params.id;
    const { caption, description, category } = req.body;
    
    await db.collection('videos').insertOne({
      _id: new mongoose.Types.ObjectId(videoId),
      caption,
      description,
      category,
      status: 'published',
      playbackUrl: `http://localhost:4000/uploads/${videoId}.mp4`,
      viewsCount: 0,
      likeCount: 0,
      createdAt: new Date()
    });

    res.json({ success: true, message: 'Video published' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
