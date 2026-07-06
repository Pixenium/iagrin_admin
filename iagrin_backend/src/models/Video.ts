import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  caption: string;
  description: string;
  authorName: string;
  category: string;
  language: string;
  status: 'draft' | 'uploading' | 'processing' | 'published' | 'failed';
  playbackUrl: string;
  thumbnailUrl: string;
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  durationSeconds: number;
  width: number;
  height: number;
  viewsCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  savesCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  errorMessage: string;
  errorStep: string;
  errorStack: string;
  errorDetails: string;
  processingLogs: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    caption: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    authorName: { type: String, default: 'iAgrin Admin', trim: true },
    category: { type: String, default: 'for_you', index: true },
    language: { type: String, default: 'hi', index: true },
    status: {
      type: String,
      enum: ['draft', 'uploading', 'processing', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    playbackUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    objectKey: { type: String, default: '' },
    originalFileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    errorStep: { type: String, default: '' },
    errorStack: { type: String, default: '' },
    errorDetails: { type: String, default: '' },
    processingLogs: { type: [String], default: [] },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'videos',
  }
);

VideoSchema.index({ createdAt: -1 });
VideoSchema.index({ status: 1, createdAt: -1 });

export const Video = mongoose.model<IVideo>('Video', VideoSchema);
