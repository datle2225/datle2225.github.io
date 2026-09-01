# Truyện Đọc

Truyện Đọc là nền tảng đọc truyện nhiều phần gồm hai khu vực: thư viện công khai cho độc giả và không gian biên tập Admin để tạo, sắp xếp, chỉnh sửa hoặc xóa truyện.

## Các luồng chính

| Khu vực | Chức năng |
| --- | --- |
| `/` | Xem thư viện truyện đã xuất bản, tìm theo tên/tác giả và mở trang đọc |
| `/truyen/:slug` | Đọc từng phần, xem mục lục, chuyển phần trước/sau |
| `/admin` | Nhập API key, xem cả draft/published, tạo hoặc chỉnh sửa truyện |
| Admin editor | Nhập metadata, soạn từng phần bằng CKEditor 5, thêm/xóa/sắp xếp phần và lưu một lần |

API key được kiểm tra ở server bằng `ADMIN_API_KEY`. Sau khi xác thực thành công, server cấp cookie phiên `HttpOnly` có thời hạn 8 giờ; mã không được lưu trong localStorage hay bundle frontend. Nội dung HTML từ CKEditor được sanitize bằng allowlist trước khi lưu và một lần nữa trước khi trả về cho trang đọc.

## Cấu hình và chạy cục bộ

Cần có các biến môi trường do scaffold của dự án cung cấp, trong đó `DATABASE_URL` dùng cho MySQL/TiDB và `ADMIN_API_KEY` là mã quản trị bí mật. Không commit file `.env` hoặc ghi API key trực tiếp vào mã nguồn.

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

## Database

Schema nằm trong `drizzle/schema.ts`, migration ban đầu ở `drizzle/0000_strong_patch.sql`. Hai bảng nghiệp vụ là `stories` và `story_parts`; truyện có thể ở trạng thái `draft` hoặc `published`, còn các phần được đánh số liên tục theo thứ tự đọc.

## Lưu ý về GitHub Pages

GitHub Pages chỉ phục vụ file tĩnh và không chạy được Express/tRPC, database, cookie Admin hoặc upload nội dung phía server. Vì vậy bản này được dựng theo scaffold fullstack và cần chạy trên một hosting có Node.js + database + storage. Nếu cần URL dạng `abc.github.com`, cần có một backend fullstack riêng và cấu hình DNS/proxy; chỉ đẩy frontend lên GitHub Pages sẽ không đáp ứng được luồng Admin. Có thể dùng hosting tích hợp của dự án làm backend chính, sau đó gắn custom domain nếu DNS của bạn hỗ trợ.

## Kiểm thử

Bộ kiểm thử hiện bao phủ endpoint API key, CRUD database thật cho draft/published, router authorization, sanitize HTML, helper lỗi mạng và integration React cho error state của Admin list/get.

Phiên bản hiện tại đã được kiểm tra bằng build production và test suite trước khi tạo checkpoint.

## GitHub Pages — phiên bản client-only

Phiên bản này có thể chạy trên GitHub Pages mà không cần backend riêng. GitHub Pages chỉ phục vụ HTML, CSS và JavaScript tĩnh; ứng dụng dùng `stories/index.json` làm mục lục công khai và mỗi chương nằm trong `stories/<slug>/parts/<number>.html`. Public reader tải các file này qua GitHub Contents API khi đã cấu hình repository, hoặc dùng các file trong `client/public/stories` khi chạy bản mẫu chưa cấu hình.

### Cách triển khai nhanh

1. Tạo repository GitHub. Nếu muốn URL dạng `https://TEN_GITHUB.github.io`, đặt tên repository là `TEN_GITHUB.github.io`; nếu dùng repository thường, URL sẽ là `https://TEN_GITHUB.github.io/TEN_REPOSITORY`.
2. Đưa toàn bộ mã nguồn vào repository và giữ workflow `.github/workflows/deploy-pages.yml`.
3. Vào **Settings → Pages**, chọn **GitHub Actions** làm build source. Mỗi lần push vào `main`, workflow sẽ chạy `pnpm build:pages` và deploy thư mục `dist/public`.
4. Cấp quyền `Settings → Actions → General → Workflow permissions` phù hợp để workflow được ghi Pages artifact. Workflow chỉ cần `contents: read`, `pages: write` và `id-token: write`.
5. Vào site sau khi workflow xanh. Các route dùng hash (`#/`, `#/truyen/<slug>`, `#/admin`) để không phụ thuộc server fallback của GitHub Pages.

### Cấu trúc nội dung

`stories/index.json` có dạng `{ "version": 1, "updatedAt": "...", "stories": [...] }`. Mỗi entry chứa `slug`, `title`, `author`, `summary`, `status` (`published` hoặc `draft`), `updatedAt` và mảng `parts`. Chỉ các truyện `published` mới xuất hiện ở public library. Mỗi part có `partNumber`, `title` và `path`; HTML thật được lưu tại path đó.

### Dùng Admin

Admin cần một GitHub fine-grained personal access token được giới hạn vào đúng repository này, với **Contents: Read and write**. Mã token được nhập ở `/admin`, gửi trực tiếp đến GitHub API và chỉ tồn tại trong bộ nhớ của tab hiện tại; mã không nằm trong `VITE_*`, không được commit và không được đưa vào bundle Pages. Khi đóng hoặc tải lại tab, Admin phải nhập lại token.

Mỗi lần lưu chương, ứng dụng ghi Base64 content vào file HTML và cập nhật `stories/index.json`. Khi cập nhật/xóa, ứng dụng dùng `sha` hiện tại để tránh ghi đè âm thầm thay đổi mới hơn. Nếu GitHub trả về conflict hoặc rate limit, Admin sẽ thấy thông báo và cần tải lại trước khi thao tác tiếp.

### Lưu ý bảo mật và vận hành

GitHub Pages là public hosting; mọi file trong repository public đều có thể được đọc. Không lưu token, mật khẩu, dữ liệu riêng tư hoặc nội dung cần bảo mật trong `client/public` hay `stories`. Token nhập ở frontend vẫn là token có thể bị lộ nếu thiết bị/browser bị nhiễm XSS hoặc nếu Admin cấp quyền quá rộng, vì vậy nên dùng fine-grained token một repository, quyền Contents tối thiểu và thời hạn ngắn.

GitHub Contents API phù hợp với thư viện nhỏ và chương truyện vừa phải. Index nên được giữ gọn, mỗi chương là một file riêng, và không nên dùng thư mục có hơn 1.000 mục con khi dựa vào listing directory. Với thư viện lớn, có thể chuyển sang Git Trees API hoặc tạo index phân trang; không nên commit file cực lớn.

### Local configuration

Khi chạy hoặc build thủ công, tạo `.env.local` từ các biến sau: `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`, `VITE_GITHUB_BRANCH` (mặc định `main`) và `VITE_GITHUB_DATA_ROOT` (mặc định `stories`). Không tạo biến `VITE_GITHUB_TOKEN`; token chỉ nhập runtime trong Admin. Build local static bằng `pnpm build:pages`, sau đó preview bằng `pnpm preview:pages`.

Git không lưu thư mục rỗng như một resource riêng. Khi Admin thêm phần mới, Contents API ghi file HTML đầu tiên tại `stories/<slug>/parts/<number>.html` và GitHub tự tạo các directory cha trong commit đó; không cần endpoint tạo thư mục riêng.
