import React from "react";
import { User } from "lucide-react";
import { HoverBorderGradient } from "../ui/hover-border-gradient";

export interface AppShellMenuItem {
  label: string;
  actionId: string;
  shortcut?: string;
  icon?: React.ElementType;
  iconGlyph?: string;
  disabled?: boolean;
}

export interface AppShellMenuSection {
  label: string;
  items: readonly AppShellMenuItem[];
}

export interface AppHeaderProps {
  menuSections: readonly AppShellMenuSection[];
  activeMenu: string | null;
  onToggleMenu: (sectionLabel: string) => void;
  onAction: (actionId: string) => void;
  infoDotColor: string;
  brandGradient: string;
  onlineDotColor: string;
}

export function AppHeader({
  menuSections,
  activeMenu,
  onToggleMenu,
  onAction,
  infoDotColor,
  brandGradient,
  onlineDotColor,
}: AppHeaderProps): React.JSX.Element {
  const toTestId = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, "-");

  return (
    <header
      className="app-header relative z-50 flex h-20 flex-shrink-0 items-center justify-between bg-neutral-950/80 px-8 backdrop-blur-md"
      data-testid="app-header"
    >
      <div className="flex items-center gap-6">
        <HoverBorderGradient
          as="div"
          duration={1}
          containerClassName="rounded-lg cursor-pointer group"
          className="flex items-center gap-3 bg-neutral-900/80 px-4 py-2 leading-none"
        >
          <span
            className="h-2 w-2 rounded-full shadow-[0_0_6px_rgba(15,76,138,0.5)]"
            style={{ backgroundColor: infoDotColor }}
          />
          <span
            className="bg-clip-text text-2xl font-bold text-transparent transition-all duration-300 group-hover:opacity-90"
            style={{ backgroundImage: brandGradient }}
          >
            أفان تيتر
          </span>
        </HoverBorderGradient>

        <div
          className="relative z-50 flex items-center gap-2 rounded-full border border-white/5 bg-neutral-900/50 p-1.5 backdrop-blur-md"
          data-app-menu-root="true"
        >
          {menuSections.map((section) => (
            <div
              key={section.label}
              className="group relative"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                className={`flex h-full min-w-[72px] items-center justify-center rounded-full px-4 text-[13px] font-medium transition-all ${
                  activeMenu === section.label
                    ? "bg-neutral-900/80 text-white"
                    : "bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white group-hover:text-white"
                }`}
                onClick={() => onToggleMenu(section.label)}
                data-testid={`menu-section-${toTestId(section.label)}`}
              >
                {section.label}
              </button>

              {activeMenu === section.label && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#111] p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                  {section.items.map((item) => (
                    <button
                      type="button"
                      key={`${section.label}-${item.label}`}
                      disabled={item.disabled}
                      onClick={() => onAction(item.actionId)}
                      data-testid={`menu-action-${item.actionId}`}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-sm transition-all ${
                        item.disabled
                          ? "cursor-not-allowed text-neutral-600"
                          : "text-neutral-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.icon && (
                        <item.icon className="size-4 text-neutral-500" />
                      )}
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] text-neutral-500">
                          {item.shortcut}
                        </span>
                      )}
                      {item.iconGlyph && (
                        <span className="w-4 text-center text-[13px] text-neutral-400">
                          {item.iconGlyph}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <HoverBorderGradient
        as="div"
        duration={1}
        containerClassName="rounded-lg cursor-pointer group"
        className="flex items-center gap-4 bg-transparent p-0"
      >
        <HoverBorderGradient
          as="button"
          type="button"
          duration={1}
          containerClassName="rounded-full"
          className="flex items-center gap-2 bg-[var(--ring)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ring)]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ring)]" />
          Online
        </HoverBorderGradient>

        <HoverBorderGradient
          as="div"
          duration={1}
          containerClassName="rounded-full cursor-pointer"
          className="flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-neutral-800 to-neutral-700 p-0"
        >
          <User className="size-[18px] text-neutral-300" />
        </HoverBorderGradient>

        <HoverBorderGradient
          as="div"
          duration={1}
          containerClassName="rounded-lg cursor-pointer group"
          className="flex items-center gap-3 bg-neutral-900/80 px-4 py-2 leading-none"
        >
          <span
            className="bg-clip-text text-2xl font-bold text-transparent transition-all duration-300 group-hover:opacity-90"
            style={{ backgroundImage: brandGradient }}
          >
            النسخة
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: onlineDotColor }}
          />
        </HoverBorderGradient>
      </HoverBorderGradient>
    </header>
  );
}
