# 11 · Kỹ thuật & lộ trình làm

## Công nghệ
| Lớp | Công cụ | Lý do |
|---|---|---|
| Game engine | **Phaser 3.90** | 2D HTML5, pixel-art, chạy web + mobile |
| Ngôn ngữ | **TypeScript** (strict) | An toàn kiểu cho hệ thống dữ liệu lớn |
| Build | **Vite** | Nhanh, ra file tĩnh cho GitHub Pages |
| Test | **Vitest** | Test lõi (chiến đấu, rèn, đan, lôi kiếp) không cần trình duyệt |
| Dữ liệu | **JSON** trong `src/data` | Thêm nội dung không cần sửa code |
| Lưu game | `localStorage` (có version) | Giai đoạn đầu; sau có thể đồng bộ cloud |
| Pixel art | Aseprite / asset miễn phí; hiện sprite sinh bằng code | Thay dần |
| Bản đồ | Tiled (kế hoạch) | Chỉnh map bằng công cụ trực quan |

## Cấu trúc thư mục
```
tu-tien-game/
├─ docs/               # GDD (tài liệu này)
├─ src/
│  ├─ main.ts          # cấu hình Phaser (640×360, scale FIT)
│  ├─ state.ts         # trạng thái người chơi dùng chung
│  ├─ core/            # LOGIC THUẦN (không phụ thuộc Phaser) → dễ test
│  │  ├─ battle.ts     # CTB timeline, sát thương, trạng thái, combo, AI
│  │  ├─ forge.ts      # rèn đồ: chất lượng → độ hiếm → dòng phụ
│  │  ├─ alchemy.ts    # luyện đan: hỏa hầu → phẩm, đan văn
│  │  ├─ progression.ts# tu vi, tầng, lôi kiếp
│  │  ├─ session.ts    # chiêu mở khóa, nhiệm vụ, chương, rơi đồ
│  │  ├─ stats.ts      # chỉ số tổng, lực chiến
│  │  ├─ save.ts       # lưu / tải / người chơi mới
│  │  ├─ data.ts       # nạp JSON, map tra cứu
│  │  ├─ rng.ts        # RNG có seed (rèn đồ & test lặp lại được)
│  │  └─ types.ts
│  ├─ data/            # realms, roots, branches, skills, statuses, enemies, items, recipes, quests, chapters
│  ├─ scenes/          # Boot, Title, Overworld, Battle, Menu (giao diện Phaser)
│  └─ ui/widgets.ts    # nút, thanh máu
├─ tests/              # Vitest
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
- Nút ≥ 44px khi quy đổi thực tế; di chuyển bằng **chạm-giữ**.
- Hiệu năng: sprite sinh một lần, dùng texture atlas khi có art thật; giới hạn đối tượng trên màn hình.
- **Kế hoạch**: PWA (offline, cài lên màn hình chính), joystick ảo tùy chọn, xoay dọc hỗ trợ giao diện menu.

## Lưu game & tương thích
- Khóa `tu-tien-game:save:v1`, có `v` để **migrate**. Trường mới có giá trị mặc định (`{...newPlayer(), ...saved}`).
- Tự lưu mỗi 30 giây, khi thoát menu, sau trận, sau nhiệm vụ.
- Kế hoạch: xuất/nhập file save (JSON) + đồng bộ cloud.

## Kiểm thử đã có (17 test)
Timeline tỉ lệ Tốc Độ · giới hạn 3 hành động liên tiếp · softcap · khắc hệ · combo tag · kết thúc trận · rèn ngẫu nhiên khác nhau · độ hiếm theo chất lượng · khóa dòng phụ · luyện đan trừ nguyên liệu · Tàn Căn chậm · lôi kiếp (từ chối khi chưa đủ, không phạt; vượt được khi đủ) · lực chiến tăng theo cảnh giới · nhiệm vụ mở hệ thống · chiêu mở dần.

## Lộ trình (milestone)
| MS | Mục tiêu | Nội dung | Tiêu chí hoàn thành |
|---|---|---|---|
| **M0 ✅** | Khung | GDD, dự án, core, 5 scene, dữ liệu mẫu, test | Chạy được, build được |
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

## Việc cần làm ngay (backlog đầu)
- [ ] Map Tiled + loader (thay map sinh bằng code).
- [ ] Hệ hội thoại dữ liệu hóa (JSON, có lựa chọn, có điều kiện cờ).
- [ ] Mini-game búa & hỏa hầu.
- [ ] Đội hình nhiều người (đồng hành), chọn mục tiêu theo nhóm.
- [ ] Cinematic lôi kiếp.
- [ ] Hệ cờ lựa chọn (đạo tâm, danh vọng, quan hệ).
- [ ] Âm thanh/nhạc (chiptune).
- [ ] PWA + joystick ảo.
