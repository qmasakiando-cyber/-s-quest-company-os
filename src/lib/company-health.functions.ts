import { createServerFn } from "@tanstack/react-start";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const getCompanyHealthFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { computeCompanyHealth } = await import("./company-health.server");
    return computeCompanyHealth();
  });

export const getHealthRecommendationFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { computeCompanyHealth, getHealthRecommendation } =
      await import("./company-health.server");
    const health = await computeCompanyHealth();
    return getHealthRecommendation(health);
  });
