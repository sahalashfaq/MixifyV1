const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const closeMenu = document.querySelector(".close-menu");

hamburger.addEventListener("click", () => {
    mobileMenu.classList.add("active");
});

closeMenu.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
});
 
let player;
let currentVideoId = null;
const API_KEY = 'AIzaSyDn-yYcO6lGz_vEmELFoeapJURSkso8a0g';
let currentPlaylistId = null;
let currentVideoIndex = -1; // Track current video position in the playlist
let currentPlaylistVideos = []; // Store current playlist videos

// ========== YOUTUBE PLAYER INIT ========== //
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '100%',
        playerVars: {
            'controls': 1,
            'modestbranding': 1,
            'rel': 0,
            'enablejsapi': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}



function onPlayerReady(event) {
    console.log('Player is ready');
    loadVideos();
    setupNavigationButtons();
}


function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && currentVideoId) {
        markAsComplete(currentVideoId);
        addToRecentlyPlayed(currentVideoId, true);
    }
}

function handleVideoInput() {
    const videoLink = document.getElementById('new-play-save-video-link').value.trim();
    const videoId = extractVideoID(videoLink);
    const playlistId = extractPlaylistID(videoLink);

    if (playlistId) {
        showPlaylistPopup(videoId, playlistId);
    } else if (videoId) {
        handleSingleVideo(videoId);
    } else {
        // alert('Please enter a valid YouTube URL');
    }
}
function handleSingleVideo(videoId) {
    const videos = getSavedVideos();
    const existingVideo = videos.find(video => video.id === videoId);

    if (existingVideo) {
        playVideo(videoId);
    } else {
        fetchVideoDetails(videoId, (videoData) => {
            saveVideo(videoData);
            playVideo(videoId);
        });
    }
}
// Improved playVideo function
function playVideo(videoId) {
    if (!player || typeof player.loadVideoById !== 'function') {
        setTimeout(() => playVideo(videoId), 500);
        return;
    }

    try {
        player.loadVideoById(videoId);
        currentVideoId = videoId;
        scrollToPlayer();
    } catch (error) {
        console.error('Error playing video:', error);
        // alert('Error playing video. Please try again.');
    }
}

// Save a video to localStorage
function saveVideo(videoData, category) {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const existingIndex = videos.findIndex(v => v.id === videoData.id);

    if (existingIndex >= 0) {
        videos[existingIndex] = {
            ...videos[existingIndex],
            ...videoData,
            category: category || videos[existingIndex].category
        };
    } else {
        videos.push({
            ...videoData,
            category: category || 'General'
        });
    }

    localStorage.setItem('videos', JSON.stringify(videos));
    loadVideos(); // Refresh display
}



function playAndSaveVideo(videoId) {
    if (!videoId) {
        // alert('Please enter a valid YouTube URL');
        return;
    }

    // First save the video
    fetchVideoDetails(videoId, (videoData) => {
        saveVideo(videoData);
        // Then play it
        playVideo(videoId);
    });
}
// Initialize on page load
// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Play and save button
    document.getElementById('new-play-save-video-btn').addEventListener('click', function () {
        const videoLink = document.getElementById('new-play-save-video-link').value.trim();
        const videoId = extractVideoID(videoLink);

        if (videoId) {
            playAndSaveVideo(videoId);
        } else {
            // alert('Please enter a valid YouTube URL');
        }
    });

    // Enter key in input field
    document.getElementById('new-play-save-video-link').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const videoLink = this.value.trim();
            const videoId = extractVideoID(videoLink);

            if (videoId) {
                playAndSaveVideo(videoId);
            } else {
                // alert('Please enter a valid YouTube URL');
            }
        }
    });
});

// Helper functions
function extractVideoID(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function extractPlaylistID(url) {
    if (!url) return null;
    const regExp = /[&?]list=([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}



function scrollToPlayer() {
    const playerDiv = document.getElementById('player');
    playerDiv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Remove the duplicate onYouTubeIframeAPIReady function


// Loader functions
function showLoader() {
    document.getElementById('progress-container').style.display = 'block';
    updateProgress(0);
}

function hideLoader() {
    document.getElementById('progress-container').style.display = 'none';
}

function updateProgress(percent) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar && progressText) {
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
    }
}
// Event listener for existing input and button to save multiple URLs
document.getElementById('save-video-btn').addEventListener('click', () => {
    const videoLinks = document.getElementById('video-link').value.split(',').map(link => link.trim());
    videoLinks.forEach(videoLink => {
        const videoId = extractVideoID(videoLink);
        const playlistId = extractPlaylistID(videoLink);

        if (playlistId) {
            showPlaylistPopup(videoId, playlistId); // Show popup for playlist
        } else if (videoId) {
            fetchVideoDetails(videoId, saveVideo); // Save single video
        } else {
            // alert(`Invalid YouTube link: ${videoLink}`);
        }
    });
});

// New input and button functionality for playing and saving a video
document.getElementById('new-play-save-video-btn').addEventListener('click', () => {
    const videoLink = document.getElementById('new-play-save-video-link').value.trim();
    const videoId = extractVideoID(videoLink);
    const playlistId = extractPlaylistID(videoLink);

    if (playlistId) {
        // Show popup for playlist options
        showPlaylistPopup(videoId, playlistId);
    } else if (videoId) {
        // Directly download and play the video
        fetchVideoDetails(videoId, saveVideo);
        playVideo(videoId);
    } else {
        // alert('Invalid YouTube link!');
    }
});

// Extract YouTube video ID
function extractVideoID(url) {
    const match = url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

// Extract YouTube playlist ID
function extractPlaylistID(url) {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Setup event listeners
    document.getElementById('new-play-save-video-btn').addEventListener('click', handleVideoInput);

    document.getElementById('new-play-save-video-link').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleVideoInput();
        }
    });

    // Load any existing videos
    loadVideos();
});
// Show popup for playlist options
function showPlaylistPopup(videoId, playlistId) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>🎵 Playlist Detected</h3>
                <span class="material-symbols-outlined close-popup" onclick="closePopup()">close</span>
            </div>
            <div class="popup-body">
                <p>Do you want to save the <strong>whole playlist</strong> or just this video?</p>
                <div class="popup-buttons">
                    <button class="btn save-playlist-btn" onclick="saveEntirePlaylist('${playlistId}')">
                        Save Entire Playlist
                    </button>
                    <button class="btn save-video-btn" onclick="saveSingleVideo('${videoId}')">
                        Save Single Video
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';
}

// Close popup
function closePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
    document.body.style.overflow = 'auto';
}

// Fetch video details using YouTube API
function fetchVideoDetails(videoId, callback) {
    const apiKey = 'AIzaSyDn-yYcO6lGz_vEmELFoeapJURSkso8a0g'; // Replace with your API key
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                const videoData = {
                    id: videoId,
                    title: snippet.title || `Video ${videoId}`,
                    thumbnail: snippet.thumbnails?.medium?.url || '',
                    status: 'not-started'
                };
                callback(videoData);
            } else {
                // alert('Video not found!');
            }
        })
    // .catch(() => alert('Error fetching video details.'));
}

// Save a single video
async function saveEntirePlaylist(playlistId) {
    showLoader();
    let savedCount = 0;
    let errorCount = 0;
    let nextPageToken = '';
    const maxVideos = 200; // Safety limit
    let playlistTitle = "YouTube Playlist";

    try {
        // 1. Get playlist title first
        const playlistInfo = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
        ).then(res => res.json());

        if (playlistInfo.items?.[0]?.snippet?.title) {
            playlistTitle = playlistInfo.items[0].snippet.title;
        }

        // 2. Fetch all videos with pagination
        do {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // 3. Process each video
            for (const item of data.items) {
                try {
                    if (item.snippet?.resourceId?.kind === 'youtube#video') {
                        const videoData = {
                            id: item.snippet.resourceId.videoId,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails?.medium?.url || '',
                            playlistId: playlistId,
                            playlistTitle: playlistTitle,
                            status: 'not-started'
                        };

                        saveVideo(videoData);
                        savedCount++;

                        // Update progress
                        updateProgress(Math.floor((savedCount / Math.min(data.pageInfo?.totalResults || maxVideos, maxVideos)) * 100));
                    }
                } catch (e) {
                    errorCount++;
                    console.error(`Failed to save video: ${item.snippet?.title || 'Unknown'}`, e);
                }

                // Rate limiting protection
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            nextPageToken = data.nextPageToken || '';

        } while (nextPageToken && savedCount < maxVideos);

        // 4. Show results
        hideLoader();
        let message = `✅ Saved ${savedCount} videos from "${playlistTitle}"`;
        if (errorCount > 0) {
            message += `\n(${errorCount} videos failed to save)`;
        }
        // alert(message);
        loadVideos();

    } catch (error) {
        hideLoader();
        // console.error("Playlist download failed:", error);
        // alert(`❌ Failed to download playlist. Error: ${error.message}\n\nPossible reasons:\n• YouTube API quota exceeded\n• Playlist contains private videos\n• Network issues`);
    }
}

// Save a video to localStorage
function saveVideo(videoData) {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const existingIndex = videos.findIndex(v => v.id === videoData.id);

    if (existingIndex >= 0) {
        videos[existingIndex] = { ...videos[existingIndex], ...videoData }; // Update
    } else {
        videos.push(videoData); // Add new
    }

    localStorage.setItem('videos', JSON.stringify(videos));
}

// Delete Video
function deleteVideo(videoId) {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    videos = videos.filter(video => video.id !== videoId);
    localStorage.setItem('videos', JSON.stringify(videos));
    loadVideos();
}

// Mark a video as complete (show green dot)
function markAsComplete(videoId) {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    const video = videos.find(v => v.id === videoId);
    if (video) {
        video.status = 'completed';
        localStorage.setItem('videos', JSON.stringify(videos));
        loadVideos();
    }
}

// Utility function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

// Toggle visibility of "Delete All Videos" button
function toggleDeleteAllButton() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const deleteAllBtn = document.getElementById('delete-all-btn');
    deleteAllBtn.style.display = videos.length > 0 ? 'block' : 'none';
}

// Add event listener for "Delete All Videos" button
document.getElementById('delete-all-btn').addEventListener('click', () => {
    // Confirm with the user
    if (confirm('Are you sure you want to delete all saved videos?')) {
        localStorage.removeItem('videos');
        loadVideos();
        // alert('All videos deleted successfully!');
    }
});

// Modify the loadVideos function to handle the case when there are no saved videos
// Initialize Swiper instances
const swiperInstances = [];

function loadVideos() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const container = document.getElementById('video-grid');
    container.innerHTML = ''; // Clear the container

    if (videos.length === 0) {
        container.innerHTML = '<div class="no-videos"><p>No saved videos. Add some videos first!</p></div>';
        toggleDeleteAllButton();
        return;
    }

    // Group videos by playlist
    const playlists = {};
    const standaloneVideos = [];

    videos.forEach(video => {
        if (video.playlistId) {
            if (!playlists[video.playlistId]) {
                playlists[video.playlistId] = {
                    title: video.playlistTitle || 'Untitled Playlist',
                    videos: []
                };
            }
            playlists[video.playlistId].videos.push(video);
        } else {
            standaloneVideos.push(video);
        }
    });

    // Create playlist sliders
    Object.keys(playlists).forEach(playlistId => {
        const playlist = playlists[playlistId];

        const playlistSection = document.createElement('div');
        playlistSection.className = 'playlist-section';
        playlistSection.innerHTML = `
        <div class="playlist-header">
            <h3>
                <span class="material-symbols-outlined">folder_open</span>
                <p contenteditable="true" 
                   class="editable-playlist-title"
                   data-playlist-id="${playlistId}">${playlist.title}</p>
            </h3>
            <div class="main">
            <div class="playlist-controls">
                <button onclick="openPlaylistEdit('${playlistId}')">
                    <span class="material-symbols-outlined">edit</span>
                </button>
            </div>
            <div class="slider-nav-container">
                <div class="slider-nav">
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
            </div>
            </div>
        </div>
        <div class="swiper playlist-slider" id="slider-${playlistId}">
            <div class="swiper-wrapper" id="container-${playlistId}"></div>
        </div>
    `;
        container.appendChild(playlistSection);

        const sliderContainer = document.getElementById(`container-${playlistId}`);

        playlist.videos.forEach(video => {
            sliderContainer.appendChild(createVideoCard(video));
        });
        const titleElement = playlistSection.querySelector('.editable-playlist-title');
        titleElement.addEventListener('blur', function () {
            const newTitle = this.textContent;
            savePlaylistTitle(playlistId, newTitle);
        });
        // Initialize Swiper for this playlist
        // Initialize Swiper for this playlist
        const swiper = new Swiper(`#slider-${playlistId}`, {
            // Your existing configuration
            spaceBetween: 15,
            slidesPerView: 'auto',
            resistanceRatio: 0.7,
            navigation: {
                nextEl: playlistSection.querySelector('.swiper-button-next'),
                prevEl: playlistSection.querySelector('.swiper-button-prev'),
            },
            breakpoints: {
                0: { slidesPerView: 16 },
                640: { slidesPerView: 16 },
                1024: { slidesPerView: 16 }
            },
            // Add these event handlers
            on: {
                init: function () {
                    updateNavButtons(this);
                },
                slideChange: function () {
                    updateNavButtons(this);
                },
                reachEnd: function () {
                    updateNavButtons(this);
                },
                fromEdge: function () {
                    updateNavButtons(this);
                }
            }
        });

        swiperInstances.push(swiper);
    });
    // Button state management function
    function updateNavButtons(swiperInstance) {
        const nextButton = swiperInstance.navigation.nextEl;
        const prevButton = swiperInstance.navigation.prevEl;

        // Disable next button if at end
        if (swiperInstance.isEnd) {
            nextButton.classList.add('swiper-button-disabled');
            nextButton.setAttribute('disabled', 'disabled');
        } else {
            nextButton.classList.remove('swiper-button-disabled');
            nextButton.removeAttribute('disabled');
        }

        // Disable prev button if at beginning (optional)
        if (swiperInstance.isBeginning) {
            prevButton.classList.add('swiper-button-disabled');
            prevButton.setAttribute('disabled', 'disabled');
        } else {
            prevButton.classList.remove('swiper-button-disabled');
            prevButton.removeAttribute('disabled');
        }
    }
    // Create standalone videos grid
    if (standaloneVideos.length > 0) {
        const standaloneSection = document.createElement('div');
        standaloneSection.className = 'standalone-videos';

        standaloneSection.innerHTML = `
            <h3>Your Videos</h3>
            <div class="video-grid-container">
                ${standaloneVideos.map(video => createVideoCard(video).join(''))}
            </div>
        `;

        container.appendChild(standaloneSection);
    }

    toggleDeleteAllButton();
}
// Proper save function
function savePlaylistTitle(playlistId, newTitle) {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];

    // Update all videos in this playlist
    videos = videos.map(video => {
        if (video.playlistId === playlistId) {
            return { ...video, playlistTitle: newTitle };
        }
        return video;
    });

    localStorage.setItem('videos', JSON.stringify(videos));
}
// Add to global variables
let currentEditingPlaylistId = null;

// Update the createVideoCard function to include playlist indicator
function createVideoCard(video) {
    const dotClass = video.status === 'completed' ? 'green-dot' : (video.status === 'not-started' ? 'gray-dot' : '');
    const isPlaylist = video.playlistId ? true : false;

    const slideDiv = document.createElement('div');
    slideDiv.className = 'swiper-slide stored-video';
    slideDiv.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" />
        <div class="dot ${dotClass}"></div>
        <h3>${video.title}</h3>
        <div class="control-area">
            <button class="play-button" onclick="playVideo('${video.id}')">
                PLAY
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                    <path d="m480-320 160-160-160-160-56 56 64 64H320v80h168l-64 64 56 56Zm40 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
            </button>
            <button class="settings-btn" onclick="toggleSettings(this)">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                </svg>
            </button>
            <div class="settings-dropdown hidden">
                ${isPlaylist ? `<button class="set-btn"  onclick="openPlaylistEdit('${video.playlistId}')">Edit Playlist</button>` : ''}
                <button class="set-btn" onclick="deleteVideo('${video.id}')">Delete Video</button>
                <button class="set-btn" onclick="copyToClipboard('https://www.youtube.com/watch?v=${video.id}')">Copy Video URL</button>
                <button class="set-btn" onclick="copyToClipboard('${video.id}')">Copy Video ID</button>
                <button class="set-btn" onclick="markAsComplete('${video.id}')">Mark as Complete</button>
            </div>
        </div>
    `;

    return slideDiv;
}
// Enhance your player controls with ARIA attributes
function enhancePlayerAccessibility() {
    const player = document.getElementById('player');
    if (player) {
        player.setAttribute('aria-label', 'YouTube video player');
        player.setAttribute('aria-role', 'application');

        const controls = document.querySelectorAll('.player-controls button');
        controls.forEach(control => {
            control.setAttribute('aria-label', `${control.textContent.trim()} video`);
        });
    }
}
// Lazy load non-critical elements
document.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                // Load your video content here
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.video-thumbnail').forEach(el => {
        observer.observe(el);
    });
});
function initSocialSharing(videoData) {
  const shareButtons = document.createElement('div');
  shareButtons.className = 'social-share';
  shareButtons.innerHTML = `
    <button class="share-twitter" aria-label="Share on Twitter">
      <span class="icon-twitter"></span>
    </button>
    <button class="share-facebook" aria-label="Share on Facebook">
      <span class="icon-facebook"></span>
    </button>
  `;
  
  document.querySelector('.player-container').appendChild(shareButtons);
  
  // Add event listeners for sharing
  document.querySelector('.share-twitter').addEventListener('click', () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watch "${videoData.title}" on Mixify`)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  });
}
// Update the modal toggle functions
function openPlaylistEdit(playlistId) {
    currentEditingPlaylistId = playlistId;
    const modal = document.getElementById('playlist-edit-modal');
    modal.classList.add('active');

    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const playlistVideos = videos.filter(v => v.playlistId === playlistId);
    const playlistTitle = playlistVideos[0]?.playlistTitle || 'Untitled Playlist';

    document.getElementById('playlist-edit-title').textContent = 'Edit ' + `${playlistTitle}`;

    const videoList = document.getElementById('playlist-video-list');
    videoList.innerHTML = '';

    if (playlistVideos.length === 0) {
        videoList.innerHTML = '<p>No videos in this playlist</p>';
        return;
    }

    playlistVideos.forEach(video => {
        const item = document.createElement('div');
        item.className = 'playlist-video-item';
        item.innerHTML = `
            <span>${video.title}</span>
            <button onclick="removeFromPlaylist('${video.id}', event)">
                <span class="material-symbols-outlined">remove</span>
                Remove
            </button>
        `;
        videoList.appendChild(item);
    });
}

function closePlaylistEdit() {
    const modal = document.getElementById('playlist-edit-modal');
    modal.classList.remove('active');
    currentEditingPlaylistId = null;
}

// Update remove function to prevent event bubbling
function removeFromPlaylist(videoId, event) {
    if (event) event.stopPropagation();

    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    videos = videos.filter(v => v.id !== videoId);
    localStorage.setItem('videos', JSON.stringify(videos));

    // Refresh the edit view
    openPlaylistEdit(currentEditingPlaylistId);
}

// Add save playlist changes function
function savePlaylistChanges() {
    // In this case, changes are saved immediately when made
    // so we just close the modal
    closePlaylistEdit();
    loadVideos(); // Refresh the main view
}

// Add confirmation for playlist deletion
function confirmDeletePlaylist() {
    if (confirm('Are you absolutely sure you want to delete this entire playlist? All videos in the playlist will be removed.')) {
        let videos = JSON.parse(localStorage.getItem('videos')) || [];
        videos = videos.filter(v => v.playlistId !== currentEditingPlaylistId);
        localStorage.setItem('videos', JSON.stringify(videos));
        closePlaylistEdit();
        loadVideos();
    }
}

// Add to DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    // Modal event listeners
    document.querySelector('.close-edit-modal').addEventListener('click', closePlaylistEdit);
    document.getElementById('cancel-playlist-edit').addEventListener('click', closePlaylistEdit);
    document.getElementById('save-playlist-changes').addEventListener('click', savePlaylistChanges);
    document.getElementById('delete-playlist-btn').addEventListener('click', confirmDeletePlaylist);

    // Close modal when clicking outside content
    document.getElementById('playlist-edit-modal').addEventListener('click', function (e) {
        if (e.target === this) {
            closePlaylistEdit();
        }
    });
});

function createVideoItem(video) {
    const statusClass = video.status === 'completed' ? 'completed' : 'not-started';

    return `
        <div class="video-item">
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
            <div class="video-info">
                <div class="video-status">
                    <h3>${video.title}</h3>
                    <div class="status-dot ${statusClass}"></div>
                </div>
                <div class="video-actions">
                    <button class="play-btn" onclick="playVideo('${video.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#ffffff">
                            <path d="M320-200v-560l440 280-440 280Z"/>
                        </svg>
                        Play
                    </button>
                    <div class="settings-container">
                        <button class="settings-btn" onclick="toggleSettings(this.parentElement)">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#ffffff">
                                <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/>
                            </svg>
                        </button>
                        <div class="settings-dropdown">
                            <button onclick="deleteVideo('${video.id}')">Delete</button>
                            <button onclick="copyToClipboard('https://www.youtube.com/watch?v=${video.id}')">Copy URL</button>
                            <button onclick="markAsComplete('${video.id}')">Mark as Complete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleSettings(container) {
    container.classList.toggle('show');
}

// Close settings dropdown when clicking elsewhere
document.addEventListener('click', function (e) {
    if (!e.target.closest('.settings-container')) {
        document.querySelectorAll('.settings-container').forEach(el => {
            el.classList.remove('show');
        });
    }
});

// Scroll to video player when playing
function scrollToPlayer() {
    const playerDiv = document.getElementById('player');
    if (playerDiv) {
        playerDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Play video in YouTube player
function playVideo(videoId) {
    if (player && player.loadVideoById) {
        player.loadVideoById(videoId);
        currentVideoId = videoId; // Track the currently playing video ID
        scrollToPlayer(); // Scroll to the player when a video is played
    }
}

// Show/hide video settings dropdown
function toggleSettings(button) {
    const dropdown = button.nextElementSibling;
    dropdown.classList.toggle('hidden');
}
// Handle player state changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && currentVideoId) {
        markAsComplete(currentVideoId);
        addToRecentlyPlayed(currentVideoId, true);
    }
    else if (event.data === YT.PlayerState.PLAYING && currentVideoId) {
        addToRecentlyPlayed(currentVideoId, false);
    }
}
// Track when a video is completed
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && currentVideoId) {
        markAsComplete(currentVideoId);
        addToRecentlyPlayed(currentVideoId, true);
    }
    // Optional: You can also track when a video is started
    else if (event.data === YT.PlayerState.PLAYING && currentVideoId) {
        addToRecentlyPlayed(currentVideoId, false);
    }
}

// Add or update a video in recently played
function addToRecentlyPlayed(videoId, isCompleted) {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    let recentVideos = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

    // Remove if already exists
    recentVideos = recentVideos.filter(v => v.id !== videoId);

    // Add to beginning of array
    recentVideos.unshift({
        id: videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        timestamp: new Date().getTime(),
        completed: isCompleted
    });

    // Keep only the last 10 videos
    if (recentVideos.length > 10) {
        recentVideos = recentVideos.slice(0, 10);
    }

    localStorage.setItem('recentlyPlayed', JSON.stringify(recentVideos));
    loadRecentlyPlayed();
}

// Load recently played videos
function loadRecentlyPlayed() {
    const recentVideos = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    const container = document.getElementById('recently-played-grid');
    container.innerHTML = '';

    if (recentVideos.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--p-color)">No recently played videos yet</p>';
        return;
    }

    recentVideos.forEach(video => {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'recently-played-video';
        videoDiv.innerHTML = `
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" />
                ${video.completed ? '<span class="watched-badge">Watched</span>' : ''}
                <h3>${video.title}</h3>
                <button class="play-button" onclick="playVideo('${video.id}')">
                    
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#e8eaed">
                        <path d="m480-320 160-160-160-160-56 56 64 64H320v80h168l-64 64 56 56Zm0 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                    </svg>
                </button>
            `;
        container.appendChild(videoDiv);
    });
}

// Clear recently played history
function clearRecentlyPlayed() {
    if (confirm('Are you sure you want to clear your recently played history?')) {
        localStorage.removeItem('recentlyPlayed');
        loadRecentlyPlayed();
    }
}

// Update your existing playVideo function
function playVideo(videoId) {
    if (player && player.loadVideoById) {
        player.loadVideoById(videoId);
        currentVideoId = videoId;
        scrollToPlayer();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    loadVideos();
    loadRecentlyPlayed();
});
// Load saved videos on page load
document.addEventListener('DOMContentLoaded', loadVideos);
// Add these functions to handle navigation
function getCurrentVideoIndex() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    return videos.findIndex(v => v.id === currentVideoId);
}
function markCurrentVideoComplete() {
    if (!currentVideoId) return;

    markAsComplete(currentVideoId);
    // Update UI immediately
    document.getElementById('mark-complete-btn').disabled = true;
    // Optional: Change button appearance
    document.getElementById('mark-complete-btn').innerHTML = `
        <span class="material-symbols-outlined">done</span>
        <span class="btn-text">Completed</span>
    `;
}

function deleteCurrentVideo() {
    if (!currentVideoId) return;

    if (confirm('Are you sure you want to delete this video?')) {
        deleteVideo(currentVideoId);
        // After deletion, play next video if available
        const videos = JSON.parse(localStorage.getItem('videos')) || [];
        const currentIndex = getCurrentVideoIndex();

        if (videos.length > 0 && currentIndex < videos.length) {
            // Play next video or previous if at end
            const nextVideo = videos[currentIndex] || videos[currentIndex - 1];
            if (nextVideo) {
                playVideo(nextVideo.id);
            }
        } else {
            // No more videos
            currentVideoId = null;
            player.stopVideo();
        }

        updateNavigationButtons();
    }
}
function playNextVideo() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const currentIndex = getCurrentVideoIndex();

    if (currentIndex < videos.length - 1) {
        const nextVideo = videos[currentIndex + 1];
        playVideo(nextVideo.id);
    } else {
        // Optionally loop to first video
        // playVideo(videos[0].id);
    }
}

function playPreviousVideo() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const currentIndex = getCurrentVideoIndex();

    if (currentIndex > 0) {
        const prevVideo = videos[currentIndex - 1];
        playVideo(prevVideo.id);
    } else {
        // Optionally loop to last video
        // playVideo(videos[videos.length - 1].id);
    }
}

// Update navigation buttons state
// Update the updateNavigationButtons function
function updateNavigationButtons() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const currentIndex = getCurrentVideoIndex();
    const currentVideo = videos.find(v => v.id === currentVideoId);

    // Navigation buttons
    document.getElementById('prev-video-btn').disabled = currentIndex <= 0;
    document.getElementById('next-video-btn').disabled = currentIndex >= videos.length - 1 || videos.length === 0;

    // Action buttons
    document.getElementById('mark-complete-btn').disabled = !currentVideoId || currentVideo?.status === 'completed';
    document.getElementById('delete-video-btn').disabled = !currentVideoId;

    // Update mark complete button text
    if (currentVideo?.status === 'completed') {
        document.getElementById('mark-complete-btn').innerHTML = `
            <span class="material-symbols-outlined">done</span>
        `;
    } else {
        document.getElementById('mark-complete-btn').innerHTML = `
            <span class="material-symbols-outlined">check_circle</span>
        `;
    }
}

// Add event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    // Existing listeners...
    document.getElementById('prev-video-btn').addEventListener('click', playPreviousVideo);
    document.getElementById('next-video-btn').addEventListener('click', playNextVideo);

    // New listeners
    document.getElementById('mark-complete-btn').addEventListener('click', markCurrentVideoComplete);
    document.getElementById('delete-video-btn').addEventListener('click', deleteCurrentVideo);

    // Update the playVideo wrapper to handle button states
    const originalPlayVideo = window.playVideo;
    window.playVideo = function (videoId) {
        originalPlayVideo(videoId);
        updateNavigationButtons();
    };

    // Initial update
    updateNavigationButtons();
});

// Also update when videos are loaded
const originalLoadVideos = window.loadVideos;
window.loadVideos = function () {
    originalLoadVideos();
    updateNavigationButtons();
};
// Add these functions for playlist navigation
function playNextInPlaylist() {
    if (!currentPlaylistId) return;

    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const playlistVideos = videos.filter(v => v.playlistId === currentPlaylistId);
    const currentIndex = playlistVideos.findIndex(v => v.id === currentVideoId);

    if (currentIndex < playlistVideos.length - 1) {
        playVideo(playlistVideos[currentIndex + 1].id);
    }
}

function playPreviousInPlaylist() {
    if (!currentPlaylistId) return;

    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const playlistVideos = videos.filter(v => v.playlistId === currentPlaylistId);
    const currentIndex = playlistVideos.findIndex(v => v.id === currentVideoId);

    if (currentIndex > 0) {
        playVideo(playlistVideos[currentIndex - 1].id);
    }
}

// Update the playVideo function to track playlist context
const originalPlayVideo = window.playVideo;
window.playVideo = function (videoId) {
    originalPlayVideo(videoId);

    // Track if this video is part of a playlist
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const video = videos.find(v => v.id === videoId);
    currentPlaylistId = video?.playlistId || null;

    updateNavigationButtons();
};
