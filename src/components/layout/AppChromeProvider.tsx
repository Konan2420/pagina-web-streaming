import * as React from "react";
import { Command, Moon, Search, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ColorMode = "dark" | "light";

type AppChromeContextValue = {
  colorMode: ColorMode;
  liveMode: boolean;
  toggleColorMode: () => void;
  toggleLiveMode: () => void;
  openCommandPalette: () => void;
};

const AppChromeContext = React.createContext<AppChromeContextValue | null>(null);

const commands = [
  { label: "Ir al catálogo", description: "Productos y servicios disponibles", href: "/" },
  { label: "Redes Sociales", description: "Generador y órdenes de servicios", href: "/redes-sociales" },
  { label: "Panel administrativo", description: "Gestión de la plataforma", href: "/admin" },
  { label: "Panel de proveedor", description: "Productos e inventario propio", href: "/proveedor" },
  { label: "Panel de distribuidor", description: "Espacio comercial", href: "/distribuidor" },
] as const;

export function AppChromeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = React.useState<ColorMode>("dark");
  const [liveMode, setLiveMode] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("cmd-color-mode");
    const savedLiveMode = window.localStorage.getItem("cmd-live-mode");
    if (savedTheme === "light" || savedTheme === "dark") setColorMode(savedTheme);
    if (savedLiveMode === "true") setLiveMode(true);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.cmdTheme = colorMode;
    window.localStorage.setItem("cmd-color-mode", colorMode);
  }, [colorMode]);

  React.useEffect(() => {
    window.localStorage.setItem("cmd-live-mode", String(liveMode));
  }, [liveMode]);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  React.useEffect(() => {
    if (!paletteOpen) return;
    setQuery("");
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [paletteOpen]);

  const value = React.useMemo<AppChromeContextValue>(
    () => ({
      colorMode,
      liveMode,
      toggleColorMode: () => setColorMode((current) => (current === "dark" ? "light" : "dark")),
      toggleLiveMode: () => setLiveMode((current) => !current),
      openCommandPalette: () => setPaletteOpen(true),
    }),
    [colorMode, liveMode],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visibleCommands = commands.filter((command) =>
    `${command.label} ${command.description}`.toLocaleLowerCase("es").includes(normalizedQuery),
  );

  const navigateTo = (href: string) => {
    setPaletteOpen(false);
    window.location.assign(href);
  };

  return (
    <AppChromeContext.Provider value={value}>
      {children}
      <Toaster theme={colorMode} position="top-center" richColors />
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="max-w-lg border-border bg-card p-0 text-foreground">
          <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
            <DialogTitle className="flex items-center gap-2 text-base"><Command className="h-4 w-4 text-red-accent" /> Buscador global</DialogTitle>
            <DialogDescription>Encuentra una sección de CMD Streaming.</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una sección…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
            </label>
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {visibleCommands.map((command) => (
                <button key={command.href} type="button" onClick={() => navigateTo(command.href)} className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-red-accent/10 text-red-accent"><Command className="h-3.5 w-3.5" /></span>
                  <span><span className="block text-sm font-semibold">{command.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{command.description}</span></span>
                </button>
              ))}
              {visibleCommands.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">No se encontraron secciones.</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppChromeContext.Provider>
  );
}

export function useAppChrome() {
  const context = React.useContext(AppChromeContext);
  if (!context) throw new Error("useAppChrome debe usarse dentro de AppChromeProvider.");
  return context;
}

export function ColorModeIcon({ className }: { className?: string }) {
  const { colorMode } = useAppChrome();
  return colorMode === "dark" ? <Sun className={cn("h-4 w-4", className)} /> : <Moon className={cn("h-4 w-4", className)} />;
}
