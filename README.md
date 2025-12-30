# EstatePro - Advanced Property Management System

## 🚀 Overview

EstatePro is a modern, full-stack property management solution built with React and Node.js. It features real-time session management, secure role-based access control, and a beautifully designed dashboard for managing properties, customers, and payments.

## 🔗 Live Demo Links

- **Frontend**: [Your Vercel URL]
- **Backend API**: [Your Render URL]

## 🔑 System Access

The software uses an **Automatic System Setup** workflow:

1.  **First Run**: When you first open the application on a new database, it will detect that no users exist.
2.  **Setup Screen**: A "System Setup" screen will appear automatically.
3.  **Admin Creation**: You can create your own primary Admin account by providing your Name, Email, Password, CNIC, and Phone.
4.  **Security**: After the first admin is created, the system locks into standard login mode.

> **Note**: No default hardcoded credentials are provided. You define your own credentials during the first launch.

## ✨ Key Features

- **Real-Time Session Management**: Powered by Socket.IO. Automatically log out users across all devices if their account is deleted or a new login session is forced.
- **System Setup Mode**: Automatic detection of new database states with a clean UI to initialize the first Admin.
- **Property Tracking**: Comprehensive management of sales and rental properties.
- **Customer CRM**: Maintain detailed records of buyers, sellers, and tenants.
- **Payment Ledger**: Track PKR payments with automated formatting and history.
- **Role-Based Access**: Secure sections for Admins and Employees.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop screens.
- **Fast Recovery**: Reset passwords using CNIC and Phone verification (for Admins).

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Real-Time**: Socket.IO
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📦 Installation & Setup

1. **Clone the repository**
2. **Setup Backend**:
   - `cd backend`
   - `npm install`
   - Configure `.env` with `MONGODB_URI` and `JWT_SECRET`
   - `npm start`
3. **Setup Frontend**:
   - `npm install`
   - Configure `.env` with `VITE_API_URL`
   - `npm run dev`

---

Developed with ❤️ for Real Estate Professionals.
