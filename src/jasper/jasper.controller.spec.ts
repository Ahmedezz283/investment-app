import { Test, TestingModule } from '@nestjs/testing';
import { JasperController } from './jasper.controller.js';
import { JasperReportService } from './jasper.service.js';

describe('JasperController', () => {
  let controller: JasperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JasperController],
      providers: [
        {
          provide: JasperReportService,
          useValue: {
            uploadTemplate: vi.fn(),
            listTemplates: vi.fn(),
            generate: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JasperController>(JasperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
