import { describe, expect, it, vi } from "vitest";
import { verifyAdminKey } from "./adminAuth";

describe("verifyAdminKey", () => {
  it("returns invalid for a non-2xx API response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(verifyAdminKey("wrong", fetcher)).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/verify", expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("returns network when the API request fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(verifyAdminKey("key", fetcher)).resolves.toEqual({ ok: false, reason: "network" });
  });

  it("returns ok for a successful response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(verifyAdminKey("key", fetcher)).resolves.toEqual({ ok: true });
  });
});
