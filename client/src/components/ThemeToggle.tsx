import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext =
  createContext<ThemeProviderState | undefined>(
    undefined,
  );

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);

    if (
      stored === "light" ||
      stored === "dark" ||
      stored === "system"
    ) {
      return stored;
    }

    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      root.classList.add(
        systemDark ? "dark" : "light",
      );
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeProviderContext.Provider
      value={{ theme, setTheme }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}



export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const root = document.documentElement;
    const newIsDark = !root.classList.contains("dark");

    root.classList.remove("light", "dark");
    root.classList.add(newIsDark ? "dark" : "light");

    localStorage.setItem(
      "agrolynk-theme",
      newIsDark ? "dark" : "light",
    );

    setIsDark(newIsDark);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}

      <span className="sr-only">
        Toggle theme
      </span>
    </Button>
  );
}