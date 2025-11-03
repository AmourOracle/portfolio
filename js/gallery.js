document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('galleryContainer');
    const panContainer = document.getElementById('pan-container');
    
    // 檢查容器是否存在
    if (!galleryContainer || !panContainer) {
        console.error('Gallery container (#galleryContainer) or #pan-container not found.');
        return;
    }
    
    // --- (FIX v8.1) 將畫布常數移至頂層 ---
    // 讓 renderDesktopCanvas 和 initPanZoom 都能存取
    const CANVAS_WIDTH = 5000;
    const CANVAS_HEIGHT = 5000;
    // --- 結束 (FIX v8.1) ---


    // --- 1. 定義輔助函式 (Helper Functions) ---
    
    /** 產生隨機整數 */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** 產生隨機浮點數 */
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /** 檢查是否為手機版 */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // --- 2. 抓取並處理資料 ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
            // 3. (MOD v8.0) 彙整 *所有* 專案的圖片
            // 移除 'Photography' 篩選
            const allImages = projects.flatMap(project => [
                ...project.images.map(url => ({ url, title: project.title })),
                { url: project.coverImage, title: project.title } // 也加入封面圖
            ]);

            if (allImages.length === 0) {
                galleryContainer.innerHTML = '<p style="color: var(--secondary-color);">No projects found.</p>';
                return;
            }

            // 4. 根據裝置類型渲染畫布
            if (isMobile()) {
                // --- 手機版：簡單的網格 (舊邏輯) ---
                renderMobileGrid(allImages);
            } else {
                // --- 桌面版：無限畫布 (新邏輯) ---
                renderDesktopCanvas(allImages);
            }
        })
        .catch(error => {
            console.error('Error fetching gallery data:', error);
            galleryContainer.innerHTML = `<p style="color: var(--secondary-color);">Could not load gallery data. (${error.message})</p>`;
        });

    /**
     * 渲染手機版的網格佈局 (Fallback)
     */
    function renderMobileGrid(images) {
        galleryContainer.classList.add('is-mobile-grid');
        // MOD: (v8.0) 手機版不再需要 pan-container
        panContainer.style.display = 'none'; 
        
        images.forEach(imgData => {
            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.title || 'Gallery Image';
            img.loading = 'lazy';
            galleryContainer.appendChild(img);
        });
    }

    /**
     * 渲染桌面版的無限畫布 (Pan & Zoom)
     */
    function renderDesktopCanvas(images) {
        const fragment = document.createDocumentFragment();
        
        // (FIX v8.1) 變數已移至頂層
        
        panContainer.style.width = `${CANVAS_WIDTH}px`;
        panContainer.style.height = `${CANVAS_HEIGHT}px`;

        images.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            // --- 計算隨機樣式 (使用 px) ---
            const width = getRandomFloat(300, 600); // 圖片寬度 (px)
            const top = getRandomFloat(0, CANVAS_HEIGHT - (width * 1.2)); // 預留高度
            const left = getRandomFloat(0, CANVAS_WIDTH - width); // 預留寬度
            const rotate = getRandomFloat(-8, 8); // 旋轉
            const zIndex = getRandomInt(1, images.length);

            // 應用樣式
            item.style.width = `${width}px`;
            item.style.top = `${top}px`;
            item.style.left = `${left}px`;
            item.style.zIndex = zIndex;
            
            // (MOD v8.0) 使用 CSS 變數來儲存旋轉值，以便 hover 時使用
            item.style.setProperty('--rotate-deg', `${rotate}deg`);
            item.style.transform = `rotate(var(--rotate-deg))`;

            // 建立圖片
            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.title || 'Gallery Image';
            img.loading = 'lazy'; 

            item.appendChild(img);
            fragment.appendChild(item);
        });

        panContainer.appendChild(fragment);
        
        // --- 5. 啟動平移/縮放/慣性邏輯 ---
        initPanZoom();
    }
    
    /**
     * 初始化畫布的互動事件
     */
    function initPanZoom() {
        let scale = 1;
        let panX = 0;
        let panY = 0;
        
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        
        // (建議 A) 慣性變數
        let lastX = 0;
        let lastY = 0;
        let velocityX = 0;
        let velocityY = 0;
        let animationFrameId = null;
        const FRICTION = 0.95; // 摩擦力 (越接近 1 滑行越遠)

        /** 更新畫布的 transform 樣式 */
        function updateTransform() {
            // (建議 B) 限制縮放範圍
            scale = Math.max(0.2, Math.min(2, scale)); // 最小 0.2x, 最大 2x
            
            // (建議 A) 限制平移範圍 (避免畫布完全移出視窗)
            // (此處為簡易邊界，可依需求調整)
            const bounds = galleryContainer.getBoundingClientRect();
            // (FIX v8.1) 變數已移至頂層
            const maxPanX = (CANVAS_WIDTH * scale - bounds.width) / 2;
            const maxPanY = (CANVAS_HEIGHT * scale - bounds.height) / 2;
            
            // (簡易邊界邏輯)
            // panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
            // panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
            
            panContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        }

        /** (建議 B) 處理滾輪縮放 */
        function onWheel(e) {
            e.preventDefault();
            
            // 停止慣性
            cancelAnimationFrame(animationFrameId);
            
            const delta = e.deltaY * -0.01; // 縮放速度
            const oldScale = scale;
            
            scale += delta;
            
            // --- 讓縮放以滑鼠為中心 ---
            const rect = galleryContainer.getBoundingClientRect();
            // 滑鼠在視窗中的位置
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // (滑鼠位置的世界座標 - 當前平移量) / 舊縮放 = 縮放前的中心點
            // (滑鼠位置的世界座標 - 新平移量) / 新縮放 = 縮放後的中心點
            // 兩者相等，解出 newPanX, newPanY
            
            panX = mouseX - (mouseX - panX) * (scale / oldScale);
            panY = mouseY - (mouseY - panY) * (scale / oldScale);
            // --- 結束 (以滑鼠為中心) ---

            updateTransform();
        }

        /** (建議 A) 處理拖曳開始 */
        function onDragStart(e) {
            // 僅限左鍵
            if (e.button !== 0) return; 
            
            e.preventDefault();
            isDragging = true;
            
            // 停止慣性
            cancelAnimationFrame(animationFrameId);
            
            startX = e.pageX - panX;
            startY = e.pageY - panY;
            
            lastX = e.pageX;
            lastY = e.pageY;
            velocityX = 0;
            velocityY = 0;
            
            galleryContainer.style.cursor = 'grabbing';
        }

        /** (建議 A) 處理拖曳中 */
        function onDragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentX = e.pageX;
            const currentY = e.pageY;
            
            panX = currentX - startX;
            panY = currentY - startY;
            
            // 計算即時速度 (用於慣性)
            velocityX = currentX - lastX;
            velocityY = currentY - lastY;
            
            lastX = currentX;
            lastY = currentY;

            updateTransform();
        }

        /** (建議 A) 處理拖曳結束 */
        function onDragEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            galleryContainer.style.cursor = 'grab';
            
            // 啟動慣性
            startInertia();
        }
        
        /** (建議 A) 啟動慣性動畫 */
        function startInertia() {
            function inertiaLoop() {
                panX += velocityX;
                panY += velocityY;
                
                velocityX *= FRICTION;
                velocityY *= FRICTION;
                
                updateTransform();
                
                // 如果速度還很快，繼續下一幀
                if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
                    animationFrameId = requestAnimationFrame(inertiaLoop);
                }
            }
            inertiaLoop();
        }

        // 綁定所有事件
        galleryContainer.addEventListener('wheel', onWheel, { passive: false });
        galleryContainer.addEventListener('mousedown', onDragStart);
        galleryContainer.addEventListener('mousemove', onDragMove);
        galleryContainer.addEventListener('mouseup', onDragEnd);
        galleryContainer.addEventListener('mouseleave', onDragEnd); // 如果滑鼠移出視窗也停止
        
        // 初始定位 (將畫布中心大致對準視窗中心)
        const initialBounds = galleryContainer.getBoundingClientRect();
        // (FIX v8.1) 變數已移至頂層
        panX = (initialBounds.width - CANVAS_WIDTH * scale) / 2;
        panY = (initialBounds.height - CANVAS_HEIGHT * scale) / 2;
        updateTransform();
    }
});

