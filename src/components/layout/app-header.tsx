'use client';

import {
  Book,
  ChevronDown,
  Download,
  Link as LinkIcon,
  LogOut,
  Share2,
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
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';

export default function AppHeader() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleSignOut = async () => {
    await signOut(auth);
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
        <Button variant="outline" className="hidden sm:inline-flex">
          <GoogleDocIcon className="h-4 w-4 mr-2" />
          Import from Google Docs
        </Button>
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
