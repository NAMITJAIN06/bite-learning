const API_URL = 'http://localhost:5000/api';

// ============ STATE ============
let currentView = 'feed';
let currentVideoId = null;
let allVideos = [];
let currentCreatorId = 'user1';

// ============ DOM ELEMENTS ============
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const videosFeed = document.getElementById('videos-feed');
const creatorsList = document.getElementById('creators-list');
const uploadForm = document.getElementById('upload-form');
const videoModal = document.getElementById('video-modal');
const modalClose = document.querySelector('.modal-close');
const filters = {
  topic: document.getElementById('topic-filter'),
  level: document.getElementById('level-filter'),
  search: document.getElementById('search-input')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Frontend initialized');
  setupEventListeners();
  loadVideos();
  loadCreators();
  checkBackend();
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchView(e.target.dataset.view);
    });
  });

  // Filters
  filters.topic.addEventListener('change', loadVideos);
  filters.level.addEventListener('change', loadVideos);
  filters.search.addEventListener('input', loadVideos);

  // Upload form
  uploadForm.addEventListener('submit', handleVideoUpload);

  // Modal
  modalClose.addEventListener('click', closeModal);
  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closeModal();
  });

  // Video modal actions
  document.getElementById('like-btn').addEventListener('click', likeVideo);
  document.getElementById('comment-btn').addEventListener('click', () => {
    document.getElementById('comment-text').focus();
  });
  document.getElementById('post-comment-btn').addEventListener('click', postComment);
}

// ============ VIEW MANAGEMENT ============
function switchView(viewName) {
  currentView = viewName;
  
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  views.forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}-view`).classList.add('active');
}

// ============ LOAD VIDEOS ============
async function loadVideos() {
  try {
    const topic = filters.topic.value;
    const level = filters.level.value;
    const search = filters.search.value;

    let url = `${API_URL}/videos?`;
    if (topic) url += `topic=${topic}&`;
    if (level) url += `skill_level=${level}&`;
    if (search) url += `search=${search}`;

    const response = await fetch(url);
    const data = await response.json();
    allVideos = data.videos;

    renderVideos(allVideos);
  } catch (error) {
    console.error('❌ Error loading videos:', error);
    videosFeed.innerHTML = '<p>Error loading videos. Make sure backend is running!</p>';
  }
}

function renderVideos(videos) {
  videosFeed.innerHTML = '';

  if (videos.length === 0) {
    videosFeed.innerHTML = '<p style="text-align: center; padding: 2rem;">No videos found</p>';
    return;
  }

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <img 
        src="${video.thumbnail}" 
        alt="${video.title}" 
        class="video-thumbnail"
      >
      <div class="video-card-body">
        <h3 class="video-title">${video.title}</h3>
        <div class="video-meta">
          <span>${video.creator_id === 'user1' ? '👨‍🏫 Educator' : '📚 Creator'}</span>
          <span class="video-badge">${video.skill_level}</span>
        </div>
        <div class="video-stats">
          <span>👁️ ${video.views}</span>
          <span>❤️ ${video.likes}</span>
          <span>⏱️ ${video.duration}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => openVideoModal(video));
    videosFeed.appendChild(card);
  });
}

// ============ VIDEO MODAL ============
function openVideoModal(video) {
  currentVideoId = video.id;

  console.log('🎬 Opening video:', { id: video.id, url: video.video_url });

  const videoPlayer = createVideoPlayer(video.video_url);
  
  document.getElementById('video-iframe').parentElement.innerHTML = videoPlayer;
  document.getElementById('modal-title').textContent = video.title;
  document.getElementById('modal-description').textContent = video.description;
  document.getElementById('modal-views').textContent = video.views;
  document.getElementById('modal-likes').textContent = video.likes;
  document.getElementById('modal-duration').textContent = video.duration;

  loadComments(video.id);
  videoModal.classList.remove('hidden');
}

// ============ UNIVERSAL VIDEO PLAYER ============
function createVideoPlayer(url) {
  url = url.trim();
  
  console.log('🎥 Creating video player for URL:', url.substring(0, 50) + '...');
  
  // Type 1: YouTube - watch?v= format
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')?.split('&');
    if (videoId) {
      console.log('✅ Detected YouTube watch format');
      return `<iframe id="video-iframe" width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
    }
  }
  
  // Type 2: YouTube - youtu.be short URL
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')?.split('?');
    if (videoId) {
      console.log('✅ Detected YouTube short URL');
      return `<iframe id="video-iframe" width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
    }
  }
  
  // Type 3: YouTube - already embed format
  if (url.includes('youtube.com/embed')) {
    console.log('✅ Detected YouTube embed format');
    return `<iframe id="video-iframe" width="100%" height="400" src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
  }
  
  // Type 4: Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop();
    if (videoId) {
      console.log('✅ Detected Vimeo format');
      return `<iframe id="video-iframe" width="100%" height="400" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay" allowfullscreen style="border-radius: 8px;"></iframe>`;
    }
  }
  
  // Type 5: Direct iframe URL
  if (url.includes('iframe') || url.includes('player')) {
    console.log('✅ Detected iframe format');
    return `<iframe id="video-iframe" width="100%" height="400" src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
  }
  
  // Type 6: HLS streaming (.m3u8)
  if (url.includes('.m3u8')) {
    console.log('✅ Detected HLS stream');
    return `<div style="border-radius: 8px; overflow: hidden;"><video width="100%" height="400" controls style="background: #000;"><source src="${url}" type="application/x-mpegURL">Your browser does not support HLS streaming.</video></div>`;
  }
  
  // Type 7: Direct video files (.mp4, .webm, .ogg, .mov)
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
    console.log('✅ Detected direct video file');
    return `<div style="border-radius: 8px; overflow: hidden;"><video width="100%" height="400" controls style="background: #000;"><source src="${url}" type="video/${getVideoType(url)}">Your browser does not support this video format.</video></div>`;
  }
  
  // Type 8: Dailymotion
  if (url.includes('dailymotion.com')) {
    const videoId = url.split('video/')?.split('_');
    if (videoId) {
      console.log('✅ Detected Dailymotion format');
      return `<iframe id="video-iframe" width="100%" height="400" src="https://www.dailymotion.com/embed/video/${videoId}" frameborder="0" allow="autoplay" allowfullscreen style="border-radius: 8px;"></iframe>`;
    }
  }
  
  // Type 9: Fallback - assume it's a direct URL or iframe URL
  if (url.startsWith('http')) {
    if (url.includes('/embed') || url.includes('/player') || url.includes('iframe')) {
      console.log('✅ Detected as iframe fallback');
      return `<iframe id="video-iframe" width="100%" height="400" src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
    } else {
      console.log('✅ Detected as video file fallback');
      return `<div style="border-radius: 8px; overflow: hidden;"><video width="100%" height="400" controls style="background: #000;"><source src="${url}">Your browser does not support this video URL.</video></div>`;
    }
  }
  
  // Fallback error
  console.log('❌ Video format not recognized');
  return `<div style="width: 100%; height: 400px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center;"><div><p style="font-size: 18px; color: #666;">❌ Video format not supported</p><p style="font-size: 12px; color: #999;">URL: ${url.substring(0, 50)}...</p></div></div>`;
}

function getVideoType(url) {
  const ext = url.split('.').pop().toLowerCase();
  const types = { 'mp4': 'mp4', 'webm': 'webm', 'ogg': 'ogg', 'mov': 'mp4', 'avi': 'avi', 'mkv': 'x-matroska' };
  return types[ext] || 'mp4';
}

function closeModal() {
  videoModal.classList.add('hidden');
  currentVideoId = null;
}

// ============ LIKE VIDEO ============
async function likeVideo() {
  if (!currentVideoId) return;

  try {
    const response = await fetch(`${API_URL}/videos/${currentVideoId}/like`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById('modal-likes').textContent = data.likes;
      const likeBtn = document.getElementById('like-btn');
      likeBtn.style.color = 'red';
      setTimeout(() => {
        likeBtn.style.color = '';
      }, 300);
    }
  } catch (error) {
    console.error('❌ Error liking video:', error);
  }
}

// ============ COMMENTS ============
async function loadComments(videoId) {
  try {
    const response = await fetch(`${API_URL}/videos/${videoId}/comments`);
    const data = await response.json();

    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';

    if (data.comments && data.comments.length > 0) {
      data.comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
          <div class="comment-author">${comment.username}</div>
          <div class="comment-text">${comment.text}</div>
        `;
        commentsList.appendChild(commentEl);
      });
    } else {
      commentsList.innerHTML = '<p style="text-align: center; color: #999;">No comments yet. Be the first!</p>';
    }
  } catch (error) {
    console.error('❌ Error loading comments:', error);
  }
}

async function postComment() {
  if (!currentVideoId) return;

  const text = document.getElementById('comment-text').value.trim();
  if (!text) return;

  try {
    const response = await fetch(`${API_URL}/videos/${currentVideoId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        username: 'Learner' 
      })
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById('comment-text').value = '';
      loadComments(currentVideoId);
    }
  } catch (error) {
    console.error('❌ Error posting comment:', error);
  }
}

// ============ CREATORS ============
async function loadCreators() {
  try {
    const response = await fetch(`${API_URL}/creators/user1`);
    const data = await response.json();

    if (data.success) {
      const creator = data.creator;
      const card = document.createElement('div');
      card.className = 'creator-card';
      card.innerHTML = `
        <div class="creator-avatar">👨‍🏫</div>
        <div class="creator-name">${creator.username}</div>
        <div class="creator-stats">
          <div><strong>${creator.videos_count}</strong> Videos</div>
          <div><strong>${creator.total_views}</strong> Views</div>
          <div><strong>${creator.total_likes}</strong> Likes</div>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 1rem;">
          ${creator.followers} followers
        </p>
      `;
      creatorsList.appendChild(card);
    }
  } catch (error) {
    console.error('❌ Error loading creators:', error);
  }
}

// ============ UPLOAD VIDEO ============
async function handleVideoUpload(e) {
  e.preventDefault();

  const title = document.getElementById('video-title').value;
  const description = document.getElementById('video-description').value;
  const topic = document.getElementById('video-topic').value;
  const level = document.getElementById('video-level').value;
  const videoUrl = document.getElementById('video-url').value || 'https://www.youtube.com/embed/dQw4w9WgXcQ';

  console.log('📤 Uploading video:', { title, videoUrl });

  try {
    const response = await fetch(`${API_URL}/videos/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        topic,
        skill_level: level,
        creator_id: currentCreatorId,
        video_url: videoUrl
      })
    });
    const data = await response.json();

    const msgEl = document.getElementById('upload-message');
    if (data.success) {
      msgEl.textContent = '✅ Video uploaded successfully!';
      msgEl.classList.remove('error');
      msgEl.classList.add('success');
      uploadForm.reset();
      
      console.log('✅ Upload successful!');
      
      setTimeout(() => {
        loadVideos();
        switchView('feed');
      }, 1500);
    } else {
      msgEl.textContent = '❌ ' + data.message;
      msgEl.classList.remove('success');
      msgEl.classList.add('error');
      console.error('❌ Upload failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error uploading video:', error);
    const msgEl = document.getElementById('upload-message');
    msgEl.textContent = '❌ Error uploading video. Check console.';
    msgEl.classList.remove('success');
    msgEl.classList.add('error');
  }
}

// ============ HEALTH CHECK ============
async function checkBackend() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend connected:', data);
  } catch (error) {
    console.error('❌ Backend not running. Start it with: npm start (in backend folder)');
  }
}

