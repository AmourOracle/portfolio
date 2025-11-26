# 專案開發指南與進度記錄 (v20)

本文件統整了 Portfolio 專案的最終架構、核心流程、技術細節與注意事項。此版本 (v20) 代表了專案在互動手感、移動端體驗與程式碼架構上的成熟穩定狀態。

## 1. 專案目前進度 (Project Status v20)

目前專案已達到 **v20 正式版本**。此版本確立了 "Native Scroll + Custom Visuals" 的核心互動邏輯，並針對移動端進行了深度優化，同時完善了視覺細節與跑馬燈系統。

*   **核心互動 (The Picker)**: 捨棄第三方庫 (Swiper.js)，採用原生 CSS Scroll Snap 結合 JS 3D 運算，實現了極致的 "iOS Alarm Picker" 滾動手感。
*   **移動端體驗 (Mobile)**: 解決了手機版滾動卡頓、佈局錯亂問題，並實現了與桌面版一致的 3D 滾輪視覺體驗。優化了 Footer 與 Filter 的觸控操作 (v19)。
*   **畫廊系統 (Gallery)**: 穩定的全螢幕無限畫布，支援慣性拖曳 (Inertia) 與平滑縮放 (Zoom)，並優化了圖片分佈邏輯 (Centralized Distribution)。
*   **視覺表現**: 導入了 "Cascading Entrance Animation" (層次化進場動畫系統)，並針對長標題實作了 "Sync Marquee" (同步跑馬燈) 視覺系統 (v18)。

---

## 2. 專案結構 (Project Structure)

專案採用 **Vanilla HTML/CSS/JS** 架構，無複雜建置工具，強調輕量與效能。

```text
/
├── index.html       # 入口頁 (Redirect -> portfolio.html)
├── portfolio.html   # [主頁] 專案列表 (核心互動頁面 - Custom Picker)
├── project.html     # [內頁] 專案詳細內容模板 (URL Params 驅動)
├── about.html       # [內頁] 關於我
├── gallery.html     # [內頁] 無限畫布畫廊 (Canvas-like Interaction)
├── data/
│   └── projects.json # 核心資料庫 (JSON 格式，包含所有專案資訊)
├── css/
│   └── main.css      # 全站樣式表 (CSS Variables, Grid, Scroll Snap, Animations)
└── js/
    ├── index.js      # portfolio.html 核心邏輯 (Picker Loop, Filter, State Sync, Marquee)
    ├── project.js    # project.html 渲染邏輯 (Fetch Data, Render Content)
    └── gallery.js    # gallery.html 互動邏輯 (Pan, Zoom, Inertia)
```

---

## 3. 核心流程與互動機制 (Core Processes)

### A. 專案列表滾動 (The Picker Mechanism)
這是本專案最核心的互動體驗，位於 `portfolio.html`。

1.  **物理層 (Physics)**:
    *   使用 CSS `overflow-y: scroll` 搭配 `scroll-snap-type: y mandatory`。
    *   **效果**: 提供原生作業系統級別的流暢滾動與精確停頓 (Snap)，這是 JS 模擬無法比擬的。
    *   **手機版**: 確保 `scroll-snap-stop: always` (或瀏覽器預設行為) 防止快速滑動時跳過項目。

2.  **視覺層 (Visuals)**:
    *   **Loop**: `js/index.js` 中的 `renderPickerLoop` 透過 `requestAnimationFrame` 持續運行。
    *   **計算**: 實時計算每個 `project-item` 與視窗中心線的距離。
    *   **變形**: 根據距離應用 CSS 3D Transform:
        *   `rotateX`: 模擬圓柱體旋轉 (-90deg to 90deg)。
        *   `scale`: 模擬景深 (中心最大，邊緣縮小)。
        *   `opacity`: 模擬聚焦 (中心不透明，邊緣半透明)。

3.  **狀態同步 (State Sync)**:
    *   Loop 內同時判斷 "哪個項目離中心最近" (Closest Item)。
    *   一旦最近項目改變，立即觸發 `setActiveItem`，更新左側資訊欄 (Title, Bio, Info) 與背景預覽圖。
    *   **跑馬燈 (Marquee v18)**:
        *   當標題過長時，動態插入 `.marquee-track` 結構實現無縫滾動。
        *   **強制啟用 (v18.3)**: 只要有標題即啟用跑馬燈結構，確保視覺一致性。
        *   **視覺同步**: 左側標題 (`#previewTitle`) 與列表標題同步應用 "括號分離" 與 "小字級類型" 的樣式處理 (Regex 解析)。
        *   **垂直對齊 (v18.2)**: 修正了跑馬燈內不同字級元素的垂直對齊問題。

### B. 專案內頁渲染 (Project Detail Rendering)
位於 `project.html`，採用動態渲染模式。

1.  **路由**: 讀取 URL 參數 `?id=xxx`。
2.  **資料**: Fetch `data/projects.json`，尋找對應 ID 的物件。
3.  **渲染**:
    *   填入 Title, Bio, Info。
    *   動態生成 `<img>` 標籤插入內容區。
    *   **Next Project**: 隨機挑選一個非當前專案作為 "Next Project" 連結 (v16+)。
4.  **動畫**: 資料載入完成後，添加 `.is-loaded` class 觸發 CSS 進場動畫。

### C. 無限畫廊 (Infinite Gallery)
位於 `gallery.html`，模擬 Canvas 的操作體驗。

1.  **架構**: 一個超大容器 (`#pan-container`, 5000x5000px) 放置於視窗內。
2.  **操作**:
    *   **Pan**: 監聽 `mousedown` / `touchstart` 計算位移 (`transform: translate`)。
    *   **Zoom**: 監聽 `wheel` 計算縮放 (`transform: scale`)，並以游標為中心進行校正。
    *   **Inertia**: 拖曳結束後，根據最後速度 (`velocityX/Y`) 應用摩擦力 (`FRICTION`) 進行慣性滑行。
3.  **圖片佈局 (v17.1)**:
    *   採用 **Centralized Distribution** (集中分佈) 策略。
    *   圖片生成在畫布中心點 (2500, 2500) 周圍 +/- 1500px 的範圍內，避免邊緣過多留白。
    *   手機版初始縮放比例調整為 0.6 以展示更多內容。

---

## 4. 技術細節 (Technical Details)

### CSS 架構
*   **Variables**: 使用 `:root` 定義全站色票 (`--primary-color`, `--secondary-color`) 與字體。
*   **Scroll Snap**: 關鍵屬性 `scroll-snap-align: center` (Item) 與 `scroll-snap-type: y mandatory` (Container)。
*   **Masking**: 使用 `mask-image` (linear-gradient) 在列表上下邊緣製造淡出效果。
*   **Marquee Styling (v18)**: 統一使用 CSS class (`.t-paren`, `.t-type`) 管理跑馬燈內的括號與類型樣式，移除行內樣式。

### 進場動畫系統 (Cascading Entrance)
*   **機制**: 定義 `.is-loaded` 狀態下的元素樣式 (Opacity 1, Transform 0)。
*   **錯落感**: 使用 `nth-child` 選擇器為列表項目與圖片設定遞增的 `transition-delay` (0.1s, 0.15s, 0.2s...)，創造瀑布流般的進場效果。

### JavaScript 優化
*   **Fisher-Yates Shuffle (v17.5)**: 專案列表載入時自動隨機打亂順序，確保每次進入體驗不同。
*   **RequestAnimationFrame**: 所有的視覺更新 (Picker Loop, Gallery Inertia) 皆透過 rAF 執行，確保 60fps 流暢度。
*   **Event Delegation**: 篩選器 (Filter) 使用事件委派，減少 Event Listeners 數量。
*   **Passive Listeners**: 滾動監聽使用 `{ passive: true }` 優化效能。

---

## 5. 注意事項與維護 (Precautions & Maintenance)

1.  **圖片資源**:
    *   確保 `data/projects.json` 中的圖片路徑正確。
    *   建議對圖片進行壓縮與 Lazy Loading (Gallery 已實作 `loading="lazy"`)。

2.  **移動端適配 (Mobile v19)**:
    *   **滾動鎖定**: `body.portfolio-scroll-lock` 用於防止背景滾動，確保 Picker 體驗。
    *   **Footer 優化**: 手機版 Footer 連結順序調整為 Me, Gallery, Instagram, Email，並優化觸控區域。
    *   **瀏覽器導航列**: CSS `100vh` 在手機上可能會被網址列遮擋，目前使用 `calc(100vh - 60px)` 配合 `position: fixed` header 處理。

3.  **效能監控**:
    *   目前 Picker Loop 對所有 `visibleItems` 進行計算。若專案數量超過 100+，建議優化 Loop 邏輯 (僅計算視窗內的項目) 以節省 CPU 資源。

4.  **擴充性**:
    *   若需新增頁面，請遵循 `main.css` 的變數規範與 Grid 佈局系統。
    *   新增專案只需更新 `projects.json`，無需修改 HTML。

---

**Version**: v20.1
**Last Updated**: 2025-11-26