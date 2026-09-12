/**
 * Error message translations and user-friendly messages
 */

// Mapeo de campos técnicos a nombres legibles
const FIELD_TRANSLATIONS: Record<string, string> = {
  'userUploadedProofUrl': 'comprobante de pago',
  'installmentId': 'identificador de cuota',
  'transactionId': 'identificador de transacción',
  'paymentProofUrl': 'comprobante',
  'userId': 'usuario',
  'eventId': 'evento',
  'ticketId': 'ticket',
  'adminApproved': 'aprobación del administrador',
  'dueDate': 'fecha de vencimiento',
  'amount': 'monto',
  'status': 'estado',
  'rejectionReason': 'motivo de rechazo',
};

// Mensajes comunes de error traducidos
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'No autenticado': 'Debes iniciar sesión para realizar esta acción',
  'Unauthorized': 'No tienes permiso para realizar esta acción',
  'Not authenticated': 'Debes iniciar sesión para continuar',

  // Not found errors
  'not found': 'no encontrado',
  'does not exist': 'no existe',
  'Not found': 'No encontrado',

  // Validation errors
  'is required': 'es obligatorio',
  'is missing': 'falta',
  'Invalid': 'Inválido',
  'invalid': 'inválido',

  // Firebase errors
  'permission-denied': 'No tienes permiso para acceder a este recurso',
  'unavailable': 'Servicio temporalmente no disponible. Intenta de nuevo.',
  'already-exists': 'Ya existe un registro con estos datos',

  // Network errors
  'Network error': 'Error de conexión. Verifica tu internet.',
  'Failed to fetch': 'Error de conexión. Verifica tu internet.',
};

/**
 * Translate technical error messages to user-friendly Spanish
 */
export function translateError(error: string | Error): string {
  const errorMessage = typeof error === 'string' ? error : error.message;

  if (!errorMessage) {
    return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }

  let translated = errorMessage;

  // Replace technical field names with user-friendly terms
  Object.entries(FIELD_TRANSLATIONS).forEach(([technical, friendly]) => {
    const regex = new RegExp(technical, 'gi');
    translated = translated.replace(regex, friendly);
  });

  // Replace common error patterns
  Object.entries(ERROR_MESSAGES).forEach(([pattern, replacement]) => {
    if (translated.includes(pattern)) {
      translated = translated.replace(pattern, replacement);
    }
  });

  // Capitalize first letter
  translated = translated.charAt(0).toUpperCase() + translated.slice(1);

  return translated;
}

/**
 * Get user-friendly error message for specific contexts
 */
export const ErrorMessages = {
  // Installment errors
  installment: {
    notFound: 'No se encontró la cuota solicitada',
    alreadyPaid: 'Esta cuota ya ha sido pagada',
    alreadyRejected: 'Esta cuota ya fue rechazada',
    noProof: 'Debes subir un comprobante de pago antes de continuar',
    notOwner: 'No tienes permiso para modificar esta cuota',
    notActive: 'Debes pagar las cuotas en orden. Esta cuota no está disponible aún.',
    uploadFailed: 'Error al subir el comprobante. Verifica el archivo y vuelve a intentar.',
    alreadyProcessed: 'Esta cuota ya fue procesada',
  },

  // Ticket errors
  ticket: {
    notFound: 'No se encontró el ticket solicitado',
    expired: 'Este ticket ha expirado. Crea una nueva solicitud.',
    notOwner: 'No tienes permiso para acceder a este ticket',
    alreadyProcessed: 'Este ticket ya fue procesado',
    noInventory: 'No hay entradas disponibles para esta zona',
  },

  // Payment errors
  payment: {
    failed: 'El pago no pudo procesarse. Intenta de nuevo.',
    invalidAmount: 'El monto de pago no es válido',
    alreadyPaid: 'Este pago ya fue procesado',
    invalidProof: 'El comprobante de pago no es válido',
  },

  // Auth errors
  auth: {
    notAuthenticated: 'Debes iniciar sesión para continuar',
    notAuthorized: 'No tienes permiso para realizar esta acción',
    sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
  },

  // Generic
  generic: {
    unexpected: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    networkError: 'Error de conexión. Verifica tu internet y vuelve a intentar.',
    serverError: 'Error del servidor. Nuestro equipo ha sido notificado.',
  }
};
