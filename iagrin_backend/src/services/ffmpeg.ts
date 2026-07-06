import ffmpeg from 'fluent-ffmpeg';
import FfmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

let ffmpegPath: string | null = null;
let ffprobePath: string | null = null;

export function initFfmpeg(): void {
  ffmpegPath = FfmpegPath.path;
  ffmpeg.setFfmpegPath(ffmpegPath);

  try {
    const ffprobe = require('@ffprobe-installer/ffprobe');
    if (ffprobe && ffprobe.path) {
      ffprobePath = ffprobe.path;
      ffmpeg.setFfprobePath(ffprobe.path);
    }
  } catch {
    console.warn('  ⚠ @ffprobe-installer/ffprobe not available, using system ffprobe');
  }

  console.log(`✓ FFmpeg path: ${ffmpegPath}`);
}

export function getFfmpegPath(): string {
  if (!ffmpegPath) throw new Error('FFmpeg not initialized. Call initFfmpeg() first.');
  return ffmpegPath;
}

export function checkFfmpegInstalled(): void {
  const ffmpegCheck = FfmpegPath.path;
  if (!ffmpegCheck) throw new Error('FFmpeg binary not found');
  if (!fs.existsSync(ffmpegCheck)) throw new Error(`FFmpeg binary not found at: ${ffmpegCheck}`);

  const ffprobeCheck = require('@ffprobe-installer/ffprobe');
  if (!ffprobeCheck || !ffprobeCheck.path) {
    console.warn('  ⚠ FFprobe not found via @ffprobe-installer, trying system ffprobe');
  } else if (!fs.existsSync(ffprobeCheck.path)) {
    console.warn(`  ⚠ FFprobe path does not exist: ${ffprobeCheck.path}`);
  } else {
    console.log(`  ✓ FFprobe path: ${ffprobeCheck.path}`);
  }

  console.log(`  ✓ FFmpeg path: ${ffmpegCheck}`);
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timeMarkSeconds: number = 1
): Promise<string> {
  console.log(`Generating thumbnail...`);
  console.log(`  Input: ${inputPath}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Time mark: ${timeMarkSeconds}s`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    let stderr = '';

    ffmpeg(inputPath)
      .on('start', (cmd) => {
        console.log(`  FFmpeg command: ${cmd}`);
      })
      .on('stderr', (line) => {
        stderr += line + '\n';
      })
      .on('error', (err) => {
        console.error(`  ✗ Thumbnail generation FAILED`);
        console.error(`  Error: ${err.message}`);
        console.error(`  FFmpeg stderr:`);
        console.error(stderr);
        const enhanced = new Error(`FFmpeg Thumbnail Generation failed: ${err.message}`);
        (enhanced as any).ffmpegStderr = stderr;
        (enhanced as any).ffmpegError = err;
        reject(enhanced);
      })
      .on('end', () => {
        if (!fs.existsSync(outputPath)) {
          const err = new Error(`Thumbnail file was not created at: ${outputPath}`);
          (err as any).ffmpegStderr = stderr;
          reject(err);
          return;
        }
        const stat = fs.statSync(outputPath);
        console.log(`  ✓ Thumbnail created: ${(stat.size / 1024).toFixed(1)} KB`);
        resolve(outputPath);
      })
      .screenshots({
        count: 1,
        timemarks: [String(timeMarkSeconds)],
        filename: path.basename(outputPath),
        folder: outputDir,
        size: '640x?',
      });
  });
}

export async function extractDuration(inputPath: string): Promise<number> {
  console.log(`Extracting duration...`);

  return new Promise((resolve, reject) => {
    let stderr = '';

    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.error(`  ✗ Duration extraction FAILED`);
        console.error(`  Error: ${err.message}`);
        reject(new Error(`FFprobe duration extraction failed: ${err.message}`));
        return;
      }

      const duration = metadata?.format?.duration;
      if (duration == null || isNaN(duration)) {
        console.error(`  ✗ Duration not found in metadata`);
        reject(new Error('Duration not found in video metadata'));
        return;
      }

      const rounded = Math.round(duration);
      console.log(`  Duration: ${rounded} seconds`);
      resolve(rounded);
    });
  });
}

export async function extractResolution(inputPath: string): Promise<{ width: number; height: number }> {
  console.log(`Extracting resolution...`);

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.error(`  ✗ Resolution extraction FAILED`);
        console.error(`  Error: ${err.message}`);
        reject(new Error(`FFprobe resolution extraction failed: ${err.message}`));
        return;
      }

      const videoStream = metadata?.streams?.find(
        (s: any) => s.codec_type === 'video'
      );

      if (!videoStream) {
        console.error(`  ✗ No video stream found`);
        reject(new Error('No video stream found in the file'));
        return;
      }

      const width = videoStream.width || 0;
      const height = videoStream.height || 0;

      console.log(`  Resolution: ${width}x${height}`);
      resolve({ width, height });
    });
  });
}
