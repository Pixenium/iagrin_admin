import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, DeleteObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';

let s3Client: S3Client | null = null;
let bucketName = '';
let publicUrlBase = '';

export function isR2Configured(): boolean {
  return !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

export function initR2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.CDN_BASE_URL;

  if (!endpoint) throw new Error('R2_ENDPOINT is not configured');
  if (!accessKeyId) throw new Error('R2_ACCESS_KEY_ID is not configured');
  if (!secretAccessKey) throw new Error('R2_SECRET_ACCESS_KEY is not configured');
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');

  bucketName = bucket;
  publicUrlBase = publicUrl ? publicUrl.replace(/\/+$/, '') : '';

  s3Client = new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  console.log('✓ R2 client initialized');
  return s3Client;
}

export function getS3Client(): S3Client {
  if (!s3Client) throw new Error('R2 client not initialized. Call initR2() first.');
  return s3Client;
}

export function getBucketName(): string {
  if (!bucketName) throw new Error('R2 bucket not configured.');
  return bucketName;
}

export async function checkR2Connection(): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();
  console.log(`  Checking R2 bucket "${bucket}"...`);
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log('  ✓ Bucket exists and is accessible');
}

export async function testR2Upload(): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();
  const testKey = `_healthcheck/test-${Date.now()}.txt`;

  console.log('  Testing R2 upload...');
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: testKey,
    Body: 'R2 connection OK',
    ContentType: 'text/plain',
  }));
  console.log('  ✓ Upload successful');

  console.log('  Testing R2 read...');
  const result = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: testKey,
  }));
  const body = await result.Body?.transformToString();
  if (body !== 'R2 connection OK') throw new Error('R2 read test: content mismatch');

  console.log('  ✓ Read successful');

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: testKey,
  }));
  console.log('  ✓ Cleanup successful');
}

export async function uploadToR2(
  filePath: string,
  objectKey: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucketName();

  const fileStream = fs.createReadStream(filePath);
  const fileSize = fs.statSync(filePath).size;

  console.log(`Uploading to R2...`);
  console.log(`  Bucket: ${bucket}`);
  console.log(`  Key: ${objectKey}`);
  console.log(`  Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  MIME: ${mimeType}`);

  const parallelUpload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: objectKey,
      Body: fileStream,
      ContentType: mimeType,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024,
    leavePartsOnError: false,
  });

  parallelUpload.on('httpUploadProgress', (progress) => {
    const pct = progress.total
      ? Math.round((progress.loaded || 0) / progress.total * 100)
      : 0;
    if (onProgress) onProgress(pct);
    if (pct > 0 && pct % 25 === 0) {
      console.log(`  R2 upload progress: ${pct}%`);
    }
  });

  await parallelUpload.done();
  console.log('  ✓ R2 upload completed');

  const publicUrl = getPublicUrl(objectKey);
  console.log(`  Public URL: ${publicUrl}`);

  return publicUrl;
}

export async function readFromR2(objectKey: string): Promise<Buffer> {
  const client = getS3Client();
  const bucket = getBucketName();

  console.log(`Reading from R2: ${objectKey}`);

  const result = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));

  const body = await result.Body?.transformToByteArray();
  if (!body) throw new Error(`Empty response from R2 for: ${objectKey}`);

  console.log(`  ✓ Read ${body.length} bytes`);
  return Buffer.from(body);
}

export async function deleteFromR2(objectKey: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();

  console.log(`Deleting from R2: ${objectKey}`);

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));

  console.log('  ✓ Deleted');
}

export function getPublicUrl(objectKey: string): string {
  if (publicUrlBase) {
    return `${publicUrlBase}/${objectKey}`;
  }
  throw new Error('No public URL base configured (R2_PUBLIC_URL or CDN_BASE_URL)');
}

export function buildObjectKey(videoId: string, extension: string): string {
  return `videos/${videoId}${extension}`;
}

export function buildThumbnailKey(videoId: string): string {
  return `thumbnails/${videoId}.jpg`;
}
