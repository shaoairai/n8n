# Social Media Publisher (FB + IG)

自動發文到 Facebook 和 Instagram 的工作流程，支援不同平台使用不同內容。

> **相容版本**: n8n 2.2.4（已驗證）

---

## 功能概述

```
手動觸發 → Google Sheets → 篩選當日待發布 → FB 發文 + IG 發文（並行） → 回填狀態 → Email 通知
```

| 功能 | 說明 |
|------|------|
| 手動觸發 | 點擊執行發布當日預定的貼文 |
| 讀取資料 | 從 Google Sheets 讀取社群發文資料 |
| 當日篩選 | 自動篩選預定時間為當天的「待發布」項目 |
| 平台分流 | FB 和 IG 使用不同內文，並行發布 |
| 狀態追蹤 | 發布後自動回填狀態（已發布 / 部分失敗） |
| Email 通知 | 發布結果與錯誤通知 |

---

## 你需要準備的東西

在開始之前，請確認你有以下帳號和資源：

| 項目 | 必要性 | 說明 |
|------|--------|------|
| Docker | 必要 | 用於運行 n8n |
| Google 帳號 | 必要 | 用於 Google Sheets |
| Facebook 粉絲專頁 | 必要 | 需要管理員權限 |
| Instagram 商業帳號 | 必要 | 需連結到 Facebook 粉絲專頁 |
| Meta 開發者帳號 | 必要 | 用於建立 API 應用程式 |
| SMTP 郵件伺服器 | 選用 | 用於發送通知信 |

### 重要前提

- Instagram 帳號必須是**商業帳號**或**創作者帳號**
- Instagram 帳號必須**連結到 Facebook 粉絲專頁**
- 你必須是該 Facebook 粉絲專頁的**管理員**

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
# ===== Google Sheets =====
SOCIAL_SHEET_ID=1ABCDEFxxxxxxxxxxxxxxxxxx

# ===== Facebook =====
FB_PAGE_ID=123456789012345

# ===== Instagram =====
IG_BUSINESS_ACCOUNT_ID=17841400000000000

# ===== Email 通知（選用）=====
NOTIFY_EMAIL=your-email@example.com
```

---

## Step 3: 確認 Instagram 帳號設定

### 3.1 確認是商業帳號

1. 開啟 Instagram App
2. 前往 **設定** → **帳號** → **切換為專業帳號**
3. 選擇「商業」或「創作者」

### 3.2 連結到 Facebook 粉絲專頁

1. 在 Instagram App 中，前往 **設定** → **帳號** → **分享到其他應用程式**
2. 選擇 **Facebook**
3. 選擇要連結的 **粉絲專頁**（你必須是管理員）

> ⚠️ **重要**：這一步必須完成，否則無法透過 API 發文到 Instagram

---

## Step 4: 建立 Meta 開發者應用程式

### 4.1 註冊 Meta 開發者帳號

1. 前往 [developers.facebook.com](https://developers.facebook.com)
2. 點選右上角 **開始使用**
3. 使用你的 Facebook 帳號登入
4. 同意開發者條款

### 4.2 建立應用程式

1. 點選 **我的應用程式** → **建立應用程式**
2. 選擇應用程式類型：**商業**
3. 填寫應用程式名稱（例如：`n8n Social Publisher`）
4. 填寫應用程式聯絡 Email
5. 點選 **建立應用程式**

### 4.3 新增 Facebook Login 產品

1. 在應用程式儀表板，找到 **新增產品**
2. 找到 **Facebook Login** → 點選 **設定**
3. 選擇 **網站**
4. 網站網址填入：`http://localhost:5678`
5. 點選 **Save**

### 4.4 設定 OAuth 重新導向 URI

1. 在左側選單選擇 **Facebook Login** → **設定**
2. 在「有效的 OAuth 重新導向 URI」新增：
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
3. 點選 **儲存變更**

### 4.5 記下 App ID 和 App Secret

1. 在左側選單選擇 **設定** → **基本**
2. **記下 App ID**（應用程式編號）
3. 點選 **App Secret** 的「顯示」按鈕
4. **記下 App Secret**

---

## Step 5: 申請必要權限

### 5.1 進入權限頁面

1. 在左側選單選擇 **應用程式審查** → **權限和功能**

### 5.2 申請以下權限

找到並申請以下權限（點選「要求進階存取權」）：

| 權限 | 用途 | 說明 |
|------|------|------|
| `pages_manage_posts` | 管理粉絲專頁貼文 | 發文到 Facebook |
| `pages_read_engagement` | 讀取粉絲專頁互動 | 讀取貼文狀態 |
| `instagram_basic` | Instagram 基本存取 | 存取 IG 帳號資訊 |
| `instagram_content_publish` | Instagram 內容發布 | 發文到 Instagram |

### 5.3 測試模式說明

在應用程式正式上線前，你可以使用「測試模式」：
- 只有應用程式管理員和開發者可以使用
- 不需要經過 Meta 審核
- 足夠個人使用

如果只是自己使用，保持測試模式即可，不需要提交審核。

---

## Step 6: 取得 Facebook Page ID

### 方法一：從 Meta Business Suite

1. 前往 [business.facebook.com](https://business.facebook.com)
2. 選擇你的粉絲專頁
3. 點選 **設定** → **粉絲專頁資訊**
4. 滾動到最下方找到 **粉絲專頁編號**

### 方法二：從粉絲專頁網址

1. 前往你的粉絲專頁
2. 如果網址是數字形式，例如：
   ```
   https://www.facebook.com/123456789012345
   ```
   那 `123456789012345` 就是 Page ID

### 方法三：使用 Graph API Explorer

1. 前往 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. 選擇你的應用程式
3. 點選 **Get Token** → **Get User Access Token**
4. 勾選 `pages_read_engagement` → **Generate Access Token**
5. 在查詢欄輸入 `me/accounts` → 點選 **Submit**
6. 在回傳結果中找到你的粉絲專頁，複製 `id` 欄位

### 填入 config.env

```env
FB_PAGE_ID=123456789012345
```

---

## Step 7: 取得 Instagram Business Account ID

### 7.1 使用 Graph API Explorer

1. 前往 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. 選擇你的應用程式
3. 點選 **Get Token** → **Get User Access Token**
4. 勾選以下權限：
   - `pages_read_engagement`
   - `instagram_basic`
5. 點選 **Generate Access Token**
6. 授權應用程式存取你的粉絲專頁

### 7.2 查詢 Instagram Business Account ID

在查詢欄輸入（將 `{page-id}` 替換為你的 Facebook Page ID）：

```
{page-id}?fields=instagram_business_account
```

例如：

```
123456789012345?fields=instagram_business_account
```

點選 **Submit**

### 7.3 複製 ID

回傳結果類似：

```json
{
  "instagram_business_account": {
    "id": "17841400000000000"
  },
  "id": "123456789012345"
}
```

`instagram_business_account.id` 就是你要的 ID（`17841400000000000`）

### 填入 config.env

```env
IG_BUSINESS_ACCOUNT_ID=17841400000000000
```

> ⚠️ **如果沒有看到 `instagram_business_account`**：
> - 確認 Instagram 是商業帳號或創作者帳號
> - 確認 Instagram 已連結到該 Facebook 粉絲專頁

---

## Step 8: 設定 Google Cloud (Sheets)

### 8.1 建立 Google Cloud 專案

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)
2. 點選左上角專案選擇器 → **新增專案**
3. 輸入專案名稱（例如：`n8n-social`）
4. 點選 **建立**

### 8.2 啟用 Google Sheets API

1. 在左側選單選擇 **APIs & Services** → **Library**
2. 搜尋 **Google Sheets API**
3. 點選 **Enable**

### 8.3 設定 OAuth 同意畫面

1. 前往 **APIs & Services** → **OAuth consent screen**
2. 選擇 **External** → **Create**
3. 填寫必要資訊：
   - App name: `n8n Social`
   - User support email: 你的 Email
   - Developer contact: 你的 Email
4. 點選 **Save and Continue**
5. 在 Scopes 頁面直接點選 **Save and Continue**
6. 在 Test users 頁面新增你的 Google 帳號 Email
7. 點選 **Save and Continue**

### 8.4 建立 OAuth 憑證

1. 前往 **APIs & Services** → **Credentials**
2. 點選 **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `n8n`
5. 在 **Authorized redirect URIs** 新增：
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
6. 點選 **Create**
7. **記下 Client ID 和 Client Secret**

---

## Step 9: 準備 Google Sheets

### 9.1 建立試算表

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新的試算表
3. **將工作表名稱改為「社群發文」**（點選左下角的 Sheet1 → 重新命名）

### 9.2 設定欄位

在第一列設定以下欄位標題：

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| 關鍵字 | 圖片網址 | FB內文 | IG內文 | 預定時間 | 狀態 | 發布時間 |

### 9.3 欄位說明

| 欄位 | 必填 | 說明 | 範例 |
|------|------|------|------|
| 關鍵字 | ✅ | 唯一識別碼，**用於比對回填** | `2025-01-22-新品上市` |
| 圖片網址 | ✅ | 公開可存取的 HTTPS 圖片連結 | `https://example.com/image.jpg` |
| FB內文 | ✅ | Facebook 貼文內容 | `新品上市！限時優惠...` |
| IG內文 | ✅ | Instagram 貼文內容（可含 #hashtag） | `新品開賣 #新品 #優惠` |
| 預定時間 | ✅ | 發布日期，格式：`YYYY-MM-DD HH:mm` | `2025-01-22 14:30` |
| 狀態 | ✅ | 處理狀態，填入「待發布」 | `待發布` |
| 發布時間 | - | 完成時間，**系統自動填入** | `2025-01-22 14:35` |

### 9.4 圖片網址注意事項

圖片必須符合以下條件：

| 條件 | 說明 |
|------|------|
| 公開存取 | 圖片必須不需登入即可存取 |
| HTTPS | 必須是 HTTPS 連結 |
| 格式 | JPEG 或 PNG |
| 大小 | 建議 8MB 以內 |
| 比例 | Instagram 建議 1:1 或 4:5 |

**可用的圖片來源**：
- Google Drive（設為「知道連結的任何人」可檢視）
- Imgur
- 你自己的網站
- 任何公開圖床

### 9.5 新增測試資料

在第二列新增一筆測試資料（預定時間設為今天）：

| 關鍵字 | 圖片網址 | FB內文 | IG內文 | 預定時間 | 狀態 | 發布時間 |
|--------|----------|--------|--------|----------|------|----------|
| 2025-01-22-test | https://your-image-url.jpg | FB 測試貼文 | IG 測試貼文 #test | 2025-01-22 14:00 | 待發布 | |

### 9.6 取得 Google Sheets ID

從試算表網址複製 ID：

```
https://docs.google.com/spreadsheets/d/【這裡是ID】/edit
```

### 9.7 填入 config.env

```env
SOCIAL_SHEET_ID=1ABC123xyz...
```

---

## Step 10: 設定 SMTP（選用）

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

## Step 11: 啟動 n8n

### 11.1 啟動容器

```bash
cd n8n
docker-compose up -d
```

### 11.2 開啟 n8n

瀏覽器前往：http://localhost:5678

### 11.3 首次設定

1. 建立 n8n 帳號（本地使用，隨意設定）
2. 完成初始設定精靈

---

## Step 12: 匯入工作流程

### 12.1 匯入 JSON

1. 在 n8n 左側選單點選 **Workflows**
2. 點選右上角 **⋮** → **Import from File**
3. 選擇 `social-media-publisher/workflow.json`

### 12.2 設定 Credentials

匯入後，節點會顯示紅色警告。依序設定每個 Credential：

#### Google Sheets OAuth2

1. 點選 `讀取 Google Sheets` 節點
2. 在 Credential 下拉選 **Create New** → **Google Sheets OAuth2 API**
3. 填入：
   - Client ID: Step 8.4 取得的 Google Client ID
   - Client Secret: Step 8.4 取得的 Google Client Secret
4. 點選 **Sign in with Google**
5. 選擇你的 Google 帳號並授權

#### OAuth2 API (Facebook/Instagram)

1. 點選 `發文到 FB` 節點
2. 在 Credential 下拉選 **Create New** → **OAuth2 API**
3. 填入以下設定：

| 欄位 | 值 |
|------|-----|
| **Name** | `Facebook Graph API` |
| **Grant Type** | `Authorization Code` |
| **Authorization URL** | `https://www.facebook.com/v21.0/dialog/oauth` |
| **Access Token URL** | `https://graph.facebook.com/v21.0/oauth/access_token` |
| **Client ID** | Step 4.5 的 App ID |
| **Client Secret** | Step 4.5 的 App Secret |
| **Scope** | `pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish` |
| **Auth URI Query Parameters** | 留空 |
| **Authentication** | `Body` |

4. 點選 **Sign in with Facebook**
5. 授權應用程式存取你的粉絲專頁

> ⚠️ **重要**：授權時務必勾選你要發文的粉絲專頁

#### 其他節點使用相同的 Facebook Credential

以下節點使用同一個 `Facebook Graph API` Credential：
- `IG 建立容器`
- `IG 發布`

#### SMTP（如果要 Email 通知）

1. 點選 `寄送通知` 節點
2. 建立 **SMTP** Credential
3. 填入 Step 10 的 SMTP 設定

---

## Step 13: 測試執行

### 13.1 確認測試資料

確保 Google Sheets 有一筆：
- 狀態為「待發布」
- 預定時間為**今天**
- 圖片網址是有效的公開連結

### 13.2 執行工作流程

1. 點選右上角 **Execute Workflow**
2. 觀察每個節點的執行狀態

### 13.3 檢查結果

| 檢查項目 | 預期結果 |
|----------|----------|
| Facebook 粉絲專頁 | 應有新貼文 |
| Instagram 帳號 | 應有新貼文 |
| Google Sheets | 狀態更新為「已發布」或「部分失敗」 |
| Email | 收到結果通知信（如有設定） |

---

## 每日使用流程

```
1. 提前在 Google Sheets 填入發文資料
   ├── 關鍵字（唯一識別）
   ├── 圖片網址（需公開可存取）
   ├── FB 內文
   ├── IG 內文（可與 FB 不同）
   ├── 預定時間（設為發文當天的日期）
   └── 狀態設為「待發布」

2. 發文當天手動執行工作流程
   ├── 系統自動篩選當日「待發布」的項目
   ├── 同時發布到 FB 和 IG
   └── 自動回填發布結果

3. 收到 Email 通知確認結果
   ├── 全部成功：狀態 = 已發布
   └── 部分失敗：狀態 = 部分失敗（可查看錯誤原因）
```

---

## 工作流程節點說明

共 18 個節點，全部與 n8n 2.2.4 相容：

| # | 節點 | 類型 | 版本 | 功能 |
|---|------|------|------|------|
| 1 | 手動觸發 | `manualTrigger` | 1 | 手動執行 |
| 2 | 讀取 Google Sheets | `googleSheets` | 4.5 | 讀取資料 |
| 3 | 篩選當日待發布 | `code` | 2 | 篩選當日 + 待發布 + 只取第一筆 |
| 4 | 檢查有資料 | `if` | 2 | 條件分支 |
| 5 | 發文到 FB | `httpRequest` | 4.2 | Facebook Graph API |
| 6 | IG 建立容器 | `httpRequest` | 4.2 | Instagram 媒體容器 |
| 7 | FB 結果 | `code` | 2 | 處理 FB 回應 |
| 8 | IG 容器結果 | `code` | 2 | 處理 IG 容器回應 |
| 9 | IG 容器成功？ | `if` | 2 | 檢查容器建立 |
| 10 | IG 發布 | `httpRequest` | 4.2 | Instagram 發布 |
| 11 | IG 發布結果 | `code` | 2 | 處理 IG 發布回應 |
| 12 | IG 失敗 | `code` | 2 | IG 失敗處理 |
| 13 | 合併結果 | `merge` | 3 | 合併 FB 與 IG 結果 |
| 14 | 整理結果 | `code` | 2 | 整理最終輸出 |
| 15 | 回填狀態 | `googleSheets` | 4.5 | 更新狀態 |
| 16 | 寄送通知 | `emailSend` | 2.1 | 結果通知 |
| 17 | 錯誤觸發 | `errorTrigger` | 1 | 捕捉錯誤 |
| 18 | 錯誤通知 | `emailSend` | 2.1 | 失敗通知 |

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

### 步驟 1: 建立媒體容器

```
POST https://graph.facebook.com/v21.0/{ig-user-id}/media
```

| 參數 | 說明 |
|------|------|
| `image_url` | 圖片的公開 URL |
| `caption` | 貼文內容 |

回傳 `creation_id`

### 步驟 2: 發布貼文

```
POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
```

| 參數 | 說明 |
|------|------|
| `creation_id` | 步驟 1 回傳的 ID |

回傳貼文 ID

---

## 常見問題

### Q: FB/IG 發文失敗，顯示權限不足

1. 確認 Meta App 已取得必要權限
2. 確認授權時有勾選要發文的粉絲專頁
3. 在 n8n 中重新授權 Facebook Credential

### Q: IG 容器建立失敗

1. 圖片 URL 必須是**公開可存取**的 HTTPS 連結
2. 圖片格式需為 JPEG 或 PNG
3. 圖片大小建議在 8MB 以內
4. 測試：在瀏覽器開啟圖片 URL，確認可以看到圖片

### Q: IG 容器建立成功但發布失敗

可能原因：
1. 圖片正在處理中，稍後重試
2. 圖片不符合 Instagram 規範

### Q: 沒有找到 `instagram_business_account`

1. 確認 Instagram 是**商業帳號**或**創作者帳號**
2. 確認 Instagram 已**連結到 Facebook 粉絲專頁**
3. 在 Instagram App 中重新連結

### Q: 沒有找到當日資料

1. 確認「預定時間」日期為**今天**
2. 確認日期格式正確：`YYYY-MM-DD HH:mm`
3. 確認狀態為「待發布」

### Q: access to env vars denied

確認 `docker-compose.yml` 有這行：

```yaml
environment:
  - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

然後重啟容器：`docker-compose restart`

### Q: Token 過期

Meta Access Token 預設有效期為 60 天。如果 Token 過期：
1. 在 n8n 中編輯 Facebook Credential
2. 點選 **Sign in with Facebook** 重新授權

---

## 進階設定

### 設定定時執行

如果想每天自動執行（而非手動觸發）：

1. 刪除 `手動觸發` 節點
2. 新增 `Schedule Trigger` 節點
3. 設定 Cron 表達式，例如每天下午 2 點：
   ```
   0 14 * * *
   ```
4. 連接到 `讀取 Google Sheets` 節點

### 自動重試機制

所有 HTTP Request 節點已內建自動重試：

| 設定 | 值 | 說明 |
|------|-----|------|
| retryOnFail | true | 啟用失敗重試 |
| maxTries | 2 | 最多執行 2 次 |
| waitBetweenTries | 5000 | 等待 5 秒後重試 |

---

## 檔案結構

```
social-media-publisher/
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
| Facebook Graph API | v21.0 | ✅ |
| Instagram Graph API | v21.0 | ✅ |

**所有 18 個節點均與 n8n 2.2.4 完全相容。**
