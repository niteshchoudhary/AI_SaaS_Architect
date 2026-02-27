import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [GenerationController],
  providers: [GenerationService, OpenAIService],
  exports: [GenerationService],
})
export class GenerationModule {}
