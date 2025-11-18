# User Setup Instructions - Required Actions

## What You Need to Do to Fix 403 Sign-In Errors

This document outlines the specific actions **you must take** in your Firebase Console and Google Cloud Console to enable authentication and fix 403 errors.

---

## 🔥 Critical Steps in Firebase Console

### 1. Enable Email/Password Authentication (REQUIRED)

**Why:** Without this, users cannot sign up or sign in with email and password.

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your ScriptScribbler project
3. Click **Build** in the left sidebar
4. Click **Authentication**
5. Click the **Sign-in method** tab
6. Find **Email/Password** in the list
7. Click on it
8. **Toggle "Enable" to ON**
9. Click **Save**

**How to verify:** Try creating an account with email/password in your app. It should work without errors.

---

### 2. Enable Google Sign-In (REQUIRED)

**Why:** Without this, the "Sign in with Google" button will not work.

**Steps:**
1. In Firebase Console, go to **Authentication > Sign-in method**
2. Find **Google** in the providers list
3. Click on it
4. **Toggle "Enable" to ON**
5. Enter a **Project support email** (your email address)
6. Click **Save**

**How to verify:** Click "Sign in with Google" in your app. You should be redirected to Google's sign-in page.

---

### 3. Add Authorized Domains (REQUIRED for Local Development)

**Why:** If you see "403 That's an error" when signing in with Google, it's because your domain is not authorized.

**For Local Development:**
1. In Firebase Console, go to **Authentication > Sign-in method**
2. Scroll down to **Authorized domains** section
3. Verify **localhost** is in the list
   - It should be there by default
   - If not, click **Add domain**, type `localhost`, and click **Add**

**For Cloud Workspaces (Codespaces, Cloud9, etc.):**
1. Copy your workspace URL from the browser address bar
   - Example: `abc123.cloudworkstations.dev`
   - Example: `abc123-9002.githubpreview.dev`
2. In Firebase Console, go to **Authentication > Sign-in method**
3. Scroll to **Authorized domains**
4. Click **Add domain**
5. Paste your workspace domain
6. Click **Add**

**For Production:**
1. Add your production domain (e.g., `yourapp.web.app`, `yourdomain.com`)
2. Follow the same steps as above

**How to verify:** Try signing in with Google. You should not see a 403 error page.

---

### 4. Set Up Firestore Database (REQUIRED)

**Why:** The app stores all user data, scripts, characters, etc. in Firestore.

**Steps:**
1. In Firebase Console, click **Build** in sidebar
2. Click **Firestore Database**
3. Click **Create database**
4. Choose a location (select one close to your users)
5. Select **Start in test mode** (for development)
   - **Important:** Change to production rules before deploying to production
6. Click **Enable**

**Deploy Security Rules:**

After setting up your local environment, deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

**⚠️ Important:** If you encounter permission errors when using Story Scribbler features (outline, chapters, timeline, etc.), ensure the latest Firestore rules are deployed.

📘 **See [FIRESTORE_RULES_DEPLOYMENT.md](../FIRESTORE_RULES_DEPLOYMENT.md) for:**
- Detailed deployment instructions
- Multiple deployment options (Console, CLI, Studio)
- Troubleshooting permission errors
- Security model explanation

**How to verify:** Create a script in the app. It should save without permission errors. Try accessing Story Scribbler features (Outline, Chapters, etc.) to ensure all subcollections work.

---

## ☁️ Optional: Google Cloud Console Setup

**When you need this:** Only if you want to use the **Google Docs Import** feature. Basic authentication works without these steps.

### Configure OAuth Consent Screen (OPTIONAL)

**Why:** Google Drive and Docs scopes require an OAuth consent screen. Without this, you may get 403 errors when the app requests these permissions.

**Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the same project as your Firebase app
3. In the left menu, go to **APIs & Services**
4. Click **OAuth consent screen**

5. **Select User Type:**
   - Choose **External** (for public apps)
   - Choose **Internal** (for Google Workspace users only)
   - Click **Create**

6. **Fill in App Information:**
   - **App name:** ScriptScribbler (or your app name)
   - **User support email:** Your email
   - **Developer contact information:** Your email
   - Click **Save and Continue**

7. **Add Scopes (Optional):**
   - Click **Add or Remove Scopes**
   - In the filter box, search for: `drive.readonly`
   - Check the box next to `https://www.googleapis.com/auth/drive.readonly`
   - Search for: `documents.readonly`
   - Check the box next to `https://www.googleapis.com/auth/documents.readonly`
   - Click **Update**
   - Click **Save and Continue**

8. **Add Test Users (if app is in Testing mode):**
   - Click **Add Users**
   - Enter your email address (the one you use to sign in)
   - Click **Add**
   - Click **Save and Continue**

9. **Review and Complete:**
   - Review your settings
   - Click **Back to Dashboard**

**How to verify:** Sign in with Google. If you see a consent screen asking for Drive/Docs permissions, click "Allow". You should not get 403 errors.

---

### Alternative: Disable Drive/Docs Scopes (OPTIONAL)

If you don't need the Google Docs import feature, you can disable these scopes to avoid OAuth setup:

**Steps:**

1. Open the file `src/app/login/page.tsx`
2. Find the `handleGoogleSignIn` function (around line 250)
3. Comment out these lines:
   ```typescript
   // provider.addScope('https://www.googleapis.com/auth/drive.readonly');
   // provider.addScope('https://www.googleapis.com/auth/documents.readonly');
   ```
4. Save the file
5. Restart your development server

**Trade-off:** Google sign-in will work, but you won't be able to import scripts from Google Docs.

---

## 📝 Environment Variables Setup (REQUIRED)

**Why:** The app needs these to connect to Firebase and Google services.

**Steps:**

1. In the root of your project, create a file named `.env.local`
2. Copy this template:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="paste_your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_APP_ID="paste_your_app_id_here"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="paste_sender_id_here"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="paste_measurement_id_here"

# Optional: Google Gemini API for AI features
GEMINI_API_KEY="paste_your_gemini_key_here"

# Optional: Google Picker API for Google Docs import
NEXT_PUBLIC_GOOGLE_API_KEY="paste_your_google_api_key"
NEXT_PUBLIC_GOOGLE_APP_ID="paste_your_app_id"
```

3. **Get Firebase values:**
   - Go to Firebase Console
   - Click the gear icon (Project Settings)
   - Scroll down to "Your apps"
   - If you don't see a web app, click the `</>` icon to create one
   - Copy each value and paste it into `.env.local`

4. **Get Gemini API key (Optional):**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the key
   - Paste into `GEMINI_API_KEY` in `.env.local`

5. Save the file

6. **Restart your development server:**
   ```bash
   npm run dev
   ```

**How to verify:** The app should start without Firebase configuration errors in the console.

---

## ✅ Quick Verification Checklist

After completing the setup, verify everything works:

- [ ] I can create an account with email and password
- [ ] I can sign in with email and password
- [ ] I can sign in with Google (no 403 error)
- [ ] I can create a new script
- [ ] The editor loads and I can type
- [ ] Auto-save works (I see a save indicator)
- [ ] No errors appear in the browser console (F12)

---

## 🚨 Still Getting 403 Errors?

If you completed all the required steps and still see 403 errors:

1. **Clear your browser cache and cookies**
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

2. **Try incognito/private browsing mode**
   - This eliminates cached data as a problem

3. **Check the browser console (F12)**
   - Look for the specific error code
   - Note the complete error message

4. **Refer to the detailed troubleshooting guide:**
   - See [TROUBLESHOOTING_403_ERRORS.md](TROUBLESHOOTING_403_ERRORS.md)
   - Find your specific error and follow the solution

5. **Double-check each required step above**
   - Email/Password enabled? ✓
   - Google sign-in enabled? ✓
   - Domains authorized? ✓
   - Environment variables set? ✓

---

## 📞 Need More Help?

- **Detailed Troubleshooting:** [TROUBLESHOOTING_403_ERRORS.md](TROUBLESHOOTING_403_ERRORS.md)
- **Setup Checklist:** [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
- **Main README:** [README.md](../README.md)
- **Wiki Troubleshooting:** [wiki/Troubleshooting.md](../wiki/Troubleshooting.md)

---

**Last Updated:** 2025-11-18
