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

## Đã có
- Chiến đấu **timeline (CTB)** nhiều người: Tốc Độ → số lần hành động, softcap, tối đa 3 hành động liền; **đồng hành** (Liễu Nguyệt Nhi hồi máu cho đồng đội).
- **Combo tag**, bộ combo tùy chỉnh (3 preset), 3 nhánh (Kiếm / Thể / Pháp) mở chiêu dần theo cảnh giới.
- Tu luyện, **lôi kiếp điện ảnh** (chọn Né / Đỡ / Uống đan từng đợt; chưa đủ khí tức thì không bị phạt).
- **Chợ Thanh Hà Tập** với 3 NPC: **Lão Thiết (Thợ Rèn)**, **Lục Dược Sư (Đan Sư)**, **Chưởng Quầy Tiền (Tạp Hóa)**:
  - **Mua** nguyên liệu / đan / đồ rèn sẵn / thời trang (tồn kho theo ngày, giá dao động).
  - **Bán** lại 50%.
  - **Thuê** NPC rèn đồ hoặc luyện đan khác (kể cả đan phương bạn chưa học), gói Thường/Tinh phẩm.
  - **Tự làm** bằng mini-game búa rèn / hỏa hầu.
- Hội thoại có lựa chọn → đạo tâm, danh vọng phe, quan hệ NPC (xem Menu → Huyết Thư).
- Âm thanh chiptune, lưu game, **PWA** (cài lên màn hình chính, chơi offline).

Trên màn hình chính có nút **"Thử nhanh: Trúc Cơ + Kiếm Tu"** để thử các hệ thống mở sau mà không cần chơi từ đầu. Chợ nằm phía nam đường lớn, từ điểm xuất phát đi xuống rồi sang phải.
