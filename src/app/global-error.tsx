'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError, useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Caught by GlobalError boundary:", error);
  }, [error]);

  const handleReportError = async () => {
    if (error instanceof FirestorePermissionError && firestore && user) {
        try {
            const errorReportsCollection = collection(firestore, 'error-reports');
            await addDoc(errorReportsCollection, {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    request: error.request, // The structured permission error data
                },
                userId: user.uid,
                url: window.location.href,
                reportedAt: serverTimestamp(),
            });
            toast({
                title: "Error Report Sent",
                description: "Thank you for helping us improve the application.",
            });
        } catch (reportError) {
             console.error("Failed to submit error report:", reportError);
             toast({
                variant: "destructive",
                title: "Could Not Send Report",
                description: "There was an issue submitting your error report.",
            });
        }
    } else {
        toast({
            title: "Cannot Report This Error",
            description: "This type of error cannot be automatically reported.",
        });
    }
  };

  const isPermissionError = error instanceof FirestorePermissionError;

  return (
    <html>
      <body>
        <main className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <Card className="max-w-xl text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Something Went Wrong</CardTitle>
                    <CardDescription>
                        An unexpected error occurred. You can try to reload the page or report the issue to our team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-md text-left max-h-60 overflow-auto">
                            <code className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {error.message}
                            </code>
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button onClick={() => reset()}>Try Again</Button>
                            <Button variant="outline" onClick={handleReportError} disabled={!isPermissionError}>
                                Report Error
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
      </body>
    </html>
  );
}
