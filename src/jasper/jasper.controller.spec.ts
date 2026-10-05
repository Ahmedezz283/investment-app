import { Test, TestingModule } from '@nestjs/testing';
import { JasperController } from './jasper.controller.js';

describe('JasperController', () => {
  let controller: JasperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JasperController],
    }).compile();

    controller = module.get<JasperController>(JasperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
