# 社群媒體發文工作流程優化報告

本文件分析 `workflow-social-media-publisher.json` 中每個節點的實作方式，評估是否有優化空間。

> **驗證版本**: n8n 2.2.4

## 分析摘要

| 項目 | 數量 |
|------|------|
| 總節點數 | 18 |
| 總連接數 | 15 |
| 已最佳化 | 18 |
| 需改善 | 0 |

**結論：工作流程已完全優化，所有節點與 n8n 2.2.4 相容。**

---

## 節點版本詳細清單

### 觸發與資料讀取

| # | 節點名稱 | 類型 | 版本 | 狀態 | 說明 |
|---|----------|------|------|------|------|
| 1 | 手動觸發 | `manualTrigger` | 1 | ✅ | 基礎觸發節點 |
| 2 | 讀取 Google Sheets | `googleSheets` | 4.5 | ✅ | 原生節點，支援 OAuth |
| 3 | 篩選當日待發布 | `code` | 2 | ✅ | 篩選狀態 + 當日日期 + 只取第一筆 |
| 4 | 檢查有資料 | `if` | 2 | ✅ | 條件分支 |

### Facebook 發文

| # | 節點名稱 | 類型 | 版本 | 狀態 | 說明 |
|---|----------|------|------|------|------|
| 5 | 發文到 FB | `httpRequest` | 4.2 | ✅ | Graph API v21.0 + 自動重試 |
| 6 | FB 結果 | `code` | 2 | ✅ | 處理 API 回應 |

### Instagram 發文

| # | 節點名稱 | 類型 | 版本 | 狀態 | 說明 |
|---|----------|------|------|------|------|
| 7 | IG 建立容器 | `httpRequest` | 4.2 | ✅ | 建立媒體容器 + 自動重試 |
| 8 | IG 容器結果 | `code` | 2 | ✅ | 處理容器回應 |
| 9 | IG 容器成功？ | `if` | 2 | ✅ | 條件分支 |
| 10 | IG 發布 | `httpRequest` | 4.2 | ✅ | 發布貼文 + 自動重試 |
| 11 | IG 發布結果 | `code` | 2 | ✅ | 處理發布回應 |
| 12 | IG 失敗 | `code` | 2 | ✅ | 容器建立失敗處理 |

### 結果處理與通知

| # | 節點名稱 | 類型 | 版本 | 狀態 | 說明 |
|---|----------|------|------|------|------|
| 13 | 合併結果 | `merge` | 3 | ✅ | 合併 FB 與 IG 結果 |
| 14 | 整理結果 | `code` | 2 | ✅ | 整理最終輸出 |
| 15 | 回填狀態 | `googleSheets` | 4.5 | ✅ | appendOrUpdate 操作 |
| 16 | 寄送通知 | `emailSend` | 2.1 | ✅ | SMTP 寄信 |

### 錯誤處理

| # | 節點名稱 | 類型 | 版本 | 狀態 | 說明 |
|---|----------|------|------|------|------|
| 17 | 錯誤觸發 | `errorTrigger` | 1 | ✅ | 捕捉所有錯誤 |
| 18 | 錯誤通知 | `emailSend` | 2.1 | ✅ | 失敗通知 |

---

## 連接驗證

```
總連接數：15
主流程連接：14
錯誤處理連接：1

✅ 所有連接格式正確
✅ 所有節點名稱對應正確
✅ Merge 節點雙輸入正確配置
```

### 連接流程圖

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
│     │       │      │         │
└─────┴───────┴──────┴─────────┘
              ↓
         合併結果 (Merge)
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

## 重點設計說明

### 1. 為何使用 HTTP Request 而非原生節點？

**Facebook / Instagram：**

n8n 目前沒有原生的 Facebook 或 Instagram 發文節點。使用 HTTP Request 搭配 OAuth2 是標準做法：

- Facebook: `/{page-id}/photos` 端點
- Instagram: 兩步驟發布 (建立容器 → 發布)

### 2. Instagram 兩步驟發布流程

Instagram Graph API 要求兩步驟發布：

1. **建立媒體容器** - `POST /{ig-user-id}/media`
   - 傳入 `image_url` 和 `caption`
   - 回傳 `creation_id`

2. **發布貼文** - `POST /{ig-user-id}/media_publish`
   - 傳入 `creation_id`
   - 回傳 `id` (貼文 ID)

### 3. 並行執行設計

「檢查有資料」節點的 true 輸出同時連接到：
- 發文到 FB
- IG 建立容器

這兩個節點會**並行執行**，提升效率。

### 4. Merge 節點雙輸入

`合併結果` 節點使用 `combineByPosition` 模式：
- Input 0: FB 結果
- Input 1: IG 發布結果 或 IG 失敗

確保兩個平台的結果都被正確合併。

### 5. 自動重試機制

所有 HTTP Request 節點皆設定自動重試：

```json
{
  "onError": "continueErrorOutput",
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 5000
}
```

| 設定 | 值 | 說明 |
|------|-----|------|
| `retryOnFail` | `true` | 啟用失敗重試 |
| `maxTries` | `2` | 最多執行 2 次 |
| `waitBetweenTries` | `5000` | 等待 5 秒後重試 |
| `onError` | `continueErrorOutput` | 重試仍失敗時繼續執行 |

### 6. 篩選當日待發布邏輯

「篩選當日待發布」節點整合了三個功能：

1. 篩選狀態為「待發布」
2. 篩選預定時間為當天日期
3. 只取第一筆資料

減少了獨立的 Filter 和 Limit 節點。

---

## 效能考量

### API 呼叫次數（每次執行）

| API | 呼叫次數 | 說明 |
|-----|----------|------|
| Google Sheets | 2 | 讀取 + 回填 |
| Facebook Graph | 1 | 發文 |
| Instagram Graph | 2 | 建立容器 + 發布 |
| SMTP | 1 | 通知信 |

**總計：6 次 API 呼叫 / 每篇發文**

### 預估執行時間

| 階段 | 預估時間 |
|------|----------|
| 讀取 Sheets | ~1 秒 |
| FB 發文 | ~2-5 秒 |
| IG 發文 | ~3-8 秒 |
| 回填 + 通知 | ~2 秒 |

**總計：約 8-16 秒 / 每篇發文**

---

## 版本相容性總表

| 節點類型 | 使用版本 | n8n 2.2.4 | 備註 |
|----------|----------|-----------|------|
| `manualTrigger` | 1 | ✅ | 基礎節點 |
| `googleSheets` | 4.5 | ✅ | n8n 2.x 標準 |
| `code` | 2 | ✅ | 標準版本 |
| `if` | 2 | ✅ | 標準版本 |
| `httpRequest` | 4.2 | ✅ | 標準版本 |
| `merge` | 3 | ✅ | 標準版本 |
| `emailSend` | 2.1 | ✅ | 預設版本 |
| `errorTrigger` | 1 | ✅ | 基礎節點 |

**所有 18 個節點均與 n8n 2.2.4 完全相容。**

---

## 環境變數設定

| 變數名稱 | 說明 |
|----------|------|
| `SOCIAL_SHEET_ID` | Google Sheets 文件 ID |
| `FB_PAGE_ID` | Facebook 粉絲專頁 ID |
| `IG_BUSINESS_ACCOUNT_ID` | Instagram 商業帳號 ID |
| `NOTIFY_EMAIL` | 通知信收件人 |

---

## Google Sheets 欄位格式

| 欄位 | 類型 | 說明 |
|------|------|------|
| 關鍵字 | 文字 | 唯一識別碼（用於比對更新） |
| 圖片網址 | URL | 公開可存取的圖片連結 |
| FB內文 | 文字 | Facebook 貼文內容 |
| IG內文 | 文字 | Instagram 貼文內容 |
| 預定時間 | 日期時間 | 格式：`2025-01-22 14:30` |
| 狀態 | 文字 | 待發布 / 已發布 / 部分失敗 |
| 發布時間 | 日期時間 | 系統自動填入 |

---

## Credentials 設定

### 1. Google Sheets OAuth2

- 需要 Google Cloud Console 設定 OAuth 2.0
- 範圍：`https://www.googleapis.com/auth/spreadsheets`

### 2. Facebook Graph API OAuth2

- 需要 Meta for Developers 設定應用程式
- 必要權限：
  - `pages_manage_posts` - 管理粉絲專頁貼文
  - `pages_read_engagement` - 讀取粉絲專頁互動
  - `instagram_basic` - Instagram 基本存取
  - `instagram_content_publish` - Instagram 內容發布

### 3. SMTP

- 設定 SMTP 伺服器資訊（如 Gmail、SendGrid 等）
