import type { Metadata } from 'next';
import { preconnect } from 'react-dom';
import AlertModal from '@/components/AlertModal';
import localFont from 'next/font/local';
import './globals.css';

const pretendard = localFont({
    src: '../fonts/PretendardVariable-final.woff2',
    display: 'swap',
    variable: '--font-pretendard',
    weight: '400 700',
});

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
        <html lang="ko" className={pretendard.variable}>
            <body className="font-sans bg-white">
                {children}
                <AlertModal />
            </body>
        </html>
    );
}
