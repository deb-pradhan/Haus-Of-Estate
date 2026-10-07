"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "@/lib/auth/client";
import {
  isValidSanityDocumentId,
  mergeSavedContentKeys,
  savedContentKey,
  shouldRetainAnonymousSave,
  type SavedContentKey,
  type SavedContentType,
} from "./local-save-merge";

export type { SavedContentType } from "./local-save-merge";

interface SavedContentContextValue {
  enabled: boolean;
  hydrated: boolean;
  revision: number;
  isSaved: (contentType: SavedContentType, sanityDocumentId: string) => boolean;
  toggleSaved: (
    contentType: SavedContentType,
    sanityDocumentId: string,
  ) => Promise<boolean>;
}

const STORAGE_KEY = "haus:saved-content:v1";
const STORAGE_EVENT = "haus:saved-content-changed";
const MAX_LOCAL_SAVES = 250;
const MAX_SYNC_RETRIES = 3;

const SavedContentContext = createContext<SavedContentContextValue>({
  enabled: false,
  hydrated: false,
  revision: 0,
  isSaved: () => false,
  toggleSaved: async () => false,
});

function keyOf(contentType: SavedContentType, sanityDocumentId: string) {
  return savedContentKey({ contentType, sanityDocumentId });
}

function isSavedContentType(value: unknown): value is SavedContentType {
  return value === "PROPERTY" || value === "ARTICLE";
}

function readLocalSaves(): SavedContentKey[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const unique = new Map<string, SavedContentKey>();
    for (const candidate of parsed.slice(0, MAX_LOCAL_SAVES)) {
      if (
        typeof candidate !== "object" ||
        candidate === null ||
        !isSavedContentType(Reflect.get(candidate, "contentType")) ||
        typeof Reflect.get(candidate, "sanityDocumentId") !== "string"
      ) {
        continue;
      }

      const contentType = Reflect.get(candidate, "contentType") as SavedContentType;
      const sanityDocumentId = (
        Reflect.get(candidate, "sanityDocumentId") as string
      ).trim();
      if (!isValidSanityDocumentId(sanityDocumentId)) continue;
      unique.set(keyOf(contentType, sanityDocumentId), {
        contentType,
        sanityDocumentId,
      });
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

function writeLocalSaves(entries: SavedContentKey[], notify = true) {
  const limited = entries.slice(-MAX_LOCAL_SAVES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  if (notify) window.dispatchEvent(new Event(STORAGE_EVENT));
}

function parseRemoteKeys(payload: unknown): SavedContentKey[] {
  if (typeof payload !== "object" || payload === null) return [];
  const items = Reflect.get(payload, "items");
  if (!Array.isArray(items)) return [];

  return items.flatMap((item): SavedContentKey[] => {
    if (typeof item !== "object" || item === null) return [];
    const contentType = Reflect.get(item, "contentType");
    const sanityDocumentId = Reflect.get(item, "sanityDocumentId");
    if (
      !isSavedContentType(contentType) ||
      typeof sanityDocumentId !== "string" ||
      !isValidSanityDocumentId(sanityDocumentId)
    ) {
      return [];
    }
    return [{ contentType, sanityDocumentId }];
  });
}

export function SavedContentProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const { data: session, status } = useAuthSession();
  const [keys, setKeys] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [revision, setRevision] = useState(0);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const syncedUserRef = useRef<string | null>(null);
  const syncRetryCountRef = useRef(0);

  const setFromEntries = useCallback((entries: SavedContentKey[]) => {
    setKeys(new Set(entries.map((entry) => keyOf(entry.contentType, entry.sanityDocumentId))));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHydrated(true);
      return;
    }
    if (status === "authenticated") {
      setHydrated(true);
      return;
    }

    const loadLocal = () => setFromEntries(readLocalSaves());
    loadLocal();
    setHydrated(true);
    window.addEventListener("storage", loadLocal);
    window.addEventListener(STORAGE_EVENT, loadLocal);
    return () => {
      window.removeEventListener("storage", loadLocal);
      window.removeEventListener(STORAGE_EVENT, loadLocal);
    };
  }, [enabled, setFromEntries, status]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!enabled || status !== "authenticated" || !userId) return;
    if (syncedUserRef.current === userId) return;

    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRetry = () => {
      if (controller.signal.aborted) return;
      const retryCount = syncRetryCountRef.current + 1;
      if (retryCount > MAX_SYNC_RETRIES) return;
      syncRetryCountRef.current = retryCount;
      retryTimer = setTimeout(
        () => setSyncAttempt((attempt) => attempt + 1),
        Math.min(1_000 * 2 ** (retryCount - 1), 4_000),
      );
    };

    void (async () => {
      const localEntries = readLocalSaves();
      const failed: SavedContentKey[] = [];

      for (const entry of localEntries) {
        try {
          const response = await fetch("/api/saved", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(entry),
            signal: controller.signal,
          });
          if (!response.ok && shouldRetainAnonymousSave(response.status)) {
            failed.push(entry);
          }
        } catch {
          if (!controller.signal.aborted && shouldRetainAnonymousSave()) failed.push(entry);
        }
      }

      if (controller.signal.aborted) return;
      writeLocalSaves(failed, false);

      try {
        const response = await fetch("/api/saved", {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) {
          if (shouldRetainAnonymousSave(response.status)) scheduleRetry();
          return;
        }
        setFromEntries(
          mergeSavedContentKeys(parseRemoteKeys(await response.json()), failed),
        );
        setRevision((value) => value + 1);
        if (failed.length > 0) {
          scheduleRetry();
        } else {
          syncedUserRef.current = userId;
          syncRetryCountRef.current = 0;
        }
      } catch {
        if (!controller.signal.aborted) scheduleRetry();
      }
    })();

    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [enabled, session?.user?.id, setFromEntries, status, syncAttempt]);

  useEffect(() => {
    if (status !== "authenticated") syncedUserRef.current = null;
    if (status !== "authenticated") syncRetryCountRef.current = 0;
  }, [status]);

  const isSaved = useCallback(
    (contentType: SavedContentType, sanityDocumentId: string) =>
      enabled && keys.has(keyOf(contentType, sanityDocumentId)),
    [enabled, keys],
  );

  const toggleSaved = useCallback(
    async (contentType: SavedContentType, sanityDocumentId: string) => {
      if (!enabled) return false;
      if (!isValidSanityDocumentId(sanityDocumentId)) {
        throw new Error("Invalid saved content identifier");
      }

      const entry = { contentType, sanityDocumentId };
      const itemKey = keyOf(contentType, sanityDocumentId);
      const wasSaved = keys.has(itemKey);
      const nextSaved = !wasSaved;

      setKeys((current) => {
        const next = new Set(current);
        if (nextSaved) next.add(itemKey);
        else next.delete(itemKey);
        return next;
      });

      if (status !== "authenticated") {
        try {
          const current = readLocalSaves().filter(
            (item) => keyOf(item.contentType, item.sanityDocumentId) !== itemKey,
          );
          if (nextSaved) current.push(entry);
          writeLocalSaves(current);
          setRevision((value) => value + 1);
          return nextSaved;
        } catch (error) {
          setKeys((current) => {
            const reverted = new Set(current);
            if (wasSaved) reverted.add(itemKey);
            else reverted.delete(itemKey);
            return reverted;
          });
          throw error;
        }
      }

      try {
        const response = await fetch("/api/saved", {
          method: nextSaved ? "PUT" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error("Saved content request failed");
        setRevision((value) => value + 1);
        return nextSaved;
      } catch (error) {
        setKeys((current) => {
          const reverted = new Set(current);
          if (wasSaved) reverted.add(itemKey);
          else reverted.delete(itemKey);
          return reverted;
        });
        throw error;
      }
    },
    [enabled, keys, status],
  );

  const value = useMemo<SavedContentContextValue>(
    () => ({ enabled, hydrated, revision, isSaved, toggleSaved }),
    [enabled, hydrated, isSaved, revision, toggleSaved],
  );

  return (
    <SavedContentContext.Provider value={value}>
      {children}
    </SavedContentContext.Provider>
  );
}

export function useSavedContent() {
  return useContext(SavedContentContext);
}
