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
│  │  ├─ meditation.ts # thiền có giới hạn: tâm lực, linh khí, bình cảnh (progression.ts), bế quan offline
│  │  ├─ auction.ts    # đấu giá với thương nhân NPC (cọc, xét giá cuối ngày)
│  │  ├─ advanced.ts   # trận pháp, thế lực, pháp tắc (Nguyên Anh / Hóa Thần)
│  │  ├─ stats.ts, save.ts (xuất/nhập), data.ts, rng.ts, types.ts
│  ├─ data/            # JSON: realms, roots, branches, skills, statuses, enemies, items, recipes, quests, chapters,
│  │                   #       services (NPC), dialogues, companions, systems, events, rumors, beasts, maps/*.json (Tiled)
│  ├─ scenes/          # Boot, Title, Overworld, Battle, Menu, Shop, MiniGame, Tribulation
│  └─ ui/              # widgets (nút, thanh), ListPanel (khung tab/trang), format
├─ tools/              # make_maps.py (sinh map Tiled), simulate.ts (thư viện cân bằng; báo cáo ở tests/sim.report.test.ts, chạy `npm run sim`), export-tileset.cjs
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

## Kiểm thử đã có (169 test, `npm test`)
- **Chiến đấu**: Tốc Độ, giới hạn 3 hành động liền, softcap, khắc hệ, combo tag, đồng đội, **hy sinh máu, bẫy, độc, boss nhiều pha, linh thú (triệu hồi, một con/lần, Thú Tâm, Hiệu Lệnh), đảo nhịp (kháng của boss, chỉ kéo sớm)**.
- **Rèn / đan / cửa hàng / thuê NPC / mini-game / hội thoại / lôi kiếp**: xem 12.
- **Thiền**: tốn tâm lực & thời gian, ~8 lần liên tiếp rồi cạn, thời gian thiền không hồi tâm lực, cần yên tĩnh, linh khí nhân hiệu quả, Tàn Căn ×0.3; **bình cảnh** chặn lên tầng và không tích tu vi vượt trần, phá bằng ngộ đạo / Phá Cảnh Đan; **bế quan** (10 phút = 1 đơn vị, 50%, trần 8 giờ, không vượt bình cảnh).
- **Hồi 2**: chuỗi nhiệm vụ Thiên Cơ → bí cảnh → Độc Thủ → Mặc Gia (cả hai tuyến), gỡ phong ấn đổi linh căn, kết cục theo đạo tâm, dữ liệu boss/map hợp lệ.
- **Hồi 3**: chuỗi nhiệm vụ 3 bước, khóa/mở cổng đúng điều kiện, ba tuyến trận cuối (đánh / vạch trần cần Thư Tay / hợp tác), 5 kết cục đặt cờ `game_complete`, boss đủ pha; **thoát xác** hồi sinh đúng một lần, chỉ người đã mở hệ, và làm tăng tỉ lệ thắng trùm cuối.
- **Phần 2 hoàn chỉnh / nhiệm vụ phụ / độ khó**: 18 test mới (xem 15).
- **Trận pháp / thế lực / pháp tắc / Phần 2**: học-bày-rời-gia nhập, phúc lợi, bổng lộc, hiệu ứng thật trong `Battle`, cổng và chuỗi nhiệm vụ Thiên Phong, cân bằng Hóa Thần, và "đủ hệ thống thì dễ hơn".
- **Nhánh chính + phụ**: chỉ Kiếm/Thể/Pháp làm nhánh chính, nhánh phụ đúng cảnh giới/giá/số lượng, kỹ năng gộp.
- **Tâm ma**: chỉ từ Kết Đan, hệ số theo đạo tâm, mô phỏng đạo tâm cao thắng dễ hơn.
- **Đấu giá**: lô ổn định theo ngày, cọc & tăng giá ≥10%, phí rút, thắng trả giá NPC+5% và hoàn dư, thua hoàn đủ, lô trang bị vào túi đúng chỉ số, không đặt lô cũ.
- **Giờ game, sự kiện, tin đồn, save xuất/nhập**.
- **Bản đồ (5 map)**: tileset khớp, tham chiếu hợp lệ, **mọi NPC/thảo dược/cổng đến được (BFS)**, cổng nối hai chiều.
- **Cân bằng (mô phỏng)**: 8 nhánh × từng mốc (xem 04).

Test/smoke phát hiện lỗi thật khi làm: **quest hoàn thành ngay trong trận không báo về bản đồ nên đoạn thoại kích hoạt theo quest (gỡ phong ấn, kết cục) không chạy** (đã sửa); `clock` của timeline sai làm "kéo lượt sớm" vô hiệu; sự kiện kích hoạt ở thời điểm 0 bỏ qua hồi chiêu; vật phẩm đặt vào ô vật cản; hồi máu %HP và DoT %HP phá cân bằng boss.

## Lộ trình (milestone)
| MS | Mục tiêu | Nội dung | Tiêu chí hoàn thành |
|---|---|---|---|
| **M0 ✅** | Khung | GDD, dự án, core, 5 scene, dữ liệu mẫu, test | Chạy được, build được |
| **M1.0 ✅** | Phần 1 | Hồi 3: Băng Nguyên, Tổng Đàn, Thiên Kiếp Đài, 2 boss, 5 kết cục, thoát xác, nhánh chính/phụ | **Chơi từ đầu đến kết cục** |
| **M0.9 ✅** | Hồi 2 | Thiền có giới hạn, tâm ma, 8 nhánh, bí cảnh, Hoang Mạc, 2 boss, gỡ phong ấn, đấu giá NPC | Chơi được hết Hồi 2 |
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
**Đã xong (tích lũy)**
- [x] Bản đồ Tiled + **8 map** nối bằng cổng; ngày–đêm, lịch NPC, sự kiện, tin đồn.
- [x] Thiền có giới hạn, bình cảnh, bế quan; tâm ma kiếp; đấu giá NPC; xuất/nhập save; PWA; thay art bằng manifest.
- [x] **8 nhánh** + **nhánh chính/phụ theo thiết kế gốc**; boss nhiều pha; cân bằng bằng mô phỏng.
- [x] **Hồi 1–3 trọn vẹn**: 5 kẻ thù trong Huyết Thư, gỡ phong ấn Hỗn Độn Căn, **thoát xác** Nguyên Anh, **5 kết cục**.

**Đã xong thêm (Phần 2, bản thử)**
- [x] **Trận pháp, Thế lực, Pháp tắc** (xem 14) và bản đồ **Thiên Phong Thành & Kiếm Trủng** với boss Thiên Phong Kiếm Chủ.

**Đã xong thêm (đợt này)**
- [x] **Luyện Hư → Đại Thừa → Phi Thăng**: 3 bản đồ, 3 boss nhiều pha, truyền tống, chiêu chung Hợp Thể/Đại Thừa, tâm ma + lôi kiếp 12 đợt, 5 đoạn kết phi thăng, HẾT GAME (xem 15).
- [x] **15 nhiệm vụ phụ viết tay** (có lựa chọn đạo đức) + **bảng nhiệm vụ lặp lại hằng ngày** ở 9 vùng.
- [x] **Độ khó** (Thường / Khó / Ác mộng), giới hạn uống đan, quái tinh anh ★, phạt tu vi khi thua.
- [x] Sửa: lực chiến đề xuất độ kiếp từ Luyện Hư trở lên cao hơn mức đạt được (người chơi sẽ kẹt); bước "thu thập" đếm theo túi đồ.

**Chưa làm — và lý do**
- [ ] **Art pixel do họa sĩ vẽ**: cần người vẽ (cơ chế thay art sẵn sàng).
- [ ] **Nhạc/SFX do nhà soạn nhạc làm** (hiện chiptune tổng hợp, 9 bài ngắn).
- [ ] **Đồng bộ save lên cloud, đấu giá giữa người chơi thật**: cần máy chủ & tài khoản. Đã có xuất/nhập save và đấu giá NPC.
- [ ] **Thử trên điện thoại thật** và đo hiệu năng thiết bị thật: chỉ giả lập được trong trình duyệt headless.
- [ ] **Cân bằng với người chơi thật**: số liệu hiện chỉnh bằng AI mô phỏng thô (không dùng đan/trang bị/combo thủ công).
- [ ] Nhiệm vụ riêng cho từng thế lực, xung đột giữa các thế lực; pháp tắc cho đồng hành.
- [ ] Thêm nội dung sau Phi Thăng (Tiên Giới), thành tựu, chế độ chơi lại với New Game+.
