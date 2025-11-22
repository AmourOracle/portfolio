# 專案開發指南與進度記錄 (v16)

本文件統整了 Portfolio 專案的最終架構、核心流程、技術細節與注意事項。此版本 (v16) 代表了專案在互動手感、移動端體驗與程式碼架構上的成熟穩定狀態。

## 1. 專案目前進度 (Project Status v16)

目前專案已達到 **v16 正式版本**。此版本確立了 "Native Scroll + Custom Visuals" 的核心互動邏輯，並針對移動端進行了深度優化。

*   **核心互動 (The Picker)**: 捨棄第三方庫 (Swiper.js)，採用原生 CSS Scroll Snap 結合 JS 3D 運算，實現了極致的 "iOS Alarm Picker" 滾動手感。
*   **移動端體驗 (Mobile)**: 解決了手機版滾動卡頓、佈局錯亂問題，並實現了與桌面版一致的 3D 滾輪視覺體驗。
*   **畫廊系統 (Gallery)**: 穩定的全螢幕無限畫布，支援慣性拖曳 (Inertia) 與平滑縮放 (Zoom)。
*   **視覺表現**: 導入了 "Cascading Entrance Animation" (層次化進場動畫系統)，提升頁面切換質感。

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
    ├── index.js      # portfolio.html 核心邏輯 (Picker Loop, Filter, State Sync)
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

### B. 專案內頁渲染 (Project Detail Rendering)
位於 `project.html`，採用動態渲染模式。

1.  **路由**: 讀取 URL 參數 `?id=xxx`。
2.  **資料**: Fetch `data/projects.json`，尋找對應 ID 的物件。
3.  **渲染**:
    *   填入 Title, Bio, Info。
    *   動態生成 `<img>` 標籤插入內容區。
    *   **Next Project**: 隨機挑選一個非當前專案作為 "Next Project" 連結。
4.  **動畫**: 資料載入完成後，添加 `.is-loaded` class 觸發 CSS 進場動畫。

### C. 無限畫廊 (Infinite Gallery)
位於 `gallery.html`，模擬 Canvas 的操作體驗。

1.  **架構**: 一個超大容器 (`#pan-container`, 5000x5000px) 放置於視窗內。
2.  **操作**:
    *   **Pan**: 監聽 `mousedown` / `touchstart` 計算位移 (`transform: translate`)。
    *   **Zoom**: 監聽 `wheel` 計算縮放 (`transform: scale`)，並以游標為中心進行校正。
    *   **Inertia**: 拖曳結束後，根據最後速度 (`velocityX/Y`) 應用摩擦力 (`FRICTION`) 進行慣性滑行。
3.  **圖片佈局**: JS 隨機計算每張圖片的位置 (top, left)、旋轉角度與 Z-Index，形成散落效果。

---

## 4. 技術細節 (Technical Details)

### CSS 架構
*   **Variables**: 使用 `:root` 定義全站色票 (`--primary-color`, `--secondary-color`) 與字體。
*   **Scroll Snap**: 關鍵屬性 `scroll-snap-align: center` (Item) 與 `scroll-snap-type: y mandatory` (Container)。
*   **Masking**: 使用 `mask-image` (linear-gradient) 在列表上下邊緣製造淡出效果。

### 進場動畫系統 (Cascading Entrance)
*   **機制**: 定義 `.is-loaded` 狀態下的元素樣式 (Opacity 1, Transform 0)。
*   **錯落感**: 使用 `nth-child` 選擇器為列表項目與圖片設定遞增的 `transition-delay` (0.1s, 0.15s, 0.2s...)，創造瀑布流般的進場效果。

### JavaScript 優化
*   **RequestAnimationFrame**: 所有的視覺更新 (Picker Loop, Gallery Inertia) 皆透過 rAF 執行，確保 60fps 流暢度。
*   **Event Delegation**: 篩選器 (Filter) 使用事件委派，減少 Event Listeners 數量。
*   **Passive Listeners**: 滾動監聽使用 `{ passive: true }` 優化效能。

---

## 5. 注意事項與維護 (Precautions & Maintenance)

1.  **圖片資源**:
    *   確保 `data/projects.json` 中的圖片路徑正確。
    *   建議對圖片進行壓縮與 Lazy Loading (Gallery 已實作 `loading="lazy"`)。

2.  **移動端適配 (Mobile)**:
    *   **滾動鎖定**: `body.portfolio-scroll-lock` 用於防止背景滾動，但在部分 iOS Safari 版本可能需要額外處理 (如 `touch-action: none`)。
    *   **瀏覽器導航列**: CSS `100vh` 在手機上可能會被網址列遮擋，建議使用 `dvh` (Dynamic Viewport Height) 或 JS 計算視窗高度。

3.  **效能監控**:
    *   目前 Picker Loop 對所有 `visibleItems` 進行計算。若專案數量超過 100+，建議優化 Loop 邏輯 (僅計算視窗內的項目) 以節省 CPU 資源。

4.  **擴充性**:
    *   若需新增頁面，請遵循 `main.css` 的變數規範與 Grid 佈局系統。
    *   新增專案只需更新 `projects.json`，無需修改 HTML。

---

**Version**: v16.0
**Last Updated**: 2025-11-22