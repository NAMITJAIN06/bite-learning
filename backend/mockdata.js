// Mock data instead of database
let users = [
  {
    id: "user1",
    username: "educator1",
    email: "edu@example.com",
    type: "creator",
    followers: 120
  }
];

let videos = [
  {
    id: "vid1",
    title: "JavaScript Basics in 60 sec",
    description: "Learn JS variables and functions",
    creator_id: "user1",
    duration: 60,
    topic: "Programming",
    skill_level: "Beginner",
    views: 234,
    thumbnail: "https://via.placeholder.com/300x200?text=JS+Basics",
    video_url: "https://www.youtube.com/embed/PkZNo7MFNFg",
    created_at: new Date(Date.now() - 86400000),
    likes: 45,
    comments: []
  },
  {
    id: "vid2",
    title: "Python List Comprehension",
    description: "Master Python lists in 90 seconds",
    creator_id: "user1",
    duration: 90,
    topic: "Programming",
    skill_level: "Intermediate",
    views: 567,
    thumbnail: "https://via.placeholder.com/300x200?text=Python",
    video_url: "https://www.youtube.com/embed/DZ4sSfXtpQU",
    created_at: new Date(Date.now() - 172800000),
    likes: 123,
    comments: []
  },
  {
    id: "vid3",
    title: "React Hooks Explained",
    description: "Understanding React Hooks in under 2 minutes",
    creator_id: "user1",
    duration: 120,
    topic: "Programming",
    skill_level: "Advanced",
    views: 890,
    thumbnail: "https://via.placeholder.com/300x200?text=React",
    video_url: "https://www.youtube.com/embed/TNhaISOUy6Q",
    created_at: new Date(Date.now() - 259200000),
    likes: 256,
    comments: []
  }
];

let courses = [
  {
    id: "course1",
    title: "Web Development 101",
    creator_id: "user1",
    videos: ["vid1", "vid2"],
    description: "Complete web dev basics",
    created_at: new Date()
  }
];

// ✅ ADD THIS CREATORS ARRAY ✅
let creators = [
  {
    id: "user1",
    username: "educator1",
    bio: "Teaching technology one video at a time",
    followers: 120,
    avatar: "👨‍🏫",
    email: "edu@example.com",
    type: "creator"
  }
];

// ✅ EXPORT THIS WAY ✅
module.exports = { 
  users, 
  videos, 
  courses,
  creators  // ← ADD THIS
};

