# 15 · Phần 2 hoàn chỉnh, nhiệm vụ phụ và độ khó

## 1. Đường lên Phi Thăng (Luyện Hư → Đại Thừa)
Sau **Thiên Phong Kiếm Chủ** (xem 03/14), ba vùng mới nối tiếp bằng cổng có điều kiện:

| Vùng | Cảnh giới | Nhiệm vụ | Boss (đều ≥ 3 pha, kháng đảo nhịp) | Cờ |
|---|---|---|---|---|
| **Hư Không Giới** (đảo mây, cầu mây) | Luyện Hư | `m5_1` Lữ Giả Hư Không → `m5_2` | **Hư Không Thủ Hộ** (phân thân, hút sinh khí) | `enemy7_dead` |
| **Cổ Chiến Trường** (cát, xương, dung nham, pháo đài) | Hợp Thể | `m6_1` Chiến Sĩ Vong Linh (hứa cho hắn yên nghỉ hay không → đạo tâm) → `m6_2` | **Chiến Thần Tàn Hồn** (chiến ý, quân đoàn vong linh) | `enemy8_dead` |
| **Thiên Môn** (mây, thảm đỏ, cổng trời) | Đại Thừa | `m7_1` Thiên Môn Chi Linh → `m7_2` | **Thiên Đạo Sứ Giả** (4 pha, phán xét bằng thiên lôi) | `enemy9_dead` |

- Chiêu **chung cho mọi nhánh**: *Thiên Địa Hợp Nhất* (Hợp Thể: sát thương lớn + phá giáp) và *Phi Thăng Chi Kiếm* (Đại Thừa: cộng hưởng phá giáp).
- **Truyền tống** (mở ở Luyện Hư): Menu → Nội tình, 100 LT đến điểm xuất hiện của bản đồ đã từng tới.
- **Phi Thăng**: hạ Sứ Giả → Menu → Độ kiếp → **tâm ma** (cũng bắt buộc) → **Phi Thăng Thiên Kiếp 12 đợt** → đoạn kết **phi thăng theo đạo tâm/lối chơi** (5 biến thể: chính đạo / ma / tán tu / người phá màn đêm / kẻ cùng kẻ thù) → **HẾT GAME**. Vẫn chơi tự do tiếp được.
- **Sửa một lỗi tiến trình lớn**: lực chiến đề xuất để độ kiếp từ Luyện Hư trở lên trước đây **cao hơn khả năng đạt được** (ví dụ 210000 trong khi đạt tối đa ~62000), tức là người chơi sẽ **kẹt vĩnh viễn**. Đã đặt lại bằng ≈ 105% lực chiến tầng 9 của cảnh giới trước (12000 / 28000 / 65000 / Phi Thăng 150000). Ngưỡng cho phép thử là 70%, nên cần trang bị, trận pháp, thế lực… mới đủ chắc.
- Quái và boss của ba vùng được **sinh theo công thức tỉ lệ với người chơi** (HP ≈ 1.6×, Công ≈ 0.72×, Thủ ≈ 0.64× của người chơi mẫu) rồi chỉnh bằng mô phỏng.

## 2. Nhiệm vụ phụ
### 2.1. Mười lăm nhiệm vụ viết tay (có lựa chọn đạo đức)
Sinh từ `tools/side_quests.py` (dữ liệu + hội thoại + NPC), rải ở **9 bản đồ**. Mỗi nhiệm vụ có: lời mời, nhắc việc, hoàn thành, **một lựa chọn có hậu quả** (đạo tâm, linh thạch, quan hệ, danh vọng, cờ) và lời kết. Người chơi **chưa đủ cảnh giới** chỉ gặp NPC bận ("quay lại khi mạnh hơn").

| Vùng | Nhiệm vụ | Hậu quả của lựa chọn |
|---|---|---|
| Thanh Hà | Con trai thôn trưởng · Da sói cho thùng rượu · Hoa cúng Diệp gia | răn dạy ↔ bỏ qua; tiền ↔ đan; chôn tín vật ↔ giữ lại |
| Thanh Vân Tông | Sư đệ bị thương · Dược viên bị phá (học Thanh Tâm Đan) | dạy chiêu ↔ bỏ mặc |
| Phường Thị | Món nợ bị cướp · Lá thư của kẻ lạ · Thợ rèn thiếu quặng | trả tiền ↔ giữ nửa; **đọc thư mở manh mối Lục Vân Sinh** ↔ đốt |
| Hoang Mạc | Đoàn lạc đà | túi vàng ↔ bảo vệ đoàn |
| Băng Nguyên | Ngọn lửa trong băng | **tha hồ ly con (cờ `spared_fox`)** ↔ lấy da |
| Thiên Phong | Thử kiếm Thiên Phong · Đan các thiếu Huyết Sâm | – |
| Hư Không · Cổ Chiến Trường · Thiên Môn | Bóng ảnh quấy nhiễu · Di vật chiến sĩ · Kẻ xin lên Tiên Giới | diệt ↔ tha; chôn kiếm gãy ↔ nghiên cứu; ở lại ↔ đi tiếp |

Phần thưởng tăng theo vùng (tu vi 100 → 2.500.000, linh thạch 40 → 40.000). Bước **"thu thập"** giờ là **nộp vật phẩm trong túi** (trừ đồ khi đủ) thay vì đếm lúc nhặt, nên dùng được với đồ rơi từ quái và đồ mua.

### 2.2. Bảng nhiệm vụ lặp lại (mỗi ngày game một bộ mới)
- NPC "Bảng Nhiệm Vụ" ở **9 vùng**. Mỗi ngày game (300 giây chơi) sinh **4 nhiệm vụ** theo cảnh giới: **săn quái** (quái hợp cảnh giới, không phải boss) hoặc **thu mua** nguyên liệu, độ nguy hiểm ★–★★★.
- Nhận tối đa **3** cùng lúc, bỏ được, không nhận lại cùng một nhiệm vụ. Thưởng linh thạch + tu vi + **danh vọng tán tu** + điểm cống hiến thế lực; thưởng **tăng theo cảnh giới** (có test).

## 3. Làm game khó hơn
| Cơ chế | Mô tả |
|---|---|
| **Độ khó** chọn ở màn hình chính (mặc định **Khó**) | *Thường* (số liệu gốc) · *Khó* (địch HP/Công +10%, Thủ +5%, thưởng +20%, thua mất 15% LT và 10% tu vi) · *Ác mộng* (+25%/+25%/+10%, thưởng +50%, **thua mất 25% LT và 20% tu vi, uống đan tối đa 2 lần, không bỏ chạy**) |
| **Giới hạn uống đan** | Tối đa 3 lần mỗi trận (2 ở Ác mộng): không còn "spam đan" để thắng mọi thứ |
| **Quái tinh anh (★)** | 12% quái thường xuất hiện dạng tinh anh: HP ×1.4, Công ×1.25, Thủ ×1.15, **thưởng gấp đôi** (hiện ★ và ánh đỏ); boss không có |
| **Phạt khi thua** | Mất linh thạch **và tu vi** theo độ khó (tâm ma không bị phạt, chỉ ảnh hưởng đạo tâm) |
| **Lôi kiếp cao cấp** | 9–12 đợt, sét mạnh dần, cần lực chiến đủ 70% mức đề xuất |

### Tỉ lệ thắng của AI mô phỏng (trung bình 8 nhánh, **không dùng đan, trang bị, combo thủ công, trận pháp, pháp tắc**)
```
Kịch bản                Thường   Khó    Ác mộng
LK5 vs 2 Sói             100%    100%      72%
TC5 vs Boss               73%     33%       6%
KĐ5 vs Độc Thủ            87%     72%      26%
NA5 vs Môn Chủ            90%     64%      11%
NA7 vs Lục Vân Sinh       75%     37%       7%
HT5 vs Kiếm Chủ           71%     28%       5%
LH5 vs Thủ Hộ             67%     15%       1%
ĐT7 vs Sứ Giả             60%     34%       8%
```
Người chơi thật có thêm đan, trang bị, combo, trận pháp, pháp tắc, thế lực nên **dễ hơn con số này**; ngược lại AI mô phỏng chơi tốt tới mức nào còn chưa rõ. **Hãy chơi thử và cho tôi biết mức nào hợp.**

## 4. Kiểm thử mới (`tests/phan2.test.ts`, 18 test)
Độ khó (hệ số, tinh anh, boss không tinh anh, phạt, **Khó/Ác mộng hạ tỉ lệ thắng thật**), bảng nhiệm vụ (ổn định, theo cảnh giới, giới hạn, hoàn thành, trả thưởng, dọn dẹp), nộp vật phẩm, **15 nhiệm vụ phụ**: có NPC, đủ hội thoại, chọn đúng hội thoại theo trạng thái, hậu quả lựa chọn, giới hạn cảnh giới; chiêu Hợp Thể/Đại Thừa cho mọi nhánh, chuỗi cổng và cờ boss, Phi Thăng (cần tâm ma, 12 đợt, đặt cờ), 5 đoạn kết, cân bằng Luyện Hư → Đại Thừa.
Bản đồ mới đều qua kiểm tra **đường đi BFS**: mọi NPC, thảo dược, cổng đều tới được.
