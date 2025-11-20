document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // --- DOM 元素獲取 ---
    const projectListWrapper = document.getElementById('projectListWrapper');

    // 左側資訊欄位
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewInfoElement = document.getElementById('previewInfo');

    // 標籤與區塊
    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

    // 隨機預覽元素
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    // 篩選器元素
    const categoryNavElement = document.getElementById('categoryNav');
    const mobileFooterElement = document.querySelector('.mobile-footer');

    // --- 全域變數 ---
    let portfolioSwiper = null;
    let allProjectsData = []; // (Stage 3) 儲存所有原始資料
    let currentFilter = 'all';

    // --- 輔助函式 ---
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // --- 1. 初始資料獲取 ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) throw new Error("No projects found.");

            // (Stage 3) 儲存資料
            allProjectsData = projects;

            // 初始渲染 (顯示全部)
            renderProjectSlides('all');

            // 綁定篩選事件
            bindFilterEvents();

            // 入場動畫
            setTimeout(() => {
                const mainContainer = document.querySelector('.portfolio-container');
                if (mainContainer) mainContainer.classList.add('is-loaded');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            if (projectListWrapper) {
                projectListWrapper.innerHTML = `<div class="swiper-slide">Error: ${error.message}</div>`;
            }
        });

    // --- 2. (Stage 3) 渲染與篩選核心邏輯 ---
    function renderProjectSlides(filterType) {
        // A. 銷毀舊實例 (如果存在)
        if (portfolioSwiper) {
            portfolioSwiper.destroy(true, true);
            portfolioSwiper = null;
        }

        // B. 清空 DOM
        projectListWrapper.innerHTML = '';

        // C. 過濾資料
        let filteredProjects = [];
        if (filterType === 'all') {
            filteredProjects = allProjectsData;
        } else {
            filteredProjects = allProjectsData.filter(p => p.category === filterType);
        }

        // D. 處理空狀態
        if (filteredProjects.length === 0) {
            projectListWrapper.innerHTML = `<div class="swiper-slide project-item" style="justify-content: center; opacity: 1;"><span style="font-family: var(--font-mono); color: var(--secondary-color);">No projects found.</span></div>`;
            resetPreviewInfo(); // 重置左側資訊
            return;
        }

        // E. 重建 Slide DOM
        filteredProjects.forEach((project, index) => {
            const slide = createProjectSlide(project, index);
            projectListWrapper.appendChild(slide);
        });

        // F. 重新初始化 Swiper
        // 稍微延遲確保 DOM 已插入
        requestAnimationFrame(() => {
            initSwiper();
        });
    }

    function createProjectSlide(project, index) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide project-item';

        slide.setAttribute('data-id', project.id);
        slide.setAttribute('data-index', index);
        slide.setAttribute('data-category', project.category);
        slide.setAttribute('data-title', project.title);
        slide.setAttribute('data-bio', project.bio);
        slide.setAttribute('data-cover-image', project.coverImage);
        slide.setAttribute('data-info', project.info);

        slide.innerHTML = `
            <span class="project-category">${project.category}</span>
            <a href="project.html?id=${project.id}" onclick="event.preventDefault()">${project.title}</a>
        `;

        return slide;
    }

    // --- 3. 初始化 Swiper (含 RWD 參數) ---
    function initSwiper() {
        // 再次檢查以防萬一
        if (portfolioSwiper) portfolioSwiper.destroy(true, true);

        portfolioSwiper = new Swiper('#portfolioSwiper', {
            direction: 'vertical',
            loop: true, // 無限循環
            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 20, // 基礎間距

            mousewheel: {
                sensitivity: 1,
                releaseOnEdges: true,
            },
            grabCursor: true,
            speed: 600,

            // 3D 效果設定
            effect: 'coverflow',
            coverflowEffect: {
                slideShadows: false,
            },

            // (Stage 3) 響應式斷點：針對不同裝置微調 3D 參數
            breakpoints: {
                // 手機版: 強烈的滾筒感 (iOS Picker 風格)
                0: {
                    coverflowEffect: {
                        rotate: 35,      // 較大的旋轉角度
                        stretch: 10,     // 稍微拉開一點距離
                        depth: 150,      // 深度更深
                        modifier: 1,
                    }
                },
                // 桌面版 (768px以上): 優雅的微 3D
                769: {
                    coverflowEffect: {
                        rotate: 20,      // 較小的旋轉
                        stretch: 0,
                        depth: 100,      // 標準深度
                        modifier: 1,
                    }
                }
            },

            on: {
                init: function () {
                    updateActiveContent(this.slides[this.activeIndex]);
                },
                slideChange: function () {
                    updateActiveContent(this.slides[this.activeIndex]);
                },
                click: function (swiper, event) {
                    const clickedIndex = swiper.clickedIndex;
                    if (clickedIndex === undefined) return;

                    if (clickedIndex === swiper.activeIndex) {
                        // 點擊中間項目 -> 跳轉
                        const slide = swiper.slides[clickedIndex];
                        const projectId = slide.getAttribute('data-id');
                        // 防止空狀態被點擊
                        if (projectId) {
                            window.location.href = `project.html?id=${projectId}`;
                        }
                    } else {
                        // 點擊兩側 -> 滑動
                        swiper.slideTo(clickedIndex);
                    }
                }
            }
        });
    }

    // --- 4. 篩選事件監聽 (Stage 3) ---
    function bindFilterEvents() {
        const handleFilter = (event) => {
            const targetLink = event.target.closest('a[data-filter]');
            if (!targetLink) return;

            event.preventDefault();
            const newFilter = targetLink.getAttribute('data-filter');

            // 如果點擊當前篩選器，不做事
            if (newFilter === currentFilter) return;
            currentFilter = newFilter;

            // 更新 UI 狀態 (Active Class)
            updateFilterUI(newFilter);

            // 執行篩選與重建
            renderProjectSlides(newFilter);
        };

        if (categoryNavElement) {
            categoryNavElement.addEventListener('click', handleFilter);
        }
        if (mobileFooterElement) {
            mobileFooterElement.addEventListener('click', handleFilter);
        }
    }

    function updateFilterUI(activeFilter) {
        const allLinks = document.querySelectorAll('a[data-filter]');
        allLinks.forEach(link => {
            if (link.getAttribute('data-filter') === activeFilter) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // --- 5. 更新內容與重置 ---
    function updateActiveContent(activeSlide) {
        if (!activeSlide) return;

        // 如果是 "No projects found" 的 slide，不做更新
        if (!activeSlide.hasAttribute('data-title')) return;

        const title = activeSlide.getAttribute('data-title');
        const bio = activeSlide.getAttribute('data-bio');
        const category = activeSlide.getAttribute('data-category');
        const info = activeSlide.getAttribute('data-info');
        const coverImage = activeSlide.getAttribute('data-cover-image');

        if (previewTitleElement) previewTitleElement.textContent = title;
        if (previewBioElement) previewBioElement.textContent = bio;
        if (previewInfoElement) previewInfoElement.innerHTML = info;

        if (previewLabelNo && previewLabelCategory) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = category;
        }

        if (previewLabelInfo_Default && previewLabelDocs_Project) {
            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';
        }

        if (previewBlockBio) {
            previewBlockBio.classList.add('hide-section');
        }

        updateRandomPreview(coverImage);
    }

    function resetPreviewInfo() {
        // 當沒有篩選結果時的重置狀態
        if (previewTitleElement) previewTitleElement.textContent = 'No Projects';
        if (previewBioElement) previewBioElement.textContent = '';
        if (previewInfoElement) previewInfoElement.textContent = '';
        updateRandomPreview(null);
    }

    // --- 6. 隨機預覽圖 ---
    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);

            let top, left;
            if (isMobile()) {
                top = getRandomFloat(30, 50); // vh
                left = getRandomFloat(10, 30); // % (Approximation)
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            } else {
                top = getRandomFloat(10, 60); // vh
                left = getRandomFloat(45, 70); // vw
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            }
            randomPreviewPopup.classList.add('is-visible');
        } else {
            randomPreviewPopup.classList.remove('is-visible');
        }
    }
});