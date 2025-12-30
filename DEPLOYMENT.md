# 🚀 EstatePro - Free Deployment Guide

This guide explains how to deploy the current version of EstatePro for free using Render, Vercel, and MongoDB Atlas.

## 📋 Prerequisites

- GitHub account
- MongoDB Atlas account
- Render.com account
- Vercel account

---

## PART 1: Backend Deployment (Render.com)

1. **Root Directory**: `backend`
2. **Build Command**: `npm install`
3. **Start Command**: `node server.js`
4. **Environment Variables**:
   ```env
   MONGODB_URI = your-mongodb-connection-string
   JWT_SECRET = your-secret-key
   PORT = 5000
   CLIENT_URL = your-vercel-url
   ```

---

## PART 2: Frontend Deployment (Vercel)

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   ```env
   VITE_API_URL = https://your-backend.onrender.com/api
   ```

---

## PART 3: First-Time Setup (Crucial)

EstatePro features a **zero-config initial setup**. You do NOT need to run a seed script to create the admin.

### 1. Automatic UI Setup

Once both backend and frontend are live, open your website URL. The software will automatically detect that the database is fresh and redirect you to the **System Setup** page.

### 2. Form Submission

Enter your chosen credentials (Name, Email, Password, CNIC, and Phone). The system will:

- Register this user as the **Primary Admin**.
- Automatically log you in.
- Disable future public registrations.

---

## 🔧 Post-Deployment Checklist

- [ ] Verify `VITE_API_URL` ends with `/api`
- [ ] Add `0.0.0.0/0` to MongoDB Atlas Network Access
- [ ] Test real-time features by logging in from two different browsers
- [ ] Verify that deleting a user forces them to log out instantly

---

## 🐛 Common Fixes

- **Refresh Error**: Handled by `vercel.json` (SPA routing).
- **Price PKR Display**: All amounts are formatted as `PKR X,XXX,XXX`.
- **Sleeping Backend**: Render's free tier sleeps after 15 mins. First load may take 30s.

---

**Your modern property management system is now live! 🚀**
