import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/u/$handle")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/u/$handle", params, replace: true });
  },
});
