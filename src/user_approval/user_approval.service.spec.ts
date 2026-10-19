import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserApprovalService } from './user_approval.service.js';
import { UserApproval } from './user_approval.entity.js';
import { User } from '../user/user-entity.js';
import { Department } from '../department/departments.entity.js';
import { InvestmentRequestsService } from '../investment-requests/investment-requests.service.js';
import { FlowableService } from '../flowable/flowable.service.js';

describe('UserApprovalService', () => {
  let service: UserApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApprovalService,
        {
          provide: getRepositoryToken(UserApproval),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Department),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: InvestmentRequestsService,
          useValue: {
            findOne: vi.fn(),
            update: vi.fn(),
          },
        },
        {
          provide: FlowableService,
          useValue: {
            getTasksForCandidateGroup: vi.fn(),
            completeTask: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserApprovalService>(UserApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
