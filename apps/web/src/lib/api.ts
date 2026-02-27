import type { GenerateRequest } from 'ai-saas-types';

const API_BASE_URL = 'http://localhost:4000/api';

export async function generateArchitecture(data: GenerateRequest): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate architecture');
  }

  return response.json();
}
