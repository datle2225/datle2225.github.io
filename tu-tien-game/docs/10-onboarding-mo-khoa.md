# 10 · Onboarding & lộ trình mở khóa

## Nguyên tắc
1. **Một cơ chế mới mỗi 30–45 phút chơi.**
2. Mỗi cơ chế mới có **một nhiệm vụ dẫn dắt** (NPC hoặc Lão Đỉnh dạy), có phần thưởng nhỏ ngay.
3. **Chỉ hiện nút/tab khi đã mở** (UI sạch). Hệ thống chưa mở không xuất hiện trong menu.
4. Luôn cho phép **bỏ qua hướng dẫn** và **xem lại hướng dẫn** trong menu.
5. Thất bại ở giai đoạn đầu **không phạt nặng**.

## Lộ trình theo chương (`chapters.json` + `realms.json`)
| Chương | Cảnh giới | Tên | Mở khóa | Học được gì |
|---|---|---|---|---|
| 1 | Luyện Khí 1–3 | Tro Tàn Thanh Hà | Di chuyển, hội thoại, chiến đấu cơ bản, **Tu luyện** | Đi, nói, đánh, tu |
| 2 | Luyện Khí 4–6 | Nhập Thanh Vân Tông | **Cửa hàng**, nhiệm vụ phụ, thời trang cơ bản | Kinh tế, lựa chọn |
| 3 | Luyện Khí 7–9 | Phế Vật Thí Luyện | Đội hình, trang bị | Thứ tự hành động, khắc hệ |
| 4 | **Trúc Cơ** | Lôi Kiếp Đầu Tiên | **Lôi kiếp, Chọn nhánh, Ngự kiếm, Rèn đồ**, lò đan sơ cấp | Build, rèn, hộ kiếp |
| 5 | Trúc Cơ | Phường Thị Vân Hải | Thị trường, đấu giá, tiệm thời trang | Kinh tế sâu |
| 6 | **Kết Đan** | Bí Cảnh Huyết Nguyệt | **Luyện đan đầy đủ, Combo đầy đủ, Bí cảnh** | Combo 7 ô, dungeon |
| 7+ | Nguyên Anh | … | Mạng thứ 2, Trận pháp, Thế lực | Nhánh nâng cao |
| … | Hóa Thần+ | … | Pháp tắc | Endgame |

> Ghi chú prototype: tab "Luyện đan" hiện mở cùng "Rèn đồ" để thử sớm; bản chính thức tách thành Chương 4 (lò sơ cấp) và Chương 6 (đầy đủ).

## Kịch bản 30 phút đầu (trải nghiệm mong muốn)
| Phút | Việc | Cảm giác |
|---|---|---|
| 0–3 | Cảnh mở đầu: lửa cháy, cha ném xuống giếng | **Cảm xúc mạnh, có thù** |
| 3–8 | Tàn tích → gặp Lão Ngư → manh mối | Học di chuyển và nói chuyện |
| 8–15 | Giếng cổ, tìm Cổ Đỉnh, 2 trận sói | Học combat 1v1, nhìn **timeline** |
| 15–20 | Lão Đỉnh dạy **tu luyện**, "phế vật mà có sư phụ" | **Mở khóa tu luyện** |
| 20–30 | Hái thảo dược, nhiệm vụ phụ của Bà Lý | Nhìn thấy thế giới sống, mở đường vào Thanh Vân |

## Hướng dẫn trong game
- **Pop-up ngắn, đúng lúc** (không văn bản dài): "Mỗi con có thứ tự trên thanh trên cùng."
- **Hint khi thất bại**: thua 2 lần liên tiếp → gợi ý khắc hệ/đan.
- **Nhật ký (Huyết Thư)**: xem lại nhiệm vụ và hướng dẫn.
- **Tự giải thích**: hover/giữ vào chiêu để xem chi tiết (cảm ứng: chạm giữ).

## Điểm kiểm soát chất lượng
- 90% người thử phải qua được Chương 1 mà không dùng hướng dẫn ngoài.
- Không có màn hình nào chứa quá 5 lựa chọn quan trọng cùng lúc.
- Cơ chế thứ N chỉ mở khi người chơi đã **dùng thật** cơ chế N-1 (đếm sự kiện).
