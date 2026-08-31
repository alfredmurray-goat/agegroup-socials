/**
 * on-device age estimation.
 *
 * runs a free, open-source face model (face-api.js) fully inside the browser:
 * no photo, no video frame and no estimate ever leaves the device, and no api
 * key or paid provider is involved. the user cannot just claim an age — the
 * model has to see a face and agree.
 *
 * thresholds are deliberately wide so borderline faces are refused instead of
 * guessed: everything between them is inconclusive and falls back to an eid.
 */
const MODEL_URL = "https://cdn.jsdelivr.net/gh/vladmandic/face-api@1.7.15/model";

export const UNDER_18_MAX = 16;
export const ADULT_MIN = 22;

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
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      return faceapi;
    })();
  }
  return apiPromise;
}

/** warm the model up so the scan itself feels instant */
export async function preloadAgeModel(): Promise<void> {
  await getApi();
}

/** takes a handful of samples from a live video element and averages them */
export async function estimateAgeFromVideo(
  video: HTMLVideoElement,
  samples = 5,
): Promise<ScanOutcome> {
  const faceapi = await getApi();
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
  const ages: number[] = [];
  const scores: number[] = [];

  for (let i = 0; i < samples; i += 1) {
    const result = await faceapi.detectSingleFace(video, options).withAgeAndGender();
    if (result) {
      ages.push(result.age);
      scores.push(result.detection.score);
    }
    await new Promise((r) => window.setTimeout(r, 160));
  }

  if (ages.length < Math.ceil(samples / 2)) return { kind: "no_face" };

  const age = ages.reduce((a, b) => a + b, 0) / ages.length;
  const confidence = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (age <= UNDER_18_MAX) return { kind: "under_18", age, confidence };
  if (age >= ADULT_MIN) return { kind: "adult", age, confidence };
  return { kind: "inconclusive", age, confidence };
}
