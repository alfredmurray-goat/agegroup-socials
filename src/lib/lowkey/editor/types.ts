export type MediaAdjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  fade: number;
  rotation: number;
  flipX: boolean;
  zoom: number;
  text: string;
  textSize: number;
  textAlign: "left" | "center" | "right";
  textX: number;
  textY: number;
  speed: number;
  originalVolume: number;
  songVolume: number;
  songStart: number;
};

export const defaultAdjustments: MediaAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  fade: 0,
  rotation: 0,
  flipX: false,
  zoom: 1,
  text: "",
  textSize: 42,
  textAlign: "center",
  textX: 0.5,
  textY: 0.34,
  speed: 1,
  originalVolume: 100,
  songVolume: 60,
  songStart: 0,
};

export type StudioClip = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
  name: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
};

export type StudioSong = {
  id: string;
  title: string;
  artist: string;
  url: string;
  file?: File;
  storagePath?: string;
  catalog: boolean;
};
