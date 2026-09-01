import type { GithubConfig } from "./githubContents";

export const githubConfig: GithubConfig = {
  owner: import.meta.env.VITE_GITHUB_OWNER || "your-github-username",
  repo: import.meta.env.VITE_GITHUB_REPO || "truyen-doc",
  branch: import.meta.env.VITE_GITHUB_BRANCH || "main",
  dataRoot: import.meta.env.VITE_GITHUB_DATA_ROOT || "stories",
};

export const isGithubConfigured = Boolean(
  import.meta.env.VITE_GITHUB_OWNER && import.meta.env.VITE_GITHUB_REPO,
);
