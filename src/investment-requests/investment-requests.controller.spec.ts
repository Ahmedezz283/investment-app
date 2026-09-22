import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentRequestsController } from './investment-requests.controller.js';

describe('InvestmentRequestsController', () => {
  let controller: InvestmentRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentRequestsController],
    }).compile();

    controller = module.get<InvestmentRequestsController>(InvestmentRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
