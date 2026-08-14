// Type definitions for mercadopago v3.x
// The new SDK exports specific classes instead of a default export

declare module 'mercadopago' {
  export class MercadoPagoConfig {
    constructor(options: { accessToken: string; options?: any });
  }

  export class Preference {
    constructor(client: MercadoPagoConfig);
    create(params: { body: any }): Promise<any>;
    update(params: { id: string; body: any }): Promise<any>;
    get(params: { id: string }): Promise<any>;
  }

  export class Payment {
    constructor(client: MercadoPagoConfig);
    get(params: { id: string }): Promise<any>;
    create(params: { body: any }): Promise<any>;
    update(params: { id: string; body: any }): Promise<any>;
    search(params: { options: any }): Promise<any>;
  }

  export class MerchantOrder {
    constructor(client: MercadoPagoConfig);
    get(params: { id: string }): Promise<any>;
  }

  export class Customer {
    constructor(client: MercadoPagoConfig);
    create(params: { body: any }): Promise<any>;
    get(params: { id: string }): Promise<any>;
    update(params: { id: string; body: any }): Promise<any>;
  }
}
