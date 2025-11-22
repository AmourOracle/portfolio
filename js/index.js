document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // --- DOM Elements ---
    const projectList = document.getElementById('projectList');
    const centerColumn = document.querySelector('.center-column');

    // Left Column Info
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewInfoElement = document.getElementById('previewInfo');

    // Labels & Blocks
    const previewLabelCategory = document.getElementById('previewLabelCategory');

    // Random Preview
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    // Filter Elements
    const categoryNavElement = document.getElementById('categoryNav');
    const mobileFooterElement = document.querySelector('.mobile-footer');

    // --- Global Variables ---
    let allProjectsData = [];
    let visibleItems = [];
    let currentFilter = 'all';
    let currentActiveIndex = -1;
    let pickerLoopId = null;

    // --- Helper Functions ---
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // --- 1. Initial Data Fetch ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) throw new Error("No projects found.");

            allProjectsData = projects;

            // Initial Render
            renderProjectList('all');

            // Bind Events
            bindFilterEvents();
            bindScrollListeners();

            // Entrance Animation
            setTimeout(() => {
                const mainContainer = document.querySelector('.portfolio-container');
                if (mainContainer) mainContainer.classList.add('is-loaded');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            if (projectList) {
                projectList.innerHTML = `<li class="project-item">Error: ${error.message}</li>`;
            }
        });

    // --- 2. Render & Filter Logic ---
    function renderProjectList(filterType) {
        projectList.innerHTML = '';
        visibleItems = [];
        currentActiveIndex = -1; // Reset active index

        let filteredProjects = [];
        if (filterType === 'all') {
            filteredProjects = allProjectsData;
        } else {
            filteredProjects = allProjectsData.filter(p => p.category === filterType);
        }

        if (filteredProjects.length === 0) {
            projectList.innerHTML = `<li class="project-item" style="justify-content: center; opacity: 1;"><span style="font-family: var(--font-mono); color: var(--secondary-color);">No projects found.</span></li>`;
            resetPreviewInfo();
            return;
        }

        filteredProjects.forEach((project, index) => {
            const item = createProjectItem(project, index);
            projectList.appendChild(item);
            visibleItems.push(item);
        });

        // Reset scroll position to top
        if (centerColumn) {
            centerColumn.scrollTop = 0;
        }

        // Initial Active Update
        setTimeout(() => {
            updateActiveItemOnScroll();
        }, 100);
    }

    function createProjectItem(project, index) {
        const li = document.createElement('li');
        li.className = 'project-item';

        // 綁定完整資料至 LI
        li.setAttribute('data-id', project.id);
        li.setAttribute('data-index', index);
        li.setAttribute('data-category', project.category);
        li.setAttribute('data-title', project.title);
        li.setAttribute('data-bio', project.bio);
        li.setAttribute('data-cover-image', project.coverImage);
        li.setAttribute('data-info', project.info);

        li.innerHTML = `
            <span class="project-category">${project.category}</span>
            <a href="project.html?id=${project.id}" onclick="event.preventDefault()">${project.title}</a>
        `;

        li.addEventListener('click', (e) => {
            if (li.classList.contains('is-active')) {
                window.location.href = `project.html?id=${project.id}`;
            } else {
                e.preventDefault();
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        return li;
    }

    // --- 3. Scroll & Picker Logic ---
    function bindScrollListeners() {
        if (!centerColumn) return;
        centerColumn.addEventListener('scroll', handleScroll, { passive: true });
        startPickerLoop();
    }

    function startPickerLoop() {
        if (pickerLoopId) cancelAnimationFrame(pickerLoopId);
        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    function renderPickerLoop() {
        if (!centerColumn) return;

        const containerRect = centerColumn.getBoundingClientRect();
        let containerCenter;
        if (isMobile()) {
            containerCenter = window.innerHeight / 2;
        } else {
            containerCenter = containerRect.top + containerRect.height / 2;
        }

        const range = containerRect.height / 2;
        let closestItem = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        visibleItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const distance = itemCenter - containerCenter;
            const absDistance = Math.abs(distance);

            if (absDistance < minDistance) {
                minDistance = absDistance;
                closestItem = item;
                closestIndex = index;
            }

            let ratio = distance / range;

            if (isMobile()) {
                const mobileScale = Math.max(1.0, 1.2 - Math.abs(ratio) * 0.5);
                const opacity = Math.max(0.3, 1 - Math.pow(Math.abs(ratio), 1.5));
                item.style.transform = `scale(${mobileScale})`;
                item.style.opacity = opacity;
                item.style.zIndex = Math.round(100 - Math.abs(ratio) * 100);
            } else {
                let rotateX = -ratio * 45;
                if (rotateX > 90) rotateX = 90;
                if (rotateX < -90) rotateX = -90;
                const scale = Math.max(0.8, 1 - Math.abs(ratio) * 0.3);
                const opacity = Math.max(0.2, 1 - Math.pow(Math.abs(ratio), 1.5));
                item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
                item.style.opacity = opacity;
                item.style.zIndex = Math.round(100 - Math.abs(ratio) * 100);
            }
        });

        if (closestIndex !== -1 && closestIndex !== currentActiveIndex) {
            setActiveItem(closestIndex);
        }

        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    function handleScroll() { }
    function updateActiveItemOnScroll() { }

    function setActiveItem(index) {
        if (index < 0 || index >= visibleItems.length) return;

        currentActiveIndex = index;
        const activeItem = visibleItems[index];

        visibleItems.forEach(item => {
            item.classList.remove('is-active');

            const link = item.querySelector('a');
            if (link && link.classList.contains('marquee-active')) {
                link.classList.remove('marquee-active');

                const originalTitle = item.getAttribute('data-title');
                if (originalTitle) {
                    link.textContent = originalTitle;
                }
            }
        });

        activeItem.classList.add('is-active');

        const link = activeItem.querySelector('a');
        const originalTitle = activeItem.getAttribute('data-title');

        if (link && originalTitle && link.scrollWidth > link.clientWidth) {
            // (MOD_v17.2) 結構優化：加入 .marquee-track 作為移動層
            // 外層 link 負責 layout 和 overflow:hidden
            // 內層 marquee-track 負責 animation
            link.innerHTML = `<div class="marquee-track"><span class="track-content">${originalTitle}</span><span class="track-content">${originalTitle}</span></div>`;
            link.classList.add('marquee-active');
        }

        updateActiveContent(activeItem);
    }

    // --- 4. Filter Events ---
    function bindFilterEvents() {
        const handleFilter = (event) => {
            const targetLink = event.target.closest('a[data-filter]');
            if (!targetLink) return;
            event.preventDefault();
            const newFilter = targetLink.getAttribute('data-filter');
            if (newFilter === currentFilter) return;
            currentFilter = newFilter;
            updateFilterUI(newFilter);
            renderProjectList(newFilter);
        };
        if (categoryNavElement) categoryNavElement.addEventListener('click', handleFilter);
        if (mobileFooterElement) mobileFooterElement.addEventListener('click', handleFilter);
    }

    function updateFilterUI(activeFilter) {
        const allLinks = document.querySelectorAll('a[data-filter]');
        allLinks.forEach(link => {
            if (link.getAttribute('data-filter') === activeFilter) link.classList.add('active');
            else link.classList.remove('active');
        });
    }

    // --- 5. Content Updates ---
    function updateActiveContent(activeItem) {
        if (!activeItem) return;

        const title = activeItem.getAttribute('data-title');
        const bio = activeItem.getAttribute('data-bio');
        const category = activeItem.getAttribute('data-category');
        const info = activeItem.getAttribute('data-info');
        const coverImage = activeItem.getAttribute('data-cover-image');

        if (previewTitleElement) previewTitleElement.textContent = title;
        if (previewBioElement) previewBioElement.textContent = bio;
        if (previewInfoElement) previewInfoElement.innerHTML = info;

        if (previewLabelCategory) {
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = category;
        }

        const docsBlock = document.getElementById('previewBlockDocs');
        if (docsBlock) docsBlock.classList.remove('hide-section');

        updateRandomPreview(coverImage);
    }

    function resetPreviewInfo() {
        if (previewTitleElement) previewTitleElement.textContent = 'No Projects';
        if (previewBioElement) previewBioElement.textContent = '';
        if (previewInfoElement) previewInfoElement.textContent = '';
        updateRandomPreview(null);
    }

    // --- 6. Random Preview ---
    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);
            let top, left;
            if (isMobile()) {
                const isTopZone = Math.random() > 0.5;
                if (isTopZone) top = getRandomFloat(12, 25);
                else top = getRandomFloat(60, 72);
                left = getRandomFloat(10, 40);
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