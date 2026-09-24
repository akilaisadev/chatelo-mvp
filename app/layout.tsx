import "./globals.css";
import type { Metadata } from "next";


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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-paper font-sans text-ink antialiased selection:bg-signal selection:text-ink"
      >
        {children}
      </body>
    </html>
  );
}