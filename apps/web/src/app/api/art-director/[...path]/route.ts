import { NextRequest, NextResponse } from "next/server";

import { handleArtDirectorRequest } from "../../../(main)/art-director/server/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

async function respond(
  request: NextRequest,
  method: "GET" | "POST",
  path: string[]
): Promise<NextResponse> {
  try {
    const body = method === "POST" ? await parseBody(request) : undefined;
    const result = await handleArtDirectorRequest({
      method,
      path,
      body,
      searchParams: request.nextUrl.searchParams,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء معالجة طلب art-director",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return respond(request, "GET", path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return respond(request, "POST", path);
}
