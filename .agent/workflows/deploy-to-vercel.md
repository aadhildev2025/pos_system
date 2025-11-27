---
description: Deploy POS System to Vercel (Frontend + Backend)
---

# Deploy POS System to Vercel

This guide walks you through deploying both the frontend and backend of your POS system to Vercel.

## Prerequisites

- Git repository (local or GitHub)
- Vercel account ([vercel.com](https://vercel.com))
- MongoDB Atlas cluster (allowing Vercel IP addresses)

---

## 🚀 Method 1: Deploy via Vercel Dashboard (Recommended for Continuous Deployment)

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Vercel will automatically detect your `vercel.json` configuration

### Step 3: Configure Environment Variables

**CRITICAL: Add these before deploying**

In the Vercel project settings, add the following environment variables:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `JWT_SECRET` | JWT secret key | `your_super_secret_jwt_key_change_this` |
| `ADMIN_EMAIL` | Admin email | `admin@gmail.com` |
| `ADMIN_PASSWORD` | Admin password | `your_secure_password` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (optional) | `ACxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (optional) | `your_twilio_token` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number (optional) | `whatsapp:+1234567890` |

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Enable Auto-Deployment

Vercel automatically deploys on every push to your main branch. No additional setup needed!

---

## 🖥️ Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Deploy to Vercel (Preview)

From your project root directory:

```bash
vercel
```

This creates a **preview deployment**. Answer the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No (first time) or Yes (if already created)
- **Project name?** `pos-system` (or your preferred name)
- **Directory with code?** `./` (current directory)

### Step 4: Add Environment Variables (CLI)

Add each environment variable:

```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
# Optional:
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
```

For each, you'll be prompted to:
1. Enter the value
2. Select which environments (choose "Production", "Preview", and "Development")

### Step 5: Deploy to Production

```bash
vercel --prod
```

Your app will be live at `https://your-project.vercel.app`

---

## 📋 Post-Deployment Checklist

### 1. Test Frontend Access
- [ ] Visit your Vercel URL
- [ ] Login page loads correctly
- [ ] CSS and images load

### 2. Test Backend API
- [ ] Login works (tests `/api/auth/login`)
- [ ] Product listing works (tests `/api/products`)
- [ ] Transactions work

### 3. Verify Database Connection
- [ ] MongoDB connection successful
- [ ] Data loads from database
- [ ] CRUD operations work

### 4. Check Environment Variables
- [ ] All required env vars are set in Vercel
- [ ] Features depending on env vars work (e.g., WhatsApp if configured)

---

## 🛠️ Troubleshooting

### Build Fails

**Check build logs in Vercel dashboard:**
- Frontend build errors: Check `frontend/` directory and dependencies
- Backend errors: Verify `api/index.js` and `backend/server.js`

### API Routes Return 404

- Verify `vercel.json` has correct rewrites
- Check that `/api` folder exists with `index.js`
- Ensure `backend/server.js` exports the app

### Database Connection Errors

- **MongoDB Atlas**: Add `0.0.0.0/0` to IP whitelist (allows all Vercel IPs)
- Verify `MONGODB_URI` environment variable is set correctly
- Check MongoDB Atlas cluster is running

### Environment Variables Not Working

- Ensure variables are added in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

---

## 🔄 Update Deployment

### Via GitHub (Auto-deploy enabled)
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically builds and deploys.

### Via CLI
```bash
vercel --prod
```

---

## 📊 Monitor Your Deployment

- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Logs**: View real-time function logs
- **Analytics**: Monitor performance and usage
- **Domains**: Add custom domain in project settings

---

## 🎉 You're Live!

Your POS system is now deployed with:
- ✅ Frontend (React/Vite) serving from root
- ✅ Backend (Express) handling `/api/*` routes
- ✅ MongoDB database connection
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push

**Next Steps:**
- Add a custom domain in Vercel settings
- Set up monitoring and alerts
- Configure CORS if needed for specific domains
