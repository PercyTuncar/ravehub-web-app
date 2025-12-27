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
  Info
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
  });
  const [saving, setSaving] = useState(false);

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

    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios. Intenta buscar por email exacto.');
    } finally {
      setLoading(false);
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

                  <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={user.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-600"}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="capitalize min-w-[70px] justify-center">
                        {user.role || 'user'}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground hidden lg:block text-right min-w-[120px]">
                      <p>Registrado:</p>
                      <p>{formatDate(user.createdAt).split(',')[0]}</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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

      {/* Edit Dialog */}
      {userToEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input 
                    value={editForm.firstName} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos</Label>
                  <Input 
                    value={editForm.lastName} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
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
                <Label className="cursor-pointer" htmlFor="active-mode">
                  Estado Activo
                </Label>
                <Switch 
                  id="active-mode"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
