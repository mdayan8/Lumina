import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PythonExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
}

export class PythonExecutor {
  private static instance: PythonExecutor;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public static getInstance(): PythonExecutor {
    if (!PythonExecutor.instance) {
      PythonExecutor.instance = new PythonExecutor();
    }
    return PythonExecutor.instance;
  }

  // Check and install required Python packages
  private async ensurePythonPackages(): Promise<void> {
    const requiredPackages = [
      'pandas',
      'numpy',
      'matplotlib',
      'seaborn',
      'plotly',
      'scipy',
      'scikit-learn'
    ];

    try {
      // Check if Python is available first
      try {
        await execAsync('python3 --version', { timeout: 2000 });
      } catch (error) {
        console.warn('Python3 not found. Python code execution will be disabled.');
        return;
      }

      // Check if pip is available
      try {
        await execAsync('pip --version', { timeout: 2000 });
      } catch (error) {
        console.warn('pip not found. Cannot install Python packages. Some features may be limited.');
        return;
      }

      // Check if packages are installed
      for (const pkg of requiredPackages) {
        try {
          await execAsync(`python3 -c "import ${pkg.split(' ')[0]}"`, { timeout: 5000 });
        } catch (error) {
          // Package not found, try to install it
          try {
            console.log(`Installing ${pkg}...`);
            await execAsync(`pip install ${pkg}`, { timeout: 120000 }); // 2 minute timeout
          } catch (installError) {
            console.warn(`Failed to install ${pkg}. Some features may be limited.`);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring Python packages:', error);
      // Don't throw - allow the app to continue without Python
    }
  }

  async executePythonCode(code: string, dataFile?: string): Promise<PythonExecutionResult> {
    const startTime = Date.now();

    try {
      // Ensure required Python packages are installed
      await this.ensurePythonPackages();

      // Create a temporary Python file
      const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.py`;
      const tempFilePath = path.join(this.tempDir, tempFileName);

      // If we have a data file, modify the code to load it
      let fullCode = code;
      if (dataFile) {
        fullCode = `import pandas as pd
import json
import sys

# Load the data file
try:
    data = pd.read_csv("${dataFile}")
except:
    try:
        data = pd.read_excel("${dataFile}")
    except:
        data = pd.DataFrame()

${code}`;
      }

      // Write the code to the temporary file
      fs.writeFileSync(tempFilePath, fullCode);

      // Execute the Python code in a secure environment
      const { stdout, stderr } = await execAsync(`python3 "${tempFilePath}"`, {
        timeout: 30000, // 30 second timeout
        cwd: this.tempDir,
        env: {
          ...process.env,
          PYTHONPATH: process.env.PYTHONPATH || '',
        }
      });

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);

      const executionTime = Date.now() - startTime;

      if (stderr) {
        return {
          success: false,
          error: stderr,
          executionTime
        };
      }

      // Try to parse the output as JSON if possible
      let output: any = stdout;
      try {
        output = JSON.parse(stdout);
      } catch (e) {
        // If it's not JSON, keep it as plain text
      }

      return {
        success: true,
        output,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Clean up any temporary files that might have been created
      try {
        const tempFiles = fs.readdirSync(this.tempDir);
        tempFiles.forEach(file => {
          if (file.startsWith('temp_') && file.endsWith('.py')) {
            fs.unlinkSync(path.join(this.tempDir, file));
          }
        });
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }

      return {
        success: false,
        error: error.message || 'Failed to execute Python code',
        executionTime
      };
    }
  }

  async generatePythonCodeForQuery(query: string, schema: any, apiKey: string): Promise<string> {
    // Use DeepSeek AI to generate real Python code based on the data schema and user query
    try {
      // Build a detailed prompt for the AI to generate Python code
      const columnInfo = schema.columns.map((col: any) =>
        `${col.name} (${col.type}) - sample values: ${JSON.stringify(col.samples.slice(0, 3))}`
      ).join('\n');

      // Check if the query is asking for a chart
      const chartKeywords = ['chart', 'plot', 'graph', 'visualize', 'show me', 'display', 'bar chart', 'line chart', 'pie chart'];
      const isChartRequest = chartKeywords.some(keyword => query.toLowerCase().includes(keyword));

      // If we have a valid API key, try to generate code with AI
      if (apiKey && apiKey.length > 10) {
        // Create a system prompt for generating Python code
        const systemPrompt = `You are an expert Python data analyst specializing in pandas and data visualization. 
Your task is to generate executable Python code that analyzes data based on user queries.

Data Context:
- Columns: ${columnInfo}
- Total rows: ${schema.totalRows}

Guidelines:
1. Generate ONLY valid Python code that can be executed directly
2. The code should work with a pandas DataFrame named "data" that is already loaded
3. For analysis queries, return results as JSON using print(json.dumps(result))
4. For chart queries, create visualizations and return them as base64 encoded strings
5. Handle errors gracefully with try/except blocks
6. Import all necessary libraries (pandas, json, matplotlib, etc.)
7. Do NOT include any markdown formatting or explanations
8. Do NOT include any comments in the code
9. Return ONLY the Python code, nothing else
10. For analysis, focus on the specific query and use appropriate pandas operations
11. For charts, choose color schemes that enhance data readability:
    * For categorical data, use distinct colors from matplotlib color maps (Set1, Set2, Set3, tab10, tab20)
    * For sequential data, use single-hue color schemes (Blues, Greens, Reds)
    * For diverging data, use contrasting color schemes (RdBu, BrBG, PiYG)
    * Ensure good contrast and accessibility
    * Avoid using too many similar colors that make data hard to distinguish
11. For charts, choose the most appropriate chart type based on the data and query`;

        // Create a user prompt based on the query
        const userPrompt = `Generate Python code to analyze this dataset based on the query: "${query}"

${isChartRequest ?
            'Create a visualization that best represents the data for this query. Return the chart as a base64 encoded string in JSON format.' :
            'Perform the requested analysis and return the results in JSON format.'}

Important:
- Use the pandas DataFrame "data" which is already loaded
- For charts, use matplotlib and return the chart as base64
- For analysis, return structured results as JSON
- Handle potential errors with try/except blocks
- Focus on the specific columns and data types provided
- For analysis queries, return meaningful results based on the data`;

        // Call DeepSeek API to generate Python code
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const generatedCode = data.choices[0]?.message?.content || '';

          // Clean the code by removing markdown code block markers if present
          const cleanCode = generatedCode.replace(/```python|```/g, '').trim();

          // If we got valid code, return it
          if (cleanCode) {
            return cleanCode;
          }
        }
      }

      // Fallback to template code if AI generation fails or no valid API key
      return this.getFallbackCode(query, schema, isChartRequest);
    } catch (error) {
      console.error('Error generating Python code with AI:', error);
      // Fallback to template code if AI generation fails
      const chartKeywords = ['chart', 'plot', 'graph', 'visualize', 'show me', 'display', 'bar chart', 'line chart', 'pie chart'];
      const isChartRequest = chartKeywords.some(keyword => query.toLowerCase().includes(keyword));
      return this.getFallbackCode(query, schema, isChartRequest);
    }
  }

  private getFallbackCode(query: string, schema: any, isChartRequest: boolean): string {
    // Generate fallback Python code based on the actual data schema and user query
    const columnNames = schema.columns.map((col: any) => col.name);
    const numericColumns = schema.columns.filter((col: any) => col.type === 'number').map((col: any) => col.name);
    const dateColumns = schema.columns.filter((col: any) => col.type === 'date').map((col: any) => col.name);
    const stringColumns = schema.columns.filter((col: any) => col.type === 'string').map((col: any) => col.name);

    if (isChartRequest) {
      // Generate chart code based on data types
      if (numericColumns.length > 0 && stringColumns.length > 0) {
        // Chart with categorical data
        return `import pandas as pd
import json
import matplotlib.pyplot as plt
import io
import base64

try:
    # Group by a categorical column and sum a numeric column
    grouped = data.groupby('${stringColumns[0]}')['${numericColumns[0]}'].sum().head(10)
    
    plt.figure(figsize=(12, 6))
    # Use a color palette based on the number of categories
    n_categories = len(grouped)
    if n_categories <= 10:
        colors = plt.cm.Set3(range(n_categories))
    else:
        colors = plt.cm.tab20(range(min(n_categories, 20)))
    
    bars = plt.bar(grouped.index.astype(str), grouped.values, color=colors)
    plt.title("Total ${numericColumns[0]} by ${stringColumns[0]}")
    plt.xlabel("${stringColumns[0]}")
    plt.ylabel("Total ${numericColumns[0]}")
    plt.xticks(rotation=45, ha='right')
    
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    chart_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    result = {
        "chart": chart_base64,
        "type": "bar",
        "query": "${query}"
    }
    
    print(json.dumps(result))
except Exception as e:
    error_result = {
        "error": str(e),
        "message": "Failed to generate chart for query: ${query}"
    }
    print(json.dumps(error_result))`;
      } else if (dateColumns.length > 0 && numericColumns.length > 0) {
        // Time series chart
        return `import pandas as pd
import json
import matplotlib.pyplot as plt
import io
import base64

try:
    # Convert date column to datetime and sort
    data['${dateColumns[0]}'] = pd.to_datetime(data['${dateColumns[0]}'])
    data_sorted = data.sort_values('${dateColumns[0]}')
    
    plt.figure(figsize=(12, 6))
    plt.plot(data_sorted['${dateColumns[0]}'], data_sorted['${numericColumns[0]}'], linewidth=2, marker='o', markersize=4)
    plt.title("${numericColumns[0]} Over Time")
    plt.xlabel("Date")
    plt.ylabel("${numericColumns[0]}")
    plt.grid(True, alpha=0.3)
    
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    chart_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    result = {
        "chart": chart_base64,
        "type": "line",
        "query": "${query}"
    }
    
    print(json.dumps(result))
except Exception as e:
    error_result = {
        "error": str(e),
        "message": "Failed to generate chart for query: ${query}"
    }
    print(json.dumps(error_result))`;
      } else {
        // Generic chart
        return `import pandas as pd
import json
import matplotlib.pyplot as plt
import io
import base64

try:
    # Generate a simple histogram of the first numeric column
    plt.figure(figsize=(10, 6))
    if len(data.select_dtypes(include=['number']).columns) > 0:
        column = data.select_dtypes(include=['number']).columns[0]
        # Use default matplotlib colors
        n, bins, patches = plt.hist(data[column].dropna(), bins=20, alpha=0.7)
        plt.title(f"Distribution of {column}")
        plt.xlabel(column)
        plt.ylabel("Frequency")
        plt.grid(True, alpha=0.3)
    else:
        # Fallback if no numeric columns
        plt.text(0.5, 0.5, "No numeric data available for chart", 
                horizontalalignment='center', verticalalignment='center',
                transform=plt.gca().transAxes)
        plt.title("Data Visualization")
    
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    chart_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    result = {
        "chart": chart_base64,
        "type": "histogram",
        "query": "${query}"
    }
    
    print(json.dumps(result))
except Exception as e:
    error_result = {
        "error": str(e),
        "message": "Failed to generate chart for query: ${query}"
    }
    print(json.dumps(error_result))`;
      }
    } else {
      // For non-chart queries, generate analysis code
      return `import pandas as pd
import json

try:
    # Perform data analysis based on the query: ${query}
    # Available columns: ${columnNames.join(', ')}
    
    # Basic data summary
    result = {
        "query": "${query}",
        "row_count": len(data),
        "column_count": len(data.columns),
        "columns": list(data.columns),
        "data_types": {col: str(dtype) for col, dtype in data.dtypes.items()}
    }
    
    # Add numeric column statistics if available
    numeric_cols = data.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        result["numeric_summary"] = data[numeric_cols].describe().to_dict()
    
    # Add date range information if date columns exist
    date_cols = data.select_dtypes(include=['datetime', 'date']).columns
    if len(date_cols) > 0:
        result["date_range"] = {
            "earliest": str(data[date_cols[0]].min()),
            "latest": str(data[date_cols[0]].max())
        }
    
    print(json.dumps(result, default=str))
except Exception as e:
    error_result = {
        "error": str(e),
        "message": "Failed to analyze data for query: ${query}",
        "row_count": len(data) if 'data' in locals() else 0
    }
    print(json.dumps(error_result))`;
    }
  }
}