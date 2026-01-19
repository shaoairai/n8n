# n8n SEO Blog Auto Publisher

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

## 系統需求

- Docker & Docker Compose
- Google Cloud 帳號（Sheets、Drive OAuth）
- Anthropic API Key（Claude）
- Google AI Studio API Key（Gemini）
- WordPress 網站（需啟用 REST API）
- SMTP 郵件伺服器（選用，用於通知）

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

# Email 通知（選用）
NOTIFY_EMAIL=your-email@example.com
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

建立名為「**自動化表格**」的工作表，包含以下欄位：

| 欄位名稱 | 說明 | 範例 |
|----------|------|------|
| 關鍵字 | SEO 目標關鍵字（**必填，用於比對回填**） | `Python 入門教學` |
| 標題 | 文章標題（選填） | `2024 Python 新手指南` |
| 方向 | 內容方向（選填） | `針對完全零基礎的初學者` |
| 素材 | 個人經驗/素材（選填） | `我自學 3 個月的心得...` |
| 狀態 | 處理狀態 | `待處理` / `已完成` |
| 日期 | 完成時間（**自動填入**） | `2024-01-15 14:30` |

> **重要**：工作表名稱必須是「自動化表格」，或在匯入後修改「讀取 Google Sheets」和「回填狀態日期」節點的設定

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
4. 新增授權重新導向 URI：`http://localhost:5678/rest/oauth2-credential/callback`
5. 在 n8n 建立 Credentials：
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

### SMTP（選用，用於 Email 通知）

1. 在 n8n 建立 Credentials：**SMTP**
2. Gmail 設定範例：
   - Host: `smtp.gmail.com`
   - Port: `465`
   - User: 你的 Gmail
   - Password: [應用程式密碼](https://myaccount.google.com/apppasswords)
   - SSL/TLS: 開啟

## 檔案結構

```
n8n/
├── README.md                        # 本文件
├── OPTIMIZATION.md                  # 節點優化分析
├── NEXT-STEPS.md                    # 下一步行動指南
├── docker-compose.yml               # Docker 設定
├── config.env.example               # 環境變數範本
├── config.env                       # 環境變數（需自行填寫，勿上傳）
├── workflow-blog-publisher-v2.json  # 主要工作流程
├── check-workflow.js                # 工作流程驗證腳本
└── data/                            # 資料目錄（掛載到容器）
```

## 工作流程節點說明

共 25 個節點，分為主流程和錯誤處理流程：

### 主流程（成功路徑）

| 節點 | 類型 | 版本 | 功能 |
|------|------|------|------|
| 手動觸發 | `manualTrigger` | 1 | 手動執行工作流程 |
| 讀取 Google Sheets | `googleSheets` | 4.5 | 從試算表讀取所有資料 |
| 加入列號 | `code` | 2 | 記錄資料所在列 |
| 篩選待處理 | `filter` | 2 | 篩選狀態為「待處理」 |
| 只取第一筆 | `limit` | 1 | 每次只處理一筆 |
| 檢查有資料 | `if` | 2 | 確認有待處理資料 |
| Claude 產文 | `agent` | 1.7 | 使用 Claude AI 生成文章 |
| Claude Model | `lmChatAnthropic` | 1.2 | Claude 語言模型 |
| JSON 格式化 | `outputParserStructured` | 1.2 | 解析 AI 輸出為 JSON |
| 整理文章資料 | `code` | 2 | 整理 AI 產出資料 |
| Gemini 產圖 | `httpRequest` | 4.2 | 呼叫 Gemini 生成圖片 |
| 轉換圖片格式 | `code` | 2 | Base64 轉 Binary |
| 上傳 Google Drive | `googleDrive` | 3 | 圖片備份到 Drive |
| 設定公開 | `googleDrive` | 3 | 設定圖片為公開 |
| 準備 WP 上傳 | `code` | 2 | 整理資料準備上傳 |
| 上傳圖到 WP | `httpRequest` | 4.2 | 上傳到 WP Media |
| 合併 Media 結果 | `code` | 2 | 合併上傳結果 |
| 建立 WP 草稿 | `httpRequest` | 4.2 | 建立文章草稿 |
| 輸出結果 | `code` | 2 | 整理最終輸出 |
| 回填狀態日期 | `googleSheets` | 4.5 | 更新狀態為「已完成」並填入日期 |
| 完成 | `code` | 2 | 最終完成訊息 |
| 寄信通知-成功 | `emailSend` | 2.1 | 成功時寄信通知 |

### 錯誤處理流程

| 節點 | 類型 | 版本 | 功能 |
|------|------|------|------|
| 錯誤觸發 | `errorTrigger` | 1 | 捕捉任何節點錯誤 |
| 寄信通知-失敗 | `emailSend` | 2.1 | 失敗時寄信通知 |

## 流程圖

```
主流程：
手動觸發 → 讀取 Sheets → 加入列號 → 篩選待處理 → 只取第一筆 → 檢查有資料
                                                                    ↓
                                          Claude 產文 ← Claude Model + JSON 格式化
                                                                    ↓
整理文章資料 → Gemini 產圖 → 轉換圖片格式 → 上傳 Drive → 設定公開 → 準備 WP 上傳
                                                                    ↓
上傳圖到 WP → 合併 Media 結果 → 建立 WP 草稿 → 輸出結果 → 回填狀態日期 → 完成 → 寄信-成功

錯誤處理：
錯誤觸發 → 寄信通知-失敗
```

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

### Q: 回填狀態沒有更新

1. 確認「關鍵字」欄位有值（用於比對）
2. 確認工作表名稱為「自動化表格」

### Q: Email 通知沒收到

1. 確認已設定 SMTP Credentials
2. 確認 `NOTIFY_EMAIL` 環境變數有設定
3. 檢查垃圾郵件匣

## 進階設定

### 修改 AI Prompt

編輯 `workflow-blog-publisher-v2.json` 中 `Claude 產文` 節點的 `text` 參數。

### 修改圖片風格

編輯 `Gemini 產圖` 節點的 `jsonBody` 中的 prompt。

### 新增排程觸發

將 `手動觸發` 節點替換為 `Schedule Trigger`，設定定時執行。

### 停用 Email 通知

如不需要 Email 通知，可在 n8n 中停用或刪除以下節點：
- 寄信通知-成功
- 錯誤觸發
- 寄信通知-失敗

## 版本相容性

| 元件 | 版本 | 狀態 |
|------|------|------|
| n8n | 2.2.4 | ✅ 已驗證 |
| Node.js | 18+ | ✅ |
| Docker | 20+ | ✅ |

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！
