import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from 'ai-saas-database';
import type { GenerateDto } from './dto/generate.dto';
import type { GenerationResult, Generation } from 'ai-saas-types';

@Injectable()
export class GenerationService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenAI | null = null;
  private useMock: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    this.useMock = !apiKey || apiKey === 'your_openai_api_key_here';
    
    if (!this.useMock && apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    
    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }
  }

  async generateArchitecture(data: GenerateDto): Promise<{ id: string; data: GenerationResult; isMock: boolean }> {
    let aiResponse: GenerationResult | undefined;
    let isMock = false;
    let source = 'mock';

    // Try OpenAI first
    if (!this.useMock && this.openai) {
      try {
        aiResponse = await this.callOpenAI(data);
        source = 'openai';
      } catch (error) {
        console.warn('OpenAI API failed, trying Gemini:', error instanceof Error ? error.message : error);
      }
    }

    // Try Gemini if OpenAI failed or not available
    if (!aiResponse && this.gemini) {
      try {
        aiResponse = await this.callGemini(data);
        source = 'gemini';
      } catch (error) {
        console.warn('Gemini API failed, falling back to mock:', error instanceof Error ? error.message : error);
      }
    }

    // Fall back to mock if both APIs failed
    if (!aiResponse) {
      aiResponse = this.getMockResponse(data);
      isMock = true;
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
        ai_response: JSON.stringify({ ...aiResponse, _isMock: isMock, _source: source }),
      },
    });

    return { id: generation.id, data: aiResponse, isMock };
  }

  private async callOpenAI(data: GenerateDto): Promise<GenerationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = this.buildPrompt(data);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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

    return aiResponse;
  }

  private async callGemini(data: GenerateDto): Promise<GenerationResult> {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized');
    }

    const prompt = this.buildPrompt(data) + '\n\nReturn ONLY valid JSON in this exact schema:\n{"project_summary": string, "mvp_features": string[], "future_features": string[], "roles": [{"name": string, "description": string, "permissions": string[]}], "database_schema": [{"table_name": string, "columns": [{"name": string, "type": string, "description": string}]}], "folder_structure": {"frontend": string[], "backend": string[]}}';

    // Try gemini-2.0-flash first, then gemini-2.0-flash-lite, then gemini-1.5-pro
    const modelNames = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
    let content: string | undefined;

    for (const modelName of modelNames) {
      try {
        const response = await this.gemini.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        content = response.text;
        if (content) {
          console.log(`Gemini using model: ${modelName}`);
          break;
        }
      } catch (error) {
        console.warn(`Gemini model ${modelName} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    if (!content) {
      throw new BadRequestException('Failed to get response from Gemini');
    }

    // Parse and validate JSON
    let aiResponse: GenerationResult;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanContent);
      this.validateAIResponse(aiResponse);
    } catch (error) {
      throw new BadRequestException('Invalid JSON response from Gemini');
    }

    return aiResponse;
  }

  private getMockResponse(data: GenerateDto): GenerationResult {
    return {
      project_summary: `A ${data.monetization} ${data.tenantType === 'single' ? 'single-tenant' : 'multi-tenant'} SaaS application built with ${data.techStack.join(', ') || 'modern technologies'}. ${data.idea}`,
      mvp_features: [
        'User authentication and authorization',
        'Core feature based on your idea',
        'Dashboard for users',
        'Basic CRUD operations',
        'Responsive UI design',
      ],
      future_features: [
        'Advanced analytics and reporting',
        'Third-party integrations',
        'Mobile application',
        'API for external developers',
        'Advanced customization options',
      ],
      roles: data.roles.map((role) => ({
        name: role,
        description: `${role} role with appropriate permissions`,
        permissions: role.toLowerCase().includes('admin') 
          ? ['create', 'read', 'update', 'delete', 'manage_users']
          : ['read', 'update'],
      })),
      database_schema: [
        {
          table_name: 'users',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique user identifier' },
            { name: 'email', type: 'VARCHAR(255) UNIQUE', description: 'User email address' },
            { name: 'password_hash', type: 'VARCHAR(255)', description: 'Hashed password' },
            { name: 'role', type: 'VARCHAR(50)', description: 'User role' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Account creation date' },
          ],
        },
        {
          table_name: 'tenants',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique tenant identifier' },
            { name: 'name', type: 'VARCHAR(255)', description: 'Tenant name' },
            { name: 'subdomain', type: 'VARCHAR(100) UNIQUE', description: 'Tenant subdomain' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Creation date' },
          ],
        },
        {
          table_name: 'subscriptions',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique subscription identifier' },
            { name: 'tenant_id', type: 'UUID', description: 'Reference to tenant' },
            { name: 'plan', type: 'VARCHAR(50)', description: 'Subscription plan' },
            { name: 'status', type: 'VARCHAR(20)', description: 'Subscription status' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Subscription start date' },
          ],
        },
      ],
      folder_structure: {
        frontend: [
          'src/',
          '├── app/',
          '│   ├── (auth)/',
          '│   ├── (dashboard)/',
          '│   ├── api/',
          '│   ├── layout.tsx',
          '│   └── page.tsx',
          '├── components/',
          '├── lib/',
          '└── styles/',
        ],
        backend: [
          'src/',
          '├── auth/',
          '├── users/',
          '├── tenants/',
          '├── subscriptions/',
          '├── common/',
          '├── app.module.ts',
          '└── main.ts',
        ],
      },
    };
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
