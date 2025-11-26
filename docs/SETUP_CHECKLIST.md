# ScriptScribbler Setup Checklist

Use this checklist to ensure your ScriptScribbler installation is properly configured and avoid common 403 authentication errors.

## ✅ Pre-Installation Checklist

Before you begin, make sure you have:

- [ ] **Node.js installed** (v18 or later)
  - Run `node --version` to check
  - Download from [nodejs.org](https://nodejs.org/) if needed

- [ ] **npm installed** (comes with Node.js)
  - Run `npm --version` to check

- [ ] **Firebase account created**
  - Sign up at [firebase.google.com](https://firebase.google.com/)

- [ ] **Firebase project created**
  - Create a new project in [Firebase Console](https://console.firebase.google.com/)

- [ ] **Google Gemini API key** (optional, for AI features)
  - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

## ✅ Firebase Console Setup

### Step 1: Enable Authentication Providers

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project
- [ ] Navigate to **Build** → **Authentication**
- [ ] Click **Get started** (if first time)
- [ ] Click **Sign-in method** tab
- [ ] Enable **Email/Password**:
  - [ ] Click on "Email/Password"
  - [ ] Toggle **Enable** to ON
  - [ ] Click **Save**
- [ ] Enable **Google**:
  - [ ] Click on "Google"
  - [ ] Toggle **Enable** to ON
  - [ ] Enter **Project support email** (your email)
  - [ ] Click **Save**

### Step 2: Authorize Domains

- [ ] Still in **Authentication** → **Sign-in method**
- [ ] Scroll down to **Authorized domains** section
- [ ] Verify `localhost` is listed (should be there by default)
- [ ] Add your production domain (if applicable):
  - [ ] Click **Add domain**
  - [ ] Enter your domain (e.g., `yourapp.web.app`)
  - [ ] Click **Add**
- [ ] Add cloud workspace domain (if using cloud IDE):
  - [ ] Copy domain from your browser address bar
  - [ ] Click **Add domain**
  - [ ] Paste the domain
  - [ ] Click **Add**

### Step 3: Set Up Firestore Database

- [ ] In Firebase Console, navigate to **Build** → **Firestore Database**
- [ ] Click **Create database**
- [ ] Select **Start in test mode** (for development) or **production mode**
- [ ] Choose a location
- [ ] Click **Enable**
- [ ] Deploy security rules (after installing the app):
  ```bash
  firebase deploy --only firestore:rules
  ```

### Step 4: Get Firebase Configuration

- [ ] In Firebase Console, go to **Project settings** (gear icon)
- [ ] Scroll down to **Your apps**
- [ ] Click the **Web** icon (</>) to add a web app (if not already added)
- [ ] Register your app with a nickname
- [ ] Copy the configuration values (you'll need these later)

## ✅ Google Cloud Console Setup (Only if using Google Docs Import)

**Note:** Only complete this section if you plan to use the Google Docs import feature. Basic sign-in works without this.

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select the project linked to your Firebase app
- [ ] Navigate to **APIs & Services** → **OAuth consent screen**
- [ ] Configure consent screen:
  - [ ] Select **External** (or **Internal** for Workspace)
  - [ ] Fill in **App name**
  - [ ] Fill in **User support email**
  - [ ] Fill in **Developer contact information**
  - [ ] Click **Save and Continue**
- [ ] Add scopes (optional for import feature):
  - [ ] Click **Add or Remove Scopes**
  - [ ] Search for and add: `https://www.googleapis.com/auth/drive.readonly`
  - [ ] Search for and add: `https://www.googleapis.com/auth/documents.readonly`
  - [ ] Click **Update**
  - [ ] Click **Save and Continue**
- [ ] Add test users (if in testing mode):
  - [ ] Click **Add Users**
  - [ ] Enter your email address
  - [ ] Click **Add**
  - [ ] Click **Save and Continue**

## ✅ Local Project Setup

### Step 1: Install Dependencies

- [ ] Open terminal in project directory
- [ ] Run installation:
  ```bash
  npm install
  ```
- [ ] Wait for installation to complete (may take a few minutes)

### Step 2: Configure Environment Variables

- [ ] Create `.env.local` file in project root
- [ ] Copy the template below and fill in your values:

```env
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id_here"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"

# Google Gemini API (optional - for AI features)
GEMINI_API_KEY="your_gemini_key_here"

# Google Picker API (optional - for Google Docs import)
NEXT_PUBLIC_GOOGLE_API_KEY="your_google_api_key"
NEXT_PUBLIC_GOOGLE_APP_ID="your_app_id"
```

- [ ] Save the file
- [ ] Verify all values are filled in (except optional ones)

### Step 3: Start Development Server

- [ ] Run the development server:
  ```bash
  npm run dev
  ```
- [ ] Wait for server to start
- [ ] Look for message: `ready - started server on 0.0.0.0:9002`
- [ ] Open browser to [http://localhost:9002](http://localhost:9002)

## ✅ First Login Test

### Test Email/Password Sign-Up

- [ ] Click **Sign Up** tab
- [ ] Enter a test email address
- [ ] Enter a password (at least 6 characters)
- [ ] Click **Create Account**
- [ ] Verify you're redirected to the home page
- [ ] Check for success message

### Test Google Sign-In

- [ ] Sign out if currently signed in
- [ ] Go back to login page
- [ ] Click **Sign in with Google** button
- [ ] Verify redirect to Google sign-in page
- [ ] Sign in with your Google account
- [ ] Verify redirect back to ScriptScribbler
- [ ] Check that you're logged in

### Test Email/Password Sign-In

- [ ] Sign out
- [ ] Click **Sign In** tab
- [ ] Enter your email
- [ ] Enter your password
- [ ] Click **Sign In**
- [ ] Verify successful sign-in

## ✅ Verify Application Features

- [ ] Dashboard loads correctly
- [ ] Can create a new script
- [ ] Editor tab opens
- [ ] Can type in the editor
- [ ] Auto-save works (check for save indicator)
- [ ] Characters tab is accessible
- [ ] Scenes tab is accessible
- [ ] Notes tab is accessible

## 🚨 If You Encounter Issues

### Login Fails / 403 Errors

See the **[Complete 403 Troubleshooting Guide](TROUBLESHOOTING_403_ERRORS.md)** for detailed solutions.

**Quick fixes:**
- [ ] Verify Email/Password is enabled in Firebase Console
- [ ] Verify Google sign-in is enabled in Firebase Console
- [ ] Check that `localhost` is in authorized domains
- [ ] Clear browser cache and cookies
- [ ] Try in incognito/private browsing mode
- [ ] Check browser console (F12) for specific error messages

### Editor Not Loading

- [ ] Check Firestore security rules are deployed
- [ ] Verify user is authenticated (check top-right corner for avatar)
- [ ] Check browser console for permission errors
- [ ] Try creating a new script
- [ ] Sign out and sign in again

### AI Features Not Working

- [ ] Verify `GEMINI_API_KEY` is set in `.env.local`
- [ ] Check that the API key is valid
- [ ] Restart the development server
- [ ] Check browser console for API errors

## 📋 Maintenance Checklist

### Regular Updates

- [ ] **Weekly:** Check for npm package updates
  ```bash
  npm outdated
  ```

- [ ] **Monthly:** Update dependencies
  ```bash
  npm update
  ```

- [ ] **As needed:** Check Firebase Console for usage limits

### Before Production Deployment

- [ ] Switch Firestore to production rules
- [ ] Add production domain to authorized domains
- [ ] Set up environment variables in hosting platform
- [ ] Test all authentication methods in production
- [ ] Verify OAuth consent screen is published (not in testing)
- [ ] Set up error monitoring
- [ ] Configure backup strategy for Firestore

## 🎯 Success Criteria

You've successfully set up ScriptScribbler when:

✅ You can sign up with email/password  
✅ You can sign in with Google  
✅ You can create and edit scripts  
✅ Characters are automatically detected  
✅ Scenes are tracked  
✅ Notes can be created  
✅ AI features work (if API key is configured)  
✅ No 403 or authentication errors appear  
✅ Auto-save functions properly  

## 📚 Additional Resources

- [Main README](../README.md) - Overview and features
- [Getting Started Guide](../wiki/Getting-Started.md) - Detailed setup
- [403 Troubleshooting Guide](TROUBLESHOOTING_403_ERRORS.md) - Authentication issues
- [Firebase Documentation](https://firebase.google.com/docs) - Firebase help
- [Next.js Documentation](https://nextjs.org/docs) - Framework help

---

**Last Updated:** 2025-11-18

**Questions or Issues?**
- Check the [Troubleshooting Guide](../wiki/Troubleshooting.md)
- Review the [403 Error Guide](TROUBLESHOOTING_403_ERRORS.md)
- Open a GitHub issue with details
