import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Executive Product Coach",
  description: "Gamified advanced B2B product leadership coaching app"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
