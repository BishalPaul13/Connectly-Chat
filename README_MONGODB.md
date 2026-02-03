# MongoDB Migration - Quick Start

## 🎯 Where to Put MongoDB URI

**Location:** `connectly-chat/server/.env`

```env
MONGODB_URI=your-mongodb-connection-string-here
```

### Examples:

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
```

## 🚀 Quick Setup (3 Steps)

### 1. Install Backend Dependencies
```bash
cd connectly-chat/server
npm install
```

### 2. Create `.env` file in `server/` directory
```bash
cd connectly-chat/server
cp .env.example .env
# Then edit .env and add your MONGODB_URI
```

### 3. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd connectly-chat/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd connectly-chat
npm install  # Install socket.io-client
npm run dev
```

## ✅ That's It!

Your app is now running on MongoDB! 🎉

For detailed instructions, see `MONGODB_MIGRATION.md`
