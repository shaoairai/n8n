# 下一步行動指南

拿到這個專案後，按照以下步驟設定並使用。

> **相容版本**: n8n 2.2.4（已驗證）

---

## Step 1: 環境準備 (10 分鐘)

### 1.1 安裝 Docker

如果尚未安裝 Docker：
- **Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `curl -fsSL https://get.docker.com | sh`

### 1.2 複製設定檔

```bash
cd n8n
cp config.env.example config.env
```

---

## Step 2: 取得 API Keys (20 分鐘)

### 2.1 Anthropic API Key (Claude)

1. 前往 [console.anthropic.com](https://console.anthropic.com)
2. 註冊/登入帳號
3. 點選 **API Keys** → **Create Key**
4. 複製 Key，貼到 `config.env` 的 `ANTHROPIC_API_KEY`

> 新帳號有 $5 免費額度，約可產生 50+ 篇文章

### 2.2 Gemini API Key

1. 前往 [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. 點選 **Create API Key**
3. 選擇或建立 Google Cloud 專案
4. 複製 Key，貼到 `config.env` 的 `GEMINI_API_KEY`

> 免費額度：每分鐘 15 次請求

### 2.3 WordPress Application Password

1. 登入你的 WordPress 後台
2. 前往 **使用者** → **個人資料**
3. 滾動到最下方 **應用程式密碼**
4. 名稱輸入 `n8n`，點選 **新增應用程式密碼**
5. 複製產生的密碼（格式：`xxxx xxxx xxxx xxxx xxxx xxxx`）
6. 填入 `config.env`：
   ```
   WP_BASE_URL=https://your-site.com
   WP_USERNAME=你的用戶名
   WP_APP_PASSWORD=剛剛複製的密碼
   ```

---

## Step 3: Google Cloud 設定 (15 分鐘)

### 3.1 建立 Google Cloud 專案

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)
2. 建立新專案（或選擇現有專案）

### 3.2 啟用 APIs

在 **APIs & Services** → **Enable APIs** 啟用：
- Google Sheets API
- Google Drive API

### 3.3 建立 OAuth 憑證

1. 前往 **APIs & Services** → **Credentials**
2. 點選 **Create Credentials** → **OAuth client ID**
3. 應用程式類型：**Web application**
4. 新增授權重新導向 URI：
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
5. 記下 **Client ID** 和 **Client Secret**

### 3.4 取得 Google Sheets ID

1. 建立或開啟你的 Google Sheets
2. **重要**：將工作表名稱改為「**自動化表格**」
3. 從網址複製 ID：
   ```
   https://docs.google.com/spreadsheets/d/[這裡是ID]/edit
   ```
4. 貼到 `config.env` 的 `GOOGLE_SHEET_ID`

### 3.5 設定 Google Sheets 欄位

確保你的 Google Sheets 有以下欄位（第一列為標題）：

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| 關鍵字 | 標題 | 方向 | 素材 | 狀態 | 日期 |

> **注意**：「關鍵字」欄位用於比對回填，必須有值且唯一

### 3.6 取得 Google Drive 資料夾 ID

1. 在 Google Drive 建立資料夾（用於存放生成的圖片）
2. 開啟資料夾，從網址複製 ID：
   ```
   https://drive.google.com/drive/folders/[這裡是ID]
   ```
3. 貼到 `config.env` 的 `GOOGLE_DRIVE_FOLDER_ID`

---

## Step 4: 啟動 n8n (5 分鐘)

```bash
docker-compose up -d
```

開啟瀏覽器前往：http://localhost:5678

首次啟動需要：
1. 建立 n8n 帳號（本地使用，隨意設定即可）
2. 完成初始設定精靈

---

## Step 5: 匯入工作流程 (10 分鐘)

### 5.1 匯入 JSON

1. 在 n8n 左側選單點選 **Workflows**
2. 點選右上角 **...** → **Import from File**
3. 選擇 `workflow-blog-publisher-v2.json`

### 5.2 設定 Credentials

匯入後，你會看到節點有紅色警告。依序設定：

#### Google Sheets OAuth2
1. 點選 `讀取 Google Sheets` 節點
2. 在 Credentials 下拉選 **Create New**
3. 填入 Client ID 和 Client Secret
4. 點選 **Sign in with Google** 完成授權

#### Google Drive OAuth2
1. 點選 `上傳 Google Drive` 節點
2. 同上步驟建立 Google Drive OAuth2 憑證

#### Anthropic API
1. 點選 `Claude Model` 節點
2. 建立 Anthropic API 憑證，填入 API Key

#### HTTP Basic Auth (WordPress)
1. 點選 `上傳圖到 WP` 節點
2. 建立 HTTP Basic Auth 憑證：
   - User: WordPress 用戶名
   - Password: 應用程式密碼

#### SMTP（選用，用於 Email 通知）
1. 點選 `寄信通知-成功` 節點
2. 建立 SMTP 憑證：
   - Host: `smtp.gmail.com`
   - Port: `465`
   - User: 你的 Gmail
   - Password: [應用程式密碼](https://myaccount.google.com/apppasswords)
   - SSL/TLS: 開啟
3. 在 `config.env` 設定 `NOTIFY_EMAIL`

---

## Step 6: 準備測試資料 (5 分鐘)

### 6.1 在 Google Sheets 新增測試資料

| 關鍵字 | 標題 | 方向 | 素材 | 狀態 | 日期 |
|--------|------|------|------|------|------|
| Python 入門教學 | | 初學者導向 | | 待處理 | |

---

## Step 7: 測試執行 (5 分鐘)

1. 在 n8n 開啟工作流程
2. 點選右上角 **Execute Workflow**
3. 觀察每個節點的執行狀態
4. 成功後：
   - 前往 WordPress 後台查看草稿
   - 檢查 Google Sheets 的「狀態」和「日期」是否已更新
   - 檢查信箱是否收到通知（如有設定 SMTP）

---

## 常見問題排解

### "access to env vars denied"
確認 `docker-compose.yml` 有這行：
```yaml
- N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```
重啟容器：`docker-compose restart`

### Google OAuth 錯誤
確認 Redirect URI 完全一致：
```
http://localhost:5678/rest/oauth2-credential/callback
```

### WordPress 401 Unauthorized
1. 確認使用「應用程式密碼」而非登入密碼
2. 確認 REST API 未被安全外掛封鎖
3. 測試：`curl https://your-site.com/wp-json/wp/v2/posts`

### Gemini 圖片生成失敗
1. 確認 API Key 有效
2. 確認未超出配額
3. 嘗試簡化 prompt

### 回填狀態沒更新
1. 確認「關鍵字」欄位有值
2. 確認工作表名稱為「自動化表格」

### Email 通知沒收到
1. 確認已設定 SMTP Credentials
2. 確認 `NOTIFY_EMAIL` 環境變數有設定
3. 檢查垃圾郵件匣

---

## 進階功能

### 設定定時執行

1. 將 `手動觸發` 節點刪除
2. 新增 `Schedule Trigger` 節點
3. 設定 Cron 表達式，例如每天早上 9 點：
   ```
   0 9 * * *
   ```

### 停用 Email 通知

如不需要 Email 通知，可在 n8n 中：
1. 點選 `寄信通知-成功` 節點 → 停用
2. 點選 `錯誤觸發` 節點 → 停用
3. 點選 `寄信通知-失敗` 節點 → 停用

### 批次處理

目前設計為每次處理一筆，如需批次：
1. 移除 `只取第一筆` 節點
2. 加入 `Loop Over Items` 節點包裹處理邏輯

---

## 成本估算

| 服務 | 免費額度 | 超出後價格 |
|------|----------|------------|
| Claude (Anthropic) | $5 | ~$0.015/1K tokens |
| Gemini | 15 req/min | 免費（有上限） |
| Google Sheets | 無限 | 免費 |
| Google Drive | 15 GB | 免費 |
| n8n (自架) | 無限 | 免費 |

**每篇文章估計成本：$0.02 - $0.05**

---

## Workflow 節點總覽

| 節點數 | 連接數 | n8n 版本 | 狀態 |
|--------|--------|----------|------|
| 25 | 22 | 2.2.4 | ✅ 已驗證 |

### 主流程（22 個節點）

```
手動觸發 → 讀取 Sheets → 加入列號 → 篩選待處理 → 只取第一筆 → 檢查有資料
    ↓
Claude 產文 ← Claude Model + JSON 格式化
    ↓
整理文章資料 → Gemini 產圖 → 轉換圖片格式 → 上傳 Drive → 設定公開
    ↓
準備 WP 上傳 → 上傳圖到 WP → 合併 Media 結果 → 建立 WP 草稿
    ↓
輸出結果 → 回填狀態日期 → 完成 → 寄信通知-成功
```

### 錯誤處理（2 個節點）

```
錯誤觸發 → 寄信通知-失敗
```

---

## 需要幫助？

- n8n 官方文件：[docs.n8n.io](https://docs.n8n.io)
- n8n 社群：[community.n8n.io](https://community.n8n.io)
- 本專案 Issues：歡迎提交問題回報
