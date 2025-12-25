# 🚀 EstatePro - Final Deployment Guide (Urdu/Hindi)

Maine aapka sara code prepare kar dia hai aur GitHub par push bhi kar dia hai. Ab aapko sirf niche diye gaye steps follow karne hain:

### **1. MongoDB Atlas (Database Setup)**

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) par login karein.
- Ek **Free Cluster** banayein.
- **Database User** banayein (Username/Password yaad rakhein).
- **Network Access** mein ja kar `0.0.0.0/0` add karein.
- **Connection String** copy karein (Example: `mongodb+srv://admin:pass@cluster.mongodb.net/estatepro`).

### **2. Render (Backend Setup)**

1.  [Render.com Dashboard](https://dashboard.render.com/) par jayein.
2.  **New +** -> **Web Service** par click karein.
3.  Apni GitHub repo `property-managment-system` connect karein.
4.  Settings:
    - **Name**: `estatepro-server`
    - **Root Directory**: `backend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
5.  **Environment Variables** (Advanced mein):
    - `MONGODB_URI` = (Aapki MongoDB string)
    - `JWT_SECRET` = `super-secret-key-123`
    - `PORT` = `5000`
6.  Click **Create Web Service**.
7.  Jab deploy ho jaye, to aapko ek URL milega (e.g., `https://estatepro-server.onrender.com`). Isay copy kar lein.

### **3. Vercel (Frontend Setup)**

1.  [Vercel Dashboard](https://vercel.com/new) par jayein.
2.  Apni repo `property-managment-system` import karein.
3.  Settings:
    - **Framework Preset**: Vite
    - **Root Directory**: `./` (Default)
4.  **Environment Variables**:
    - `VITE_API_URL` = `https://estatepro-server.onrender.com/api` (Render ka URL + `/api`)
5.  Click **Deploy**.

---

### **Zaroori Note:**

- Render ka free plan site ko "sula" deta hai agar 15 min tak koi use na kare. Pehli baar khulne mein 30 seconds lag sakte hain.
- Maine `vercel.json` add kar dia hai, is se site refresh karne par error nahi aayega.
- Sare changes maine GitHub par push kar diye hain.

**Ab aap bas upper diye hue steps ek ek karke karein, aapka project live ho jayega!**
