import { NextRequest, NextResponse } from 'next/server';
import MercadoPago from 'mercadopago';

// Configurar Mercado Pago
const mp = new MercadoPago(process.env.MERCADOPAGO_ACCESS_TOKEN || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      orderItems, 
      totalAmount, 
      currency, 
      buyerEmail,
      buyerName,
      buyerPhone,
    } = body;

    // Validar datos requeridos
    if (!orderId || !orderItems || !totalAmount || !buyerEmail) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Mapeo de monedas (Mercado Pago usa códigos ISO estándar)
    const currencyMap: Record<string, string> = {
      PEN: 'PEN', // Soles peruanos
      CLP: 'CLP', // Pesos chilenos
      COP: 'COP', // Pesos colombianos
      MXN: 'MXN', // Pesos mexicanos
      BRL: 'BRL', // Reales brasileños
      ARS: 'ARS', // Pesos argentinos
      USD: 'USD', // Dólares
      EUR: 'EUR', // Euros
    };

    // Usar la divisa proporcionada o la del primer item, con fallback a PEN
    // IMPORTANTE: Todos los items deben tener la misma divisa en Mercado Pago
    const itemCurrency = currency || orderItems[0]?.currency || 'PEN';
    const mpCurrency = currencyMap[itemCurrency] || 'PEN';

    console.log('💱 [MERCADOPAGO] Currency info:', {
      providedCurrency: currency,
      firstItemCurrency: orderItems[0]?.currency,
      selectedCurrency: itemCurrency,
      mpCurrency,
    });

    // Construir items para Mercado Pago según la documentación oficial
    // IMPORTANTE: 
    // 1. Solo incluir campos requeridos (title, quantity, unit_price, currency_id)
    // 2. Todos los items DEBEN tener la misma currency_id
    const items = orderItems.map((item: any) => ({
      title: item.name || 'Producto',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      currency_id: mpCurrency, // Todos los items usan la misma divisa
    }));

    // URL base - usar NEXT_PUBLIC_SITE_URL (dev: túnel, prod: dominio)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Validar que siteUrl sea una URL válida
    try {
      new URL(siteUrl);
    } catch (error) {
      console.error('❌ [MERCADOPAGO] Invalid siteUrl:', siteUrl);
      throw new Error(`URL base inválida: ${siteUrl}. Verifica NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_BASE_URL`);
    }

    // Construir back_urls (snake_case es requerido)
    const backUrls = {
      success: `${siteUrl}/tienda/pago-exitoso?orderId=${orderId}`,
      failure: `${siteUrl}/tienda/pago-fallido?orderId=${orderId}`,
      pending: `${siteUrl}/tienda/pago-pendiente?orderId=${orderId}`,
    };

    // Validar formato de URLs
    try {
      new URL(backUrls.success);
      new URL(backUrls.failure);
      new URL(backUrls.pending);
    } catch (error) {
      console.error('❌ [MERCADOPAGO] Invalid return URLs:', backUrls);
      throw new Error('Las URLs de retorno no tienen un formato válido');
    }

    // Webhook URL - debe ser pública (https) en producción
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${siteUrl}/api/mercadopago/webhook`;

    const preferenceBody: any = {
      items,
      payer: {
        name: buyerName || '',
        email: buyerEmail,
        phone: { 
          number: buyerPhone || '' 
        },
      },
      external_reference: orderId,
      back_urls: backUrls,  // snake_case es requerido
      auto_return: 'approved', // Requiere que back_urls.success esté definido
      notification_url: webhookUrl,
    };

    console.log('📋 [MERCADOPAGO] Creating preference:', {
      itemsCount: items.length,
      totalAmount,
      currency: mpCurrency,
      back_urls: backUrls,
      auto_return: 'approved',
      siteUrl,
    });

    // Log del body que se enviará (para debugging)
    console.log('📦 [MERCADOPAGO] Request body structure:', {
      hasItems: Array.isArray(preferenceBody.items) && preferenceBody.items.length > 0,
      itemsStructure: preferenceBody.items.map((it: any) => ({
        hasTitle: !!it.title,
        hasQuantity: typeof it.quantity === 'number',
        hasUnitPrice: typeof it.unit_price === 'number',
        hasCurrencyId: !!it.currency_id,
        currencyId: it.currency_id,
      })),
      hasPayer: !!preferenceBody.payer,
      hasBackUrls: !!preferenceBody.back_urls,
      backUrlsSuccess: preferenceBody.back_urls?.success,
      backUrlsKeys: preferenceBody.back_urls ? Object.keys(preferenceBody.back_urls) : [],
      hasAutoReturn: preferenceBody.auto_return === 'approved',
      autoReturnValue: preferenceBody.auto_return,
      hasExternalReference: !!preferenceBody.external_reference,
      hasNotificationUrl: !!preferenceBody.notification_url,
    });

    // Log del objeto completo serializado (para verificar la estructura exacta)
    console.log('🔍 [MERCADOPAGO] Serialized body (first 500 chars):', JSON.stringify(preferenceBody).substring(0, 500));

    // Crear la preferencia
    const mpResponse = await mp.createPreference(preferenceBody);
    const response = (mpResponse as any)?.response ?? mpResponse;

    console.log('✅ [MERCADOPAGO] Preferencia creada:', response.id);
    console.log('🔗 [MERCADOPAGO] Init Point:', response.init_point);
    console.log('🔗 [MERCADOPAGO] Sandbox Init Point:', response.sandbox_init_point);

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point, // URL para redirigir al usuario (producción)
      sandboxInitPoint: response.sandbox_init_point, // URL para testing (sandbox)
    });

  } catch (error: any) {
    console.error('❌ [MERCADOPAGO] Error creating preference:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear la preferencia de pago',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


