import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Tenun — Studio Threads",
  description: "CMS editorial untuk jadwal post, auto-reply ber-approval, dan monitoring Threads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark" data-theme="tenun">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23161618'/%3E%3Cg stroke='%23F4F4F5' stroke-width='1.2' opacity='0.5'%3E%3Cpath d='M10 12V28' stroke-dasharray='2 3'/%3E%3Cpath d='M20 12V28'/%3E%3Cpath d='M30 12V28' stroke-dasharray='3 3'/%3E%3Cpath d='M12 20H28' stroke-dasharray='2 2'/%3E%3C/g%3E%3Cline x1='8' y1='25' x2='32' y2='25' stroke='%23E8633C' stroke-width='2'/%3E%3Ccircle cx='20' cy='25' r='3' fill='%23E8633C'/%3E%3C/svg%3E"
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans text-[13px] leading-relaxed antialiased bg-umbra-canvas text-foam-ink`}>
        {children}
      </body>
    </html>
  );
}