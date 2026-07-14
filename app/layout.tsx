import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chunk Talk — 日常英语语块口语练习",
  description: "从真实生活意图出发，用高频语块练出脱口而出的英语。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
