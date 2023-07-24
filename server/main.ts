import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({});
  app.use(morgan('combined'));

  await app.listen(3000);
  console.info('Listing at %s', await app.getUrl());
}

bootstrap().catch((error) => console.error('%o', error.stack));
