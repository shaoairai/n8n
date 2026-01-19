# n8n SEO Blog Auto Publisher

自動化 SEO 部落格發布工作流程，結合 AI 產文與產圖功能。

## 功能概述

```
Google Sheets → Claude AI 產文 → Gemini 產圖 → Google Drive → WordPress 草稿
```

- **讀取關鍵字**：從 Google Sheets 讀取待處理的 SEO 關鍵字
- **AI 產文**：使用 Claude 生成符合 E-E-A-T 原則的 SEO 文章
- **AI 產圖**：使用 Gemini 生成專業部落格封面圖
- **自動上傳**：圖片上傳至 Google Drive 並設為公開
- **建立草稿**：在 WordPress 建立文章草稿，含精選圖片

## 系統需求

- Docker & Docker Compose
- Google Cloud 帳號（Sheets、Drive OAuth）
- Anthropic API Key（Claude）
- Google AI Studio API Key（Gemini）
- WordPress 網站（需啟用 REST API）

## 快速開始

### 1. 複製專案

```bash
git clone <your-repo-url>
cd n8n
```

### 2. 設定環境變數

複製並編輯設定檔：

```bash
cp config.env.example config.env
```

編輯 `config.env`，填入你的 API 金鑰：

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
```

### 3. 啟動 n8n

```bash
docker-compose up -d
```

開啟瀏覽器：http://localhost:5678

### 4. 匯入工作流程

1. 在 n8n 介面點選 **Workflows** → **Import from File**
2. 選擇 `workflow-blog-publisher-v2.json`
3. 設定各節點的 Credentials（見下方說明）

### 5. 準備 Google Sheets

建立 Google Sheets，包含以下欄位：

| 欄位名稱 | 說明 | 範例 |
|----------|------|------|
| 關鍵字 | SEO 目標關鍵字 | `Python 入門教學` |
| 標題 | 文章標題（選填） | `2024 Python 新手指南` |
| 方向 | 內容方向（選填） | `針對完全零基礎的初學者` |
| 素材 | 個人經驗/素材（選填） | `我自學 3 個月的心得...` |
| 狀態 | 處理狀態 | `待處理` / `已完成` |

## Credentials 設定指南

### Anthropic API

1. 前往 [Anthropic Console](https://console.anthropic.com)
2. 建立 API Key
3. 在 n8n 建立 Credentials：**Anthropic API**

### Google OAuth (Sheets & Drive)

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立專案並啟用 APIs：
   - Google Sheets API
   - Google Drive API
3. 建立 OAuth 2.0 憑證（Web Application）
4. 在 n8n 建立 Credentials：
   - **Google Sheets OAuth2 API**
   - **Google Drive OAuth2 API**

### Gemini API

1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 建立 API Key
3. 將 Key 填入 `config.env` 的 `GEMINI_API_KEY`

### WordPress Application Password

1. 登入 WordPress 後台
2. 前往 **使用者** → **個人資料**
3. 滾動到 **應用程式密碼**
4. 輸入名稱，點選 **新增應用程式密碼**
5. 複製產生的密碼（格式：`xxxx xxxx xxxx xxxx`）
6. 在 n8n 建立 Credentials：**HTTP Basic Auth**
   - User: WordPress 使用者名稱
   - Password: 應用程式密碼

## 檔案結構

```
n8n/
├── README.md                        # 本文件
├── OPTIMIZATION.md                  # 節點優化分析
├── docker-compose.yml               # Docker 設定
├── config.env                       # 環境變數（需自行填寫）
├── workflow-blog-publisher-v2.json  # 主要工作流程
├── check-workflow.js                # 工作流程驗證腳本
└── data/                            # 資料目錄（掛載到容器）
```

## 工作流程節點說明

| 節點 | 功能 |
|------|------|
| 手動觸發 | 手動執行工作流程 |
| 讀取 Google Sheets | 從試算表讀取所有資料 |
| 篩選待處理 | 篩選狀態為「待處理」的項目 |
| 只取第一筆 | 每次只處理一筆資料 |
| 檢查有資料 | 確認有待處理資料 |
| Claude 產文 | 使用 Claude AI 生成 SEO 文章 |
| Gemini 產圖 | 使用 Gemini 生成封面圖 |
| 上傳 Google Drive | 圖片備份到 Drive |
| 上傳圖到 WP | 圖片上傳到 WordPress Media |
| 建立 WP 草稿 | 建立文章草稿 |

## 常見問題

### Q: 出現 "access to env vars denied" 錯誤

確認 `docker-compose.yml` 有加入：
```yaml
environment:
  - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

### Q: Google OAuth 無法連線

1. 確認已在 Google Cloud Console 設定正確的 Redirect URI
2. n8n 預設 Redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`

### Q: WordPress API 回傳 401

1. 確認使用的是「應用程式密碼」而非登入密碼
2. 確認 REST API 未被安全外掛封鎖

### Q: Gemini 產圖失敗

1. 確認 API Key 有效
2. 確認帳號有啟用 Gemini API
3. 檢查是否超出免費額度

## 進階設定

### 修改 AI Prompt

編輯 `workflow-blog-publisher-v2.json` 中 `Claude 產文` 節點的 `text` 參數。

### 修改圖片風格

編輯 `Gemini 產圖` 節點的 `jsonBody` 中的 prompt。

### 新增排程觸發

將 `手動觸發` 節點替換為 `Schedule Trigger`，設定定時執行。

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！
