import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller.js';
import { NotificationsService } from './notification.service.js';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            publishMissingData: vi.fn(),
            publishRejection: vi.fn(),
            publishApproval: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
