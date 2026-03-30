import { PythonExecutor } from './python-executor';

async function testPythonExecution() {
  const executor = PythonExecutor.getInstance();
  
  // Test Python code execution
  const testCode = `
import pandas as pd
import json

# Create a simple DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Salary': [50000, 60000, 70000]
}

df = pd.DataFrame(data)

# Perform some analysis
result = {
    'total_people': len(df),
    'average_age': df['Age'].mean(),
    'average_salary': df['Salary'].mean(),
    'summary': 'Test execution successful'
}

# Output as JSON
print(json.dumps(result))
`;
  
  console.log('Testing Python execution...');
  const result = await executor.executePythonCode(testCode);
  
  if (result.success) {
    console.log('Python execution successful!');
    console.log('Output:', result.output);
    console.log('Execution time:', result.executionTime, 'ms');
  } else {
    console.log('Python execution failed!');
    console.log('Error:', result.error);
  }
}

// Run the test
testPythonExecution().catch(console.error);