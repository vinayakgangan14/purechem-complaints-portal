import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Purechem Manufacturing Nigeria | Customer Complaint & Tracking Portal",
  description:
    "Official Customer Complaint Registration, Tracking & Quality Resolution System for Purechem Manufacturing Nigeria Ltd. Adhesives, Construction Chemicals, Resins & Industrial Glues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
