export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
  execute: (input: Record<string, unknown>, userId: string) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
