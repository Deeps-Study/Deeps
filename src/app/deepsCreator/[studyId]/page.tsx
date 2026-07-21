import { DeepsDetailHeader } from './components/DeepsDetailHeader';
import { DeepsForm } from './components/DeepsForm';

export default async function DeepsDetailPage({
    params,
}: {
    params: Promise<{ studyId: string }>;
}) {
    const { studyId } = await params;

    return (
        <div className="flex flex-col h-screen bg-white">
            <DeepsDetailHeader />
            <DeepsForm studyId={studyId} />
        </div>
    );
}
