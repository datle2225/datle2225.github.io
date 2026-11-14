# 05 · Nhánh tu luyện & chiêu thức

## Nguyên tắc
- **Chọn nhánh ở Trúc Cơ** (sau lôi kiếp đầu). Trước đó mọi người chỉ có "đòn cơ bản" + vài chiêu tutorial.
- **Mỗi nhánh có kho chiêu riêng**, mở dần theo **cảnh giới + tầng** (mục tiêu 30–50 chiêu/nhánh ở bản đầy đủ; prototype 4–5).
- **Chiêu mở = *có thể dùng*, chưa chắc *đang trang bị*:** số ô combo giới hạn nên phải chọn.
- Nhiều chiêu cùng tạo *combo tag* chéo giữa các nhánh phụ (đa dạng build).
- Có thể **đổi nhánh** (tốn vật phẩm hiếm "Tẩy Tủy Đan"), hoặc **tu song hệ** ở Nguyên Anh (hạn chế).

## Tám nhánh
| Nhánh | Mở | Vai trò | Chỉ số chính | Tài nguyên | Cơ chế đặc trưng |
|---|---|---|---|---|---|
| **Kiếm Tu** | Trúc Cơ | Công cao, tốc cao, giòn | Công/Tốc | Kiếm Ý | Tích Kiếm Ý, xả combo nhiều đòn, ngự kiếm nhanh |
| **Thể Tu** | Trúc Cơ | Trâu bò, phản đòn | Thủ/HP | Huyết Khí | Càng mất máu càng mạnh, Khiên, hút máu |
| **Pháp Tu** | Trúc Cơ | Phép diện rộng | MP/Công phép | Linh Lực | Ngũ hành tương sinh, cộng hưởng nguyên tố |
| **Đan Tu** | Kết Đan | Hỗ trợ, độc, hồi | HP/MP | Dược Lực | Đan thành chiêu, ném đan, thân đan |
| **Phù Trận Tu** | Kết Đan | Khống chế chiến trường | MP | Phù Lực | Đặt bẫy trước, kích hoạt sau |
| **Ngự Thú Tu** | Nguyên Anh | Triệu hồi, đồng đội | HP | Thú Tâm | Linh thú thành viên thật trong đội |
| **Ma Tu** | Nguyên Anh | Hy sinh máu lấy sức | Công | Sát Khí | Rủi ro cao; ảnh hưởng đạo tâm |
| **Âm Tu** | Nguyên Anh | Buff/debuff nhịp | MP | Âm Luật | Thao túng thứ tự hành động |

`playable: true` trong `branches.json` cho các nhánh đã có chiêu: **hiện 6 nhánh** (Kiếm, Thể, Pháp, **Đan, Phù Trận, Ma**). Ngự Thú và Âm Tu chưa làm.

> **Lưu ý:** theo thiết kế gốc Đan/Phù Trận mở ở Kết Đan và Ma Tu ở Nguyên Anh; **bản hiện tại mở cả 6 nhánh ở Trúc Cơ** để dễ thử. Khi có đủ nội dung sẽ khóa lại theo bảng trên.

### Đan Tu (đã làm)
Đan Châm (cơ bản) → Độc Đan Phi Xạ (gieo **Trúng Độc**) → Thanh Liên Hộ Thể (hồi + khiên) → **Bạo Đan** (cộng hưởng với Độc) → Hồi Xuân Đan Vũ (hồi đồng đội) → Vạn Độc Quy Tông (Kết Đan).

### Phù Trận Tu (đã làm)
Phù Kích → **Địa Lôi Phù** (đặt **bẫy**) → Định Thân Phù (làm chậm) → **Dẫn Lôi** (kích nổ bẫy sớm, cộng hưởng) → Vạn Phù Quy Nhất (Kết Đan). Chiến thuật: đặt bẫy trước, đối thủ ra tay là bị nổ và chậm lượt.

### Ma Tu (đã làm)
Huyết Trảm → **Hiến Tế** (hy sinh 15% HP, gieo **Huyết Nhiễm**) → Ma Công (cộng hưởng Huyết Nhiễm, hy sinh 10%) → Thôn Phệ (hút máu 60%) → Thiên Ma Giải Thể (hy sinh 25% HP, sát thương khủng khiếp, Kết Đan). Rủi ro cao, **mô phỏng cho thấy mất nhiều HP hơn** các nhánh khác khi chiến thắng.


## Các tầng chiêu thức (khung cho mỗi nhánh)
| Cảnh giới | Số chiêu mới | Loại |
|---|---|---|
| Luyện Khí | 2–3 | Cơ bản + 1 gieo tag |
| Trúc Cơ | 4–5 | Cộng hưởng, đa đòn, hồi |
| Kết Đan | 5–6 | Chiêu nặng, AOE, chiêu nguyên tố |
| Nguyên Anh | 6–8 | Thần thông đặc trưng nhánh, ultimate |
| Hóa Thần | 4–6 | Pháp tắc (passive, thay đổi luật chơi) |
| Luyện Hư → Đại Thừa | 3–5 | Chiêu hợp thể, thiên địa dị tượng |

## Kiếm Tu (chi tiết mẫu – đã có trong `skills.json`)
| Chiêu | Mở | Power | MP | Cost | Ghi chú |
|---|---|---|---|---|---|
| Trảm Kiếm | LK 1 | 1.0 | 0 | 100 | Cơ bản |
| Nhất Thiểm | LK 3 | 0.7 | 4 | 55 | Nhanh, gieo **Phá Giáp** |
| Phong Cuồng Kiếm Vũ | TC 2 | 1.4 | 10 | 110 | Cần Phá Giáp: ×1.6 |
| Tam Hồ Liên Trảm | TC 5 | 0.55 ×3 | 12 | 70 | 3 đòn |
| Vạn Lý Kiếm Khí | KĐ 1 | 2.4 | 28 | 160 | Cần Phá Giáp: ×1.5 |

*Cảm giác chơi*: mở bằng Nhất Thiểm (rẻ, nhanh) → Phong Cuồng nhân sát thương → Tam Hồ khi đối thủ yếu → Vạn Lý để chốt. Combo gợi ý: `Nhất Thiểm → Phong Cuồng → Tam Hồ`.

## Thể Tu (mẫu)
- Thiết Bố Sam (gieo **Khiên**), Phản Chấn Quyền (cần Khiên trên bản thân: ×1.3), Huyết Nhẫn (hút máu 30%).
- Cơ chế sau: **Huyết Khí** tăng theo HP đã mất → bonus Công.

## Pháp Tu (mẫu)
- Hỏa Cầu Thuật (gieo **Bỏng**), Băng Châm (gieo **Chậm Chạp**), Lôi Phạt (cần Bỏng: ×1.5), Mộc Hồi Xuân (hồi 25% HP).
- Cơ chế sau: **Cộng hưởng nguyên tố**: Hỏa→Thổ→Kim… dùng đúng chuỗi tương sinh thì chiêu sau miễn MP.

## Nhánh phụ / nghề sinh hoạt
Luyện đan, luyện khí (rèn), phù lục, trận pháp là **nghề phụ**, người chơi nào cũng học được, nhưng nhánh chiến đấu quyết định *công thức đặc biệt* (ví dụ Đan Tu luyện đan thành chiêu). Xem 07.

## Cân bằng giữa nhánh
- Không có nhánh "đúng tuyệt đối". Bảng khắc chế mềm:

| | vs Kiếm | vs Thể | vs Pháp |
|---|---|---|---|
| Kiếm | = | yếu (Thủ cao) | mạnh (Tốc cao) |
| Thể | mạnh (phản đòn) | = | yếu (phép xuyên giáp) |
| Pháp | yếu (giòn) | mạnh (xuyên giáp, DoT) | = |

- Boss đa dạng yếu điểm để buộc đổi bộ chiêu.
