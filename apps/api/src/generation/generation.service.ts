import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from 'ai-saas-database';
import type { GenerateDto } from './dto/generate.dto';
import type { GenerationResult, Generation } from 'ai-saas-types';

@Injectable()
export class GenerationService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateArchitecture(data: GenerateDto): Promise<{ id: string; data: GenerationResult }> {
    const prompt = this.buildPrompt(data);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert SaaS architect. Generate a structured architecture blueprint in valid JSON format.
          
The JSON must follow this exact schema:
{
  "project_summary": string,
  "mvp_features": string[],
  "future_features": string[],
  "roles": [{ "name": string, "description": string, "permissions": string[] }],
  "database_schema": [{ "table_name": string, "columns": [{ "name": string, "type": string, "description": string }] }],
  "folder_structure": { "frontend": string[], "backend": string[] }
}

Return ONLY valid JSON, no markdown, no explanations.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('Failed to get response from AI');
    }

    // Parse and validate JSON
    let aiResponse: GenerationResult;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanContent);
      this.validateAIResponse(aiResponse);
    } catch (error) {
      throw new BadRequestException('Invalid JSON response from AI');
    }

    // Save to database
    const id = uuidv4();
    const generation: Generation = await prisma.generations.create({
      data: {
        id,
        idea: data.idea,
        roles_input: data.roles.join(', '),
        monetization_type: data.monetization,
        tenant_type: data.tenantType,
        tech_stack: JSON.stringify(data.techStack),
        ai_response: JSON.stringify(aiResponse),
      },
    });

    return { id: generation.id, data: aiResponse };
  }

  private buildPrompt(data: GenerateDto): string {
    return `
Create a SaaS architecture blueprint for the following:

**App Idea:**
${data.idea}

**User Roles:**
${data.roles.join(', ')}

**Monetization Type:**
${data.monetization}

**Tenant Type:**
${data.tenantType === 'single' ? 'Single Tenant' : 'Multi-Tenant'}

**Tech Stack:**
${data.techStack.join(', ') || 'Not specified'}

Generate a comprehensive architecture including:
1. Project summary
2. MVP features (prioritized list)
3. Future features (for later iterations)
4. Role & permission matrix for each role
5. Database schema with tables and columns
6. Suggested folder structure for frontend and backend
`;
  }

  private validateAIResponse(response: unknown): asserts response is GenerationResult {
    const r = response as GenerationResult;
    
    if (!r.project_summary || typeof r.project_summary !== 'string') {
      throw new BadRequestException('Missing or invalid project_summary');
    }
    if (!Array.isArray(r.mvp_features)) {
      throw new BadRequestException('Missing or invalid mvp_features');
    }
    if (!Array.isArray(r.future_features)) {
      throw new BadRequestException('Missing or invalid future_features');
    }
    if (!Array.isArray(r.roles)) {
      throw new BadRequestException('Missing or invalid roles');
    }
    if (!Array.isArray(r.database_schema)) {
      throw new BadRequestException('Missing or invalid database_schema');
    }
    if (!r.folder_structure || !Array.isArray(r.folder_structure.frontend) || !Array.isArray(r.folder_structure.backend)) {
      throw new BadRequestException('Missing or invalid folder_structure');
    }
  }

  async findById(id: string): Promise<Generation | null> {
    const generation = await prisma.generations.findUnique({
      where: { id },
    });

    if (!generation) {
      return null;
    }

    return {
      ...generation,
      tech_stack: typeof generation.tech_stack === 'string' 
        ? JSON.parse(generation.tech_stack) 
        : generation.tech_stack,
      ai_response: typeof generation.ai_response === 'string'
        ? JSON.parse(generation.ai_response)
        : generation.ai_response,
    };
  }

  async findAll(): Promise<Generation[]> {
    const generations = await prisma.generations.findMany({
      orderBy: { created_at: 'desc' },
    });

    return generations.map((g) => ({
      ...g,
      tech_stack: typeof g.tech_stack === 'string' 
        ? JSON.parse(g.tech_stack) 
        : g.tech_stack,
      ai_response: typeof g.ai_response === 'string'
        ? JSON.parse(g.ai_response)
        : g.ai_response,
    }));
  }
}
