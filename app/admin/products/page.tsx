'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  MapPin
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

const STEPS = [
  { id: 'basic', title: 'Información Básica' },
  { id: 'multimedia', title: 'Multimedia' },
  { id: 'shipping', title: 'Configuración de Envíos' },
  { id: 'seo', title: 'SEO' },
  { id: 'review', title: 'Revisión' },
];

export default function ProductsAdminPage() {
  return (
    <AuthGuard>
      <ProductsAdminContent />
    </AuthGuard>
  );
}

function ProductsAdminContent() {
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
      const allProducts = await productsCollection.getAll();
      setProducts(allProducts as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
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
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
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
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      alert(publishNow ? 'Producto publicado exitosamente' : 'Producto guardado como borrador');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el catálogo de la tienda</p>
        </div>
        <Button onClick={handleCreateProduct} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Crear Producto
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No hay productos</h2>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'No se encontraron productos con ese término' : 'Comienza creando tu primer producto'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Producto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-muted relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {!product.isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">Borrador</Badge>
                  </div>
                )}
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive">-{product.discountPercentage}%</Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.shortDescription}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold">
                      {Object.values(SUPPORTED_CURRENCIES).find(c => Object.keys(SUPPORTED_CURRENCIES).find(k => k === product.currency))?.symbol || product.currency}
                      {product.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {product.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <DialogHeader className="px-8 py-6 border-b flex-shrink-0">
              <DialogTitle className="text-2xl font-bold">
                {isCreateDialogOpen ? 'Crear Nuevo Producto' : 'Editar Producto'}
              </DialogTitle>
              
              {/* Steps */}
              <div className="flex items-center gap-4 mt-4">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden md:inline">
                      {step.title}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className="w-8 h-0.5 bg-muted mx-2" />
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
            <div className="px-8 py-4 border-t flex justify-between items-center flex-shrink-0">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
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
                    >
                      Guardar como Borrador
                    </Button>
                    <Button
                      onClick={() => handleSaveProduct(true)}
                      disabled={saving}
                    >
                      {saving ? 'Publicando...' : 'Publicar Producto'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={nextStep}>
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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

  switch (currentStep) {
    case 0: // Información Básica
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre del Producto *</Label>
              <Input
                value={productData.name || ''}
                onChange={(e) => updateProductData('name', e.target.value)}
                placeholder="Ej: Polo Ultra Peru 2025"
              />
            </div>

            <div>
              <Label>Slug</Label>
              <Input
                value={productData.slug || ''}
                onChange={(e) => updateProductData('slug', e.target.value)}
                placeholder="Auto-generado"
                disabled
              />
            </div>
          </div>

          <div>
            <Label>Descripción Corta *</Label>
            <Textarea
              value={productData.shortDescription || ''}
              onChange={(e) => updateProductData('shortDescription', e.target.value)}
              placeholder="Breve descripción del producto (1-2 líneas)"
              rows={2}
            />
          </div>

          <div>
            <Label>Descripción Completa *</Label>
            <Textarea
              value={productData.description || ''}
              onChange={(e) => updateProductData('description', e.target.value)}
              placeholder="Descripción detallada del producto"
              rows={6}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label>Precio *</Label>
              <Input
                type="number"
                value={productData.price || 0}
                onChange={(e) => updateProductData('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Divisa *</Label>
              <Select
                value={productData.currency || 'PEN'}
                onValueChange={(value) => updateProductData('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                    <SelectItem key={code} value={code}>
                      {info.symbol} {info.name} ({code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                value={productData.discountPercentage || 0}
                onChange={(e) => updateProductData('discountPercentage', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Stock *</Label>
              <Input
                type="number"
                value={productData.stock || 0}
                onChange={(e) => updateProductData('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Categoría *</Label>
              <Select
                value={productData.categoryId || ''}
                onValueChange={(value) => updateProductData('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label>Marca</Label>
              <Input
                value={productData.brand || ''}
                onChange={(e) => updateProductData('brand', e.target.value)}
                placeholder="Ej: Nike"
              />
            </div>

            <div>
              <Label>Artista</Label>
              <Input
                value={productData.artist || ''}
                onChange={(e) => updateProductData('artist', e.target.value)}
                placeholder="Ej: Boris Brejcha"
              />
            </div>

            <div>
              <Label>Género</Label>
              <Select
                value={productData.gender || ''}
                onValueChange={(value) => updateProductData('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
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
        />
      );

    case 3: // SEO
      return (
        <SEOStep
          productData={productData}
          updateProductData={updateProductData}
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

// Paso de Multimedia
function MultimediaStep({
  productData,
  updateProductData,
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
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
      <div>
        <Label>Imágenes del Producto</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Sube hasta 5 imágenes del producto. La primera será la imagen principal.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {(productData.images || []).map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={image} alt={`Producto ${index + 1}`} className="w-full h-full object-cover" />
              {index === 0 && (
                <Badge className="absolute top-2 left-2">Principal</Badge>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleImageRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
          />
        )}
      </div>

      <Separator />

      <div>
        <Label>URL del Video (Opcional)</Label>
        <Input
          value={productData.videoUrl || ''}
          onChange={(e) => updateProductData('videoUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
}

// Paso de Configuración de Envíos
function ShippingStep({
  productData,
  updateProductData,
  countries,
  states,
  loadStates,
  loadingLocations,
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
  countries: CountryData[];
  states: StateData[];
  loadStates: (code: string) => void;
  loadingLocations: boolean;
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
      <div>
        <Label>¿Habilitar envíos?</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            checked={productData.shippingEnabled}
            onCheckedChange={(checked) => updateProductData('shippingEnabled', checked)}
          />
          <span className="text-sm">Sí, este producto se puede enviar</span>
        </div>
      </div>

      {productData.shippingEnabled && (
        <>
          <Separator />

          <div>
            <Label>Tipo de Envío *</Label>
            <Select
              value={productData.shippingType || 'nationwide'}
              onValueChange={(value) => updateProductData('shippingType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zonas de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agregar nueva zona */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>País</Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={(value) => {
                          setSelectedCountry(value);
                          loadStates(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona país" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Estado/Región</Label>
                      <Select
                        value={selectedState}
                        onValueChange={setSelectedState}
                        disabled={!selectedCountry || loadingLocations}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona región" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <div>
                      <Label>Costo de Envío</Label>
                      <Input
                        type="number"
                        value={zoneCost}
                        onChange={(e) => setZoneCost(parseFloat(e.target.value) || 0)}
                        placeholder={`Por defecto: ${(productData.price || 0) * 0.1}`}
                      />
                    </div>

                    <div>
                      <Label>Días Estimados</Label>
                      <Input
                        type="number"
                        value={zoneDays}
                        onChange={(e) => setZoneDays(parseInt(e.target.value) || 5)}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={zoneFreeShipping}
                      onCheckedChange={(checked) => setZoneFreeShipping(checked as boolean)}
                    />
                    <Label>Envío gratuito para esta zona</Label>
                  </div>

                  <Button onClick={addShippingZone} disabled={!selectedCountry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Zona
                  </Button>
                </div>

                {/* Lista de zonas */}
                {productData.shippingZones && productData.shippingZones.length > 0 && (
                  <div className="space-y-2">
                    {productData.shippingZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{zone.country} {zone.state ? `- ${zone.state}` : ''}</p>
                          <p className="text-sm text-muted-foreground">
                            {zone.isFreeShipping ? 'Envío gratuito' : `Costo: ${zone.shippingCost}`} • {zone.estimatedDays} días
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeShippingZone(zone.id)}>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Envío Nacional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>País</Label>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Costo de Envío</Label>
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
                    />
                  </div>

                  <div>
                    <Label>Días Estimados</Label>
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
                  />
                  <Label>Envío gratuito</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solo Recojo en Tienda */}
          {productData.shippingType === 'store_pickup_only' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recojo en Tienda</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Dirección de la Tienda</Label>
                  <Textarea
                    value={productData.storePickupAddress || ''}
                    onChange={(e) => updateProductData('storePickupAddress', e.target.value)}
                    placeholder="Ingresa la dirección completa donde el cliente puede recoger el producto"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
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

// Paso de SEO
function SEOStep({
  productData,
  updateProductData,
}: {
  productData: Partial<Product>;
  updateProductData: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Título SEO</Label>
        <Input
          value={productData.seoTitle || ''}
          onChange={(e) => updateProductData('seoTitle', e.target.value)}
          placeholder={productData.name || 'Título del producto'}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(productData.seoTitle || '').length} / 60 caracteres recomendados
        </p>
      </div>

      <div>
        <Label>Descripción SEO</Label>
        <Textarea
          value={productData.seoDescription || ''}
          onChange={(e) => updateProductData('seoDescription', e.target.value)}
          placeholder={productData.shortDescription || 'Descripción del producto'}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(productData.seoDescription || '').length} / 160 caracteres recomendados
        </p>
      </div>

      <div>
        <Label>Palabras Clave SEO</Label>
        <Input
          value={(productData.seoKeywords || []).join(', ')}
          onChange={(e) => {
            const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
            updateProductData('seoKeywords', keywords);
          }}
          placeholder="polo, festival, música, electrónica"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separa las palabras clave con comas
        </p>
      </div>
    </div>
  );
}

// Paso de Revisión
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
      <Card>
        <CardHeader>
          <CardTitle>Revisión Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información Básica */}
          <div>
            <h3 className="font-semibold mb-2">Información Básica</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Nombre:</strong> {productData.name}</p>
              <p><strong>Categoría:</strong> {category?.name}</p>
              <p><strong>Precio:</strong> {currencyInfo?.[1].symbol}{productData.price} {productData.currency}</p>
              {productData.discountPercentage && productData.discountPercentage > 0 && (
                <p><strong>Descuento:</strong> {productData.discountPercentage}%</p>
              )}
              <p><strong>Stock:</strong> {productData.stock}</p>
            </div>
          </div>

          <Separator />

          {/* Imágenes */}
          {productData.images && productData.images.length > 0 && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Imágenes ({productData.images.length})</h3>
                <div className="grid grid-cols-4 gap-2">
                  {productData.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Producto ${index + 1}`}
                      className="w-full aspect-square object-cover rounded"
                    />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Envíos */}
          <div>
            <h3 className="font-semibold mb-2">Configuración de Envíos</h3>
            {productData.shippingEnabled ? (
              <div className="space-y-1 text-sm">
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
              <p className="text-sm text-muted-foreground">Envíos deshabilitados</p>
            )}
          </div>

          <Separator />

          {/* SEO */}
          <div>
            <h3 className="font-semibold mb-2">SEO</h3>
            <div className="space-y-1 text-sm">
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






