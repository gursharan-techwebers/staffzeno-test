import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StaffZeno - Attendance & Payroll, Simplified",
  description:
    "StaffZeno makes employee attendance, leave management, and payroll simple for small businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} min-h-full antialiased`}>
      <body>
        <TooltipProvider>
        {children}
        <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
