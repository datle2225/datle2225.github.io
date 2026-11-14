# 09 · Thế giới mở & nội dung

## Dữ liệu bản đồ
Bản đồ nằm ở `src/data/maps/*.json` (lưới ký tự + danh sách NPC, quái, thảo dược, vùng kích hoạt nhiệm vụ). Thêm khu mới = thêm một file JSON. *(Chưa nhập trực tiếp được file của Tiled; xem backlog ở 11.)*

## Bản đồ hiện có (8 map nối nhau bằng cổng)
| Map | Nhạc | Nội dung | Cổng |
|---|---|---|---|
| **Thanh Hà Thôn & Hắc Lâm** (64×40) | overworld | Khởi đầu, tàn tích, giếng cổ, chợ Thanh Hà Tập (3 NPC dịch vụ + Nguyệt Nhi), quái, boss | → Thanh Vân Tông (sau `m1_3`), → Phường Thị (từ Chương 2) |
| **Thanh Vân Tông** (48×34) | sect | Sân tông môn, chính điện, võ trường, Mặc Trần, Quản Sự (nhiệm vụ `s2_1`), Lục Vân Sinh, bảng tin. **Khu an toàn** (không quái) | → Thanh Hà |
| **Huyết Nguyệt Bí Cảnh** (44×32) | tribulation | **Dungeon** Kết Đan: ba phòng quái, hầm dung nham, đại sảnh boss Độc Thủ Tiên Sinh. Linh khí ×2.0 (×2.8 ở linh mạch) nhưng quái hồi sinh sau 20 giây | → Phường Thị (cần Kết Đan) |
| **Hoang Mạc Xích Hỏa** (60×36) | overworld | Sa mạc: xương cát, xương rồng, hồ dung nham, ốc đảo linh khí, doanh trại Mặc Gia (boss #3), lữ khách bán hàng, quái Xích Hỏa Thú / Sa Trùng | → Phường Thị (sau khi Thiên Cơ Các chỉ đường) |
| **Băng Nguyên Cực Bắc** (60×36) | tribulation | Tuyết, thông, hồ băng linh khí ×2.0; quái Băng Lang, Băng Yêu, Huyết Vệ | → Phường Thị, → Tổng Đàn (sau `m3_1`), → Thiên Kiếp Đài (sau khi hạ Môn Chủ) |
| **Huyết Ảnh Tổng Đàn** (48×34) | boss | Dungeon Nguyên Anh: ba phòng, hầm dung nham, huyết trì linh mạch ×3.0, đại sảnh boss Môn Chủ | → Băng Nguyên |
| **Thiên Kiếp Đài** (40×30) | sect | Đài cuối: thảm đỏ, cột đá, linh khí ×2.5 (×3.5 ở tâm), Lục Vân Sinh | → Băng Nguyên |
| **Phường Thị Vân Hải** (56×36) | market | Thiết Phong Lâu (thợ rèn tay nghề 6), Vạn Dược Đường (đan sư tay nghề 7), **Hội Đấu Giá**, Thiên Cơ Các (tin đồn, giao nhiệm vụ Hồi 2), thương gia, vệ binh, quái ngoại ô | → Thanh Hà, Huyết Nguyệt, Hoang Mạc |

## Ngày – đêm & lịch sinh hoạt NPC (đã làm)
- **Một ngày game = 300 giây chơi**, bắt đầu 8:00; trùng chu kỳ nhập hàng của cửa hàng (nhập hàng lúc sáng).
- Màn hình **tối dần từ 18h, tối nhất 21h–4h**, sáng lại từ 4h–7h.
- NPC có **lịch** (`schedule`): thợ rèn, đan sư, tạp hóa, Nguyệt Nhi **về nhà ngủ** (biến mất) lúc 22h–6h và đi ra lại; đi bộ mượt giữa các vị trí. Ban đêm **cửa hàng đóng**, muốn mua phải đợi hoặc gặp **thương nhân bí ẩn** (chỉ xuất hiện ban đêm).

## Cơ duyên ngẫu nhiên (đã làm, `src/data/events.json`)
Đi bộ đủ xa thì thử bốc sự kiện hợp lệ (đúng map, đúng điều kiện, hết thời gian hồi):
| Sự kiện | Điều kiện | Nội dung |
|---|---|---|
| Thương nhân bí ẩn | 18h–6h | Mở cửa hàng đặc biệt (Huyết Sâm, Trúc Cơ Đan…) |
| Tán tu bị thương | – | Cứu (tốn 1 đan, +đạo tâm, +tu vi) hoặc lục túi (–đạo tâm, +linh thạch) |
| Cướp đường | Sau `m1_2` | Đánh hoặc trả 20 LT |
| Suối linh khí | – | Thiền (+tu vi) hoặc lấy nước (Linh Thảo) |
| Ma Tu lang thang | Trúc Cơ+ | Trận đấu với Ma Tu (có thể dạy người chơi về hy sinh máu) |

## Tin đồn (đã làm)
NPC `@rumor` (Bảng Tin, Thiên Cơ Các) chọn ngẫu nhiên 3 tin **phù hợp tiến trình** (cờ, chương, cảnh giới), ví dụ nhắc lại việc bạn tha sói mẹ, hoặc tin về Ma Tu khi bạn đã Trúc Cơ. Dữ liệu: `src/data/rumors.json`.

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
