import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyGithubAdminAccess } from "./githubAdmin";

const config = { owner: "demo", repo: "truyen-doc", branch: "main", dataRoot: "stories" } as const;

afterEach(() => vi.unstubAllGlobals());

describe("githubAdmin", () => {
  it("rejects a valid token that cannot push to the repository", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ full_name: "demo/truyen-doc", permissions: { push: false } }), { status: 200 })));
    await expect(verifyGithubAdminAccess(config, "read-only-token")).rejects.toThrow("Token chưa có quyền ghi repository");
  });

  it("keeps GitHub 403 permission errors visible to the Admin UI", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Resource not accessible by personal access token" }), { status: 403, headers: { "x-ratelimit-remaining": "20" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Resource not accessible by personal access token" }), { status: 403, headers: { "x-ratelimit-remaining": "20" } })));
    await expect(verifyGithubAdminAccess(config, "limited-token")).rejects.toMatchObject({ status: 403 });
    await expect(verifyGithubAdminAccess(config, "limited-token")).rejects.toThrow("Resource not accessible");
  });
});
