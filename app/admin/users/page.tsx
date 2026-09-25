'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Mail,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Smartphone,
  Globe,
  Monitor,
  Hash,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Copy,
  Clock,
  MapPin,
  Info,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { usersCollection } from '@/lib/firebase/collections';
import { User } from '@/lib/types';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { getUserTicketsSummary } from '@/lib/actions';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

export default function UsersAdminPage() {
  return (
    <AuthGuard>
      <UsersAdminContent />
    </AuthGuard>
  );
}

function InfoRow({ label, value, icon, highlight }: { label: string, value: any, icon?: React.ReactNode, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/40 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-white/90'} text-right truncate max-w-[60%]`}>
        {value || 'N/A'}
      </span>
    </div>
  );
}

function UsersAdminContent() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot[]>([]); // To go back
  const [currentPage, setCurrentPage] = useState(1);

  // Detail View State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit State
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: '',
    isActive: true,
    firstName: '',
    lastName: '',
    phone: '',
    phonePrefix: '',
    documentType: 'dni' as 'dni' | 'passport' | 'rut',
    documentNumber: '',
    country: '',
    preferredCurrency: '',
    emailVerified: false,
  });
  const [saving, setSaving] = useState(false);

  // Tickets Summary State
  const [userTicketsSummary, setUserTicketsSummary] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    loadUsers(true);
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        loadUsers(true);
      } else {
        loadUsers(true); // Reset to normal list if search cleared
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async (reset = false) => {
    setLoading(true);
    try {
      let conditions: any[] = [];
      let startAfterDoc = reset ? undefined : lastDoc;

      // Basic Search Implementation
      // Note: Firestore doesn't support full-text search. 
      // We'll implement a basic prefix match for Email or Name if provided.
      // However, combining this with pagination and sorting can be tricky (requires composite indexes).
      // For now, we'll try to filter by exact match or just load list if empty.
      // If we want prefix search, we need specific range queries.
      
      if (searchTerm) {
         // Attempt to search by email prefix
         conditions.push({ 
           field: 'email', 
           operator: '>=', 
           value: searchTerm.toLowerCase() 
         });
         conditions.push({ 
           field: 'email', 
           operator: '<=', 
           value: searchTerm.toLowerCase() + '\uf8ff' 
         });
         // Note: ordering by email is required for this range query
      }

      const orderByField = searchTerm ? 'email' : 'createdAt';

      const result = await usersCollection.paginate(
        conditions,
        orderByField,
        searchTerm ? 'asc' : 'desc',
        PAGE_SIZE,
        startAfterDoc
      );

      if (reset) {
        setUsers(result.data as User[]);
        setPageHistory([]);
        setCurrentPage(1);
      } else {
        setUsers(result.data as User[]); // Replace current view for pagination page
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);

      // Load tickets summary for each user in parallel
      loadTicketsSummaries(result.data as User[]);

    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios. Intenta buscar por email exacto.');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketsSummaries = async (usersList: User[]) => {
    try {
      // Load tickets summary for each user in parallel
      const summaryPromises = usersList.map(user =>
        getUserTicketsSummary(user.id)
      );

      const summaries = await Promise.all(summaryPromises);

      // Create a map of userId -> summary
      const summaryMap = new Map();
      usersList.forEach((user, index) => {
        if (summaries[index].success && summaries[index].summary) {
          summaryMap.set(user.id, summaries[index].summary);
        }
      });

      setUserTicketsSummary(summaryMap);
    } catch (error) {
      console.error('Error loading tickets summaries:', error);
      // Don't show error to user, just log it
    }
  };

  const handleNextPage = () => {
    if (lastDoc) {
      setPageHistory(prev => [...prev, lastDoc]); // Save current lastDoc to history before moving
      setCurrentPage(prev => prev + 1);
      loadUsers(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      // Logic for prev page is tricky with simple Firestore cursors unless we stored all history
      // Simplified: We reset to start or we need a stack of cursors.
      // Implementing stack of cursors:
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page start
      const prevDoc = newHistory[newHistory.length - 1]; // The one before that
      
      setLastDoc(prevDoc); // Set cursor to the one used to fetch the PREVIOUS page? 
      // Actually paginate takes "startAfter". 
      // To get Page 1: startAfter = undefined
      // To get Page 2: startAfter = Page1LastDoc
      // To get Page 3: startAfter = Page2LastDoc
      
      // If we are on Page 3, history has [Page1LastDoc, Page2LastDoc].
      // We want Page 2. So we need startAfter = Page1LastDoc.
      // Page1LastDoc is history[0]. 
      
      // So if we go back from Page 2 to Page 1: We need startAfter = undefined.
      
      setPageHistory(newHistory);
      setCurrentPage(prev => prev - 1);
      
      // We need to re-fetch using the doc from history
      // Special case: Page 1 needs undefined.
      const targetCursor = newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined;
      
      // We need to call paginate manually with this cursor
      setLoading(true);
      // We reuse logic but inject the cursor directly
      // This requires slight refactor of loadUsers or calling internal logic
      
      // Let's just reset for now if it gets too complex, OR:
      // We can just re-query.
      reloadWithCursor(targetCursor);
    }
  };

  const reloadWithCursor = async (cursor?: QueryDocumentSnapshot) => {
      setLoading(true);
      try {
        let conditions: any[] = [];
        if (searchTerm) {
             conditions.push({ field: 'email', operator: '>=', value: searchTerm.toLowerCase() });
             conditions.push({ field: 'email', operator: '<=', value: searchTerm.toLowerCase() + '\uf8ff' });
        }
        const orderByField = searchTerm ? 'email' : 'createdAt';

        const result = await usersCollection.paginate(
            conditions,
            orderByField,
            searchTerm ? 'asc' : 'desc',
            PAGE_SIZE,
            cursor
        );
        
        setUsers(result.data as User[]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditForm({
      role: user.role || 'user',
      isActive: user.isActive ?? true,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      phonePrefix: user.phonePrefix || '',
      documentType: user.documentType || 'dni',
      documentNumber: user.documentNumber || '',
      country: user.country || '',
      preferredCurrency: user.preferredCurrency || '',
      emailVerified: user.emailVerified ?? false,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    setSaving(true);
    try {
      await usersCollection.update(userToEdit.id, {
        role: editForm.role as any,
        isActive: editForm.isActive,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        phonePrefix: editForm.phonePrefix,
        documentType: editForm.documentType,
        documentNumber: editForm.documentNumber,
        country: editForm.country,
        preferredCurrency: editForm.preferredCurrency,
        emailVerified: editForm.emailVerified,
      });

      toast.success('Usuario actualizado correctamente');
      setIsEditOpen(false);
      // Refresh current list locally
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, ...editForm } as User : u));
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de ELIMINAR este usuario permanentemente? Esta acción no se puede deshacer.')) return;

    try {
      await usersCollection.delete(userId);
      toast.success('Usuario eliminado');
      // Refresh
      loadUsers(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date instanceof Date) return date.toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return String(date);
  };

  const getDeviceInfo = (user: User) => {
    // Priority 1: New explicitly saved fields
    if (user.platform && user.lastLoginDevice) {
        return {
            platform: user.platform,
            device: user.lastLoginDevice,
            browser: user.userAgent && user.userAgent.indexOf("Chrome") > -1 ? "Chrome" : "Browser",
            screenSize: user.screenSize || 'N/A',
            language: user.language || 'N/A',
            userAgent: user.userAgent
        };
    }

    // Priority 2: Infer from lastLoginInfo (legacy data)
    if (user.lastLoginInfo?.device) {
        const ua = user.lastLoginInfo.device;
        let platform = 'N/A';
        if (ua.indexOf("Win") !== -1) platform = "Windows";
        else if (ua.indexOf("Mac") !== -1) platform = "MacOS";
        else if (ua.indexOf("Linux") !== -1) platform = "Linux";
        else if (ua.indexOf("Android") !== -1) platform = "Android";
        else if (ua.indexOf("like Mac") !== -1) platform = "iOS";

        let browser = 'Browser';
        if (ua.indexOf("Chrome") > -1) browser = "Chrome";
        else if (ua.indexOf("Safari") > -1) browser = "Safari";
        else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
        
        return {
            platform: platform,
            device: browser, // Using browser as device name for legacy
            browser: browser,
            screenSize: 'N/A',
            language: 'N/A',
            userAgent: ua
        };
    }

    return {
        platform: 'N/A',
        device: 'N/A',
        browser: 'N/A',
        screenSize: 'N/A',
        language: 'N/A',
        userAgent: 'N/A'
    };
  };

  const deviceInfo = selectedUser ? getDeviceInfo(selectedUser) : null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName}
                        {!user.firstName && !user.lastName && 'Usuario Sin Nombre'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    {/* Badges Column */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={user.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-600"}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="capitalize min-w-[70px] justify-center">
                        {user.role || 'user'}
                      </Badge>

                      {/* Tickets Summary Badges */}
                      {(() => {
                        const summary = userTicketsSummary.get(user.id);
                        if (summary) {
                          return (
                            <>
                              {summary.totalTickets > 0 && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                  <Ticket className="h-3 w-3 mr-1" />
                                  {summary.totalTickets} ticket{summary.totalTickets !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {summary.pendingPayments > 0 && (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {summary.pendingPayments} pendiente{summary.pendingPayments !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {summary.upcomingEvents > 0 && (
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {summary.upcomingEvents} próximo{summary.upcomingEvents !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {summary.preferredPaymentMethod === 'online' && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Online
                                </Badge>
                              )}
                              {summary.preferredPaymentMethod === 'offline' && (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Offline
                                </Badge>
                              )}
                              {/* Profile completeness */}
                              {!user.firstName || !user.lastName || !user.phone || !user.documentNumber ? (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                  <Info className="h-3 w-3 mr-1" />
                                  Perfil incompleto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Perfil completo
                                </Badge>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ver Tickets Button */}
                      {(() => {
                        const summary = userTicketsSummary.get(user.id);
                        if (summary && summary.totalTickets > 0) {
                          return (
                            <Button
                              onClick={() => router.push(`/admin/users/${user.id}/tickets`)}
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Ticket className="h-4 w-4 mr-1" />
                              Ver Tickets
                            </Button>
                          );
                        }
                        return null;
                      })()}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(() => {
                            const summary = userTicketsSummary.get(user.id);
                            if (summary && summary.totalTickets > 0) {
                              return (
                                <>
                                  <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}/tickets`)}>
                                    <Ticket className="h-4 w-4 mr-2" />
                                    Ver Tickets
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              );
                            }
                            return null;
                          })()}
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Página {currentPage}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevPage} 
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage} 
            disabled={!hasMore || loading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedUser && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-[#0a0a0a] border-white/10 gap-0">
            <DialogHeader className="px-6 py-6 border-b border-white/5 bg-white/[0.02]">
               <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <Avatar className="h-20 w-20 border-2 border-white/10 shadow-lg">
                     <AvatarImage src={selectedUser.photoURL} />
                     <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                       {selectedUser.firstName ? selectedUser.firstName.charAt(0).toUpperCase() : 'U'}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                     <DialogTitle className="text-2xl font-bold text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                     </DialogTitle>
                     <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Mail className="h-4 w-4" />
                        <span>{selectedUser.email}</span>
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        <Badge variant={selectedUser.isActive ? "default" : "destructive"} className={selectedUser.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""}>
                           {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline" className="border-white/10 text-white/70 capitalize">
                           {selectedUser.role || 'User'}
                        </Badge>
                        <Badge variant="outline" className="border-white/10 text-white/70 flex items-center gap-1">
                           <Globe className="h-3 w-3" /> {selectedUser.authProvider || 'Email'}
                        </Badge>
                     </div>
                  </div>
                  <Button onClick={() => handleEditUser(selectedUser)} className="shrink-0 bg-white/10 hover:bg-white/20 text-white border-0">
                     <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                  </Button>
               </div>
            </DialogHeader>

            <div className="p-6 space-y-8">
               {/* ID Card */}
               <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-white/40 font-mono">ID: {selectedUser.id}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/40 hover:text-white" onClick={() => {
                      navigator.clipboard.writeText(selectedUser.id);
                      toast.success('ID copiado');
                  }}>
                      <Copy className="h-3 w-3" />
                  </Button>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                     <section>
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Users className="h-4 w-4" /> Información Personal
                        </h3>
                        <div className="space-y-1 bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                             <div className="p-4 space-y-3">
                                <InfoRow label="Nombre Completo" value={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                                <InfoRow label="Documento" value={`${selectedUser.documentType || ''} ${selectedUser.documentNumber || ''}`.trim() || 'N/A'} />
                                <InfoRow label="Teléfono" value={`${selectedUser.phonePrefix || ''} ${selectedUser.phone || ''}`.trim() || 'N/A'} />
                                <InfoRow label="País" value={selectedUser.country} />
                                <InfoRow label="Moneda Preferida" value={selectedUser.preferredCurrency} />
                             </div>
                        </div>
                     </section>

                     <section>
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Clock className="h-4 w-4" /> Actividad
                        </h3>
                        <div className="space-y-1 bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                             <div className="p-4 space-y-3">
                                <InfoRow label="Fecha Registro" value={formatDate(selectedUser.createdAt)} />
                                <InfoRow label="Última Actualización" value={formatDate(selectedUser.updatedAt)} />
                                <InfoRow label="Último Acceso" value={formatDate(selectedUser.lastLogin)} highlight />
                             </div>
                        </div>
                     </section>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                     <section>
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Smartphone className="h-4 w-4" /> Dispositivo & Sesión
                        </h3>
                        <div className="space-y-1 bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                           <div className="p-4 space-y-3">
                             <InfoRow label="Plataforma" value={deviceInfo?.platform} icon={<Monitor className="h-3 w-3" />} />
                             <InfoRow label="Dispositivo" value={deviceInfo?.device} />
                             <InfoRow label="Resolución" value={deviceInfo?.screenSize} />
                             <InfoRow label="Idioma" value={deviceInfo?.language} />
                             
                             <div className="pt-3 mt-2 border-t border-white/5">
                                <p className="text-xs text-white/40 mb-2">User Agent</p>
                                <div className="bg-black/20 rounded p-2 text-[10px] text-white/50 font-mono break-all border border-white/5">
                                   {deviceInfo?.userAgent || 'No registrado'}
                                </div>
                             </div>
                           </div>
                        </div>
                     </section>
                     
                     {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                        <section>
                           <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> Direcciones
                           </h3>
                           <div className="space-y-3">
                              {selectedUser.addresses.map((addr, i) => (
                                 <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm hover:bg-white/[0.04] transition-colors">
                                    <p className="text-white font-medium mb-1">{addr.address}</p>
                                    <p className="text-white/60 text-xs">{addr.city}, {addr.region}, {addr.country}</p>
                                    {addr.isDefault && (
                                       <Badge variant="outline" className="mt-2 text-[10px] h-5 border-primary/20 text-primary">Principal</Badge>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}
                  </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog - Expandido con Tabs */}
      {userToEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1A1D21]">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Usuario</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Actualiza la información del usuario. Los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger
                  value="personal"
                  className="text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Información Personal
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Contacto y Documento
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Configuración
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Información Personal */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nombre del usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Apellidos *</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Apellidos del usuario"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-foreground">País</Label>
                  <Select
                    value={editForm.country}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chile">Chile</SelectItem>
                      <SelectItem value="Perú">Perú</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="México">México</SelectItem>
                      <SelectItem value="España">España</SelectItem>
                      <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                      <SelectItem value="Brasil">Brasil</SelectItem>
                      <SelectItem value="Ecuador">Ecuador</SelectItem>
                      <SelectItem value="Venezuela">Venezuela</SelectItem>
                      <SelectItem value="Uruguay">Uruguay</SelectItem>
                      <SelectItem value="Paraguay">Paraguay</SelectItem>
                      <SelectItem value="Bolivia">Bolivia</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredCurrency" className="text-foreground">Moneda Preferida</Label>
                  <Select
                    value={editForm.preferredCurrency}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, preferredCurrency: value }))}
                  >
                    <SelectTrigger id="preferredCurrency">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                      <SelectItem value="PEN">PEN - Sol Peruano</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Tab 2: Contacto y Documento */}
              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phonePrefix" className="text-foreground">Prefijo</Label>
                    <Input
                      id="phonePrefix"
                      value={editForm.phonePrefix}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phonePrefix: e.target.value }))}
                      placeholder="+56"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="phone" className="text-foreground">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="912345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType" className="text-foreground">Tipo de Documento</Label>
                  <Select
                    value={editForm.documentType}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, documentType: value as 'dni' | 'passport' | 'rut' }))}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="rut">RUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentNumber" className="text-foreground">Número de Documento</Label>
                  <Input
                    id="documentNumber"
                    value={editForm.documentNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="12345678"
                  />
                </div>

                {userToEdit.email && (
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Email:</span>
                      <span className="text-muted-foreground">{userToEdit.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      El email no se puede editar desde aquí
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Configuración de Cuenta */}
              <TabsContent value="account" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground">Rol</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="cursor-pointer text-foreground" htmlFor="active-mode">
                      Estado Activo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Desactivar impide que el usuario inicie sesión
                    </p>
                  </div>
                  <Switch
                    id="active-mode"
                    checked={editForm.isActive}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="cursor-pointer text-foreground" htmlFor="email-verified">
                      Email Verificado
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marcar como verificado manualmente
                    </p>
                  </div>
                  <Switch
                    id="email-verified"
                    checked={editForm.emailVerified}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, emailVerified: checked }))}
                  />
                </div>

                {/* Info sobre proveedor de autenticación */}
                {userToEdit.authProvider && (
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Proveedor de autenticación:</span>
                      <Badge variant="outline" className="capitalize">
                        {userToEdit.authProvider}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este campo no se puede editar
                    </p>
                  </div>
                )}

                {/* Información de último acceso */}
                {userToEdit.lastLogin && (
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Último acceso:</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(userToEdit.lastLogin)}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
