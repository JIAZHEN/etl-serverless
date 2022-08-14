export interface EtlRule {
  merchantId: string;
  partnerId: string;
  id: string;
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
