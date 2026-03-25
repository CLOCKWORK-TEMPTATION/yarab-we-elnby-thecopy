import { z } from "zod";

// ─── Common API Schemas ─────────────────────────────────────────────────────
// Single source of truth for API contracts between frontend and backend.
// App-specific schemas (e.g. scene, shot, character details) stay in their
// respective packages. Only cross-cutting contracts live here.

/**
 * UUID validation — matches the backend's uuidSchema pattern
 */
export const IdSchema = z.string().uuid({
  message: "معرّف UUID غير صالح",
});

/**
 * Pagination parameters — mirrors backend paginationSchema
 * Uses coerce so query-string values ("1") are accepted as numbers.
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Sort order — mirrors backend sortOrderSchema
 */
export const SortOrderSchema = z
  .enum(["asc", "desc", "ASC", "DESC"])
  .default("desc");

/**
 * Generic API response wrapper.
 * Accepts a Zod schema for the `data` field so each endpoint can type it.
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

/**
 * Timestamp pair — common on every persisted entity
 */
export const TimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type Id = z.infer<typeof IdSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
export type Timestamps = z.infer<typeof TimestampsSchema>;
