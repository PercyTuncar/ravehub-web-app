'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

const reclamacionSchema = z.object({
  // Identificación del consumidor
  fullName: z.string().min(3, 'Nombre completo es requerido'),
  documentType: z.enum(['DNI', 'CE', 'Pasaporte'], {
    required_error: 'Tipo de documento es requerido',
  }),
  documentNumber: z.string().min(7, 'Número de documento es requerido'),
  address: z.string().min(10, 'Dirección es requerida'),
  phone: z.string().min(9, 'Teléfono es requerido'),
  email: z.string().email('Email inválido'),

  // Identificación del bien/servicio
  goodType: z.enum(['product', 'service'], {
    required_error: 'Tipo de bien es requerido',
  }),
  amount: z.string().min(1, 'Monto es requerido'),
  description: z.string().min(10, 'Descripción del bien/servicio es requerida'),

  // Detalle del reclamo
  claimType: z.enum(['reclamo', 'queja'], {
    required_error: 'Tipo de reclamación es requerido',
  }),
  detail: z.string().min(20, 'Detalle de la reclamación es requerido (mínimo 20 caracteres)'),

  // Pedido del consumidor
  request: z.string().min(10, 'Pedido del consumidor es requerido'),

  // Aceptación
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar los términos',
  }),
});

type ReclamacionFormData = z.infer<typeof reclamacionSchema>;

export default function LibroReclamacionesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [claimNumber, setClaimNumber] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReclamacionFormData>({
    resolver: zodResolver(reclamacionSchema),
  });

  const claimType = watch('claimType');

  const onSubmit = async (data: ReclamacionFormData) => {
    setIsSubmitting(true);
    try {
      // Generate claim number
      const timestamp = Date.now();
      const generatedClaimNumber = `RH-${timestamp}`;

      // Save to Firestore
      await addDoc(collection(db, 'complaints'), {
        ...data,
        claimNumber: generatedClaimNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
        provider: {
          businessName: 'Ravehub',
          ruc: process.env.NEXT_PUBLIC_COMPANY_RUC || 'Por definir',
          address: 'Lima, Perú',
        },
      });

      setClaimNumber(generatedClaimNumber);
      setIsSuccess(true);
      toast.success('Reclamación enviada exitosamente');
      reset();

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Error al enviar la reclamación. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-[#0A0A0A] border-green-500/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <CardTitle className="text-white text-2xl">
                    Reclamación Registrada
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Su reclamación ha sido registrada exitosamente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-500/10 border-green-500/50">
                <AlertDescription className="text-white">
                  <p className="font-semibold mb-2">Número de Reclamación:</p>
                  <p className="text-xl font-mono">{claimNumber}</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-gray-300">
                <p>
                  De acuerdo con lo establecido en el Código de Protección y Defensa del
                  Consumidor, su reclamación será atendida en un plazo máximo e improrrogable
                  de <strong className="text-white">15 días hábiles</strong>.
                </p>
                <p>
                  Recibirá una copia de su reclamación y nuestra respuesta al correo
                  electrónico proporcionado.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  * La formulación de este reclamo no impide acudir a otras vías de solución
                  de controversias ni es requisito previo para interponer una denuncia ante
                  INDECOPI.
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsSuccess(false);
                  reset();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Registrar Otra Reclamación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-12 h-12 text-purple-500" />
            <h1 className="text-4xl font-bold text-white">Libro de Reclamaciones</h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            En cumplimiento del Código de Protección y Defensa del Consumidor (Ley N° 29571)
            y su Reglamento (D.S. N° 011-2011-PCM)
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/50">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-gray-300 ml-2">
            <strong className="text-white">Importante:</strong> La diferencia entre RECLAMO y
            QUEJA es que el reclamo está relacionado con el producto o servicio adquirido,
            mientras que la queja se refiere al servicio de atención al cliente.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sección I: Identificación del Consumidor */}
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">I. Identificación del Consumidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-white">
                  Nombre Completo *
                </Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  className="bg-black border-white/20 text-white"
                  placeholder="Ingrese su nombre completo"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Tipo de Documento *</Label>
                  <RadioGroup defaultValue="DNI" className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="DNI"
                        id="dni"
                        {...register('documentType')}
                        className="border-white/20"
                      />
                      <Label htmlFor="dni" className="text-gray-300 cursor-pointer">
                        DNI
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="CE"
                        id="ce"
                        {...register('documentType')}
                        className="border-white/20"
                      />
                      <Label htmlFor="ce" className="text-gray-300 cursor-pointer">
                        C.E.
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Pasaporte"
                        id="pasaporte"
                        {...register('documentType')}
                        className="border-white/20"
                      />
                      <Label htmlFor="pasaporte" className="text-gray-300 cursor-pointer">
                        Pasaporte
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.documentType && (
                    <p className="text-red-500 text-sm mt-1">{errors.documentType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="documentNumber" className="text-white">
                    Número de Documento *
                  </Label>
                  <Input
                    id="documentNumber"
                    {...register('documentNumber')}
                    className="bg-black border-white/20 text-white"
                    placeholder="Ej: 12345678"
                  />
                  {errors.documentNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.documentNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-white">
                  Dirección *
                </Label>
                <Input
                  id="address"
                  {...register('address')}
                  className="bg-black border-white/20 text-white"
                  placeholder="Ingrese su dirección completa"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-white">
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    className="bg-black border-white/20 text-white"
                    placeholder="Ej: 987654321"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="bg-black border-white/20 text-white"
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección II: Identificación del Bien/Servicio */}
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                II. Identificación del Bien o Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Tipo *</Label>
                <RadioGroup className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="product"
                      id="product"
                      {...register('goodType')}
                      className="border-white/20"
                    />
                    <Label htmlFor="product" className="text-gray-300 cursor-pointer">
                      Producto
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="service"
                      id="service"
                      {...register('goodType')}
                      className="border-white/20"
                    />
                    <Label htmlFor="service" className="text-gray-300 cursor-pointer">
                      Servicio
                    </Label>
                  </div>
                </RadioGroup>
                {errors.goodType && (
                  <p className="text-red-500 text-sm mt-1">{errors.goodType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="amount" className="text-white">
                  Monto Reclamado (S/) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  className="bg-black border-white/20 text-white"
                  placeholder="Ej: 150.00"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Descripción del Producto o Servicio *
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="bg-black border-white/20 text-white min-h-[100px]"
                  placeholder="Describa el producto o servicio adquirido"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección III: Detalle de la Reclamación */}
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">III. Detalle de la Reclamación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Tipo de Reclamación *</Label>
                <RadioGroup className="space-y-3 mt-2">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem
                      value="reclamo"
                      id="reclamo"
                      {...register('claimType')}
                      className="border-white/20 mt-1"
                    />
                    <div>
                      <Label htmlFor="reclamo" className="text-gray-300 cursor-pointer">
                        RECLAMO
                      </Label>
                      <p className="text-sm text-gray-500">
                        Disconformidad relacionada al producto o servicio
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem
                      value="queja"
                      id="queja"
                      {...register('claimType')}
                      className="border-white/20 mt-1"
                    />
                    <div>
                      <Label htmlFor="queja" className="text-gray-300 cursor-pointer">
                        QUEJA
                      </Label>
                      <p className="text-sm text-gray-500">
                        Disconformidad con la atención al cliente
                      </p>
                    </div>
                  </div>
                </RadioGroup>
                {errors.claimType && (
                  <p className="text-red-500 text-sm mt-1">{errors.claimType.message}</p>
                )}
              </div>

              {claimType === 'reclamo' && (
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertDescription className="text-gray-300">
                    Los reclamos serán respondidos en un plazo máximo de 15 días hábiles.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="detail" className="text-white">
                  Detalle de la Reclamación *
                </Label>
                <Textarea
                  id="detail"
                  {...register('detail')}
                  className="bg-black border-white/20 text-white min-h-[150px]"
                  placeholder="Describa detalladamente su reclamo o queja"
                />
                {errors.detail && (
                  <p className="text-red-500 text-sm mt-1">{errors.detail.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección IV: Pedido del Consumidor */}
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">IV. Pedido del Consumidor</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="request" className="text-white">
                  ¿Qué solicita del proveedor? *
                </Label>
                <Textarea
                  id="request"
                  {...register('request')}
                  className="bg-black border-white/20 text-white min-h-[100px]"
                  placeholder="Indique qué solución espera (reembolso, cambio, reparación, etc.)"
                />
                {errors.request && (
                  <p className="text-red-500 text-sm mt-1">{errors.request.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="bg-[#0A0A0A] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  {...register('acceptTerms')}
                  className="mt-1"
                />
                <Label htmlFor="acceptTerms" className="text-gray-300 cursor-pointer text-sm">
                  Declaro que la información proporcionada es verídica y autorizo el
                  tratamiento de mis datos personales conforme a la Ley de Protección de
                  Datos Personales (Ley N° 29733). Asimismo, entiendo que la formulación de
                  este reclamo no impide acudir a otras vías de solución de controversias ni
                  es requisito previo para interponer una denuncia ante INDECOPI. *
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm mt-2">{errors.acceptTerms.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-semibold"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Reclamación'}
          </Button>
        </form>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-[#0A0A0A] border border-white/10 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Datos del Proveedor</h3>
          <div className="text-gray-400 text-sm space-y-1">
            <p>
              <strong className="text-white">Razón Social:</strong> Ravehub
            </p>
            <p>
              <strong className="text-white">Dirección:</strong> Lima, Perú
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Conforme al Art. 150 de la Ley 29571 y D.S. 011-2011-PCM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
