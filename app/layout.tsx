import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope as MainFont } from "next/font/google";
import { ThemeProvider } from "@/app/providers/theme-provider";
import "./globals.css";

const AppFont = MainFont({
  variable: "--font-app",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CaseFlow | PIPOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${AppFont.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-brand-page text-brand-text-primary">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
