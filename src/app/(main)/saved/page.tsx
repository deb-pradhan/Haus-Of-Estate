import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SavedContentView } from "./saved-content-view";
import { isSavedContentEnabled } from "@/lib/features";

export const metadata: Metadata = {
  title: "Saved items",
  description: "Return to properties and Haus of Estate articles you saved.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SavedPage() {
  if (!isSavedContentEnabled()) notFound();
  return <SavedContentView />;
}
