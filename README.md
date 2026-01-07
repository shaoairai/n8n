# n8n SEO Blog Auto Publisher

自動產出 SEO 部落格文章並發布到 WordPress、Facebook、Instagram，完成後發送 Email 通知。

## 流程

```
Webhook 輸入 → AI 產文 → 發 WordPress → 發 Facebook → AI 產圖 → 發 Instagram → Email 通知
```

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `docker-compose.yml` | n8n Docker 設定 |
| `config.env` | 環境變數（API Keys） |
| `workflow-seo-blog-simple.json` | n8n Workflow（匯入用） |
| `test-request.json` | 測試用範例請求 |

## 快速開始

### 1. 編輯 config.env

填入你的 API Keys：

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxx

# WordPress
WP_BASE_URL=https://your-site.com
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Meta (Facebook/Instagram)
META_PAGE_ID=123456789012345
META_IG_USER_ID=17841400000000000
META_ACCESS_TOKEN=EAAxxxxxxxx

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### 2. 啟動 n8n

```bash
docker-compose up -d
```

### 3. 匯入 Workflow

1. 打開 http://localhost:5678
2. 建立帳號登入
3. Workflows → Import from File → 選擇 `workflow-seo-blog-simple.json`
4. 儲存並啟用

### 4. 設定 Credentials

在 n8n 中新增兩個 Credential：

**WordPress Auth (HTTP Basic Auth)**
- Name: `WordPress Auth`
- User: 你的 WP_USERNAME
- Password: 你的 WP_APP_PASSWORD

**SMTP**
- Name: `SMTP`
- Host: smtp.gmail.com
- Port: 465
- User: 你的 Gmail
- Password: Gmail 應用程式密碼

### 5. 測試

```bash
curl -X POST http://localhost:5678/webhook/seo-blog \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "n8n 自動化",
    "direction": "針對行銷人員介紹自動化好處",
    "publish_now": false
  }'
```

## Webhook 輸入參數

| 參數 | 必填 | 說明 |
|------|------|------|
| `keyword` | ✅ | 主要關鍵字 |
| `direction` | ✅ | 文章方向/受眾/語氣 |
| `experience` | ❌ | 你的經歷素材（選填） |
| `publish_now` | ❌ | `true`=發布, `false`=草稿 |

## API 取得方式

### Anthropic API Key
1. https://console.anthropic.com
2. Settings → API Keys → Create Key
3. 新帳號有 $5 免費額度

### WordPress 應用程式密碼
1. WP 後台 → 使用者 → 編輯你的帳號
2. 捲到「應用程式密碼」→ 新增
3. 複製 24 字元密碼（含空格）

### Meta Access Token
1. https://developers.facebook.com → 建立應用程式
2. 新增 Instagram Graph API
3. Graph API Explorer → 取得 Page Access Token
4. 需要權限：`pages_manage_posts`, `instagram_content_publish`

### Meta IG User ID
Graph API Explorer 查詢：
```
GET /{page-id}?fields=instagram_business_account
```

### Gmail 應用程式密碼
1. https://myaccount.google.com/apppasswords
2. 選擇「郵件」→「Windows 電腦」→ 產生
3. 複製 16 字元密碼

## 輸出結果

成功後會收到 Email，內容包含：
- WordPress 文章連結
- Facebook 貼文 ID
- Instagram 貼文 ID

API 回傳範例：
```json
{
  "status": "completed",
  "article_title": "...",
  "wordpress": { "id": 123, "url": "https://..." },
  "facebook": { "id": "..." },
  "instagram": { "id": "...", "image_url": "..." }
}
```

## 常見問題

| 問題 | 解決方案 |
|------|----------|
| WP 401 Unauthorized | 確認應用程式密碼正確（含空格） |
| Meta Token 失效 | Token 60 天過期，需重新取得 |
| IG 發布失敗 | 確認 IG 是商業帳號且連結 FB Page |
| Email 發送失敗 | 確認 Gmail 已開啟兩步驟驗證並產生應用程式密碼 |
