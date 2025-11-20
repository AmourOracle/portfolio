document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // DOM Elements
    const projectListElement = document.getElementById('projectList'); // .swiper-wrapper
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewInfoElement = document.getElementById('previewInfo');
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    // Fetch Projects
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) throw new Error("No projects loaded.");

            projectListElement.innerHTML = '';

            projects.forEach((project, index) => {
                const slide = createProjectSlide(project, index);
                projectListElement.appendChild(slide);
            });

            // Initialize Swiper
            initSwiper();

            // Entrance Animation
            setTimeout(() => {
                const mainContainer = document.querySelector('.portfolio-container');
                if (mainContainer) mainContainer.classList.add('is-loaded');
            }, 50);
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            if (projectListElement) {
                projectListElement.innerHTML = `<div class="swiper-slide">Error loading projects</div>`;
            }
        });

    function createProjectSlide(project, index) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide project-item';

        // Data attributes for Stage 2 (State Sync)
        slide.setAttribute('data-index', index);
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
        const swiper = new Swiper('.mySwiper', {
            direction: 'vertical',
            loop: true,
            centeredSlides: true,
            slidesPerView: 'auto', // Important for "picker" feel with variable/fixed heights
            mousewheel: true,
            grabCursor: true, // Better UX for desktop

            // 3D Effect (iOS Picker Style)
            effect: 'coverflow',
            coverflowEffect: {
                rotate: 35,      // Rotation angle
                stretch: 0,      // Space between slides (0 is standard)
                depth: 100,      // Perspective depth
                modifier: 1,     // Effect multiplier
                slideShadows: false, // Disable shadows for cleaner look
            },

            // Smoothness
            speed: 600,

            // Stage 2 will add 'slideChange' event here
        });

        // Debug
        console.log('Swiper initialized:', swiper);
    }

    // Helper: Mobile Check (Reserved for Stage 3 RWD)
    function isMobile() {
        return window.innerWidth <= 768;
    }
});
