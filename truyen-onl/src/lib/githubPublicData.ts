import DOMPurifyModule from "dompurify";
import { GithubApiError } from "./githubContents";
import { storiesIndexSchema } from "./githubStories";
import { createGithubStoryRepository } from "./githubStories";
import { githubConfig, isGithubConfigured } from "./githubConfig";

const githubRepository = createGithubStoryRepository(githubConfig);
const localBase = import.meta.env.BASE_URL || "/";

type Sanitizer = { sanitize: (html: string, options: Record<string, unknown>) => string };

function fallbackSanitize(html: string) {
  return html.replace(/<\/?(script|style|iframe|object|embed|form)(?:\s[^>]*)?>[\s\S]*?<\/?\1\s*>/gi, "").replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(?:"|')?\s*javascript:[^"'\s>]*(?:"|')?/gi, "");
}

function getSanitizer(): Sanitizer | null {
  const moduleValue = DOMPurifyModule as unknown as { default?: unknown; sanitize?: Sanitizer["sanitize"] } | ((window: Window) => Sanitizer);
  const candidate = "default" in moduleValue && moduleValue.default ? moduleValue.default : moduleValue;
  if (typeof candidate === "function" && typeof globalThis.window !== "undefined") return candidate(globalThis.window);
  if (typeof candidate === "object" && candidate && "sanitize" in candidate && typeof candidate.sanitize === "function") return candidate as Sanitizer;
  return null;
}

export function sanitizeStoryHtml(html: string) {
  const sanitizer = getSanitizer();
  if (!sanitizer) return fallbackSanitize(html);
  return sanitizer.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "blockquote", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

function localPath(path: string) {
  return `${localBase.replace(/\/$/, "/")}${path.replace(/^\//, "")}`;
}

async function loadLocalIndex() {
  const response = await fetch(localPath(`${githubConfig.dataRoot}/index.json`));
  if (!response.ok) throw new Error("Chưa tìm thấy stories/index.json trong site.");
  return storiesIndexSchema.parse(await response.json());
}

export async function loadPublicStories() {
  if (isGithubConfigured) return githubRepository.listPublic();
  const index = await loadLocalIndex();
  return index.stories.filter(story => story.status === "published");
}

export async function loadPublicStory(slug: string) {
  if (isGithubConfigured) {
    const story = await githubRepository.getSummary(slug);
    if (!story) return null;
    const parts = [];
    for (const part of story.parts) {
      const file = await githubRepository.getPartContent(story, part.partNumber);
      if (!file) return null;
      parts.push({ ...file, content: sanitizeStoryHtml(file.content) });
    }
    return { ...story, parts };
  }

  const index = await loadLocalIndex();
  const story = index.stories.find(item => item.slug === slug && item.status === "published");
  if (!story) return null;
  const parts = [];
  for (const part of story.parts) {
    const response = await fetch(localPath(part.path));
    if (!response.ok) throw new Error(`Không thể tải ${part.title}.`);
    parts.push({ ...part, content: sanitizeStoryHtml(await response.text()) });
  }
  return { ...story, parts };
}
