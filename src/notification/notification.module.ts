import { Module } from '@nestjs/common';
import { KafkaModule } from './../kafka/kafka.module.js';
import { NotificationsController } from './notification.controller.js';
import { NotificationsConsumer } from './notification.consumer.js';
import { NotificationsService } from './notification.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user-entity.js';
import { KeycloakModule } from '../keycloak/keycloak-module.js';
import { MailService } from './mail.service.js';

@Module({
  imports: [KafkaModule, TypeOrmModule.forFeature([User]), KeycloakModule],
  controllers: [NotificationsController, NotificationsConsumer],
  providers: [NotificationsService, MailService],
})
export class NotificationModule {}