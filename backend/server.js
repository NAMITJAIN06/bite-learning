const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ DATA PERSISTENCE ============
const DATA_FILE = path.join(__dirname, 'videos-data.json');

function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // Make sure structure is correct
      if (!parsed.videos) parsed.videos = [];
      if (!parsed.creators) parsed.creators = [];
      
      console.log('✅ Loaded data from file');
      return parsed;
    }
  } catch (error) {
    console.log('⚠️  Using default mock data');
  }
  
  const defaults = require('./mockdata');
  return {
    videos: defaults.videos || [],
    creators: defaults.creators || []
  };
}

function saveDataToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2));
    console.log('💾 Data saved to file');
  } catch (error) {
    console.log('❌ Error saving data:', error);
  }
}

// Load data at startup
let mockData = loadDataFromFile();

console.log('📊 Loaded videos:', mockData.videos ? mockData.videos.length : 0);
console.log('👥 Loaded creators:', mockData.creators ? mockData.creators.length : 0);

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Backend is healthy' });
});

// ============ VIDEOS ENDPOINTS ============

// Get all videos with filtering
app.get('/api/videos', (req, res) => {
  const { topic, skill_level, search } = req.query;

  if (!mockData.videos) {
    return res.json({ success: true, videos: [] });
  }

  let videos = mockData.videos;

  if (topic) {
    videos = videos.filter(v => v.topic.toLowerCase() === topic.toLowerCase());
  }

  if (skill_level) {
    videos = videos.filter(v => v.skill_level.toLowerCase() === skill_level.toLowerCase());
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    videos = videos.filter(v => 
      v.title.toLowerCase().includes(searchTerm) || 
      v.description.toLowerCase().includes(searchTerm)
    );
  }

  res.json({ success: true, videos });
});

// Get single video
app.get('/api/videos/:id', (req, res) => {
  if (!mockData.videos) {
    return res.json({ success: false, message: 'No videos found' });
  }

  const video = mockData.videos.find(v => v.id === req.params.id);
  
  if (!video) {
    return res.json({ success: false, message: 'Video not found' });
  }

  res.json({ success: true, video });
});

// Upload video
app.post('/api/videos/upload', (req, res) => {
  const { title, description, topic, skill_level, creator_id, video_url } = req.body;
  
  console.log('📹 Video Upload Request:', { title, video_url });
  
  if (!video_url || video_url.trim() === '') {
    return res.json({
      success: false,
      message: 'Video URL is required'
    });
  }
  
  const newVideo = {
    id: Date.now().toString(),
    title: title || 'Untitled Video',
    description: description || '',
    topic: topic || 'Programming',
    skill_level: skill_level || 'Beginner',
    creator_id: creator_id || 'user1',
    video_url: video_url.trim(),
    thumbnail: `https://via.placeholder.com/300x200?text=${encodeURIComponent(title || 'Video')}`,
    duration: '1:30',
    views: 0,
    likes: 0,
    timestamp: new Date(),
    comments: []
  };
  
  if (!mockData.videos) {
    mockData.videos = [];
  }
  
  mockData.videos.unshift(newVideo);
  
  console.log('✅ Video saved:', newVideo.id);
  console.log('📊 Total videos:', mockData.videos.length);
  
  saveDataToFile();
  
  res.json({
    success: true,
    message: 'Video uploaded successfully',
    video: newVideo
  });
});

// Like video
app.post('/api/videos/:id/like', (req, res) => {
  if (!mockData.videos) {
    return res.json({ success: false, message: 'No videos found' });
  }

  const video = mockData.videos.find(v => v.id === req.params.id);
  
  if (!video) {
    return res.json({ success: false, message: 'Video not found' });
  }

  video.likes++;
  
  console.log('❤️  Video liked:', req.params.id, '- Total likes:', video.likes);
  
  saveDataToFile();
  
  res.json({ success: true, likes: video.likes });
});

// Get comments
app.get('/api/videos/:id/comments', (req, res) => {
  if (!mockData.videos) {
    return res.json({ success: true, comments: [] });
  }

  const video = mockData.videos.find(v => v.id === req.params.id);
  
  if (!video) {
    return res.json({ success: true, comments: [] });
  }

  res.json({ success: true, comments: video.comments || [] });
});

// Post comment
app.post('/api/videos/:id/comment', (req, res) => {
  if (!mockData.videos) {
    return res.json({ success: false, message: 'No videos found' });
  }

  const video = mockData.videos.find(v => v.id === req.params.id);
  
  if (!video) {
    return res.json({ success: false, message: 'Video not found' });
  }

  const { username, text } = req.body;

  if (!text || text.trim() === '') {
    return res.json({ success: false, message: 'Comment cannot be empty' });
  }

  const comment = {
    id: uuidv4(),
    username: username || 'Anonymous',
    text: text.trim(),
    timestamp: new Date()
  };

  if (!video.comments) {
    video.comments = [];
  }

  video.comments.push(comment);
  
  console.log('💬 Comment added to video:', req.params.id);
  
  saveDataToFile();
  
  res.json({ success: true, comments: video.comments });
});

// ============ CREATORS ENDPOINTS ============

// Get creator profile
app.get('/api/creators/:id', (req, res) => {
  if (!mockData.creators) {
    return res.json({ success: false, message: 'No creators found' });
  }

  const creator = mockData.creators.find(c => c.id === req.params.id);
  
  if (!creator) {
    return res.json({ success: false, message: 'Creator not found' });
  }

  // Calculate creator stats
  const creatorVideos = mockData.videos.filter(v => v.creator_id === req.params.id);
  const totalViews = creatorVideos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = creatorVideos.reduce((sum, v) => sum + v.likes, 0);

  const creatorWithStats = {
    ...creator,
    videos_count: creatorVideos.length,
    total_views: totalViews,
    total_likes: totalLikes
  };

  res.json({ success: true, creator: creatorWithStats });
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log('📁 Data file:', DATA_FILE);
});

