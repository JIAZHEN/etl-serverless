export interface EtlRecordCreateInput {
  merchantId: string;
  partnerId: string;
  s3Key: string;
  [key: string]: any;
  etlStatus: string;
  partnerFile?: {
    filename: string;
    [key: string]: any;
  };
}

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

export interface RuleEvent {
  type: string;
  params: {
    [key: string]: any;
  };
}
