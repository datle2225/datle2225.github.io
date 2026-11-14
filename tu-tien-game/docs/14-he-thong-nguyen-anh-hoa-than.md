# 14 · Trận pháp, Thế lực, Pháp tắc (Nguyên Anh – Hóa Thần)

Ba hệ thống mở cùng cảnh giới (xem `realms.json → unlocks`), vận hành ở **Menu → Nội tình**. Tất cả đều có logic thuần trong `src/core/advanced.ts` và dữ liệu JSON (`formations.json`, `factions.json`, `laws.json`).

## 1. Trận pháp (mở ở Nguyên Anh)
Học một hoặc nhiều **trận**, **bày một trận** và nó áp dụng cho **cả đội** trong mọi trận đấu. Mỗi trận có **lợi và hại** đi kèm (không có trận "tốt tuyệt đối").

| Trận | Giá | Hiệu quả |
|---|---|---|
| Tụ Linh Trận | 600 | +4 linh lực mỗi lần hành động |
| Kim Cương Trận | 800 | Thủ ×1.2, Tốc ×0.92 |
| Phi Phong Trận | 800 | Tốc ×1.12, Thủ ×0.95 |
| Huyết Sát Trận | 1000 | Công ×1.15, nhận thêm 10% sát thương |
| Thái Cực Trận | 1200 | Hồi 3% HP tối đa mỗi lần hành động, Công ×0.95 |

## 2. Thế lực (mở ở Nguyên Anh)
Gia nhập **một** thế lực, tích **điểm cống hiến** để thăng 4 bậc, nhận phúc lợi và **bổng lộc** theo ngày game.

| Thế lực | Điều kiện | Phúc lợi (theo bậc) |
|---|---|---|
| **Thanh Vân Tông** (chính đạo) | Danh vọng chính đạo ≥ 5 | Công +3% → +15%, Thủ +5–10% ở bậc cao |
| **Vạn Dược Cốc** | Không | **Giảm giá mọi cửa hàng** 4% → 15%, HP +5–15% |
| **Huyết Ảnh Tàn Dư** (ma đạo) | Danh vọng ma đạo ≥ 5 | Công +4% → +20%, HP +5–10% |
| **Tán Tu Liên Minh** | Danh vọng tán tu ≥ 2 | **Tu vi +5% → +25%**, Tốc +4–12 |

- **Điểm cống hiến**: hoàn thành nhiệm vụ chính +30, phụ +10, **quyên góp** 10 LT = 1 điểm. Mốc thăng bậc 0 / 100 / 400 / 1200.
- **Bổng lộc**: mỗi ngày game (300 giây chơi) nhận 12–300 LT tùy bậc, **tích tối đa 3 ngày**.
- **Rời thế lực** mất toàn bộ điểm. Danh vọng (chính/ma/tán tu) đến từ các lựa chọn trong hội thoại, nên *lối chơi của bạn quyết định thế lực nào mở cho bạn*.

## 3. Pháp tắc (mở ở Hóa Thần)
Chọn **một** pháp tắc; nó **đổi luật chơi** chứ không chỉ cộng chỉ số. Lần đầu miễn phí, đổi tốn 2000 LT.

| Pháp tắc | Hiệu quả |
|---|---|
| Thời Gian | Ngưỡng mềm của Tốc Độ nâng từ 150 lên 220 |
| Sinh Tử | Hạ gục kẻ địch hồi 10% HP tối đa |
| Hư Không | 12% né hoàn toàn một đòn |
| Ngũ Hành | Khắc hệ ×1.5 (thay vì ×1.3) và không bị phạt khi bị khắc |
| Lôi Đình | Bạo kích +8% và sát thương bạo kích ×1.8 |

## Kiểm thử
- Điều kiện học/bày/rời/gia nhập, đổi giá, giới hạn bổng lộc, cộng điểm từ nhiệm vụ.
- Mỗi hiệu ứng thật sự có tác dụng trong `Battle` (Tụ Linh, Thái Cực, Kim Cương, Huyết Sát; Sinh Tử, Hư Không, Lôi Đình, Ngũ Hành, Thời Gian).
- Mô phỏng: **trận pháp + pháp tắc + thế lực đầy đủ làm trùm Hóa Thần dễ hơn rõ rệt** so với không dùng.

## Giới hạn hiện tại
- Chưa có nhiệm vụ riêng cho từng thế lực (chỉ có điểm cống hiến chung); chưa có xung đột giữa các thế lực.
- Pháp tắc chỉ áp dụng cho nhân vật chính, chưa cho đồng hành.
- Hóa Thần mới có **một vùng nội dung** (Thiên Phong, xem 03). Luyện Hư, Hợp Thể, Đại Thừa và Phi Thăng chưa có nội dung.
