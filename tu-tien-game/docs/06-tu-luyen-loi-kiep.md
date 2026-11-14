# 06 · Tu luyện, đột phá & lôi kiếp

## Tu vi
- Cảnh giới 9 tầng; mỗi tầng cần `expPerStage[tầng-1]` tu vi (xem `realms.json`).
- Nguồn tu vi: **thiền**, **đánh quái**, **nhiệm vụ**, **đan dược**, **cơ duyên**, **bế quan**.
- Hệ số theo linh căn (`expMul`): Tàn Căn ×0.3, Hỗn Độn ×1.6, còn lại ×1.
- Nhân vật chính **Tàn Căn** thiền gần như vô ích (×0.3): **đan dược và nhiệm vụ** là đường tắt chính ở Hồi 1. Sau khi **gỡ phong ấn Hỗn Độn Căn** (cuối Hồi 2) tốc độ tu luyện tăng ×1.6 (gấp ~5 lần trước).

## Thiền có giới hạn (đã làm)
Thiền **không còn là nút bấm vô hạn**:

| Giới hạn | Quy tắc | Ý đồ |
|---|---|---|
| **Thời gian** | Mỗi lần thiền = **1 canh giờ (2 giờ game ≈ 25 giây thực)**. Thế giới trôi: trời tối, tiệm đóng cửa, đến hạn đấu giá… | Thiền có cái giá, không "free" |
| **Tâm lực** | Mỗi lần tốn **12 tâm lực** (tối đa 100 → thiền liên tiếp ~8 lần). Tâm lực **chỉ hồi khi bạn thực sự chơi** (đầy lại sau nửa ngày game ≈ 150 giây chơi); thời gian trôi trong lúc thiền **không** hồi | Buộc đi chiến đấu, làm nhiệm vụ giữa các lần thiền |
| **Linh khí tại chỗ** | Hiệu quả × linh khí: Thanh Hà ×1.0 (linh mạch giếng cổ ×1.8) · Thanh Vân Tông ×1.5 (chính điện ×2.2) · Phường Thị ×0.7 · Huyết Nguyệt Bí Cảnh ×2.0 (linh mạch ×2.8, nhưng đầy quái) · Hoang Mạc ×1.3 (ốc đảo ×1.8) | Có lý do đi tới nơi linh khí đậm |
| **Yên tĩnh** | Không thiền được nếu có quái trong bán kính 7 ô | Không thiền giữa chiến trường |
| **Chất lượng** | Hiệu quả 70% (cạn tâm lực) → 100% (đầy) | |
| **Bình cảnh** | Luyện Khí tầng 6 · Trúc Cơ tầng 5 · Kết Đan tầng 5: **đủ tu vi vẫn không lên**, tu vi không tích vượt trần | Biến cày thành hành trình |

Công thức: `tu vi/lần = tu vi cần cho tầng × 12% × linh khí × (0.7 + 0.3 × tâm lực/100) × hệ số linh căn`.

### Phá bình cảnh
Có **hai** đường: **(1) Cơ duyên "ngộ đạo"**: khi bị bình cảnh, đi lại ngoài thế giới sẽ có xác suất cao gặp sự kiện *ngộ đạo* (chọn đứng lặng quan sát để phá, +2 đạo tâm); **(2) Phá Cảnh Đan** (4 Huyết Sâm + 6 Linh Thảo, độ khó 4): mua ở Vạn Dược Đường, hoặc thuê Đan Sư luyện, hoặc tự luyện.

### Bế quan (tu luyện cả khi rời game)
Bật **Bế quan** rồi tắt game. Khi quay lại (hoặc bấm **Xuất quan**): cứ **10 phút thực = 1 lần thiền ở 50% hiệu suất**, **tối đa 8 tiếng (48 đơn vị)**; không vượt bình cảnh hay tầng đầy; cần nơi yên tĩnh lúc bắt đầu; linh khí tính theo nơi bắt đầu bế quan. Không cần tâm lực. Có thể hủy.

> Thời gian bế quan dựa vào đồng hồ thiết bị (`Date.now`). Không có máy chủ nên không chống chỉnh giờ; chấp nhận vì là game một người chơi.

## Lên tầng nhỏ
Đủ tu vi → **tự lên tầng nhỏ**, trừ tầng 9 (phải độ kiếp) và các tầng **bình cảnh**.

## Đạo tâm
- Thang 0–100, khởi đầu 50.
- Tăng: giúp người, giữ chữ tín, hoàn thành lời thề, qua tâm ma, vạch trần bằng chứng thay vì đánh giết. Giảm: lạm sát, phản bội, dùng thủ đoạn ma đạo.
- Tác dụng: giảm sát thương lôi kiếp (tối đa −20%), **tâm ma yếu đi**, và **quyết định kết cục Hồi 2** (xem dưới).

## Tâm ma kiếp (đã làm)
Từ **Kết Đan trở lên**, trước lôi kiếp phải vượt **tâm ma**: một trận đấu với **bản sao của chính bạn** (cùng bộ chiêu, cùng trang bị).
- Chỉ số tâm ma = chỉ số của bạn × `0.8 + (100 − đạo tâm)/250`: đạo tâm 100 → ×0.8, 50 → ×1.0, 0 → ×1.2.
- Thắng: mở lôi kiếp, +3 đạo tâm. Thua: −5 đạo tâm, **không mất gì khác**, thử lại được. Không bỏ chạy được.
- Test mô phỏng xác nhận đạo tâm cao thắng tâm ma dễ hơn đạo tâm thấp.

## Kết cục Hồi 2 theo đạo tâm
Sau khi hạ Mặc Gia Gia Chủ và gỡ phong ấn, đoạn kết khác nhau: **đạo tâm ≥ 65** (chính đạo), **≤ 35** (ma đạo/hận thù), còn lại **tán tu**. Menu → Huyết Thư luôn hiện "Con đường hiện tại".

## Lôi kiếp (thiên kiếp)
Chỉ khi **bước lên cảnh giới mới** (trừ Luyện Khí là khởi điểm). Lôi kiếp của cảnh giới *đích*:

| Bước lên | Số đợt sét | Lực sét cơ bản | Lực chiến đề xuất |
|---|---|---|---|
| Trúc Cơ | 3 | 40 | 220 |
| Kết Đan | 6 | 110 | 800 |
| Nguyên Anh | 9 | 260 | 2300 |
| Hóa Thần | 9 | 600 | 6500 |
| Luyện Hư | 9 | 1300 | 20000 |
| Hợp Thể | 9 | 2800 | 65000 |
| Đại Thừa | 9 | 6000 | 210000 |
| Phi thăng | – (kiếp cuối) | – | – |

### Quy trình
1. **Điều kiện**: tầng 9 + đầy tu vi.
2. **Kiểm tra "khí tức"**: `lực chiến ≥ 70% đề xuất`. Nếu chưa → thông báo *"Khí tức chưa ổn, hãy tu luyện thêm"*, **không bị phạt, không mất gì**, quay về tu tiếp (đúng yêu cầu thiết kế).
3. **Chuẩn bị**: đan hộ kiếp (Trúc Cơ Đan giảm 15%), pháp bảo chống lôi, đạo tâm cao, trang bị.
4. **Mini-game**: mỗi đợt sét chọn **Né / Đỡ / Uống đan**:
   - **Né**: tỉ lệ `35% + Tốc/600`; trúng thì giảm còn 10% sát thương, trượt thì ×1.2.
   - **Đỡ**: `(sét − Thủ×1.2) × 0.8`.
   - **Uống đan**: hồi 20% HP rồi nhận ×0.9.
   - Sét mạnh dần mỗi đợt: `lực × (1 + 0.25 × số đợt đã qua)`.
5. **Kết quả**:
   - Sống hết các đợt → thăng cảnh giới, **tầng 1**, mở hệ thống mới, tặng bonus thân thể.
   - Chết giữa chừng → **mất 30% tu vi hiện có**, ở lại cảnh giới cũ, **không mất nhân vật**.

### Cảm giác
- Màn hình tối, trời nổi mây, âm thanh gầm; mỗi đợt có hiệu ứng pixel riêng.
- Lôi kiếp Trúc Cơ đầu tiên là **cảnh điện ảnh** của Hồi 1 (sư phụ Lão Đỉnh chỉ cách chống sét).

## Tâm ma kiếp (kế hoạch)
Từ Kết Đan, trước lôi kiếp có thể có **tâm ma**: đối thoại/chiến đấu với "bản thân phản chiếu" tùy lựa chọn quá khứ. Thua = giảm đạo tâm, vẫn có thể thử lại.

## Thọ nguyên
Hiển thị thọ nguyên tối đa theo cảnh giới (flavor). Có thể dùng làm cơ chế sinh tồn **tùy chọn** ở chế độ khó (Hardcore).
