'use client';

import { useState } from 'react';

export default function BasicTestPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Basic React Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
