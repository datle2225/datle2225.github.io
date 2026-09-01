import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/githubConfig", () => ({
  githubConfig: { owner: "demo", repo: "truyen-doc", branch: "main", dataRoot: "stories" },
  isGithubConfigured: false,
}));

import Admin from "./Admin";

describe("GitHub Pages Admin gate", () => {
  afterEach(cleanup);

  it("explains missing public repository configuration and keeps the write button disabled", () => {
    render(<Admin />);
    expect(screen.getByText(/Build này đang dùng dữ liệu mẫu/)).toBeTruthy();
    const button = screen.getByRole("button", { name: /Xác thực và vào Admin/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("does not submit a token while the static site is not configured", () => {
    render(<Admin />);
    fireEvent.change(screen.getByLabelText(/GitHub token/i), { target: { value: "github_pat_test" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
