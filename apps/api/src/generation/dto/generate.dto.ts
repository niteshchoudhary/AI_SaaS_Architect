import {
  IsString,
  IsArray,
  IsNotEmpty,
  MinLength,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';

export enum MonetizationType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one-time',
  FREEMIUM = 'freemium',
  MARKETPLACE = 'marketplace',
  INTERNAL_TOOL = 'internal-tool',
}

export enum TenantType {
  SINGLE = 'single',
  MULTI = 'multi',
}

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  idea: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty()
  roles: string[];

  @IsEnum(MonetizationType)
  @IsNotEmpty()
  monetization: string;

  @IsEnum(TenantType)
  @IsNotEmpty()
  tenantType: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];
}
