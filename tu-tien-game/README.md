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
- **8 bản đồ nối nhau** (Thanh Hà → Thanh Vân Tông / Phường Thị → Huyết Nguyệt Bí Cảnh / Hoang Mạc Xích Hỏa / **Băng Nguyên → Huyết Ảnh Tổng Đàn / Thiên Kiếp Đài**), định dạng **Tiled**; ngày–đêm, NPC ngủ ban đêm, sự kiện ngẫu nhiên, tin đồn.
- Chiến đấu **timeline (CTB)**; **nhánh chính (Kiếm/Thể/Pháp) + một nhánh phụ** trong 8 nhánh (Kiếm / Thể / Pháp / Đan / Phù Trận / Ma / **Ngự Thú** / **Âm Tu**) với cơ chế riêng (khiên, độc, bẫy, hy sinh máu, **linh thú**, **đảo nhịp**); **boss nhiều pha**; đồng hành Liễu Nguyệt Nhi.
- **Tu luyện có giới hạn**: thiền tốn thời gian + tâm lực, hiệu quả theo linh khí vùng, cần nơi yên tĩnh, **bình cảnh** cần cơ duyên / Phá Cảnh Đan, **bế quan** tu luyện cả khi rời game.
- **Lôi kiếp điện ảnh** + **tâm ma kiếp** (đấu bản sao của chính bạn, mạnh yếu theo đạo tâm).
- **Đường lên Phi Thăng hoàn chỉnh**: Luyện Hư (Hư Không Giới) → Hợp Thể (Cổ Chiến Trường) → Đại Thừa (Thiên Môn), boss Thiên Đạo Sứ Giả, tâm ma, **Phi Thăng Thiên Kiếp 12 đợt**, 5 đoạn kết, **HẾT GAME**.
- **Nhiều nhiệm vụ phụ**: 15 nhiệm vụ viết tay có lựa chọn đạo đức + **bảng nhiệm vụ lặp lại** hằng ngày ở 9 vùng.
- **Không dễ ăn**: độ khó **Thường/Khó/Ác mộng**, giới hạn uống đan, **quái tinh anh ★**, phạt mất tu vi khi thua.
- **Phần 2 (trận pháp, thế lực, pháp tắc)**: **Trận pháp, Thế lực, Pháp tắc** (Menu → Nội tình) và **Thiên Phong Thành & Kiếm Trủng** (boss Thiên Phong Kiếm Chủ) cho người đã Hóa Thần.
- **Hồi 3 và kết thúc phần 1**: Băng Nguyên, Tổng Đàn (Huyết Ảnh Môn Chủ), Thiên Kiếp Đài (**Lục Vân Sinh**); ba tuyến trận cuối (đánh / vạch trần / hợp tác) và **5 kết cục**; Nguyên Anh có **thoát xác** (hồi sinh một lần mỗi trận).
- **Hồi 2 trọn vẹn**: bí cảnh Huyết Nguyệt (boss Độc Thủ Tiên Sinh), Hoang Mạc (Mặc Gia Gia Chủ: đánh hoặc vạch trần), **gỡ phong ấn Hỗn Độn Căn**, kết cục theo đạo tâm, Huyết Thư.
- Rèn đồ, luyện đan, **NPC dịch vụ** (mua · bán · thuê · tự làm bằng mini-game), **Hội Đấu Giá** (với thương nhân NPC), thời trang.
- Hội thoại có lựa chọn → đạo tâm, danh vọng, quan hệ.
- Nhạc chiptune theo khu vực, **PWA**, **xuất/nhập save**, joystick ảo.
- **165 unit test** và **mô phỏng cân bằng** (`npm run sim`).

Trên màn hình chính có các nút thử nhanh: **Trúc Cơ + Kiếm Tu**, **Kết Đan (Hồi 2)**, **Nguyên Anh (Hồi 3)**, **Hóa Thần (Phần 2, đứng ở Thiên Kiếp Đài; đi cổng phía đông)**, **Đại Thừa (đứng ở Thiên Môn, sẵn sàng độ kiếp Phi Thăng)**. Có nút chọn **độ khó** cho ván mới (mặc định Khó) (đứng ở Phường Thị, đã hạ 3 kẻ thù, nói chuyện với Thiên Cơ Các để mở Băng Nguyên).

## Công cụ
`npm run dev` · `npm test` · `npm run build` · `npm run sim` (cân bằng) · `npm run maps` (sinh map Tiled) · `npm run tileset`. Hướng dẫn thay art và chỉnh bản đồ: [`docs/13-art-guide.md`](docs/13-art-guide.md).
