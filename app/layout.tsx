import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell";
import { TelegramProvider } from "@/components/telegram-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Практика — пространство для роста",
    template: "%s · Практика",
  },
  description:
    "Учебные материалы в вашем ритме: статьи, иллюстрации и видеоуроки.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f9f5",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <TelegramProvider>
          <Shell>{children}</Shell>
        </TelegramProvider>
      </body>
    </html>
  );
}
