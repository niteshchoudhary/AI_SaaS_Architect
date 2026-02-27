'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TECH_STACKS = ['Next.js', 'NestJS', 'Rails', 'PostgreSQL', 'MySQL', 'Prisma'];
const MONETIZATION_OPTIONS = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'one-time', label: 'One-time' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'internal-tool', label: 'Internal Tool' },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      idea: formData.get('idea') as string,
      roles: (formData.get('roles') as string).split(',').map((r: string) => r.trim()).filter(Boolean),
      monetization: formData.get('monetization') as string,
      tenantType: formData.get('tenantType') as string,
      techStack: formData.getAll('techStack') as string[],
    };

    try {
      const response = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate architecture');
      }

      const result = await response.json();
      router.push(`/result/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI SaaS Architect
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Generate structured SaaS architecture blueprint from your idea. 
            Get feature lists, role-permission matrices, database schemas, and more.
          </p>
        </div>

        {/* Architecture Form Card */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* App Idea */}
            <div>
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App Idea <span className="text-red-500">*</span>
              </label>
              <textarea
                id="idea"
                name="idea"
                rows={4}
                required
                minLength={30}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe your SaaS idea in detail (minimum 30 characters)..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Minimum 30 characters required
              </p>
            </div>

            {/* User Roles */}
            <div>
              <label htmlFor="roles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Roles <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="roles"
                name="roles"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Admin, User, Manager, Viewer (comma-separated)"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Minimum 1 role required
              </p>
            </div>

            {/* Monetization Type */}
            <div>
              <label htmlFor="monetization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monetization Type <span className="text-red-500">*</span>
              </label>
              <select
                id="monetization"
                name="monetization"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select monetization type...</option>
                {MONETIZATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tenantType"
                    value="single"
                    required
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Single Tenant</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tenantType"
                    value="multi"
                    required
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Multi-Tenant</span>
                </label>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tech Stack
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TECH_STACKS.map((tech) => (
                  <label key={tech} className="flex items-center">
                    <input
                      type="checkbox"
                      name="techStack"
                      value={tech}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {loading ? 'Generating Architecture...' : 'Generate Architecture'}
              </button>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📋 Feature Planning
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get MVP and future feature lists tailored to your SaaS idea
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🔐 RBAC Matrix
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Role-permission matrix to structure access control properly
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🗄️ DB Schema
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Normalized database schema with proper relationships
            </p>
          </div>
        </div>

        {/* Footer Link */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <a
            href="/history"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View Generation History →
          </a>
        </div>
      </div>
    </main>
  );
}
