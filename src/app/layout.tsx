import type { Metadata } from 'next';
import { preconnect } from 'react-dom';
import AlertModal from '@/components/AlertModal';
import './globals.css';

export const metadata: Metadata = {
    title: 'deeps',
    description: 'Deep Study',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    preconnect('https://qeghxlyglnoazhdqcfof.supabase.co');
    return (
        <html lang="ko">
            <head>
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
                />
            </head>
            <body className="font-sans bg-white">
                {children}
                <AlertModal />
            </body>
        </html>
    );
}
