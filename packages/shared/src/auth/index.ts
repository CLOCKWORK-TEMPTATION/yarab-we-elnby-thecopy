import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────
// Shared auth contracts between frontend and backend.
// Derived from the actual backend auth controller & auth service patterns.

/**
 * Login request — mirrors backend loginSchema in auth.controller.ts
 */
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

/**
 * Signup request — mirrors backend signupSchema in auth.controller.ts
 */
export const SignupRequestSchema = z.object({
  email: z
    .string()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .min(5, { message: "البريد الإلكتروني قصير جداً" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" })
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(12, { message: "كلمة المرور يجب أن تكون 12 حرفاً على الأقل" })
    .max(128, { message: "كلمة المرور طويلة جداً" })
    .regex(/[A-Z]/, {
      message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل",
    })
    .regex(/[a-z]/, {
      message: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل",
    })
    .regex(/[0-9]/, {
      message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل",
    }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

/**
 * Authenticated user — the shape returned by the backend after stripping passwordHash.
 * Fields match the users table in the backend DB schema.
 */
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
});

/**
 * Token pair returned on login/signup — mirrors AuthTokens in auth.service.ts
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

/**
 * Client-side auth session — used by the frontend to track logged-in state.
 */
export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  isAuthenticated: boolean;
}
