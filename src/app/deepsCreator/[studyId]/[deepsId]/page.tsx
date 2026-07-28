import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import { DeepsDetailHeader } from '../components/DeepsDetailHeader';
import { DeepsForm } from '../components/DeepsForm';

export default async function DeepsEditPage({
    params,
}: {
    params: Promise<{ studyId: string; deepsId: string }>;
}) {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    const { studyId, deepsId } = await params;

    return (
        <div className="flex flex-col h-screen bg-white">
            <DeepsDetailHeader
                title="딥스 수정하기"
                backHref={`/deepsDetail/${studyId}/${deepsId}`}
            />
            <DeepsForm studyId={studyId} deepsId={deepsId} />
        </div>
    );
}
