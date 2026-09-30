import { createFileRoute } from "@tanstack/react-router";
import { AppScreen } from "@/components/lowkey/shell";
import { MediaStudio } from "@/components/lowkey/editor/media-studio";

export const Route = createFileRoute("/app/create")({
  head: () => ({
    meta: [
      { title: "create — lowkey_social" },
      {
        name: "description",
        content: "post a photo, a video or just text to your own age band on lowkey_social.",
      },
      { property: "og:title", content: "create — lowkey_social" },
      { property: "og:description", content: "photo, video or plain text — post it to your band." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  return (
    <AppScreen>
      <MediaStudio />
    </AppScreen>
  );
}
