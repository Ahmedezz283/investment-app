import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './utilits/errorhandling.js';
import open from 'open';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalFilters(new AllExceptionsFilter());


   const config = new DocumentBuilder()
    .setTitle('Project Manager API')
    .setDescription('Users, Projects, Tasks, and UserTasks')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'investment-app-consumer',
        brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      },
      consumer: {
        groupId: 'investment-notifications-consumer',
      },
    },
  });

  app.startAllMicroservices()
    .then(() => Logger.log('Kafka consumer joined group'))
    .catch((err) => Logger.error('Kafka consumer failed to start', err));

  //await open(`http://localhost:${port}/api`);
}
await bootstrap();