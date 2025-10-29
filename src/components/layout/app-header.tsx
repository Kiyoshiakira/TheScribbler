'use client';
import { useState } from 'react';
import {
  Book,
  ChevronDown,
  Download,
  Link as LinkIcon,
  LogOut,
  Share2,
  Upload,
  User as UserIcon,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '../ui/sidebar';
import { GoogleDocIcon } from '../ui/icons';
import { useAuth, useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { useScript } from '@/context/script-context';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { parseScriteFile } from '@/lib/scrite-parser';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { View } from '@/app/page';
import Link from 'next/link';
import { SettingsDialog } from '../settings-dialog';

interface AppHeaderProps {
  setView: (view: View) => void;
}


export default function AppHeader({ setView }: AppHeaderProps) {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const { script, setScriptTitle, isScriptLoading } = useScript();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);


  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link Copied",
        description: "The link to your script has been copied to your clipboard.",
      });
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast({
        variant: 'destructive',
        title: "Copy Failed",
        description: "Could not copy the link to your clipboard.",
      });
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;

      try {
        const parsedData = await parseScriteFile(arrayBuffer);
        
        const batch = writeBatch(firestore);

        // Create a new script document
        const newScriptRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
        const scriptTitle = parsedData.script.split('\n')[0] || 'Untitled Import';
        
        // 1. Set main script data
        batch.set(newScriptRef, {
            title: scriptTitle,
            content: parsedData.script,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
        });
        
        // 2. Add characters
        const charactersCollectionRef = collection(firestore, newScriptRef.path, 'characters');
        parsedData.characters.forEach(char => {
            const newCharRef = doc(charactersCollectionRef);
            batch.set(newCharRef, { ...char, scenes: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        });

        // 3. Add notes
        const notesCollectionRef = collection(firestore, newScriptRef.path, 'notes');
        parsedData.notes.forEach(note => {
            const newNoteRef = doc(notesCollectionRef);
            batch.set(newNoteRef, note);
        });

        // 4. Add scenes
        const scenesCollectionRef = collection(firestore, newScriptRef.path, 'scenes');
        parsedData.scenes.forEach(scene => {
            const newSceneRef = doc(scenesCollectionRef);
            batch.set(newSceneRef, scene);
        });
        
        await batch.commit().catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: `users/${user.uid}/scripts`,
              operation: 'write', 
              requestResourceData: {
                  script: "Batch write for Scrite import",
                  characterCount: parsedData.characters.length,
                  noteCount: parsedData.notes.length,
                  sceneCount: parsedData.scenes.length
              },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        toast({
          title: 'Import Successful',
          description: `"${scriptTitle}" has been added to My Scripts.`,
        });
        setView('profile');

      } catch (error) {
         console.error('--- DEBUG: Import Parsing Failed ---', error);
         toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
        });
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'There was an error reading the file.',
        });
    }
    reader.readAsArrayBuffer(file);

    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const UserMenu = () => {
    if (!user) {
      return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-bold truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <Link href="/profile" passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </a>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };


  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="flex items-center gap-2">
        <Book className="h-6 w-6 text-muted-foreground" />
        {isScriptLoading ? (
            <Skeleton className="h-7 w-64" />
        ) : (
            <Input
              key={script?.id} // Re-mount input when script changes
              defaultValue={script?.title}
              onBlur={(e) => setScriptTitle(e.target.value)}
              className="text-lg md:text-xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-headline"
            />
        )}
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileImport}
            accept=".scrite"
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Import</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={triggerFileSelect}>
                    <Book className="h-4 w-4 mr-2" />
                    Import from Scrite (.scrite)
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <GoogleDocIcon className="h-4 w-4 mr-2" />
                    Import from Google Docs
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Share2 className="h-4 w-4 md:mr-2" />
              <span className='hidden md:inline'>Share</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyLink}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="h-4 w-4 md:mr-2" />
              <span className='hidden md:inline'>Export</span>
              <ChevronDown className="h-4 w-4 ml-0 md:ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
                <GoogleDocIcon className="h-4 w-4 mr-2" />
                Export to Google Docs
            </DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem>Export as Fountain</DropdownMenuItem>
            <DropdownMenuItem>Export as Final Draft</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserMenu />
      </div>
    </header>
    <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </>
  );
}
