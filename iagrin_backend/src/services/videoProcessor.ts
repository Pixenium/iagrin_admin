import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { Video } from '../models/Video';
import {
  uploadToR2,
  getPublicUrl,
  buildObjectKey,
  buildThumbnailKey,
  isR2Configured,
} from './r2';
import { generateThumbnail, extractDuration, extractResolution } from './ffmpeg';

const uploadDir = path.join(__dirname, '../../../uploads');
const PORT = process.env.PORT || 5000;

interface Job {
  videoId: string;
  filePath: string;
  extension: string;
  mimeType: string;
  io: Server;
}

let jobQueue: Job[] = [];
let processing = false;

async function appendLog(videoId: string, message: string): Promise<void> {
  try {
    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $push: { processingLogs: `[${new Date().toISOString()}] ${message}` } }
    );
  } catch {
    console.error(`Failed to append log for video ${videoId}`);
  }
}

async function failVideo(
  videoId: string,
  step: string,
  message: string,
  stack: string,
  details: string
): Promise<void> {
  try {
    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      {
        $set: {
          status: 'failed',
          errorStep: step,
          errorMessage: message,
          errorStack: stack,
          errorDetails: details,
        },
      }
    );
    console.error(`✗ Video ${videoId} FAILED at step "${step}": ${message}`);
  } catch (dbErr) {
    console.error(`✗ CRITICAL: Failed to update video ${videoId} error status:`, dbErr);
  }
}

export function enqueueVideo(videoId: string, filePath: string, extension: string, mimeType: string, io: Server): void {
  jobQueue.push({ videoId, filePath, extension, mimeType, io });
  console.log(`Enqueued video ${videoId} for processing. Queue length: ${jobQueue.length}`);
  processQueue();
}

async function processQueue(): Promise<void> {
  if (processing || jobQueue.length === 0) return;
  processing = true;

  const job = jobQueue.shift();
  if (!job) {
    processing = false;
    return;
  }

  console.log(`\n========== PROCESSING VIDEO ${job.videoId} ==========`);

  try {
    await processVideo(job);
  } catch (err: any) {
    console.error(`✗ Unhandled error processing video ${job.videoId}:`, err);
    console.error(`Stack:`, err.stack);
    try {
      await failVideo(
        job.videoId,
        'processQueue',
        err.message || 'Unknown error',
        err.stack || '',
        JSON.stringify(err, Object.getOwnPropertyNames(err))
      );
    } catch (dbErr) {
      console.error(`✗ CRITICAL: Could not update video ${job.videoId} after unhandled error:`, dbErr);
    }
  } finally {
    processing = false;
    setImmediate(() => processQueue());
  }
}

async function processVideo(job: Job): Promise<void> {
  const { videoId, filePath, extension, mimeType, io } = job;
  const objectKey = buildObjectKey(videoId, extension);
  const thumbnailKey = buildThumbnailKey(videoId);
  const tempThumbnailDir = path.join(uploadDir, 'thumbnails');
  const tempThumbnailPath = path.join(tempThumbnailDir, `${videoId}.jpg`);
  const isR2 = isR2Configured();
  const localBase = `http://localhost:${PORT}`;

  const update: Record<string, any> = {};

  // Step 1: Update DB status to processing
  console.log('\n[1/7] Updating status to processing...');
  try {
    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $set: { status: 'processing' } }
    );
    await appendLog(videoId, 'Status set to processing');
    console.log('  ✓ Status updated');
  } catch (err: any) {
    await failVideo(videoId, 'Status Update', err.message, err.stack, '');
    throw err;
  }

  // Step 2: Upload video to R2 (or use local path)
  if (isR2) {
    console.log('\n[2/7] Uploading to R2...');
    try {
      update.playbackUrl = await uploadToR2(filePath, objectKey, mimeType);
      await Video.updateOne(
        { _id: new mongoose.Types.ObjectId(videoId) },
        { $set: { playbackUrl: update.playbackUrl } }
      );
      await appendLog(videoId, `Uploaded to R2: ${update.playbackUrl}`);
      console.log('  ✓ Uploaded to R2');
    } catch (err: any) {
      await failVideo(videoId, 'R2 Upload', err.message, err.stack, JSON.stringify({ objectKey, mimeType, filePath }));
      throw err;
    }
  } else {
    console.log('\n[2/7] R2 not configured, using local URL...');
    update.playbackUrl = `${localBase}/uploads/${videoId}${extension}`;
    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $set: { playbackUrl: update.playbackUrl } }
    );
    await appendLog(videoId, `Local fallback URL: ${update.playbackUrl}`);
    console.log(`  ✓ Local URL set: ${update.playbackUrl}`);
  }

  // Step 3: Generate Thumbnail
  console.log('\n[3/7] Generating thumbnail...');
  let thumbnailPath: string;
  try {
    thumbnailPath = await generateThumbnail(filePath, tempThumbnailPath);
    await appendLog(videoId, `Thumbnail generated at: ${thumbnailPath}`);
    console.log('  ✓ Thumbnail created');
  } catch (err: any) {
    await failVideo(videoId, 'FFmpeg Thumbnail Generation', err.message, err.stack, err.ffmpegStderr || '');
    throw err;
  }

  // Step 4: Upload thumbnail to R2 (or use local path)
  if (isR2) {
    console.log('\n[4/7] Uploading thumbnail to R2...');
    try {
      update.thumbnailUrl = await uploadToR2(thumbnailPath, thumbnailKey, 'image/jpeg');
      await Video.updateOne(
        { _id: new mongoose.Types.ObjectId(videoId) },
        { $set: { thumbnailUrl: update.thumbnailUrl } }
      );
      await appendLog(videoId, `Thumbnail uploaded to R2: ${update.thumbnailUrl}`);
      console.log('  ✓ Thumbnail uploaded to R2');
    } catch (err: any) {
      await failVideo(videoId, 'R2 Thumbnail Upload', err.message, err.stack, JSON.stringify({ thumbnailKey, thumbnailPath }));
      throw err;
    }
  } else {
    console.log('\n[4/7] R2 not configured, using local thumbnail URL...');
    update.thumbnailUrl = `${localBase}/uploads/thumbnails/${videoId}.jpg`;
    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      { $set: { thumbnailUrl: update.thumbnailUrl } }
    );
    await appendLog(videoId, `Local thumbnail URL: ${update.thumbnailUrl}`);
    console.log(`  ✓ Thumbnail URL set: ${update.thumbnailUrl}`);
  }

  // Step 5: Extract Duration
  console.log('\n[5/7] Extracting duration...');
  let durationSeconds: number;
  try {
    durationSeconds = await extractDuration(filePath);
    await appendLog(videoId, `Duration: ${durationSeconds}s`);
    console.log(`  ✓ Duration: ${durationSeconds} seconds`);
  } catch (err: any) {
    await failVideo(videoId, 'FFmpeg Duration Extraction', err.message, err.stack, '');
    throw err;
  }

  // Step 6: Extract Resolution
  console.log('\n[6/7] Extracting resolution...');
  let width: number, height: number;
  try {
    const res = await extractResolution(filePath);
    width = res.width;
    height = res.height;
    await appendLog(videoId, `Resolution: ${width}x${height}`);
    console.log(`  ✓ Resolution: ${width}x${height}`);
  } catch (err: any) {
    await failVideo(videoId, 'FFmpeg Resolution Extraction', err.message, err.stack, '');
    throw err;
  }

  // Step 7: Save metadata and publish
  console.log('\n[7/7] Saving metadata and publishing...');
  try {
    const fileStat = fs.statSync(filePath);
    const size = fileStat.size;

    await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(videoId) },
      {
        $set: {
          status: 'published',
          durationSeconds,
          width,
          height,
          size,
          publishedAt: new Date(),
          errorMessage: '',
          errorStep: '',
          errorStack: '',
          errorDetails: '',
        },
      }
    );
    await appendLog(videoId, 'Video published successfully');
    console.log('  ✓ Database saved');
  } catch (err: any) {
    await failVideo(videoId, 'Database Save', err.message, err.stack, JSON.stringify({ durationSeconds, width, height }));
    throw err;
  }

  // Publish event for real-time updates
  console.log('\nPublishing socket event...');
  try {
    io.emit('videos:published', { videoId });
    console.log('  ✓ Socket event emitted');
  } catch (err: any) {
    console.error(`  ⚠ Socket emit failed (non-fatal): ${err.message}`);
  }

  // Cleanup temp files (only if uploaded to R2, local fallback needs them for static serving)
  if (isR2) {
    console.log('\nCleaning up temp files...');
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`  ✓ Removed temp video: ${filePath}`);
      }
      if (fs.existsSync(tempThumbnailPath)) {
        fs.unlinkSync(tempThumbnailPath);
        console.log(`  ✓ Removed temp thumbnail: ${tempThumbnailPath}`);
      }
    } catch (err: any) {
      console.error(`  ⚠ Temp file cleanup warning: ${err.message}`);
    }
  } else {
    console.log(`\nLocal mode — keeping files for static serving`);
  }

  console.log(`\n========== VIDEO ${videoId} PROCESSED SUCCESSFULLY ==========`);
}
