import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iHaul iMove - Box Drop CRM",
  description: "Track weekly packing supply kit drops to homeowners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
