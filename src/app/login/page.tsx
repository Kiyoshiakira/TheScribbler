
'use client';

import * as React from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  GoogleAuthProvider,
} from 'firebase/auth';
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
import { useFirebase } from '@/firebase';
import { Logo } from '@/components/layout/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google as a generic browser icon

function LoginCard() {
  // Use useFirebase instead of useAuth to get nullable auth
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Log auth availability for debugging
  React.useEffect(() => {
    console.log('[LoginPage] Auth availability:', {
      authAvailable: !!auth,
      authType: auth ? typeof auth : 'undefined',
    });
  }, [auth]);

  const validateInputs = (action: 'signIn' | 'signUp'): string | null => {
    // Trim inputs
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
        await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        console.log('[LoginPage] Sign up successful');
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
      toast({
        variant: 'destructive',
        title: `Error during ${action}`,
        description: error.message || 'An unexpected error occurred.',
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
      const provider = new GoogleAuthProvider();
      // Add scopes to request access to Google Drive and Docs
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/documents.readonly');
      console.log('[LoginPage] Calling signInWithRedirect for Google');
      await signInWithRedirect(auth, provider);
      // The user is redirected, so the code below this line won't execute until they return.
      // Firebase automatically handles the redirect result on page load.
    } catch (error: any) {
      console.error('[LoginPage] Error signing in with Google:', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Error',
        description: error.message || 'An unexpected error occurred.',
      });
      setIsGoogleLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex items-center gap-2">
          <Logo />
          <h1 className="text-2xl font-bold font-headline">ScriptScribbler</h1>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin">Password</Label>
                <Input
                  id="password-signin"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
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
