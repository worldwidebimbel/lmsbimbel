declare module "midtrans-client" {
  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CustomerDetails {
    first_name?: string;
    email?: string;
    phone?: string;
  }

  export interface Callbacks {
    finish?: string;
    error?: string;
    pending?: string;
  }

  export interface TransactionParameter {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    callbacks?: Callbacks;
    [key: string]: unknown;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransactionToken(parameter: TransactionParameter): Promise<string>;
    createTransactionRedirectUrl(parameter: TransactionParameter): Promise<string>;
  }

  export interface CoreApiConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export class CoreApi {
    constructor(config: CoreApiConfig);
    transaction: {
      status(orderId: string): Promise<unknown>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };

  export default midtransClient;
}
