# 04 · Chiến đấu

## Lựa chọn: theo lượt, dùng **thanh thời gian (CTB)**
Không dùng "mỗi lượt cố định + ra 2–3 lần nếu nhanh gấp N" vì Tốc Độ cao sẽ **khóa cứng** đối thủ. Thay vào đó mỗi hành động có **độ trễ** và Tốc Độ rút ngắn độ trễ ấy → người nhanh **tự nhiên đi nhiều lần hơn**, đúng ý "Tốc Độ gấp bao nhiêu lần thì ra bấy nhiêu lần", nhưng liên tục và có chiến thuật.

### Quy tắc
1. Mỗi đơn vị có `nextAt`. Ai nhỏ nhất đi trước (hòa → Tốc cao hơn trước).
2. Khởi đầu: `nextAt = 10000 / Tốc độ hiệu dụng`.
3. Sau khi ra chiêu: `nextAt += cost × 100 / Tốc độ hiệu dụng`.
   - `cost` của chiêu: đòn nhanh ~55–70, thường 100, nặng 130–160.
   - Chiêu nặng đẩy lượt sau xa hơn → **đánh đổi nhịp**.
4. **Thanh timeline** phía trên màn hình hiện 9 lượt kế tiếp (dự đoán bằng cùng công thức) để người chơi tính toán.
5. Nhấn "Đan" (dùng vật phẩm) tốn +100 độ trễ.

### Chống lạm dụng Tốc Độ
| Cơ chế | Giá trị | Lý do |
|---|---|---|
| **Softcap** | Trên 150, chỉ tính 50% phần vượt | Tốc 250 → hiệu dụng 200 |
| **Giới hạn liên tiếp** | Tối đa **3** hành động liền nhau | Bên kia luôn kịp phản ứng |
| Chiêu rất nhanh sát thương thấp | power 0.55–0.7 | Tốc độ ≠ thắng tuyệt đối |
| Boss kháng/ phản | (kế hoạch) Boss có "Kiên Định": giảm hiệu quả giảm tốc | Tránh slow-lock |
| Trạng thái Chậm Chạp | -30% Tốc, 3 hành động | Có phản chế |

Ví dụ kiểm thử (đã có unit test): Tốc 100 vs 50 → tỉ lệ hành động ≈ 2:1; Tốc 1000 vs 50 → tối đa 3 hành động liền.

## Sát thương
```
base   = Công × power_chiêu − Thủ_mục_tiêu × 0.5
dmg    = max(1, base × ngũ_hành × random(0.95–1.05) × combo × (bạo kích 1.5) × (giảm sát thương trạng thái))
```
- **Ngũ hành**: khắc ×1.3, bị khắc ×0.8, trung tính ×1.
- **Bạo kích**: xác suất theo chỉ số `crit`, ×1.5.
- **Thủ**: giảm 50% giá trị trừ thẳng vào sát thương (tránh Thủ cao miễn nhiễm hoàn toàn nhờ `max(1, ...)`).

## Trạng thái (và combo "tag")
| Trạng thái | Loại | Hiệu quả | Thời lượng (hành động của chủ thể) |
|---|---|---|---|
| Phá Giáp | Debuff | Thủ ×0.6 | 3 |
| Bỏng | DoT | 6% HP tối đa/lần | 3 |
| Chậm Chạp | Debuff | Tốc ×0.7 | 3 |
| Khiên | Buff | Sát thương nhận ×0.5 | 3 |

**Combo bằng tag**:
- Chiêu có thể **`gives`** (gieo) một trạng thái lên mục tiêu.
- Chiêu khác **`requires`** trạng thái đó trên mục tiêu (hoặc trên chính mình với `requiresOn: "self"`) → **bonus ×1.3–1.6** và **tiêu trạng thái** (nếu trên mục tiêu).
- Ví dụ: *Nhất Thiểm* (gieo Phá Giáp) → *Phong Cuồng Kiếm Vũ* (cần Phá Giáp, ×1.6).
- Người chơi tạo **bộ combo (preset)**: chuỗi chiêu thứ tự cố định; nút "Combo ▶" trong trận chạy chiêu kế tiếp còn đủ MP. Có **3 preset**, **số ô = 3 + 2 × (chỉ số cảnh giới)** (Luyện Khí 3 → Trúc Cơ 5 → Kết Đan 7…).
- Huy hiệu `COMBO xN` hiện khi chạm cộng hưởng, N là số cộng hưởng liên tiếp trong cùng chuỗi hành động.

## Cơ chế mở rộng (đã làm)
| Cơ chế | Mô tả | Dùng bởi |
|---|---|---|
| **Hy sinh máu** (`hpCost`) | Dùng chiêu tốn % HP tối đa; không cho dùng nếu sẽ tự sát | Ma Tu |
| **Bẫy** (trạng thái `trap`) | Đặt lên đối thủ; **nổ khi họ hành động**: gây % HP tối đa và đẩy lượt kế lùi thêm | Phù Trận Tu |
| **Độc** (DoT %) | Gây sát thương theo % HP tối đa mỗi lượt của mục tiêu | Đan Tu |
| **Hồi cho đồng đội** (`target: ally`) | Hồi người yếu nhất phe mình | Đan Tu, đồng hành |
| **Boss nhiều pha** (`phases`) | Khi HP dưới ngưỡng: đổi bộ chiêu, tăng Công/Tốc, hồi một phần, hiện thông báo + rung màn hình | Huyết Ảnh Trưởng Lão (70% & 35%) |
| **Chiêu riêng của địch** (`branch: "enemy"`) | Địch dùng bản sao chiêu riêng, **chỉnh cân bằng người chơi không làm boss mạnh lên** | Boss, đệ tử Huyết Ảnh Môn |

## Cân bằng bằng mô phỏng tự động
`npm run sim` cho mỗi nhánh tự đánh hàng trăm trận (AI chơi cả hai phe, không dùng đan/trang bị/combo thủ công) trước từng nhóm địch. Số liệu được chỉnh theo kết quả này, và **được khóa bằng unit test** (`tests/systems.test.ts`).

```
Kịch bản             kiem_tu        the_tu         phap_tu        dan_tu         phu_tran_tu    ma_tu         
LK1 vs 1 Sói         100% hp39      100% hp39      100% hp39      100% hp39      100% hp39      100% hp39     
LK5 vs 2 Sói         100% hp46      100% hp46      100% hp46      100% hp46      100% hp46      100% hp46     
LK9 vs Đệ tử HAM     100% hp17      100% hp17      100% hp17      100% hp17      100% hp17      100% hp17     
TC5 vs Ma Tu         100% hp71      100% hp84      100% hp80      100% hp79      100% hp76      100% hp57     
TC5 vs Boss          45% hp9        77% hp15       49% hp63       41% hp61       54% hp10       51% hp10      
TC9 vs Boss          99% hp23       100% hp41      100% hp66      100% hp68      99% hp20       99% hp25
```
(Ô: `tỉ lệ thắng` và `HP còn lại trung bình khi thắng`. Trước Trúc Cơ chưa có nhánh nên các cột giống nhau.)

**Mục tiêu thiết kế đã kiểm tra bằng test**
- Trước Trúc Cơ: thắng quái cùng tầng ≥ 90% nhưng **mất đáng kể HP** (không bao giờ "đi dạo").
- **Boss Trúc Cơ 5: mọi nhánh thắng 25–90%**, chênh giữa nhánh mạnh nhất và yếu nhất < 45 điểm % → cần chuẩn bị (đan, trang bị, combo, đồng đội), không bất khả thi, không nhánh nào áp đảo.
- Vượt tầng (Trúc Cơ 9) thắng boss **dễ hơn rõ rệt** → cày thật sự có ý nghĩa.
- Lưu ý: AI mô phỏng thô nên Thể Tu (có khiên) nhỉnh hơn; người chơi dùng combo giỏi sẽ thay đổi bảng này.

## MP / tài nguyên
- Chiêu cơ bản không tốn MP, chiêu mạnh tốn.
- Hồi nhẹ **+2 MP mỗi hành động**, hồi lớn bằng đan Hồi Linh.
- Mỗi nhánh có **tài nguyên riêng** (xem 05): Kiếm Ý, Huyết Khí… (giai đoạn sau).

## AI kẻ địch
`aiPick`: chấm điểm theo `power`, cộng điểm nếu có cộng hưởng sẵn trên mục tiêu, ưu tiên hồi máu khi thấp, thêm nhiễu ngẫu nhiên. Boss có kịch bản theo pha (kế hoạch: đổi chiêu ở 70% / 40% HP).

## Cân bằng ban đầu (mục tiêu)
- Quái cùng cảnh giới: người chơi thắng trong **4–6 hành động**, mất 20–35% HP.
- Quái hơn 1 tầng: thắng sát nút nếu dùng combo.
- Quái hơn 1 cảnh giới: bắt buộc có chiến thuật (khắc hệ, đan, khống chế).
- Boss: 10–20 hành động, có 2–3 pha.

## Giao diện chiến đấu (cảm ứng được)
- Nút kỹ năng ≥ 98×26 px (logic 640×360), chạm là ra.
- Chạm quái để chọn mục tiêu (dấu ▼).
- Timeline luôn hiện; trạng thái liệt kê dưới timeline.
- "Bỏ chạy" bị khóa ở boss.

## Thắng / thua
- Thắng: Tu vi (EXP), rơi đồ theo bảng `drops`, tiền Linh thạch, cập nhật nhiệm vụ.
- Thua: mất 10% Linh thạch, tỉnh lại ở nơi an toàn. **Không mất cấp, không xóa save** (tránh ức chế).
