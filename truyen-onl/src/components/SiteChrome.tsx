import { BookOpen, Github, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { isGithubConfigured } from "@/lib/githubConfig";

export function SiteHeader() {
  return <header className="border-b border-[#d9d5cc]/90 bg-[#f5f1e9]/95 backdrop-blur"><div className="container flex h-16 items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3" aria-label="Về trang chủ Truyện Đọc"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#18333a] text-[#f4bd68]"><BookOpen size={17} /></span><span><strong className="block text-sm tracking-[-0.02em]">TRUYỆN ĐỌC</strong><span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a908d] sm:block">Đọc chậm · nhớ lâu</span></span></Link><nav className="flex items-center gap-2 text-sm font-semibold"><Link href="/" className="hidden rounded-full px-3 py-2 text-[#64716e] hover:bg-[#e9e6de] hover:text-[#18333a] sm:block">Thư viện</Link><Link href="/admin" className="flex items-center gap-2 rounded-full border border-[#d7d3ca] px-3 py-2 text-[#526261] transition-colors hover:border-[#b46c45] hover:text-[#18333a]"><ShieldCheck size={15} /><span className="hidden sm:inline">Khu vực Admin</span><span className="sm:hidden">Admin</span></Link></nav></div></header>;
}

export function SiteFooter() {
  return <footer className="border-t border-[#d9d5cc] py-8"><div className="container flex flex-col gap-2 text-xs text-[#7b8581] sm:flex-row sm:items-center sm:justify-between"><span>Truyện Đọc · Một khoảng lặng cho trí tưởng tượng.</span><span className="flex items-center gap-2">{isGithubConfigured && <><Github size={13} /> Nội dung từ GitHub</>} · © {new Date().getFullYear()}</span></div></footer>;
}
