# 12 · NPC dịch vụ: Thợ rèn, Đan sư, Tạp hóa

Rèn đồ, luyện đan và cửa hàng **không còn là tab menu** mà là **NPC đứng trên bản đồ** (khu chợ *Thanh Hà Tập*). Người chơi đi tới, nói chuyện, và chọn một trong 4 việc: **Mua · Bán · Thuê · Tự làm**.

## Ba NPC mẫu (`src/data/services.json`)
| NPC | Vai trò | Bán nguyên liệu | Bán đồ có sẵn | Thuê làm | Tay nghề |
|---|---|---|---|---|---|
| **Lão Thiết** (Lò Rèn) | `smith` | Huyền Thiết, Da Sói | 3 món rèn sẵn/ngày (ngẫu nhiên theo mẫu) | Rèn mọi mẫu của nhánh người chơi | 4/10 |
| **Lục Dược Sư** (Đan Phòng) | `alchemist` | Linh Thảo, Huyết Sâm | Hồi Huyết/Hồi Linh/Tụ Khí Đan | Luyện **mọi** đan phương NPC biết (kể cả chưa học) | 5/10 |
| **Chưởng Quầy Tiền** (Tạp Hóa) | `general` | Linh Thảo, Da Sói, Huyền Thiết | Hồi Huyết Đan | – | – |
| Liễu Nguyệt Nhi | Đồng hành | – | – | – | – |
| **Thiết Phong Lâu** (Phường Thị) | `smith` | Huyền Thiết, Da Sói | 4 món rèn sẵn (mọi nhánh) | Rèn mọi mẫu | **6/10** (công 18/quặng) |
| **Vạn Dược Đường** (Phường Thị) | `alchemist` | Linh Thảo, Huyết Sâm (rẻ hơn thôn) | Cả Thanh Tâm Đan, Trúc Cơ Đan | Luyện mọi đan phương | **7/10** |
| **Thương Nhân Bí Ẩn** | `general` | Huyết Sâm, Huyền Thiết (giá hời) | Trúc Cơ Đan, Thanh Tâm Đan | – | – (chỉ xuất hiện ban đêm) |

NPC ở Phường Thị **giỏi hơn nhưng đắt hơn** NPC ở thôn → có lý do đi xa và tích tiền.
Các NPC dịch vụ có **lịch sinh hoạt**: ngủ lúc 22h–6h (tiệm đóng cửa). Xem 09.

## Bốn thẻ trong cửa hàng
1. **Mua**: nguyên liệu (có tồn kho), đan sẵn, **đồ rèn sẵn** (mỗi món là một bản độc nhất với dòng phụ riêng), thời trang (Tạp Hóa).
2. **Bán**: bán lại nguyên liệu/đan/trang bị với **50%** giá trị.
3. **Thuê** (rèn / luyện đan): xem chi tiết dưới.
4. **Tự làm**: mượn lò của NPC để chơi mini-game (cần mở khóa *Rèn đồ* ở Trúc Cơ).

## Thuê NPC làm giúp
**Vì sao thuê?** Người chơi chưa biết phương, chưa đủ cảnh giới, không muốn chơi mini-game, hoặc cần đan/đồ của nhánh khác để bán.

```
Tổng tiền = Tiền công + Nguyên liệu NPC bù (phần người chơi thiếu)
Tiền công rèn   = số quặng của mẫu × tiền công/quặng NPC × (tinh phẩm ×2.2)
Tiền công đan   = giá gốc đan × hệ số công NPC (0.4) × (tinh phẩm ×1.8)
Nguyên liệu bù  = giá gốc × 1.25 (tinh phẩm ×1.8) cho phần thiếu
Chiết khấu quan hệ: ≥30 → -5%, ≥60 → -10%, ≥90 → -15% (áp lên công và nguyên liệu bù)
```
- **Tự đem nguyên liệu → rẻ hơn** (không bị tính phần bù).
- **Hai gói**: *Thường* (nguyên liệu 0.55, tay nghề NPC) và *Tinh phẩm* (nguyên liệu 0.85 hoặc hỏa hầu +0.1, tốn nhiều tiền hơn).
- **Chất lượng** = tay nghề NPC `skill × 0.1 ± nhiễu` đưa vào đúng hàm `forge()` / `brew()` như khi người chơi tự làm → **vẫn ra chỉ số ngẫu nhiên khác nhau**. Thử nghiệm: gói Tinh phẩm cho độ hiếm trung bình cao hơn gói Thường.
- **NPC giỏi hơn người chơi ở đầu game**, nhưng người chơi tự làm với mini-game giỏi có thể vượt NPC → có động lực luyện nghề.
- Mỗi lần thuê tăng **quan hệ +2** với NPC.

### Điều kiện đặc biệt
- NPC đan sư luyện được **đan phương người chơi chưa học** và **đan của nhánh khác** (ví dụ Kiếm Tu thuê luyện Huyết Khí Đan để bán). Người chơi tự luyện thì vẫn cần học phương, đủ cảnh giới, đúng nhánh.
- Thất bại: với các phương hiện có, Đan sư (tay nghề 5) **không thể làm nổ lò** (hỏa hầu thấp nhất ≈ 0.17 > ngưỡng nổ 0.15). Phương khó hơn về sau cần thêm cơ chế hoàn tiền.

## Tồn kho & giá
- **Ngày thế giới** = `⌊thời gian chơi / 300 giây⌋`. Qua ngày → NPC **nhập hàng mới** (cùng ngày cùng hàng, đổi ngày đổi hàng: seed theo `NPC + ngày`).
- **Giá dao động ±15%** theo ngày (cũng seed theo NPC + ngày, nên ổn định trong ngày).
- Đồ rèn sẵn do NPC rèn bằng tay nghề của họ nên **có chất lượng tương ứng NPC**.
- Giá bán đồ rèn sẵn = `1.4 ×` giá trị đồ (giá trị tính từ chỉ số × độ hiếm).

## Mini-game tự làm
| Mini-game | Cách chơi | Điểm → kết quả |
|---|---|---|
| **Búa rèn** | Con trỏ chạy qua lại, bấm khi vào vùng sáng; 5 nhát, tốc độ tăng dần, vùng hẹp theo độ hiếm | Trung bình 5 nhát → `skillScore` của `forge()` |
| **Hỏa hầu** | Giữ nút để tăng lửa, nhả để nguội; nhiệt trôi ngẫu nhiên; vùng xanh hẹp theo độ khó; 9 giây | Tỉ lệ thời gian trong vùng xanh → hỏa hầu của `brew()` |
- Chỉ cần **một nút lớn** (hoặc phím Space) → chơi được trên điện thoại.
- Nút **"Bỏ qua"** = chế độ tự động, điểm 0.3 (dành cho người không thích mini-game).

## Hội thoại với NPC
- Lần đầu: hội thoại giới thiệu (gán cờ `met_*`, tăng quan hệ, tặng phương Hồi Huyết Đan từ Đan sư).
- Các lần sau: hội thoại ngắn có lựa chọn "Xem hàng / Thuê / Tự làm".
- Hội thoại dùng **effect `openShop`** để mở cửa hàng (xem `src/data/dialogues.json`).

## Thêm NPC mới
1. Thêm vào `services.json → vendors` (loại, tay nghề, danh sách bán, công thức…).
2. Thêm NPC vào `maps/<map>.json → npcs` với `vendor` và các `talk` rule.
3. Thêm hội thoại `*_1` (lần đầu) và `*_menu` vào `dialogues.json`.
Không cần sửa code.

## Hội Đấu Giá (đã làm; thay thế cho đấu giá giữa người chơi)
Đấu giá **giữa người chơi cần máy chủ**, game hiện là trang tĩnh nên làm **đấu giá với thương nhân NPC** (không cần mạng):
- **Mỗi ngày game một phiên** gồm 4 lô (trang bị phẩm chất cao 50%, đan hiếm 35%, nguyên liệu 15%), sinh theo seed `ngày` nên ổn định trong ngày. Phiên kết thúc lúc **08:00** sáng.
- Người chơi đặt **giá tối đa** và **bị giữ cọc ngay**. Tăng giá lại phải **≥ +10%**. Rút giá bị **phí 10%**.
- Hết ngày, hệ thống xét: nếu giá bạn **cao hơn mức các thương nhân NPC chịu trả** (ẩn với người chơi) thì **thắng**, và chỉ trả **mức NPC +5%** (giống đấu giá "người trả cao thứ hai"), **hoàn phần dư**; nhận hàng ngay. Thua thì **hoàn đủ**.
- Kết quả hiện ở thẻ "Kết quả" và thông báo khi đang đi ngoài bản đồ.
- NPC Chủ Trì Đấu Giá ở Phường Thị, **đi ngủ ban đêm** như các tiệm khác.
- **Giới hạn:** chưa có cạnh tranh với người chơi thật. Khi có máy chủ có thể thay bộ xét giá bằng giá do người chơi khác đặt mà không đổi giao diện.

## Phân bố cửa hàng theo vùng (mỗi nơi một sở trường)
Không phải map nào cũng đủ ba quầy: **thành/chợ** là nơi mua bán đầy đủ, **vùng ngoài trời** có một đặc sản riêng, **dungeon và cảnh cuối không có cửa hàng** (phải chuẩn bị trước, ăn khớp với giới hạn uống đan của độ khó).

| Bản đồ | Cửa hàng | Đặc sản |
|---|---|---|
| Thanh Hà (đầu game) | Thợ rèn, đan sư, tạp hóa | Mua bán cơ bản |
| Phường Thị | Thợ rèn (6/10), đan sư (7/10), đấu giá, thương nhân đêm | Tay nghề cao hơn thôn, đấu giá |
| Thiên Phong | Thợ rèn (8/10), đan sư (9/10) | Tay nghề cao nhất |
| **Thanh Vân Tông** | **Thương hội tông môn** | Đan chính phái (Tụ Khí, Thanh Tâm, Trúc Cơ, Phá Cảnh), thời trang tông môn; **thành viên Thanh Vân Tông giảm thêm 12%** |
| **Hoang Mạc** | **Mặc Gia Thương Hội** | **Huyền Thiết rẻ nhất** (16 LT so với 22–34 ở nơi khác), tồn kho lớn |
| **Băng Nguyên** | **Trạm thợ săn** | Chỉ tiếp tế: Huyết Sâm, Linh Thảo, Hồi Huyết/Hồi Linh Đan; **không có lò rèn hay đan sư** |
| Bí cảnh, Tổng Đàn, Hư Không, Cổ Chiến Trường, Thiên Môn, Thiên Kiếp Đài | Không có | Phải mang đủ đồ trước |

Cả ba thương hội mới ngủ ban đêm (trừ trạm thợ săn, luôn mở). Test kiểm tra: dungeon không có cửa hàng, không map nào ngoài chợ có đủ rèn + đan, Hoang Mạc rẻ nhất, giảm giá thành viên chỉ áp dụng đúng nơi và đúng thế lực.
