import type { MediaAdjustments, StudioClip } from "./types";

function filterValue(a: MediaAdjustments) {
  const sepia = Math.max(0, a.warmth) * 0.35;
  return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) sepia(${sepia}%) opacity(${100 - a.fade * 0.45}%)`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  a: MediaAdjustments,
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate((a.rotation * Math.PI) / 180);
  ctx.scale((a.flipX ? -1 : 1) * a.zoom, a.zoom);
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const w = sourceWidth * scale;
  const h = sourceHeight * scale;
  ctx.filter = filterValue(a);
  ctx.drawImage(source, -w / 2, -h / 2, w, h);
  ctx.restore();
  if (a.text.trim()) {
    ctx.save();
    ctx.font = `700 ${a.textSize}px Figtree, sans-serif`;
    ctx.textAlign = a.textAlign;
    ctx.textBaseline = "bottom";
    ctx.lineWidth = Math.max(3, a.textSize / 10);
    ctx.strokeStyle = "rgba(0,0,0,.72)";
    ctx.fillStyle = "white";
    const safeX = Math.min(0.92, Math.max(0.08, a.textX));
    const safeY = Math.min(0.86, Math.max(0.08, a.textY));
    const x = safeX * width;
    const y = safeY * height;
    ctx.strokeText(a.text, x, y, width - 84);
    ctx.fillText(a.text, x, y, width - 84);
    ctx.restore();
  }
}

export async function renderPhoto(file: File, a: MediaAdjustments): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const portrait = bitmap.height > bitmap.width;
  const width = portrait ? 1080 : 1350;
  const height = portrait ? 1350 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("photo editor is unavailable");
  drawFrame(ctx, bitmap, bitmap.width, bitmap.height, width, height, a);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("couldn't finish that photo");
  return new File([blob], `lowkey-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export async function renderVideo(
  clips: StudioClip[],
  a: MediaAdjustments,
  onProgress: (value: number) => void,
): Promise<File> {
  if (!clips.length) throw new Error("add a video first");
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.captureStream || typeof MediaRecorder === "undefined") {
    throw new Error("video editing isn't supported in this browser yet");
  }
  const stream = canvas.captureStream(30);
  const AudioContextClass = window.AudioContext;
  const audioContext = new AudioContextClass();
  const audioDestination = audioContext.createMediaStreamDestination();
  audioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  const preferred = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  if (!preferred) throw new Error("this browser can't export edited video yet");
  const recorder = new MediaRecorder(stream, { mimeType: preferred, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("video export failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: preferred }));
  });
  recorder.start(500);
  const total = clips.reduce((sum, c) => sum + Math.max(0.1, c.trimEnd - c.trimStart), 0);
  let complete = 0;
  for (const clip of clips) {
    const video = document.createElement("video");
    video.src = clip.url;
    video.playsInline = true;
    video.playbackRate = a.speed;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error(`couldn't read ${clip.name}`));
    });
    video.currentTime = clip.trimStart;
    await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });
    const source = audioContext.createMediaElementSource(video);
    const gain = audioContext.createGain();
    gain.gain.value = a.originalVolume / 100;
    source.connect(gain).connect(audioDestination);
    await audioContext.resume();
    await video.play();
    await new Promise<void>((resolve) => {
      const frame = () => {
        drawFrame(ctx, video, video.videoWidth, video.videoHeight, canvas.width, canvas.height, a);
        const elapsed = Math.min(clip.trimEnd - clip.trimStart, video.currentTime - clip.trimStart);
        onProgress(Math.min(96, Math.round(((complete + elapsed) / total) * 100)));
        if (video.currentTime >= clip.trimEnd || video.ended) {
          video.pause();
          resolve();
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    complete += Math.max(0.1, clip.trimEnd - clip.trimStart);
    source.disconnect();
    gain.disconnect();
  }
  recorder.stop();
  const blob = await done;
  await audioContext.close();
  onProgress(100);
  return new File([blob], `lowkey-${Date.now()}.webm`, { type: "video/webm" });
}
