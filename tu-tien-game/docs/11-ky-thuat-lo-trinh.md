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
| Bản đồ | JSON riêng (`maps/*.json`); Tiled là kế hoạch | Thêm khu mới không cần sửa code |

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
│  │  ├─ stats.ts, save.ts, data.ts, rng.ts, types.ts
│  ├─ data/            # JSON: realms, roots, branches, skills, statuses, enemies, items, recipes, quests, chapters,
│  │                   #       services (NPC), dialogues, companions, systems, maps/thanh_ha.json
│  ├─ scenes/          # Boot, Title, Overworld, Battle, Menu, Shop, MiniGame, Tribulation
│  └─ ui/              # widgets (nút, thanh), ListPanel (khung tab/trang), format
├─ tests/              # Vitest (core + services)
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

## Kiểm thử đã có (46 test)
- **Chiến đấu**: tỉ lệ hành động theo Tốc Độ, giới hạn 3 hành động liền, softcap, khắc hệ, combo tag, kết thúc trận, đồng đội hồi máu cho người yếu nhất, địch nhắm người yếu máu.
- **Rèn / đan**: chỉ số khác nhau, độ hiếm theo chất lượng, khóa dòng phụ, trừ nguyên liệu, yêu cầu học phương.
- **Cửa hàng NPC**: nhập hàng theo ngày (ổn định trong ngày), mua nguyên liệu / đan / đồ sẵn, hết hàng & thiếu tiền, bán lại, giảm giá theo quan hệ.
- **Thuê NPC**: báo giá, tự đem nguyên liệu rẻ hơn, NPC bù nguyên liệu, gói Tinh phẩm cho độ hiếm cao hơn, không đủ tiền thì không thuê, **đan sư luyện được đan chưa học và khác nhánh**.
- **Mini-game**: chấm điểm búa, vùng sáng hẹp theo độ hiếm, hỏa hầu trong/ngoài vùng xanh.
- **Hội thoại**: lựa chọn đổi đạo tâm/cờ/quan hệ, ẩn lựa chọn theo điều kiện, mở shop, đồng hành vào/ra đội.
- **Lôi kiếp**: chạy từng đợt = kết quả của `runTribulation`, thất bại mất 30% tu vi, chưa đủ khí tức thì không phạt.
- **Tiến trình**: Tàn Căn tu chậm, nhiệm vụ mở hệ thống, chiêu mở dần theo tầng.

Ngoài unit test đã chạy thủ công bằng Playwright: Title → map → NPC → cửa hàng → thuê rèn → mini-game búa & hỏa hầu → đồng hành → trận 3 người → lôi kiếp → giả lập điện thoại.

## Lộ trình (milestone)
| MS | Mục tiêu | Nội dung | Tiêu chí hoàn thành |
|---|---|---|---|
| **M0 ✅** | Khung | GDD, dự án, core, 5 scene, dữ liệu mẫu, test | Chạy được, build được |
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
**Đã xong (đợt này)**
- [x] Bản đồ **dữ liệu hóa** (`maps/*.json`) + loader. *Lưu ý: dùng định dạng JSON riêng, chưa nhập trực tiếp từ Tiled.*
- [x] Hệ hội thoại dữ liệu hóa (lựa chọn, điều kiện cờ, hiệu ứng).
- [x] Mini-game búa & hỏa hầu.
- [x] Đội hình nhiều người (đồng hành), trận nhiều địch, chọn mục tiêu.
- [x] Cảnh điện ảnh lôi kiếp (chọn từng đợt).
- [x] Hệ cờ lựa chọn (đạo tâm, danh vọng, quan hệ) + Huyết Thư xem lại.
- [x] Âm thanh chiptune (WebAudio, không cần file).
- [x] PWA + joystick ảo.
- [x] NPC dịch vụ (rèn / đan / tạp hóa): mua, bán, thuê, tự làm.

**Chưa làm / việc tiếp theo**
- [ ] Nhập bản đồ từ **Tiled** (.tmj) và nhiều map có cổng dịch chuyển (Thanh Vân Tông, Phường Thị Vân Hải).
- [ ] Art pixel thật (tileset, sprite có animation), thay sprite sinh bằng code.
- [ ] Nhạc/SFX chất lượng cao hơn (hiện là chiptune tổng hợp đơn giản).
- [ ] NPC có lịch sinh hoạt, tin đồn, hệ thống sự kiện ngẫu nhiên.
- [ ] Thêm nhánh chiêu (Đan/Phù Trận/Ngự Thú…), boss nhiều pha, cân bằng bằng mô phỏng tự động.
- [ ] Đồng bộ save (cloud / xuất-nhập file), thị trường/đấu giá giữa người chơi.
- [ ] Thử nghiệm trên điện thoại thật, tối ưu hiệu năng, joystick tùy chỉnh vị trí.
