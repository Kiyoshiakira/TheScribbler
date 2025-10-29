'use client';

import {
  Book,
  ChevronDown,
  Download,
  Link as LinkIcon,
  LogOut,
  Share2,
  Upload,
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
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import type { Note } from '../views/notes-view';

interface AppHeaderProps {
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export default function AppHeader({ setNotes }: AppHeaderProps) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setScriptContent } = useScript();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      console.log('--- DEBUG: File read as ArrayBuffer ---');

      try {
        const parsedData = await parseScriteFile(arrayBuffer);
        console.log('--- DEBUG: Parsed Scrite JSON ---');
        console.log(JSON.stringify(parsedData, null, 2));


        // 1. Update script content
        setScriptContent(parsedData.script);

        // 2. Update notes
        setNotes(parsedData.notes);

        // 3. Update characters in Firestore
        if (firestore && user) {
          const charactersCollection = collection(firestore, 'users', user.uid, 'characters');
          const batch = writeBatch(firestore);

          // Clear existing characters
          const existingCharsSnapshot = await getDocs(charactersCollection);
          existingCharsSnapshot.forEach(doc => batch.delete(doc.ref));
          
          // Add new characters
          parsedData.characters.forEach(char => {
             const newCharRef = doc(collection(firestore, 'users', user.uid, 'characters'));
             batch.set(newCharRef, { ...char, userId: user.uid });
          });
          
          batch.commit().catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: charactersCollection.path,
              operation: 'write', // Representing a batch write
              requestResourceData: parsedData.characters,
            });
            errorEmitter.emit('permission-error', permissionError);
            console.error('--- DEBUG: Firestore Batch Commit Failed ---', permissionError);
            toast({
              variant: 'destructive',
              title: 'Import Failed',
              description: 'Could not save imported characters to the database due to permission errors.',
            });
          });
        }

        toast({
          title: 'Import Successful',
          description: `Successfully imported from ${file.name}.`,
        });
      } catch (error) {
         console.error('--- DEBUG: Import Parsing Failed ---', error);
         toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred during parsing.',
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

    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const UserMenu = () => {
    if (isUserLoading) {
      return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    if (!user) {
      return null;
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
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="flex items-center gap-2">
        <Book className="h-6 w-6 text-muted-foreground" />
        <Input
          defaultValue="Untitled Screenplay"
          className="text-lg md:text-xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-headline"
        />
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
            <DropdownMenuItem>
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
  );
}
