# 🚀 Quick Start Card - Fixing 403 Sign-In Errors

## TL;DR - What You Need to Do

Having 403 errors? Follow these 4 steps in Firebase Console:

### ✅ Step 1: Enable Email/Password (2 minutes)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Your Project → **Authentication** → **Sign-in method**
3. Click **Email/Password** → Toggle **ON** → **Save**

### ✅ Step 2: Enable Google Sign-In (2 minutes)
1. Same page (**Authentication** → **Sign-in method**)
2. Click **Google** → Toggle **ON**
3. Enter your **support email** → **Save**

### ✅ Step 3: Add Your Domain (1 minute)
1. Same page, scroll to **Authorized domains**
2. Verify **localhost** is listed
3. If using cloud workspace, click **Add domain** → paste your workspace URL → **Add**

### ✅ Step 4: Create Database (2 minutes)
1. Firebase Console → **Firestore Database** → **Create database**
2. Select location → **Enable**
3. Done!

---

## 🆘 Still Getting Errors?

### Error: "403 That's an error"
→ **Fix:** Add your domain to authorized domains (Step 3 above)  
→ **Details:** [See full guide](TROUBLESHOOTING_403_ERRORS.md#google-sign-in-shows-403-thats-an-error-page)

### Error: "auth/operation-not-allowed"
→ **Fix:** Enable Email/Password or Google provider (Steps 1-2 above)  
→ **Details:** [See full guide](TROUBLESHOOTING_403_ERRORS.md#emailpassword-sign-in-returns-operation-not-allowed)

### Error: "access_denied" or OAuth issues
→ **Fix:** Configure OAuth consent screen OR disable Drive/Docs scopes  
→ **Details:** [See full guide](TROUBLESHOOTING_403_ERRORS.md#oauth-consent-screen-issues-403-access_denied)

---

## 📖 Complete Guides

| Guide | When to Use |
|-------|-------------|
| [USER_SETUP_INSTRUCTIONS.md](USER_SETUP_INSTRUCTIONS.md) | First time setup - start here |
| [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) | Verify you didn't miss anything |
| [TROUBLESHOOTING_403_ERRORS.md](TROUBLESHOOTING_403_ERRORS.md) | Specific error? Find solution here |

---

## ⚡ After Firebase Setup

1. Create `.env.local` in project root
2. Add your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="your_key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
   NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
   ```
3. Run `npm install`
4. Run `npm run dev`
5. Open http://localhost:9002
6. Test sign-in!

---

## ✨ Tips

- **Clear browser cache** if you're still having issues
- **Try incognito mode** to rule out cached data
- **Check console (F12)** for specific error codes
- **All domains need authorization** - localhost, production, cloud workspaces

---

**⏱️ Total Setup Time:** ~10 minutes  
**📚 Full Documentation:** See [README.md](../README.md) for all guides
