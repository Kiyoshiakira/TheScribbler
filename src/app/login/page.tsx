'use client';

import * as React from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase, useUser } from '@/firebase';
import { Logo } from '@/components/layout/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Chrome, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRedirectResult } from '@/firebase/auth/use-redirect-result';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';

function LoginCard() {
  // Use useFirebase instead of useAuth to get nullable auth
  const { auth, firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  
  const [signInEmail, setSignInEmail] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [signUpEmail, setSignUpEmail] = React.useState('');
  const [signUpPassword, setSignUpPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Handle Google redirect result
  const redirectResult = useRedirectResult(auth);

  // Log auth availability for debugging
  React.useEffect(() => {
    console.log('[LoginPage] Auth availability:', {
      authAvailable: !!auth,
      authType: auth ? typeof auth : 'undefined',
    });
  }, [auth]);

  // Fallback: if redirect returned no result but onAuthStateChanged shows a signed-in user,
  // navigate to home. This handles cases where getRedirectResult returns null but the user is signed in.
  React.useEffect(() => {
    if (!redirectResult.isProcessing && !redirectResult.userCredential && currentUser) {
      console.log('[LoginPage] No redirect result but user exists in onAuthStateChanged; redirecting to /');
      router.push('/');
    }
  }, [redirectResult, currentUser, router]);

  // Process redirect result from Google Sign-In
  React.useEffect(() => {
    const processRedirectResult = async () => {
      if (!redirectResult.isProcessing && redirectResult.userCredential && firestore) {
        const user = redirectResult.userCredential.user;
        console.log('[LoginPage] Processing Google sign-in result for user:', user.uid);

        try {
          // Check if user profile exists in Firestore
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // Profile exists, redirect to home
            console.log('[LoginPage] Profile exists, redirecting to home');
            toast({
              title: 'Welcome Back!',
              description: 'Successfully signed in with Google.',
            });
            router.push('/');
          } else {
            // Profile doesn't exist, redirect to onboarding
            console.log('[LoginPage] Profile does not exist, redirecting to onboarding');
            toast({
              title: 'Welcome!',
              description: 'Please complete your profile setup.',
            });
            router.push('/onboarding');
          }
        } catch (error: any) {
          console.error('[LoginPage] Error checking user profile:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to verify your profile. Please try again.',
          });
        }
      } else if (!redirectResult.isProcessing && redirectResult.error) {
        console.error('[LoginPage] Error in Google redirect:', redirectResult.error);
        
        // Provide helpful error messages based on the error type
        let errorTitle = 'Google Sign-In Error';
        let errorDescription = redirectResult.error.message || 'Failed to sign in with Google.';
        
        const errorMessage = redirectResult.error.message || '';
        const errorCode = (redirectResult.error as any).code || '';
        
        if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
          errorTitle = 'Domain Not Authorized';
          errorDescription = 'Your domain is not authorized for Google Sign-In. Go to Firebase Console > Authentication > Sign-in method > Authorized domains and add your current domain (check your browser\'s address bar).';
        } else if (errorCode === 'auth/operation-not-allowed') {
          errorTitle = 'Google Sign-In Not Enabled';
          errorDescription = 'Google sign-in provider is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable Google.';
        } else if (errorMessage.includes('403') || errorMessage.includes('access_denied')) {
          errorTitle = 'Access Denied (403)';
          errorDescription = 'Google denied access. This may be due to: (1) Domain not authorized in Firebase, (2) OAuth consent screen not configured, or (3) Required scopes not approved. See troubleshooting guide for setup instructions.';
        } else if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
          errorTitle = 'Sign-In Cancelled';
          errorDescription = 'The sign-in process was cancelled. Please try again.';
        }
        
        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorDescription,
        });
      }
    };

    processRedirectResult();
  }, [redirectResult, firestore, router, toast]);

  const validateInputs = (action: 'signIn' | 'signUp'): string | null => {
    const email = action === 'signIn' ? signInEmail : signUpEmail;
    const password = action === 'signIn' ? signInPassword : signUpPassword;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return 'Email is required.';
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!trimmedPassword) {
      return 'Password is required.';
    }

    // For sign up, enforce minimum password length
    if (action === 'signUp' && trimmedPassword.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    return null;
  };

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    const email = action === 'signIn' ? signInEmail : signUpEmail;
    const password = action === 'signIn' ? signInPassword : signUpPassword;
    
    console.log(`[LoginPage] Starting ${action} attempt`, {
      hasEmail: !!email.trim(),
      authAvailable: !!auth,
    });

    // Validate inputs first
    const validationError = validateInputs(action);
    if (validationError) {
      console.warn(`[LoginPage] Validation failed for ${action}:`, validationError);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationError,
      });
      return;
    }

    // Check if auth is available
    if (!auth) {
      console.error('[LoginPage] Firebase Auth is not available');
      toast({
        variant: 'destructive',
        title: 'Authentication Service Unavailable',
        description: 'Firebase authentication is not available. Please try again later or contact support.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (action === 'signUp') {
        console.log('[LoginPage] Calling createUserWithEmailAndPassword');
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        console.log('[LoginPage] Sign up successful');
        
        // Create basic profile in Firestore for email sign-ups
        if (firestore) {
          try {
            const userDocRef = doc(firestore, 'users', userCredential.user.uid);
            await setDoc(userDocRef, sanitizeFirestorePayload({
              displayName: trimmedEmail.split('@')[0], // Use email prefix as default display name
              email: trimmedEmail,
              photoURL: '',
              bio: '',
              coverImageUrl: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }));
            console.log('[LoginPage] Created user profile in Firestore');
          } catch (error) {
            console.error('[LoginPage] Error creating user profile:', error);
            // Don't fail the sign-up, just log the error
          }
        }
        
        toast({
          title: 'Account Created',
          description: "You've been successfully signed up! Redirecting...",
        });
      } else {
        console.log('[LoginPage] Calling signInWithEmailAndPassword');
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        console.log('[LoginPage] Sign in successful');
        toast({
          title: 'Signed In',
          description: "Welcome back! Redirecting...",
        });
      }
      router.push('/');
    } catch (error: any) {
      console.error(`[LoginPage] Error during ${action}:`, error);
      
      // Provide helpful error messages based on error codes
      let errorTitle = `Error during ${action}`;
      let errorDescription = error.message || 'An unexpected error occurred.';
      
      const errorCode = error.code || '';
      
      if (errorCode === 'auth/operation-not-allowed') {
        errorTitle = 'Email/Password Sign-In Not Enabled';
        errorDescription = 'Email/Password authentication is not enabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        errorTitle = 'Invalid Credentials';
        errorDescription = 'The email or password you entered is incorrect. Please check your credentials and try again.';
      } else if (errorCode === 'auth/email-already-in-use') {
        errorTitle = 'Email Already in Use';
        errorDescription = 'An account with this email already exists. Please sign in instead or use a different email.';
      } else if (errorCode === 'auth/weak-password') {
        errorTitle = 'Weak Password';
        errorDescription = 'The password is too weak. Please use a stronger password with at least 6 characters.';
      } else if (errorCode === 'auth/invalid-email') {
        errorTitle = 'Invalid Email';
        errorDescription = 'The email address is not valid. Please enter a valid email address.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorTitle = 'Too Many Attempts';
        errorDescription = 'Access temporarily disabled due to too many failed attempts. Please try again later or reset your password.';
      } else if (errorCode === 'auth/network-request-failed') {
        errorTitle = 'Network Error';
        errorDescription = 'Unable to connect to authentication service. Please check your internet connection and try again.';
      }
      
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[LoginPage] Starting Google sign-in attempt', {
      authAvailable: !!auth,
    });

    // Check if auth is available
    if (!auth) {
      console.error('[LoginPage] Firebase Auth is not available for Google sign-in');
      toast({
        variant: 'destructive',
        title: 'Authentication Service Unavailable',
        description: 'Firebase authentication is not available. Please try again later or contact support.',
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      // Ensure auth persistence is explicitly set to local so redirect state survives navigation/reloads.
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      // Note: Google Drive and Docs scopes are optional and only needed for the import feature.
      // They are NOT required for basic sign-in. If you encounter 403 errors during sign-in,
      // you may need to authorize these scopes in your Google Cloud Console OAuth consent screen.
      // For troubleshooting, you can comment out these lines to sign in without Drive/Docs access.
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/documents.readonly');
      console.log('[LoginPage] Calling signInWithRedirect for Google');
      await signInWithRedirect(auth, provider);
      // The user is redirected, so the code below this line won't execute until they return.
      // Firebase automatically handles the redirect result on page load.
    } catch (error: any) {
      console.error('[LoginPage] Error signing in with Google:', error);
      
      // Provide more helpful error messages for common issues
      let errorTitle = 'Google Sign-In Error';
      let errorDescription = error.message || 'An unexpected error occurred.';
      
      // Check for 403/authorization errors
      if (error.code === 'auth/unauthorized-domain' || 
          error.message?.includes('403') || 
          error.message?.includes('unauthorized')) {
        errorTitle = 'Domain Not Authorized';
        errorDescription = 'Your domain is not authorized for Google Sign-In. Please add your domain (e.g., localhost or your workspace domain) to the authorized domains list in Firebase Console under Authentication > Sign-in method > Authorized domains.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorTitle = 'Google Sign-In Not Enabled';
        errorDescription = 'Google sign-in is not enabled in your Firebase project. Please enable it in Firebase Console under Authentication > Sign-in method.';
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = 'Redirect Blocked';
        errorDescription = 'Your browser blocked the sign-in redirect. Please allow redirects for this site and try again.';
      }
      
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorDescription,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      {redirectResult.isProcessing ? (
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Processing Google Sign-In...</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center gap-2">
              <Logo />
              <h1 className="text-2xl font-bold font-headline">The Scribbler</h1>
            </div>
            <CardTitle className="font-headline text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in or create an account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="m@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <div className="relative">
                      <Input
                        id="password-signin"
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <CardFooter className="px-0 pt-6">
                  <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </TabsContent>
              <TabsContent value="signup">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="m@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        type={showPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <CardFooter className="px-0 pt-6">
                  <Button onClick={() => handleAuthAction('signUp')} className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? (
                  'Redirecting to Google...'
                ) : (
                  <>
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background p-4">
      <LoginCard />
    </main>
  );
}
