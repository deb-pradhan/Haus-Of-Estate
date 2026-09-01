import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validationResponse } from "@/lib/auth/api-response";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { db } from "@/lib/db";
import { isSavedContentEnabled } from "@/lib/features";
import {
  savedContentListSchema,
  savedContentMutationSchema,
} from "@/lib/saved-content/contracts";
import {
  findPublishedSavedDocument,
  findPublishedSavedDocuments,
  hydrateSavedContent,
} from "@/lib/saved-content/sanity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function unavailableResponse() {
  return json({ ok: false, error: "Not found." }, 404);
}

function unauthenticatedResponse() {
  return json({ ok: false, error: "Sign in to manage saved items." }, 401);
}

function infrastructureFailureResponse() {
  return json(
    { ok: false, error: "Saved items are temporarily unavailable." },
    503,
  );
}

function logSavedContentFailure(event: string, error: unknown): void {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "UNCLASSIFIED";
  console.error(event, { code });
}

async function authenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return typeof session?.user?.id === "string" ? session.user.id : null;
}

async function readMutation(request: Request) {
  try {
    return savedContentMutationSchema.safeParse(await request.json());
  } catch {
    return savedContentMutationSchema.safeParse(null);
  }
}

export async function GET(request: Request) {
  if (!isSavedContentEnabled()) return unavailableResponse();

  try {
    const userId = await authenticatedUserId();
    if (!userId) return unauthenticatedResponse();

    const requestUrl = new URL(request.url);
    const parsed = savedContentListSchema.safeParse(
      Object.fromEntries(requestUrl.searchParams),
    );
    if (!parsed.success) return validationResponse(parsed.error);

    const savedRecords = await db.savedContent.findMany({
      where: {
        userId,
        ...(parsed.data.contentType
          ? { contentType: parsed.data.contentType }
          : {}),
      },
      select: {
        id: true,
        contentType: true,
        sanityDocumentId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const publishedDocuments = await findPublishedSavedDocuments(
      savedRecords.map((record) => record.sanityDocumentId),
    );

    return json({
      ok: true,
      items: hydrateSavedContent(savedRecords, publishedDocuments),
    });
  } catch (error) {
    logSavedContentFailure("Saved content lookup failed", error);
    return infrastructureFailureResponse();
  }
}

export async function PUT(request: Request) {
  if (!isSavedContentEnabled()) return unavailableResponse();
  if (!isSameOriginRequest(request)) {
    return json({ ok: false, error: "This request is not allowed." }, 403);
  }

  try {
    const userId = await authenticatedUserId();
    if (!userId) return unauthenticatedResponse();

    const parsed = await readMutation(request);
    if (!parsed.success) return validationResponse(parsed.error);

    const publishedDocument = await findPublishedSavedDocument(
      parsed.data.contentType,
      parsed.data.sanityDocumentId,
    );
    if (!publishedDocument) return unavailableResponse();

    const savedRecord = await db.savedContent.upsert({
      where: {
        userId_contentType_sanityDocumentId: {
          userId,
          contentType: parsed.data.contentType,
          sanityDocumentId: parsed.data.sanityDocumentId,
        },
      },
      create: {
        userId,
        contentType: parsed.data.contentType,
        sanityDocumentId: parsed.data.sanityDocumentId,
      },
      update: {},
      select: {
        id: true,
        contentType: true,
        sanityDocumentId: true,
        createdAt: true,
      },
    });

    return json({
      ok: true,
      item: hydrateSavedContent([savedRecord], [publishedDocument])[0],
    });
  } catch (error) {
    logSavedContentFailure("Saved content write failed", error);
    return infrastructureFailureResponse();
  }
}

export async function DELETE(request: Request) {
  if (!isSavedContentEnabled()) return unavailableResponse();
  if (!isSameOriginRequest(request)) {
    return json({ ok: false, error: "This request is not allowed." }, 403);
  }

  try {
    const userId = await authenticatedUserId();
    if (!userId) return unauthenticatedResponse();

    const parsed = await readMutation(request);
    if (!parsed.success) return validationResponse(parsed.error);

    await db.savedContent.deleteMany({
      where: {
        userId,
        contentType: parsed.data.contentType,
        sanityDocumentId: parsed.data.sanityDocumentId,
      },
    });
    return json({ ok: true });
  } catch (error) {
    logSavedContentFailure("Saved content delete failed", error);
    return infrastructureFailureResponse();
  }
}
