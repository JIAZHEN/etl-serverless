export interface EtlResult {
  total: number;
  valid: number;
  invalid: number;
  errors: {
    [key: string]: any;
  };
}

export interface EtlRecord {
  merchantId: string;
  partnerId: string;
  id: string;
  s3Key: string;
  etlStatus: string;
  etlResult: EtlResult;
  [key: string]: any;
}
