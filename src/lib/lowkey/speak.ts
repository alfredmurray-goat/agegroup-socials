/**
 * built-in read-aloud engine (a lightweight screen reader).
 *
 * uses the browser's speechSynthesis api — free, offline on most devices, and
 * nothing is sent anywhere: no audio, no text, no network calls.
 */

export type SpeechRate = "slow" | "normal" | "fast";

export const rateValue: Record<SpeechRate, number> = {
  slow: 0.75,
  normal: 1,
  fast: 1.4,
};

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let currentVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  if (currentVoice) return currentVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const lang = (navigator.language || "en").toLowerCase();
  const base = lang.split("-")[0];
  currentVoice =
    voices.find((v) => v.lang.toLowerCase() === lang) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base ?? "en")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    voices[0] ??
    null;
  return currentVoice;
}

if (speechSupported()) {
  // voices load async in chrome/safari
  window.speechSynthesis.onvoiceschanged = () => {
    currentVoice = null;
    pickVoice();
  };
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}

/** speak some text. cuts off whatever was being said before. */
export function speak(text: string, rate: SpeechRate = "normal") {
  if (!speechSupported()) return;
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const voice = pickVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = rateValue[rate];
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

const roleWords: Record<string, string> = {
  button: "button",
  link: "link",
  textbox: "text field",
  checkbox: "checkbox",
  switch: "switch",
  tab: "tab",
  slider: "slider",
};

function roleOf(el: HTMLElement): string | null {
  const explicit = el.getAttribute("role");
  if (explicit && roleWords[explicit]) return roleWords[explicit];
  const tag = el.tagName.toLowerCase();
  if (tag === "button") return "button";
  if (tag === "a") return "link";
  if (tag === "textarea") return "text field";
  if (tag === "select") return "menu";
  if (tag === "input") {
    const t = (el as HTMLInputElement).type;
    if (t === "checkbox") return "checkbox";
    if (t === "range") return "slider";
    if (t === "file") return "file picker";
    return "text field";
  }
  return null;
}

/** what a screen reader would announce for an element. */
export function describeElement(el: HTMLElement): string {
  const parts: string[] = [];
  const labelledBy = el.getAttribute("aria-labelledby");
  const label =
    el.getAttribute("aria-label") ??
    (labelledBy ? (document.getElementById(labelledBy)?.textContent ?? "") : "");
  const own = (el.innerText || el.textContent || "").trim();
  const alt = el.querySelector("img[alt]")?.getAttribute("alt") ?? "";
  const placeholder = (el as HTMLInputElement).placeholder ?? "";
  const value = (el as HTMLInputElement).value ?? "";

  parts.push(label || own || alt || placeholder || value);

  const role = roleOf(el);
  if (role) parts.push(role);

  if (el.getAttribute("aria-pressed") === "true") parts.push("pressed");
  if (el.getAttribute("aria-checked") === "true") parts.push("on");
  if (el.getAttribute("aria-checked") === "false") parts.push("off");
  if (el.getAttribute("aria-expanded") === "true") parts.push("expanded");
  if ((el as HTMLButtonElement).disabled) parts.push("unavailable");

  return parts.filter(Boolean).join(", ");
}

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"]);

/** flatten the readable content of a container into a spoken script. */
export function describeRegion(root: HTMLElement): string {
  const chunks: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.replace(/\s+/g, " ").trim();
      if (t) chunks.push(t);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (SKIP.has(node.tagName)) return;
    if (node.getAttribute("aria-hidden") === "true") return;
    if (node.classList.contains("sr-only")) return;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (node.tagName === "IMG") {
      const alt = node.getAttribute("alt")?.trim();
      if (alt) chunks.push(`image, ${alt}`);
      return;
    }
    if (node.tagName === "VIDEO") {
      chunks.push("video");
      return;
    }
    const aria = node.getAttribute("aria-label");
    if (aria && !node.childElementCount && !node.textContent?.trim()) {
      chunks.push(aria);
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(root);

  // de-duplicate neighbours (nested elements repeat their text)
  const out: string[] = [];
  for (const c of chunks) if (out[out.length - 1] !== c) out.push(c);
  return out.join(". ");
}
