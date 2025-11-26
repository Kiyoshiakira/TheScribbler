# Browser Extension Compatibility Guide

This document provides troubleshooting guidance for users experiencing sign-in issues due to browser extensions that may interfere with The Scribbler's authentication flow.

## Overview

Some browser extensions, particularly ad blockers and content modifiers, can inject scripts or modify page behavior in ways that interfere with Google Sign-In and Firebase authentication. This can result in:

- Sign-in redirects failing silently
- CSP (Content Security Policy) errors in the console
- "Blocked by browser policy" error messages
- Unexpected JavaScript errors during authentication

## Known Problematic Extensions

The following extensions have been reported to sometimes interfere with authentication:

### Ad Blockers
| Extension | Issue | Workaround |
|-----------|-------|------------|
| **uBlock Origin** | May block Firebase/Google scripts | Add `*.firebaseapp.com`, `*.googleapis.com`, and `accounts.google.com` to whitelist |
| **AdBlock Plus** | Can interfere with OAuth redirects | Disable on The Scribbler domain or use popup sign-in |
| **Ghostery** | Blocks tracking scripts including some auth scripts | Whitelist the application domain |
| **Privacy Badger** | May block third-party auth cookies | Allow cookies for `google.com` |

### Content Modifiers
| Extension | Issue | Workaround |
|-----------|-------|------------|
| **Dark Reader** | Injects `content.js` that may conflict with CSP | Disable on The Scribbler or add to site list exclusions |
| **Stylus/Stylish** | Custom CSS injection can break UI | Disable custom styles for this site |
| **Tampermonkey/Greasemonkey** | User scripts may conflict | Disable all scripts for this domain |

### Social/Enhancement Extensions
| Extension | Issue | Workaround |
|-----------|-------|------------|
| **BetterTTV** | Script injection conflicts | Not typically needed for this site - disable |
| **Honey** | May intercept page loads | Disable on non-shopping sites |
| **LastPass/1Password** | Usually fine, but can conflict with form filling | Use manual entry if issues occur |

### Security Extensions
| Extension | Issue | Workaround |
|-----------|-------|------------|
| **NoScript** | Blocks JavaScript execution | Allow all scripts from required domains |
| **HTTPS Everywhere** | May cause redirect loops | Usually fine; disable if issues persist |
| **Disconnect** | Blocks third-party connections | Whitelist authentication domains |

## Required Domains for Authentication

If you use an extension that allows whitelisting specific domains, add the following:

```
# Firebase Authentication
*.firebaseapp.com
*.firebaseio.com

# Google APIs and Sign-In
*.googleapis.com
accounts.google.com
apis.google.com

# Google OAuth
oauth2.googleapis.com

# Application domains
localhost (for development)
your-app-domain.web.app (your deployed app)
```

## Troubleshooting Steps

### Step 1: Try Popup Sign-In
If the redirect sign-in fails, click "Having trouble? Try Popup Sign-In" link on the login page. Popup sign-in often works when redirect sign-in is blocked.

### Step 2: Use Incognito/Private Browsing
Most extensions are disabled in incognito mode by default. This is the quickest way to determine if an extension is causing the issue:

1. Open an incognito/private window
2. Navigate to The Scribbler
3. Try signing in

If sign-in works in incognito mode, an extension is likely the cause.

### Step 3: Disable Extensions One by One
If you prefer not to use incognito mode:

1. Open your browser's extension management page:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
   - Edge: `edge://extensions`
2. Disable all extensions
3. Try signing in
4. If successful, re-enable extensions one at a time to identify the culprit

### Step 4: Check Browser Console
Open the browser developer tools (F12) and check the Console tab for errors:

- **CSP errors**: Look for "Content Security Policy" or "unsafe-eval" messages
- **Network errors**: Look for blocked requests to `googleapis.com` or `firebaseapp.com`
- **Script errors**: Look for errors mentioning `content.js` or extension IDs

### Step 5: Clear Browser Data
Sometimes cached data from extensions can cause issues:

1. Clear cookies and site data for The Scribbler
2. Clear cached images and files
3. Restart the browser
4. Try signing in again

## Extension-Specific Solutions

### uBlock Origin
To whitelist The Scribbler:

1. Click the uBlock Origin icon
2. Click the power button to disable for this site
3. Or add these rules to "My Filters":
   ```
   @@||firebaseapp.com^$domain=your-app-domain.com
   @@||googleapis.com^$domain=your-app-domain.com
   @@||accounts.google.com^$domain=your-app-domain.com
   ```

### Dark Reader
To exclude The Scribbler:

1. Click the Dark Reader icon
2. Click "Site list" tab
3. Add The Scribbler URL to the exclusion list
4. Or toggle Dark Reader off for this specific site

### Privacy Badger
To allow authentication:

1. Click the Privacy Badger icon while on The Scribbler
2. Find sliders for Google-related domains
3. Move sliders to green (allow) for:
   - `accounts.google.com`
   - `apis.google.com`
   - `firebaseapp.com`

## For Developers

### CSP Considerations

The Scribbler uses Firebase's modular SDK (v9+) which is CSP-compliant and does not require `unsafe-eval`. However, if you need to implement strict CSP headers, ensure the following:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.firebaseapp.com https://apis.google.com https://accounts.google.com;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com;
  frame-src https://accounts.google.com https://*.firebaseapp.com;
  img-src 'self' data: https://*.googleusercontent.com https://*.googleapis.com;
```

**Note**: The `unsafe-inline` for scripts is often necessary for inline event handlers. For maximum security, consider using nonces or hashes instead.

### Detecting Extension Conflicts

The login page includes error detection for common extension-related issues:

- CSP violations are caught and user-friendly messages are displayed
- The popup sign-in fallback is offered when redirect sign-in fails
- Console warnings help developers identify the source of issues

## Reporting Issues

If you encounter an extension compatibility issue not listed here:

1. Note the exact error message (check browser console with F12)
2. List all enabled extensions
3. Describe what you were trying to do
4. Create an issue in the GitHub repository with this information

## Additional Resources

- [TROUBLESHOOTING_403_ERRORS.md](./TROUBLESHOOTING_403_ERRORS.md) - Firebase authentication setup guide
- [firebase-auth-domains.md](./firebase-auth-domains.md) - Authorized domains configuration
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated:** 2025-11-26
