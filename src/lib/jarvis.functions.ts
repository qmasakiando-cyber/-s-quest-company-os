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
    const reply = await callJarvis(data.messages, data.mode);
    return { reply };
  });
