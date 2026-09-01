import { describe, expect, it } from "vitest";
import AdminLoadError from "./AdminLoadError";

describe("AdminLoadError", () => {
  it.each([
    ["session", "Không thể kiểm tra phiên Admin"],
    ["list", "Không thể tải danh sách truyện"],
    ["story", "Không thể tải bản thảo này"],
  ] as const)("renders the %s error message", (scope, message) => {
    const element = AdminLoadError({ scope });
    expect(element.props.role).toBe("alert");
    expect(element.props.children).toContain(message);
  });
});
