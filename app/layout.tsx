import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatelo — Talk to one stranger, then the line goes dead",
  description:
    "Chatelo pairs you with one random stranger for a private, anonymous text conversation. No account, no profile, no history. When one of you leaves, the line goes dead.",
  openGraph: {
    title: "Chatelo — Talk to one stranger",
    description: "A private line to one random stranger. No account, no logs, no trace.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} bg-paper font-sans text-ink antialiased selection:bg-signal selection:text-ink`}
      >
        {children}
      </body>
    </html>
  );
}