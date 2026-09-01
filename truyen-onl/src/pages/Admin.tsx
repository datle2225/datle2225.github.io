import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, FilePlus2, KeyRound, LogOut, Pencil, Plus, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLoadError from "@/components/AdminLoadError";
import RichTextEditor from "@/components/RichTextEditor";
import { isGithubConfigured, githubConfig } from "@/lib/githubConfig";
import { GithubApiError } from "@/lib/githubContents";
import { createGithubStoryRepository, type StoryDraft, type StoryPart, type StorySummary } from "@/lib/githubStories";
import { sanitizeStoryHtml } from "@/lib/githubPublicData";
import { verifyGithubAdminAccess } from "@/lib/githubAdmin";

type FormPart = { partNumber: number; title: string; content: string };
type StoryForm = { slug: string; title: string; author: string; summary: string; coverImageUrl: string; status: "draft" | "published"; parts: FormPart[] };
type AdminStory = Omit<StorySummary, "parts"> & { parts: Array<StoryPart & { content: string; sha: string }> };

const emptyForm = (): StoryForm => ({ slug: "", title: "", author: "", summary: "", coverImageUrl: "", status: "draft", parts: [{ partNumber: 1, title: "Phần 1", content: "<p></p>" }] });

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

function errorMessage(error: unknown) {
  if (error instanceof GithubApiError) return error.message;
  return "Đã có lỗi không mong muốn. Vui lòng thử lại.";
}

function AdminLogin({ onVerified }: { onVerified: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isGithubConfigured) { setError("Chưa cấu hình VITE_GITHUB_OWNER và VITE_GITHUB_REPO cho site này."); return; }
    if (!token.trim()) { setError("Vui lòng nhập GitHub fine-grained token."); return; }
    setError("");
    setBusy(true);
    try {
      await verifyGithubAdminAccess(githubConfig, token);
      onVerified(token.trim());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return <div className="min-h-screen bg-[#18333a] px-5 py-8 text-[#fffaf1]"><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center"><div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#23474d] shadow-[0_28px_80px_rgba(0,0,0,0.25)] lg:grid-cols-[1fr_420px]"><div className="relative hidden overflow-hidden p-12 lg:block"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#f4bd68]/15" /><div className="absolute bottom-10 left-8 h-36 w-36 rounded-full border border-[#f4bd68]/10" /><span className="mb-16 inline-flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#f4bd68] text-[#18333a]"><ShieldCheck size={22} /></span><p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f4bd68]">Không gian biên tập</p><h1 className="font-display max-w-md text-6xl font-semibold leading-[0.96] tracking-[-0.06em]">Một nơi để những câu chữ được sắp xếp.</h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#c9d8d2]">Mọi thay đổi sẽ tạo commit trực tiếp trong repository GitHub của bạn.</p></div><div className="bg-[#fbf9f4] p-7 text-[#18333a] sm:p-10"><Link href="/" className="mb-14 inline-flex items-center gap-2 text-sm font-bold text-[#65716f] hover:text-[#b46c45]">← Về thư viện</Link><div className="mb-8"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e9e2d5] text-[#b46c45]"><KeyRound size={20} /></div><h2 className="font-display text-4xl font-semibold tracking-[-0.05em]">Mở cửa Admin</h2><p className="mt-3 text-sm leading-6 text-[#6d7975]">Nhập fine-grained token. Token chỉ được giữ trong bộ nhớ của tab này và không được lưu vào file build.</p></div><form onSubmit={verify} className="space-y-5"><div className="space-y-2"><Label htmlFor="github-token" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">GitHub token</Label><Input id="github-token" type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="github_pat_..." autoComplete="off" className="h-12 rounded-[12px] border-[#d4d0c7] bg-white px-4 focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div>{!isGithubConfigured && <div className="rounded-[10px] bg-[#f3ead9] px-3 py-2 text-sm leading-5 text-[#86643e]">Build này đang dùng dữ liệu mẫu. Hãy thêm `VITE_GITHUB_OWNER` và `VITE_GITHUB_REPO` trước khi sử dụng Admin thật.</div>}{error && <p role="alert" className="rounded-[10px] bg-[#f8e8df] px-3 py-2 text-sm text-[#9a4f38]">{error}</p>}<Button type="submit" disabled={busy || !isGithubConfigured} className="h-12 w-full rounded-[12px] bg-[#18333a] font-bold text-[#fffaf1] hover:bg-[#2b5960]"><ShieldCheck size={17} /> {busy ? "Đang kiểm tra..." : "Xác thực và vào Admin"}</Button></form><p className="mt-8 text-center text-xs leading-5 text-[#8c9691]">Khuyến nghị token chỉ có Contents: Read and write trên một repository riêng.</p></div></div></div></div>;
}

function StoryEditor({ story, repository, onSaved, onDeleted }: { story: AdminStory | null; repository: ReturnType<typeof createGithubStoryRepository>; onSaved: (story: StorySummary) => void; onDeleted: () => void }) {
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!story) { setForm(emptyForm()); setNotice(null); return; }
    setForm({ slug: story.slug, title: story.title, author: story.author || "", summary: story.summary || "", coverImageUrl: story.coverImageUrl || "", status: story.status, parts: story.parts.map(part => ({ partNumber: part.partNumber, title: part.title, content: part.content })) });
    setNotice(null);
  }, [story]);

  const setField = <K extends keyof StoryForm>(key: K, value: StoryForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const updatePart = (index: number, patch: Partial<FormPart>) => setForm(current => ({ ...current, parts: current.parts.map((part, partIndex) => partIndex === index ? { ...part, ...patch } : part) }));
  const addPart = () => setForm(current => ({ ...current, parts: [...current.parts, { partNumber: current.parts.length + 1, title: `Phần ${current.parts.length + 1}`, content: "<p></p>" }] }));
  const removePart = (index: number) => { if (form.parts.length === 1) return; setForm(current => ({ ...current, parts: current.parts.filter((_, partIndex) => partIndex !== index).map((part, partIndex) => ({ ...part, partNumber: partIndex + 1 })) })); };
  const movePart = (index: number, direction: -1 | 1) => { const next = index + direction; if (next < 0 || next >= form.parts.length) return; setForm(current => { const parts = [...current.parts]; [parts[index], parts[next]] = [parts[next], parts[index]]; return { ...current, parts: parts.map((part, partIndex) => ({ ...part, partNumber: partIndex + 1 })) }; }); };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title || !slug || form.parts.some(part => !part.title.trim() || !sanitizeStoryHtml(part.content).trim())) { setNotice({ type: "error", text: "Hãy điền tên truyện, slug và nội dung hợp lệ cho mọi phần." }); return; }
    setSaving(true); setNotice(null);
    try {
      const draft: StoryDraft = { slug, title, author: form.author.trim(), summary: form.summary.trim(), coverImageUrl: form.coverImageUrl.trim(), status: form.status, parts: form.parts.map((part, index) => ({ partNumber: index + 1, title: part.title.trim(), content: sanitizeStoryHtml(part.content) })) };
      const result = await repository.saveStory(draft, story ? `Update story: ${slug}` : `Create story: ${slug}`);
      onSaved(result.story);
      setNotice({ type: "success", text: story ? "Đã cập nhật truyện trên GitHub." : "Đã tạo truyện mới trên GitHub." });
    } catch (error) { setNotice({ type: "error", text: errorMessage(error) }); }
    finally { setSaving(false); }
  };

  const removeStory = async () => {
    if (!story || !window.confirm("Xóa truyện và toàn bộ file các phần trên GitHub?")) return;
    setSaving(true); setNotice(null);
    try { await repository.deleteStory(story.slug); onDeleted(); }
    catch (error) { setNotice({ type: "error", text: errorMessage(error) }); }
    finally { setSaving(false); }
  };

  return <form onSubmit={save} className="space-y-7"><div className="flex flex-col gap-4 border-b border-[#ddd8cf] pb-7 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#b46c45]"><Pencil size={14} /> {story ? "Chỉnh sửa truyện" : "Bản thảo mới"}</div><h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-[#18333a]">{story ? form.title || "Chỉnh sửa truyện" : "Tạo truyện mới"}</h1><p className="mt-2 text-sm text-[#78837f]">Lưu sẽ tạo commit vào nhánh <code>{githubConfig.branch}</code>.</p></div><div className="flex gap-2"><Button type="submit" disabled={saving} className="rounded-full bg-[#18333a] px-5 text-[#fffaf1] hover:bg-[#2b5960]"><Save size={16} /> {saving ? "Đang lưu..." : "Lưu lên GitHub"}</Button>{story && <Button type="button" variant="outline" disabled={saving} onClick={removeStory} className="rounded-full border-[#e0c5bb] bg-transparent text-[#a0523c] hover:bg-[#faeee9]"><Trash2 size={16} /> <span className="hidden sm:inline">Xóa</span></Button>}</div></div>{notice && <div role="status" className={`flex items-center gap-2 rounded-[12px] px-4 py-3 text-sm ${notice.type === "success" ? "bg-[#e5f0e7] text-[#366a4e]" : "bg-[#faece6] text-[#9a4f38]"}`}>{notice.type === "success" ? <Check size={16} /> : <X size={16} />} {notice.text}</div>}<section className="rounded-[18px] border border-[#ded9d0] bg-white p-5 shadow-[0_6px_22px_rgba(24,51,58,0.03)] sm:p-7"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Thông tin truyện</h2><p className="mt-1 text-xs text-[#8a908d]">Metadata được lưu trong index.json.</p></div><Badge className={form.status === "published" ? "border-0 bg-[#e4f0e5] text-[#3d7551]" : "border-0 bg-[#f3ead9] text-[#94703c]"}>{form.status === "published" ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}</Badge></div><div className="grid gap-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label htmlFor="story-title" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">Tên truyện</Label><Input id="story-title" value={form.title} onChange={event => { const title = event.target.value; setForm(current => ({ ...current, title, slug: current.slug || slugify(title) })); }} placeholder="Ví dụ: Mùa đi qua hiên nhà" className="h-12 rounded-[11px] border-[#d7d2c9] bg-[#fbfaf7] focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div><div className="space-y-2"><Label htmlFor="story-slug" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">Slug đường dẫn</Label><Input id="story-slug" value={form.slug} disabled={Boolean(story)} onChange={event => setField("slug", slugify(event.target.value))} placeholder="mua-di-qua-hien-nha" className="h-12 rounded-[11px] border-[#d7d2c9] bg-[#fbfaf7] font-mono text-sm focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div><div className="space-y-2"><Label htmlFor="story-author" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">Tác giả</Label><Input id="story-author" value={form.author} onChange={event => setField("author", event.target.value)} placeholder="Tên tác giả" className="h-12 rounded-[11px] border-[#d7d2c9] bg-[#fbfaf7] focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="story-summary" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">Tóm tắt</Label><Textarea id="story-summary" value={form.summary} onChange={event => setField("summary", event.target.value)} placeholder="Một đoạn giới thiệu ngắn..." className="min-h-[105px] resize-y rounded-[11px] border-[#d7d2c9] bg-[#fbfaf7] leading-6 focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div><div className="space-y-2"><Label htmlFor="story-cover" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">URL ảnh bìa <span className="font-normal normal-case tracking-normal text-[#9aa09c]">(tùy chọn)</span></Label><Input id="story-cover" type="url" value={form.coverImageUrl} onChange={event => setField("coverImageUrl", event.target.value)} placeholder="https://..." className="h-12 rounded-[11px] border-[#d7d2c9] bg-[#fbfaf7] focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div><div className="space-y-2"><Label htmlFor="story-status" className="text-xs font-bold uppercase tracking-[0.12em] text-[#526261]">Trạng thái</Label><select id="story-status" value={form.status} onChange={event => setField("status", event.target.value as StoryForm["status"])} className="h-12 w-full rounded-[11px] border border-[#d7d2c9] bg-[#fbfaf7] px-3 text-sm text-[#18333a] outline-none focus:border-[#b46c45]"><option value="draft">Bản nháp — chưa hiển thị</option><option value="published">Đã xuất bản — hiển thị</option></select></div></div></section><section className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#b46c45]"><BookOpen size={14} /> Nội dung nhiều phần</div><h2 className="font-display text-3xl font-semibold tracking-[-0.045em]">Các phần truyện</h2><p className="mt-1 text-sm text-[#78837f]">Nội dung được sanitize trước khi commit vào từng file HTML.</p></div><Button type="button" variant="outline" onClick={addPart} className="w-fit rounded-full border-[#cbd3c9] bg-transparent text-[#366a4e] hover:bg-[#e7f0e8]"><Plus size={16} /> Thêm phần</Button></div><div className="space-y-4">{form.parts.map((part, index) => <div key={`${part.partNumber}-${index}`} className="overflow-hidden rounded-[18px] border border-[#ded9d0] bg-white shadow-[0_6px_22px_rgba(24,51,58,0.03)]"><div className="flex items-center justify-between gap-3 border-b border-[#e8e3da] bg-[#faf8f3] px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#18333a] font-display text-sm font-semibold text-[#f4bd68]">{String(index + 1).padStart(2, "0")}</span><Input value={part.title} onChange={event => updatePart(index, { title: event.target.value })} className="h-9 min-w-0 border-0 bg-transparent px-1 font-semibold text-[#18333a] shadow-none focus-visible:ring-0" aria-label={`Tên phần ${index + 1}`} /></div><div className="flex shrink-0 items-center gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => movePart(index, -1)} disabled={index === 0} className="h-8 w-8 rounded-full"><ArrowUp size={15} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => movePart(index, 1)} disabled={index === form.parts.length - 1} className="h-8 w-8 rounded-full"><ArrowDown size={15} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => removePart(index)} disabled={form.parts.length === 1} className="h-8 w-8 rounded-full text-[#a0523c] hover:bg-[#faece6]"><Trash2 size={15} /></Button></div></div><RichTextEditor value={part.content} onChange={content => updatePart(index, { content })} /></div>)}</div></section></form>;
}

function AdminDashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const repository = useMemo(() => createGithubStoryRepository(githubConfig, token), [token]);
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<AdminStory | null>(null);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [editorState, setEditorState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  const loadStories = async () => {
    setListState("loading"); setLoadError("");
    try { setStories(await repository.listAll()); setListState("ready"); }
    catch (error) { setListState("error"); setLoadError(errorMessage(error)); }
  };
  useEffect(() => { void loadStories(); }, [repository]);
  useEffect(() => {
    if (!selectedSlug) { setSelectedStory(null); setEditorState("idle"); return; }
    let mounted = true;
    setEditorState("loading");
    repository.getStoryForAdmin(selectedSlug).then(value => { if (mounted) { setSelectedStory(value as AdminStory | null); setEditorState(value ? "ready" : "error"); } }).catch(error => { if (mounted) { setLoadError(errorMessage(error)); setEditorState("error"); } });
    return () => { mounted = false; };
  }, [repository, selectedSlug]);

  const filteredStories = stories.filter(story => `${story.title} ${story.author || ""}`.toLocaleLowerCase("vi").includes(filter.trim().toLocaleLowerCase("vi")));
  const handleSaved = (story: StorySummary) => { setSelectedSlug(story.slug); void loadStories(); };

  return <div className="min-h-screen bg-[#f5f1e9] text-[#18333a]"><header className="sticky top-0 z-20 border-b border-[#d9d5cc]/90 bg-[#f5f1e9]/95 backdrop-blur"><div className="container flex h-16 items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#18333a] text-[#f4bd68]"><BookOpen size={17} /></span><div><span className="block text-sm font-bold tracking-[-0.02em]">TRUYỆN ĐỌC</span><span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a908d] sm:block">GitHub Pages Admin</span></div></Link><div className="flex items-center gap-2"><span className="hidden text-xs text-[#8a908d] lg:inline">{githubConfig.owner}/{githubConfig.repo}</span><Button variant="outline" onClick={onSignOut} className="rounded-full border-[#ccd1ca] bg-transparent text-xs font-bold text-[#64716e] hover:bg-[#18333a] hover:text-[#fffaf1]"><LogOut size={15} /> Thoát</Button></div></div></header><main className="container py-8 sm:py-10"><div className="mb-8 flex flex-col gap-4 border-b border-[#d9d5cc] pb-7 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#b46c45]"><ShieldCheck size={14} /> File-based publishing</div><h1 className="font-display text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Quản lý thư viện.</h1><p className="mt-2 text-sm text-[#78837f]">Mỗi lần lưu tạo commit vào GitHub; draft không xuất hiện với độc giả.</p></div><Button onClick={() => { setSelectedSlug(null); setSelectedStory(null); }} className="w-fit rounded-full bg-[#18333a] text-[#fffaf1] hover:bg-[#2b5960]"><FilePlus2 size={16} /> Tạo truyện mới</Button></div><div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]"><aside className="rounded-[20px] border border-[#ded9d0] bg-[#fbf9f4] p-4 shadow-[0_8px_26px_rgba(24,51,58,0.04)]"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Danh sách truyện</h2><Badge className="border-0 bg-[#e9e2d5] text-[#80664b]">{stories.length}</Badge></div><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa09c]" size={15} /><Input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Lọc danh sách..." className="h-10 rounded-[10px] border-[#d7d2c9] bg-white pl-9 text-sm focus-visible:border-[#b46c45] focus-visible:ring-[#b46c45]/20" /></div>{listState === "loading" && <div className="space-y-2">{[1, 2, 3].map(index => <div key={index} className="h-16 animate-pulse rounded-[12px] bg-[#e9e5dc]" />)}</div>}{listState === "error" && <div className="space-y-3"><AdminLoadError scope="list" /><p className="text-center text-xs leading-5 text-[#8a908d]">{loadError}</p><button type="button" onClick={() => void loadStories()} className="mx-auto block text-xs font-bold text-[#b46c45]">Thử lại</button></div>}{listState === "ready" && filteredStories.length === 0 && <div className="px-3 py-10 text-center text-sm leading-6 text-[#8a908d]">Chưa có truyện. Hãy tạo bản thảo đầu tiên.</div>}{listState === "ready" && <div className="space-y-1.5">{filteredStories.map(story => <button type="button" key={story.slug} onClick={() => setSelectedSlug(story.slug)} className={`w-full rounded-[12px] px-3 py-3 text-left transition-colors ${selectedSlug === story.slug ? "bg-[#18333a] text-[#fffaf1]" : "text-[#526261] hover:bg-[#eeeae2]"}`}><div className="flex items-start justify-between gap-3"><span className="line-clamp-2 text-sm font-bold leading-5">{story.title}</span><span className={`mt-0.5 shrink-0 text-[10px] font-bold ${selectedSlug === story.slug ? "text-[#f4bd68]" : story.status === "published" ? "text-[#4e835e]" : "text-[#ad8554]"}`}>{story.status === "published" ? "LIVE" : "DRAFT"}</span></div><div className={`mt-1 text-xs ${selectedSlug === story.slug ? "text-[#b5c9c1]" : "text-[#8a908d]"}`}>{story.parts.length} phần · {story.author || "Chưa có tác giả"}</div></button>)}</div>}</aside><section className="min-w-0 rounded-[20px] border border-[#ded9d0] bg-[#fbf9f4] p-5 shadow-[0_8px_26px_rgba(24,51,58,0.04)] sm:p-8">{editorState === "loading" && <div className="flex min-h-[580px] items-center justify-center text-sm text-[#8a908d]">Đang tải file truyện từ GitHub...</div>}{editorState === "error" && <div className="flex min-h-[580px] flex-col items-center justify-center gap-3"><AdminLoadError scope="story" /><p className="text-center text-xs leading-5 text-[#8a908d]">{loadError}</p></div>}{editorState !== "loading" && editorState !== "error" && <StoryEditor story={selectedStory} repository={repository} onSaved={handleSaved} onDeleted={() => { setSelectedSlug(null); setSelectedStory(null); void loadStories(); }} />}</section></div></main></div>;
}

export default function Admin() {
  const [token, setToken] = useState("");
  return token ? <AdminDashboard token={token} onSignOut={() => setToken("")} /> : <AdminLogin onVerified={setToken} />;
}
