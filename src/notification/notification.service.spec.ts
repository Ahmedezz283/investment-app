import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NOTIFICATIONS_KAFKA_CLIENT } from '../kafka/kafka.module.js';
import { NotificationsService } from './notification.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const kafkaClient = {
    subscribeToResponseOf: vi.fn(),
    connect: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NOTIFICATIONS_KAFKA_CLIENT, useValue: kafkaClient },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs Kafka connection failures without throwing a secondary error', async () => {
    const error = new Error('Broker unavailable');
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    kafkaClient.connect.mockRejectedValue(error);

    await service.onModuleInit();

    expect(loggerError).toHaveBeenCalledWith('Kafka client connect failed', error);
    expect(kafkaClient.subscribeToResponseOf).not.toHaveBeenCalled();
  });
});
