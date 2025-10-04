# Trang Web Chúc Mừng Trung Thu 🎑

Một trang web nhỏ tạo hiệu ứng thả lồng đèn Trung Thu, có popup lời chúc và nhạc nền.

## 📁 Cấu trúc thư mục
```
/project-root/
├── index.html
├── style/
│   ├── style.css
│   └── Nhac.mp3        (bạn tự thêm file nhạc Trung Thu vào đây, tên giữ nguyên)
├── js/
│   └── script.js
├── images/
│   ├── image1.png      (thêm hình lồng đèn / bánh / quà)
│   └── image2.png
└── data/
    └── messages.json
```

## 🚀 Chạy dự án
Do trình duyệt chặn `fetch` file JSON khi mở trực tiếp bằng `file://`, bạn nên chạy qua một server tĩnh đơn giản.

### Cách 1: PowerShell (Windows 10+ có Python?)
Nếu bạn có Python:
```powershell
python -m http.server 5500
```
Sau đó mở: http://localhost:5500

### Cách 2: Node (cài đặt http-server toàn cục)
```powershell
npm install -g http-server
http-server -p 5500
```

### Cách 3: Dùng VS Code Live Server Extension
Cài extension "Live Server" rồi bấm "Go Live" tại `index.html`.

## 🎵 Nhạc nền
- File nhạc: `style/Nhac.mp3` (bạn tự cung cấp).
- Trình duyệt có thể chặn autoplay. Khi đó sẽ hiện nút "Phát nhạc 🎵" góc trái dưới.
 - Nếu gặp lỗi 404 `Nhac.mp3` hãy kiểm tra: tên file đúng PHÂN BIỆT HOA THƯỜNG, đặt đúng trong thư mục `style/`.

## 🏮 Lồng đèn
- Sinh ngẫu nhiên theo thời gian (1–3 cái / đợt).
- Tọa độ ngang, kích thước, độ trôi ngang (drift) và tốc độ bay được random.
- Hover sẽ hơi phóng to.
- Click hoặc Enter/Space khi focus vào lồng đèn sẽ mở popup.

## 💬 Popup lời chúc
- Dữ liệu lấy từ `data/messages.json` dạng mảng:
```json
[
  { "message": "Chúc bạn một Trung Thu an lành và hạnh phúc! 🌕🎉", "image": "images/image1.png" }
]
```
- Có hiệu ứng làm mờ nền (blur) và khóa cuộn.
- ESC hoặc click ra vùng ngoài hoặc nút × để đóng.

## 🔧 Tuỳ biến
- Thêm / sửa lồng đèn: thêm file ảnh vào `images/` rồi chỉnh mảng `LANTERN_IMAGES` trong `js/script.js`.
- Thay đổi tốc độ sinh: sửa `spawnRateMs` trong `startSpawning()`.
- Thêm hiệu ứng: chỉnh CSS animation `floatUp` hoặc thêm class mới.

## ♿ Truy cập (Accessibility)
- Lồng đèn focus được (tabIndex=0) và bật popup bằng Enter/Space.
- Popup có `aria-modal` và focus vào nút đóng khi mở.

## ❗ Lưu ý Cache
Script có thêm `?_=` vào URL `messages.json` để tránh cache khi phát triển. Có thể bỏ đi khi deploy.

## 📦 Triển khai (Deploy)
Upload toàn bộ thư mục lên bất kỳ static hosting nào (Netlify, Vercel, GitHub Pages). Lưu ý GitHub Pages không cho MP3 autoplay ở một số trình duyệt – người dùng có thể cần nhấn nút.

## 🛠 Khắc phục lỗi 404 thường gặp
| Lỗi 404 | Nguyên nhân khả dĩ | Cách xử lý |
|---------|--------------------|-----------|
| `/style/Nhac.mp3` | Chưa thêm file hoặc tên khác (ví dụ `nhac.mp3`) | Đặt đúng tên `Nhac.mp3` trong `style/` |
| `/images/background.jpg` | File có tên khác (`backgroud.jpg`) hoặc sai đường dẫn CSS | Đổi tên file cho đúng hoặc sửa đường dẫn trong `style.css` |
| `/images/longden/..` | Thiếu ảnh số (ví dụ 5.png) | Thêm file đúng tên vào `images/longden/` hoặc bỏ khỏi mảng `LANTERN_IMAGES` |

Gợi ý kiểm tra nhanh trong PowerShell:
```powershell
Get-ChildItem -Recurse -File | Select-Object FullName
```

## ✅ Việc cần làm thêm (gợi ý)
- Thêm hiệu ứng âm thanh khi mở popup.
- Thêm lựa chọn tắt/mở nhạc.
- Thêm nhiều kiểu lồng đèn khác nhau.

Chúc bạn một mùa Trung Thu thật ấm áp và lung linh! 🌕🏮🥮
