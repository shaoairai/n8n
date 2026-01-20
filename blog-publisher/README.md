# SEO Blog Auto Publisher

自動化 SEO 部落格發布工作流程，結合 AI 產文與產圖功能。

> **相容版本**: n8n 2.2.4（已驗證）

## 功能概述

```
Google Sheets → Claude AI 產文 → Gemini 產圖 → Google Drive → WordPress 草稿 → 回填狀態 → Email 通知
```

- **讀取關鍵字**：從 Google Sheets 讀取待處理的 SEO 關鍵字
- **AI 產文**：使用 Claude 生成符合 E-E-A-T 原則的 SEO 文章
- **AI 產圖**：使用 Gemini 生成專業部落格封面圖
- **自動上傳**：圖片上傳至 Google Drive 並設為公開
- **建立草稿**：在 WordPress 建立文章草稿，含精選圖片
- **自動回填**：完成後更新 Google Sheets 狀態與日期
- **Email 通知**：成功或失敗時自動寄信通知

---

## 系統需求

- Docker & Docker Compose
- Google Cloud 帳號（Sheets、Drive OAuth）
- Anthropic API Key（Claude）
- Google AI Studio API Key（Gemini）
- WordPress 網站（需啟用 REST API）
- SMTP 郵件伺服器（選用）

---

## 快速開始

### Step 1: 環境設定

```bash
# 回到上層目錄設定共用環境
cd ..
cp config.env.example config.env

# 編輯 config.env 填入以下設定
```

**必要環境變數**：

```env
# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxx

# Google Gemini
GEMINI_API_KEY=AIzaSyxxxxxx

# Google Sheets ID
GOOGLE_SHEET_ID=1ABC123xxxxxx

# Google Drive 資料夾 ID
GOOGLE_DRIVE_FOLDER_ID=1XYZ789xxxxxx

# WordPress
WP_BASE_URL=https://your-site.com
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Email 通知（選用）
NOTIFY_EMAIL=your-email@example.com
```

### Step 2: 取得 API Keys

#### Anthropic API Key (Claude)

1. 前往 [console.anthropic.com](https://console.anthropic.com)
2. 建立 API Key
3. 貼到 `config.env` 的 `ANTHROPIC_API_KEY`

> 新帳號有 $5 免費額度，約可產生 50+ 篇文章

#### Gemini API Key

1. 前往 [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. 建立 API Key
3. 貼到 `config.env` 的 `GEMINI_API_KEY`

#### WordPress Application Password

1. 登入 WordPress 後台 → **使用者** → **個人資料**
2. 滾動到 **應用程式密碼** → 新增
3. 填入 `config.env`

### Step 3: Google Cloud 設定

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)
2. 建立新專案
3. 啟用 APIs：
   - Google Sheets API
   - Google Drive API
4. 建立 OAuth 憑證：
   - 應用程式類型：Web application
   - 重新導向 URI：`http://localhost:5678/rest/oauth2-credential/callback`
5. 記下 **Client ID** 和 **Client Secret**

### Step 4: 準備 Google Sheets

建立工作表名稱為「**自動化表格**」，設定欄位：

| 關鍵字 | 標題 | 方向 | 素材 | 狀態 | 日期 |
|--------|------|------|------|------|------|
| Python 入門 | | 初學者導向 | | 待處理 | |

> **注意**：「關鍵字」欄位用於比對回填，必須有值且唯一

### Step 5: 匯入工作流程

1. 啟動 n8n：`docker-compose up -d`（在上層目錄）
2. 開啟 http://localhost:5678
3. **Workflows** → **Import from File** → 選擇 `workflow.json`
4. 設定 Credentials（見下方）

### Step 6: 設定 Credentials

| 節點 | Credential 類型 | 設定 |
|------|-----------------|------|
| 讀取 Google Sheets | Google Sheets OAuth2 | Client ID + Secret |
| 上傳 Google Drive | Google Drive OAuth2 | Client ID + Secret |
| Claude Model | Anthropic API | API Key |
| 上傳圖到 WP | HTTP Basic Auth | WP 帳號 + 應用程式密碼 |
| 寄信通知-成功 | SMTP | 郵件伺服器設定 |

### Step 7: 測試執行

1. 確認 Google Sheets 有「待處理」的資料
2. 點選 **Execute Workflow**
3. 檢查結果：
   - WordPress 後台應有新草稿
   - Google Sheets 狀態更新為「已完成」
   - 收到 Email 通知（如有設定）

---

## 工作流程節點說明

共 25 個節點：

| 節點 | 類型 | 版本 | 功能 |
|------|------|------|------|
| 手動觸發 | `manualTrigger` | 1 | 手動執行 |
| 讀取 Google Sheets | `googleSheets` | 4.5 | 讀取資料 |
| 加入列號 | `code` | 2 | 記錄列號 |
| 篩選待處理 | `filter` | 2 | 篩選狀態 |
| 只取第一筆 | `limit` | 1 | 限制數量 |
| 檢查有資料 | `if` | 2 | 條件分支 |
| Claude 產文 | `agent` | 1.7 | AI 產文 + 自動重試 |
| Claude Model | `lmChatAnthropic` | 1.2 | Claude 模型 |
| JSON 格式化 | `outputParserStructured` | 1.2 | 解析輸出 |
| 整理文章資料 | `code` | 2 | 整理資料 |
| Gemini 產圖 | `httpRequest` | 4.2 | AI 產圖 |
| 轉換圖片格式 | `code` | 2 | Base64 轉 Binary |
| 上傳 Google Drive | `googleDrive` | 3 | 上傳圖片 |
| 設定公開 | `googleDrive` | 3 | 設定權限 |
| 準備 WP 上傳 | `code` | 2 | 整理資料 |
| 上傳圖到 WP | `httpRequest` | 4.2 | 上傳媒體 |
| 合併 Media 結果 | `code` | 2 | 合併結果 |
| 建立 WP 草稿 | `httpRequest` | 4.2 | 建立文章 |
| 輸出結果 | `code` | 2 | 整理輸出 |
| 回填狀態日期 | `googleSheets` | 4.5 | 更新狀態 |
| 完成 | `code` | 2 | 完成訊息 |
| 寄信通知-成功 | `emailSend` | 2.1 | 成功通知 |
| 錯誤觸發 | `errorTrigger` | 1 | 捕捉錯誤 |
| 寄信通知-失敗 | `emailSend` | 2.1 | 失敗通知 |

---

## 常見問題

| 問題 | 解決方案 |
|------|----------|
| access to env vars denied | 確認 docker-compose.yml 有 `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` |
| WordPress 401 | 使用「應用程式密碼」而非登入密碼 |
| Gemini 產圖失敗 | 確認 API Key 有效且未超出配額 |
| 回填狀態沒更新 | 確認「關鍵字」欄位有值且唯一 |
| Google OAuth 錯誤 | 確認 Redirect URI 完全一致 |

---

## 成本估算

| 服務 | 免費額度 | 每篇成本 |
|------|----------|----------|
| Claude | $5 | ~$0.02-0.05 |
| Gemini | 15 req/min | 免費 |
| Google Sheets/Drive | 無限 | 免費 |

---

## 進階設定

### 設定定時執行

將 `手動觸發` 替換為 `Schedule Trigger`，設定 Cron：

```
0 9 * * *  # 每天早上 9 點
```

### 自動重試機制

「Claude 產文」節點已內建自動重試：
- 等待時間：5 秒
- 重試次數：1 次
- 重試仍失敗：觸發錯誤流程

---

## 檔案結構

```
blog-publisher/
├── README.md       # 本文件
├── OPTIMIZATION.md # 節點優化分析
└── workflow.json   # n8n 工作流程
```

---

## 版本相容性

| 元件 | 版本 | 狀態 |
|------|------|------|
| n8n | 2.2.4 | ✅ 已驗證 |
| Node.js | 18+ | ✅ |
| Docker | 20+ | ✅ |
