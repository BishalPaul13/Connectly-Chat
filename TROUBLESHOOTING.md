# Troubleshooting "Failed to Fetch" Error

## Common Causes and Solutions

### 1. Backend Server Not Running

**Check:**
- Open a terminal and navigate to `connectly-chat/server`
- Run `npm run dev`
- You should see: `Server running on port 3001`

**Solution:**
```bash
cd connectly-chat/server
npm install  # If you haven't already
npm run dev
```

### 2. MongoDB Connection Issue

**Check:**
- Verify your MongoDB URI in `server/.env`
- Make sure MongoDB is running (if local) or Atlas cluster is accessible

**Test Connection:**
```bash
# Test if MongoDB is accessible
mongosh "your-connection-string"
```

**Solution:**
- For local MongoDB: Start MongoDB service
- For Atlas: Check network access and connection string

### 3. CORS Issues

**Check:**
- Verify `CLIENT_URL` in `server/.env` matches your frontend URL
- Default should be `http://localhost:5173`

**Solution:**
Update `server/.env`:
```env
CLIENT_URL=http://localhost:5173
```

### 4. Port Already in Use

**Check:**
- Port 3001 might be in use by another application

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

Change port in `server/.env`:
```env
PORT=3002
```

And update frontend `.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

### 5. Environment Variables Not Loaded

**Check:**
- Make sure `server/.env` file exists
- Verify all required variables are set

**Required Variables:**
```env
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret-key
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 6. Network/Firewall Issues

**Check:**
- Firewall blocking port 3001
- Antivirus blocking connections

**Solution:**
- Allow port 3001 in firewall
- Temporarily disable antivirus to test

## Quick Diagnostic Steps

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Check Frontend Can Reach Backend:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try signing up
   - Check if request to `http://localhost:3001/api/auth/signup` appears
   - Check the error message

3. **Check Console for Errors:**
   - Open browser DevTools (F12)
   - Check Console tab for detailed error messages
   - Check Network tab for failed requests

## Still Having Issues?

1. Check backend console for error messages
2. Check browser console (F12) for detailed errors
3. Verify MongoDB connection string is correct
4. Make sure both frontend and backend are running
5. Check that ports 3001 (backend) and 5173 (frontend) are not blocked
