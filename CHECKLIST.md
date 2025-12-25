# ✅ Quick Deployment Checklist

## Before Deployment

- [ ] All features tested locally
- [ ] Real-time session management tested (Socket.IO)
- [ ] MongoDB Atlas connection string ready
- [ ] GitHub account created
- [ ] Code committed to Git

## Backend Deployment (Render.com)

- [ ] Create Render.com account
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Add environment variables:
  - [ ] MONGODB_URI
  - [ ] JWT_SECRET
  - [ ] PORT=5000
  - [ ] CLIENT_URL (your Vercel frontend URL)
- [ ] Deploy and wait for build
- [ ] Copy backend URL
- [ ] Test: `https://your-backend.onrender.com/api/auth/users`

## Frontend Deployment (Vercel)

- [ ] Update `.env` with backend URL
- [ ] Commit and push changes
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Add environment variable: VITE_API_URL
- [ ] Deploy
- [ ] Test login on live URL

## Post-Deployment

- [ ] Seed database (run `node seed.js` in Render shell)
- [ ] Test all features on live site
- [ ] Share URL with client
- [ ] Monitor for errors in Render logs

## URLs to Share

- **Live App**: https://your-app.vercel.app
- **Admin Login**:
  - Email: j.rehmancoc@gmail.com
  - Password: Emptyness123@#

---

**Estimated Time**: 30-45 minutes
**Cost**: $0 (100% Free)
