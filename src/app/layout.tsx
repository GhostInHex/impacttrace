import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ProjectStoreProvider } from "@/features/projects/project-store-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Impact Evidence Workspace",
  description: "Create and manage traceable sustainability projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <ProjectStoreProvider>{children}</ProjectStoreProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
