import { GithubApiError, type GithubConfig, createGithubContentsClient } from "./githubContents";

export async function verifyGithubAdminAccess(config: GithubConfig, token: string) {
  if (!token.trim()) throw new GithubApiError("Vui lòng nhập GitHub token.", 401);
  const repository = await createGithubContentsClient(config, token).verifyAccess();
  if (repository.permissions?.push !== true) {
    throw new GithubApiError("Token chưa có quyền ghi repository. Hãy cấp Contents: Read and write cho đúng repo.", 403);
  }
  return repository;
}
