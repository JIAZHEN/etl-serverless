export interface EtlCreateInput {
  merchantId: string;
  partnerId: string;
  s3Key: string;
  [key: string]: any;
  etlStatus: string;
}

export interface Etl {
  merchantId: string;
  partnerId: string;
  id: string;
  s3Key: string;
  etlStatus: string;
  etlResult: {
    total: number;
    valid: number;
    invalid: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RuleEvent {
  type: string;
  params: {
    [key: string]: any;
  };
}
