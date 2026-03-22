import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { CurrencyProvider } from "@/components/currency-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Studify Finance — CEO Dashboard",
  description: "Финансовый дашборд и калькулятор для Studify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} ${jetbrains.variable} min-h-screen antialiased`}
      >
        <ThemeProvider>
          <CurrencyProvider>
            <AppShell>{children}</AppShell>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
