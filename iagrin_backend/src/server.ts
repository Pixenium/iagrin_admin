import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { setupSocket } from './socket';
import dynamicRoutes from './routes/dynamic';
import videoRoutes from './routes/videos';
import { initR2, checkR2Connection, testR2Upload, isR2Configured } from './services/r2';
import { initFfmpeg, checkFfmpegInstalled } from './services/ffmpeg';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = setupSocket(server);
app.locals.io = io;

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    r2: isR2Configured() ? 'configured' : 'not configured',
  });
});

app.get('/health/detailed', async (req, res) => {
  const checks: Record<string, any> = {};
  let allOk = true;

  if (isR2Configured()) {
    try {
      const { getS3Client, getBucketName } = require('./services/r2');
      await getS3Client().send(
        new (require('@aws-sdk/client-s3').HeadBucketCommand)({ Bucket: getBucketName() })
      );
      checks.r2 = { status: 'ok' };
    } catch (err: any) {
      checks.r2 = { status: 'error', message: err.message };
      allOk = false;
    }
  } else {
    checks.r2 = { status: 'skipped', reason: 'R2 not configured' };
  }

  try {
    checkFfmpegInstalled();
    checks.ffmpeg = { status: 'ok' };
  } catch (err: any) {
    checks.ffmpeg = { status: 'error', message: err.message };
    allOk = false;
  }

  checks.mongo = { status: mongoose.connection.readyState === 1 ? 'ok' : 'error' };
  if (mongoose.connection.readyState !== 1) allOk = false;

  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    checks.uploadDir = { status: 'ok', path: uploadDir };
  } catch (err: any) {
    checks.uploadDir = { status: 'error', path: uploadDir, message: err.message };
    allOk = false;
  }

  res.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1', dynamicRoutes(io));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iagrin';

async function startup() {
  console.log('\n========================================');
  console.log('  iAgrin Backend Startup Checks');
  console.log('========================================\n');

  console.log('[1/7] Upload Directory...');
  try {
    const testFile = path.join(uploadDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('  ✓ Upload directory writable');
  } catch (err: any) {
    console.error('  ✗ Upload directory not writable:', err.message);
    process.exit(1);
  }

  console.log('\n[2/7] MongoDB...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('  ✓ Connected to MongoDB');
  } catch (err: any) {
    console.error('  ✗ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  console.log('\n[3/7] Cloudflare R2...');
  if (isR2Configured()) {
    try {
      initR2();
      console.log('  ✓ R2 client initialized');
    } catch (err: any) {
      console.error('  ✗ R2 initialization failed:', err.message);
      console.error('    Make sure R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are set in .env');
      process.exit(1);
    }

    console.log('\n[4/7] R2 Bucket...');
    try {
      await checkR2Connection();
    } catch (err: any) {
      console.error('  ✗ R2 bucket check failed:', err.message);
      process.exit(1);
    }

    console.log('\n[5/7] R2 Upload/Read Test...');
    try {
      await testR2Upload();
      console.log('  ✓ R2 upload/read test passed');
    } catch (err: any) {
      console.error('  ✗ R2 upload/read test failed:', err.message);
      process.exit(1);
    }
  } else {
    console.log('  ⚠ R2 not configured — videos will be stored locally');
    console.log('  ℹ Set R2_* env vars in .env to enable Cloudflare R2');
  }

  console.log('\n[6/7] FFmpeg...');
  try {
    initFfmpeg();
    checkFfmpegInstalled();
  } catch (err: any) {
    console.error('  ✗ FFmpeg check failed:', err.message);
    process.exit(1);
  }

  console.log('\n[7/7] Starting HTTP server...');
  server.listen(PORT, () => {
    console.log('========================================');
    console.log(`  Server running on port ${PORT}`);
    if (!isR2Configured()) {
      console.log('  ⚠ Running in LOCAL-ONLY mode (no R2)');
    }
    console.log('========================================\n');
  });
}

startup().catch((err) => {
  console.error('\n❌ Startup failed:', err);
  process.exit(1);
});

export default app;
