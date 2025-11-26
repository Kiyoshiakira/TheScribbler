# Troubleshooting 403 Authentication Errors

This guide provides step-by-step instructions for resolving 403 errors when signing in to ScriptScribbler via Google or Email/Password authentication.

## Understanding 403 Errors

A **403 error** (Forbidden) during sign-in typically means:
- Your domain is not authorized in Firebase
- Required authentication providers are not enabled
- OAuth consent screen is not properly configured
- API credentials are missing or invalid

## Common 403 Error Scenarios

### 1. Google Sign-In Shows "403 That's an error" Page

**Symptoms:**
- Clicking "Sign in with Google" redirects to a Google error page
- Error message: "403. That's an error."
- Message may mention "unauthorized_client" or "access_denied"

**Root Cause:**
Your development domain (e.g., `localhost` or your cloud workspace domain) is not authorized in Firebase's authorized domains list.

**Solution:**

1. **Go to Firebase Console:**
   - Open [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Authentication:**
   - Click **Build** in left sidebar
   - Click **Authentication**
   - Click **Sign-in method** tab

3. **Add Your Domain to Authorized Domains:**
   - Scroll down to **Authorized domains** section
   - Click **Add domain** button
   - Enter your domain:
     - **For local development:** `localhost`
     - **For cloud workspaces:** Copy the domain from your browser's address bar (e.g., `xyz.cloudworkstations.dev`, `xyz.web.app`, etc.)
   - Click **Add** to save

4. **Test Sign-In Again:**
   - Return to your application
   - Try signing in with Google again
   - It should now work without the 403 error

### 2. Email/Password Sign-In Returns "operation-not-allowed"

**Symptoms:**
- Email/Password sign-in fails
- Error code: `auth/operation-not-allowed`
- Console shows authentication method is not enabled

**Root Cause:**
Email/Password authentication provider is not enabled in your Firebase project.

**Solution:**

1. **Go to Firebase Console:**
   - Open [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Enable Email/Password Provider:**
   - Navigate to **Build > Authentication**
   - Click **Sign-in method** tab
   - Find **Email/Password** in the providers list
   - Click on it to open settings
   - Toggle **Enable** to ON
   - Click **Save**

3. **Test Sign-In Again:**
   - Return to your application
   - Try signing in with email/password
   - It should now work

### 3. Google Sign-In Not Working at All

**Symptoms:**
- Google sign-in button does nothing
- Error: `auth/operation-not-allowed`
- No redirect to Google occurs

**Root Cause:**
Google authentication provider is not enabled in Firebase.

**Solution:**

1. **Enable Google Provider in Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Build > Authentication**
   - Click **Sign-in method** tab
   - Find **Google** in the providers list
   - Click on it to open settings
   - Toggle **Enable** to ON
   - Enter your **Project support email** (required)
   - Click **Save**

2. **Verify Authorized Domains:**
   - While still in **Sign-in method** tab
   - Scroll to **Authorized domains**
   - Ensure `localhost` is listed (it should be by default)
   - Add any additional domains you're using

3. **Test Again:**
   - Return to your application
   - Try Google sign-in
   - You should be redirected to Google's sign-in page

### 4. OAuth Consent Screen Issues (403 access_denied)

**Symptoms:**
- Redirects to Google but shows "access_denied" error
- Error mentions OAuth consent screen
- 403 error specifically about scopes or permissions

**Root Cause:**
The application requests Google Drive and Docs scopes for the import feature. If your OAuth consent screen is not configured or is in testing mode without authorized users, you may see 403 errors.

**Solution:**

**Option A: Configure OAuth Consent Screen (Recommended for Production)**

1. **Go to Google Cloud Console:**
   - Open [Google Cloud Console](https://console.cloud.google.com/)
   - Select the project associated with your Firebase app

2. **Configure OAuth Consent Screen:**
   - Navigate to **APIs & Services > OAuth consent screen**
   - If not configured, select **External** user type (or **Internal** for Google Workspace)
   - Fill in required fields:
     - App name
     - User support email
     - Developer contact information
   - Click **Save and Continue**

3. **Add Required Scopes:**
   - Click **Add or Remove Scopes**
   - Search for and add:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/documents.readonly`
   - Click **Update** and then **Save and Continue**

4. **Add Test Users (if in Testing mode):**
   - In **Test users** section
   - Click **Add Users**
   - Add your email address
   - Click **Save**

**Option B: Temporarily Remove Drive/Docs Scopes (Development Only)**

If you don't need the Google Docs import feature immediately, you can comment out the scope lines:

1. **Edit the Login Page:**
   Open `src/app/login/page.tsx` and find the `handleGoogleSignIn` function

2. **Comment Out Scope Lines:**
   ```typescript
   const provider = new GoogleAuthProvider();
   // Temporarily disable Drive/Docs scopes for basic sign-in
   // provider.addScope('https://www.googleapis.com/auth/drive.readonly');
   // provider.addScope('https://www.googleapis.com/auth/documents.readonly');
   ```

3. **Save and Test:**
   - Save the file
   - Try signing in again
   - Google sign-in should work without Drive/Docs permissions
   - Note: Google Docs import feature will not work without these scopes

### 5. Domain Mismatch in Cloud Workspaces

**Symptoms:**
- Works locally but not in cloud workspace (or vice versa)
- Error specifically mentions domain mismatch
- 403 error about unauthorized domain

**Root Cause:**
Each environment (localhost, staging, production, cloud workspace) needs to be separately authorized.

**Solution:**

1. **Identify Your Current Domain:**
   - Look at your browser's address bar
   - Copy the full domain (e.g., `abc123.cloudworkstations.dev`)

2. **Add Domain to Firebase:**
   - Go to Firebase Console > Authentication > Sign-in method
   - Scroll to **Authorized domains**
   - Click **Add domain**
   - Paste the domain you copied
   - Click **Add**

3. **Common Domains to Authorize:**
   - `localhost` (for local development)
   - Your production domain (e.g., `yourapp.web.app`)
   - Cloud workspace domains (e.g., `*.cloudworkstations.dev`)
   - Preview/staging domains

## Complete Setup Checklist

Use this checklist to ensure your Firebase authentication is properly configured:

### Firebase Console Setup

- [ ] **Email/Password provider is enabled**
  - Firebase Console > Authentication > Sign-in method
  - Email/Password toggle is ON

- [ ] **Google provider is enabled**
  - Firebase Console > Authentication > Sign-in method
  - Google toggle is ON
  - Support email is set

- [ ] **All domains are authorized**
  - Firebase Console > Authentication > Sign-in method > Authorized domains
  - `localhost` is listed
  - Your production domain is listed
  - Any cloud workspace domains are listed

- [ ] **Environment variables are set** (`.env.local` file exists with all values)
  ```env
  NEXT_PUBLIC_FIREBASE_API_KEY="..."
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
  NEXT_PUBLIC_FIREBASE_APP_ID="..."
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."
  ```

### Google Cloud Console Setup (Only if using Drive/Docs import)

- [ ] **OAuth consent screen is configured**
  - Google Cloud Console > APIs & Services > OAuth consent screen
  - App information is filled in
  - Required scopes are added (if using Drive/Docs import)

- [ ] **Test users are added (if in testing mode)**
  - OAuth consent screen > Test users
  - Your email is listed

### Application Setup

- [ ] **Dependencies are installed**
  ```bash
  npm install
  ```

- [ ] **Development server is running**
  ```bash
  npm run dev
  ```

- [ ] **Browser cache is cleared**
  - Clear cookies and cache
  - Try in incognito/private browsing mode

## Testing Your Fix

After making changes:

1. **Clear Browser State:**
   - Clear cookies and cache for your domain
   - Close all browser windows
   - Restart your browser

2. **Test Email/Password Sign-In:**
   - Go to login page
   - Try creating a new account
   - Try signing in with existing account
   - Verify no errors appear

3. **Test Google Sign-In:**
   - Go to login page
   - Click "Sign in with Google"
   - Verify redirect to Google works
   - Complete sign-in
   - Verify redirect back to app works

4. **Check Browser Console:**
   - Press F12 to open developer tools
   - Go to Console tab
   - Look for any error messages
   - All auth-related messages should be successful

## Still Having Issues?

If you're still experiencing 403 errors after following this guide:

1. **Check Browser Console:**
   - Open developer tools (F12)
   - Look for specific error codes
   - Note any error messages

2. **Verify Firebase Status:**
   - Check [Firebase Status](https://status.firebase.google.com/)
   - Ensure all services are operational

3. **Review Firestore Rules:**
   - Ensure rules allow authenticated users to read/write
   - Deploy updated rules: `firebase deploy --only firestore:rules`

4. **Try Different Browser:**
   - Test in Chrome, Firefox, or Edge
   - Try incognito/private mode
   - Disable browser extensions

5. **Check Network Issues:**
   - Verify internet connection
   - Check firewall settings
   - Ensure Google APIs are accessible

6. **Review Full Error Message:**
   - Copy the complete error from console
   - Search for the specific error code
   - Check Firebase documentation for that error

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [ScriptScribbler Main README](../README.md)
- [Wiki Troubleshooting Guide](../wiki/Troubleshooting.md)

## Quick Reference: Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/operation-not-allowed` | Provider not enabled | Enable the sign-in method in Firebase Console |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to authorized domains list |
| `auth/invalid-credential` | Wrong email/password | Check credentials and try again |
| `auth/user-not-found` | Account doesn't exist | Create an account first |
| `auth/wrong-password` | Incorrect password | Check password and try again |
| `auth/too-many-requests` | Too many failed attempts | Wait and try again later |
| `auth/network-request-failed` | Network issue | Check internet connection |
| `access_denied` (OAuth) | OAuth consent issue | Configure OAuth consent screen or add as test user |

---

**Last Updated:** 2025-11-18
