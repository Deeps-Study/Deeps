import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginButtonClick = () => {
        router.push('/nickname');
    };

