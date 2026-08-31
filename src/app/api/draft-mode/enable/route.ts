import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity";

const token = process.env.SANITY_API_READ_TOKEN;
const browserToken = process.env.SANITY_API_BROWSER_TOKEN;
const handler = token && browserToken
  ? defineEnableDraftMode({ client: client.withConfig({ token }) })
  : null;

export async function GET(request: Request) {
  if (!handler) {
    return new Response("Draft preview is not configured", { status: 503 });
  }

  return handler.GET(request);
}
