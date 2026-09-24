import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateUserApprovalDto } from './dto/create-user-approval-dto.js';
import { UserApprovalService } from './user_approval.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Controller('investment-requests/:requestId/approvals')
export class UserApprovalController {
  constructor(private readonly userApprovalService: UserApprovalService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  decide(
    @Param('requestId') requestId: string,
    @Body() dto: CreateUserApprovalDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const roles = [currentUser.role, ...(currentUser.roles ?? [])]
      .filter(Boolean)
      .map((role) => role.trim().toLowerCase());

    if (roles.includes('investor')) {
      throw new ForbiddenException('Investors cannot approve investment requests.');
    }

    return this.userApprovalService.recordDecision(
      requestId,
      currentUser.id,
      dto.decision,
    );
  }

  @Get()
  findForRequest(@Param('requestId') requestId: string) {
    return this.userApprovalService.findForRequest(requestId);
  }
}