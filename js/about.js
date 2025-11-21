document.addEventListener('DOMContentLoaded', () => {
    // 選取主要容器
    const mainContainer = document.querySelector('.middle-container');

    // 確保容器存在
    if (mainContainer) {
        // 設定一個極短的延遲 (50ms)，確保瀏覽器已經準備好渲染 CSS Transition
        // 這會觸發 main.css 中定義的錯落式進場動畫
        setTimeout(() => {
            mainContainer.classList.add('is-loaded');
        }, 50);
    }
});