import JSZip from "jszip";

export interface ImportedItem {
  caption: string;
  createdAt: string;
  kind: "post" | "video";
  file: File | null;
}

const VIDEO_EXT = ["mp4", "mov", "m4v", "webm"];

const isPostsJson = (name: string) =>
  /(^|\/)(posts_\d+|posts|content\/posts_\d+|profile_photos|reels|stories)\.json$/i.test(name) ||
  /your_instagram_activity\/(media|content)\/.*\.json$/i.test(name);

function fixMojibake(value: string) {
  // instagram exports write utf-8 bytes as latin-1 escapes
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

interface RawMedia {
  uri?: string;
  title?: string;
  creation_timestamp?: number;
}
interface RawEntry {
  title?: string;
  creation_timestamp?: number;
  media?: RawMedia[];
}

function collectEntries(parsed: unknown): RawEntry[] {
  if (Array.isArray(parsed)) return parsed as RawEntry[];
  if (parsed && typeof parsed === "object") {
    const values = Object.values(parsed as Record<string, unknown>);
    const arrays = values.filter(Array.isArray) as RawEntry[][];
    return arrays.flat();
  }
  return [];
}

function kindFor(uri: string): "post" | "video" {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT.includes(ext) ? "video" : "post";
}

function mime(uri: string) {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXT.includes(ext)) return ext === "mov" ? "video/quicktime" : `video/${ext}`;
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

/** reads a real instagram data export (zip, or a single posts json) into importable items */
export async function parseInstagramExport(file: File): Promise<ImportedItem[]> {
  const isZip = file.name.toLowerCase().endsWith(".zip") || file.type.includes("zip");
  if (!isZip) {
    const text = await file.text();
    return fromJson(JSON.parse(text) as unknown, null);
  }

  const zip = await JSZip.loadAsync(file);
  const jsonNames = Object.keys(zip.files).filter(
    (n) => n.toLowerCase().endsWith(".json") && isPostsJson(n) && !zip.files[n]!.dir,
  );

  const items: ImportedItem[] = [];
  for (const name of jsonNames) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await zip.files[name]!.async("string"));
    } catch {
      continue;
    }
    items.push(...(await fromJson(parsed, zip)));
  }
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function fromJson(parsed: unknown, zip: JSZip | null): Promise<ImportedItem[]> {
  const out: ImportedItem[] = [];
  for (const entry of collectEntries(parsed)) {
    const medias = entry.media ?? [];
    const caption = fixMojibake(entry.title ?? medias[0]?.title ?? "").trim();
    const ts = entry.creation_timestamp ?? medias[0]?.creation_timestamp;
    const createdAt = new Date((ts ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();

    if (medias.length === 0) {
      if (caption) out.push({ caption, createdAt, kind: "post", file: null });
      continue;
    }

    for (const m of medias) {
      const uri = m.uri;
      if (!uri) continue;
      let mediaFile: File | null = null;
      if (zip) {
        const zipEntry =
          zip.file(uri) ?? zip.file(new RegExp(`${uri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))[0];
        if (!zipEntry) continue;
        const blob = await zipEntry.async("blob");
        mediaFile = new File([blob], uri.split("/").pop() ?? "media", { type: mime(uri) });
      }
      out.push({
        caption: caption || fixMojibake(m.title ?? "").trim(),
        createdAt: m.creation_timestamp
          ? new Date(m.creation_timestamp * 1000).toISOString()
          : createdAt,
        kind: kindFor(uri),
        file: mediaFile,
      });
      // one post per media item keeps captions attached to the right image
    }
  }
  return out;
}
