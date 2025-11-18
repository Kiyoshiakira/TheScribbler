# Firestore Security Rules Deployment Guide

## Overview
This document explains how to deploy the updated Firestore security rules to fix permission errors when accessing Story Scribbler features.

## Issue Fixed
- **Error**: `FirebaseError: Missing or insufficient permissions` when accessing the outline subcollection and other Story Scribbler features
- **Cause**: Firestore security rules may not have been properly deployed or were out of sync with the codebase
- **Solution**: Updated and consolidated Firestore security rules with proper configuration

## Changes Made

### 1. Created `firebase.json`
- Explicitly configures the location of Firestore rules file
- Ensures Firebase uses the correct rules file during deployment

### 2. Updated `firestore.rules`
- Added missing `feedback` collection rule
- Consolidated all rules in the root-level `firestore.rules` file
- Removed duplicate `src/firestore.rules` to avoid confusion

### 3. Verified All Subcollections
The rules now properly cover all subcollections used in the app:
- ✅ users
- ✅ scripts
- ✅ characters
- ✅ notes
- ✅ scenes
- ✅ comments
- ✅ versions
- ✅ outline
- ✅ chapters
- ✅ storyCharacters
- ✅ storyNotes
- ✅ timeline
- ✅ worldBuilding
- ✅ error-reports
- ✅ feedback

## Deployment Instructions

### Option 1: Using Firebase Console (Recommended for quick fix)
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-2119594896-6c18e`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` from the repository
5. Paste into the rules editor
6. Click **Publish** to deploy the rules

### Option 2: Using Firebase CLI
1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 3: Using Firebase Studio CLI (if available in Cloud Workstation)
1. From the Firebase Studio terminal:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Verification

After deploying the rules, verify the fix by:
1. Navigating to Story Scribbler in the app
2. Clicking on tabs in the left sidebar (Outline, Chapters, Characters, etc.)
3. Confirming that no permission errors occur
4. Testing CRUD operations (create, read, update, delete) on various subcollections

## Security Model

The deployed rules enforce:
- **User Ownership**: Users can only access their own data under `/users/{userId}/`
- **Authentication Required**: All operations require authenticated users
- **Public Profiles**: User profiles are readable by all but only writable by owner
- **Error Reporting**: Anyone can submit errors/feedback, but cannot read others' submissions
- **No User Listing**: Prevents listing all users in the system

## Troubleshooting

If you still see permission errors after deployment:
1. **Check rule deployment status**: In Firebase Console, verify the rules were published successfully
2. **Clear browser cache**: Force refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check authentication**: Ensure the user is properly signed in
4. **Verify UID match**: The authenticated user's UID should match the `{userId}` in the path
5. **Review Firestore logs**: Check the Firestore logs in Firebase Console for detailed error messages

## Notes
- The rules use `allow read` which covers both `get` and `list` operations
- The catch-all pattern approach was considered but explicit rules were chosen for clarity
- Rules are evaluated by Firebase in order, with the most specific match taking precedence
