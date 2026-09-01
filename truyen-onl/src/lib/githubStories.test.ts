import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeStoryHtml } from "./githubPublicData";
import { createGithubStoryRepository, type StoriesIndex } from "./githubStories";
import { encodeGithubContent } from "./githubContents";

const config = { owner: "demo", repo: "truyen-doc", branch: "main", dataRoot: "stories" } as const;
const index: StoriesIndex = {
  version: 1,
  updatedAt: "2026-09-01T00:00:00.000Z",
  stories: [
    { slug: "published", title: "Đã xuất bản", author: "A", summary: "", status: "published", updatedAt: "2026-09-01T00:00:00.000Z", parts: [{ partNumber: 1, title: "Mở đầu", path: "stories/published/parts/001.html" }] },
    { slug: "draft", title: "Bản nháp", author: "B", summary: "", status: "draft", updatedAt: "2026-09-01T00:00:00.000Z", parts: [{ partNumber: 1, title: "Nháp", path: "stories/draft/parts/001.html" }] },
  ],
};

function fileResponse(value: string, path: string, sha = "sha") {
  return new Response(JSON.stringify({ type: "file", name: path.split("/").pop(), path, sha, encoding: "base64", content: encodeGithubContent(value) }), { status: 200 });
}

afterEach(() => vi.unstubAllGlobals());

describe("githubStories", () => {
  it("returns only published stories for the public library", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fileResponse(JSON.stringify(index), "stories/index.json")));
    const repository = createGithubStoryRepository(config);
    const stories = await repository.listPublic();
    expect(stories.map(story => story.slug)).toEqual(["published"]);
  });

  it("returns draft stories to Admin and loads their chapter files", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(fileResponse(JSON.stringify(index), "stories/index.json"))
      .mockResolvedValueOnce(fileResponse("<p>Draft <script>alert(1)</script></p>", "stories/draft/parts/001.html", "part-sha"));
    vi.stubGlobal("fetch", fetcher);
    const repository = createGithubStoryRepository(config, "token");
    const story = await repository.getStoryForAdmin("draft");
    expect(story?.status).toBe("draft");
    expect(story?.parts[0].sha).toBe("part-sha");
    expect(story?.parts[0].content).toContain("<script>");
  });

  it("removes dangerous tags and attributes before rendering", () => {
    const safe = sanitizeStoryHtml('<p onclick="alert(1)">Đọc <script>alert(1)</script><a href="javascript:alert(1)">link</a></p>');
    expect(safe).toContain("<p>Đọc ");
    expect(safe).not.toContain("script");
    expect(safe).not.toContain("onclick");
    expect(safe).not.toContain("javascript:");
  });
});
