# 專案開發指南與進度記錄 (v15)

本文件統整了 Portfolio 專案的最終架構、核心流程、技術細節與注意事項。

## 1. 專案目前進度 (Project Status v15)

目前專案已達到 **v15 穩定版本**。在此版本中，我們**完全移除了 Swiper.js**，回歸並優化了自定義的 JavaScript 滾動邏輯，以實現最精確的 "iOS Picker" 手感。

*   **桌面版 (Desktop)**: 恢復 Custom JS 驅動的 3D 滾輪效果，配合 CSS Scroll Snap 實現精確停頓。
*   **手機版 (Mobile)**: 修復了滾動與佈局問題，實現了與桌面版一致的 3D 滾輪體驗，並優化了文字排版與遮罩視覺。
*   **Gallery**: 全螢幕無限畫布體驗流暢。

---

## 2. 專案結構 (Project Structure)

專案採用 **HTML/CSS/JS 分離** 的架構，所有頁面共用同一個 `main.css` 以確保樣式一致性。

```text
/
├── index.html       # 入口頁 (負責轉導至 portfolio.html)
├── portfolio.html   # [主頁] 專案列表 (核心互動頁面 - Custom JS Picker)
├── project.html     # [內頁] 專案詳細內容模板
├── about.html       # [內頁] 關於我
├── gallery.html     # [內頁] 無限畫布畫廊
├── data/
│   └── projects.json # 核心資料庫 (JSON 格式)
├── css/
│   └── main.css      # 全站樣式表 (包含 RWD 設定)
└── js/
    ├── index.js      # portfolio.html 的核心邏輯 (Custom Picker Loop, 篩選)
    ├── project.js    # project.html 的內容渲染邏輯
    └── gallery.js    # gallery.html 的 Canvas 繪圖與互動邏輯
```

---

## 3. 核心流程與互動機制 (Core Flow & Interaction)

### A. 專案列表滾動 (Portfolio Scrolling - v15 Refactor)

在此版本中，我們放棄了第三方庫 (Swiper)，改用 **Native Scroll + Custom JS Visuals** 的混合模式。

*   **核心機制**:
    *   **物理層**: 使用原生 CSS `overflow-y: scroll` 搭配 `scroll-snap-type: y mandatory` 處理滾動與停頓。這保證了最流暢的原生觸控/滾輪手感。
    *   **視覺層**: 使用 JS `requestAnimationFrame` 循環 (`renderPickerLoop`)，實時計算每個項目與中心的距離，並應用 3D 變形 (`rotateX`, `scale`, `opacity`)。

*   **桌面版**:
    *   **手感**: 滾動時有明確的物理停頓感 (Snap)，視覺上呈現 3D 圓柱體效果。
    *   **篩選**: 切換 Filter 時會強制重置 Active Index，確保預覽圖更新。

*   **手機版**:
    *   **防跳躍**: CSS 加入 `scroll-snap-stop: always`，強制滾動必須停在每一個項目，防止快速滑動時跳過項目。
    *   **佈局**: 文字允許換行 (`white-space: normal`)，字級動態縮放，以適應長標題。

### B. 畫廊體驗 (Gallery Experience)
*   **機制**: **全螢幕 Canvas + 固定 UI**。
*   **互動**: 支援滑鼠拖曳 (Pan) 與滾輪縮放 (Zoom)。
*   **防護**: 透過 `body.gallery-scroll-lock` 鎖定原生滾動。

### C. 預覽視窗 (Preview Popup)
*   **觸發**: 當專案位於視窗中央 (Active) 時觸發。
*   **位置**: 隨機浮動位置，但有邊界檢查。
*   **手機版優化 (v15)**:
    *   尺寸縮小至 140px (原 200px)。
    *   Z-Index 調整至文字下方，避免遮擋資訊。

---

## 4. v15 改動紀錄 (Change Log v15)

### 為什麼移除 Swiper.js?
在 v11~v14 的嘗試中，我們發現 Swiper.js 雖然功能強大，但在模擬 "iOS Alarm Picker" (鬧鐘選擇器) 的特定手感上存在限制：
1.  **Free Mode vs Snap**: Swiper 的 `freeMode` 雖流暢但缺乏明確的 "卡頓感" (Ratchet feel)；而標準模式 (`snap`) 又過於僵硬。
2.  **3D 效果同步**: Swiper 的 `coverflow` 效果難以完全客製化為我們需要的 "圓柱體旋轉" 曲線。
3.  **結論**: 回歸 "原生 CSS Scroll Snap (負責物理) + JS (負責視覺)" 的方案，能提供最佳的客製化手感與效能。

### 解決方案與修復
1.  **Mobile Scrolling Fix**:
    *   **問題**: 手機版無法滾動或版面錯亂。
    *   **原因**: 舊版 CSS 遺留了 `overflow: hidden` 與 `scroll-snap-type: none` 的覆蓋屬性。
    *   **解法**: 移除這些覆蓋，讓手機版繼承桌面版的滾動邏輯。加入 `scroll-snap-stop: always` 防止滑動跳項。

2.  **Mobile Visuals**:
    *   **Mask**: 調整列表遮罩漸層 (`30%/70%` -> `40%/60%`)，增加淡出範圍，提升質感。
    *   **Layout**: 優化手機版文字排版，避免長標題被切斷。

3.  **Desktop Filter Bug**:
    *   **問題**: 切換篩選器後，若 Index 沒變，預覽圖不會更新。
    *   **解法**: 在 `renderProjectList` 中強制重置 `currentActiveIndex = -1`。

---

## 5. 開發注意事項 (Technical Notes)

### CSS 架構
*   **`main.css`**: 是唯一的樣式來源。
*   **`.center-column`**: 核心滾動容器。必須保持 `overflow-y: scroll` 與 `scroll-snap-type` 才能運作。

### JavaScript 邏輯
*   **`renderPickerLoop`**: 這是視覺核心。它以 60fps 運行，負責所有 3D 變形與 Active 狀態檢測。
*   **Active State**: 現在是實時 (Real-time) 計算的，而非依賴 Scroll 事件的 Debounce，這確保了快速滾動時的高光同步率。

---

## 6. 未來優化方向 (Future Roadmap)

1.  **模組化**: 考慮將 `renderPickerLoop` 封裝為獨立 Class。
2.  **效能**: 目前 `visibleItems.forEach` 在每一幀都會執行，若項目過多 (100+) 可能需優化 (如只計算視口內項目)。目前項目數 (<50) 效能無虞。