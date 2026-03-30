import { DeepSeekClient } from "./deepseek-client";

export interface Recommendation {
  id: string;
  type: 'followup' | 'deepdive' | 'action' | 'exploration';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  suggestedQuery?: string;
  expectedInsight?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  action: string;
  status: 'pending' | 'in-progress' | 'completed';
  estimatedTime: string;
}

export class RecommendationEngine {
  private deepSeekClient: DeepSeekClient;

  constructor(apiKey: string) {
    this.deepSeekClient = new DeepSeekClient(apiKey);
  }

  /**
   * Generate smart recommendations based on analysis context
   */
  async generateRecommendations(context: any, previousQuery?: string): Promise<Recommendation[]> {
    const systemPrompt = this.buildRecommendationSystemPrompt();
    const userPrompt = this.buildRecommendationUserPrompt(context, previousQuery);

    try {
      const response = await this.deepSeekClient.callDeepSeekAPI(systemPrompt, userPrompt);
      const recommendations = this.parseRecommendationResponse(response);
      
      return recommendations;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate guided workflow steps for complex analyses
   */
  async generateWorkflow(context: any, goal: string): Promise<WorkflowStep[]> {
    const systemPrompt = this.buildWorkflowSystemPrompt();
    const userPrompt = this.buildWorkflowUserPrompt(context, goal);

    try {
      const response = await this.deepSeekClient.callDeepSeekAPI(systemPrompt, userPrompt);
      const workflow = this.parseWorkflowResponse(response);
      
      return workflow;
    } catch (error) {
      console.error('Workflow generation error:', error);
      throw new Error(`Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildRecommendationSystemPrompt(): string {
    return `You are Lumina's intelligent recommendation engine, designed to suggest next best actions for business data analysis.

Your role is to provide actionable recommendations that help users:
1. Ask follow-up questions to deepen their analysis
2. Explore related metrics or dimensions
3. Take concrete business actions based on insights
4. Discover hidden patterns in their data

Format your response as a JSON array with this EXACT structure:
[
  {
    "id": "unique_identifier",
    "type": "followup|deepdive|action|exploration",
    "title": "Clear, compelling title",
    "description": "Detailed explanation of why this recommendation matters",
    "priority": "low|medium|high",
    "suggestedQuery": "Optional natural language query to ask", // Only for followup and exploration types
    "expectedInsight": "What insight this query would reveal" // Only for followup and exploration types
  }
]

CRITICAL RULES:
1. ONLY return valid JSON array
2. NEVER include markdown formatting
3. Keep titles compelling and action-oriented
4. Make descriptions specific and valuable
5. Prioritize high-impact recommendations
6. Include suggested queries only for relevant types
7. If generating fewer than 4 recommendations, that's OK
8. Focus on business impact, not technical details`;
  }

  private buildRecommendationUserPrompt(context: any, previousQuery?: string): string {
    const columnNames = context.schema.columns.map((col: any) => col.name).join(', ');
    
    let prompt = `Based on this business dataset, generate smart recommendations:

Dataset Information:
- File: ${context.filename}
- Total records: ${context.rowCount}
- Columns: ${columnNames}`;

    if (previousQuery) {
      prompt += `\n\nPrevious analysis question: "${previousQuery}"`;
    }

    prompt += `\n\nSuggest 3-4 next best actions or questions that would provide additional business value.
Focus on actionable insights that could drive business decisions.`;

    return prompt;
  }

  private buildWorkflowSystemPrompt(): string {
    return `You are Lumina's workflow guidance system, designed to break down complex business analyses into manageable steps.

When a user wants to accomplish a complex goal, you provide a step-by-step workflow that:
1. Breaks down the analysis into logical phases
2. Suggests specific questions for each step
3. Explains what insights each step would reveal
4. Estimates the time required for each step

Format your response as a JSON array with this EXACT structure:
[
  {
    "id": "unique_identifier",
    "title": "Clear step title",
    "description": "What this step accomplishes and why it matters",
    "action": "Specific action or question to pursue",
    "status": "pending",
    "estimatedTime": "Time estimate (e.g., '5 minutes', '10 minutes')"
  }
]

CRITICAL RULES:
1. ONLY return valid JSON array
2. NEVER include markdown formatting
3. Keep steps practical and achievable
4. Make time estimates realistic
5. Number steps logically from start to finish
6. Focus on business outcomes, not technical tasks`;
  }

  private buildWorkflowUserPrompt(context: any, goal: string): string {
    const columnNames = context.schema.columns.map((col: any) => col.name).join(', ');
    
    return `Create a guided workflow for this complex business analysis:

Dataset Information:
- File: ${context.filename}
- Total records: ${context.rowCount}
- Columns: ${columnNames}

User Goal: "${goal}"

Break this down into 4-6 actionable steps that guide the user through a comprehensive analysis.
Each step should build on the previous one to provide a complete picture.`;
  }

  private parseRecommendationResponse(response: any): Recommendation[] {
    try {
      // Clean the response to remove any markdown formatting
      const cleanResponse = response.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '[]';
      const parsed = JSON.parse(cleanResponse);
      
      // Validate and format the recommendations
      if (Array.isArray(parsed)) {
        return parsed.map(rec => ({
          ...rec,
          id: rec.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing recommendation response:', error);
      return [];
    }
  }

  private parseWorkflowResponse(response: any): WorkflowStep[] {
    try {
      // Clean the response to remove any markdown formatting
      const cleanResponse = response.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '[]';
      const parsed = JSON.parse(cleanResponse);
      
      // Validate and format the workflow steps
      if (Array.isArray(parsed)) {
        return parsed.map((step, index) => ({
          ...step,
          id: step.id || `step_${index + 1}`,
          status: step.status || 'pending'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing workflow response:', error);
      return [];
    }
  }
}