'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  NotebookPen,
  LayoutDashboard,
  ChevronDown,
  ListTree,
  FileText,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { View } from './AppLayout';
import { useCurrentScript } from '@/context/current-script-context';
import { useTool, type ToolType } from '@/context/tool-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

export const Logo = ({ variant = 'default' }: { variant?: 'default' | ToolType }) => {
  const logoSrc = 
    variant === 'ScriptScribbler' ? '/images/scriptscribbler.png' :
    variant === 'StoryScribbler' ? '/images/storyscribbler.png' :
    '/images/logo.png';
  
  return (
    <Image 
      src={logoSrc} 
      alt="The Scribbler Logo" 
      width={32} 
      height={32} 
      className="object-contain"
    />
  );
};

interface AppSidebarProps {
  activeView: View;
  setView: (view: View | 'profile-edit') => void;
}

export default function AppSidebar({ activeView, setView }: AppSidebarProps) {
  const { currentScriptId } = useCurrentScript();
  const { isMobile, setOpenMobile } = useSidebar();
  const { currentTool, setCurrentTool } = useTool();
  const noScriptLoaded = !currentScriptId;

  const handleViewChange = (view: View | 'profile-edit') => {
    setView(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const scriptMenuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'editor', label: 'Editor', icon: BookText },
    { view: 'logline', label: 'Logline', icon: NotebookPen },
    { view: 'scenes', label: 'Scenes', icon: Clapperboard },
    { view: 'characters', label: 'Characters', icon: Users },
    { view: 'notes', label: 'Notes', icon: StickyNote },
  ] as const;

  const storyMenuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'outline', label: 'Outline', icon: ListTree },
    { view: 'chapters', label: 'Chapters', icon: FileText },
    { view: 'characters', label: 'Characters', icon: Users },
    { view: 'world', label: 'World', icon: MapPin },
    { view: 'timeline', label: 'Timeline', icon: Clock },
    { view: 'story-notes', label: 'Notes', icon: StickyNote },
  ] as const;

  const menuItems = currentTool === 'StoryScribbler' ? storyMenuItems : scriptMenuItems;

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <div className="flex flex-col items-center justify-center gap-1 p-2 w-full">
          <button onClick={() => handleViewChange('dashboard')}>
            <Logo variant={currentTool} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors">
              <div className="flex flex-col items-center leading-tight">
                <span className="text-sm font-bold font-headline">{currentTool === 'ScriptScribbler' ? 'Script' : 'Story'}</span>
                <span className="text-sm font-bold font-headline">Scribbler</span>
              </div>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => setCurrentTool('ScriptScribbler')}>
                <span className={cn('font-medium', currentTool === 'ScriptScribbler' && 'text-primary')}>
                  ScriptScribbler
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentTool('StoryScribbler')}>
                <span className={cn('font-medium', currentTool === 'StoryScribbler' && 'text-primary')}>
                  StoryScribbler
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 overflow-y-auto p-2">
          {menuItems.map(item => (
            <SidebarMenuItem key={item.view}>
              <SidebarMenuButton
                onClick={() => handleViewChange(item.view)}
                isActive={activeView === item.view}
                tooltip={item.label}
                aria-disabled={noScriptLoaded && item.view !== 'dashboard'}
                className={cn(noScriptLoaded && item.view !== 'dashboard' && 'opacity-50 cursor-not-allowed')}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
