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
    const ignoredRoles = new Set([
      'investor',
      'default-roles-investment',
      'offline_access',
      'uma_authorization',
    ]);

    const roles = [currentUser.role, ...(currentUser.roles ?? [])]
      .filter(Boolean)
      .map((role) => role.trim().toLowerCase());

    const hasNonInvestorRole = roles.some((role) => !ignoredRoles.has(role));

    if (!hasNonInvestorRole) {
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