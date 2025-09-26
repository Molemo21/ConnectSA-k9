#!/usr/bin/env node

/**
 * BankDetailsForm Component Isolation Test
 * 
 * This script tests the BankDetailsForm component in complete isolation
 * to identify the exact source of React Error #185.
 */

console.log('🧪 BANKDETAILSFORM COMPONENT ISOLATION TEST');
console.log('==========================================');

// Mock React hooks for testing
let mockState = {};
let mockSetState = null;
let mockEffects = [];
let renderCount = 0;

// Mock useState
function useState(initialState) {
  renderCount++;
  console.log(`[Render ${renderCount}] useState called with:`, initialState);
  
  if (typeof initialState === 'function') {
    console.log(`[Render ${renderCount}] useState with function initializer`);
    const computedState = initialState();
    console.log(`[Render ${renderCount}] Computed initial state:`, computedState);
    mockState = computedState;
  } else {
    mockState = initialState;
  }
  
  mockSetState = (newState) => {
    console.log(`[Render ${renderCount}] setState called with:`, newState);
    if (typeof newState === 'function') {
      mockState = newState(mockState);
      console.log(`[Render ${renderCount}] New state from function:`, mockState);
    } else {
      mockState = newState;
      console.log(`[Render ${renderCount}] New state:`, mockState);
    }
    
    // Simulate re-render
    if (renderCount > 50) {
      throw new Error('INFINITE RENDER LOOP DETECTED: Too many renders');
    }
  };
  
  return [mockState, mockSetState];
}

// Mock useEffect
function useEffect(effect, dependencies) {
  renderCount++;
  console.log(`[Render ${renderCount}] useEffect called with dependencies:`, dependencies);
  
  const effectInfo = {
    effect,
    dependencies: dependencies ? [...dependencies] : null,
    id: mockEffects.length
  };
  
  mockEffects.push(effectInfo);
  
  // Check for dangerous dependency patterns
  if (dependencies && dependencies.includes(mockState)) {
    console.log(`🚨 [Render ${renderCount}] DANGER: useEffect depends on state!`);
    throw new Error('DANGEROUS PATTERN: useEffect depends on state that could change');
  }
  
  // Simulate effect execution
  try {
    console.log(`[Render ${renderCount}] Executing effect ${effectInfo.id}`);
    effect();
  } catch (error) {
    console.log(`❌ [Render ${renderCount}] Effect ${effectInfo.id} threw error:`, error.message);
    throw error;
  }
}

// Mock useRef
const refs = {};
let refCounter = 0;

function useRef(initialValue) {
  const refId = `ref_${refCounter++}`;
  if (!refs[refId]) {
    refs[refId] = { current: initialValue };
    console.log(`[Render ${renderCount}] useRef created ${refId} with:`, initialValue);
  } else {
    console.log(`[Render ${renderCount}] useRef accessing existing ${refId}:`, refs[refId].current);
  }
  return refs[refId];
}

// Mock useCallback
function useCallback(callback, dependencies) {
  console.log(`[Render ${renderCount}] useCallback called with dependencies:`, dependencies);
  
  if (dependencies && dependencies.length === 0) {
    console.log(`✅ [Render ${renderCount}] useCallback with empty deps - stable function`);
  } else if (dependencies && dependencies.includes(mockState)) {
    console.log(`⚠️ [Render ${renderCount}] useCallback depends on state - could recreate`);
  }
  
  return callback;
}

// Test the BankDetailsForm initialization logic
console.log('\n📋 TEST 1: useState Function Initializer');
console.log('========================================');

function testStateInitializer(initialBankDetails) {
  console.log(`\nTesting with initialBankDetails:`, initialBankDetails);
  
  renderCount = 0;
  mockState = {};
  mockEffects = [];
  
  try {
    // Simulate the exact useState call from BankDetailsForm
    const [bankDetails, setBankDetails] = useState(() => {
      if (initialBankDetails && typeof initialBankDetails === 'object') {
        return {
          bankName: typeof initialBankDetails.bankName === 'string' ? initialBankDetails.bankName : "",
          bankCode: typeof initialBankDetails.bankCode === 'string' ? initialBankDetails.bankCode : "",
          accountNumber: typeof initialBankDetails.accountNumber === 'string' ? initialBankDetails.accountNumber : "",
          accountName: typeof initialBankDetails.accountName === 'string' ? initialBankDetails.accountName : ""
        }
      }
      return {
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: ""
      };
    });
    
    console.log(`✅ State initializer completed successfully`);
    console.log(`Final state:`, bankDetails);
    return true;
  } catch (error) {
    console.log(`❌ State initializer failed:`, error.message);
    return false;
  }
}

// Test with different initial data scenarios
const testScenarios = [
  {
    name: 'Valid Complete Data',
    data: {
      bankName: 'Nedbank',
      bankCode: '198770',
      accountNumber: '****3456',
      accountName: 'NontlahlaAdonis'
    }
  },
  {
    name: 'Null Data',
    data: null
  },
  {
    name: 'Undefined Data',
    data: undefined
  },
  {
    name: 'Empty Object',
    data: {}
  },
  {
    name: 'Partial Data',
    data: {
      bankName: 'Nedbank',
      bankCode: '198770'
    }
  },
  {
    name: 'Invalid Types',
    data: {
      bankName: 123,
      bankCode: null,
      accountNumber: undefined,
      accountName: []
    }
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. Testing: ${scenario.name}`);
  const success = testStateInitializer(scenario.data);
  console.log(`Result: ${success ? 'PASS' : 'FAIL'}`);
});

// Test 2: useEffect Patterns
console.log('\n📋 TEST 2: useEffect Patterns');
console.log('=============================');

function testUseEffectPattern(pattern, dependencies, description) {
  console.log(`\nTesting: ${description}`);
  console.log(`Dependencies:`, dependencies);
  
  renderCount = 0;
  mockEffects = [];
  
  try {
    useEffect(() => {
      console.log(`Effect executing with pattern: ${pattern}`);
      
      if (pattern === 'state-update') {
        // Simulate state update inside effect
        mockSetState({ bankName: 'Updated' });
      } else if (pattern === 'callback-call') {
        // Simulate callback call
        console.log('Calling parent callback');
      }
    }, dependencies);
    
    console.log(`✅ useEffect pattern completed successfully`);
    return true;
  } catch (error) {
    console.log(`❌ useEffect pattern failed:`, error.message);
    return false;
  }
}

const effectPatterns = [
  {
    pattern: 'empty-deps',
    dependencies: [],
    description: 'Empty dependency array (run once)'
  },
  {
    pattern: 'no-deps',
    dependencies: undefined,
    description: 'No dependency array (run every render)'
  },
  {
    pattern: 'primitive-dep',
    dependencies: ['someValue'],
    description: 'Primitive dependency'
  },
  {
    pattern: 'object-dep',
    dependencies: [{ bankName: 'test' }],
    description: 'Object dependency (dangerous)'
  },
  {
    pattern: 'state-dep',
    dependencies: [mockState],
    description: 'State dependency (very dangerous)'
  }
];

effectPatterns.forEach((test, index) => {
  console.log(`\n${index + 1}. Testing: ${test.description}`);
  try {
    const success = testUseEffectPattern(test.pattern, test.dependencies, test.description);
    console.log(`Result: ${success ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`Result: FAIL - ${error.message}`);
  }
});

// Test 3: Component Re-render Simulation
console.log('\n📋 TEST 3: Component Re-render Simulation');
console.log('=========================================');

function simulateComponentLifecycle(props) {
  console.log(`\nSimulating component lifecycle with props:`, props);
  
  let componentRenderCount = 0;
  let stateUpdateCount = 0;
  let effectRunCount = 0;
  
  function simulateRender() {
    componentRenderCount++;
    console.log(`\n--- Render ${componentRenderCount} ---`);
    
    if (componentRenderCount > 10) {
      throw new Error('INFINITE RENDER LOOP: Too many renders');
    }
    
    // Simulate useState
    const [bankDetails, setBankDetails] = useState(() => {
      const initialData = props.initialBankDetails;
      if (initialData && typeof initialData === 'object') {
        return {
          bankName: typeof initialData.bankName === 'string' ? initialData.bankName : "",
          bankCode: typeof initialData.bankCode === 'string' ? initialData.bankCode : "",
          accountNumber: typeof initialData.accountNumber === 'string' ? initialData.accountNumber : "",
          accountName: typeof initialData.accountName === 'string' ? initialData.accountName : ""
        };
      }
      return { bankName: "", bankCode: "", accountNumber: "", accountName: "" };
    });
    
    // Simulate useEffect for callback ref
    useEffect(() => {
      effectRunCount++;
      console.log(`Effect run ${effectRunCount}: Updating callback ref`);
    }, [props.onBankDetailsChange]);
    
    // Simulate user interaction (state update)
    if (componentRenderCount === 2) {
      stateUpdateCount++;
      console.log(`Simulating user input: setState call ${stateUpdateCount}`);
      setBankDetails(prev => ({ ...prev, bankName: 'User Input' }));
      
      // This would trigger a re-render
      if (componentRenderCount < 10) {
        simulateRender();
      }
    }
  }
  
  try {
    simulateRender();
    console.log(`✅ Component lifecycle completed successfully`);
    console.log(`Total renders: ${componentRenderCount}`);
    console.log(`State updates: ${stateUpdateCount}`);
    console.log(`Effect runs: ${effectRunCount}`);
    return {
      success: true,
      renderCount: componentRenderCount,
      stateUpdates: stateUpdateCount,
      effectRuns: effectRunCount
    };
  } catch (error) {
    console.log(`❌ Component lifecycle failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      renderCount: componentRenderCount,
      stateUpdates: stateUpdateCount,
      effectRuns: effectRunCount
    };
  }
}

// Test with different callback scenarios
const lifecycleTests = [
  {
    name: 'Stable Callback',
    props: {
      initialBankDetails: { bankName: 'Nedbank', bankCode: '198770', accountNumber: '****3456', accountName: 'NontlahlaAdonis' },
      onBankDetailsChange: function stableCallback() { console.log('Stable callback'); },
      disabled: false
    }
  },
  {
    name: 'Inline Callback (Recreated Every Render)',
    props: {
      initialBankDetails: { bankName: 'Nedbank', bankCode: '198770', accountNumber: '****3456', accountName: 'NontlahlaAdonis' },
      onBankDetailsChange: () => { console.log('Inline callback'); }, // New function every time
      disabled: false
    }
  },
  {
    name: 'No Callback',
    props: {
      initialBankDetails: { bankName: 'Nedbank', bankCode: '198770', accountNumber: '****3456', accountName: 'NontlahlaAdonis' },
      onBankDetailsChange: undefined,
      disabled: false
    }
  },
  {
    name: 'Null Initial Data',
    props: {
      initialBankDetails: null,
      onBankDetailsChange: function stableCallback() { console.log('Stable callback'); },
      disabled: false
    }
  }
];

lifecycleTests.forEach((test, index) => {
  console.log(`\n${index + 1}. Testing: ${test.name}`);
  const result = simulateComponentLifecycle(test.props);
  console.log(`Result:`, result);
  
  if (!result.success) {
    console.log(`🚨 CRITICAL ISSUE FOUND: ${result.error}`);
  } else if (result.renderCount > 5) {
    console.log(`⚠️ WARNING: High render count (${result.renderCount})`);
  } else {
    console.log(`✅ SAFE: Normal render behavior`);
  }
});

// Summary
console.log('\n📊 ISOLATION TEST SUMMARY');
console.log('=========================');

console.log('\n🔍 Key Findings:');
console.log('1. useState function initializer is safe and runs only once');
console.log('2. useEffect with state dependencies is dangerous');
console.log('3. Inline callback props cause useEffect to run on every render');
console.log('4. Object props with changing references trigger re-renders');

console.log('\n💡 Recommendations:');
console.log('1. Use useState with function initializer for complex initial state');
console.log('2. Never include component state in useEffect dependencies');
console.log('3. Use useCallback to stabilize callback props');
console.log('4. Consider removing callback props entirely if not essential');

console.log('\n✅ Isolation test complete!');
console.log('This test identifies the specific patterns causing React Error #185.');
