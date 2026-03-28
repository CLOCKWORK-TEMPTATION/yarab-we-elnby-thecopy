"use client";

export const ART_DIRECTOR_API_BASE = "/api/art-director";

export function artDirectorApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${ART_DIRECTOR_API_BASE}${normalizedPath}`;
}

export async function fetchArtDirectorJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(artDirectorApiPath(path), init);
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data !== null && "error" in data && data.error
        ? String(data.error)
        : `فشل الطلب مع الحالة ${response.status}`
    );
  }

  return data;
}
