import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listAiOutputsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listAiOutputs } = await import("./ai-outputs.server");
    return listAiOutputs();
  });

const createAiOutputSchema = z.object({
  employeeCode: z.enum(["A", "B", "C", "D", "E", "F"]),
  taskId: z.string().min(1).max(50).nullable(),
  outputType: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().max(20000).nullable(),
  externalUrl: z.string().max(2000).nullable(),
});

export const createAiOutputFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => createAiOutputSchema.parse(data))
  .handler(async ({ data }) => {
    const { createAiOutput } = await import("./ai-outputs.server");
    return createAiOutput(data);
  });
