import { useState, useEffect, useCallback, RefObject } from 'react';

/**
 * Custom hook for managing fullscreen state
 * Supports both the Fullscreen API and a fallback CSS-based fullscreen mode
 * 
 * @param elementRef - Reference to the element to make fullscreen
 * @returns Object with isFullscreen state and toggle function
 */
export function useFullscreen(elementRef: RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if Fullscreen API is available
  const isFullscreenAPIAvailable = typeof document !== 'undefined' && 
    (document.fullscreenEnabled || 
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (document as any).webkitFullscreenEnabled || 
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (document as any).mozFullScreenEnabled ||
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (document as any).msFullscreenEnabled);

  const enterFullscreen = useCallback(async () => {
    if (!elementRef.current) return;

    try {
      // Try native Fullscreen API first
      if (isFullscreenAPIAvailable) {
        if (elementRef.current.requestFullscreen) {
          await elementRef.current.requestFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((elementRef.current as any).webkitRequestFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (elementRef.current as any).webkitRequestFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((elementRef.current as any).mozRequestFullScreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (elementRef.current as any).mozRequestFullScreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((elementRef.current as any).msRequestFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (elementRef.current as any).msRequestFullscreen();
        }
      } else {
        // Fallback: Use CSS-based fullscreen
        elementRef.current.classList.add('fullscreen-fallback');
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      // Fallback to CSS-based fullscreen on error
      elementRef.current.classList.add('fullscreen-fallback');
      setIsFullscreen(true);
    }
  }, [elementRef, isFullscreenAPIAvailable]);

  const exitFullscreen = useCallback(async () => {
    try {
      // Try native Fullscreen API first
      if (isFullscreenAPIAvailable && document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).webkitExitFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).webkitExitFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).mozCancelFullScreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).mozCancelFullScreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).msExitFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).msExitFullscreen();
        }
      } else {
        // Fallback: Remove CSS-based fullscreen
        if (elementRef.current) {
          elementRef.current.classList.remove('fullscreen-fallback');
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
      if (elementRef.current) {
        elementRef.current.classList.remove('fullscreen-fallback');
      }
      setIsFullscreen(false);
    }
  }, [elementRef, isFullscreenAPIAvailable]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitFullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozFullScreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msFullscreenElement ||
        elementRef.current?.classList.contains('fullscreen-fallback')
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [elementRef]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
