/**
 * on-device age estimation.
 *
 * runs a free, open-source face model (face-api.js) fully inside the browser:
 * no photo, no video frame and no estimate ever leaves the device, and no api
 * key or paid provider is involved. the user cannot just claim an age — the
 * model has to see a face and agree.
 *
 * works with any camera: phone front camera, laptop webcam or usb webcam.
 * there is no face-id / secure-enclave requirement.
 */
/** models are shipped with the app; the cdn is only a fallback */
const MODEL_URLS = [
  "/models",
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model",
];

export const UNDER_18_MAX = 17;
export const ADULT_MIN = 21;

export type ScanOutcome =
  | { kind: "under_18"; age: number; confidence: number }
  | { kind: "adult"; age: number; confidence: number }
  | { kind: "inconclusive"; age: number; confidence: number }
  | { kind: "no_face" };

type FaceApi = typeof import("@vladmandic/face-api");

let apiPromise: Promise<FaceApi> | null = null;

async function getApi(): Promise<FaceApi> {
  if (!apiPromise) {
    apiPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");

      // some devices/browsers block webgl (older phones, hardened privacy
      // settings). without a working backend the scan dies with a confusing
      // "backend undefined" error, so fall back to plain cpu maths.
      const tf = faceapi.tf as unknown as {
        ready: () => Promise<void>;
        getBackend: () => string | undefined;
        setBackend: (name: string) => Promise<boolean>;
      };
      for (const backend of ["webgl", "cpu"]) {
        try {
          const ok = await tf.setBackend(backend);
          if (!ok) continue;
          await tf.ready();
          if (tf.getBackend() === backend) break;
        } catch {
          /* try the next backend */
        }
      }

      let lastError: unknown = null;
      for (const url of MODEL_URLS) {
        try {
          await faceapi.nets.tinyFaceDetector.loadFromUri(url);
          await faceapi.nets.ageGenderNet.loadFromUri(url);
          return faceapi;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError ?? new Error("could not load the age model");
    })();
    // a failed load must not be cached, otherwise "try again" never works
    apiPromise.catch(() => {
      apiPromise = null;
    });
  }
  return apiPromise;
}

/** warm the model up so the scan itself feels instant */
export async function preloadAgeModel(): Promise<void> {
  await getApi();
}

export interface CameraOption {
  deviceId: string;
  label: string;
}

/** every camera the browser will let us open (laptops often have several) */
export async function listCameras(): Promise<CameraOption[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "videoinput")
    .map((d, i) => ({ deviceId: d.deviceId, label: (d.label || `camera ${i + 1}`).toLowerCase() }));
}

/** opens a camera stream that works on phones and desktops alike */
export async function openCamera(deviceId?: string): Promise<MediaStream> {
  const video: MediaTrackConstraints = deviceId
    ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 640 } }
    : { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 640 } };
  return navigator.mediaDevices.getUserMedia({ video, audio: false });
}

/**
 * takes a batch of samples from a live video element and combines them.
 *
 * accuracy tricks: more samples, only decent-quality detections count, the
 * best-scoring half of the samples decide the age, and a trimmed median is
 * used instead of a mean so one bad frame can't move the band.
 */
export async function estimateAgeFromVideo(
  video: HTMLVideoElement,
  samples = 12,
): Promise<ScanOutcome> {
  const faceapi = await getApi();
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
  const picks: { age: number; score: number }[] = [];

  for (let i = 0; i < samples; i += 1) {
    const result = await faceapi.detectSingleFace(video, options).withAgeAndGender();
    // ignore tiny/far-away faces: they are the main source of wild guesses
    if (result && result.detection.box.width >= video.videoWidth * 0.15) {
      picks.push({ age: result.age, score: result.detection.score });
    }
    await new Promise((r) => window.setTimeout(r, 110));
  }

  if (picks.length < Math.ceil(samples / 3)) return { kind: "no_face" };

  // keep the best-scoring half of the samples
  const best = [...picks].sort((a, b) => b.score - a.score).slice(0, Math.max(3, Math.ceil(picks.length / 2)));
  const ages = best.map((p) => p.age).sort((a, b) => a - b);
  const confidence = best.reduce((s, p) => s + p.score, 0) / best.length;

  // trimmed median: drop the extremes when we have enough samples
  const trimmed = ages.length >= 5 ? ages.slice(1, -1) : ages;
  const median = trimmed[Math.floor(trimmed.length / 2)]!;
  const spread = (ages[ages.length - 1]! - ages[0]!) / 2;

  // unstable estimates or a weak detection are never good enough to decide
  if (confidence < 0.55 || spread > 7) {
    return { kind: "inconclusive", age: Math.round(median), confidence };
  }

  const age = Math.round(median);
  if (age <= UNDER_18_MAX) return { kind: "under_18", age, confidence };
  if (age >= ADULT_MIN) return { kind: "adult", age, confidence };
  return { kind: "inconclusive", age, confidence };
}
