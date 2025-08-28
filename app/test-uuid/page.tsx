'use client';

import { useState } from 'react';

export default function TestUuidPage() {
  const [testId, setTestId] = useState('cmetcbuma0006s75ogo5j3ar1');
  const [validationResult, setValidationResult] = useState('');

  const validateId = () => {
    // Old UUID validation (should fail)
    const oldUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const oldResult = oldUuidRegex.test(testId);
    
    // New Prisma ID validation (should pass)
    const newServiceIdRegex = /^[a-z0-9]{25}$/i;
    const newResult = newServiceIdRegex.test(testId);
    
    setValidationResult(`
      Test ID: ${testId}
      
      Old UUID Validation: ${oldResult ? '✅ PASS' : '❌ FAIL'}
      New Prisma ID Validation: ${newResult ? '✅ PASS' : '❌ FAIL'}
      
      Length: ${testId.length} characters
      Format: ${testId}
    `);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>UUID Validation Test</h1>
      
      <div style={{ margin: '20px 0' }}>
        <label>
          Test ID:
          <input 
            type="text" 
            value={testId} 
            onChange={(e) => setTestId(e.target.value)}
            style={{ 
              marginLeft: '10px', 
              padding: '8px', 
              width: '300px',
              fontFamily: 'monospace'
            }}
          />
        </label>
      </div>
      
      <button 
        onClick={validateId}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Test Validation
      </button>
      
      {validationResult && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-line'
        }}>
          {validationResult}
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>Expected Results:</h3>
        <ul>
          <li>Old UUID validation should FAIL (❌) - expects format like: 123e4567-e89b-12d3-a456-426614174000</li>
          <li>New Prisma ID validation should PASS (✅) - expects 25 character alphanumeric string</li>
          <li>Test ID "cmetcbuma0006s75ogo5j3ar1" is 25 characters and should pass the new validation</li>
        </ul>
      </div>
    </div>
  );
}
