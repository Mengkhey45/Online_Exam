import { api } from "@/lib/api/client";
import { registrationResultSchema } from "./schema";

export function provisionOrganization(
  input: { organizationName: string; adminName: string },
  accessToken: string,
) {
  return api.post(
    "/public/organizations/register",
    input,
    registrationResultSchema,
    accessToken,
  );
}
