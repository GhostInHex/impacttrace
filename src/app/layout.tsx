import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ProjectStoreProvider } from "@/features/projects/project-store-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ImpactTrace",
  description:
    "AI evidence workspace for field media and live data. Traceable Cloudinary impact media plus prompt-driven data intelligence.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never cap zoom: the layout must survive 200% zoom (WCAG 1.4.4).
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProjectStoreProvider>{children}</ProjectStoreProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
