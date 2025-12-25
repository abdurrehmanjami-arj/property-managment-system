# 🚀 EstatePro - Free Deployment Guide

## 📋 Prerequisites

- GitHub account (free)
- MongoDB Atlas account (free)
- Render.com account (free)
- Vercel account (free)

---

## PART 1: Backend Deployment (Render.com)

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd "d:\full stack web development\software\property-system"
git init
git add .
git commit -m "Initial commit - EstatePro"

# Create a new repository on GitHub.com
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/estatepro.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Render.com

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. Click **"New +"** → **"Web Service"**
4. **Connect your GitHub repository**
5. **Configure:**

   - **Name**: `estatepro-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

6. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"

   ```
   MONGODB_URI = mongodb+srv://your-mongodb-connection-string
   JWT_SECRET = your-secret-key-here
   PORT = 5000
   ```

7. Click **"Create Web Service"**
8. Wait 5-10 minutes for deployment
9. **Copy your backend URL**: `https://estatepro-backend.onrender.com`

---

## PART 2: Frontend Deployment (Vercel)

### Step 1: Update Frontend API URL

1. Create `.env` file in root:

```bash
VITE_API_URL=https://estatepro-backend.onrender.com/api
```

2. Commit changes:

```bash
git add .
git commit -m "Update API URL for production"
git push
```

### Step 2: Deploy on Vercel

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. Click **"Add New"** → **"Project"**
4. **Import your GitHub repository**
5. **Configure:**

   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Add Environment Variable:**

   ```
   VITE_API_URL = https://estatepro-backend.onrender.com/api
   ```

7. Click **"Deploy"**
8. Wait 2-3 minutes
9. **Your app is live!** 🎉

---

## PART 3: MongoDB Atlas Setup (If not done)

1. **Go to**: https://cloud.mongodb.com
2. **Create free cluster** (M0 Sandbox)
3. **Create Database User**
4. **Whitelist IP**: Add `0.0.0.0/0` (allow all)
5. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/estatepro
   ```
6. **Add to Render Environment Variables**

---

## 🔧 Post-Deployment

### Seed Database (One-time)

After backend is deployed, run seed script:

1. Go to Render Dashboard → Your Service
2. Click "Shell" tab
3. Run: `node seed.js`

### Test Your App

1. **Frontend URL**: `https://your-app.vercel.app`
2. **Login with**:
   - Email: `j.rehmancoc@gmail.com`
   - Password: `Emptyness123@#`

---

## 📱 Share with Client

Send them:

- **Live URL**: `https://your-app.vercel.app`
- **Admin Credentials** (from above)
- **Demo Instructions**: "This is a live demo. You can test all features."

---

## 🆓 Free Tier Limits

### Render.com (Backend)

- ✅ 750 hours/month (enough for demo)
- ⚠️ Sleeps after 15 min inactivity (wakes up in ~30 seconds)
- ✅ Automatic HTTPS

### Vercel (Frontend)

- ✅ Unlimited bandwidth
- ✅ 100 deployments/day
- ✅ Automatic HTTPS
- ✅ Global CDN

### MongoDB Atlas

- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ Good for 100+ users

---

## 🐛 Troubleshooting

### Backend not connecting to MongoDB?

- Check MongoDB Atlas IP whitelist
- Verify connection string in Render env vars

### Frontend can't reach backend?

- Check CORS settings in `server.js`
- Verify VITE_API_URL in Vercel

### App sleeping on Render?

- First request takes ~30 seconds (cold start)
- Subsequent requests are fast
- Upgrade to paid plan ($7/month) for always-on

---

## 🎯 Next Steps (Optional)

1. **Custom Domain**: Add your own domain in Vercel
2. **Keep Backend Awake**: Use UptimeRobot.com (free) to ping every 5 min
3. **Analytics**: Add Google Analytics
4. **Monitoring**: Use Render's built-in logs

---

**Your app is now LIVE and FREE! 🚀**
