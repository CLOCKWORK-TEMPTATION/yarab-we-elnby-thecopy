"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * View Transition Wrapper Component
 * Based on UI_DESIGN_SUGGESTIONS.md - View Transitions API
 * 
 * Provides smooth page transitions using the native View Transitions API
 * with fallback for browsers that don't support it.
 * 
 * @example
 * ```tsx
 * <ViewTransition>
 *   <YourContent />
 * </ViewTransition>
 * ```
 */

interface ViewTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function ViewTransition({ children, className }: ViewTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    // Check if View Transitions API is supported
    const supportsViewTransitions = 'startViewTransition' in document;

    if (supportsViewTransitions && children !== displayChildren) {
      setIsTransitioning(true);

      const doc = document as any;
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          setDisplayChildren(children);
        }).finished.finally(() => {
          setIsTransitioning(false);
        });
      }
    } else {
      setDisplayChildren(children);
    }
  }, [children, displayChildren]);

  return (
    <div 
      className={className}
      data-transitioning={isTransitioning}
    >
      {displayChildren}
    </div>
  );
}

/**
 * Hook to trigger view transitions programmatically
 * 
 * @example
 * ```tsx
 * const transition = useViewTransition();
 * 
 * const handleClick = () => {
 *   transition(() => {
 *     // Update state or navigate
 *     setContent(newContent);
 *   });
 * };
 * ```
 */
export function useViewTransition() {
  return React.useCallback((callback: () => void) => {
    const doc = document as any;
    if ('startViewTransition' in document && doc.startViewTransition) {
      doc.startViewTransition(callback);
    } else {
      callback();
    }
  }, []);
}

/**
 * Link component with view transitions
 * Wraps Next.js Link with automatic view transitions
 */
interface ViewTransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ViewTransitionLink({ 
  href, 
  children, 
  className,
  onClick 
}: ViewTransitionLinkProps) {
  const transition = useViewTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    transition(() => {
      onClick?.();
      window.location.href = href;
    });
  };

  return (
    <a 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}