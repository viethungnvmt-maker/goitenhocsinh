# 🎯 Hệ Thống Gọi Tên — 12 Chế Độ Ngẫu Nhiên

Ứng dụng gọi tên học sinh ngẫu nhiên với 12 chế độ mini-game tương tác vui nhộn, dành cho giáo viên khuấy động lớp học.

![Vietnamese](https://img.shields.io/badge/language-vi-red) ![React](https://img.shields.io/badge/React-19-61dafb) ![Vite](https://img.shields.io/badge/Vite-6-646cff) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Tính năng

- **12 mini-game chọn tên**: 🎡 Vòng Quay, 🦆 Đua Vịt, 🎰 Máy Jackpot, 💣 Bom Nổ Chậm, 🎲 Xúc Xắc, 🎯 Phóng Phi Tiêu, 🃏 Rút Bài Tarot, ⚪ Plinko, 🌧️ Mưa Tên, 🎈 Bắn Bong Bóng, 🪝 Máy Gắp Thú, 💌 Thư Bí Ẩn.
- **3 giao diện**: 🌙 Tối (neon sci-fi) · ☀️ Sáng (sạch sẽ chuyên nghiệp) · 🧀 Phô Mai Que (pastel cute kawaii).
- **Âm thanh đặc sắc**: nhạc nền ambient theo theme, SFX gay cấn (drumroll, whoosh, suspense, win fanfare) sử dụng [Tone.js](https://tonejs.github.io/).
- **Nhập danh sách linh hoạt**: dán văn bản, tải `.xlsx`, `.xls`, `.csv`, `.docx`, `.txt`.
- **Tự lưu** danh sách lớp, lịch sử gọi, theme vào `localStorage`.

## 🚀 Chạy cục bộ

**Yêu cầu:** Node.js ≥ 18

```bash
npm install
npm run dev
```

Mở http://localhost:3000 trên trình duyệt.

## 🛠 Build

```bash
npm run build        # output vào dist/
npm run preview      # chạy thử build production
npm run lint         # typecheck với tsc
```

## ☁️ Deploy lên Vercel

### Cách 1 — Qua GitHub (khuyến nghị)

1. Tạo repo mới trên GitHub, push toàn bộ project lên.
2. Truy cập [vercel.com/new](https://vercel.com/new), chọn **Import Git Repository**.
3. Chọn repo vừa tạo. Vercel sẽ tự phát hiện framework **Vite** và dùng cấu hình trong [`vercel.json`](./vercel.json).
4. Nhấn **Deploy**. Xong! 🎉

### Cách 2 — Qua Vercel CLI

```bash
npm i -g vercel
vercel           # deploy preview
vercel --prod    # deploy production
```

### Build settings (Vercel tự nhận)

| Cài đặt | Giá trị |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node version | 18.x hoặc mới hơn |

App không cần biến môi trường nào để chạy — chạy 100% client-side.

## 📁 Cấu trúc

```
src/
├── App.tsx              # Shell: header, sidebar, game grid, modal
├── games/               # 12 mini-game (mỗi game 1 file)
├── lib/
│   ├── audio.ts         # Tone.js SFX + ambient music theo theme
│   ├── storage.ts       # localStorage: danh sách, lịch sử, theme
│   └── utils.ts         # shuffle, pickRandom, cn
├── index.css            # Theme CSS variables (dark/light/cute)
└── types.ts             # GameProps interface
```

## 🎨 Thêm theme mới

Mở [`src/index.css`](./src/index.css), thêm một block `[data-theme="tên-theme"]` với các CSS variable:
`--bg, --text, --surface, --accent, --accent-rgb, --warn, --warn-rgb, ...`. Rồi thêm vào `THEMES` trong [`src/App.tsx`](./src/App.tsx).

## 🎮 Thêm game mới

1. Tạo `src/games/YourGame.tsx` export default component nhận `GameProps` (`students`, `onWinner`, `onClose`).
2. Gọi `onWinner(name)` khi có kết quả — shell sẽ tự xử lý confetti + lịch sử.
3. Export từ `src/games/index.ts`.
4. Thêm entry vào mảng `GAMES` trong `src/App.tsx`.

## 📜 Giấy phép

MIT.
