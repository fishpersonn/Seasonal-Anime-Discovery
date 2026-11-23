# Seasonal Anime Discovery (當季新番探索) ✨

![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)
![Data](https://img.shields.io/badge/data-AniList-02a9ff.svg)

[English](#english) | [中文說明](#chinese)

---

<a name="english"></a>
## 🇬🇧 English

### Introduction
**Seasonal Anime Discovery** is a cute, responsive web app for browsing every anime airing in the current season (it picks Winter, Spring, Summer or Fall automatically from today's date). It pulls live data from the [AniList](https://anilist.co) GraphQL API and lets you search, filter, sort and favorite titles, then open a detail view with the synopsis and trailer. It has a bright rainbow-candy theme with falling petals, and works in English and Traditional Chinese.

### Features
*   **Live data:** Fetches the current season's lineup from the AniList API, ordered by popularity.
*   **Infinite scroll:** Pages load automatically as you scroll. Filters work over the whole season, because the remaining pages keep loading in the background.
*   **Search:** Debounced title search (matches English and romaji titles).
*   **Filters:** Source (manga, original, light novel, ...) and **multi-select genres**, with item counts. Choosing several genres shows titles that match *all* of them.
*   **Sorting:** Default, score, popularity rank, members, release date, episode count, or title.
*   **Shareable URLs:** Search, filters, genres, favorites-only and sort are stored in the URL (`?q=&source=&genre=&sort=&fav=1`), so you can bookmark or share a view and it survives a reload.
*   **Favorites:** Heart any anime to keep it in a watchlist. It is saved in your browser's `localStorage`, and there is a "favorites only" filter.
*   **Detail modal:** Large cover art, synopsis, stats and an embedded YouTube trailer when one is available.
*   **Bilingual UI:** Switch between English and Traditional Chinese. The choice is remembered, and the first visit follows your browser language. Genre, source and type labels are translated too.
*   **Resilient loading:** Request timeout with automatic retry, a manual retry button, skeleton placeholders, and a 30-minute `sessionStorage` cache to avoid repeat requests.
*   **Responsive:** 1 column on phones up to 5 columns on large screens, with a slide-out filter sidebar on mobile.

### Tech Stack
*   **Framework:** React 18 (client-side rendering)
*   **Language:** TypeScript
*   **Build tool:** Vite
*   **Styling:** Tailwind CSS (via CDN) + animate.css
*   **Icons:** Lucide React
*   **Data:** [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/) (no API key needed)

### Getting Started

**Requirements:** [Node.js](https://nodejs.org) 18 or newer.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/fishpersonn/Seasonal-Anime-Discovery.git
    cd Seasonal-Anime-Discovery
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the dev server**
    ```bash
    npm run dev
    ```

4.  **Open your browser** at `http://localhost:3000`.

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server (port 3000)     |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Preview the production build locally |

### Project Structure
```
├── App.tsx                  # Main app: state, URL sync, filtering, sorting, infinite scroll
├── index.tsx / index.html   # Entry point, Tailwind config and fonts
├── types.ts                 # Shared TypeScript types
├── services/
│   └── jikanService.ts      # AniList fetching, mapping, retry and cache
│                            # (file name kept from the old Jikan source)
├── components/              # AnimeCard, AnimeModal, FilterSidebar, Toast, skeleton, petals
└── utils/
    ├── translations.ts      # English / Traditional Chinese UI strings
    ├── labels.ts            # Localized genre, source and type labels
    └── candyColors.ts       # Theme colors
```

### Disclaimer
Anime data is provided by [AniList](https://anilist.co). This project is a fan-made app and is not affiliated with AniList or any anime studio. All cover art, trailers and synopses belong to their respective owners.

---

<a name="chinese"></a>
## 🇹🇼 中文說明

### 專案簡介
**當季新番探索** 是一個可愛風格、響應式的網頁應用程式，讓你輕鬆瀏覽當季播出的所有動畫（會依今天日期自動選擇冬、春、夏、秋季）。資料即時來自 [AniList](https://anilist.co) GraphQL API，可搜尋、篩選、排序與收藏作品，點開卡片還能看到劇情簡介和預告片。介面採用明亮的彩虹糖果配色與飄落花瓣特效，支援英文與繁體中文。

### 功能特色
*   **即時資料：** 從 AniList API 取得當季新番，預設依人氣排序。
*   **無限捲動：** 往下捲動自動載入下一頁。篩選條件會作用在整季作品上，因為剩餘頁面會持續在背景載入。
*   **搜尋：** 標題搜尋（有輸入延遲處理），可比對英文與羅馬拼音標題。
*   **篩選：** 可依「原作來源」（漫畫、原創、輕小說…）與 **多選類型** 篩選並顯示數量。選擇多個類型時，只會顯示同時符合全部類型的作品。
*   **排序：** 預設、評分、人氣排名、成員數、開播日期、集數、標題。
*   **可分享的網址：** 搜尋、篩選、類型、僅看收藏與排序都會記錄在網址（`?q=&source=&genre=&sort=&fav=1`），可以加入書籤或分享給朋友，重新整理後也會保留。
*   **收藏功能：** 點擊愛心加入收藏，資料儲存在瀏覽器 `localStorage`，並提供「只看收藏」篩選。
*   **詳情視窗：** 高畫質封面、劇情簡介、統計資料，有預告片時可直接內嵌播放 YouTube。
*   **雙語介面：** 可切換英文／繁體中文，會記住你的選擇，首次進入則依瀏覽器語言決定。類型、來源、播出形式等標籤也已翻譯。
*   **穩定的載入機制：** 請求逾時自動重試、手動重試按鈕、骨架載入畫面，並使用 `sessionStorage` 快取 30 分鐘以減少重複請求。
*   **響應式設計：** 手機單欄到大螢幕五欄，手機版提供側滑篩選面板。

### 技術堆疊
*   **框架：** React 18（CSR）
*   **語言：** TypeScript
*   **建置工具：** Vite
*   **樣式：** Tailwind CSS（CDN）+ animate.css
*   **圖示：** Lucide React
*   **資料來源：** [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/)（不需要 API Key）

### 安裝與執行

**環境需求：** [Node.js](https://nodejs.org) 18 以上。

1.  **複製專案**
    ```bash
    git clone https://github.com/fishpersonn/Seasonal-Anime-Discovery.git
    cd Seasonal-Anime-Discovery
    ```

2.  **安裝套件**
    ```bash
    npm install
    ```

3.  **啟動開發伺服器**
    ```bash
    npm run dev
    ```

4.  **開啟瀏覽器** 前往 `http://localhost:3000`。

### 指令

| 指令              | 說明                         |
| ----------------- | ---------------------------- |
| `npm run dev`     | 啟動開發伺服器（連接埠 3000）|
| `npm run build`   | 建置正式版至 `dist/`         |
| `npm run preview` | 在本機預覽正式版             |

### 專案結構
```
├── App.tsx                  # 主程式：狀態、網址同步、篩選、排序、無限捲動
├── index.tsx / index.html   # 進入點、Tailwind 設定與字型
├── types.ts                 # 共用型別
├── services/
│   └── jikanService.ts      # AniList 資料請求、轉換、重試與快取
│                            # （檔名沿用舊的 Jikan 資料來源）
├── components/              # 動畫卡片、詳情視窗、篩選側欄、提示訊息、骨架畫面、花瓣
└── utils/
    ├── translations.ts      # 英文／繁體中文介面文字
    ├── labels.ts            # 類型、來源、形式的在地化標籤
    └── candyColors.ts       # 主題色彩
```

### 免責聲明
動畫資料由 [AniList](https://anilist.co) 提供。本專案為粉絲自製作品，與 AniList 及任何動畫公司無關。所有封面圖片、預告片與劇情簡介版權皆屬原權利人所有。
