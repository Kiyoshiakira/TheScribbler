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

/**
 * Logo component that displays the appropriate transparent PNG logo based on the current tool.
 * Uses transparent background RGBA PNG images from /public/images/
 * - ScriptScribbler: scriptscribbler.png
 * - StoryScribbler: storyscribbler.png
 * - Default: logo.png
 */
export const Logo = ({ variant = 'default' }: { variant?: 'default' | ToolType }) => {
  const logoSrc = 
    variant === 'ScriptScribbler' ? '/images/scriptscribbler.png' :
    variant === 'StoryScribbler' ? '/images/storyscribbler.png' :
    '/images/logo.png';
  
  return (
    <Image 
      src={logoSrc} 
      alt="The Scribbler Logo" 
      width={120} 
      height={120} 
      className="object-contain w-full h-auto max-w-[120px]"
      priority
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
          <button onClick={() => handleViewChange('dashboard')} aria-label="Go to dashboard">
            <Logo variant={currentTool} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors" aria-label="Switch between ScriptScribbler and StoryScribbler">
              <ChevronDown className="h-4 w-4 opacity-50" />
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
