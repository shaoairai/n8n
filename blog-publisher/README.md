# SEO Blog Auto Publisher

自動化 SEO 部落格發布工作流程，結合 AI 產文與產圖功能。

> **相容版本**: n8n 2.2.4（已驗證）

---

## 功能概述

```
Google Sheets → Claude AI 產文 → Gemini 產圖 → Google Drive → WordPress 草稿 → 回填狀態 → Email 通知
```

| 功能 | 說明 |
|------|------|
| 讀取關鍵字 | 從 Google Sheets 讀取待處理的 SEO 關鍵字 |
| AI 產文 | 使用 Claude 生成符合 E-E-A-T 原則的 SEO 文章 |
| AI 產圖 | 使用 Gemini 生成專業部落格封面圖 |
| 自動上傳 | 圖片上傳至 Google Drive 並設為公開 |
| 建立草稿 | 在 WordPress 建立文章草稿，含精選圖片 |
| 自動回填 | 完成後更新 Google Sheets 狀態與日期 |
| Email 通知 | 成功或失敗時自動寄信通知 |

---

## 你需要準備的東西

在開始之前，請確認你有以下帳號和資源：

| 項目 | 必要性 | 說明 |
|------|--------|------|
| Docker | 必要 | 用於運行 n8n |
| Google 帳號 | 必要 | 用於 Sheets、Drive、Gemini |
| Anthropic 帳號 | 必要 | 用於 Claude AI 產文 |
| WordPress 網站 | 必要 | 需啟用 REST API |
| SMTP 郵件伺服器 | 選用 | 用於發送通知信 |

---

## Step 1: 安裝 Docker

### Windows / Mac

1. 下載 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 安裝並啟動 Docker Desktop
3. 確認安裝成功：
   ```bash
   docker --version
   ```

### Linux

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登入後生效
```

---

## Step 2: 設定環境變數

### 2.1 複製範本檔案

```bash
cd n8n
cp config.env.example config.env
```

### 2.2 編輯 config.env

用文字編輯器開啟 `config.env`，填入以下設定（後續步驟會說明如何取得）：

```env
# ===== Anthropic (Claude) =====
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxx

# ===== Google Gemini =====
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# ===== Google Sheets =====
GOOGLE_SHEET_ID=1ABCDEFxxxxxxxxxxxxxxxxxx

# ===== Google Drive =====
GOOGLE_DRIVE_FOLDER_ID=1XYZxxxxxxxxxxxxxxxxxx

# ===== WordPress =====
WP_BASE_URL=https://your-wordpress-site.com
WP_USERNAME=your_username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# ===== Email 通知（選用）=====
NOTIFY_EMAIL=your-email@example.com
```

---

## Step 3: 取得 Anthropic API Key (Claude)

Claude 用於生成 SEO 文章內容。

### 3.1 註冊/登入 Anthropic

1. 前往 [console.anthropic.com](https://console.anthropic.com)
2. 使用 Google 或 Email 註冊帳號
3. 完成驗證流程

### 3.2 建立 API Key

1. 登入後，點選左側選單 **API Keys**
2. 點選 **Create Key**
3. 輸入名稱（例如：`n8n-blog`）
4. 點選 **Create Key**
5. **立即複製** Key（只會顯示一次！）

### 3.3 填入 config.env

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **費用說明**：新帳號有 $5 免費額度，約可產生 50+ 篇文章。超出後約 $0.015/1K tokens。

---

## Step 4: 取得 Gemini API Key

Gemini 用於生成部落格封面圖片。

### 4.1 前往 Google AI Studio

1. 前往 [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. 使用 Google 帳號登入

### 4.2 建立 API Key

1. 點選 **Create API Key**
2. 選擇現有的 Google Cloud 專案，或建立新專案
3. 點選 **Create API Key in new project**（如果是新專案）
4. **複製** 產生的 API Key

### 4.3 填入 config.env

```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **費用說明**：免費額度每分鐘 15 次請求，足夠一般使用。

---

## Step 5: 設定 Google Cloud (Sheets + Drive)

Google Sheets 用於管理關鍵字，Google Drive 用於儲存生成的圖片。

### 5.1 建立 Google Cloud 專案

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)
2. 點選左上角專案選擇器 → **新增專案**
3. 輸入專案名稱（例如：`n8n-automation`）
4. 點選 **建立**

### 5.2 啟用 APIs

1. 在左側選單選擇 **APIs & Services** → **Library**
2. 搜尋並啟用以下 APIs：
   - **Google Sheets API** → 點選 **Enable**
   - **Google Drive API** → 點選 **Enable**

### 5.3 設定 OAuth 同意畫面

1. 前往 **APIs & Services** → **OAuth consent screen**
2. 選擇 **External** → **Create**
3. 填寫必要資訊：
   - App name: `n8n Automation`
   - User support email: 你的 Email
   - Developer contact: 你的 Email
4. 點選 **Save and Continue**
5. 在 Scopes 頁面直接點選 **Save and Continue**
6. 在 Test users 頁面新增你的 Google 帳號 Email
7. 點選 **Save and Continue**

### 5.4 建立 OAuth 憑證

1. 前往 **APIs & Services** → **Credentials**
2. 點選 **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `n8n`
5. 在 **Authorized redirect URIs** 新增：
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
6. 點選 **Create**
7. **記下 Client ID 和 Client Secret**（稍後在 n8n 中使用）

---

## Step 6: 準備 Google Sheets

### 6.1 建立試算表

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新的試算表
3. **將工作表名稱改為「自動化表格」**（點選左下角的 Sheet1 → 重新命名）

### 6.2 設定欄位

在第一列設定以下欄位標題：

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| 關鍵字 | 標題 | 方向 | 素材 | 狀態 | 日期 |

### 6.3 欄位說明

| 欄位 | 必填 | 說明 | 範例 |
|------|------|------|------|
| 關鍵字 | ✅ | SEO 目標關鍵字，**用於比對回填，必須唯一** | `Python 入門教學` |
| 標題 | - | 文章標題（留空則 AI 自動生成） | `2024 Python 新手完整指南` |
| 方向 | - | 內容方向或特殊要求 | `針對完全零基礎的初學者` |
| 素材 | - | 個人經驗或額外素材 | `我自學 3 個月的心得...` |
| 狀態 | ✅ | 處理狀態，填入「待處理」 | `待處理` |
| 日期 | - | 完成時間，**系統自動填入** | `2025-01-22 14:30` |

### 6.4 新增測試資料

在第二列新增一筆測試資料：

| 關鍵字 | 標題 | 方向 | 素材 | 狀態 | 日期 |
|--------|------|------|------|------|------|
| Python 入門教學 | | 初學者導向 | | 待處理 | |

### 6.5 取得 Google Sheets ID

從試算表網址複製 ID：

```
https://docs.google.com/spreadsheets/d/【這裡是ID】/edit
```

例如：`https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit`

ID 就是 `1ABC123xyz...`

### 6.6 填入 config.env

```env
GOOGLE_SHEET_ID=1ABC123xyz...
```

---

## Step 7: 準備 Google Drive 資料夾

### 7.1 建立資料夾

1. 前往 [Google Drive](https://drive.google.com)
2. 點選 **新增** → **資料夾**
3. 命名為 `n8n-blog-images`（或任意名稱）

### 7.2 取得資料夾 ID

1. 進入剛建立的資料夾
2. 從網址複製 ID：
   ```
   https://drive.google.com/drive/folders/【這裡是ID】
   ```

### 7.3 填入 config.env

```env
GOOGLE_DRIVE_FOLDER_ID=1XYZ789...
```

---

## Step 8: 設定 WordPress

### 8.1 確認 REST API 啟用

WordPress 預設已啟用 REST API。測試方式：

```bash
curl https://your-site.com/wp-json/wp/v2/posts
```

如果回傳 JSON 資料，表示 REST API 正常運作。

### 8.2 建立應用程式密碼

1. 登入 WordPress 後台
2. 前往 **使用者** → **個人資料**
3. 滾動到最下方 **應用程式密碼**
4. 在「新增應用程式密碼名稱」輸入 `n8n`
5. 點選 **新增應用程式密碼**
6. **立即複製**密碼（格式：`xxxx xxxx xxxx xxxx xxxx xxxx`）

> ⚠️ **注意**：這個密碼只會顯示一次，請立即複製！

### 8.3 填入 config.env

```env
WP_BASE_URL=https://your-wordpress-site.com
WP_USERNAME=your_username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

> **注意**：
> - `WP_BASE_URL` 不要加結尾斜線
> - `WP_APP_PASSWORD` 是剛剛產生的應用程式密碼，不是登入密碼

---

## Step 9: 設定 SMTP（選用）

如果你想收到執行結果的 Email 通知，需要設定 SMTP。

### Gmail SMTP 設定

1. 前往 [Google 帳號安全性設定](https://myaccount.google.com/apppasswords)
2. 選擇「郵件」和「Windows 電腦」（或其他）
3. 點選 **產生**
4. **複製** 產生的 16 位密碼

稍後在 n8n 中建立 SMTP Credential 時使用：

| 設定 | 值 |
|------|-----|
| Host | `smtp.gmail.com` |
| Port | `465` |
| User | 你的 Gmail |
| Password | 剛剛產生的應用程式密碼 |
| SSL/TLS | ✅ 開啟 |

### 填入 config.env

```env
NOTIFY_EMAIL=your-email@example.com
```

---

## Step 10: 啟動 n8n

### 10.1 啟動容器

```bash
cd n8n
docker-compose up -d
```

### 10.2 開啟 n8n

瀏覽器前往：http://localhost:5678

### 10.3 首次設定

1. 建立 n8n 帳號（本地使用，隨意設定）
2. 完成初始設定精靈

---

## Step 11: 匯入工作流程

### 11.1 匯入 JSON

1. 在 n8n 左側選單點選 **Workflows**
2. 點選右上角 **⋮** → **Import from File**
3. 選擇 `blog-publisher/workflow.json`

### 11.2 設定 Credentials

匯入後，節點會顯示紅色警告。依序設定每個 Credential：

#### Google Sheets OAuth2

1. 點選 `讀取 Google Sheets` 節點
2. 在 Credential 下拉選 **Create New** → **Google Sheets OAuth2 API**
3. 填入：
   - Client ID: Step 5.4 取得的 Client ID
   - Client Secret: Step 5.4 取得的 Client Secret
4. 點選 **Sign in with Google**
5. 選擇你的 Google 帳號並授權

#### Google Drive OAuth2

1. 點選 `上傳 Google Drive` 節點
2. 建立 **Google Drive OAuth2 API** Credential
3. 使用相同的 Client ID 和 Client Secret
4. 點選 **Sign in with Google** 授權

#### Anthropic API

1. 點選 `Claude Model` 節點
2. 建立 **Anthropic API** Credential
3. 填入 API Key（Step 3 取得的）

#### HTTP Basic Auth (WordPress)

1. 點選 `上傳圖到 WP` 節點
2. 建立 **HTTP Basic Auth** Credential
3. 填入：
   - User: WordPress 使用者名稱
   - Password: 應用程式密碼（Step 8 取得的）

#### SMTP（如果要 Email 通知）

1. 點選 `寄信通知-成功` 節點
2. 建立 **SMTP** Credential
3. 填入 Step 9 的 SMTP 設定

---

## Step 12: 測試執行

### 12.1 確認測試資料

確保 Google Sheets 有一筆狀態為「待處理」的資料。

### 12.2 執行工作流程

1. 點選右上角 **Execute Workflow**
2. 觀察每個節點的執行狀態

### 12.3 檢查結果

| 檢查項目 | 預期結果 |
|----------|----------|
| WordPress 後台 | 應有新的文章草稿 |
| Google Sheets | 狀態更新為「已完成」，日期已填入 |
| Google Drive | 資料夾中有新的圖片 |
| Email | 收到成功通知信（如有設定） |

---

## 工作流程節點說明

共 25 個節點，全部與 n8n 2.2.4 相容：

| # | 節點 | 類型 | 版本 | 功能 |
|---|------|------|------|------|
| 1 | 手動觸發 | `manualTrigger` | 1 | 手動執行 |
| 2 | 讀取 Google Sheets | `googleSheets` | 4.5 | 讀取資料 |
| 3 | 加入列號 | `code` | 2 | 記錄列號 |
| 4 | 篩選待處理 | `filter` | 2 | 篩選狀態 |
| 5 | 只取第一筆 | `limit` | 1 | 限制數量 |
| 6 | 檢查有資料 | `if` | 2 | 條件分支 |
| 7 | Claude 產文 | `agent` | 1.7 | AI 產文 + 自動重試 |
| 8 | Claude Model | `lmChatAnthropic` | 1.2 | Claude 模型 |
| 9 | JSON 格式化 | `outputParserStructured` | 1.2 | 解析輸出 |
| 10 | 整理文章資料 | `code` | 2 | 整理資料 |
| 11 | Gemini 產圖 | `httpRequest` | 4.2 | AI 產圖 |
| 12 | 轉換圖片格式 | `code` | 2 | Base64 轉 Binary |
| 13 | 上傳 Google Drive | `googleDrive` | 3 | 上傳圖片 |
| 14 | 設定公開 | `googleDrive` | 3 | 設定權限 |
| 15 | 準備 WP 上傳 | `code` | 2 | 整理資料 |
| 16 | 上傳圖到 WP | `httpRequest` | 4.2 | 上傳媒體 |
| 17 | 合併 Media 結果 | `code` | 2 | 合併結果 |
| 18 | 建立 WP 草稿 | `httpRequest` | 4.2 | 建立文章 |
| 19 | 輸出結果 | `code` | 2 | 整理輸出 |
| 20 | 回填狀態日期 | `googleSheets` | 4.5 | 更新狀態 |
| 21 | 完成 | `code` | 2 | 完成訊息 |
| 22 | 寄信通知-成功 | `emailSend` | 2.1 | 成功通知 |
| 23 | 無資料輸出 | `code` | 2 | 無資料處理 |
| 24 | 錯誤觸發 | `errorTrigger` | 1 | 捕捉錯誤 |
| 25 | 寄信通知-失敗 | `emailSend` | 2.1 | 失敗通知 |

---

## 常見問題

### Q: 出現 "access to env vars denied" 錯誤

確認 `docker-compose.yml` 有這行：

```yaml
environment:
  - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

然後重啟容器：

```bash
docker-compose restart
```

### Q: Google OAuth 無法連線

1. 確認 Redirect URI 完全一致：
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
2. 確認 OAuth consent screen 的 Test users 有加入你的帳號

### Q: WordPress API 回傳 401

1. 確認使用的是「應用程式密碼」而非登入密碼
2. 確認 REST API 未被安全外掛封鎖
3. 測試：
   ```bash
   curl -u "username:app-password" https://your-site.com/wp-json/wp/v2/posts
   ```

### Q: Gemini 產圖失敗

1. 確認 API Key 有效
2. 確認帳號有啟用 Gemini API
3. 檢查是否超出免費額度（每分鐘 15 次）

### Q: 回填狀態沒有更新

1. 確認「關鍵字」欄位有值且唯一
2. 確認工作表名稱為「自動化表格」

### Q: Email 通知沒收到

1. 確認已設定 SMTP Credentials
2. 確認 `NOTIFY_EMAIL` 環境變數有設定
3. 檢查垃圾郵件匣

---

## 進階設定

### 設定定時執行

將 `手動觸發` 節點替換為 `Schedule Trigger`：

1. 刪除 `手動觸發` 節點
2. 新增 `Schedule Trigger` 節點
3. 設定 Cron 表達式，例如每天早上 9 點：
   ```
   0 9 * * *
   ```
4. 連接到 `讀取 Google Sheets` 節點

### 自動重試機制

「Claude 產文」節點已內建自動重試：

| 設定 | 值 | 說明 |
|------|-----|------|
| retryOnFail | true | 啟用失敗重試 |
| maxTries | 2 | 最多執行 2 次 |
| waitBetweenTries | 5000 | 等待 5 秒後重試 |

當 Claude 回傳格式錯誤時：
1. 第一次失敗 → 等待 5 秒
2. 自動重試一次
3. 若仍失敗 → 觸發錯誤流程 → 寄送失敗通知

---

## 成本估算

| 服務 | 免費額度 | 超出後價格 | 每篇估計成本 |
|------|----------|------------|--------------|
| Claude | $5 | ~$0.015/1K tokens | ~$0.02-0.05 |
| Gemini | 15 req/min | 免費 | $0 |
| Google Sheets | 無限 | 免費 | $0 |
| Google Drive | 15 GB | 免費 | $0 |
| n8n (自架) | 無限 | 免費 | $0 |

**每篇文章估計成本：$0.02 - $0.05**

---

## 檔案結構

```
blog-publisher/
├── README.md       # 本文件
├── OPTIMIZATION.md # 節點優化詳細分析
└── workflow.json   # n8n 工作流程檔案
```

---

## 版本相容性

| 元件 | 版本 | 狀態 |
|------|------|------|
| n8n | 2.2.4 | ✅ 已驗證 |
| Node.js | 18+ | ✅ |
| Docker | 20+ | ✅ |

**所有 25 個節點均與 n8n 2.2.4 完全相容。**
