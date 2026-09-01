import { z } from "zod";
import { GithubApiError, type GithubConfig, createGithubContentsClient } from "./githubContents";

export const storyPartSchema = z.object({
  partNumber: z.number().int().positive(),
  title: z.string().min(1),
  path: z.string().min(1),
  sha: z.string().optional(),
});

export const storySummarySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  author: z.string().optional(),
  summary: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["draft", "published"]),
  updatedAt: z.string(),
  parts: z.array(storyPartSchema).min(1),
});

export const storiesIndexSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  stories: z.array(storySummarySchema),
});

export type StoryPart = z.infer<typeof storyPartSchema>;
export type StorySummary = z.infer<typeof storySummarySchema>;
export type StoriesIndex = z.infer<typeof storiesIndexSchema>;
export type StoryDraft = Omit<StorySummary, "updatedAt" | "parts"> & {
  parts: Array<{ partNumber: number; title: string; content: string }>;
};

export const emptyStoriesIndex = (): StoriesIndex => ({ version: 1, updatedAt: new Date(0).toISOString(), stories: [] });

function indexPath(config: GithubConfig) {
  return `${config.dataRoot}/index.json`;
}

function partPath(config: GithubConfig, slug: string, partNumber: number) {
  return `${config.dataRoot}/${slug}/parts/${String(partNumber).padStart(3, "0")}.html`;
}

export function createGithubStoryRepository(config: GithubConfig, token = "") {
  const client = createGithubContentsClient(config, token);

  async function readIndex() {
    try {
      const file = await client.getJsonFile<unknown>(indexPath(config));
      return { index: storiesIndexSchema.parse(file.value), sha: file.sha };
    } catch (error) {
      if (error instanceof GithubApiError && error.status === 404) return { index: emptyStoriesIndex(), sha: undefined };
      throw error;
    }
  }

  async function listPublic() {
    const { index } = await readIndex();
    return index.stories.filter(story => story.status === "published");
  }

  async function listAll() {
    const { index } = await readIndex();
    return index.stories;
  }

  async function getSummary(slug: string, includeDrafts = false) {
    const { index } = await readIndex();
    const story = index.stories.find(item => item.slug === slug);
    if (!story || (!includeDrafts && story.status !== "published")) return null;
    return story;
  }

  async function getPartContent(story: StorySummary, partNumber: number) {
    const part = story.parts.find(item => item.partNumber === partNumber);
    if (!part) return null;
    const file = await client.getTextFile(part.path);
    return { ...part, content: file.text, sha: file.sha };
  }

  async function getStoryForAdmin(slug: string) {
    const story = await getSummary(slug, true);
    if (!story) return null;
    const parts = [];
    for (const part of story.parts) {
      const file = await client.getTextFile(part.path);
      parts.push({ ...part, content: file.text, sha: file.sha });
    }
    return { ...story, parts };
  }

  async function saveStory(draft: StoryDraft, message = `Update story: ${draft.slug}`) {
    const current = await readIndex();
    const existing = current.index.stories.find(item => item.slug === draft.slug);
    const now = new Date().toISOString();
    const nextParts: StoryPart[] = [];

    for (const part of [...draft.parts].sort((a, b) => a.partNumber - b.partNumber)) {
      const path = partPath(config, draft.slug, part.partNumber);
      let sha: string | undefined;
      try { sha = (await client.getFile(path)).sha; } catch (error) { if (!(error instanceof GithubApiError && error.status === 404)) throw error; }
      const result = await client.putFileAtPath(path, part.content, `${message} · part ${part.partNumber}`, sha);
      nextParts.push({ partNumber: part.partNumber, title: part.title, path, sha: result.content.sha });
    }

    if (existing) {
      for (const stalePart of existing.parts) {
        if (!nextParts.some(part => part.path === stalePart.path)) {
          try {
            const file = await client.getFile(stalePart.path);
            await client.deleteFile(stalePart.path, file.sha, `${message} · remove old part`);
          } catch (error) {
            if (!(error instanceof GithubApiError && error.status === 404)) throw error;
          }
        }
      }
    }

    const nextStory: StorySummary = {
      slug: draft.slug,
      title: draft.title,
      author: draft.author || undefined,
      summary: draft.summary || undefined,
      coverImageUrl: draft.coverImageUrl || undefined,
      status: draft.status,
      updatedAt: now,
      parts: nextParts,
    };
    const stories = existing
      ? current.index.stories.map(story => story.slug === draft.slug ? nextStory : story)
      : [...current.index.stories, nextStory];
    const nextIndex: StoriesIndex = { version: 1, updatedAt: now, stories };
    const result = await client.putFileAtPath(indexPath(config), JSON.stringify(nextIndex, null, 2), `${message} · update index`, current.sha);
    return { story: nextStory, indexSha: result.content.sha };
  }

  async function deleteStory(slug: string, message = `Delete story: ${slug}`) {
    const current = await readIndex();
    const story = current.index.stories.find(item => item.slug === slug);
    if (!story) return false;
    for (const part of story.parts) {
      try {
        const file = await client.getFile(part.path);
        await client.deleteFile(part.path, file.sha, `${message} · part ${part.partNumber}`);
      } catch (error) {
        if (!(error instanceof GithubApiError && error.status === 404)) throw error;
      }
    }
    const nextIndex: StoriesIndex = { ...current.index, updatedAt: new Date().toISOString(), stories: current.index.stories.filter(item => item.slug !== slug) };
    await client.putFileAtPath(indexPath(config), JSON.stringify(nextIndex, null, 2), `${message} · update index`, current.sha);
    return true;
  }

  return { readIndex, listPublic, listAll, getSummary, getPartContent, getStoryForAdmin, saveStory, deleteStory };
}
