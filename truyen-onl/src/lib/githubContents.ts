export type GithubConfig = {
  owner: string;
  repo: string;
  branch: string;
  dataRoot: string;
};

export type GithubFile = {
  type: "file" | "dir" | string;
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
  download_url?: string | null;
};

export class GithubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: { documentationUrl?: string; remaining?: string | null },
  ) {
    super(message);
    this.name = "GithubApiError";
  }
}

const API_VERSION = "2022-11-28";

function normalizeBase64(content: string) {
  return content.replace(/\s/g, "");
}

export function decodeGithubContent(content: string) {
  const binary = globalThis.atob(normalizeBase64(content));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeGithubContent(content: string) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    for (let offset = 0; offset < chunk.length; offset += 1) binary += String.fromCharCode(chunk[offset]);
  }
  return globalThis.btoa(binary);
}

export function createGithubContentsClient(config: GithubConfig, token = "") {
  const apiRoot = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents`;

  async function requestUrl<T>(url: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", API_VERSION);
    if (token.trim()) headers.set("Authorization", `Bearer ${token.trim()}`);

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch {
      throw new GithubApiError("Không thể kết nối GitHub. Hãy kiểm tra mạng rồi thử lại.", 0);
    }

    if (!response.ok) {
      let payload: { message?: string; documentation_url?: string } = {};
      try { payload = await response.json(); } catch { /* keep the HTTP status message */ }
      const remaining = response.headers.get("x-ratelimit-remaining");
      const hint = response.status === 403 && remaining === "0"
        ? " GitHub API đã hết rate limit tạm thời."
        : response.status === 409
          ? " Nội dung đã thay đổi trên GitHub; hãy tải lại để lấy SHA mới."
          : "";
      throw new GithubApiError(`${payload.message || `GitHub trả về lỗi ${response.status}.`}${hint}`, response.status, {
        documentationUrl: payload.documentation_url,
        remaining,
      });
    }

    return response.json() as Promise<T>;
  }

  async function request<T>(path: string, init?: RequestInit) {
    return requestUrl<T>(`${apiRoot}/${path.replace(/^\//, "")}`, init);
  }

  async function verifyAccess() {
    return requestUrl<{ full_name: string; default_branch: string; permissions?: { push?: boolean } }>(`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`);
  }

  async function getFile(path: string) {
    return request<GithubFile>(encodePath(path));
  }

  async function getTextFile(path: string) {
    const file = await getFile(path);
    if (!file.content || file.encoding !== "base64") {
      throw new GithubApiError(`File ${path} không có nội dung Base64 hợp lệ.`, 422);
    }
    return { ...file, text: decodeGithubContent(file.content) };
  }

  async function getJsonFile<T>(path: string) {
    const file = await getTextFile(path);
    try {
      return { ...file, value: JSON.parse(file.text) as T };
    } catch {
      throw new GithubApiError(`File ${path} không phải JSON hợp lệ.`, 422);
    }
  }

  async function getDirectory(path: string) {
    return request<GithubFile[]>(encodePath(path));
  }

  async function putFile(path: string, content: string, message: string, sha?: string) {
    return request<{ content: GithubFile; commit: { sha: string; html_url?: string } }>(encodePath(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: encodeGithubContent(content),
        ...(sha ? { sha } : {}),
        branch: config.branch,
      }),
    });
  }

  /**
   * GitHub Contents PUT creates missing parent directories implicitly when the
   * first file is written. There is no separate empty-directory resource in Git.
   */
  async function putFileAtPath(path: string, content: string, message: string, sha?: string) {
    return putFile(path, content, message, sha);
  }

  async function deleteFile(path: string, sha: string, message: string) {
    return request<{ commit: { sha: string; html_url?: string } }>(encodePath(path), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: config.branch }),
    });
  }

  return { getFile, getTextFile, getJsonFile, getDirectory, putFile, putFileAtPath, deleteFile, verifyAccess };
}

function encodePath(path: string) {
  return path.split("/").filter(Boolean).map(segment => encodeURIComponent(segment)).join("/");
}
