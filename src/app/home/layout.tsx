import MainHeader from '@/components/MainHeader';

export default function HomLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader type="home" />
            <div className="flex flex-1 justify-center  bg-white">
                {children}
            </div>
        </div>
    );
}
