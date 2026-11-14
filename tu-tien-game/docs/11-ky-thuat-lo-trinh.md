# 11 · Kỹ thuật & lộ trình làm

## Công nghệ
| Lớp | Công cụ | Lý do |
|---|---|---|
| Game engine | **Phaser 3.90** | 2D HTML5, pixel-art, chạy web + mobile |
| Ngôn ngữ | **TypeScript** (strict) | An toàn kiểu cho hệ thống dữ liệu lớn |
| Build | **Vite** | Nhanh, ra file tĩnh cho GitHub Pages |
| Test | **Vitest** | Test lõi (chiến đấu, rèn, đan, cửa hàng, hội thoại, lôi kiếp) không cần trình duyệt |
| Dữ liệu | **JSON** trong `src/data` | Thêm nội dung không cần sửa code |
| Lưu game | `localStorage` (có version) | Giai đoạn đầu; sau có thể đồng bộ cloud |
| Pixel art | Aseprite / asset miễn phí; hiện sprite sinh bằng code | Thay dần |
| Bản đồ | **Tiled** (JSON, tile 16px) | Thêm khu mới không cần sửa code |

## Cấu trúc thư mục
```
tu-tien-game/
├─ docs/               # GDD (tài liệu này)
├─ public/             # manifest PWA, service worker, icon
├─ src/
│  ├─ main.ts          # cấu hình Phaser (640×360, scale FIT), đăng ký scene & service worker
│  ├─ state.ts, settings.ts, audio.ts   # trạng thái chung · cài đặt · chiptune WebAudio
│  ├─ core/            # LOGIC THUẦN (không phụ thuộc Phaser) → dễ test
│  │  ├─ battle.ts     # CTB timeline, sát thương, trạng thái, combo, AI, đồng đội/hồi máu
│  │  ├─ forge.ts      # rèn đồ: chất lượng → độ hiếm → dòng phụ
│  │  ├─ alchemy.ts    # luyện đan (tự làm hoặc NPC làm)
│  │  ├─ services.ts   # cửa hàng NPC: tồn kho theo ngày, giá, mua/bán, THUÊ rèn/luyện
│  │  ├─ minigame.ts   # chấm điểm mini-game búa & hỏa hầu
│  │  ├─ story.ts      # hội thoại có lựa chọn + điều kiện + hiệu ứng (đạo tâm, danh vọng, quan hệ, đồng hành…)
│  │  ├─ progression.ts# tu vi, tầng, lôi kiếp (TribulationRun chạy từng đợt)
│  │  ├─ session.ts    # chiêu mở khóa, nhiệm vụ, chương, rơi đồ, chỉ số đồng hành
│  │  ├─ encounter.ts  # dựng trận từ trạng thái người chơi + autoBattle (dùng cho mô phỏng cân bằng)
│  │  ├─ tiled.ts, maps.ts, tileset.ts  # nạp bản đồ Tiled (JSON) & bảng ô
│  │  ├─ time.ts       # giờ trong game, ngày/đêm
│  │  ├─ stats.ts, save.ts (xuất/nhập), data.ts, rng.ts, types.ts
│  ├─ data/            # JSON: realms, roots, branches, skills, statuses, enemies, items, recipes, quests, chapters,
│  │                   #       services (NPC), dialogues, companions, systems, events, rumors, maps/*.json (Tiled)
│  ├─ scenes/          # Boot, Title, Overworld, Battle, Menu, Shop, MiniGame, Tribulation
│  └─ ui/              # widgets (nút, thanh), ListPanel (khung tab/trang), format
├─ tools/              # make_maps.py (sinh map Tiled), simulate.ts + sim-cli.ts (cân bằng), export-tileset.cjs
├─ tests/              # Vitest (core, services, systems, maps)
└─ play/               # bản build cho GitHub Pages (sinh bởi `npm run build`)
```
**Quy tắc kiến trúc**: `core/` không import Phaser. Scene chỉ *vẽ và nhận input*, mọi luật chơi ở `core/`.

## Lệnh
```bash
cd tu-tien-game
npm install
npm run dev        # chạy thử cục bộ
npm test           # chạy unit test lõi
npm run build      # kiểm kiểu + build ra play/
```
Triển khai: GitHub Pages phục vụ nhánh này, game ở `/tu-tien-game/play/`.

## Mobile
- Viewport meta `user-scalable=no`, `touch-action: none`.
- `Scale.FIT` + `autoCenter`: giữ tỉ lệ 16:9, chạy tốt ngang trên điện thoại.
- **Joystick ảo** (góc trái dưới) tự bật trên thiết bị cảm ứng; đổi Tự động/Luôn bật/Tắt trong Menu → Cài đặt. Trên PC vẫn dùng WASD hoặc chạm-giữ.
- Nút ≥ 44px khi quy đổi thực tế; mini-game chỉ cần **một nút lớn**.
- **PWA**: `manifest.webmanifest` + `sw.js` (mạng trước, rơi về cache khi offline) + icon 192/512 → cài lên màn hình chính, chơi offline sau lần tải đầu.
- Âm thanh bật sau lần chạm đầu tiên (chính sách trình duyệt); phím N hoặc Cài đặt để tắt.
- Đã kiểm thử bằng giả lập điện thoại ngang 844×390: joystick di chuyển được, service worker đăng ký được. **Chưa thử trên thiết bị thật.**

## Lưu game & tương thích
- Khóa `tu-tien-game:save:v1`, có `v` để **migrate**. Trường mới có giá trị mặc định (`{...newPlayer(), ...saved}`).
- Tự lưu mỗi 30 giây, khi thoát menu, sau trận, sau nhiệm vụ.
- Kế hoạch: xuất/nhập file save (JSON) + đồng bộ cloud.

## Kiểm thử đã có (74 test, `npm test`)
- **Chiến đấu**: tỉ lệ hành động theo Tốc Độ, giới hạn 3 hành động liền, softcap, khắc hệ, combo tag, đồng đội hồi máu, địch nhắm người yếu máu, **hy sinh máu, bẫy nổ + đẩy lượt, độc, boss nhiều pha**.
- **Rèn / đan / cửa hàng / thuê NPC / mini-game / hội thoại / lôi kiếp**: như các đợt trước (xem 12).
- **Giờ game & sự kiện**: ngày 300s, qua nửa đêm, điều kiện theo giờ, hồi chiêu sự kiện, sự kiện ban đêm, tin đồn theo tiến trình, mọi hội thoại sự kiện tồn tại.
- **Save**: xuất/nhập khứ hồi (tiếng Việt), phát hiện file sửa/hỏng.
- **Bản đồ**: nạp được 3 map; tileset trong file Tiled khớp game; mọi tham chiếu hợp lệ; **mọi NPC, thảo dược và cổng đều đến được từ điểm xuất hiện (BFS)**; không ai đứng trong tường; cổng nối hai chiều; NPC chọn đúng hội thoại; từ chối dữ liệu Tiled hỏng.
- **Cân bằng** (mô phỏng tự động): ngưỡng thắng/thua cho mọi nhánh (xem 04).

Test phát hiện được 2 lỗi thật trong lúc làm: sự kiện kích hoạt ở thời điểm 0 bỏ qua hồi chiêu, và thảo dược/NPC đặt vào ô vật cản.

Ngoài unit test, đã chạy thủ công bằng Playwright: 3 map + cổng, ban đêm/NPC đi ngủ, tin đồn, boss nhiều pha, lôi kiếp, giả lập điện thoại (xem các đợt trước).

## Lộ trình (milestone)
| MS | Mục tiêu | Nội dung | Tiêu chí hoàn thành |
|---|---|---|---|
| **M0 ✅** | Khung | GDD, dự án, core, 5 scene, dữ liệu mẫu, test | Chạy được, build được |
| **M0.7 ✅** | Thế giới | 3 map Tiled, ngày–đêm, lịch NPC, sự kiện, tin đồn, 6 nhánh, boss nhiều pha, mô phỏng cân bằng | Có thể đi lại giữa các khu và chơi vòng lặp dài |
| **M0.5 ✅** | Hệ thống | NPC dịch vụ, mini-game, hội thoại, đồng hành, lôi kiếp điện ảnh, âm thanh, PWA | Chơi thử được các vòng lặp chính |
| **M1** | Vertical slice Hồi 1 | Map thật (Tiled), cinematic mở đầu, hội thoại đầy đủ Ch.1–3, tutorial combat, UI chọn mục tiêu/đội | 30 phút đầu hoàn chỉnh |
| **M2** | Lôi kiếp & nhánh | Cinematic lôi kiếp, chọn nhánh, 3 nhánh × ~12 chiêu, boss #1 | Chơi 1.5–2 giờ |
| **M3** | Rèn & đan | Mini-game búa & hỏa hầu, khóa/khắc/khảm, thị trường, đấu giá | Vòng kinh tế đầy đủ |
| **M4** | Thế giới mở | Nhiều vùng, NPC có lịch, cơ duyên ngẫu nhiên, bí cảnh | 5–8 giờ |
| **M5** | Hồi 2–3 | Đủ nhánh, cốt truyện đến Phi thăng, lựa chọn, kết cục | 20–40 giờ |
| **M6** | Thời trang & kiếm tiền | Cửa hàng thời trang, xu, battle pass, PWA | Sẵn sàng phát hành |

## Rủi ro & phương án
| Rủi ro | Giảm thiểu |
|---|---|
| Phạm vi quá lớn | Làm vertical slice trước, nội dung theo JSON, ưu tiên hệ thống hơn số lượng |
| Art pixel tốn công | Bắt đầu với tileset & sprite miễn phí/đơn giản, thống nhất bảng màu, thay dần |
| Cân bằng phức tạp | Test tự động mô phỏng trận, bảng cân bằng trong JSON |
| Mobile chậm | Đo FPS sớm, giới hạn hạt/hiệu ứng, tối ưu texture |
| Mất save | Version + xuất/nhập file |

## Backlog
**Đã xong**
- [x] Bản đồ **chuẩn Tiled** (JSON) + loader + 3 map nối bằng cổng; sinh/chỉnh bằng script hoặc Tiled.
- [x] Art có animation (bước đi 3 pha, quái nhún, nước động) và **cơ chế thay art thật không cần sửa code** (`public/art/manifest.json`).
- [x] Nhạc theo khu vực (overworld / tông môn / chợ / chiến đấu / boss / lôi kiếp).
- [x] NPC có **lịch sinh hoạt** (ngủ ban đêm), **ngày–đêm**, **sự kiện ngẫu nhiên**, **tin đồn**.
- [x] 6 nhánh chơi được (Kiếm, Thể, Pháp, **Đan, Phù Trận, Ma**), **boss nhiều pha**, cân bằng bằng **mô phỏng tự động**.
- [x] **Xuất/nhập save** (file hoặc chuỗi) để chuyển máy/sao lưu.
- [x] Tối ưu: bản đồ được "đóng băng" thành 1 texture (thay vì ~2.500 ảnh), phím F xem FPS; joystick chọn bên trái/phải.

**Chưa làm — và lý do**
- [ ] **Art pixel do họa sĩ vẽ**: cần người vẽ; cơ chế thay art đã sẵn sàng.
- [ ] **Đồng bộ save lên cloud / đấu giá giữa người chơi**: cần máy chủ & tài khoản (ngoài phạm vi game tĩnh trên GitHub Pages). Tạm thay bằng xuất/nhập save.
- [ ] **Thử trên điện thoại thật** và đo hiệu năng thiết bị thật: tôi chỉ giả lập được trong trình duyệt headless.
- [ ] Nhánh **Ngự Thú** (cần cơ chế triệu hồi giữa trận) và **Âm Tu** (cần thao túng thứ tự hành động).
- [ ] Nhạc/SFX do nhà soạn nhạc làm (hiện là chiptune tổng hợp, có 6 bài ngắn).
- [ ] Nội dung Hồi 2–3 (Kết Đan trở lên): map, boss #2–#5, bí cảnh.
- [ ] Hệ thống đạo tâm ảnh hưởng thật vào kết cục; tâm ma kiếp.
