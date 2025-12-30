# 🚀 EstatePro - Deployment Guide (Urdu/Hindi)

Yeh guide aapko EstatePro system ko muft (free) deploy karne mein madad karegi. Is software mein ab koi hardcoded credentials nahi hain; aap apna admin khud banayenge.

---

### **1. Database (MongoDB Atlas)**

- [MongoDB Atlas](https://www.mongodb.com/) par account banayein.
- Ek network access rule add karein: `0.0.0.0/0`.
- Connection string copy karein (Example: `mongodb+srv://user:pass@cluster0...`).

### **2. Backend (Render.com)**

- Render par **Web Service** banayein.
- **Root Directory**: `backend` set karein.
- **Environment Variables**:
  - `MONGODB_URI`: (Aapki connection string)
  - `JWT_SECRET`: (Koi bhi lamba secret word)
  - `CLIENT_URL`: (Aapka Vercel URL - ye lazmi hai)

### **3. First-Time Admin Setup (Naya Tariqa)**

Software ko deploy karne ke baad aapko kisi script ki zaroorat nahi hai:

1.  Apni website ka URL open karein.
2.  Software automatically check karega ke database khali hai.
3.  Aapko **"System Setup"** ka screen nazar aayega.
4.  Wahan apna Naam, Email, aur Password darj karein.
5.  Pehla user jo register hoga, wo automatic **System Admin** ban jayega.

---

### **4. Frontend (Vercel)**

- Vercel par project link karein.
- **Environment Variable**: `VITE_API_URL` = `https://aapka-backend.onrender.com/api`

---

### **Naye Features Jo Check Karne Hain:**

1. **Zero Hardcoded Users**: System ab pehle se zyada secure hai.
2. **Real-time Logout**: Ek hi account do jagah login nahi ho sakta.
3. **PKR Pricing**: Tamam raqam **PKR** mein show hogi.
4. **No Security Questions**: Password recovery ab mobile number aur CNIC par munhasir hai.

---

**Ab aapka project bilkul naye software scenario ke mutabiq tayyar hai! 🚀**
