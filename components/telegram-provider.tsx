"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import type { TelegramUser } from "@/lib/telegram-auth";

type WebApp = {
  initData: string;
  colorScheme: string;
  ready: () => void;
  expand: () => void;
  onEvent: (event: string, callback: () => void) => void;
  offEvent: (event: string, callback: () => void) => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
};
declare global {
  interface Window {
    Telegram?: { WebApp: WebApp };
  }
}
type Auth = {
  user: TelegramUser | null;
  admin: boolean;
  loading: boolean;
  error: string;
  configured: boolean;
  inTelegram: boolean;
  retry: () => void;
};
const Context = createContext<Auth>({
  user: null,
  admin: false,
  loading: true,
  error: "",
  configured: false,
  inTelegram: false,
  retry: () => {},
});
export const useTelegram = () => useContext(Context);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<Omit<Auth, "retry">>({
    user: null,
    admin: false,
    loading: true,
    error: "",
    configured: false,
    inTelegram: false,
  });
  const [sdkReady, setSdkReady] = useState(false);
  const authRequest = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const authenticate = useCallback(async () => {
    const requestId = ++authRequest.current;
    const app = window.Telegram?.WebApp;
    setAuth((a) => ({
      ...a,
      loading: true,
      error: "",
      inTelegram: Boolean(app?.initData),
    }));
    try {
      const response = await fetch(
        "/api/auth",
        app?.initData
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ initData: app.initData }),
            }
          : { cache: "no-store" },
      );
      const result = await response.json();
      if (requestId !== authRequest.current) return;
      if (!response.ok) throw new Error(result.error);
      setAuth({
        ...result,
        loading: false,
        error: "",
        inTelegram: Boolean(app?.initData),
      });
    } catch (error) {
      if (requestId === authRequest.current)
        setAuth((a) => ({
          ...a,
          loading: false,
          error: error instanceof Error ? error.message : "Не удалось войти",
        }));
    }
  }, []);
  useEffect(() => {
    void authenticate();
  }, [authenticate, sdkReady]);
  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (!app?.initData) return;
    app.ready();
    app.expand();
    const theme = () => {
      document.documentElement.dataset.theme = app.colorScheme;
    };
    theme();
    app.onEvent("themeChanged", theme);
    return () => app.offEvent("themeChanged", theme);
  }, [sdkReady]);
  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (!app?.initData) return;
    const back = () => {
      if (window.history.length > 1) router.back();
      else router.push("/");
    };
    if (pathname === "/") app.BackButton.hide();
    else app.BackButton.show();
    app.BackButton.onClick(back);
    return () => app.BackButton.offClick(back);
  }, [pathname, router, sdkReady]);
  return (
    <Context.Provider value={{ ...auth, retry: authenticate }}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
      />
      {children}
    </Context.Provider>
  );
}
