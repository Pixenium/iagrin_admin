"use client";

import { useState, useRef, useCallback, useEffect, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, Film, Image, CheckCircle2, AlertCircle, RefreshCw,
  FileVideo, Clock, Maximize2, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";
import { useRealtime } from "@/components/realtime-sync";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"];

type UploadState = "idle" | "validating" | "uploading" | "processing" | "success" | "error";

type VideoMeta = {
  caption: string;
  description: string;
  authorName: string;
  category: string;
  language: string;
  isFeatured: boolean;
  isTrending: boolean;
  status: string;
};

export function VideoUploadDialog({ open, onClose, onComplete }: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { socket } = useRealtime();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoResolution, setVideoResolution] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [meta, setMeta] = useState<VideoMeta>({
    caption: "", description: "", authorName: "iAgrin Admin", category: "for_you",
    language: "hi", isFeatured: false, isTrending: false, status: "published",
  });
  const [videoId, setVideoId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const lastLoadedRef = useRef(0);

  const reset = useCallback(() => {
    setUploadState("idle");
    setUploadProgress(0);
    setUploadSpeed(0);
    setRemainingTime(0);
    setErrorMessage("");
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview("");
    setThumbnailPreview("");
    setVideoDuration(0);
    setVideoResolution("");
    setDragOver(false);
    setVideoId("");
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    uploadXhrRef.current = null;
  }, []);

  const close = useCallback(() => {
    if (uploadState === "uploading") return;
    reset();
    onClose();
  }, [uploadState, reset, onClose]);

  const validateFile = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return `Invalid format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (file.size === 0) {
      return "File is empty";
    }
    return null;
  }, []);

  const loadVideoMeta = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dur = Math.round(video.duration);
      setVideoDuration(dur);
      setVideoResolution(`${video.videoWidth}x${video.videoHeight}`);
      URL.revokeObjectURL(video.src);
    };
    video.src = url;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }
    setErrorMessage("");
    setVideoFile(file);
    loadVideoMeta(file);
    setUploadState("validating");
  }, [validateFile, loadVideoMeta]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleThumbnail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Thumbnail must be an image");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }, []);

  const cancelUpload = useCallback(() => {
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
    setUploadState("idle");
    setUploadProgress(0);
    setUploadSpeed(0);
  }, []);

  const startUpload = useCallback(async () => {
    if (!videoFile) return;
    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const apiBase = getApiBase();
      const token = localStorage.getItem("iagrin_access_token") || localStorage.getItem("accessToken");

      const contentType = videoFile.type || "video/mp4";

      const uploadRes = await fetch(`${apiBase}/videos/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contentType,
          contentLength: videoFile.size,
          caption: meta.caption,
          category: meta.category,
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || err.error || "Failed to create upload session");
      }

      const uploadData = await uploadRes.json();
      const { videoId: vId, uploadUrl, objectKey, localMode } = uploadData.data ?? {};

      if (!vId) {
        throw new Error("Invalid response from server");
      }

      setVideoId(vId);

      const xhr = new XMLHttpRequest();
      uploadXhrRef.current = xhr;

      startTimeRef.current = Date.now();
      lastLoadedRef.current = 0;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);

          const now = Date.now();
          const elapsed = (now - startTimeRef.current) / 1000;
          const loadedDiff = e.loaded - lastLoadedRef.current;
          if (elapsed > 0) {
            const speed = loadedDiff / elapsed;
            setUploadSpeed(speed);
            const remaining = (e.total - e.loaded) / speed;
            setRemainingTime(Math.round(remaining));
          }
          lastLoadedRef.current = e.loaded;
          startTimeRef.current = now;
        }
      };

      const targetUrl = localMode
        ? `${apiBase}/videos/upload-file/${vId}?objectKey=${encodeURIComponent(objectKey ?? "")}`
        : uploadUrl;
      if (!targetUrl) {
        throw new Error("No upload URL available");
      }

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.open("PUT", targetUrl, true);
        xhr.setRequestHeader("Content-Type", contentType);
        if (localMode && token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(videoFile);
      });

      setUploadState("processing");
      setUploadProgress(100);

      const publishRes = await fetch(`${apiBase}/videos/${vId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          caption: meta.caption,
          description: meta.description,
          category: meta.category,
        }),
      });

      if (!publishRes.ok) {
        const err = await publishRes.json().catch(() => ({ message: "Publish failed" }));
        throw new Error(err.message || "Failed to publish video");
      }

      setUploadState("success");
      if (socket) socket.emit("videos:published", { videoId: vId });

      setTimeout(() => {
        reset();
        onComplete();
        onClose();
      }, 2000);

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  }, [videoFile, meta, socket, reset, onComplete, onClose]);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSec.toFixed(0)} B/s`;
  };

  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-background border-b border-border/50 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold">Upload Video</h2>
                <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, or WEBM up to 500MB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={close} disabled={uploadState === "uploading"}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {errorMessage && uploadState !== "uploading" && (
                <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Caption</label>
                    <Input value={meta.caption} onChange={(e) => setMeta({ ...meta, caption: e.target.value })}
                      placeholder="Video title/caption..." disabled={uploadState === "uploading"} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                    <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                      placeholder="Detailed description (optional)..."
                      disabled={uploadState === "uploading"}
                      className="w-full h-20 rounded-lg bg-background border border-border/50 px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Author Name</label>
                    <Input value={meta.authorName} onChange={(e) => setMeta({ ...meta, authorName: e.target.value })}
                      disabled={uploadState === "uploading"} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                    <select value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })}
                      disabled={uploadState === "uploading"}
                      className="w-full h-10 rounded-lg bg-background border border-border/50 px-3 text-sm">
                      <option value="for_you">For You</option>
                      <option value="organic">Organic</option>
                      <option value="machinery">Machinery</option>
                      <option value="weather">Weather</option>
                      <option value="market">Market</option>
                      <option value="tasks">Tasks</option>
                      <option value="soil">Soil</option>
                      <option value="schemes">Schemes</option>
                      <option value="news">News</option>
                      <option value="events">Events</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Language</label>
                    <select value={meta.language} onChange={(e) => setMeta({ ...meta, language: e.target.value })}
                      disabled={uploadState === "uploading"}
                      className="w-full h-10 rounded-lg bg-background border border-border/50 px-3 text-sm">
                      <option value="hi">Hindi</option>
                      <option value="en">English</option>
                      <option value="gu">Gujarati</option>
                      <option value="mr">Marathi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                      <option value="bn">Bengali</option>
                    </select>
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                {!videoFile && (
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => document.getElementById("video-input")?.click()}
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                      dragOver
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border/50 hover:border-primary/30 hover:bg-accent/10"
                    )}
                  >
                    <input
                      id="video-input"
                      type="file"
                      accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Drop video here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WEBM up to 500MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Preview */}
                {videoFile && (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-black/5 border border-border/50">
                      <video
                        ref={videoRef}
                        src={videoPreview}
                        className="w-full max-h-[280px] object-contain bg-black/10"
                        controls
                        playsInline
                      />
                      <div className="absolute bottom-2 left-2 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(videoDuration)}
                        </span>
                        {videoResolution && (
                          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" /> {videoResolution}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium">
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium uppercase">
                          {videoFile.name.split(".").pop()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-[70%]">{videoFile.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => {
                        reset();
                      }} className="text-red-500" disabled={uploadState === "uploading"}>
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>

                    {/* Thumbnail Upload */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Thumbnail (optional)</label>
                      <div className="flex items-center gap-3">
                        {thumbnailPreview ? (
                          <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-border/50 shrink-0">
                            <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                            <button onClick={() => { setThumbnailFile(null); setThumbnailPreview(""); }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-14 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                            <Image className="w-6 h-6" />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer">
                          <div className="px-3 py-2 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-accent/20 transition-colors">
                            {thumbnailFile ? thumbnailFile.name : "Click to upload thumbnail image..."}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} disabled={uploadState === "uploading"} />
                        </label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">If not provided, thumbnail is auto-generated from video</p>
                    </div>

                    {/* Featured & Trending toggles */}
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={meta.isFeatured}
                          onChange={(e) => setMeta({ ...meta, isFeatured: e.target.checked })}
                          disabled={uploadState === "uploading"}
                          className="w-4 h-4 rounded border-border/50 text-primary" />
                        Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={meta.isTrending}
                          onChange={(e) => setMeta({ ...meta, isTrending: e.target.checked })}
                          disabled={uploadState === "uploading"}
                          className="w-4 h-4 rounded border-border/50 text-primary" />
                        Trending
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={meta.status === "published"}
                          onChange={(e) => setMeta({ ...meta, status: e.target.checked ? "published" : "draft" })}
                          disabled={uploadState === "uploading"}
                          className="w-4 h-4 rounded border-border/50 text-primary" />
                        Publish immediately
                      </label>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {(uploadState === "uploading" || uploadState === "processing") && (
                  <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {uploadState === "uploading" ? "Uploading to cloud..." : "Processing video..."}
                      </span>
                      <span className="text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent/40 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    {uploadState === "uploading" && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{formatSpeed(uploadSpeed)}</span>
                        <span>{remainingTime > 0 ? `${formatTime(remainingTime)} remaining` : "Calculating..."}</span>
                        <button onClick={cancelUpload} className="text-red-500 hover:underline">Cancel</button>
                      </div>
                    )}
                    {uploadState === "processing" && (
                      <p className="text-xs text-muted-foreground">Generating thumbnail, detecting duration, transcoding...</p>
                    )}
                  </div>
                )}

                {/* Success State */}
                {uploadState === "success" && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <p className="text-lg font-bold">Video Uploaded Successfully!</p>
                    <p className="text-sm text-muted-foreground">Processing in background. Flutter feed will update automatically.</p>
                  </motion.div>
                )}

                {/* Error State */}
                {uploadState === "error" && !errorMessage.includes("Invalid") && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-error" />
                    </div>
                    <p className="text-sm font-medium text-error">{errorMessage || "Upload failed"}</p>
                    <Button variant="outline" className="gap-2" onClick={startUpload}>
                      <RefreshCw className="w-4 h-4" /> Retry Upload
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" onClick={close} disabled={uploadState === "uploading"}>
                  Cancel
                </Button>
                {videoFile && uploadState === "validating" && (
                  <Button onClick={startUpload} className="gap-2 bg-primary text-primary-foreground">
                    <Upload className="w-4 h-4" /> Upload Video
                  </Button>
                )}
                {uploadState === "error" && !errorMessage.includes("Invalid") && (
                  <Button variant="outline" className="gap-2" onClick={reset}>
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
