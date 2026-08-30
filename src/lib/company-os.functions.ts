import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";
import { OS_CATEGORIES } from "./company-data";

export const listCompanyOsEntriesFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listCompanyOsEntries } = await import("./company-os.server");
    return listCompanyOsEntries();
  });

const updateCompanyOsEntrySchema = z.object({
  category: z.enum(OS_CATEGORIES),
  key: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(2000),
  status: z.enum(["ACTIVE", "DRAFT", "REVIEW"]),
});

export const updateCompanyOsEntryFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => updateCompanyOsEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const { updateCompanyOsEntry } = await import("./company-os.server");
    return updateCompanyOsEntry(data);
  });
