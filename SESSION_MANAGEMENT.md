# Real-Time Session Management - Implementation Guide

## ✨ Features Implemented

### 1. **Real-Time Force Logout**

When an admin deletes an employee or another admin, that user is **automatically logged out** from all active sessions in real-time without needing to refresh the page.

### 2. **Single Session Enforcement**

Users cannot be logged in on multiple devices simultaneously. If a user tries to login while already logged in elsewhere:

- They see a modal showing "Already Logged In"
- The modal displays the last login time and device information
- They have two options:
  - **Cancel**: Stay logged out
  - **Logout All & Login**: Force logout from all other devices and login on the current device

### 3. **Session Tracking**

The system tracks all active sessions with the following information:

- Login time
- Last activity time
- User agent (browser/device info)
- IP address
- Session token

## 🔧 Technical Implementation

### Backend Changes

#### 1. **User Model** (`backend/models/User.js`)

Added `activeSessions` array to track multiple login sessions:

```javascript
activeSessions: [
  {
    token: String,
    loginTime: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    userAgent: String,
    ipAddress: String,
  },
];
```

#### 2. **Server Setup** (`backend/server.js`)

- Integrated **Socket.IO** for real-time WebSocket communication
- Created user socket mapping to track connected clients
- Implemented `emitToUser()` global function to send events to specific users

#### 3. **Authentication Routes** (`backend/routes/auth.js`)

**Login Route Updates:**

- Checks for existing active sessions before allowing login
- Returns 409 status with "ALREADY_LOGGED_IN" code if user is already logged in
- Accepts `forceLogin` parameter to logout all other sessions
- Stores session information (token, time, device, IP)
- Emits `force-logout` event to all active sessions when force login is used

**Logout Route Updates:**

- Removes the specific session token from `activeSessions`
- Sets user offline only when no more active sessions exist

**Delete User Route Updates:**

- Emits `force-logout` event before deleting the user
- Immediately disconnects the deleted user from all active sessions

### Frontend Changes

#### 1. **Socket Context** (`src/contexts/SocketContext.jsx`)

Created a React context to manage Socket.IO connections:

- Automatically connects when user logs in
- Authenticates socket with user ID
- Disconnects when user logs out
- Handles reconnection attempts

#### 2. **Login Component** (`src/components/Login.jsx`)

Enhanced with session management:

- Catches "already logged in" error (409 status)
- Shows force login modal with session details
- Allows user to force logout from all devices
- Passes `forceLogin` parameter to backend

#### 3. **App Component** (`src/App.jsx`)

- Wrapped app with `SocketProvider`
- Updated `handleLogin` to support `forceLogin` parameter
- Added force-logout listener in Dashboard component
- Shows toast notification when force logged out
- Automatically logs out user after 2 seconds

## 🎯 User Flow Examples

### Scenario 1: User Deleted by Admin

1. Admin deletes an employee from User Management
2. Backend emits `force-logout` event to that employee
3. Employee's browser receives the event via Socket.IO
4. Toast notification appears: "Your account has been deleted by an administrator"
5. After 2 seconds, employee is automatically logged out
6. Employee is redirected to login page

### Scenario 2: Multiple Login Attempt

1. User A is logged in on Device 1
2. User A tries to login on Device 2
3. Login modal appears: "Already Logged In"
4. Shows last login time and device info
5. User A clicks "Logout All & Login"
6. Device 1 receives `force-logout` event
7. Device 1 shows toast: "New login from another device"
8. Device 1 is logged out automatically
9. Device 2 successfully logs in

### Scenario 3: Normal Logout

1. User clicks logout button
2. Backend removes current session from `activeSessions`
3. If no more sessions exist, user is marked offline
4. User is redirected to login page

## 🔒 Security Features

1. **Session Validation**: Sessions expire after 24 hours
2. **Token-Based**: Each session has a unique JWT token
3. **IP Tracking**: Records IP address for security auditing
4. **Device Tracking**: Stores user agent for device identification
5. **Real-Time Enforcement**: Instant logout when account is compromised

## 📝 Environment Variables

Make sure your `.env` file includes:

```env
JWT_SECRET=your_secret_key
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

## 🚀 Testing the Features

### Test 1: Force Logout on Delete

1. Login as admin
2. Open another browser/incognito and login as employee
3. From admin account, delete the employee
4. Watch the employee account get logged out instantly

### Test 2: Multiple Login Prevention

1. Login on Browser 1
2. Try to login with same credentials on Browser 2
3. See "Already Logged In" modal
4. Click "Logout All & Login"
5. Watch Browser 1 get logged out automatically

### Test 3: Normal Session Management

1. Login on multiple devices with force login
2. Logout from one device
3. Other devices remain logged in
4. Sessions are tracked in database

## 🛠️ Troubleshooting

### Socket.IO Not Connecting

- Check if backend server is running on port 5000
- Verify `VITE_API_URL` environment variable
- Check browser console for connection errors

### Force Logout Not Working

- Ensure Socket.IO is properly connected
- Check if user ID is being sent in authenticate event
- Verify backend is emitting events correctly

### Session Not Clearing

- Check if token is being sent in Authorization header
- Verify session removal logic in logout route
- Clear localStorage and try again

## 📦 Dependencies Added

**Backend:**

- `socket.io` - WebSocket server for real-time communication

**Frontend:**

- `socket.io-client` - WebSocket client for React

## 🎨 UI/UX Enhancements

1. **Force Login Modal**: Beautiful modal with orange warning theme
2. **Toast Notifications**: Shows reason for force logout
3. **Session Info Display**: Shows last login time in modal
4. **Smooth Transitions**: 2-second delay before auto-logout for user awareness

## 📊 Database Schema Update

The User collection now includes:

```javascript
{
  // ... existing fields
  activeSessions: [
    {
      token: "jwt_token_here",
      loginTime: ISODate("2025-12-25T17:00:00.000Z"),
      lastActivity: ISODate("2025-12-25T17:30:00.000Z"),
      userAgent: "Mozilla/5.0...",
      ipAddress: "192.168.1.1",
    },
  ];
}
```

## 🔄 Future Enhancements

1. **Session Management Page**: View and manage all active sessions
2. **Activity Tracking**: Update lastActivity on each API call
3. **Geolocation**: Show location of login attempts
4. **Email Notifications**: Alert users of new login attempts
5. **Session Limits**: Limit maximum number of concurrent sessions

---

**Implementation Date**: December 25, 2025
**Version**: 1.0.0
**Status**: ✅ Fully Functional
