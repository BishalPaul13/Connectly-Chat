# Quick Fix for "Failed to Fetch" Error

## ⚠️ Most Common Issue: Backend Server Not Running

The "failed to fetch" error means your frontend can't connect to the backend API.

## ✅ Solution (3 Steps):

### Step 1: Open Terminal 1 - Start Backend
```bash
cd connectly-chat/server
npm install
npm run dev
```

**You should see:**
```
Connected to MongoDB
Server running on port 3001
```

### Step 2: Verify Backend is Running
Open browser and go to: `http://localhost:3001/api/health`

**You should see:** `{"status":"ok"}`

### Step 3: Start Frontend (New Terminal)
```bash
cd connectly-chat
npm install
npm run dev
```

## 🔍 Still Not Working?

### Check 1: MongoDB Connection
Make sure your `server/.env` has:
```env
MONGODB_URI=mongodb+srv://bishalpaul:Bishal123@cluster0.vnx3tew.mongodb.net/chatApp?retryWrites=true&w=majority
```

### Check 2: Backend Console Errors
Look at the terminal where backend is running. Common errors:
- `MongoDB connection error` → Check your MongoDB URI
- `Port 3001 already in use` → Change PORT in .env

### Check 3: Browser Console
Press F12 in browser, check:
- **Console tab** - for error messages
- **Network tab** - see if request to `localhost:3001` is being made

### Check 4: CORS Issues
Make sure `server/.env` has:
```env
CLIENT_URL=http://localhost:5173
```

## 🚀 Quick Test

1. **Test Backend:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Frontend:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try signing up
   - Check if you see a request to `http://localhost:3001/api/auth/signup`

## 📝 Common Errors:

**"Cannot connect to server"**
→ Backend is not running. Start it with `npm run dev` in `server/` folder.

**"MongoDB connection error"**
→ Check your MongoDB URI in `server/.env`

**"Port 3001 already in use"**
→ Change PORT in `server/.env` to 3002 and update `VITE_API_URL` in frontend `.env`

**"CORS error"**
→ Make sure `CLIENT_URL` in `server/.env` matches your frontend URL
