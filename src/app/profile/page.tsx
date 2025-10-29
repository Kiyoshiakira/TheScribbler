'use client';
import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';

interface Script {
    id: string;
    title: string;
    lastModified: {
        toDate: () => Date;
    } | null;
}

function ProfilePageContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [profileOpen, setProfileOpen] = useState(false);

    const scriptsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, 'users', user.uid, 'scripts') : null),
        [firestore, user]
    );

    const { data: scripts, isLoading: areScriptsLoading } = useCollection<Script>(scriptsCollection);

    if (isUserLoading || !user) {
        return (
            <div className="flex justify-center items-center h-full">
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }
    
    return (
        <>
            <div className="relative h-48 w-full bg-muted rounded-lg">
                {/* Placeholder for cover image */}
                <div className="absolute bottom-4 left-4 flex items-end gap-4">
                    <Avatar className="w-24 h-24 border-4 border-background">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold text-white shadow-lg">{user.displayName}</h1>
                        <p className="text-sm text-gray-200 shadow-md">{user.email}</p>
                    </div>
                </div>
                 <Button className="absolute top-4 right-4" variant="secondary" onClick={() => setProfileOpen(true)}>Edit Profile</Button>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">My Scripts</h2>
                {areScriptsLoading ? (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {scripts && scripts.map(script => (
                             <Card key={script.id}>
                                <CardHeader>
                                    <CardTitle>{script.title}</CardTitle>
                                    <CardDescription>
                                        Last modified: {script.lastModified ? new Date(script.lastModified.toDate()).toLocaleDateString() : 'Just now'}
                                    </CardDescription>
                                </CardHeader>
                             </Card>
                        ))}
                    </div>
                )}
                 {scripts && scripts.length === 0 && <p>You haven't created any scripts yet.</p>}
            </div>
            
            <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} profile={null} />
        </>
    );
}


export default function ProfilePage() {
    return (
        <AppLayout>
            <ProfilePageContent />
        </AppLayout>
    )
}
