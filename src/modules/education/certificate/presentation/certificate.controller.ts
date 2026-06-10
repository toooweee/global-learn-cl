import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@/libs/auth/decorators/public.decorator';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { GetMyCertificatesQuery } from '@/modules/education/certificate/application/queries/get-my-certificates/get-my-certificates.query';
import { GetCertificateQuery } from '@/modules/education/certificate/application/queries/get-certificate/get-certificate.query';
import { CertificateResponseDto } from './dto/certificate.response.dto';

@ApiTags('certificates')
@Controller()
export class CertificateController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me/certificates')
  @ApiOperation({ summary: 'List my course completion certificates' })
  @ApiOkResponse({ type: [CertificateResponseDto] })
  getMyCertificates(): Promise<CertificateResponseDto[]> {
    return this.queryBus.execute(new GetMyCertificatesQuery());
  }

  @Get('certificates/:id')
  @Public()
  @ApiOperation({
    summary: 'Get certificate by ID (public — for verification)',
  })
  @ApiOkResponse({ type: CertificateResponseDto })
  @ApiNotFoundResponse()
  getCertificate(
    @Param() { id }: IdRequestDto,
  ): Promise<CertificateResponseDto> {
    return this.queryBus.execute(new GetCertificateQuery(id));
  }
}
