import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dr. Farah Jabbarin – Consultation App",
  description: "Consultation request app connected to Supabase"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
