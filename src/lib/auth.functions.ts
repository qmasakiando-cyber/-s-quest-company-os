import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * 全サーバー関数に付与するmiddleware。REQUIRE_CEO_LOGIN=true の間だけ
 * 実際にログインを要求する（falseの間は何もしない）。
 */
export const requireCeoAuthMiddleware = createMiddleware().server(
  async ({ next }) => {
    const { requireCeoAuth } = await import("./auth.server");
    await requireCeoAuth();
    return next();
  },
);

export const getCurrentCeoFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCeoUser } = await import("./auth.server");
    return getCeoUser();
  },
);

export const loginStatusFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { isCeoLoginRequired, getCeoUser } = await import("./auth.server");
    const required = isCeoLoginRequired();
    if (!required) return { required, authenticated: true };
    const user = await getCeoUser();
    return { required, authenticated: !!user };
  },
);

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signInSchema.parse(data))
  .handler(async ({ data }) => {
    const { signInWithPassword } = await import("./auth.server");
    await signInWithPassword(data.email, data.password);
    return { ok: true };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const { signOut } = await import("./auth.server");
    await signOut();
    return { ok: true };
  },
);
