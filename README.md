# 預防保健客服 - 多層引導與自動回覆平台

本專案旨在解決 LINE 官方帳號制式回覆彈性不足的問題。透過建立外部 Webhook 平台，結合視覺化拖拉的後台介面，讓無程式基礎的營運人員也能輕鬆建立「多層次引導」與「懶人包影片卡片 (Flex Message)」。

## 📁 專案架構

本專案採用前後端分離架構 (Monorepo 風格)：

* **`/admin-panel` (前端管理後台)**
    * 技術棧：React (Vite) + Tailwind CSS + Zustand + React Flow
    * 功能：視覺化對話節點編輯、繁體中文 Flex Message 表單建置。
    * 部署建議：**Vercel** (可直接綁定 GitHub 進行全自動化部署)
* **`/functions` (後端 Webhook 邏輯)**
    * 技術棧：Node.js + TypeScript + Firebase Functions + LINE Messaging API SDK
    * 功能：接收 LINE Webhook、比對 Firebase Firestore 節點邏輯、動態組裝 Flex Message 回傳。
    * 部署建議：**Firebase Functions** (搭配 GitHub Actions 實現雲端部署)

## ⚙️ 環境變數與機密資訊設定

在正式部署前，請務必在對應的雲端平台設定以下環境變數 (Environment Variables)，**嚴禁將機密金鑰直接寫在程式碼中**。

### 後端 (Firebase Functions) 需要的環境變數：
請前往 LINE Developers Console 取得以下資訊，並透過 Firebase CLI 或 Google Cloud Secret Manager 設定：
* `LINE_CHANNEL_ACCESS_TOKEN`：LINE 官方帳號的存取權杖。
* `LINE_CHANNEL_SECRET`：LINE 官方帳號的頻道密鑰。

### 前端 (Vercel) 需要的環境變數：
* `VITE_FIREBASE_API_KEY`：Firebase 專案的 API Key。
* `VITE_FIREBASE_PROJECT_ID`：Firebase 專案 ID。

## 🚀 部署策略 (純雲端作業)

由於本專案全程於 GitHub Web 端進行開發，建議的部署流程如下：

1.  **前端部署 (Vercel)**
    * 登入 Vercel，選擇 "Import Project" 並連結此 GitHub 儲存庫。
    * 將 "Framework Preset" 設為 `Vite`。
    * 將 "Root Directory" 設為 `admin-panel`。
    * 填入環境變數後點擊 Deploy。往後只要推送到 `main` 分支，Vercel 就會自動更新。
2.  **後端部署 (Firebase Functions)**
    * 前往 GitHub 儲存庫的 "Settings" -> "Secrets and variables" -> "Actions"。
    * 將 Firebase 的部署憑證 (`FIREBASE_TOKEN` 或 Workload Identity) 存入。
    * 建立一份 `.github/workflows/firebase-deploy.yml`，讓 GitHub Actions 在每次有程式碼推送到 `main` 分支的 `/functions` 目錄時，自動幫您執行 `firebase deploy --only functions`。

## 🔗 LINE Webhook 串接須知

後端部署成功後，Firebase 會配發一組 HTTPS 觸發網址 (例如：`https://asia-east1-<你的專案ID>.cloudfunctions.net/webhook`)。
請將此網址貼回 **LINE Developers Console -> Messaging API -> Webhook URL**，並開啟 "Use webhook"。
