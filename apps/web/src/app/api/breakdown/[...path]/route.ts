import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:3001";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildBackendUrl(request: NextRequest, path: string[]): string {
  const target = new URL(`${BACKEND_URL}/api/breakdown/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target.toString();
}

async function proxyRequest(
  request: NextRequest,
  method: "GET" | "POST"
): Promise<NextResponse> {
  const path = request.nextUrl.pathname
    .replace(/^\/api\/breakdown\//, "")
    .split("/")
    .filter(Boolean);

  const targetUrl = buildBackendUrl(request, path);
  const headers = new Headers();
  headers.set("Accept", "application/json");

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const csrf = request.headers.get("x-xsrf-token");
  if (csrf) {
    headers.set("X-XSRF-TOKEN", csrf);
  }

  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    ...(method === "POST" ? { body: await request.text() } : {}),
    cache: "no-store",
  });

  const text = await backendResponse.text();
  const responseHeaders: Record<string, string> = {
    "Content-Type":
      backendResponse.headers.get("content-type") || "application/json",
  };
  const setCookie = backendResponse.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders["set-cookie"] = setCookie;
  }

  return new NextResponse(text, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await proxyRequest(request, "GET");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذر الاتصال بخدمة البريك دون";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxyRequest(request, "POST");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذر الاتصال بخدمة البريك دون";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
