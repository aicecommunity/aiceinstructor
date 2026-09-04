import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AuthGate from "./components/AuthGate";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const InterFont = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AiCE Instructor – African Institute for Computing Excellence",
  description:
    "AiCE Instructor is the authoring and management tool for AiCE courses, units, assessments, and learner records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${InterFont.className} antialiased`}>
      <body>
        <Navbar />
        <div className="md:flex md:items-stretch">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-gray-50 min-h-[calc(100vh-80px)]">
            <AuthGate>{children}</AuthGate>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: { style: { background: "#195C49", color: "#fff" } },
            error: { style: { background: "#ef4444", color: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
