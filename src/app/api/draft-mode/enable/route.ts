import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity";

const token = process.env.SANITY_API_READ_TOKEN;
// Authenticated server rendering does not require exposing a token to the
// browser. A separate Viewer token is optional for live updates outside Studio.
const handler = token
  ? defineEnableDraftMode({ client: client.withConfig({ token }) })
  : null;

export async function GET(request: Request) {
  if (!handler) {
    return new Response("Draft preview is not configured", { status: 503 });
  }

  return handler.GET(request);
}
