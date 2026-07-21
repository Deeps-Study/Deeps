import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import { DeepsDetailContainer } from './components/DeepsDetailContainer';

export default async function DeepsDetailPage({
    params,
}: {
    params: Promise<{ studyId: string; deepsId: string }>;
}) {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    const { studyId, deepsId } = await params;

    return <DeepsDetailContainer studyId={studyId} deepsId={deepsId} />;
}
