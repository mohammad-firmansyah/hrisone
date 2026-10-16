import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the React frontend on http://localhost:5173 can call this API
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[API Gateway] HTTP REST server listening on http://localhost:${port}`);
}

await bootstrap();
