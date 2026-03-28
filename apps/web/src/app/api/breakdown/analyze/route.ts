import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:3001";

function buildHeaders(request: NextRequest): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

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

  return headers;
}

async function requireSuccess<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as {
    success?: boolean;
    data?: T;
    error?: string;
  };

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error || "فشل طلب البريك دون");
  }

  return payload.data;
}

export async function POST(request: NextRequest) {
  try {
    const { script, title } = await request.json();

    if (!script || !String(script).trim()) {
      return NextResponse.json(
        { success: false, error: "Script content is required" },
        { status: 400 }
      );
    }

    const headers = buildHeaders(request);
    const bootstrapResponse = await fetch(
      `${BACKEND_URL}/api/breakdown/projects/bootstrap`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          scriptContent: String(script),
          title,
        }),
      }
    );

    const bootstrap = await requireSuccess<{ projectId: string }>(bootstrapResponse);
    const analyzeResponse = await fetch(
      `${BACKEND_URL}/api/breakdown/projects/${bootstrap.projectId}/analyze`,
      {
        method: "POST",
        headers,
      }
    );

    const report = await requireSuccess<unknown>(analyzeResponse);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "breakdown-analyze-compatibility",
      backend: BACKEND_URL,
    },
  });
}
