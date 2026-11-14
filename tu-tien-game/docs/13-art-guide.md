# 13 · Hướng dẫn art, bản đồ Tiled và công cụ

## Tình trạng art
Toàn bộ sprite/tile hiện được **vẽ bằng code** (`src/scenes/BootScene.ts`): 22 loại ô, 15 kiểu nhân vật có **khung bước đi 3 pha**, quái có **2 khung nhún nhảy**, nước chuyển động. Đây là **art tạm có chất lượng chấp nhận được để chơi thử, không phải art hoàn thiện**. Cơ chế dưới đây cho phép thay bằng art thật mà **không sửa code**.

### Thay art bằng ảnh thật
1. Vẽ ảnh PNG **16×16** (nhân vật, tile, quái đều cùng cỡ; game tự phóng 2x, giữ pixel sắc nét).
2. Bỏ vào `public/art/`.
3. Khai báo trong `public/art/manifest.json`:
```json
{ "images": {
  "grass": "grass.png",
  "player": "hero.png", "player_w1": "hero_walk1.png", "player_w2": "hero_walk2.png",
  "wolf": "wolf.png", "wolf2": "wolf_b.png"
} }
```
4. Khóa nào có trong manifest sẽ **thay** bản vẽ bằng code; khóa không có vẫn dùng bản code. Có thể thay từng phần.

**Quy ước khóa:** ô nền (`grass`, `path`, `house`…, xem `src/core/tileset.ts`); nhân vật `<tên>`, `<tên>_w1`, `<tên>_w2` (đứng / bước trái / bước phải); quái `<tên>`, `<tên>2` (khung nhún).

## Bản đồ Tiled
Bản đồ là **file JSON chuẩn của Tiled** trong `src/data/maps/` (Tiled 1.10, tile 16px, orthogonal). **Id bản đồ = tên file.**

### Mở và chỉnh trong Tiled
- Mở `src/data/maps/<id>.json` bằng Tiled. Tileset `tileset.png` nằm cùng thư mục (tạo bằng `npm run tileset`).
- **Tile layer** `ground`: các ô nền. Mỗi ô trong tileset có thuộc tính `tex` (tên texture) và `solid` (có chặn đường không). **Không đổi thứ tự ô**, chỉ thêm vào cuối (`src/core/tileset.ts`, có test kiểm tra khớp).
- **Object layer** (tên layer quan trọng):

| Layer | Đối tượng | Thuộc tính |
|---|---|---|
| `npcs` | Point, `name` = id | `label` tên hiển thị · `tex` · `vendor` (id cửa hàng) · `talk` (JSON: danh sách `{if,id}` chọn hội thoại, `@rumor` = tin đồn) · `schedule` (JSON: `[{from,to,x,y,hidden}]` theo giờ game) |
| `enemies` | Point | `group` (id quái, cách nhau dấu phẩy) · `tex` · `minRealm` · `scale` |
| `herbs` | Point | – |
| `signs` | Point | `text` |
| `zones` | Point, `name` = id điểm đến nhiệm vụ | `r` bán kính (ô) · `if` (điều kiện JSON) · `deny` (thông báo) |
| `portals` | Rectangle | `target` (id map) · `arrive` (tên spawn bên map đích) · `if` · `deny` |
| `spawns` | Point | `name`: `spawn` (mặc định) hoặc `from_<map>` |

- **Thuộc tính map**: `name`, `music` (`overworld`, `sect`, `market`, `title`, `battle`, `boss`, `tribulation`).
- Lưu lại (File → Save), game tự nạp mọi `src/data/maps/*.json`. Có **test tự động** kiểm tra: tham chiếu hợp lệ, NPC/thảo dược/cổng **đến được từ điểm xuất hiện** (BFS), không có ai đứng trong tường, cổng nối hai chiều.

### Sinh map bằng script
`npm run maps` chạy `tools/make_maps.py` để sinh lại 3 bản đồ mẫu (Thanh Hà, Thanh Vân Tông, Phường Thị). Script đặt luôn NPC/quái/cổng và đảm bảo mọi thứ đứng trên ô đi được. Dùng khi muốn tạo hàng loạt hoặc để làm nền rồi chỉnh tiếp trong Tiled. **Chú ý:** chạy lại script sẽ ghi đè các chỉnh sửa tay trong Tiled của 3 map đó.

## Công cụ
| Lệnh | Việc |
|---|---|
| `npm run dev` / `build` / `test` | Chạy thử / build ra `play/` / unit test |
| `npm run sim` | **Mô phỏng cân bằng**: mỗi nhánh tự đánh N trận vs địch theo từng mốc cảnh giới |
| `npm run maps` | Sinh lại bản đồ mẫu |
| `npm run tileset` | Xuất `tileset.png` cho Tiled (cần `vite preview` đang chạy) |

## Phím debug
`F` bật/tắt bộ đếm FPS và số đối tượng trên màn hình.
