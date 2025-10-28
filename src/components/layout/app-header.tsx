'use client';

import {
  Book,
  ChevronDown,
  Download,
  Link as LinkIcon,
  Share2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '../ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GoogleDocIcon } from '../ui/icons';

const userAvatars = PlaceHolderImages.filter(img => img.id.startsWith('user')).slice(0, 4);

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="flex items-center gap-2">
        <Book className="h-6 w-6 text-muted-foreground" />
        <Input
          defaultValue="Untitled Screenplay"
          className="text-xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-headline"
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex -space-x-2">
          {userAvatars.map((avatar, index) => (
            <Avatar key={index} className="border-2 border-background">
              <AvatarImage src={avatar.imageUrl} alt={avatar.description} />
              <AvatarFallback>{avatar.id.slice(-1)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button variant="outline">
          <GoogleDocIcon className="h-4 w-4 mr-2" />
          Import from Google Docs
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
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
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
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
      </div>
    </header>
  );
}
