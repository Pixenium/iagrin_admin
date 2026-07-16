"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, Film, Clock, Maximize2, Trash2,
  RefreshCw, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBase, apiFetch } from "@/lib/api";
import { useRealtime } from "@/components/realtime-sync";
import { cn } from "@/lib/utils";

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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 320;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export function VideoUploadDialog({ open, videoToEdit, onClose, onComplete }: {
  open: boolean;
  videoToEdit?: Record<string, any> | null;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoResolution, setVideoResolution] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    setThumbnailUrl("");
    setVideoDuration(0);
    setVideoResolution("");
    setDragOver(false);
    setVideoId("");
    setIsSaving(false);
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    uploadXhrRef.current = null;
  }, []);

  useEffect(() => {
    if (videoToEdit) {
      setMeta({
        caption: videoToEdit.caption ?? "",
        description: videoToEdit.description ?? "",
        authorName: videoToEdit.authorName ?? "System Admin",
        category: videoToEdit.category ?? "for_you",
        language: videoToEdit.language ?? "hi",
        isFeatured: !!videoToEdit.isFeatured,
        isTrending: !!videoToEdit.isTrending,
        status: videoToEdit.status ?? "published",
      });
      setThumbnailUrl(videoToEdit.thumbnailUrl ?? "");
      setThumbnailPreview(videoToEdit.thumbnailUrl ?? "");
      setVideoPreview(videoToEdit.playbackUrl ?? "");
      setVideoDuration(Number(videoToEdit.durationSeconds ?? 0));
      setVideoResolution(videoToEdit.width && videoToEdit.height ? `${videoToEdit.width}x${videoToEdit.height}` : "");
      setVideoId(videoToEdit.id ?? videoToEdit._id ?? "");
      setUploadState("idle");
    } else {
      reset();
    }
  }, [videoToEdit, open, reset]);

  const close = useCallback(() => {
    if (uploadState === "uploading" || isSaving) return;
    reset();
    onClose();
  }, [uploadState, isSaving, reset, onClose]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrorMessage("Please select a valid video file.");
      setUploadState("error");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage("Video size exceeds the 500MB limit.");
      setUploadState("error");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setUploadState("validating");
    setErrorMessage("");
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

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Read video resolution and duration
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const handleLoadedMetadata = () => {
      setVideoDuration(Math.round(el.duration));
      setVideoResolution(`${el.videoWidth}x${el.videoHeight}`);
    };
    el.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => el.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [videoPreview]);

  const uploadThumbnailImage = async (vId: string): Promise<string> => {
    if (!thumbnailFile) return thumbnailUrl;
    
    const apiBase = getApiBase();
    const token = localStorage.getItem("iagrin_access_token") || localStorage.getItem("accessToken");
    
    const formData = new FormData();
    formData.append("thumbnail", thumbnailFile);

    let uploadedUrl = "";
    
    const uploadEndpoints = [
      `${apiBase}/videos/${vId}/thumbnail`,
      `${apiBase}/videos/${vId}/upload-thumbnail`,
      `${apiBase}/upload/thumbnail`
    ];

    // Try in parallel with a fast timeout (2 seconds) to avoid blocking the UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const promises = uploadEndpoints.map(async (endpoint) => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            const url = data?.data?.url || data?.url || data?.thumbnailUrl;
            if (url) return url;
          }
        } catch (e) {
          // ignore individual failures
        }
        throw new Error("Failed");
      });

      uploadedUrl = await Promise.any(promises);
    } catch (e) {
      console.warn("All parallel thumbnail uploads failed or timed out, using Base64 fallback.");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!uploadedUrl) {
      // Base64 Fallback with client-side image compression to prevent payload too large errors
      try {
        uploadedUrl = await compressImage(thumbnailFile);
      } catch (err) {
        console.error("Compression failed, using raw base64", err);
        uploadedUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(thumbnailFile);
        });
      }
    }

    return uploadedUrl;
  };

  const handleSave = async () => {
    const vId = videoId || videoToEdit?.id || videoToEdit?._id || "";
    
    if (!vId) {
      setErrorMessage("Video ID is missing. Please close the edit box and try again.");
      return;
    }

    if (!meta.caption.trim()) {
      setErrorMessage("Caption is required");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const finalThumbnailUrl = await uploadThumbnailImage(vId);

      const payload = {
        caption: meta.caption,
        description: meta.description,
        authorName: meta.authorName,
        category: meta.category,
        language: meta.language,
        status: meta.status,
        isFeatured: meta.isFeatured,
        isTrending: meta.isTrending,
        thumbnailUrl: finalThumbnailUrl,
      };

      console.log("Updating video metadata & thumbnail...", payload);
      try {
        await apiFetch<any>(`/videos/${vId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch (patchErr: any) {
        console.warn("PATCH /videos/:id failed, trying /publish + /status fallback...", patchErr);
        await apiFetch<any>(`/videos/${vId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: meta.status, isFeatured: meta.isFeatured, isTrending: meta.isTrending, thumbnailUrl: finalThumbnailUrl }),
        });
        await apiFetch<any>(`/videos/${vId}/publish`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setUploadState("success");
      if (socket) {
        socket.emit("videos:published", { videoId: vId });
      }

      setTimeout(() => {
        onComplete();
        close();
      }, 1500);

    } catch (err: any) {
      console.error("Failed to save changes:", err);
      setErrorMessage(err.message || err.error || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

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

      // Upload custom thumbnail if selected
      const finalThumbnailUrl = await uploadThumbnailImage(vId);

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
          language: meta.language,
          authorName: meta.authorName,
          isFeatured: meta.isFeatured,
          isTrending: meta.isTrending,
          status: meta.status,
          thumbnailUrl: finalThumbnailUrl
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
  }, [videoFile, meta, socket, reset, onComplete, onClose, thumbnailFile]);

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
                <h2 className="text-lg font-bold">{videoToEdit ? "Edit Video Details" : "Upload Video"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {videoToEdit ? "Modify video metadata and status details" : "MP4, MOV, or WEBM up to 500MB"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={close} disabled={uploadState === "uploading" || isSaving}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {errorMessage && uploadState !== "uploading" && (
                <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                </div>
              )}

              {uploadState === "success" && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {videoToEdit ? "Changes saved successfully!" : "Video published successfully!"}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Caption</label>
                    <Input value={meta.caption} onChange={(e) => setMeta({ ...meta, caption: e.target.value })}
                      placeholder="Video title/caption..." disabled={uploadState === "uploading" || isSaving} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                    <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                      placeholder="Detailed description (optional)..."
                      disabled={uploadState === "uploading" || isSaving}
                      className="w-full h-20 rounded-lg bg-background border border-border/50 px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Author Name</label>
                    <Input value={meta.authorName} onChange={(e) => setMeta({ ...meta, authorName: e.target.value })}
                      disabled={uploadState === "uploading" || isSaving} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                    <select value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })}
                      disabled={uploadState === "uploading" || isSaving}
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
                      disabled={uploadState === "uploading" || isSaving}
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

                {/* Drag & Drop Zone (Only for Uploading New Videos) */}
                {!videoToEdit && !videoFile && (
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

                {/* Video Preview (Shows current playback URL in edit mode, or the new file in upload mode) */}
                {(videoFile || videoPreview) && (
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
                      {!videoToEdit && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium">
                            {videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : ""}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium uppercase">
                            {videoFile ? videoFile.name.split(".").pop() : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {!videoToEdit && videoFile && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate max-w-[70%]">{videoFile.name}</p>
                        <Button variant="ghost" size="sm" onClick={reset} className="text-red-500" disabled={uploadState === "uploading"}>
                          <Trash2 className="w-4 h-4" /> Remove
                        </Button>
                      </div>
                    )}

                    {/* Thumbnail Upload (Dynamically works in both edit and upload mode) */}
                    <div className="space-y-2 border-t border-border/40 pt-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Thumbnail Image</label>
                      <div className="flex items-start gap-4">
                        {thumbnailPreview ? (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border/50 shrink-0 bg-black/5">
                            <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                setThumbnailFile(null);
                                setThumbnailPreview("");
                                setThumbnailUrl("");
                              }}
                              disabled={uploadState === "uploading" || isSaving}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-16 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground shrink-0 bg-black/5">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Paste thumbnail URL or upload image file..."
                              value={thumbnailUrl}
                              onChange={(e) => {
                                setThumbnailUrl(e.target.value);
                                setThumbnailPreview(e.target.value);
                              }}
                              disabled={uploadState === "uploading" || isSaving}
                              className="flex-1 h-9 text-xs"
                            />
                            <label className="cursor-pointer shrink-0">
                              <div className="px-3 py-2 h-9 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-accent/20 transition-colors flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> File
                              </div>
                              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} disabled={uploadState === "uploading" || isSaving} />
                            </label>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Pasting a URL updates the thumbnail immediately. Files will be uploaded to the cloud when saving.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Featured & Trending & Status toggles */}
                    <div className="grid grid-cols-3 gap-4 border-t border-border/40 pt-4">
                      <label className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/40 cursor-pointer hover:bg-accent/10">
                        <input type="checkbox" checked={meta.isFeatured}
                          onChange={(e) => setMeta({ ...meta, isFeatured: e.target.checked })}
                          disabled={uploadState === "uploading" || isSaving}
                          className="w-4 h-4 rounded border-border focus:ring-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Featured ⭐</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/40 cursor-pointer hover:bg-accent/10">
                        <input type="checkbox" checked={meta.isTrending}
                          onChange={(e) => setMeta({ ...meta, isTrending: e.target.checked })}
                          disabled={uploadState === "uploading" || isSaving}
                          className="w-4 h-4 rounded border-border focus:ring-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Trending 🔥</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/40 cursor-pointer hover:bg-accent/10">
                        <input type="checkbox" checked={meta.status === "published"}
                          onChange={(e) => setMeta({ ...meta, status: e.target.checked ? "published" : "draft" })}
                          disabled={uploadState === "uploading" || isSaving}
                          className="w-4 h-4 rounded border-border focus:ring-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Published</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploading/Processing Progress */}
              {(uploadState === "uploading" || uploadState === "processing") && (
                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {uploadState === "uploading" ? "Uploading to cloud..." : "Processing video..."}
                    </span>
                    <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent/40 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {uploadState === "uploading" && (
                      <>
                        <span>{formatSpeed(uploadSpeed)}</span>
                        <span>{remainingTime > 0 ? `${formatTime(remainingTime)} remaining` : "Calculating..."}</span>
                      </>
                    )}
                    {uploadState === "processing" && (
                      <span className="text-[10px]">Generating thumbnail, detecting duration, transcoding...</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border/50 px-6 py-4 flex justify-end gap-2 z-10">
              <Button variant="outline" onClick={close} disabled={uploadState === "uploading" || isSaving}>
                Cancel
              </Button>
              {videoToEdit ? (
                <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              ) : (
                <>
                  {videoFile && uploadState === "validating" && (
                    <Button onClick={startUpload} className="bg-primary text-primary-foreground gap-2">
                      <Upload className="w-4 h-4" /> Start Upload
                    </Button>
                  )}
                  {uploadState === "error" && !errorMessage.includes("Invalid") && (
                    <Button onClick={startUpload} className="bg-primary text-primary-foreground gap-2">
                      <RefreshCw className="w-4 h-4" /> Retry Upload
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
