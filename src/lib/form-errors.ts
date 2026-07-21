import { ApiClientError } from "@/lib/api-client";

/**
 * Maps a failed API response's Zod issues onto form field names.
 *
 * The server validates with the same schemas the client resolves against, so a
 * rejection that reaches here is either a uniqueness conflict (duplicate STF-ID
 * or email) or a client/server schema drift — both worth showing on the field
 * rather than in a generic banner. First issue per field wins.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.details)) return {};

  const result: Record<string, string> = {};
  for (const issue of error.details as Array<{ path?: string; message?: string }>) {
    if (issue.path && issue.message && !result[issue.path]) {
      result[issue.path] = issue.message;
    }
  }
  return result;
}
