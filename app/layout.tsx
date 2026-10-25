import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAN Studio",
  description: "Редактор топологии локальной сети",
  icons: {
    icon: "/favicon.svg?v=2",
    shortcut: "/favicon.svg?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
