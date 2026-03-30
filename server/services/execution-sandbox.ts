import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export class ExecutionSandbox {
    private static instance: ExecutionSandbox;

    // Docker configuration
    private readonly IMAGE_NAME = "python:3.9-slim";
    private readonly MEMORY_LIMIT = "512m";
    private readonly CPU_LIMIT = "1.0";
    private readonly TIMEOUT_MS = 30000; // 30 seconds

    private constructor() { }

    public static getInstance(): ExecutionSandbox {
        if (!ExecutionSandbox.instance) {
            ExecutionSandbox.instance = new ExecutionSandbox();
        }
        return ExecutionSandbox.instance;
    }

    async execute(code: string, context: any = {}): Promise<any> {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sandbox-'));
        const scriptPath = path.join(tempDir, 'script.py');
        const inputPath = path.join(tempDir, 'input.json');

        try {
            // Prepare input data
            await fs.writeFile(inputPath, JSON.stringify(context));

            // Wrap code to handle input/output
            const wrappedCode = `
import sys
import json
import pandas as pd
import numpy as np

try:
    # Read input context
    with open('${inputPath}', 'r') as f:
        context = json.load(f)
    
    # User code execution wrapper
    def run_user_code():
${code.split('\n').map(line => '        ' + line).join('\n')}
        
    # Execute
    result = run_user_code()
    
    # Print result as JSON to stdout
    print(json.dumps({"success": True, "output": str(result)}))

except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

            await fs.writeFile(scriptPath, wrappedCode);

            // Run in Docker
            // Mounting the temp directory to /app in the container
            const command = `docker run --rm \
        --network none \
        --memory ${this.MEMORY_LIMIT} \
        --cpus ${this.CPU_LIMIT} \
        -v "${tempDir}:/app" \
        -w /app \
        ${this.IMAGE_NAME} \
        python script.py`;

            const { stdout, stderr } = await execAsync(command, { timeout: this.TIMEOUT_MS });

            if (stderr) {
                console.warn("Sandbox stderr:", stderr);
            }

            try {
                return JSON.parse(stdout);
            } catch (e) {
                return { success: false, error: "Failed to parse container output", raw: stdout };
            }

        } catch (error: any) {
            console.error("Sandbox execution error:", error);
            return {
                success: false,
                error: error.message || "Execution failed",
                details: error.stderr
            };
        } finally {
            // Cleanup
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch (e) {
                console.error("Failed to cleanup sandbox temp dir:", e);
            }
        }
    }
}
