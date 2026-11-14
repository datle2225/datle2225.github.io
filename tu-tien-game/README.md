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
| Di chuyển | WASD / phím mũi tên | Chạm-giữ nơi muốn tới |
| Nói chuyện | E hoặc nút "Nói chuyện" | Chạm nút "Nói chuyện" |
| Qua câu thoại | Space / Click | Chạm khung thoại |
| Menu | M | Nút "Menu" |

## Đã có trong khung (prototype)
- Chiến đấu theo lượt dạng **timeline (CTB)**: Tốc Độ → số lần hành động, softcap, tối đa 3 hành động liên tiếp.
- **Combo tag** (gieo trạng thái → cộng hưởng), bộ combo tùy chỉnh (3 preset).
- 3 nhánh (Kiếm / Thể / Pháp) với chiêu mở dần theo cảnh giới/tầng.
- Tu luyện, **lôi kiếp** (không đủ khí tức thì không bị phạt), 8 cảnh giới.
- **Rèn đồ** (cùng tên, chỉ số khác nhau), **luyện đan**, **cửa hàng**, **thời trang**.
- Nhiệm vụ chính/phụ, mở hệ thống theo chương, lưu game (`localStorage`).

Trên màn hình chính có nút **"Thử nhanh: Trúc Cơ + Kiếm Tu"** để thử các hệ thống mở sau mà không cần chơi từ đầu.
