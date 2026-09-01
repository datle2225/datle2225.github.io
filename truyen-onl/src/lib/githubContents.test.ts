import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGithubContentsClient,
  decodeGithubContent,
  encodeGithubContent,
  GithubApiError,
} from "./githubContents";

const config = { owner: "demo", repo: "truyen-doc", branch: "main", dataRoot: "stories" } as const;

afterEach(() => vi.unstubAllGlobals());

describe("githubContents", () => {
  it("round trips Vietnamese and emoji content through Base64", () => {
    const text = "Một phần truyện — đọc chậm, nhớ lâu 📚";
    expect(decodeGithubContent(encodeGithubContent(text))).toBe(text);
  });

  it("reads a JSON file with the GitHub JSON headers", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ type: "file", name: "index.json", path: "stories/index.json", sha: "abc", encoding: "base64", content: encodeGithubContent('{"stories":[]}') }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    const client = createGithubContentsClient(config, "github-token");
    const result = await client.getJsonFile<{ stories: unknown[] }>("stories/index.json");

    expect(result.value).toEqual({ stories: [] });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.github.com/repos/demo/truyen-doc/contents/stories/index.json",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    const requestHeaders = (fetcher.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(requestHeaders.get("Authorization")).toBe("Bearer github-token");
    expect(requestHeaders.get("X-GitHub-Api-Version")).toBe("2022-11-28");
  });

  it("sends Base64 and the current SHA when updating a file", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: { sha: "new-sha" }, commit: { sha: "commit-sha" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const client = createGithubContentsClient(config, "token");

    await client.putFile("stories/index.json", '{"stories":[]}', "Update story index", "old-sha");

    const body = JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sha).toBe("old-sha");
    expect(decodeGithubContent(body.content)).toBe('{"stories":[]}');
    expect(body.branch).toBe("main");
  });

  it("surfaces conflicts and rate limits as typed errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "sha does not match" }), { status: 409, headers: { "x-ratelimit-remaining": "12" } }));
    vi.stubGlobal("fetch", fetcher);
    const client = createGithubContentsClient(config, "token");

    await expect(client.putFile("stories/index.json", "{}", "Update", "old-sha")).rejects.toMatchObject<GithubApiError>({ status: 409 });
    await expect(client.putFile("stories/index.json", "{}", "Update", "old-sha")).rejects.toThrow("Nội dung đã thay đổi");
  });

  it("explains when GitHub API rate limit is exhausted", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "API rate limit exceeded" }), { status: 403, headers: { "x-ratelimit-remaining": "0" } }));
    vi.stubGlobal("fetch", fetcher);
    const client = createGithubContentsClient(config, "token");

    await expect(client.getFile("stories/index.json")).rejects.toThrow("hết rate limit");
  });
});
