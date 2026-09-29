import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/chat/$id", params, replace: true });
  },
});
