import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColorMode = "dark" | "light";

export type AppChromeContextValue = {
  colorMode: ColorMode;
  liveMode: boolean;
  toggleColorMode: () => void;
  toggleLiveMode: () => void;
  openCommandPalette: () => void;
};

export const AppChromeContext = React.createContext<AppChromeContextValue | null>(null);

export function useAppChrome() {
  const context = React.useContext(AppChromeContext);
  if (!context) throw new Error("useAppChrome debe usarse dentro de AppChromeProvider.");
  return context;
}

export function ColorModeIcon({ className }: { className?: string }) {
  const { colorMode } = useAppChrome();
  return colorMode === "dark" ? (
    <Sun className={cn("h-4 w-4", className)} />
  ) : (
    <Moon className={cn("h-4 w-4", className)} />
  );
}
