// Youtube/src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/AuthContext";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import axios from "axios";

// 1. Create a component to handle the smart logic inside the provider
function ThemeLogicManager({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const applySmartTheme = async () => {
      try {
        const { data } = await axios.get('http://ip-api.com/json/');
        const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        const isSouthIndia = southStates.includes(data.regionName);
        
        const currentHour = new Date().getHours();
        const isMorning = currentHour >= 10 && currentHour < 12;

        if (isSouthIndia && isMorning) {
          setTheme('light');
        } else {
          setTheme('dark');
        }
      } catch (error) {
        setTheme('dark'); // Fallback
      }
    };
    applySmartTheme();
  }, [setTheme]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        {/* 2. Wrap the app with our new Logic Manager */}
        <ThemeLogicManager>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <title>You-Tube Clone</title>
            <Header />
            <Toaster />
            <div className="flex">
              <Sidebar />
              <Component {...pageProps} />
            </div>
          </div>
        </ThemeLogicManager>
      </UserProvider>
    </ThemeProvider>
  );
}