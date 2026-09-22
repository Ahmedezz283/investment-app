import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const NOTIFICATIONS_KAFKA_CLIENT = 'NOTIFICATIONS_KAFKA_CLIENT';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NOTIFICATIONS_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'investment-app',
            brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
          },
          consumer: {
            groupId: 'investment-notifications-consumer',
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}