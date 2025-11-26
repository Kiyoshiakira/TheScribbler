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
- **Added catch-all wildcard rule** under `/users/{userId}/` - This is the key fix!
  - Gives owners full access to all their data
  - Acts as a fallback for any subcollections without specific rules
  - Ensures new subcollections automatically work without rule updates
- Added missing `feedback` collection rule
- Changed Story Scribbler features to owner-only access (outline, chapters, timeline, etc.)
- Kept screenplay features as shareable (scripts, scenes, characters, notes)
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
- **Owner Access (PRIMARY)**: Catch-all rule ensures owners have full access to all data under `/users/{userId}/`
- **Authentication Required**: All operations require authenticated users
- **Public Profiles**: User profiles are readable by all but only writable by owner
- **Sharing Features**: Scripts, scenes, characters, and notes are readable by any authenticated user (for sharing)
- **Private Features**: Story Scribbler features (outline, chapters, timeline, etc.) are owner-only
- **Error Reporting**: Anyone can submit errors/feedback, but cannot read others' submissions
- **No User Listing**: Prevents listing all users in the system

**Key Fix**: The catch-all wildcard rule `match /{document=**}` nested under `/users/{userId}/` ensures that:
1. Owners can always access their own data
2. New subcollections work automatically
3. Permission errors like the one reported are prevented

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
