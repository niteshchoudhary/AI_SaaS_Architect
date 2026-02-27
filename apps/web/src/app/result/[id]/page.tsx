'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { GenerationResult } from 'ai-saas-types';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/generation/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch result');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error || 'Data not found'}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            ← Back to Home
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Architecture Blueprint
          </h1>

          {/* Mock/API Indicator */}
          {'_isMock' in data && (
            <div className={`mb-6 p-4 rounded-lg border ${
              data._isMock 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : data._source === 'gemini'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <p className={`text-sm font-medium ${
                data._isMock 
                  ? 'text-red-600 dark:text-red-400' 
                  : data._source === 'gemini'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {data._isMock ? (
                  <>⚠️ <strong>Mock Response:</strong> This architecture was generated using mock data. Add a valid OpenAI or Gemini API key to get AI-powered results.</>
                ) : data._source === 'gemini' ? (
                  <>🔷 <strong>Gemini AI:</strong> This architecture was generated using Google Gemini API.</>
                ) : (
                  <>✅ <strong>OpenAI:</strong> This architecture was generated using OpenAI API.</>
                )}
              </p>
            </div>
          )}

          <div className="space-y-8">
            {/* Project Summary */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Project Summary
                </h2>
                <button
                  onClick={() => copyToClipboard(data.project_summary)}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{data.project_summary}</p>
            </section>

            {/* MVP Features */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  MVP Features
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.mvp_features, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                {data.mvp_features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </section>

            {/* Future Features */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Future Features
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.future_features, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                {data.future_features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </section>

            {/* Roles & Permissions */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Role & Permission Matrix
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.roles, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <div className="space-y-4">
                {data.roles.map((role, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {role.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, pIndex) => (
                        <span
                          key={pIndex}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Database Schema */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Database Schema
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.database_schema, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <div className="space-y-4">
                {data.database_schema.map((table, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Table: {table.table_name}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Column</th>
                            <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Type</th>
                            <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((column, cIndex) => (
                            <tr key={cIndex} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 px-3 text-gray-900 dark:text-white font-mono">{column.name}</td>
                              <td className="py-2 px-3 text-gray-600 dark:text-gray-400 font-mono">{column.type}</td>
                              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{column.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Folder Structure */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Folder Structure
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.folder_structure, null, 2))}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Frontend</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {data.folder_structure.frontend.join('\n')}
                  </pre>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Backend</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {data.folder_structure.backend.join('\n')}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
