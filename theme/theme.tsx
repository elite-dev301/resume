"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ReactNode, createContext, useState, useContext } from "react";

// Create Light and Dark Themes
const lightTheme = createTheme({
  palette: {
    mode: "light"
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  },
});

// Create Theme Context
const ThemeContext = createContext({
  toggleTheme: () => {},
  isDarkMode: false,
});

// Theme Provider Component
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, isDarkMode }}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Custom Hook to use Theme Context
export function useThemeContext() {
  return useContext(ThemeContext);
}
