import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentRequestsController } from './investment-requests.controller.js';
import { InvestmentRequestsService } from './investment-requests.service.js';

describe('InvestmentRequestsController', () => {
  let controller: InvestmentRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentRequestsController],
      providers: [
        {
          provide: InvestmentRequestsService,
          useValue: {
            create: vi.fn(),
            startFlow: vi.fn(),
            evaluate: vi.fn(),
            getProcess: vi.fn(),
            getTasks: vi.fn(),
            completeTask: vi.fn(),
            findAll: vi.fn(),
            requestReport: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvestmentRequestsController>(InvestmentRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
