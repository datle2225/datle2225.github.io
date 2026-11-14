# 07 · Rèn đồ & luyện đan

## A. Rèn đồ (Luyện khí)

### Mục tiêu
**Cùng tên vật phẩm nhưng chỉ số khác nhau**, khiến rèn đồ giống "mở hộp may rủi có kỹ năng", và **mỗi nhánh có đồ riêng**.

### Cấu trúc một món đồ
```
Món đồ = Mẫu rèn (cố định) + Độ hiếm + Chỉ số gốc × hệ số + 0–4 Dòng phụ ngẫu nhiên
```
- **Mẫu rèn** (`items.json → bases`): tên, ô (vũ khí/giáp/...), nhánh, chỉ số gốc, số nguyên liệu.
- **Độ hiếm**: Phàm · Linh · Bảo · Tiên với số dòng phụ `[0–1], [1–2], [2–3], [3–4]` và hệ số `×0.9–1.0 / 1.0–1.15 / 1.15–1.35 / 1.35–1.6`.
- **Dòng phụ** lấy từ bể có trọng số: Công, Thủ, Sinh Lực, Linh Lực, Tốc Độ, Bạo Kích. Mỗi dòng có khoảng giá trị `[min,max]` co giãn theo *điểm chất lượng* + nhiễu ±0.15.

### Điểm chất lượng (0..1)
```
score = 0.45 × phẩm chất nguyên liệu + 0.40 × điểm mini-game búa + min(0.15, cấp nghề × 0.015) + nhiễu(±0.1)
độ hiếm: ≥0.88 Tiên · ≥0.68 Bảo · ≥0.40 Linh · còn lại Phàm
```
→ Người giỏi mini-game + nguyên liệu tốt **tăng xác suất**, nhưng vẫn có yếu tố may mắn (đã test: cùng mẫu cho >15 bộ chỉ số khác nhau trong 30 lần rèn).

### Mini-game búa (kế hoạch; prototype dùng số ngẫu nhiên)
- Thanh nhịp: bấm đúng nhịp búa khi thanh chạy vào vùng sáng; 3–5 nhịp mỗi lần rèn.
- Vùng sáng hẹp dần theo độ hiếm mục tiêu.
- Có chế độ **tự động** (điểm trung bình) cho người không thích mini-game.

### Can thiệp vào kết quả (giảm "gacha thuần")
| Công cụ | Tác dụng | Mở |
|---|---|---|
| **Khóa dòng phụ** | Giữ 1 dòng khi rèn lại (đã có trong `forge()`) | Trúc Cơ |
| **Khắc văn** | Thêm 1 dòng chỉ định (tốn vật liệu hiếm) | Kết Đan |
| **Khảm ngọc** | Ô socket thêm hiệu ứng | Kết Đan |
| **Tái rèn** | Đập đồ lấy nguyên liệu 50% | Trúc Cơ |
| **Bản mệnh hóa** | Một pháp bảo lớn lên cùng người chơi | Nguyên Anh |

### Đồ theo nhánh
| Nhánh | Vũ khí | Giáp | Phụ kiện |
|---|---|---|---|
| Kiếm Tu | Phi kiếm | Kiếm y | Kiếm bội |
| Thể Tu | Quyền sáo | Chiến giáp | Hộ uyển |
| Pháp Tu | Pháp trượng | Đạo bào | Linh bội |
| Đan Tu | Đan lô | Dược đại | – |
| Phù/Trận Tu | Phù bút | Trận kỳ | – |
| Ngự Thú Tu | Thú bội | Linh thú hoàn | – |
| Ma Tu | Ma đao | Huyết y | – |
| Âm Tu | Cổ cầm | Tiêu sáo | – |

Mỗi nhánh có **bộ trang bị set** (2/4 món) với hiệu ứng đổi luật chơi (ví dụ set Kiếm: Nhất Thiểm miễn MP).

### Nguyên liệu
`Huyền Thiết` (ore), `Da Sói` (mat), thêm Tinh Thiết, Hàn Ngọc, Xích Diễm Thạch… theo vùng. Vùng nguy hiểm hơn → nguyên liệu phẩm chất cao hơn.

---

## B. Luyện đan

### Mục tiêu
Đan dược **bổ sung tu vi** (đường tắt cho Tàn Căn), **hồi máu/mana**, **hộ kiếp**, và **bán lấy tiền**. Mỗi nhánh có **đan đặc biệt**.

### Công thức (`recipes.json`)
| Đan | Nguyên liệu | Hiệu quả | Giá gốc | Độ khó |
|---|---|---|---|---|
| Hồi Huyết Đan | 2 Linh Thảo | Hồi 35% HP | 20 | 1 |
| Hồi Linh Đan | 3 Linh Thảo | Hồi 40% MP | 28 | 1 |
| Tụ Khí Đan | 4 Linh Thảo + 1 Huyết Sâm | +120 tu vi | 60 | 2 |
| Trúc Cơ Đan | 3 Huyết Sâm + 6 Linh Thảo | Giảm 15% sát thương lôi kiếp | 400 | 4 |
| Kiếm Ý Đan *(Kiếm)* | 2 Huyết Sâm + 1 Huyền Thiết | +900 tu vi | 260 | 3 |
| Huyết Khí Đan *(Thể)* | 3 Huyết Sâm | +900 tu vi | 260 | 3 |

### Chất lượng
```
q = hỏa hầu − (độ khó − 1) × 0.06 + nhiễu(±0.05)
q < 0.15: lò nổ, mất nguyên liệu
phẩm = ⌈q × 9⌉  (1–9)
đan văn = 3 nếu q>0.92, 2 nếu >0.8, 1 nếu >0.6, còn lại 0
hiệu lực = 0.7 + q × 0.6 + đan văn × 0.1
giá = giá gốc × (0.6 + q × 0.8) × (1 + 0.25 × đan văn)
```

### Mini-game hỏa hầu (kế hoạch)
- Thanh nhiệt dao động; giữ trong vùng xanh bằng chạm giữ/nhả. Đan khó thì vùng hẹp hơn, nhiệt thay đổi nhanh hơn.
- Có "tâm pháp" nghề phụ để mở thêm kỹ thuật (bơm hỏa, đảo lò).

### Đan phương
- Học từ: nhiệm vụ phụ, cửa hàng (Vạn Dược Cốc), di tích, bản đồ kho báu.
- Có **đan phương thất truyền** cần ghép mảnh.

### Thị trường đan
- Giá đan dao động theo **nhu cầu vùng và sự kiện** (ví dụ chiến tranh → Hồi Huyết Đan tăng 2×).
- Mở **Đan Hội**: đấu giá, đơn đặt hàng NPC, thi đấu luyện đan.
