import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bắt Mạch Lớp Học AI",
  description: "Phát hiện lỗi sai, dạy bổ sung đúng chỗ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line bg-surface print:hidden">
          <div className="mx-auto flex w-full max-w-2xl items-center px-4 py-3">
            <Link href="/" className="text-lg font-bold text-primary">
              Bắt Mạch Lớp Học
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
