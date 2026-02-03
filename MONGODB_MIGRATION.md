# MongoDB Migration Guide

## ✅ Migration Complete!

Your chat app has been successfully migrated from Supabase (PostgreSQL) to MongoDB.

## 📋 Setup Instructions

### 1. Install MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community

# Windows
# Download from https://www.mongodb.com/try/download/community

# Linux
sudo apt-get install mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string

### 2. Set Up Backend Server

```bash
cd connectly-chat/server
npm install
```

### 3. Configure Environment Variables

Create `connectly-chat/server/.env` file:

```env
# MongoDB Connection URI
# For local: mongodb://localhost:27017/chatapp
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/chatapp
MONGODB_URI=mongodb://localhost:27017/chatapp

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3001

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### 4. Start Backend Server

```bash
cd connectly-chat/server
npm run dev
```

The server will run on `http://localhost:3001`

### 5. Update Frontend Environment

The frontend `.env` file has been updated with:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 6. Install Frontend Dependencies

```bash
cd connectly-chat
npm install
```

### 7. Start Frontend

```bash
npm run dev
```

## 🔑 MongoDB URI Location

**Put your MongoDB URI in:**
```
connectly-chat/server/.env
```

**Example for local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
```

**Example for MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
```

## 📁 Project Structure

```
connectly-chat/
├── server/                 # Backend API server
│   ├── db.js              # MongoDB connection
│   ├── auth.js            # Authentication logic
│   ├── models.js          # Data models
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── profiles.js
│   │   ├── conversations.js
│   │   ├── messages.js
│   │   └── typing.js
│   └── server.js          # Express server
├── src/
│   ├── lib/
│   │   ├── api.ts        # API client (replaces Supabase)
│   │   └── socket.ts      # Socket.io client
│   └── contexts/
│       ├── AuthContext.tsx  # Updated for MongoDB
│       └── ChatContext.tsx  # Updated for MongoDB
└── .env                   # Frontend environment variables
```

## 🚀 Features

- ✅ JWT-based authentication
- ✅ MongoDB database
- ✅ Real-time updates via Socket.io
- ✅ RESTful API
- ✅ Type-safe TypeScript

## 🔧 Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongod` or check Atlas connection
- Verify `.env` file exists in `server/` directory
- Check port 3001 is not in use

**Frontend can't connect:**
- Ensure backend server is running
- Check `VITE_API_URL` in `.env` matches backend URL
- Check CORS settings in `server/server.js`

**Authentication issues:**
- Clear browser localStorage: `localStorage.clear()`
- Check JWT_SECRET is set in backend `.env`

## 📝 Notes

- All Supabase dependencies have been removed
- Real-time updates now use Socket.io instead of Supabase Realtime
- Authentication uses JWT tokens stored in localStorage
- Database schema is automatically created on first use
