import { Query } from '@/libs/application/query.base';

export class GetCertificateQuery extends Query {
  readonly certificateId: string;

  constructor(certificateId: string) {
    super();
    this.certificateId = certificateId;
  }
}
