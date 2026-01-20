# Social Media Publisher (FB + IG)

自動發文到 Facebook 和 Instagram 的工作流程，支援不同平台使用不同內容。

> **相容版本**: n8n 2.2.4（已驗證）

## 功能概述

```
手動觸發 → Google Sheets → 篩選當日待發布 → FB 發文 + IG 發文（並行） → 回填狀態 → Email 通知
```

- **手動觸發**：點擊執行發布當日預定的貼文
- **讀取資料**：從 Google Sheets 讀取社群發文資料
- **當日篩選**：自動篩選預定時間為當天的「待發布」項目
- **平台分流**：FB 和 IG 使用不同內文，並行發布
- **狀態追蹤**：發布後自動回填狀態（已發布 / 部分失敗）
- **Email 通知**：發布結果與錯誤通知

---

## 系統需求

- Docker & Docker Compose
- Google Cloud 帳號（Sheets OAuth）
- Meta for Developers 應用程式（Facebook + Instagram API）
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
# 社群媒體發文
SOCIAL_SHEET_ID=你的Google Sheets ID
FB_PAGE_ID=你的Facebook粉絲專頁ID
IG_BUSINESS_ACCOUNT_ID=你的Instagram商業帳號ID
NOTIFY_EMAIL=通知信收件人
```

### Step 2: Meta for Developers 設定

#### 2.1 建立 Meta 應用程式

1. 前往 [developers.facebook.com](https://developers.facebook.com)
2. 建立應用程式（選擇「商業」類型）
3. 新增 **Facebook Login** 產品

#### 2.2 設定 OAuth

在 Facebook Login 設定中，新增有效的 OAuth 重新導向 URI：

```
http://localhost:5678/rest/oauth2-credential/callback
```

#### 2.3 申請權限

在應用程式審查中申請以下權限：

| 權限 | 用途 |
|------|------|
| `pages_manage_posts` | 管理粉絲專頁貼文 |
| `pages_read_engagement` | 讀取粉絲專頁互動 |
| `instagram_basic` | Instagram 基本存取 |
| `instagram_content_publish` | Instagram 內容發布 |

#### 2.4 取得 Page ID 和 IG Business Account ID

**Facebook Page ID**：
1. 前往 [Meta Business Suite](https://business.facebook.com)
2. 選擇粉絲專頁 → 設定 → 粉絲專頁資訊
3. 複製頁面 ID

**Instagram Business Account ID**：
1. 使用 Graph API Explorer 執行：
   ```
   GET /{page-id}?fields=instagram_business_account
   ```
2. 複製回傳的 `instagram_business_account.id`

### Step 3: Google Cloud 設定

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)
2. 建立新專案
3. 啟用 **Google Sheets API**
4. 建立 OAuth 憑證：
   - 應用程式類型：Web application
   - 重新導向 URI：`http://localhost:5678/rest/oauth2-credential/callback`
5. 記下 **Client ID** 和 **Client Secret**

### Step 4: 準備 Google Sheets

建立工作表名稱為「**社群發文**」，設定欄位：

| 關鍵字 | 圖片網址 | FB內文 | IG內文 | 預定時間 | 狀態 | 發布時間 |
|--------|----------|--------|--------|----------|------|----------|
| 2025-01-22-新品 | https://example.com/img.jpg | FB 的內容 | IG 的內容 #hashtag | 2025-01-22 14:30 | 待發布 | |

**欄位說明**：

| 欄位 | 必填 | 說明 |
|------|------|------|
| 關鍵字 | ✅ | 唯一識別碼，用於比對回填 |
| 圖片網址 | ✅ | 公開可存取的 HTTPS 圖片連結 |
| FB內文 | ✅ | Facebook 貼文內容 |
| IG內文 | ✅ | Instagram 貼文內容（可含 #hashtag） |
| 預定時間 | ✅ | 格式：`YYYY-MM-DD HH:mm` |
| 狀態 | ✅ | 填入「待發布」 |
| 發布時間 | - | 系統自動填入 |

### Step 5: 匯入工作流程

1. 啟動 n8n：`docker-compose up -d`（在上層目錄）
2. 開啟 http://localhost:5678
3. **Workflows** → **Import from File** → 選擇 `workflow.json`
4. 設定 Credentials（見下方）

### Step 6: 設定 Credentials

| 節點 | Credential 類型 | 設定 |
|------|-----------------|------|
| 讀取 Google Sheets | Google Sheets OAuth2 | Client ID + Secret |
| 發文到 FB | OAuth2 API | Meta 應用程式設定 |
| IG 建立容器 | OAuth2 API | 同上（共用） |
| 寄送通知 | SMTP | 郵件伺服器設定 |

#### OAuth2 API 設定（Facebook/Instagram）

在 n8n 建立 OAuth2 API Credential：

| 欄位 | 值 |
|------|-----|
| Authorization URL | `https://www.facebook.com/v21.0/dialog/oauth` |
| Access Token URL | `https://graph.facebook.com/v21.0/oauth/access_token` |
| Client ID | Meta 應用程式的 App ID |
| Client Secret | Meta 應用程式的 App Secret |
| Scope | `pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish` |

### Step 7: 測試執行

1. 在 Google Sheets 新增一筆「預定時間」為今天的資料
2. 狀態填入「待發布」
3. 點選 **Execute Workflow**
4. 檢查結果：
   - Facebook 粉絲專頁應有新貼文
   - Instagram 帳號應有新貼文
   - Google Sheets 狀態更新為「已發布」或「部分失敗」
   - 收到 Email 通知

---

## 工作流程節點說明

共 18 個節點：

| 節點 | 類型 | 版本 | 功能 |
|------|------|------|------|
| 手動觸發 | `manualTrigger` | 1 | 手動執行 |
| 讀取 Google Sheets | `googleSheets` | 4.5 | 讀取資料 |
| 篩選當日待發布 | `code` | 2 | 篩選當日 + 待發布 + 只取第一筆 |
| 檢查有資料 | `if` | 2 | 條件分支 |
| 發文到 FB | `httpRequest` | 4.2 | Facebook Graph API |
| IG 建立容器 | `httpRequest` | 4.2 | Instagram 媒體容器 |
| FB 結果 | `code` | 2 | 處理 FB 回應 |
| IG 容器結果 | `code` | 2 | 處理 IG 容器回應 |
| IG 容器成功？ | `if` | 2 | 檢查容器建立 |
| IG 發布 | `httpRequest` | 4.2 | Instagram 發布 |
| IG 發布結果 | `code` | 2 | 處理 IG 發布回應 |
| IG 失敗 | `code` | 2 | IG 失敗處理 |
| 合併結果 | `merge` | 3 | 合併 FB 與 IG 結果 |
| 整理結果 | `code` | 2 | 整理最終輸出 |
| 回填狀態 | `googleSheets` | 4.5 | 更新狀態 |
| 寄送通知 | `emailSend` | 2.1 | 結果通知 |
| 錯誤觸發 | `errorTrigger` | 1 | 捕捉錯誤 |
| 錯誤通知 | `emailSend` | 2.1 | 失敗通知 |

---

## 流程圖

```
手動觸發
    ↓
讀取 Google Sheets
    ↓
篩選當日待發布
    ↓
檢查有資料
    ↓ (true, 並行執行)
┌─────────────┬────────────────┐
│ 發文到 FB   │ IG 建立容器     │
│     ↓       │      ↓         │
│ FB 結果     │ IG 容器結果     │
│     │       │      ↓         │
│     │       │ IG 容器成功？   │
│     │       │  ↓true  ↓false │
│     │       │ IG發布  IG失敗  │
│     │       │  ↓       │     │
│     │       │ IG發布結果      │
└─────┴───────┴──────┴─────────┘
              ↓
         合併結果
              ↓
         整理結果
              ↓
         回填狀態
              ↓
         寄送通知


[獨立錯誤流程]
錯誤觸發 → 錯誤通知
```

---

## Instagram 兩步驟發布說明

Instagram Graph API 要求兩步驟發布：

1. **建立媒體容器** - `POST /{ig-user-id}/media`
   - 傳入圖片 URL 和文字內容
   - 回傳 `creation_id`

2. **發布貼文** - `POST /{ig-user-id}/media_publish`
   - 傳入 `creation_id`
   - 回傳貼文 ID

---

## 每日使用流程

```
1. 提前在 Google Sheets 填入發文資料
   - 圖片網址（需公開可存取）
   - FB 內文
   - IG 內文（可不同）
   - 預定時間（發文當天日期）
   - 狀態設為「待發布」

2. 發文當天手動執行工作流程
   - 系統自動篩選當日「待發布」的項目
   - 同時發布到 FB 和 IG
   - 自動回填發布結果

3. 收到 Email 通知確認結果
```

---

## 常見問題

| 問題 | 解決方案 |
|------|----------|
| FB/IG 權限不足 | 確認 Meta App 已通過審核並取得權限 |
| IG 容器建立失敗 | 圖片必須是公開 HTTPS 連結，格式 JPEG/PNG |
| IG 發布失敗 | 確認 IG 帳號已連結到 FB 粉絲專頁 |
| 沒有找到當日資料 | 確認「預定時間」日期為今天且格式正確 |
| access to env vars denied | 確認 docker-compose.yml 有 `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` |

---

## 檔案結構

```
social-media-publisher/
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
| Facebook Graph API | v21.0 | ✅ |
| Instagram Graph API | v21.0 | ✅ |
