import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";

/**
 * What this deployment can do — currently just whether AI features are usable
 * (the backend has an ANTHROPIC_API_KEY). The UI reads this to show/hide AI-only
 * affordances and degrade gracefully instead of crashing (AGENTS §8).
 */
const capabilitiesSchema = z.object({ ai: z.boolean() });

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: async () => {
      if (USE_MOCKS) return { ai: false };
      return api.get("/capabilities", capabilitiesSchema);
    },
    // Capabilities don't change during a session.
    staleTime: Infinity,
  });
}
