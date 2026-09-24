import { Test, TestingModule } from '@nestjs/testing';
import { GorulesController } from './gorules.controller.js';
import { GoRulesService } from './gorules.service.js';

describe('GorulesController', () => {
  let controller: GorulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GorulesController],
      providers: [
        {
          provide: GoRulesService,
          useValue: {
            create: vi.fn(),
            evaluate: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GorulesController>(GorulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
