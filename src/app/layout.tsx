import { BookOpenCheck } from "lucide-react";
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
  title: "Lớp Mình Hiểu Bài",
  description: "Không để em nào bị bỏ lại: biết em sai ở đâu, dạy lại đúng chỗ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur print:hidden">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                <BookOpenCheck className="size-6" aria-hidden />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-primary">Lớp Mình Hiểu Bài</span>
                <span className="text-xs text-muted">Không để em nào bị bỏ lại</span>
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-5 text-center text-sm text-muted print:hidden">
          Học sinh chỉ dùng mã ẩn danh · AI gợi ý, thầy cô quyết định
        </footer>
      </body>
    </html>
  );
}
