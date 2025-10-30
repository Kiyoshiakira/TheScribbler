'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  NotebookPen,
  LayoutDashboard,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScript } from '@/context/script-context';
import { Skeleton } from '../ui/skeleton';
import type { View } from './AppLayout';
import { useCurrentScript } from '@/context/current-script-context';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <path d="M12 4v16" />
  </svg>
);

const StatDisplay = ({ icon, value, label, isLoading }: { icon: React.ReactNode, value: string | number, label: string, isLoading: boolean }) => (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-sidebar-foreground/80">
        {icon}
        <span>{label}</span>
      </div>
      {isLoading ? <Skeleton className="h-4 w-8" /> : <span className="font-semibold">{value}</span>}
    </div>
);

const ScriptStatsPanel = () => {
    const { script, characters, isScriptLoading } = useScript();

    const wordCount = script?.content?.trim().split(/\s+/).filter(Boolean).length || 0;
    const pageCount = Math.round(wordCount / 160); // Simple estimation
    const estimatedMinutes = Math.round((wordCount / 160) * 10) / 10;
    const characterCount = characters?.length || 0;

    const stats = {
      pageCount,
      characterCount,
      estimatedMinutes,
    };
    
    return (
        <div className="space-y-2 rounded-lg bg-sidebar-accent p-3">
             <StatDisplay icon={<FileText />} label="Pages" value={stats.pageCount} isLoading={isScriptLoading} />
             <StatDisplay icon={<Users />} label="Characters" value={stats.characterCount} isLoading={isScriptLoading} />
             <StatDisplay icon={<Clock />} label="Time" value={`${stats.estimatedMinutes} min`} isLoading={isScriptLoading} />
        </div>
    )
}

interface AppSidebarProps {
  activeView: View;
  setView: (view: View | 'profile-edit') => void;
}

export default function AppSidebar({ activeView, setView }: AppSidebarProps) {
  const { currentScriptId } = useCurrentScript();
  const noScriptLoaded = !currentScriptId;
  const { user, isUserLoading } = useUser();

  const scriptMenuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'editor', label: 'Editor', icon: BookText },
    { view: 'logline', label: 'Logline', icon: NotebookPen },
    { view: 'scenes', label: 'Scenes', icon: Clapperboard },
    { view: 'characters', label: 'Characters', icon: Users },
    { view: 'notes', label: 'Notes', icon: StickyNote },
  ] as const;

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <button className="flex items-center gap-2 p-2" onClick={() => setView('profile')}>
            <Logo />
            <h1 className="text-xl font-bold font-headline">ScriptScribbler</h1>
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 overflow-y-auto p-2">
            {scriptMenuItems.map(item => (
                <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                        onClick={() => setView(item.view)}
                        isActive={activeView === item.view}
                        tooltip={item.label}
                        // The aria-disabled and className logic is now handled by the AppLayout
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
          {currentScriptId && !noScriptLoaded && <ScriptStatsPanel />}
          <div className="flex items-center gap-2 p-2 mt-2 border-t border-sidebar-border cursor-pointer hover:bg-sidebar-accent rounded-md" onClick={() => setView('profile')}>
            {isUserLoading ? (
              <>
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </>
            ) : user ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{user.displayName?.charAt(0) || <User />}</AvatarFallback>
                </Avatar>
                <span className="font-semibold truncate">{user.displayName}</span>
              </>
            ) : null}
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}
