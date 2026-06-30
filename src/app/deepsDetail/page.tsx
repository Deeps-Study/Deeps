import { DeepsDetailHeader } from './components/DeepsDetailHeader';
import { DeepsForm } from './components/DeepsForm';

export default function DeepsDetailPage() {
    return (
        <div className="flex flex-col h-screen bg-white">
            <DeepsDetailHeader />
            <DeepsForm />
        </div>
    );
}
