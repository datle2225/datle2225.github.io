# 09 · Thế giới mở & nội dung

## Dữ liệu bản đồ
Bản đồ nằm ở `src/data/maps/*.json` (lưới ký tự + danh sách NPC, quái, thảo dược, vùng kích hoạt nhiệm vụ). Thêm khu mới = thêm một file JSON. *(Chưa nhập trực tiếp được file của Tiled; xem backlog ở 11.)*

## Cấu trúc thế giới
- **Bản đồ liên tục** theo vùng, tải theo ô (chunk) để chạy mượt cả trên điện thoại.
- **Vùng theo cảnh giới** (xem 02): mỗi vùng có nhịp độ khó, cư dân, nguyên liệu, nhạc riêng.
- **"Thấy được nhưng chưa tới được"**: tường sương linh khí, trận pháp, thú dữ chặn đường; người chơi thấy mục tiêu ở xa → động lực.
- **Di chuyển** tiến hóa: đi bộ → ngự kiếm (Trúc Cơ) → phi hành tốc độ cao (Kết Đan) → dịch chuyển (Luyện Hư). Mỗi bước là một khoảnh khắc "wow".
- **Dịch chuyển nhanh** qua truyền tống trận (mở sau khi đến).

## Mật độ điểm hấp dẫn
- Cứ **20–30 giây di chuyển** phải gặp một thứ đáng chú ý: NPC, tài nguyên, sự kiện, di tích, quái đặc biệt, cảnh đẹp.
- Ba tầng: **Lộ liễu** (nhìn thấy ngay) · **Gợi ý** (dấu vết, âm thanh) · **Bí mật** (cần kỹ năng/điều kiện).

## Sự kiện ngẫu nhiên (cơ duyên)
| Loại | Ví dụ |
|---|---|
| Cứu người | Tán tu bị phục kích; cứu → đồng minh hoặc bị gài |
| Cơ duyên | Hồ nước linh khí, mảnh công pháp |
| Mai phục | Đám tu sĩ cướp; có thể đàm phán |
| Thương nhân bí ẩn | Bán vật phẩm hiếm đổi bằng nhiệm vụ |
| Di tích mở thời gian | Giới hạn thời gian, rủi ro cao |
| Thiên tượng | Thiên địa dị tượng tăng tu vi hoặc sinh yêu thú hiếm |

Hệ thống chọn sự kiện dựa trên **vùng + cảnh giới + cờ cốt truyện + khí vận** (một biến ẩn), giúp mỗi lần chơi khác nhau mà vẫn hợp lý.

## NPC có đời sống (đã có một phần)
Đã làm: **hội thoại dữ liệu hóa có lựa chọn và điều kiện**, **quan hệ** (0–100), **danh vọng phe**, **đạo tâm**, **đồng hành** (Liễu Nguyệt Nhi). Chưa làm: lịch sinh hoạt theo giờ, NPC nhớ hành động ngoài hội thoại.

- **Lịch sinh hoạt** (sáng, trưa, tối, đêm): đi làm, mua bán, tu luyện, ngủ.
- **Trí nhớ**: nhớ hành động quan trọng (cứu, giết, trộm), thái độ thay đổi.
- **Quan hệ**: 0–100 điểm thiện cảm; mốc mở thoại, quà, nhiệm vụ riêng.
- **Hậu quả thế giới**: giết một thương nhân → cửa hàng đóng; cứu một làng → làng thịnh vượng, mở tiệm.

## Nhiệm vụ
- **Chính**: danh sách báo thù & cốt truyện (03).
- **Phụ**: câu chuyện nhỏ + quyết định (03).
- **Tông môn**: nhiệm vụ lặp có thưởng cống hiến.
- **Ẩn / Cơ duyên**: kích hoạt bởi hành vi.
- **Sự kiện thế giới** (có hạn): hội thi luyện đan, đấu pháp.

## Dungeon / Bí cảnh
- **Bí cảnh** mở theo chu kỳ hoặc điều kiện, dùng **bản đồ ngẫu nhiên có sườn cố định**: phòng, bẫy, boss, kho báu.
- Độ khó tự chọn (Phàm/Linh/Bảo/Tiên) → thưởng tăng.
- Có **cơ chế thời gian & linh khí**: càng ở lâu càng nguy hiểm, càng nhiều thưởng.

## Cảm giác "thế giới sống"
- **Thời tiết & ngày đêm**, quái đổi theo giờ.
- **Linh khí động**: vùng linh khí đậm di chuyển theo ngày, kéo người chơi đi.
- **Tin đồn & Thiên Cơ Các**: bảng tin hé lộ sự kiện sắp tới.

## Điều giữ chân người chơi (hook)
| Hook | Cách làm |
|---|---|
| **Mục tiêu ngắn / trung / dài hạn luôn hiện** | Tracker nhiệm vụ, "Huyết Thư" |
| **Vòng thưởng nhỏ** | Mỗi 3–5 phút có thứ nhặt/mở/khám phá |
| **Nghịch tập thấy được** | Kẻ từng khinh thường gặp lại, thay đổi thái độ |
| **Đa dạng build** | Combo, đồ ngẫu nhiên, nhánh, set |
| **Bình cảnh có ý nghĩa** | Không chỉ cày: cơ duyên, quyết định |
| **Cảm xúc** | Quay về làng cũ đã đổi khác, mất mát, đồng hành |
| **Bí mật** | Boss ẩn, công pháp thất truyền, kết cục ẩn |
| **Hằng ngày nhẹ** | Nhiệm vụ ngày, thiền định, hái thuốc (không phạt khi nghỉ) |
| **Sự kiện mùa** | Trang phục + cốt truyện nhỏ |

## Điều cần tránh
- Mở quá nhiều hệ thống cùng lúc (xem 10).
- Cày vô nghĩa không có lý do cốt truyện.
- Bản đồ rộng nhưng trống.
- Một build "đúng duy nhất".
- Bán sức mạnh bằng tiền thật.
- Chết = mất nhiều (tránh ức chế).

## Đo lường (playtest)
- Có người **lạc đường** không? (heatmap chết/đứng lâu)
- Có hệ thống bị bỏ quên không? (tỉ lệ dùng rèn/đan/thời trang)
- Điểm bỏ ngang (chương nào rơi nhiều nhất)?
