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
    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

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
    let isScrolling = false;

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

        // Click Event for Navigation
        li.addEventListener('click', (e) => {
            // If item is already active, navigate
            if (li.classList.contains('is-active')) {
                window.location.href = `project.html?id=${project.id}`;
            } else {
                // If not active, scroll to it
                e.preventDefault();
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        return li;
    }

    // --- 3. Scroll & Picker Logic (The Core) ---
    function bindScrollListeners() {
        if (!centerColumn) return;

        centerColumn.addEventListener('scroll', handleScroll, { passive: true });

        // Start the visual loop
        startPickerLoop();
    }

    function startPickerLoop() {
        if (pickerLoopId) cancelAnimationFrame(pickerLoopId);
        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    function renderPickerLoop() {
        if (!centerColumn) return;

        const containerRect = centerColumn.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;
        const range = containerRect.height / 2; // Distance where effect fades out significantly

        visibleItems.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const distance = itemCenter - containerCenter;

            // Normalize distance (-1 to 1)
            let ratio = distance / range;

            // Clamp ratio for safety, though we use it for visuals
            // We want the effect to continue slightly beyond the range for smoothness

            // Visual Calculations

            // 1. Rotation (Cylinder Effect)
            // RotateX: -45deg (top) to 45deg (bottom)
            // We clamp rotation to avoid flipping
            let rotateX = -ratio * 45;
            if (rotateX > 90) rotateX = 90;
            if (rotateX < -90) rotateX = -90;

            // 2. Scale (Depth Effect)
            // Scale: 1 (center) to 0.8 (edges)
            const scale = Math.max(0.8, 1 - Math.abs(ratio) * 0.3);

            // 3. Opacity (Focus Effect)
            // Opacity: 1 (center) to 0.3 (edges)
            // We use a power curve for smoother falloff
            const opacity = Math.max(0.2, 1 - Math.pow(Math.abs(ratio), 1.5));

            // Apply Styles
            item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
            item.style.opacity = opacity;

            // Z-Index: Center items should be on top
            const zIndex = Math.round(100 - Math.abs(ratio) * 100);
            item.style.zIndex = zIndex;
        });

        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    // Handle Logical Updates (Active State)
    function handleScroll() {
        if (isScrolling) {
            clearTimeout(isScrolling);
        }

        // Debounce slightly to avoid thrashing DOM during fast scrolls
        // But keep it snappy enough for visual feedback
        isScrolling = setTimeout(() => {
            updateActiveItemOnScroll();
        }, 50);
    }

    function updateActiveItemOnScroll() {
        if (!centerColumn) return;

        const containerRect = centerColumn.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;

        let closestItem = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        visibleItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + rect.height / 2;
            const distance = Math.abs(containerCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
                closestIndex = index;
            }
        });

        // Threshold for "Active": Must be reasonably close to center
        // This prevents activating items when the list is scrolled way out of bounds (if possible)
        if (closestItem && minDistance < containerRect.height / 4) {
            if (closestIndex !== currentActiveIndex) {
                setActiveItem(closestIndex);
            }
        }
    }

    function setActiveItem(index) {
        if (index < 0 || index >= visibleItems.length) return;

        currentActiveIndex = index;
        const activeItem = visibleItems[index];

        // Update Classes
        visibleItems.forEach(item => item.classList.remove('is-active'));
        activeItem.classList.add('is-active');

        // Update Left Column Info
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

    // --- 6. Random Preview ---
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