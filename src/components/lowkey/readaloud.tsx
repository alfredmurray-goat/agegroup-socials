import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Ear, Pause, Play, Rabbit, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  describeElement,
  describeRegion,
  speak,
  speechSupported,
  stopSpeaking,
  type SpeechRate,
} from "@/lib/lowkey/speak";

const ENABLED_KEY = "lowkey.readAloud";
const RATE_KEY = "lowkey.readAloudRate";

export function readAloudEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export function readAloudRate(): SpeechRate {
  if (typeof window === "undefined") return "normal";
  return (localStorage.getItem(RATE_KEY) as SpeechRate | null) ?? "normal";
}

export function setReadAloud(on: boolean) {
  localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  if (!on) stopSpeaking();
  window.dispatchEvent(new Event("lowkey:readaloud"));
}

export function setReadAloudRate(rate: SpeechRate) {
  localStorage.setItem(RATE_KEY, rate);
  window.dispatchEvent(new Event("lowkey:readaloud"));
}

const rateOrder: SpeechRate[] = ["slow", "normal", "fast"];

/**
 * built-in read-aloud layer. when switched on it announces the screen you land
 * on, reads whatever you focus or tap, and offers a control bar to read the
 * whole page. everything runs in the browser.
 */
export function ReadAloud() {
  const [on, setOn] = useState(false);
  const [rate, setRate] = useState<SpeechRate>("normal");
  const [talking, setTalking] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const lastSpoken = useRef<string>("");

  // keep in sync with the settings screen / other tabs
  useEffect(() => {
    const sync = () => {
      setOn(readAloudEnabled());
      setRate(readAloudRate());
    };
    sync();
    window.addEventListener("lowkey:readaloud", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lowkey:readaloud", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const say = useCallback(
    (text: string) => {
      if (!text || text === lastSpoken.current) return;
      lastSpoken.current = text;
      speak(text, readAloudRate());
      setTalking(true);
    },
    [],
  );

  // poll speaking state so the buttons reflect reality
  useEffect(() => {
    if (!on || !speechSupported()) return;
    const id = window.setInterval(() => {
      setTalking(window.speechSynthesis.speaking && !window.speechSynthesis.paused);
    }, 400);
    return () => window.clearInterval(id);
  }, [on]);

  const readPage = useCallback(() => {
    const main = document.getElementById("main") ?? document.body;
    lastSpoken.current = "";
    say(describeRegion(main as HTMLElement));
  }, [say]);

  // announce each screen
  useEffect(() => {
    if (!on) return;
    const t = window.setTimeout(() => {
      const heading = document.querySelector("main h1, main h2")?.textContent?.trim();
      const name = path === "/" ? "home feed" : path.replace(/^\//, "").replace(/[-/]/g, " ");
      lastSpoken.current = "";
      say(`${name}${heading ? `. ${heading}` : ""}. press alt r to read the page.`);
    }, 500);
    return () => window.clearTimeout(t);
  }, [on, path, say]);

  // read focused + tapped things
  useEffect(() => {
    if (!on) return;
    const target = (e: Event): HTMLElement | null => {
      const el = e.target as HTMLElement | null;
      return el?.closest?.(
        "button, a, input, textarea, select, [role='button'], [role='switch'], article, li, p, h1, h2, h3, label",
      ) as HTMLElement | null;
    };
    const onFocus = (e: FocusEvent) => {
      const el = target(e);
      if (el) say(describeElement(el));
    };
    const onClick = (e: MouseEvent) => {
      const el = target(e);
      if (!el) return;
      if (el.closest("[data-readaloud-controls]")) return;
      const text = el.tagName.match(/^(ARTICLE|LI|P|H1|H2|H3)$/)
        ? describeRegion(el)
        : describeElement(el);
      window.setTimeout(() => say(text), 30);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        readPage();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        stopSpeaking();
        setTalking(false);
      }
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [on, say, readPage]);

  useEffect(() => () => stopSpeaking(), []);

  if (!on || !speechSupported()) return null;

  return (
    <div
      data-readaloud-controls
      role="region"
      aria-label="read aloud controls"
      className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border-2 border-foreground bg-card px-2 py-1.5 shadow-lg"
    >
      <Ear className="mx-1 size-4 text-primary" aria-hidden="true" />
      <button
        onClick={() => {
          if (talking) {
            window.speechSynthesis.pause();
            setTalking(false);
          } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setTalking(true);
          } else {
            readPage();
          }
        }}
        aria-label={talking ? "pause reading" : "read this page aloud"}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-secondary"
      >
        {talking ? <Pause className="size-5" /> : <Play className="size-5" />}
      </button>
      <button
        onClick={() => {
          stopSpeaking();
          setTalking(false);
        }}
        aria-label="stop reading"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-secondary"
      >
        <Square className="size-5" />
      </button>
      <button
        onClick={() => {
          const next = rateOrder[(rateOrder.indexOf(rate) + 1) % rateOrder.length] ?? "normal";
          setReadAloudRate(next);
          setRate(next);
        }}
        aria-label={`reading speed ${rate}, tap to change`}
        className={cn(
          "lowkey flex min-h-11 items-center justify-center gap-1 rounded-full px-2 text-xs font-bold hover:bg-secondary",
        )}
      >
        <Rabbit className="size-4" aria-hidden="true" />
        {rate}
      </button>
      <button
        onClick={() => {
          setReadAloud(false);
          setOn(false);
        }}
        aria-label="turn read aloud off"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-secondary"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
