import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  mode: z.enum(["instruction", "consultation"]).default("instruction"),
});

export const askJarvis = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { callJarvis } = await import("./jarvis.server");
    const { text, proposedTask, proposedKpiTargetUpdate } = await callJarvis(
      data.messages,
      data.mode,
    );
    return { reply: text, proposedTask, proposedKpiTargetUpdate };
  });

const confirmTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  assignee: z.enum(["A", "B", "C", "D", "E", "F"]),
  priority: z.enum(["P0", "P1", "P2"]).optional(),
});

/**
 * JARVISがcreate_taskで提案した内容を、CEOが実行ボタンで確定した時にだけ呼ばれる。
 * モデルの提案をそのまま信用せず、ここでも改めてzodバリデーションする。
 */
export const confirmJarvisTaskFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => confirmTaskSchema.parse(data))
  .handler(async ({ data }) => {
    const { createTask } = await import("./tasks.server");
    return createTask({ ...data, source: "jarvis" });
  });

const confirmKpiTargetUpdateSchema = z.object({
  code: z.enum(["monthly_revenue", "mrr", "profit"]),
  targetValue: z.number().positive(),
});

/**
 * JARVISがupdate_kpi_targetで提案した内容を、CEOが実行ボタンで確定した時にだけ呼ばれる。
 * モデルの提案をそのまま信用せず、ここでも改めてzodバリデーションする
 * （対象コードはBUSINESSカテゴリの3件のみに限定 — confirmJarvisTaskFnと同じ考え方）。
 */
export const confirmJarvisKpiTargetUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => confirmKpiTargetUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const { updateKpiTarget } = await import("./kpi.server");
    await updateKpiTarget(data);
    return { ok: true };
  });
