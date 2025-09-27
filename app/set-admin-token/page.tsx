'use client';

import { useState } from 'react';

export default function SetAdminTokenPage() {
  const [message, setMessage] = useState('');
  const [tokenExists, setTokenExists] = useState(false);

  // The JWT token generated from the server
  const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiZ2tpY2tzYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4ODk4MDM0LCJleHAiOjE3NTg5ODQ0MzR9.7-ULRi0QIOwzeBqn-iFRAA';

  const setAdminToken = () => {
    try {
      localStorage.setItem('auth_token', ADMIN_TOKEN);
      setMessage('✅ Admin token has been set successfully!');
      checkToken();
    } catch (error) {
      setMessage('❌ Error setting token: ' + error);
    }
  };

  const checkToken = () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setTokenExists(true);
        setMessage(`✅ Token exists: ${token.substring(0, 50)}...`);
      } else {
        setTokenExists(false);
        setMessage('❌ No token found in localStorage');
      }
    } catch (error) {
      setMessage('❌ Error checking token: ' + error);
    }
  };

  const testAnalyticsAPI = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('❌ No token found. Please set the token first.');
        return;
      }

      setMessage('🔄 Testing Analytics API...');
      
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Analytics API test successful! Data: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        setMessage(`❌ Analytics API test failed: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Error testing API: ${error}`);
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem('auth_token');
      setTokenExists(false);
      setMessage('✅ Token cleared successfully!');
    } catch (error) {
      setMessage('❌ Error clearing token: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Token Manager
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={setAdminToken}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Set Admin Token
            </button>
            
            <button
              onClick={checkToken}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Check Token
            </button>
            
            <button
              onClick={testAnalyticsAPI}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Test Analytics API
            </button>
            
            <button
              onClick={clearToken}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Clear Token
            </button>
          </div>
          
          {message && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 break-all">{message}</p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Token Status: 
              <span className={`ml-2 font-semibold ${tokenExists ? 'text-green-600' : 'text-red-600'}`}>
                {tokenExists ? 'EXISTS' : 'NOT SET'}
              </span>
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <a
              href="/admin/analytics"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Go to Analytics Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}