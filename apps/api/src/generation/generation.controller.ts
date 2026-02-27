import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerateDto } from './dto/generate.dto';

@Controller('api')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() generateDto: GenerateDto) {
    try {
      const result = await this.generationService.generateArchitecture(generateDto);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to generate architecture',
      );
    }
  }

  @Get('generation/:id')
  async getById(@Param('id') id: string) {
    try {
      const generation = await this.generationService.findById(id);
      if (!generation) {
        throw new NotFoundException('Generation not found');
      }
      return generation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Generation not found');
    }
  }

  @Get('generations')
  async getAll() {
    return this.generationService.findAll();
  }
}
