# n8n 自動化工作流程

本專案包含兩個獨立的 n8n 自動化工作流程，各自有獨立的資料夾和文件。

> **相容版本**: n8n 2.2.4（已驗證）

---

## 工作流程一覽

| 工作流程 | 資料夾 | 節點數 | 功能 |
|----------|--------|--------|------|
| SEO Blog Publisher | [`blog-publisher/`](blog-publisher/) | 25 | AI 產文產圖 → WordPress |
| Social Media Publisher | [`social-media-publisher/`](social-media-publisher/) | 18 | FB + IG 社群發文 |

---

## 快速開始

### 1. 選擇你需要的工作流程

- **想要 AI 自動產文發布到 WordPress？** → 前往 [`blog-publisher/`](blog-publisher/)
- **想要發文到 Facebook + Instagram？** → 前往 [`social-media-publisher/`](social-media-publisher/)

### 2. 共用環境設定

兩個工作流程共用相同的 Docker 環境：

```bash
# 複製環境變數範本
cp config.env.example config.env

# 編輯 config.env 填入你的設定
# 根據你使用的工作流程填入對應的環境變數

# 啟動 n8n
docker-compose up -d

# 開啟瀏覽器
# http://localhost:5678
```

---

## 資料夾結構

```
n8n/
├── README.md                    # 本文件（專案總覽）
├── docker-compose.yml           # Docker 設定
├── config.env.example           # 環境變數範本
├── config.env                   # 環境變數（需自行填寫，勿上傳）
│
├── blog-publisher/              # SEO Blog 工作流程
│   ├── README.md                # Blog 使用指南
│   ├── OPTIMIZATION.md          # 節點優化分析
│   └── workflow.json            # n8n 工作流程檔案
│
├── social-media-publisher/      # 社群媒體工作流程
│   ├── README.md                # Social Media 使用指南
│   ├── OPTIMIZATION.md          # 節點優化分析
│   └── workflow.json            # n8n 工作流程檔案
│
└── data/                        # n8n 資料目錄（掛載到容器）
```

---

## 環境變數說明

### Blog Publisher 需要的環境變數

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

# Email 通知
NOTIFY_EMAIL=your-email@example.com
```

### Social Media Publisher 需要的環境變數

```env
# Google Sheets ID（社群發文用）
SOCIAL_SHEET_ID=1ABC123xxxxxx

# Facebook
FB_PAGE_ID=123456789012345

# Instagram
IG_BUSINESS_ACCOUNT_ID=17841400000000

# Email 通知
NOTIFY_EMAIL=your-email@example.com
```

---

## 各工作流程詳細說明

請參考各資料夾內的 README.md：

- **Blog Publisher**: [`blog-publisher/README.md`](blog-publisher/README.md)
- **Social Media Publisher**: [`social-media-publisher/README.md`](social-media-publisher/README.md)

---

## 版本相容性

| 元件 | 版本 | 狀態 |
|------|------|------|
| n8n | 2.2.4 | ✅ 已驗證 |
| Node.js | 18+ | ✅ |
| Docker | 20+ | ✅ |

---

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！
