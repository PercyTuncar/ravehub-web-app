'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Truck,
  Store,
  Globe,
  MapPin,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { FileUpload } from '@/components/common/FileUpload';
import { productsCollection, productCategoriesCollection } from '@/lib/firebase/collections';
import { Product, ProductCategory, ShippingZone } from '@/lib/types';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency-converter';
import { getCountries, getStatesByCountry, CountryData, StateData } from '@/lib/utils/location-apis';
import { generateSlug } from '@/lib/utils/slug-generator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

const STEPS = [
  { id: 'basic', title: 'Información Básica' },
  { id: 'multimedia', title: 'Multimedia' },
  { id: 'shipping', title: 'Configuración de Envíos' },
  { id: 'seo', title: 'SEO' },
  { id: 'review', title: 'Revisión' },
];

export default function ProductsAdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form data
  const [productData, setProductData] = useState<Partial<Product>>({
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    price: 0,
    currency: 'PEN',
    discountPercentage: 0,
    stock: 0,
    hasVariants: false,
    categoryId: '',
    shippingEnabled: true,
    shippingType: 'nationwide',
    storePickupEnabled: false,
    defaultShippingPercentage: 10,
    defaultShippingDays: 5,
    images: [],
    imageAltTexts: {},
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    isActive: false,
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await productsCollection.getAll();
      setProducts(allProducts as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await productCategoriesCollection.query(
        [{ field: 'isActive', operator: '==', value: true }]
      );
      setCategories(allCategories as ProductCategory[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const updateProductData = (field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      setProductData(prev => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleCreateProduct = () => {
    setProductData({
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      price: 0,
      currency: 'PEN',
      discountPercentage: 0,
      stock: 0,
      hasVariants: false,
      categoryId: '',
      shippingEnabled: true,
      shippingType: 'nationwide',
      storePickupEnabled: false,
      defaultShippingPercentage: 10,
      defaultShippingDays: 5,
      images: [],
      imageAltTexts: {},
      seoTitle: '',
      seoDescription: '',
      seoKeywords: [],
      isActive: false,
    });
    setCurrentStep(0);
    setIsCreateDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductData(product);
    setCurrentStep(0);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productsCollection.delete(productId);
      await loadProducts();
      await revalidateSitemap();
      toast.success('Producto eliminado');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleSaveProduct = async (publishNow: boolean = false) => {
    setSaving(true);
    try {
      const dataToSave: any = {
        ...productData,
        isActive: publishNow,
        updatedAt: new Date().toISOString(),
      };

      if (isEditDialogOpen && selectedProduct) {
        await productsCollection.update(selectedProduct.id, dataToSave);
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await productsCollection.create(dataToSave);
      }

      await loadProducts();
      await revalidateSitemap();
      
      // Revalidate store pages if published
      if (publishNow) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
          const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
          
          // Revalidate store listing
          await fetch(`${baseUrl}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, path: '/tienda' })
          });

          // Revalidate product detail
          if (dataToSave.slug) {
            await fetch(`${baseUrl}/api/revalidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, path: `/tienda/${dataToSave.slug}` })
            });
          }
        } catch (e) {
          console.error('Error revalidating pages:', e);
        }
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      toast.success(publishNow ? 'Producto publicado exitosamente' : 'Producto guardado como borrador');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    draft: products.filter(p => !p.isActive).length,
    lowStock: products.filter(p => (p.stock || 0) < 10).length
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-[#141618] overflow-hidden">
        {/* Dynamic Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#141618]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(0,203,255,0.06), transparent 40%)'
          }}
        />

        <div className="relative z-10 p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="font-bold text-white text-xl">R</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Ravehub Admin</h1>
                  <p className="text-xs text-white/40">Gestión de Productos</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleCreateProduct} className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-[0_0_20px_-5px_var(--primary)]">
                <Plus className="mr-2 h-4 w-4" />
                Crear Producto
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Productos</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Activos</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Borradores</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.draft}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Edit className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Stock Bajo</p>
                    <p className="text-3xl font-bold text-red-400 mt-1">{stats.lowStock}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
                  />
                </div>
                <Button
                  onClick={loadProducts}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? 'No se encontraron productos.' : 'No hay productos creados aún.'}
              </div>
              {!searchTerm && (
                <Button onClick={handleCreateProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Producto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden">
                  <div className="aspect-square bg-black/40 relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge className={product.isActive ? "bg-green-500/80" : "bg-yellow-500/80"}>
                        {product.isActive ? 'Activo' : 'Borrador'}
                      </Badge>
                    </div>
                    {(product.discountPercentage || 0) > 0 && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">-{product.discountPercentage}%</Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-white/60 mb-3 line-clamp-2 min-h-[2.5em]">
                      {product.shortDescription}
                    </p>
                    
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-lg font-bold text-primary">
                          {Object.values(SUPPORTED_CURRENCIES).find(c => Object.keys(SUPPORTED_CURRENCIES).find(k => k === product.currency))?.symbol || product.currency}
                          {product.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/10 text-white hover:bg-white/5"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1D21] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-red-500 focus:text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog 
            open={isCreateDialogOpen || isEditDialogOpen} 
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              setIsEditDialogOpen(open);
            }}
          >
            <DialogContent className="bg-[#1A1D21] border-white/10 text-white max-w-6xl max-h-[90vh] overflow-hidden p-0">
              <div className="flex flex-col h-full max-h-[90vh]">
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-white/10 flex-shrink-0">
                  <DialogTitle className="text-2xl font-bold">
                    {isCreateDialogOpen ? 'Crear Nuevo Producto' : 'Editar Producto'}
                  </DialogTitle>
                  
                  {/* Steps */}
                  <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {STEPS.map((step, index) => (
                      <div key={step.id} className="flex items-center flex-shrink-0">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            index === currentStep
                              ? 'bg-primary text-white'
                              : index < currentStep
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={`ml-2 text-sm font-medium hidden md:inline ${
                            index === currentStep ? 'text-white' : 'text-white/40'
                        }`}>
                          {step.title}
                        </span>
                        {index < STEPS.length - 1 && (
                          <div className="w-8 h-0.5 bg-white/10 mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <ProductFormSteps
                    currentStep={currentStep}
                    productData={productData}
                    updateProductData={updateProductData}
                    categories={categories}
                  />
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-white/10 flex justify-between items-center flex-shrink-0 bg-black/20">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    Anterior
                  </Button>

                  <div className="flex gap-2">
                    {currentStep === STEPS.length - 1 ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveProduct(false)}
                          disabled={saving}
                          className="border-white/10 text-white hover:bg-white/5"
                        >
                          Guardar como Borrador
                        </Button>
                        <Button
                          onClick={() => handleSaveProduct(true)}
                          disabled={saving}
                          className="bg-primary text-white hover:bg-primary/90"
                        >
                          {saving ? 'Publicando...' : 'Publicar Producto'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={nextStep} className="bg-primary text-white hover:bg-primary/90">
                        Siguiente
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}

// Componente separado para los pasos del formulario
function ProductFormSteps({
  currentStep,
  productData,
  updateProductData,
  categories,
}: {
  currentStep: number;
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
  categories: ProductCategory[];
}) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoadingLocations(true);
    const countriesData = await getCountries();
    setCountries(countriesData);
    setLoadingLocations(false);
  };

  const loadStates = async (countryCode: string) => {
    setLoadingLocations(true);
    const statesData = await getStatesByCountry(countryCode);
    setStates(statesData);
    setLoadingLocations(false);
  };

  const inputClass = "bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50";
  const labelClass = "text-white/80";

  switch (currentStep) {
    case 0: // Información Básica
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Nombre del Producto *</Label>
              <Input
                value={productData.name || ''}
                onChange={(e) => updateProductData('name', e.target.value)}
                placeholder="Ej: Polo Ultra Peru 2025"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Slug</Label>
              <Input
                value={productData.slug || ''}
                onChange={(e) => updateProductData('slug', e.target.value)}
                placeholder="Auto-generado"
                disabled
                className={`${inputClass} opacity-50`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Descripción Corta *</Label>
            <Textarea
              value={productData.shortDescription || ''}
              onChange={(e) => updateProductData('shortDescription', e.target.value)}
              placeholder="Breve descripción del producto (1-2 líneas)"
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Descripción Completa *</Label>
            <Textarea
              value={productData.description || ''}
              onChange={(e) => updateProductData('description', e.target.value)}
              placeholder="Descripción detallada del producto"
              rows={6}
              className={inputClass}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Precio *</Label>
              <Input
                type="number"
                value={productData.price || 0}
                onChange={(e) => updateProductData('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Divisa *</Label>
              <Select
                value={productData.currency || 'PEN'}
                onValueChange={(value) => updateProductData('currency', value)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                    <SelectItem key={code} value={code}>
                      {info.symbol} {info.name} ({code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Descuento (%)</Label>
              <Input
                type="number"
                value={productData.discountPercentage || 0}
                onChange={(e) => updateProductData('discountPercentage', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Stock *</Label>
              <Input
                type="number"
                value={productData.stock || 0}
                onChange={(e) => updateProductData('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Categoría *</Label>
              <Select
                value={productData.categoryId || ''}
                onValueChange={(value) => updateProductData('categoryId', value)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Marca</Label>
              <Input
                value={productData.brand || ''}
                onChange={(e) => updateProductData('brand', e.target.value)}
                placeholder="Ej: Nike"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Artista</Label>
              <Input
                value={productData.artist || ''}
                onChange={(e) => updateProductData('artist', e.target.value)}
                placeholder="Ej: Boris Brejcha"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Género</Label>
              <Select
                value={productData.gender || ''}
                onValueChange={(value) => updateProductData('gender', value)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                  <SelectItem value="unisex">Unisex</SelectItem>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case 1: // Multimedia
      return (
        <MultimediaStep
          productData={productData}
          updateProductData={updateProductData}
          inputClass={inputClass}
          labelClass={labelClass}
        />
      );

    case 2: // Configuración de Envíos
      return (
        <ShippingStep
          productData={productData}
          updateProductData={updateProductData}
          countries={countries}
          states={states}
          loadStates={loadStates}
          loadingLocations={loadingLocations}
          inputClass={inputClass}
          labelClass={labelClass}
        />
      );

    case 3: // SEO
      return (
        <SEOStep
          productData={productData}
          updateProductData={updateProductData}
          inputClass={inputClass}
          labelClass={labelClass}
        />
      );

    case 4: // Revisión
      return (
        <ReviewStep
          productData={productData}
          categories={categories}
        />
      );

    default:
      return null;
  }
}

function MultimediaStep({
  productData,
  updateProductData,
  inputClass,
  labelClass
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
  inputClass: string;
  labelClass: string;
}) {
  const handleImageUpload = (url: string) => {
    const newImages = [...(productData.images || []), url];
    updateProductData('images', newImages);
  };

  const handleImageRemove = (index: number) => {
    const newImages = (productData.images || []).filter((_, i) => i !== index);
    updateProductData('images', newImages);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className={labelClass}>Imágenes del Producto</Label>
        <p className="text-sm text-white/60 mb-4">
          Sube hasta 5 imágenes del producto. La primera será la imagen principal.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {(productData.images || []).map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
              <img src={image} alt={`Producto ${index + 1}`} className="w-full h-full object-cover" />
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-primary">Principal</Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleImageRemove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {(!productData.images || productData.images.length < 5) && (
          <FileUpload
            onUploadComplete={handleImageUpload}
            accept="image/*"
            maxSize={5}
            folder="products/images"
            variant="default"
            className="bg-black/20 border-white/10"
          />
        )}
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-2">
        <Label className={labelClass}>URL del Video (Opcional)</Label>
        <Input
          value={productData.videoUrl || ''}
          onChange={(e) => updateProductData('videoUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className={inputClass}
        />
      </div>
    </div>
  );
}

function ShippingStep({
  productData,
  updateProductData,
  countries,
  states,
  loadStates,
  loadingLocations,
  inputClass,
  labelClass
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
  countries: CountryData[];
  states: StateData[];
  loadStates: (code: string) => void;
  loadingLocations: boolean;
  inputClass: string;
  labelClass: string;
}) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [zoneCost, setZoneCost] = useState(0);
  const [zoneDays, setZoneDays] = useState(5);
  const [zoneFreeShipping, setZoneFreeShipping] = useState(false);

  const addShippingZone = () => {
    const country = countries.find(c => c.code === selectedCountry);
    const state = states.find(s => s.code === selectedState);
    
    if (!country) return;

    const newZone: ShippingZone = {
      id: `${Date.now()}`,
      country: country.name,
      countryCode: country.code,
      state: state?.name,
      stateCode: state?.code,
      shippingCost: zoneCost,
      isFreeShipping: zoneFreeShipping,
      estimatedDays: zoneDays,
    };

    const currentZones = productData.shippingZones || [];
    updateProductData('shippingZones', [...currentZones, newZone]);

    // Reset
    setSelectedState('');
    setZoneCost(0);
    setZoneDays(5);
    setZoneFreeShipping(false);
  };

  const removeShippingZone = (zoneId: string) => {
    const currentZones = productData.shippingZones || [];
    updateProductData('shippingZones', currentZones.filter(z => z.id !== zoneId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 p-4 border border-white/10 rounded-lg bg-black/20">
        <Checkbox
          checked={productData.shippingEnabled}
          onCheckedChange={(checked) => updateProductData('shippingEnabled', checked)}
          className="border-white/20"
        />
        <Label className={labelClass}>Habilitar envíos para este producto</Label>
      </div>

      {productData.shippingEnabled && (
        <>
          <div className="space-y-2">
            <Label className={labelClass}>Tipo de Envío *</Label>
            <Select
              value={productData.shippingType || 'nationwide'}
              onValueChange={(value) => updateProductData('shippingType', value)}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                <SelectItem value="by_zone">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Por zonas específicas
                  </div>
                </SelectItem>
                <SelectItem value="nationwide">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    A todo el país
                  </div>
                </SelectItem>
                <SelectItem value="store_pickup_only">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    Solo recojo en tienda
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Por Zonas */}
          {productData.shippingType === 'by_zone' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Zonas de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agregar nueva zona */}
                <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClass}>País</Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={(value) => {
                          setSelectedCountry(value);
                          loadStates(value);
                        }}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Selecciona país" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>Estado/Región</Label>
                      <Select
                        value={selectedState}
                        onValueChange={setSelectedState}
                        disabled={!selectedCountry || loadingLocations}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Selecciona región" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                          {states.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClass}>Costo de Envío</Label>
                      <Input
                        type="number"
                        value={zoneCost}
                        onChange={(e) => setZoneCost(parseFloat(e.target.value) || 0)}
                        placeholder={`Por defecto: ${(productData.price || 0) * 0.1}`}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>Días Estimados</Label>
                      <Input
                        type="number"
                        value={zoneDays}
                        onChange={(e) => setZoneDays(parseInt(e.target.value) || 5)}
                        placeholder="5"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={zoneFreeShipping}
                      onCheckedChange={(checked) => setZoneFreeShipping(checked as boolean)}
                      className="border-white/20"
                    />
                    <Label className={labelClass}>Envío gratuito para esta zona</Label>
                  </div>

                  <Button onClick={addShippingZone} disabled={!selectedCountry} className="w-full border-white/10" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Zona
                  </Button>
                </div>

                {/* Lista de zonas */}
                {productData.shippingZones && productData.shippingZones.length > 0 && (
                  <div className="space-y-2">
                    {productData.shippingZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 border border-white/10 rounded bg-black/20">
                        <div>
                          <p className="font-medium text-white">{zone.country} {zone.state ? `- ${zone.state}` : ''}</p>
                          <p className="text-sm text-white/60">
                            {zone.isFreeShipping ? 'Envío gratuito' : `Costo: ${zone.shippingCost}`} • {zone.estimatedDays} días
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeShippingZone(zone.id)} className="text-white hover:bg-white/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* A Todo el País */}
          {productData.shippingType === 'nationwide' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Envío Nacional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={labelClass}>País</Label>
                  <Select
                    value={productData.nationwideShipping?.countryCode || ''}
                    onValueChange={(value) => {
                      const country = countries.find(c => c.code === value);
                      if (country) {
                        updateProductData('nationwideShipping', {
                          country: country.name,
                          countryCode: country.code,
                          shippingCost: (productData.price || 0) * 0.1,
                          isFreeShipping: false,
                          estimatedDays: 5,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Selecciona país" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1D21] border-white/10 text-white">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>Costo de Envío</Label>
                    <Input
                      type="number"
                      value={productData.nationwideShipping?.shippingCost || 0}
                      onChange={(e) => {
                        updateProductData('nationwideShipping', {
                          ...productData.nationwideShipping,
                          shippingCost: parseFloat(e.target.value) || 0,
                        });
                      }}
                      placeholder={`Por defecto: ${(productData.price || 0) * 0.1}`}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Días Estimados</Label>
                    <Input
                      type="number"
                      value={productData.nationwideShipping?.estimatedDays || 5}
                      onChange={(e) => {
                        updateProductData('nationwideShipping', {
                          ...productData.nationwideShipping,
                          estimatedDays: parseInt(e.target.value) || 5,
                        });
                      }}
                      placeholder="5"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={productData.nationwideShipping?.isFreeShipping || false}
                    onCheckedChange={(checked) => {
                      updateProductData('nationwideShipping', {
                        ...productData.nationwideShipping,
                        isFreeShipping: checked as boolean,
                      });
                    }}
                    className="border-white/20"
                  />
                  <Label className={labelClass}>Envío gratuito</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solo Recojo en Tienda */}
          {productData.shippingType === 'store_pickup_only' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Recojo en Tienda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className={labelClass}>Dirección de la Tienda</Label>
                  <Textarea
                    value={productData.storePickupAddress || ''}
                    onChange={(e) => updateProductData('storePickupAddress', e.target.value)}
                    placeholder="Ingresa la dirección completa donde el cliente puede recoger el producto"
                    rows={3}
                    className={inputClass}
                  />
                  <p className="text-sm text-white/60 mt-2">
                    El cliente podrá recoger el producto sin costo de envío
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SEOStep({
  productData,
  updateProductData,
  inputClass,
  labelClass
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
  inputClass: string;
  labelClass: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className={labelClass}>Título SEO</Label>
        <Input
          value={productData.seoTitle || ''}
          onChange={(e) => updateProductData('seoTitle', e.target.value)}
          placeholder={productData.name || 'Título del producto'}
          className={inputClass}
        />
        <p className="text-xs text-white/40 mt-1">
          {(productData.seoTitle || '').length} / 60 caracteres recomendados
        </p>
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>Descripción SEO</Label>
        <Textarea
          value={productData.seoDescription || ''}
          onChange={(e) => updateProductData('seoDescription', e.target.value)}
          placeholder={productData.shortDescription || 'Descripción del producto'}
          rows={3}
          className={inputClass}
        />
        <p className="text-xs text-white/40 mt-1">
          {(productData.seoDescription || '').length} / 160 caracteres recomendados
        </p>
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>Palabras Clave SEO</Label>
        <Input
          value={(productData.seoKeywords || []).join(', ')}
          onChange={(e) => {
            const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
            updateProductData('seoKeywords', keywords);
          }}
          placeholder="polo, festival, música, electrónica"
          className={inputClass}
        />
        <p className="text-xs text-white/40 mt-1">
          Separa las palabras clave con comas
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  productData,
  categories,
}: {
  productData: Partial<Product>;
  categories: ProductCategory[];
}) {
  const category = categories.find(c => c.id === productData.categoryId);
  const currencyInfo = Object.entries(SUPPORTED_CURRENCIES).find(([code]) => code === productData.currency);

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Revisión Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información Básica */}
          <div>
            <h3 className="font-semibold mb-2 text-white">Información Básica</h3>
            <div className="space-y-1 text-sm text-white/80">
              <p><strong>Nombre:</strong> {productData.name}</p>
              <p><strong>Categoría:</strong> {category?.name}</p>
              <p><strong>Precio:</strong> {currencyInfo?.[1].symbol}{productData.price} {productData.currency}</p>
              {productData.discountPercentage && productData.discountPercentage > 0 && (
                <p><strong>Descuento:</strong> {productData.discountPercentage}%</p>
              )}
              <p><strong>Stock:</strong> {productData.stock}</p>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Imágenes */}
          {productData.images && productData.images.length > 0 && (
            <>
              <div>
                <h3 className="font-semibold mb-2 text-white">Imágenes ({productData.images.length})</h3>
                <div className="grid grid-cols-4 gap-2">
                  {productData.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Producto ${index + 1}`}
                      className="w-full aspect-square object-cover rounded bg-black/20"
                    />
                  ))}
                </div>
              </div>
              <Separator className="bg-white/10" />
            </>
          )}

          {/* Envíos */}
          <div>
            <h3 className="font-semibold mb-2 text-white">Configuración de Envíos</h3>
            {productData.shippingEnabled ? (
              <div className="space-y-1 text-sm text-white/80">
                <p><strong>Tipo:</strong> {
                  productData.shippingType === 'by_zone' ? 'Por zonas específicas' :
                  productData.shippingType === 'nationwide' ? 'A todo el país' :
                  'Solo recojo en tienda'
                }</p>
                {productData.shippingType === 'by_zone' && (
                  <p><strong>Zonas configuradas:</strong> {productData.shippingZones?.length || 0}</p>
                )}
                {productData.shippingType === 'nationwide' && productData.nationwideShipping && (
                  <p><strong>País:</strong> {productData.nationwideShipping.country}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/60">Envíos deshabilitados</p>
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* SEO */}
          <div>
            <h3 className="font-semibold mb-2 text-white">SEO</h3>
            <div className="space-y-1 text-sm text-white/80">
              <p><strong>Título:</strong> {productData.seoTitle || productData.name}</p>
              <p><strong>Descripción:</strong> {productData.seoDescription || productData.shortDescription}</p>
              <p><strong>Keywords:</strong> {(productData.seoKeywords || []).join(', ') || 'Ninguna'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
