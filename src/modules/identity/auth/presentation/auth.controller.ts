import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetMeQuery } from '@/modules/identity/auth/application/queries/get-me/get-me.query';
import { GetMyProfileQuery } from '@/modules/identity/auth/application/queries/get-my-profile/get-my-profile.query';
import { MeResponseDto } from '@/modules/identity/auth/presentation/dto/me.response.dto';
import { MyProfileResponseDto } from '@/modules/identity/auth/presentation/dto/my-profile.response.dto';
import type { Request, Response } from 'express';
import { Public } from '@/libs/auth/decorators/public.decorator';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';
import { UserAgent } from '@/libs/api/decorators/user-agent.decorator';
import { Cookies } from '@/libs/api/decorators/cookie.decorator';
import { cookieFactory } from '@/libs/api/cookie/cookie-factory';
import { IdResponseDto } from '@/libs/api/dto';
import { RegisterRequestDto } from '@/modules/identity/auth/presentation/dto/register.request.dto';
import { LoginRequestDto } from '@/modules/identity/auth/presentation/dto/login.request.dto';
import { CompleteRegistrationRequestDto } from '@/modules/identity/auth/presentation/dto/complete-registration.request.dto';
import { ChangePasswordRequestDto } from '@/modules/identity/auth/presentation/dto/change-password.request.dto';
import { RegisterCommand } from '@/modules/identity/auth/application/register/register.command';
import { LoginCommand } from '@/modules/identity/auth/application/login/login.command';
import { CompleteRegistrationCommand } from '@/modules/identity/auth/application/complete-registration/complete-registration.command';
import { ChangePasswordCommand } from '@/modules/identity/auth/application/change-password/change-password.command';
import { LogoutCommand } from '@/modules/identity/auth/application/logout/logout.command';
import { RefreshTokenCommand } from '@/modules/identity/auth/application/refresh-tokens/refresh-token.command';
import type { TokenIssuance } from '@/modules/identity/token/token.service';
import { cookieConstants } from '@/libs/api/decorators/cookie.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ type: MeResponseDto })
  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload): Promise<MeResponseDto> {
    return this.queryBus.execute<GetMeQuery, MeResponseDto>(
      new GetMeQuery(user.userId),
    );
  }

  @ApiOperation({
    summary:
      'Get full profile of current user (user + role + employee + division + department + position)',
  })
  @ApiOkResponse({ type: MyProfileResponseDto })
  @Get('me/profile')
  async myProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MyProfileResponseDto> {
    return this.queryBus.execute<GetMyProfileQuery, MyProfileResponseDto>(
      new GetMyProfileQuery(user.userId),
    );
  }

  @ApiOperation({ summary: 'Register a new employee (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiConflictResponse({})
  @Roles('Admin')
  @Post('register')
  async register(@Body() body: RegisterRequestDto): Promise<IdResponseDto> {
    const userId = await this.commandBus.execute<RegisterCommand, string>(
      new RegisterCommand(body),
    );
    return new IdResponseDto(userId);
  }

  @ApiOperation({ summary: 'Set password for invited employee' })
  @ApiOkResponse()
  @Public()
  @Post('complete-registration')
  async completeRegistration(
    @Body() body: CompleteRegistrationRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<CompleteRegistrationCommand, void>(
      new CompleteRegistrationCommand(body),
    );
  }

  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiUnauthorizedResponse({})
  @Public()
  @Post('login')
  async login(
    @Body() body: LoginRequestDto,
    @UserAgent() userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IdResponseDto> {
    const issuance = await this.commandBus.execute<LoginCommand, TokenIssuance>(
      new LoginCommand({ ...body, userAgent }),
    );

    const cookies = cookieFactory(req, res);
    cookies.set(
      cookieConstants.ACCESS_TOKEN,
      issuance.accessToken,
      issuance.accessTokenMaxAge,
    );
    cookies.set(
      cookieConstants.REFRESH_TOKEN,
      issuance.refreshTokenCookie,
      issuance.refreshTokenMaxAge,
    );

    return new IdResponseDto(issuance.userId);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiUnauthorizedResponse({})
  @Public()
  @Post('refresh')
  async refreshTokens(
    @Cookies(cookieConstants.REFRESH_TOKEN) refreshTokenCookie: string,
    @UserAgent() userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IdResponseDto> {
    const issuance = await this.commandBus.execute<
      RefreshTokenCommand,
      TokenIssuance
    >(new RefreshTokenCommand({ refreshTokenCookie, userAgent }));

    const cookies = cookieFactory(req, res);
    cookies.set(
      cookieConstants.ACCESS_TOKEN,
      issuance.accessToken,
      issuance.accessTokenMaxAge,
    );
    cookies.set(
      cookieConstants.REFRESH_TOKEN,
      issuance.refreshTokenCookie,
      issuance.refreshTokenMaxAge,
    );

    return new IdResponseDto(issuance.userId);
  }

  @ApiOperation({
    summary: 'Logout (invalidate refresh token for this device)',
  })
  @ApiOkResponse()
  @Post('logout')
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @UserAgent() userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute<LogoutCommand, void>(
      new LogoutCommand({ userId: user.userId, userAgent }),
    );

    const cookies = cookieFactory(req, res);
    cookies.remove(cookieConstants.ACCESS_TOKEN);
    cookies.remove(cookieConstants.REFRESH_TOKEN);
  }

  @ApiOperation({ summary: 'Change password (invalidates all sessions)' })
  @ApiOkResponse()
  @Post('change-password')
  async changePassword(
    @Body() body: ChangePasswordRequestDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute<ChangePasswordCommand, void>(
      new ChangePasswordCommand({
        userId: user.userId,
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
      }),
    );

    const cookies = cookieFactory(req, res);
    cookies.remove(cookieConstants.ACCESS_TOKEN);
    cookies.remove(cookieConstants.REFRESH_TOKEN);
  }
}
