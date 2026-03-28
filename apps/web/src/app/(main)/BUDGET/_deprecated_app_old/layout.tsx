import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "منشئ ميزانيات الأفلام | FilmBudget Pro",
    description: "Create professional film budgets with AI power. أنشئ ميزانيات احترافية للأفلام باستخدام الذكاء الاصطناعي.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-background antialiased`}>
                {children}
                <Toaster position="top-center" />
            </body>
        </html>
    );
}
