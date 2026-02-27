// AI Response Types
export interface GenerationResult {
  project_summary: string;
  mvp_features: string[];
  future_features: string[];
  roles: Role[];
  database_schema: DatabaseTable[];
  folder_structure: FolderStructure;
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
}

export interface DatabaseTable {
  table_name: string;
  columns: Column[];
}

export interface Column {
  name: string;
  type: string;
  description: string;
}

export interface FolderStructure {
  frontend: string[];
  backend: string[];
}

// Database Generation Record
export interface Generation {
  id: string;
  idea: string;
  roles_input: string;
  monetization_type: string;
  tenant_type: string;
  tech_stack: string[] | string;
  ai_response: GenerationResult | string;
  created_at: Date | string;
}

// API Request Types
export interface GenerateRequest {
  idea: string;
  roles: string[];
  monetization: string;
  tenantType: string;
  techStack: string[];
}

export interface GenerateResponse {
  id: string;
  data: GenerationResult;
}
