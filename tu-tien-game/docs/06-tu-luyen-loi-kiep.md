# 06 · Tu luyện, đột phá & lôi kiếp

## Tu vi
- Cảnh giới 9 tầng; mỗi tầng cần `expPerStage[tầng-1]` tu vi (xem `realms.json`).
- Nguồn tu vi: **ngồi thiền**, **đánh quái**, **nhiệm vụ**, **đan dược**, **cơ duyên**.
- Hệ số theo linh căn (`expMul`): Tàn Căn ×0.3, Hỗn Độn ×1.6, còn lại ×1.
- Nhân vật chính **Tàn Căn** cố ý tu rất chậm: **đan dược và nhiệm vụ** là đường tắt chính ở Hồi 1, dạy người chơi hệ thống đan và rèn.
- Công thức ngồi thiền (prototype): `8 + 40×(chỉ số cảnh giới) + 2×tầng` mỗi lần bấm (có nút x10). Về sau: thiền có **thời gian thực/offline** với trần theo linh khí vùng.

## Lên tầng nhỏ
Đủ tu vi → **tự động lên tầng**, trừ tầng 9 → muốn sang cảnh giới mới phải **độ kiếp**.

## Bình cảnh
Một số tầng (ví dụ Luyện Khí 6, Trúc Cơ 9) có **Bình Cảnh**: đủ tu vi nhưng chưa lên được, cần hoàn thành **cơ duyên** (nhiệm vụ gắn cốt truyện) hoặc dùng vật phẩm. Biến việc cày thành hành trình.

## Đạo tâm
- Thang 0–100, khởi đầu 50.
- Tăng: giúp người, giữ chữ tín, hoàn thành lời thề, qua tâm ma.
- Giảm: lạm sát, phản bội, dùng thủ đoạn ma đạo.
- Tác dụng: giảm sát thương tâm ma khi độ kiếp (tối đa −20%), mở/khóa kết cục.

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
