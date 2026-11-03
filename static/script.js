
// 1. Color Palette Configuration
const colorPalette = [
    '#880097', // Purple
];

function hexToRgba(hex, alpha = 0.85) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

let colorIndex = parseInt(localStorage.getItem('currentColorIndex')) || 0;
const currentColorHex = colorPalette[colorIndex];
const themeBackgroundColor = hexToRgba(currentColorHex, 0.85);

document.body.style.backgroundColor = currentColorHex;
const nextColorIndex = (colorIndex + 1) % colorPalette.length;
localStorage.setItem('currentColorIndex', nextColorIndex);


// Initialize DOM-dependent items on load
document.addEventListener('DOMContentLoaded', () => {
    // Set random header message from Flask list
    const headerQuote = document.getElementById('header-quote');
    if (headerQuote && messagesList && messagesList.length > 0) {
        const randomMsg = messagesList[Math.floor(Math.random() * messagesList.length)];
        headerQuote.textContent = randomMsg;
    }

    // Apply theme color background to Top and Bottom Stripes
    const topStripe = document.querySelector('.top-stripe');
    const bottomStripe = document.querySelector('.bottom-stripe');
    if (topStripe) topStripe.style.backgroundColor = themeBackgroundColor;
    if (bottomStripe) bottomStripe.style.backgroundColor = themeBackgroundColor;
});

// Global toggle function for inline onclick="toggleDropdown(event)"
window.toggleDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdownMenu = document.getElementById('main-dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
};


// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const dropdownMenu = document.getElementById('main-dropdown-menu');
    // Check if menu exists, is open, and the click happened outside the dropdown wrapper
    if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
    }
});

// --- Background Music Control (Random Song + Auto-Play) ---
const audio = document.getElementById('bg-audio');

if (songsList && songsList.length > 0) {
    const randomSong = songsList[Math.floor(Math.random() * songsList.length)];
    audio.src = randomSong;
}

audio.addEventListener('error', (e) => {
    console.error("Audio error: Could not load the selected song file.", e);
});

audio.play().catch(err => {
    console.log("Autoplay restricted by browser. Music will start on first click anywhere.", err);

    const startAudioOnFirstInteraction = () => {
        audio.play().then(() => {
            document.removeEventListener('click', startAudioOnFirstInteraction);
            document.removeEventListener('keydown', startAudioOnFirstInteraction);
        }).catch(e => console.log("Playback attempt failed:", e));
    };

    document.addEventListener('click', startAudioOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startAudioOnFirstInteraction, { once: true });
});


// 2. Video Grid Logic
const container = document.getElementById('grid-container');

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

if (!allVideos || allVideos.length === 0) {
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.innerHTML = `
        <p style="color: #888; font-size: 16px; text-align: center;">
            No local metadata found! Run python downloader.py first.
        </p>`;
} else {
    let videoQueue = shuffleArray(allVideos);

    // Determine grid size based on screen width (3x3 = 9 for mobile, 4x4 = 16 for desktop)
    const isMobile = window.innerWidth <= 767;
    const gridItemCount = isMobile ? 9 : 16;
    const initialVideos = videoQueue.splice(0, gridItemCount);

    function getNextVideo() {
        if (videoQueue.length === 0) {
            videoQueue = shuffleArray(allVideos);
        }
        return videoQueue.shift();
    }

    let htmlContent = '';
    initialVideos.forEach(item => {
        htmlContent += `
            <div class="video-wrapper">
                <video autoplay muted playsinline webkit-playsinline preload="metadata">
                    <source src="${item.video_path}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="heart-overlay" style="background-color: ${themeBackgroundColor};">
                    <div class="heart-icon">❤️</div>
                </div>
                <div class="play-overlay">
                    <div class="play-btn-circle">▶</div>
                </div>
                <a href="${item.profile_url}" target="_blank" class="video-badge top-left-badge">${item.username}</a>
                <a href="${item.post_url}" target="_blank" class="video-badge bottom-right-badge">View Post ↗</a>
            </div>
        `;
    });

    container.innerHTML = htmlContent;

    function triggerVideoTransition(wrapper, video, heartOverlay, playOverlay, userBadge, postBadge) {
        if (heartOverlay.classList.contains('active')) return;

        heartOverlay.classList.add('active');

        setTimeout(() => {
            const nextItem = getNextVideo();
            if (!nextItem) return;

            video.src = nextItem.video_path;
            userBadge.textContent = nextItem.username;
            userBadge.href = nextItem.profile_url;
            postBadge.href = nextItem.post_url;

            video.load();
            
            heartOverlay.classList.remove('active');
            video.play().catch(() => {
                playOverlay.style.display = 'flex';
            });
        }, 1500);
    }

    container.querySelectorAll('.video-wrapper').forEach(wrapper => {
        const video = wrapper.querySelector('video');
        const heartOverlay = wrapper.querySelector('.heart-overlay');
        const playOverlay = wrapper.querySelector('.play-overlay');
        const userBadge = wrapper.querySelector('.top-left-badge');
        const postBadge = wrapper.querySelector('.bottom-right-badge');

        video.play().catch(() => {
            playOverlay.style.display = 'flex';
        });

        playOverlay.addEventListener('click', () => {
            playOverlay.style.display = 'none';
            video.play().catch(() => {
                playOverlay.style.display = 'flex';
            });
        });

        video.addEventListener('ended', () => {
            triggerVideoTransition(wrapper, video, heartOverlay, playOverlay, userBadge, postBadge);
        });

        wrapper.addEventListener('click', (e) => {
            if (e.target.closest('.video-badge') || e.target.closest('.play-overlay')) {
                return;
            }
            triggerVideoTransition(wrapper, video, heartOverlay, playOverlay, userBadge, postBadge);
        });
    });

    // Define the global button action to update all 16 cells simultaneously with the heart transition
    refreshAllVideos = () => {
        container.querySelectorAll('.video-wrapper').forEach(wrapper => {
            const video = wrapper.querySelector('video');
            const heartOverlay = wrapper.querySelector('.heart-overlay');
            const playOverlay = wrapper.querySelector('.play-overlay');
            const userBadge = wrapper.querySelector('.top-left-badge');
            const postBadge = wrapper.querySelector('.bottom-right-badge');

            triggerVideoTransition(wrapper, video, heartOverlay, playOverlay, userBadge, postBadge);
        });
    };
}