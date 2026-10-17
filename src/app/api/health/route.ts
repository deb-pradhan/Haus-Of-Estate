// Liveness/readiness probe for Railway and uptime monitors.
//
//   GET /api/health          -> 200 {"status":"ok","time":"…"}   (no dependencies touched)
//   GET /api/health?deep=1   -> also runs `SELECT 1` with a 2 s timeout; 503 if it fails
//
// Never returns connection strings, hostnames, versions or error messages.
// The shallow check is what `railway.json` uses, so a database blip does not
// take the web tier out of rotation.
//
// Imports are dynamic and only on the deep path so the shallow probe has no
// dependency on Prisma, and the module stays loadable in plain-Node unit tests.

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const DB_TIMEOUT_MS = 2000;

type CheckState = "ok" | "error" | "timeout" | "skipped";

async function checkDatabase(): Promise<CheckState> {
  if (!process.env.DATABASE_URL) return "skipped";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const { db } = await import("@/lib/db");
    const query = db.$queryRaw`SELECT 1`.then((): CheckState => "ok");
    const timeout = new Promise<CheckState>((resolve) => {
      timer = setTimeout(() => resolve("timeout"), DB_TIMEOUT_MS);
    });
    return await Promise.race([query, timeout]);
  } catch {
    return "error";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const time = new Date().toISOString();
  const deep = new URL(request.url).searchParams.get("deep") === "1";

  if (!deep) {
    return Response.json({ status: "ok", time }, { headers: NO_STORE });
  }

  // The deep probe touches the database, so keep it cheap to abuse.
  const { createRateLimiter, enforceRateLimit } = await import("@/lib/rate-limit");
  const limited = await enforceRateLimit(
    request,
    createRateLimiter({ id: "health-deep", limit: 20, windowMs: 60_000 }),
  );
  if (limited) return limited;

  const database = await checkDatabase();
  const healthy = database === "ok" || database === "skipped";
  return Response.json(
    { status: healthy ? "ok" : "degraded", time, checks: { database } },
    { status: healthy ? 200 : 503, headers: NO_STORE },
  );
}
