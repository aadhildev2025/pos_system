---
description: Deploy POS System to Vercel (Frontend + Backend as Separate Projects)
---

# Deploy POS System - Separate Frontend & Backend

This guide shows you how to deploy your frontend and backend as **two separate Vercel projects**.

## 📋 Overview

You'll create **two Vercel projects**:
1. **Backend API** → Handles all `/api/*` requests
2. **Frontend App** → React application that consumes the backend API

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend First

The backend must be deployed first so you can get its URL for the frontend configuration.

#### 1.1 Navigate to Backend Directory

```bash
cd backend
```

#### 1.2 Deploy Backend to Vercel

**Option A: Via Vercel CLI**

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy backend
vercel

# When prompted:
# - Set up and deploy? Yes
# - Project name: pos-backend (or your choice)
# - Directory: ./ (current directory)
```

**Option B: Via Vercel Dashboard**

1. Create a new Git repository for backend only
2. Push backend code to GitHub
3. Go to [vercel.com/new](https://vercel.com/new)
4. Import the backend repository
5. Vercel will detect `vercel.json` automatically

#### 1.3 Add Backend Environment Variables

In Vercel Dashboard or via CLI, add these environment variables:

```bash
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=production
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your_password
FRONTEND_URL=https://your-frontend.vercel.app  # Add this later after frontend deployment
```

**Via CLI:**
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
# Add each variable when prompted
```

#### 1.4 Deploy to Production

```bash
vercel --prod
```

#### 1.5 Note Your Backend URL

After deployment, you'll get a URL like:
```
https://pos-backend-xyz123.vercel.app
```

**Save this URL!** You'll need it for the frontend.

---

### Step 2: Deploy Frontend

Now deploy the frontend and connect it to your backend.

#### 2.1 Navigate to Frontend Directory

```bash
cd ../frontend
```

#### 2.2 Add Frontend Environment Variable

**Option A: Create `.env` file locally (for testing)**

```bash
# In frontend/.env
VITE_API_URL=https://pos-backend-xyz123.vercel.app/api
```

**Option B: Add via Vercel Dashboard (recommended)**

After creating the project, add environment variable:
- Variable: `VITE_API_URL`
- Value: `https://pos-backend-xyz123.vercel.app/api`
- Environment: Production, Preview, Development

#### 2.3 Deploy Frontend

**Option A: Via Vercel CLI**

```bash
# Deploy frontend
vercel

# When prompted:
# - Set up and deploy? Yes
# - Project name: pos-frontend (or your choice)
# - Directory: ./ (current directory)

# Add environment variable
vercel env add VITE_API_URL
# Enter: https://pos-backend-xyz123.vercel.app/api

# Deploy to production
vercel --prod
```

**Option B: Via Vercel Dashboard**

1. Create a new Git repository for frontend only
2. Push frontend code to GitHub
3. Go to [vercel.com/new](https://vercel.com/new)
4. Import the frontend repository
5. Add `VITE_API_URL` environment variable
6. Deploy

#### 2.4 Note Your Frontend URL

After deployment, you'll get a URL like:
```
https://pos-frontend-abc456.vercel.app
```

---

### Step 3: Update Backend CORS

Now that you have the frontend URL, update the backend to allow requests from it.

1. Go to your **backend** Vercel project
2. Add/update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://pos-frontend-abc456.vercel.app
   ```
3. Redeploy the backend (or it will auto-redeploy when env var is added)

---

## ✅ Verification

### Test Backend

Visit your backend URL with `/api/health`:
```
https://pos-backend-xyz123.vercel.app/api/health
```

Should return:
```json
{
  "status": "Server is running"
}
```

### Test Frontend

1. Visit your frontend URL: `https://pos-frontend-abc456.vercel.app`
2. Try to login
3. Check browser console for errors
4. Verify data loads from backend

---

## 🔐 Environment Variables Summary

### Backend Environment Variables
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your_password
TWILIO_ACCOUNT_SID=... (optional)
TWILIO_AUTH_TOKEN=... (optional)
TWILIO_WHATSAPP_NUMBER=... (optional)
```

### Frontend Environment Variables
```
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 🛠️ Deploying from Monorepo (Current Setup)

If you want to deploy both from the same repository:

### Deploy Backend

```bash
cd c:\Users\Aadhil\Desktop\POS\pos_system
vercel --cwd backend
```

### Deploy Frontend

```bash
vercel --cwd frontend
```

---

## 📝 Configuration Files

### Frontend: `frontend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Backend: `backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🔧 Troubleshooting

### CORS Errors

**Error:** `Access-Control-Allow-Origin` error in browser console

**Fix:**
1. Ensure `FRONTEND_URL` is set in backend Vercel project
2. Value should match your frontend URL exactly (no trailing slash)
3. Redeploy backend after adding the variable

### API Not Found (404)

**Error:** Frontend can't reach backend API

**Fix:**
1. Verify `VITE_API_URL` is set in frontend with `/api` suffix
2. Example: `https://backend.vercel.app/api` (note the `/api` at the end)
3. Test backend health endpoint directly in browser

### Build Failures

**Frontend build fails:**
- Check `frontend/package.json` has `"build": "vite build"` script
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

**Backend build fails:**
- Ensure `backend/server.js` exports the app: `module.exports = app`
- Verify all Node.js dependencies are listed in `backend/package.json`

### Database Connection Issues

**Error:** Can't connect to MongoDB

**Fix:**
1. MongoDB Atlas: Add `0.0.0.0/0` to IP whitelist (allows all IPs including Vercel)
2. Verify `MONGODB_URI` is correctly set in backend Vercel project
3. Check MongoDB cluster is running

---

## 🎉 Success!

Once deployed, your architecture looks like:

```
Frontend (Vercel)                    Backend (Vercel)
https://pos-frontend.vercel.app ---> https://pos-backend.vercel.app
                                              ↓
                                        MongoDB Atlas
```

**Next Steps:**
- Add custom domains in Vercel project settings
- Set up staging environments
- Configure GitHub auto-deployments
- Monitor via Vercel analytics

---

## 📚 Related Files

- [frontend/vercel.json](file:///c:/Users/Aadhil/Desktop/POS/pos_system/frontend/vercel.json)
- [backend/vercel.json](file:///c:/Users/Aadhil/Desktop/POS/pos_system/backend/vercel.json)
- [backend/server.js](file:///c:/Users/Aadhil/Desktop/POS/pos_system/backend/server.js) - CORS configuration
- [frontend/.env.example](file:///c:/Users/Aadhil/Desktop/POS/pos_system/frontend/.env.example)
- [backend/.env.example](file:///c:/Users/Aadhil/Desktop/POS/pos_system/backend/.env.example)
