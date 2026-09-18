import { collection, query, orderBy, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Complaint {
  id: string;
  claimNumber: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  goodType: string;
  amount: string;
  description: string;
  claimType: string;
  detail: string;
  request: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: any;
  provider: {
    businessName: string;
    ruc: string;
    address: string;
  };
}

async function getComplaints() {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Complaint[];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
          <AlertCircle className="w-3 h-3 mr-1" />
          En Proceso
        </Badge>
      );
    case 'resolved':
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Resuelto
        </Badge>
      );
    default:
      return null;
  }
}

export default async function ComplaintsAdminPage() {
  const complaints = await getComplaints();

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">
              Libro de Reclamaciones - Admin
            </h1>
            <p className="text-gray-400">Gestión de reclamos y quejas</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Total</CardDescription>
              <CardTitle className="text-white text-2xl">
                {complaints.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Pendientes</CardDescription>
              <CardTitle className="text-yellow-500 text-2xl">
                {complaints.filter((c) => c.status === 'pending').length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">En Proceso</CardDescription>
              <CardTitle className="text-blue-500 text-2xl">
                {complaints.filter((c) => c.status === 'in_progress').length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Resueltos</CardDescription>
              <CardTitle className="text-green-500 text-2xl">
                {complaints.filter((c) => c.status === 'resolved').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <Card className="bg-[#0A0A0A] border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay reclamaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            complaints.map((complaint) => (
              <Card key={complaint.id} className="bg-[#0A0A0A] border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-white text-lg">
                          {complaint.claimNumber}
                        </CardTitle>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <CardDescription className="text-gray-400">
                        {complaint.claimType === 'reclamo' ? 'RECLAMO' : 'QUEJA'} -{' '}
                        {new Date(complaint.createdAt?.toDate()).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Consumer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Consumidor</p>
                      <p className="text-white">{complaint.fullName}</p>
                      <p className="text-gray-400 text-sm">
                        {complaint.documentType}: {complaint.documentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contacto</p>
                      <p className="text-white">{complaint.email}</p>
                      <p className="text-gray-400 text-sm">{complaint.phone}</p>
                    </div>
                  </div>

                  {/* Good/Service Info */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {complaint.goodType === 'product' ? 'Producto' : 'Servicio'}
                    </p>
                    <p className="text-white">{complaint.description}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Monto: S/ {complaint.amount}
                    </p>
                  </div>

                  {/* Complaint Detail */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Detalle de la Reclamación</p>
                    <p className="text-gray-300">{complaint.detail}</p>
                  </div>

                  {/* Consumer Request */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pedido del Consumidor</p>
                    <p className="text-gray-300">{complaint.request}</p>
                  </div>

                  {/* Actions */}
                  {complaint.claimType === 'reclamo' && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-yellow-400 mb-2">
                        ⚠️ Requiere respuesta en 15 días hábiles
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
