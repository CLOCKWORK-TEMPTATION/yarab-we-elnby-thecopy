import React from "react";
import type { LucideIcon } from "lucide-react";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import { EDITOR_SHELL_DOCK_TOP_PX } from "../../constants/shell-layout";

export interface AppDockButtonItem {
  actionId: string;
  icon: LucideIcon;
  title: string;
}

export interface AppDockProps {
  buttons: readonly AppDockButtonItem[];
  onAction: (actionId: string) => void;
  isMobile: boolean;
}

function DockIconButton({
  icon: Icon,
  title,
  onClick,
  isMobile,
}: {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  isMobile: boolean;
}): React.JSX.Element {
  return (
    <div
      className={`relative z-10 flex items-center justify-center ${isMobile ? "h-9 w-9" : "h-10 w-10"}`}
    >
      <HoverBorderGradient
        as="button"
        type="button"
        suppressHydrationWarning
        onClick={onClick}
        title={title}
        containerClassName="h-full w-full rounded-full"
        className="flex h-full w-full items-center justify-center rounded-[inherit] bg-neutral-900/90 p-0 text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-white active:scale-95"
        duration={1}
      >
        <Icon
          className={isMobile ? "size-4" : "size-[18px]"}
          strokeWidth={1.75}
        />
      </HoverBorderGradient>
    </div>
  );
}

export function AppDock({
  buttons,
  onAction,
  isMobile: _isMobile,
}: AppDockProps): React.JSX.Element {
  const visibleButtons = buttons;

  return (
    <div
      className="app-dock pointer-events-none fixed left-1/2 z-40 flex -translate-x-1/2 justify-center"
      style={{ top: `${EDITOR_SHELL_DOCK_TOP_PX}px` }}
      data-testid="app-dock"
    >
      <div className="pointer-events-auto">
        <HoverBorderGradient
          as="div"
          duration={1}
          data-testid="app-dock-shell"
          containerClassName="mx-auto rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          className="flex h-16 items-center rounded-[inherit] bg-neutral-900/80 px-4 backdrop-blur-2xl"
        >
          {visibleButtons.map((button, index) => {
            const showSeparator =
              index === 1 || index === 3 || index === 7 || index === 13;
            return (
              <React.Fragment key={`${button.title}-${index}`}>
                <DockIconButton
                  icon={button.icon}
                  title={button.title}
                  isMobile={false}
                  onClick={() => onAction(button.actionId)}
                />
                {showSeparator && (
                  <div className="mx-2 h-5 w-px self-center bg-gradient-to-b from-transparent via-neutral-600/50 to-transparent" />
                )}
              </React.Fragment>
            );
          })}
        </HoverBorderGradient>
      </div>
    </div>
  );
}
