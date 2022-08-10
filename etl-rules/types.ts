export interface MerchantRule {
  merchantId: string;
  partnerId: string;
  uuid: string;
  rule: {
    fact: string;
    operator: string;
    value: string | number;
  };
  event: {
    type: string;
    params: {
      [key: string]: any;
    };
  };
  [key: string]: any;
}
