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
    let allProjectsData = [];
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

    // --- 2. 渲染與篩選核心邏輯 ---
    function renderProjectSlides(filterType) {
        if (portfolioSwiper) {
            portfolioSwiper.destroy(true, true);
            portfolioSwiper = null;
        }

        projectListWrapper.innerHTML = '';

        let filteredProjects = [];
        if (filterType === 'all') {
            filteredProjects = allProjectsData;
        } else {
            filteredProjects = allProjectsData.filter(p => p.category === filterType);
        }

        if (filteredProjects.length === 0) {
            projectListWrapper.innerHTML = `<div class="swiper-slide project-item" style="justify-content: center; opacity: 1;"><span style="font-family: var(--font-mono); color: var(--secondary-color);">No projects found.</span></div>`;
            resetPreviewInfo();
            return;
        }

        filteredProjects.forEach((project, index) => {
            const slide = createProjectSlide(project, index);
            projectListWrapper.appendChild(slide);
        });

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

    // --- 3. 初始化 Swiper (FIX: iOS Picker Physics) ---
    function initSwiper() {
        if (portfolioSwiper) portfolioSwiper.destroy(true, true);

        portfolioSwiper = new Swiper('#portfolioSwiper', {
            direction: 'vertical',

            // Loop 設定：確保緩衝區足夠大，解決往回滾動鎖死問題
            loop: true,
            loopedSlides: 8, // 關鍵修正：增加緩衝 Slide 數量

            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 20,

            // Free Mode 設定：模擬 iOS 慣性滾動
            freeMode: {
                enabled: true,
                sticky: true,      // 關鍵：停止時自動吸附到最近的 Slide
                momentumRatio: 0.25, // 關鍵：降低慣性比率 (越小越重)，模擬滾筒的重量感
                velocityRatio: 0.25, // 降低初速靈敏度
            },

            mousewheel: {
                sensitivity: 1,
                releaseOnEdges: true,
                thresholdDelta: 5, // 防止桌面版過於靈敏
            },

            grabCursor: true,
            speed: 800, // 稍微放慢吸附動畫的速度

            effect: 'coverflow',
            coverflowEffect: {
                slideShadows: false,
            },

            breakpoints: {
                // 手機版: 強烈的滾筒感
                0: {
                    coverflowEffect: {
                        rotate: 40,      // 加大旋轉角度
                        stretch: 0,
                        depth: 200,      // 加深深度
                        modifier: 1,
                    }
                },
                // 桌面版
                769: {
                    coverflowEffect: {
                        rotate: 20,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                    }
                }
            },

            on: {
                init: function () {
                    updateActiveContent(this.slides[this.activeIndex]);
                },
                // 改用 setTranslate 或 transitionEnd 來更新，比 slideChange 更平滑
                slideChange: function () {
                    updateActiveContent(this.slides[this.activeIndex]);
                },
                click: function (swiper, event) {
                    const clickedIndex = swiper.clickedIndex;
                    if (clickedIndex === undefined) return;

                    // 如果是 Loop 模式，clickedIndex 可能會與 activeIndex 計算不同
                    // 使用 slideToClickedSlide 是一個更安全的方法
                    if (clickedIndex === swiper.activeIndex) {
                        const slide = swiper.slides[clickedIndex];
                        const projectId = slide.getAttribute('data-id');
                        if (projectId) {
                            window.location.href = `project.html?id=${projectId}`;
                        }
                    } else {
                        swiper.slideToClickedSlide();
                    }
                }
            }
        });
    }

    // --- 4. 篩選事件監聽 ---
    function bindFilterEvents() {
        const handleFilter = (event) => {
            const targetLink = event.target.closest('a[data-filter]');
            if (!targetLink) return;

            event.preventDefault();
            const newFilter = targetLink.getAttribute('data-filter');

            if (newFilter === currentFilter) return;
            currentFilter = newFilter;

            updateFilterUI(newFilter);
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
                top = getRandomFloat(30, 50);
                left = getRandomFloat(10, 30);
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            } else {
                top = getRandomFloat(10, 60);
                left = getRandomFloat(45, 70);
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            }
            randomPreviewPopup.classList.add('is-visible');
        } else {
            randomPreviewPopup.classList.remove('is-visible');
        }
    }
});