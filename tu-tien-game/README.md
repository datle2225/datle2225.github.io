# Tàn Căn Nghịch Thiên

Game pixel tu tiên thế giới mở (Web/PC, chơi được trên điện thoại).
Cốt truyện: **phế vật nghịch tập + báo thù**.

- 📖 **Tài liệu thiết kế (GDD)**: [`docs/README.md`](docs/README.md)
- 🎮 **Chơi thử** (sau khi build): [`play/index.html`](play/index.html), trên GitHub Pages là `/tu-tien-game/play/`

## Chạy cục bộ
```bash
cd tu-tien-game
npm install
npm run dev      # dev server (Vite)
npm test         # unit test lõi game
npm run build    # build ra play/
```

## Điều khiển
| Hành động | PC | Điện thoại |
|---|---|---|
| Di chuyển | WASD / phím mũi tên / chạm-giữ | **Joystick ảo** góc trái dưới |
| Nói chuyện | E / Space hoặc nút "Nói chuyện" | Chạm nút "Nói chuyện" |
| Qua câu thoại / chọn | Space / Click, phím 1–3 | Chạm khung thoại / nút lựa chọn |
| Menu | M | Nút "Menu" |
| Tắt/bật tiếng | N | Menu → Cài đặt |
| Xem FPS (debug) | F | – |

## Đã có
- **3 bản đồ nối nhau** (Thanh Hà Thôn & Hắc Lâm → Thanh Vân Tông, Phường Thị Vân Hải), định dạng **Tiled**; **ngày–đêm**, NPC **ngủ ban đêm**, **sự kiện ngẫu nhiên**, **tin đồn**.
- Chiến đấu **timeline (CTB)** nhiều người; **6 nhánh** (Kiếm / Thể / Pháp / Đan / Phù Trận / Ma) với cơ chế riêng (khiên, độc, **bẫy**, **hy sinh máu**); **boss nhiều pha**; đồng hành Liễu Nguyệt Nhi.
- Tu luyện, **lôi kiếp điện ảnh**, rèn đồ, luyện đan, **NPC dịch vụ** (mua · bán · thuê · tự làm bằng mini-game), thời trang.
- Hội thoại có lựa chọn → đạo tâm, danh vọng phe, quan hệ (Menu → Huyết Thư).
- Nhạc chiptune theo khu vực, **PWA**, **xuất/nhập save**, joystick ảo chọn bên trái/phải.
- **74 unit test** và **mô phỏng cân bằng** (`npm run sim`).

Trên màn hình chính có nút **"Thử nhanh: Trúc Cơ + Kiếm Tu"** để thử các hệ thống mở sau. Từ Chương 2 trở đi có cổng sang Thanh Vân Tông (sau khi xin nhập môn) và Phường Thị Vân Hải (đường lớn đi về phía đông).

## Công cụ
`npm run dev` · `npm test` · `npm run build` · `npm run sim` (cân bằng) · `npm run maps` (sinh map Tiled) · `npm run tileset`. Hướng dẫn thay art và chỉnh bản đồ: [`docs/13-art-guide.md`](docs/13-art-guide.md).
