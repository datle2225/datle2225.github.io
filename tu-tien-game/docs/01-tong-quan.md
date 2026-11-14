# 01 · Tổng quan

## Tầm nhìn
Một game tu tiên pixel **thế giới mở** nơi người chơi bắt đầu là **"phế vật" Tàn Căn**, bị cả thiên hạ khinh thường, mang mối huyết thù diệt môn, và từng bước nghịch thiên cải mệnh. Cảm giác trung tâm: **"Ta từ tro tàn, bước lên đỉnh cao."**

## Trụ cột thiết kế
1. **Nghịch tập có thật**: người chơi *thật sự yếu* lúc đầu và *thật sự thấy mình mạnh lên* (bay được, chiêu mới, ngoại hình đổi, kẻ từng khinh mình phải ngước nhìn).
2. **Build là của tôi**: nhánh tu, bộ chiêu, combo tự chỉnh, trang bị rèn riêng – hai người chơi hiếm khi giống nhau.
3. **Mỗi hệ thống nuôi hệ thống khác**: hái thuốc → luyện đan → bán/dùng → đột phá → mở khu mới → có nguyên liệu mới.
4. **Thế giới có đời sống**: NPC có lịch sinh hoạt, ghi nhớ hành động, lựa chọn có hậu quả.
5. **Dạy dần, không dội thông tin**: mỗi 30–45 phút chơi chỉ mở **một** cơ chế mới.

## Đối tượng & nền tảng
- Người chơi 15–35 tuổi, thích truyện tu tiên/ngôn tình/huyền huyễn, RPG theo lượt, build-crafting.
- **Web/PC trước** (HTML5 + Phaser), thiết kế UI **chạm được ngay từ đầu**:
  - Nút ≥ 44px khi quy đổi ra màn hình điện thoại, mọi thao tác có thể làm bằng 1 ngón.
  - Di chuyển: bàn phím (WASD/mũi tên) hoặc chạm-giữ để đi.
  - Không có thao tác chỉ dùng chuột phải/hover.
- Phiên chơi ngắn 5–10 phút vẫn có tiến bộ (tu luyện, luyện đan, một trận).

## Vòng lặp chơi
- **Giây (30s)**: di chuyển → gặp quái / NPC / thảo dược → ra quyết định.
- **Phút (5–10 phút)**: nhận nhiệm vụ → đi → chiến đấu → nhận thưởng → tu luyện / luyện đan / rèn.
- **Giờ (30–60 phút)**: đột phá (lôi kiếp) → mở khu, chiêu, hệ thống mới → câu chuyện tiến một bước.
- **Dài hạn**: rửa hận từng kẻ trong danh sách, khám phá bí mật Hỗn Độn Căn và Cổ Đỉnh, phi thăng.

```
        ┌───────── Tu luyện / Đan dược ─────────┐
        ▼                                         │
 Chiến đấu ─► Nguyên liệu / Linh thạch ─► Rèn / Luyện / Mua ─┐
        ▲                                                     ▼
 Khu vực mới ◄──── Đột phá (Lôi kiếp) ◄──── Mạnh hơn ◄────────┘
```

## Tông giọng
Nghiêm trang xen hài hước nhẹ. Thù hận có trọng lượng nhưng game không u ám suốt: có tình bạn, đạo lữ, sư phụ trong Cổ Đỉnh (hài, mưu mẹo), cảnh sinh hoạt tông môn.

## Phạm vi (scope)
| Giai đoạn | Nội dung | Mục tiêu |
|---|---|---|
| Prototype (khung hiện tại) | 1 map, 1 chương, combat CTB, 3 nhánh, rèn/đan/cửa hàng cơ bản | Chứng minh combat vui |
| Alpha | Chương 1–6, 3 nhánh đầy đủ, lôi kiếp 3 lần | Chơi 3–5 giờ |
| Beta | Chương 1–12, 6 nhánh, thị trường, sự kiện | Chơi 15–20 giờ |
| 1.0 | Hết Hồi 1–3 (Phi thăng), 8 nhánh, thời trang, mobile tối ưu | Chơi 40+ giờ |
