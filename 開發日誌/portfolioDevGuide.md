# 專案開發指南與進度記錄 (v11.11)

本文件統整了 Portfolio 專案的最終架構、核心流程、技術細節與注意事項。

## 1. 專案目前進度 (Project Status v11.11)

目前專案已達到 **v11.11 穩定版本**。桌面版與手機版的佈局、互動體驗皆已統一並優化。

*   **桌面版 (Desktop)**: 運行良好，滾動手感已優化為類 iOS 選擇器體驗。
*   **手機版 (Mobile)**: 佈局修復，預覽視窗與導航功能正常。
*   **Gallery**: 全螢幕無限畫布體驗流暢，無意外滾動問題。

---

## 2. 專案結構 (Project Structure)

專案採用 **HTML/CSS/JS 分離** 的架構，所有頁面共用同一個 `main.css` 以確保樣式一致性。

```text
/
├── index.html       # 入口頁 (負責轉導至 portfolio.html)
├── portfolio.html   # [主頁] 專案列表 (核心互動頁面)
├── project.html     # [內頁] 專案詳細內容模板
├── about.html       # [內頁] 關於我
├── gallery.html     # [內頁] 無限畫布畫廊
├── data/
│   └── projects.json # 核心資料庫 (JSON 格式)
├── css/
│   └── main.css      # 全站樣式表 (包含 RWD 設定)
└── js/
    ├── index.js      # portfolio.html 的核心邏輯 (滾動、預覽、篩選)
    ├── project.js    # project.html 的內容渲染邏輯
    └── gallery.js    # gallery.html 的 Canvas 繪圖與互動邏輯
```

---

## 3. 核心流程與互動機制 (Core Flow & Interaction)

### A. 專案列表滾動 (Portfolio Scrolling)
*   **機制**: **JS 劫持 (JS Hijacking)**。
*   **桌面版**: 監聽 `wheel` 事件。
    *   **手感**: 模擬 iOS 鬧鐘選擇器 (Picker)，滾動一次精確切換一個項目 (Ratchet feel)。
    *   **優化**: 移除了 CSS Scroll Snap 以避免卡頓。
*   **手機版**: 監聽 `touchstart`, `touchmove`, `touchend`。
    *   **手感**: 跟隨手指拖動，放開後自動吸附至最近項目。

### B. 畫廊體驗 (Gallery Experience)
*   **機制**: **全螢幕 Canvas + 固定 UI**。
*   **互動**: 支援滑鼠拖曳 (Pan) 與滾輪縮放 (Zoom)。
*   **防護**: 透過 `body.gallery-scroll-lock` 鎖定原生滾動，防止頁面因內容溢出而晃動。

### C. 預覽視窗 (Preview Popup)
*   **觸發**: 當專案位於視窗中央 (Active) 時觸發。
*   **位置**: 隨機浮動位置 (Random Position)，但有邊界檢查防止超出螢幕。
*   **手機版**: 強制置中顯示，並調整長寬比為 1:1。

---

## 4. 開發注意事項 (Technical Notes & Gotchas)

### CSS 架構
*   **`main.css`**: 是唯一的樣式來源。修改時請注意不要破壞其他頁面的佈局。
*   **`.middle-container`**: 所有頁面的主容器。
    *   高度設定為 `calc(100vh - 60px)` (扣除 Header)，以確保佈局固定。
*   **Z-Index 管理 (Gallery)**:
    *   `z-index: 0`: 底層 UI (標題)。
    *   `z-index: 1`: Canvas 畫布 (中層)。
    *   `z-index: 2`: 頂層 UI (Back 按鈕)，確保可點擊。

### JavaScript 邏輯
*   **滾動劫持**: `index.js` 中使用了 `event.preventDefault()` 來阻止原生滾動。若需恢復原生滾動，需移除相關監聽器並恢復 CSS `overflow-y: auto`。
*   **資料載入**: 目前每個頁面獨立 fetch `projects.json`。修改資料結構時需同步檢查所有 JS 檔案。

### 常見問題排除
*   **Gallery 無法點擊 Back 按鈕**: 檢查 `.left-column-bottom` 的 `z-index` 是否大於 Canvas。
*   **頁面出現雙重滾動條**: 檢查 `body` 或 `.center-column` 是否同時設定了 `overflow: scroll`。目前應由 JS 控制或鎖定。

---

## 5. 未來優化方向 (Future Roadmap)

以下項目建議在 2.0 版本中考慮：

1.  **模組化 (Modularity)**: 建立 `dataService.js` 統一管理資料請求與快取。
2.  **虛擬化 (Virtualization)**: Gallery 頁面僅渲染可見範圍內的圖片，提升效能。
3.  **轉場效果 (Transitions)**: 重新實作全站統一的頁面切換動畫 (Fade in/out)。