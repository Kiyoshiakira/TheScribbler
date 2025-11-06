'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface Script {
    id: string;
    title: string;
    lastModified: {
        toDate: () => Date;
    } | null;
}

interface UserProfile {
    photoURL?: string;
    coverImageUrl?: string;
    bio?: string;
}

export default function PublicUserProfile() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const { user: currentUser } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'users', userId) : null),
        [firestore, userId]
    );
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const scriptsCollectionRef = useMemoFirebase(
        () => (firestore ? collection(firestore, 'users', userId, 'scripts') : null),
        [firestore, userId]
    );

    const scriptsQuery = useMemoFirebase(
        () => (scriptsCollectionRef ? query(scriptsCollectionRef, orderBy('lastModified', 'desc')) : null),
        [scriptsCollectionRef]
    );

    const { data: scripts, isLoading: areScriptsLoading } = useCollection<Script>(scriptsQuery);

    const isOwnProfile = currentUser?.uid === userId;

    const handleViewScript = (scriptId: string) => {
        router.push(`/user/${userId}/script/${scriptId}`);
    };

    const handleGoBack = () => {
        router.push('/');
    };

    const handleGoToOwnProfile = () => {
        router.push('/');
    };

    if (isProfileLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to App
                    </Button>
                    {isOwnProfile && (
                        <Button onClick={handleGoToOwnProfile}>
                            Go to My Profile
                        </Button>
                    )}
                </div>

                <Card className="overflow-hidden">
                    <div className="h-32 sm:h-48 bg-muted relative">
                        {userProfile?.coverImageUrl && (
                            <Image
                                src={userProfile.coverImageUrl}
                                alt="Cover image"
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:-mt-20">
                        <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background flex-shrink-0 -mt-16 sm:mt-0">
                            <AvatarImage src={userProfile?.photoURL || undefined} />
                            <AvatarFallback className="text-4xl">U</AvatarFallback>
                        </Avatar>
                        <div className="w-full sm:flex-1 mt-2 sm:mt-0 sm:pb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold font-headline truncate">
                                User Profile
                            </h1>
                            <div className="text-muted-foreground mt-1">
                                {userProfile?.bio || "No bio yet."}
                            </div>
                        </div>
                    </div>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">Scripts</h2>
                    {areScriptsLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                        </div>
                    ) : scripts && scripts.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {scripts.map((script) => (
                                <Card key={script.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="font-headline flex items-start justify-between">
                                            <span className="truncate pr-4">{script.title}</span>
                                        </CardTitle>
                                        <CardDescription>
                                            Last modified: {script.lastModified ? new Date(script.lastModified.toDate()).toLocaleDateString() : 'Just now'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow" />
                                    <CardContent className="flex justify-between items-center">
                                        <Button onClick={() => handleViewScript(script.id)}>
                                            <Book className="mr-2 h-4 w-4" />
                                            View Script
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                            <Book className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-medium">No Scripts Found</h3>
                            <p className="mt-1 text-sm">
                                This user hasn't created any scripts yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
