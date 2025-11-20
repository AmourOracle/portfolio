document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // DOM Elements
    const projectListElement = document.getElementById('projectList'); // .swiper-wrapper
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewInfoElement = document.getElementById('previewInfo');
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');
    const categoryNavElement = document.getElementById('categoryNav');
    const mobileFooterElement = document.querySelector('.mobile-footer');

    // State
    let allProjects = [];
    let swiperInstance = null;

    // Fetch Projects
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) throw new Error("No projects loaded.");

            allProjects = projects; // Store globally
            renderProjects(allProjects);

            // Entrance Animation
            setTimeout(() => {
                const mainContainer = document.querySelector('.portfolio-container');
                if (mainContainer) mainContainer.classList.add('is-loaded');
            }, 50);

            // Bind Filter Events
            if (categoryNavElement) categoryNavElement.addEventListener('click', handleFilterClick);
            if (mobileFooterElement) mobileFooterElement.addEventListener('click', handleFilterClick);
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            if (projectListElement) {
                projectListElement.innerHTML = `<div class="swiper-slide">Error loading projects</div>`;
            }
        });

    function renderProjects(projects) {
        // 1. Destroy existing Swiper if any
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
            swiperInstance = null;
        }

        // 2. Clear DOM
        projectListElement.innerHTML = '';

        // 3. Rebuild DOM
        if (projects.length === 0) {
            projectListElement.innerHTML = '<div class="swiper-slide">No projects found.</div>';
            return;
        }

        projects.forEach((project, index) => {
            const slide = createProjectSlide(project, index);
            projectListElement.appendChild(slide);
        });

        // 4. Re-init Swiper
        initSwiper();
    }

    function createProjectSlide(project, index) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide project-item';

        // Data attributes
        slide.setAttribute('data-index', index); // Note: This index is relative to the filtered list now
        slide.setAttribute('data-category', project.category);
        slide.setAttribute('data-title', project.title);
        slide.setAttribute('data-bio', project.bio);
        slide.setAttribute('data-cover-image', project.coverImage);
        slide.setAttribute('data-info', project.info);

        slide.innerHTML = `
            <span class="project-category">${project.category}</span>
            <a href="project.html?id=${project.id}">${project.title}</a>
        `;
        return slide;
    }

    function initSwiper() {
        // RWD Parameters
        const isMobileDevice = isMobile();

        // Tune effects based on device
        const rotateAngle = isMobileDevice ? 35 : 30; // Slightly less rotation on desktop?
        const depthVal = isMobileDevice ? 100 : 50;   // Flatter on desktop?

        swiperInstance = new Swiper('.mySwiper', {
            direction: 'vertical',
            loop: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            mousewheel: true,
            grabCursor: true,

            effect: 'coverflow',
            coverflowEffect: {
                rotate: rotateAngle,
                stretch: 0,
                depth: depthVal,
                modifier: 1,
                slideShadows: false,
            },

            speed: 600,

            on: {
                slideChange: function () {
                    updateActiveItem(this.realIndex);
                },
                init: function () {
                    updateActiveItem(this.realIndex);
                }
            }
        });

        // Attach click listener (Delegation)
        // Note: We need to re-attach or ensure delegation works. 
        // Since projectListElement is constant, delegation is fine.
        // But we need to make sure we don't add multiple listeners if we call initSwiper multiple times?
        // Actually, the listener is on projectListElement which is NOT destroyed, only its children are.
        // So we should attach the listener ONCE outside.

        console.log('Swiper initialized:', swiperInstance);
    }

    // Click Listener (Attached once)
    projectListElement.addEventListener('click', (e) => {
        if (!swiperInstance) return;

        const clickedSlide = e.target.closest('.swiper-slide');
        if (!clickedSlide) return;

        e.preventDefault();

        const slideIndex = clickedSlide.getAttribute('data-swiper-slide-index') || clickedSlide.getAttribute('data-index');

        if (slideIndex !== null) {
            swiperInstance.slideToLoop(parseInt(slideIndex), 600);
        }
    });

    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');
        if (!targetLink) return;

        event.preventDefault();
        const filter = targetLink.getAttribute('data-filter');

        // Update UI Active State
        document.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        document.querySelectorAll(`a[data-filter="${filter}"]`).forEach(a => a.classList.add('active'));

        // Filter Data
        let filteredProjects = [];
        if (filter === 'all') {
            filteredProjects = allProjects;
        } else {
            filteredProjects = allProjects.filter(p => p.category === filter);
        }

        // Render
        renderProjects(filteredProjects);
    }

    function updateActiveItem(realIndex) {
        // Find the slide in the DOM that corresponds to the realIndex
        // Note: With filtering, the "index" data attribute might not match 0,1,2... if we preserved original indices.
        // BUT, createProjectSlide uses the index passed to it.
        // In renderProjects, we pass the index of the *filtered* array.
        // So realIndex (0 to N-1 of filtered items) should match data-index (0 to N-1).

        const activeSlide = document.querySelector(`.swiper-slide[data-index="${realIndex}"]`);

        if (!activeSlide) return;

        const newTitle = activeSlide.getAttribute('data-title');
        const newBio = activeSlide.getAttribute('data-bio');
        const newImageSrc = activeSlide.getAttribute('data-cover-image');
        const newCategory = activeSlide.getAttribute('data-category');
        const newInfo = activeSlide.getAttribute('data-info');

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo;

        // Update Labels
        const previewLabelNo = document.getElementById('previewLabelNo');
        const previewLabelCategory = document.getElementById('previewLabelCategory');
        const previewBlockBio = document.getElementById('previewBlockBio');
        const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
        const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';

            if (previewBlockBio) previewBlockBio.classList.add('hide-section');
        }

        updateRandomPreview(newImageSrc);
    }

    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);
            const top = getRandomFloat(10, 60);
            const left = getRandomFloat(45, 70);

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

    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }
});
