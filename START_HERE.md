# 🚀 START HERE - Fix "Failed to Fetch" Error

## The Problem
"Failed to fetch" means your frontend can't connect to the backend server.

## ✅ The Solution (Do These Steps):

### 1. Start Backend Server (Terminal 1)

```bash
cd connectly-chat/server
npm install
npm run dev
```

**✅ Success looks like:**
```
Connected to MongoDB
Server running on port 3001
```

**❌ If you see errors:**
- `MongoDB connection error` → Check your MongoDB URI in `server/.env`
- `Port 3001 already in use` → Change PORT in `server/.env` to 3002

### 2. Start Frontend (Terminal 2)

```bash
cd connectly-chat
npm install
npm run dev
```

**✅ Success looks like:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 3. Test It

1. Open browser: `http://localhost:5173`
2. Try to sign up
3. Should work now! ✅

## 🔧 If Still Not Working:

### Check 1: Backend Health
Open: `http://localhost:3001/api/health`
Should show: `{"status":"ok"}`

### Check 2: MongoDB Connection
Your `server/.env` should have:
```env
MONGODB_URI=mongodb+srv://bishalpaul:Bishal123@cluster0.vnx3tew.mongodb.net/chatApp?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
```

### Check 3: Browser Console
Press F12 → Console tab → Look for error messages

## 📋 Checklist:

- [ ] Backend server running (`npm run dev` in `server/` folder)
- [ ] Frontend running (`npm run dev` in root folder)
- [ ] MongoDB URI is correct in `server/.env`
- [ ] `CLIENT_URL=http://localhost:5173` in `server/.env`
- [ ] No errors in backend console
- [ ] No errors in browser console (F12)

## 🆘 Still Stuck?

1. Check `TROUBLESHOOTING.md` for detailed help
2. Check backend console for error messages
3. Check browser console (F12) for detailed errors
4. Make sure both terminals are running (backend + frontend)
