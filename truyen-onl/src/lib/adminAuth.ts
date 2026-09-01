export type AdminVerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "network" };

export async function verifyAdminKey(
  apiKey: string,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<AdminVerifyResult> {
  try {
    const response = await fetcher("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ apiKey }),
    });
    return response.ok ? { ok: true } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
