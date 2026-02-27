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
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');
        if (isRateLimit) {
          console.warn('OpenAI rate limit exceeded, trying Gemini...');
        } else {
          console.warn('OpenAI API failed, trying Gemini:', errorMessage);
        }
        // Always try Gemini if OpenAI failed
        if (this.gemini) {
          try {
            aiResponse = await this.callGemini(data);
            source = 'gemini';
          } catch (geminiError) {
            const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
            const isGeminiRateLimit = geminiErrorMessage.includes('429') || geminiErrorMessage.includes('rate limit');
            if (isGeminiRateLimit) {
              console.warn('Gemini rate limit exceeded, falling back to mock');
            } else {
              console.warn('Gemini API failed, falling back to mock:', geminiErrorMessage);
            }
          }
        }
      }
    }

    // Fall back to mock if both APIs failed or not available
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
      model: "gpt-4o",
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
      max_tokens: 1500,
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

    // Use single model - gemini-2.0-flash (most reliable)
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    
    const content = response.text;

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
    const monetizationFeatures: Record<string, string[]> = {
      'subscription': [
        'Subscription plans (Basic, Pro, Enterprise)',
        'Recurring billing integration (Stripe/Paddle)',
        'Payment webhook handling',
        'Subscription management dashboard',
      ],
      'one-time': [
        'One-time payment checkout',
        'License key generation',
        'Download/access management',
        'Refund handling system',
      ],
      'freemium': [
        'Free tier with limited features',
        'Upgrade to paid plans',
        'Feature gating system',
        'Usage tracking and limits',
      ],
      'marketplace': [
        'Vendor/seller onboarding',
        'Escrow payment system',
        'Commission calculation',
        'Dispute resolution system',
      ],
      'internal-tool': [
        'SSO/Enterprise authentication',
        'Audit logging',
        'Admin dashboard',
        'Role-based access control',
      ],
    };

    const paymentTables: Record<string, Array<{ table_name: string; columns: Array<{ name: string; type: string; description: string }> }>> = {
      'subscription': [
        {
          table_name: 'subscriptions',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique subscription identifier' },
            { name: 'user_id', type: 'UUID', description: 'Reference to user' },
            { name: 'plan_id', type: 'UUID', description: 'Reference to subscription plan' },
            { name: 'status', type: 'VARCHAR(20)', description: 'active, cancelled, past_due' },
            { name: 'current_period_end', type: 'TIMESTAMP', description: 'Current billing period end' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Subscription start date' },
          ],
        },
        {
          table_name: 'subscription_plans',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique plan identifier' },
            { name: 'name', type: 'VARCHAR(50)', description: 'Plan name (Basic, Pro, etc.)' },
            { name: 'price', type: 'DECIMAL(10,2)', description: 'Monthly price' },
            { name: 'features', type: 'JSONB', description: 'Plan features' },
          ],
        },
      ],
      'one-time': [
        {
          table_name: 'orders',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique order identifier' },
            { name: 'user_id', type: 'UUID', description: 'Reference to user' },
            { name: 'total_amount', type: 'DECIMAL(10,2)', description: 'Order total' },
            { name: 'status', type: 'VARCHAR(20)', description: 'pending, completed, refunded' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Order date' },
          ],
        },
        {
          table_name: 'license_keys',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique license identifier' },
            { name: 'key', type: 'VARCHAR(255) UNIQUE', description: 'License key hash' },
            { name: 'user_id', type: 'UUID', description: 'Reference to user' },
            { name: 'is_active', type: 'BOOLEAN', description: 'License status' },
          ],
        },
      ],
      'freemium': [
        {
          table_name: 'usage_limits',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique identifier' },
            { name: 'user_id', type: 'UUID', description: 'Reference to user' },
            { name: 'feature', type: 'VARCHAR(50)', description: 'Feature name' },
            { name: 'limit', type: 'INTEGER', description: 'Usage limit' },
            { name: 'current_usage', type: 'INTEGER', description: 'Current usage count' },
          ],
        },
      ],
      'marketplace': [
        {
          table_name: 'vendors',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique vendor identifier' },
            { name: 'user_id', type: 'UUID', description: 'Reference to user' },
            { name: 'status', type: 'VARCHAR(20)', description: 'pending, approved, rejected' },
            { name: 'commission_rate', type: 'DECIMAL(5,2)', description: 'Commission percentage' },
          ],
        },
        {
          table_name: 'transactions',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique transaction identifier' },
            { name: 'buyer_id', type: 'UUID', description: 'Reference to buyer' },
            { name: 'vendor_id', type: 'UUID', description: 'Reference to vendor' },
            { name: 'amount', type: 'DECIMAL(10,2)', description: 'Transaction amount' },
            { name: 'commission', type: 'DECIMAL(10,2)', description: 'Platform commission' },
          ],
        },
      ],
      'internal-tool': [],
    };

    return {
      project_summary: `A ${data.monetization === 'internal-tool' ? '' : data.monetization + ' '}SaaS application built with ${data.techStack.join(', ') || 'modern technologies'}. ${data.idea}`,
      mvp_features: [
        'User authentication and authorization',
        'Core feature based on your idea',
        'Dashboard for users',
        'Basic CRUD operations',
        'Responsive UI design',
        ...(monetizationFeatures[data.monetization] || []),
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
        ...(data.monetization === 'multi' || data.tenantType === 'multi' ? [{
          table_name: 'tenants',
          columns: [
            { name: 'id', type: 'UUID PRIMARY KEY', description: 'Unique tenant identifier' },
            { name: 'name', type: 'VARCHAR(255)', description: 'Tenant name' },
            { name: 'subdomain', type: 'VARCHAR(100) UNIQUE', description: 'Tenant subdomain' },
            { name: 'created_at', type: 'TIMESTAMP', description: 'Creation date' },
          ],
        }] : []),
        ...(paymentTables[data.monetization] || []),
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
          data.monetization === 'subscription' ? '├── subscriptions/' : data.monetization === 'marketplace' ? '├── marketplace/' : '├── billing/',
          '├── common/',
          '├── app.module.ts',
          '└── main.ts',
        ],
      },
    };
  }

  private buildPrompt(data: GenerateDto): string {
    const monetizationLabels: Record<string, string> = {
      'subscription': 'Subscription-based (recurring monthly/yearly payments)',
      'one-time': 'One-time payment (lifetime access)',
      'freemium': 'Freemium (free tier with paid upgrades)',
      'marketplace': 'Marketplace (transaction fees or commissions)',
      'internal-tool': 'Internal Tool (no monetization, for internal use)',
    };

    return `
Create a SaaS architecture blueprint for the following:

**App Idea:**
${data.idea}

**User Roles:**
${data.roles.join(', ')}

**Monetization Type:**
${monetizationLabels[data.monetization] || data.monetization}

**Tenant Type:**
${data.tenantType === 'single' ? 'Single Tenant' : 'Multi-Tenant'}

**Tech Stack:**
${data.techStack.join(', ') || 'Not specified'}

Generate a comprehensive architecture including:
1. Project summary (mention the monetization model)
2. MVP features (prioritized list, include payment/subscription features if applicable)
3. Future features (for later iterations)
4. Role & permission matrix for each role
5. Database schema with tables and columns (include payment/subscription tables if monetization requires)
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
