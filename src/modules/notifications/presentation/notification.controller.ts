import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { PaginatedResponseDto } from '@/libs/api/dto/paginated.response.dto';
import { NotificationService } from '../notification.service';
import { NotificationResponseDto } from './dto/notification.response.dto';

@ApiTags('notifications')
@Controller('me/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findMine(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const userId = RequestContextService.getUserId()!;
    const offset = (query.page - 1) * query.limit;

    const [rows, count] = await Promise.all([
      this.notificationService.findByUser(userId, query.limit, offset),
      this.notificationService.countByUser(userId),
    ]);

    return new PaginatedResponseDto({
      count,
      limit: query.limit,
      page: query.page,
      data: rows.map((r) => new NotificationResponseDto(r)),
    });
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiNoContentResponse()
  async markRead(@Param() { id }: IdRequestDto): Promise<void> {
    const userId = RequestContextService.getUserId()!;
    await this.notificationService.markRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse()
  async markAllRead(): Promise<void> {
    const userId = RequestContextService.getUserId()!;
    await this.notificationService.markAllRead(userId);
  }
}
