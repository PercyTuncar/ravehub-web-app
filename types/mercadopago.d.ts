declare module 'mercadopago' {
  class MercadoPago {
    constructor(accessToken: string);
    sandboxMode(enable?: boolean): boolean;
    getAccessToken(): Promise<string>;
    get(req: { uri: string; params?: any; authenticate?: boolean } | string, params?: any, authenticate?: boolean): Promise<any>;
    post(req: any): Promise<any>;
    put(req: any): Promise<any>;
    delete(req: any): Promise<any>;
    createPreference(preference: any): Promise<any>;
    updatePreference(id: string, preference: any): Promise<any>;
    getPreference(id: string): Promise<any>;
    getPayment(id: string): Promise<any>;
    getPaymentInfo(id: string): Promise<any>;
  }

  export default MercadoPago;
}
