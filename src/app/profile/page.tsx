'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar, { Logo } from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import MyScriptsView from '@/components/views/my-scripts-view';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { View } from '@/app/page';
import { useCurrentScript } from '@/context/current-script-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { EditProfileDialog } from '@/components/edit-profile-dialog';

interface UserProfile {
    bio?: string;
    displayName?: string;
    email?: string;
    coverImageUrl?: string;
}

function FriendsList() {
  const friends = PlaceHolderImages.filter(img => img.id.startsWith('user')).slice(0, 4);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {friends.map(friend => (
        <Card key={friend.id} className="text-center">
            <CardContent className="p-6 flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-background outline-primary outline">
                    <AvatarImage src={friend.imageUrl} alt={friend.description} />
                    <AvatarFallback>{friend.description.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">User {friend.id.slice(-1)}</h3>
                    <p className="text-sm text-muted-foreground">Joined 2 months ago</p>
                </div>
                <Button variant="secondary" className="w-full">View Profile</Button>
            </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProfileHeader({ user, profile, onEdit }: { user: any, profile: UserProfile | null, onEdit: () => void }) {
    const coverImage = profile?.coverImageUrl || "https://picsum.photos/seed/99/1200/200";
    return (
        <div className="w-full">
            <div className="h-48 bg-muted/50 relative">
                 <Image src={coverImage} alt="Cover" fill className="object-cover" />
            </div>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="-mt-20 sm:-mt-24 flex items-end justify-between">
                    <div className='flex items-end gap-4'>
                        <div className='relative group'>
                            <Avatar onClick={onEdit} className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background outline-primary outline cursor-pointer">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="py-4">
                            <h1 className="text-2xl sm:text-3xl font-bold font-headline truncate">{user.displayName}</h1>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="outline" onClick={onEdit}>Edit Profile</Button>
                         <Button><UserPlus className="mr-2" /> Add Friend</Button>
                    </div>
                </div>
                 <p className="mt-4 max-w-2xl text-muted-foreground">
                    {profile?.bio || "Fledgling screenwriter and director with a passion for sci-fi comedies and character-driven stories. Turning coffee into scripts since 2021."}
                </p>
            </div>
        </div>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);


  if (isUserLoading || !user || isProfileLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Logo />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <>
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar
          activeView={'profile'}
          setActiveView={(view) => router.push('/')} // Clicking any view on profile goes to main app page
          activeScriptElement={null}
          wordCount={0}
          estimatedMinutes={0}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader setView={(view) => router.push('/')} />
          <main className="flex-1 overflow-y-auto">
            <ProfileHeader user={user} profile={userProfile} onEdit={() => setIsEditDialogOpen(true)} />
            
             {/* Tabs */}
            <div className="mt-6 px-4 sm:px-6 lg:px-8">
                <Tabs defaultValue="scripts" className="w-full">
                    <TabsList>
                        <TabsTrigger value="scripts">Scripts</TabsTrigger>
                        <TabsTrigger value="friends">Friends</TabsTrigger>
                    </TabsList>
                    <TabsContent value="scripts" className="py-6">
                        <MyScriptsView />
                    </TabsContent>
                    <TabsContent value="friends" className="py-6">
                        <FriendsList />
                    </TabsContent>
                </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
    <EditProfileDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        profile={userProfile}
    />
    </>
  );
}
