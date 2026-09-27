import { checkDatabaseConnection } from "@/lib/database";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export async function GET(): Promise<Response> {
  try {
    await checkDatabaseConnection();

    return Response.json(
      { status: "ok" },
      { status: 200, headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}
