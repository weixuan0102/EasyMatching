# EasyMatching

EasyMatching 是一個以興趣為基礎的聊天交友平台，支援多重 OAuth 登入、使用者自訂 userID、一對一/群組聊天室與即時配對推薦。

## 核心功能

- **登入註冊**
  - Google、GitHub、Facebook OAuth
  - 首次註冊需設定唯一 `userID`，之後可直接以 `userID` 快速登入
  - 登入紀錄儲存在瀏覽器，可一鍵切換帳號
- **個人資料**
  - 可修改使用者名稱、頭像、自我簡介（最多 100 字）
  - 透過勾選興趣標籤完成 Onboarding
- **匹配推薦**
  - 根據共同興趣推薦使用者，顯示對方基本資料、自我介紹、共同/其他興趣
  - 支援以 `userID` 或使用者名稱搜尋
  - 可直接建立聊天室開始對話
- **聊天室**
  - 左側列出所有對話，支援一對一與群組
  - 即時訊息更新（Pusher）

## 技術棧

- Next.js 16（App Router, TypeScript）
- NextAuth + Prisma + MongoDB
- Material UI, Axios, SWR
- Pusher (即時訊息)

## 環境設定

1. 複製 `.env.example` 為 `.env.local`，並填入實際值（MongoDB、NextAuth、OAuth、Pusher）。
2. 安裝依賴、生成 Prisma Client 與同步資料表：

```bash
yarn install
yarn prisma:generate
yarn prisma:push
yarn prisma:seed
```

3. 本地啟動：

```bash
yarn dev
```

如需同時啟動 MongoDB，可執行 `./start-all.sh`。

## API 重點

- `GET /api/matching?search=`：取得推薦使用者與共同興趣
- `POST /api/conversations`：建立或取得一對一/群組對話
- `GET/PUT /api/user`：取得與更新個人資料
- `GET/PUT /api/user/hobbies`：取得與更新興趣標籤

## 測試與建置

- 程式碼風格檢查：`yarn lint`
- 建置正式版：`yarn build`

## 開發筆記

- `SessionTracker` 會在登入成功後，將 userID 與顯示名稱儲存在瀏覽器，供登入頁快速切換。
- `uid` 為系統內部識別碼，`loginId` 為使用者設定的登入帳號（顯示於側邊欄與搜尋）。
- 匹配結果預設依共同興趣數量排序，同分時以使用者名稱排序。搜尋時會優先顯示符合條件的使用者，即使共同興趣為 0 也會出現在結果中。

