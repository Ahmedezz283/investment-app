import { ForbiddenException } from '@nestjs/common';
import { UserApprovalController } from './user_approval.controller.js';
import { ApprovalDecision } from './user_approval.entity.js';

describe('UserApprovalController', () => {
  let controller: UserApprovalController;
  const userApprovalService = {
    recordDecision: vi.fn(),
    findForRequest: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new UserApprovalController(userApprovalService as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects investors from recording decisions', () => {
    expect(() =>
      controller.decide(
        'request-id',
        { decision: ApprovalDecision.APPROVED },
        { id: 'investor-id', role: 'Investor' } as any,
      ),
    ).toThrow(ForbiddenException);
    expect(userApprovalService.recordDecision).not.toHaveBeenCalled();
  });

  it('records the decision for the authenticated non-investor', () => {
    controller.decide(
      'request-id',
      { decision: ApprovalDecision.APPROVED },
      { id: 'approver-id', role: 'Manager' } as any,
    );

    expect(userApprovalService.recordDecision).toHaveBeenCalledWith(
      'request-id',
      'approver-id',
      ApprovalDecision.APPROVED,
    );
  });
});
