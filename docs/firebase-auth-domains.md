# Firebase Auth: Authorized Domains

This document explains which domains you need to add to the "Authorized domains" list in your Firebase project settings to ensure authentication (especially Google Sign-In) works correctly across different environments.

## Where to Add Domains

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  In the left-hand menu, go to **Build > Authentication**.
4.  Click the **Sign-in method** tab.
5.  Scroll down to the **Authorized domains** section and click **Add domain**.

## Domains to Add

### 1. `localhost`

-   **Purpose**: Essential for local development.
-   **Why**: When you run the app on your local machine (e.g., using `npm run dev`), Google Sign-In needs `localhost` to be authorized to handle the sign-in redirect flow securely. Without this, you will get a "403 That's an error" page from Google.

### 2. `[YOUR_PROJECT_ID].firebaseapp.com`

-   **Purpose**: The default legacy Firebase Hosting domain.
-   **Why**: This is one of the default domains associated with your Firebase project. It's a good practice to keep it authorized, even if you primarily use the `.web.app` domain or a custom domain. Replace `[YOUR_PROJECT_ID]` with your actual Firebase Project ID.

### 3. `[YOUR_PROJECT_ID].web.app`

-   **Purpose**: The primary Firebase Hosting domain.
-   **Why**: When you deploy your application using Firebase Hosting, this will be its public URL. It is critical for authentication to work on your live site. Replace `[YOUR_PROJECT_ID]` with your actual Firebase Project ID.

### 4. Cloud Workstation Domain (If applicable)

-   **Purpose**: For development in cloud-based environments like Firebase Studio or Google Cloud Workstations.
-   **Why**: These environments run on a unique domain assigned to you. You must authorize the root domain to allow sign-ins from your cloud workspace.
-   **Example**: If your workspace URL is `my-dev-instance-123.europe-west1.cloudworkstations.dev`, you would add the domain `europe-west1.cloudworkstations.dev` to the list.

### 5. Your Custom Domain (When you have one)

-   **Purpose**: For your final, public-facing website.
-   **Example**: If you decide to use `ideaforge.app`, you will need to add `ideaforge.app` to this list once you've configured it with Firebase Hosting.

## Summary

Your final authorized domains list in Firebase should look something like this:

-   `localhost`
-   `your-project-id.firebaseapp.com`
-   `your-project-id.web.app`
-   `your-cloud-workstation-domain.dev` (if you use one)
-   `your-custom-domain.com` (once you set it up)

By authorizing these domains, you ensure that Firebase Authentication can securely handle sign-in requests from your app, whether you're developing locally, in the cloud, or on your live production site.

## Troubleshooting

If you're experiencing sign-in issues even with all domains authorized, see:

- [TROUBLESHOOTING_403_ERRORS.md](./TROUBLESHOOTING_403_ERRORS.md) - Comprehensive guide for 403 authentication errors
- [EXTENSION_COMPATIBILITY.md](./EXTENSION_COMPATIBILITY.md) - Browser extension conflicts and solutions
