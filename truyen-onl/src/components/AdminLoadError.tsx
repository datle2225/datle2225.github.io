import React from "react";

type AdminLoadErrorProps = {
  scope: "session" | "list" | "story";
};

const messages: Record<AdminLoadErrorProps["scope"], string> = {
  session: "Không thể kiểm tra phiên Admin. Vui lòng tải lại trang.",
  list: "Không thể tải danh sách truyện. Vui lòng tải lại trang.",
  story: "Không thể tải bản thảo này. Vui lòng chọn truyện khác hoặc tải lại trang.",
};

export default function AdminLoadError({ scope }: AdminLoadErrorProps) {
  return <div role="alert" className="rounded-[12px] bg-[#faece6] px-3 py-4 text-center text-sm leading-6 text-[#9a4f38]">{messages[scope]}</div>;
}
