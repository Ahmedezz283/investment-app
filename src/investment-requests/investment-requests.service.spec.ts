import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentRequestsService } from './investment-requests.service.js';

describe('InvestmentRequestsService', () => {
  let service: InvestmentRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvestmentRequestsService],
    }).compile();

    service = module.get<InvestmentRequestsService>(InvestmentRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
