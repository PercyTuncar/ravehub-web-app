import { BioLinkAnalyticsDashboard } from './_components/AnalyticsDashboard';

export const metadata = {
    title: 'Estadísticas Link In Bio | Admin Ravehub',
    description: 'Panel de control para estadísticas del link in bio',
};

export default function BioLinkStatsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Estadísticas Link In Bio</h1>
            <p className="text-gray-400 mb-8">Rendimiento de la página /go en tiempo real.</p>

            <BioLinkAnalyticsDashboard />
        </div>
    );
}
