document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const categoryNavElement = document.getElementById('categoryNav');

    const mobileFooterElement = document.querySelector('.mobile-footer');

    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');

    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';



    // Scroll Logic Variables
    let allProjectItems = [];
    let currentActiveIndex = -1;
    let visibleItems = [];

    const centerColumn = document.querySelector('.portfolio-container .center-column');

    let isManualScrolling = false;

    let scrollTimer = null;

    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50;


    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function bindScrollListeners() {
        if (!centerColumn) return;

        centerColumn.removeEventListener('scroll', handleFreeScroll, { passive: true });
        centerColumn.removeEventListener('wheel', handleWheelScroll, { passive: false });
        centerColumn.removeEventListener('touchstart', handleTouchStart, { passive: false });
        centerColumn.removeEventListener('touchmove', handleTouchMove, { passive: false });
        centerColumn.removeEventListener('touchend', handleTouchEnd, { passive: false });

        if (isMobile()) {
            centerColumn.addEventListener('touchstart', handleTouchStart, { passive: false });
            centerColumn.addEventListener('touchmove', handleTouchMove, { passive: false });
            centerColumn.addEventListener('touchend', handleTouchEnd, { passive: false });
        } else {
            centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
            centerColumn.addEventListener('scroll', handleFreeScroll, { passive: true });
        }
    }


    // 1. 獲取專案資料並生成列表
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) {
                throw new Error("No projects loaded from JSON.");
            }

            projectListElement.innerHTML = ''; // 清空現有列表

            projectListElement.innerHTML = ''; // 清空現有列表

            // (MOD_v11.9) Remove Infinite Scroll (User Request: Focus on smoothness)
            // Just render original items.

            projects.forEach((project, index) => {
                const listItem = createProjectItem(project, index);
                projectListElement.appendChild(listItem);
            });

            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));
            visibleItems = [...allProjectItems];

            if (visibleItems.length > 0) {
                // Start at the first item (Index 0)
                const initialIndex = 0;

                // (FIX_v11.9) Fix Loading Jitter
                // Set active item immediately without 'auto' scroll first if possible,
                // or just use 'auto' but ensure no other jumps happen.
                // Since we removed the "jump to middle set" logic, we can just set it.

                setActiveItem(initialIndex, 'auto');

                // 觸發CSS入場動畫
                setTimeout(() => {
                    const mainContainer = document.querySelector('.portfolio-container');
                    if (mainContainer) {
                        mainContainer.classList.add('is-loaded');
                    }
                }, 50);
            }

            // 綁定初始的滾動監聽器
            bindScrollListeners();

            // 監聽點擊事件
            projectListElement.addEventListener('click', handleItemClick);

            // 監聽篩選器點擊 (桌面版)
            if (categoryNavElement) {
                categoryNavElement.addEventListener('click', handleFilterClick);
            }
            // 監聽篩選器點擊 (手機版)
            if (mobileFooterElement) {
                mobileFooterElement.addEventListener('click', handleFilterClick);
            }

            // 監聽視窗大小改變，重新綁定滾動
            window.addEventListener('resize', () => {
                // 裝置類型可能改變 (例如旋轉平板)，所以要重新綁定
                bindScrollListeners();
            });


        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            if (projectListElement) {
                projectListElement.innerHTML = `<li>Error loading projects. Check fetch path. (${error.message})</li>`;
            }
        });

    // Helper to create list item
    function createProjectItem(project, index) {
        const listItem = document.createElement('li');
        listItem.className = 'project-item';
        listItem.setAttribute('data-index', index); // Original index
        listItem.setAttribute('data-category', project.category);
        listItem.setAttribute('data-title', project.title);
        listItem.setAttribute('data-bio', project.bio);
        listItem.setAttribute('data-cover-image', project.coverImage);
        listItem.setAttribute('data-info', project.info);

        listItem.innerHTML = `
            <span class="project-category">${project.category}</span>
            <a href="project.html?id=${project.id}">${project.title}</a>
        `;
        return listItem;
    }

    function setActiveItem(index, scrollBehavior = 'auto') {

        if (visibleItems.length === 0) return;

        // Check if index is valid
        if (scrollBehavior !== false && index === currentActiveIndex) {
            return;
        }

        currentActiveIndex = index;

        // 更新列表高光
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        const targetItem = visibleItems[index];
        if (!targetItem) return;

        targetItem.classList.add('is-active');

        // 觸發滾動
        if (scrollBehavior === true || scrollBehavior === 'smooth') {
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else if (scrollBehavior === 'auto') {
            targetItem.scrollIntoView({
                behavior: 'auto',
                block: 'center'
            });
        }


        // 更新左側預覽文字
        const newTitle = targetItem.getAttribute('data-title');
        const newBio = targetItem.getAttribute('data-bio');
        const newImageSrc = targetItem.getAttribute('data-cover-image');
        const newCategory = targetItem.getAttribute('data-category');
        const newInfo = targetItem.getAttribute('data-info');

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo;

        updateRandomPreview(newImageSrc);

        // 更新左側欄位標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';

            if (previewBlockBio) previewBlockBio.classList.add('hide-section');
        }
    }

    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);
            const top = getRandomFloat(10, 60);
            const left = getRandomFloat(45, 70);

            // Mobile positioning logic
            let finalTop = top;
            let finalLeft = left;

            if (isMobile()) {
                finalTop = getRandomFloat(30, 50);
                finalLeft = getRandomFloat(10, 30);
                const popupWidth = 200;
                const windowWidth = window.innerWidth;
                finalLeft = (windowWidth * (finalLeft / 100)) - (popupWidth / 2);

                randomPreviewPopup.style.transform = `translate(${finalLeft}px, ${finalTop}vh) rotate(${rotate}deg) scale(${scale})`;
            } else {
                randomPreviewPopup.style.transform = `translate(${finalLeft}vw, ${finalTop}vh) rotate(${rotate}deg) scale(${scale})`;
            }

            randomPreviewPopup.classList.add('is-visible');
        } else {
            randomPreviewPopup.classList.remove('is-visible');
        }
    }


    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo;

        if (randomPreviewPopup) {
            randomPreviewPopup.classList.remove('is-visible');
        }

        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        // 恢復預設標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo_Default.style.display = 'inline-block';
            previewLabelDocs_Project.style.display = 'none';

            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }

        currentActiveIndex = -1;
    }

    // (MOD_v11.8) Native Scroll Handler for Infinite Loop & Active Item
    function handleScroll() {
        if (!centerColumn) return;

        const scrollTop = centerColumn.scrollTop;
        const scrollHeight = centerColumn.scrollHeight;
        const clientHeight = centerColumn.clientHeight;

        // (MOD_v11.9) Removed Infinite Loop Logic
        // We just want smooth native scrolling.

        if (visibleItems.length === 0) return;

        // 2. Update Active Item based on Center Position
        const containerCenter = scrollTop + (clientHeight / 2);

        let closestItem = null;
        let minDistance = Infinity;

        // Optimization: Only check visible items? 
        // For now, checking all visibleItems is fine (usually < 50 items total)
        visibleItems.forEach((item, index) => {
            // We need relative position within the container
            // item.offsetTop is relative to parent (projectListElement)
            // projectListElement might have top padding? No, it's 0.

            const itemTop = item.offsetTop;
            const itemHeight = item.offsetHeight;
            const itemCenter = itemTop + (itemHeight / 2);

            const distance = Math.abs(containerCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
        });

        if (closestItem) {
            const newIndex = visibleItems.indexOf(closestItem);
            if (newIndex !== -1 && newIndex !== currentActiveIndex) {
                // Update active state without scrolling (false)
                setActiveItem(newIndex, false);
            }
        }
    }

    // (MOD_v11.8) Remove JS Hijacking Listeners
    // We no longer need handleWheelScroll, handleTouchStart/Move/End, handleFreeScroll
    // But we need to bind the scroll listener

    function bindScrollListeners() {
        if (centerColumn) {
            // Remove old listeners if any (not strictly necessary as we are replacing functions)
            centerColumn.removeEventListener('scroll', handleScroll);
            centerColumn.addEventListener('scroll', handleScroll, { passive: true });
        }
    }

    function handleItemClick(event) {
        // 如果正在滾動，阻止點擊
        if (isManualScrolling) {
            event.preventDefault();
            return;
        }

        const clickedItem = event.target.closest('.project-item');
        if (!clickedItem) return;

        const newIndex = visibleItems.indexOf(clickedItem);
        if (newIndex === -1) return;

        if (newIndex === currentActiveIndex) {
            // Item already active, allow default click
        } else {
            event.preventDefault();
            setActiveItem(newIndex, true);
        }
    }

    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');

        if (!targetLink) return;
        event.preventDefault();

        const filter = targetLink.getAttribute('data-filter');

        // 更新篩選器按鈕狀態
        if (categoryNavElement) {
            categoryNavElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        if (mobileFooterElement) {
            mobileFooterElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        const activeLinks = document.querySelectorAll(`a[data-filter="${filter}"]`);
        activeLinks.forEach(a => a.classList.add('active'));


        if (filter === 'all') {
            // 情況 A：切換回 "All"
            visibleItems = [...allProjectItems];
            allProjectItems.forEach(item => item.classList.remove('hide'));
        } else {
            // 情況 B：篩選特定類別
            visibleItems = allProjectItems.filter(item => {
                const itemCategory = item.getAttribute('data-category');
                if (itemCategory === filter) {
                    item.classList.remove('hide');
                    return true;
                } else {
                    item.classList.add('hide');
                    return false;
                }
            });
        }

        if (visibleItems.length > 0) {
            // Reset to the start of the middle set (Set B)
            let targetIndex = Math.floor(visibleItems.length / 3);

            currentActiveIndex = -1;

            setTimeout(() => {
                // 篩選後使用 'auto' 立即跳轉
                setActiveItem(targetIndex, 'auto');
            }, 50);

        } else {
            resetPreview();
        }
    }
});
