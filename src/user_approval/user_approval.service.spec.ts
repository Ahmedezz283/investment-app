import { Test, TestingModule } from '@nestjs/testing';
import { UserApprovalService } from './user_approval.service.js';

describe('UserApprovalService', () => {
  let service: UserApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserApprovalService],
    }).compile();

    service = module.get<UserApprovalService>(UserApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
