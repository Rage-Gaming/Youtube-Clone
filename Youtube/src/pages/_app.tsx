import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/AuthContext";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, createContext, useContext } from "react";

// --- DEMO CONFIG ---
const DEMO_MODE = false;
const DEMO_HOUR = 12; // ✅ FIXED (must be between 10–12)
const DEMO_STATE = "Kerala";
// --------------------

const SOUTH_INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Tamilnadu",
];

export const SmartEnvContext = createContext({
  userState: "Detecting...",
  isSouthIndia: false,
  authMethod: "mobile",
  currentHour: 0,
});

export const useSmartEnv = () => useContext(SmartEnvContext);

function SmartEnvironmentManager({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [envData, setEnvData] = useState({
    userState: "Detecting...",
    isSouthIndia: false,
    authMethod: "mobile",
    currentHour: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeEnvironment = async () => {
      try {
        let stateName = "Unknown";
        let hour = new Date().getHours();

        if (DEMO_MODE) {
          stateName = DEMO_STATE;
          hour = DEMO_HOUR;
          console.log("🟡 DEMO MODE ACTIVE");
        } else {
          const response = await fetch("https://ipapi.co/json/");
          const data = await response.json();
          stateName = data.region || "Unknown";
        }

        const isSouth = SOUTH_INDIAN_STATES.includes(stateName);
        const isMorning = hour >= 10 && hour < 12;

        const authMethod = isSouth ? "email" : "mobile";

        const theme = isSouth && isMorning ? "light" : "dark";

        console.log({ stateName, hour, isSouth, isMorning, theme });

        setTheme(theme);

        setEnvData({
          userState: stateName,
          isSouthIndia: isSouth,
          authMethod,
          currentHour: hour,
        });
      } catch (error) {
        console.error("Location fetch failed", error);
        setTheme("dark");
      }
    };

    initializeEnvironment();
  }, [mounted, setTheme]);

  if (!mounted) return null;

  return (
    <SmartEnvContext.Provider value={envData}>
      {children}

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded text-xs z-50">
        <p>State: {envData.userState}</p>
        <p>South: {envData.isSouthIndia ? "Yes" : "No"}</p>
        <p>Hour: {envData.currentHour}</p>
        <p>Auth: {envData.authMethod}</p>
        <p>
          Theme:{" "}
          {envData.isSouthIndia &&
          envData.currentHour >= 10 &&
          envData.currentHour < 12
            ? "LIGHT"
            : "DARK"}
        </p>
      </div>
    </SmartEnvContext.Provider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <UserProvider>
        <SmartEnvironmentManager>
          <div className="min-h-screen bg-background text-foreground transition-all duration-300">
            <Header />
            <Toaster />
            <div className="flex">
              <Sidebar />
              <Component {...pageProps} />
            </div>
          </div>
        </SmartEnvironmentManager>
      </UserProvider>
    </ThemeProvider>
  );
}