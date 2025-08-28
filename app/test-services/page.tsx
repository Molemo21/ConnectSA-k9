'use client';

import { useState, useEffect } from 'react';

export default function TestServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        console.log('🔍 Starting to fetch services...');
        const res = await fetch('/api/services');
        console.log('🔍 Response status:', res.status);
        console.log('🔍 Response ok:', res.ok);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('🔍 Services data:', data);
        console.log('🔍 Services count:', data.length);
        
        setServices(data);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading services</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Services Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Services Data</h2>
          <div className="text-sm text-gray-600 mb-2">
            Total services: {services.length}
          </div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(services, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Services List</h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <div key={service.id} className="border rounded p-4">
                <div className="font-semibold">{service.name}</div>
                <div className="text-sm text-gray-600">{service.category}</div>
                <div className="text-xs text-gray-500">{service.description}</div>
                <div className="text-xs text-gray-400 mt-1">ID: {service.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
