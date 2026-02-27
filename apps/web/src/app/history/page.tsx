'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Generation } from 'ai-saas-types';

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/generations');
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        const data = await response.json();
        setGenerations(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Generation History
            </h1>
            <Link
              href="/"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              ← New Generation
            </Link>
          </div>

          {generations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No generations yet. Create your first architecture blueprint!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((generation) => (
                <Link
                  key={generation.id}
                  href={`/result/${generation.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {generation.idea}
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Roles: {generation.roles_input}</span>
                    <span>•</span>
                    <span className="capitalize">{generation.monetization_type}</span>
                    <span>•</span>
                    <span className="capitalize">{generation.tenant_type}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
                    Created: {new Date(generation.created_at).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
