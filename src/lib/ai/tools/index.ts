import type Anthropic from '@anthropic-ai/sdk';
import type { ToolDefinition, ToolResult } from './types';
import { createGoalTool } from './create-goal';
import { categorizeTransactionTool } from './categorize-transaction';
import { createChallengeTool } from './create-challenge';

const CLEO_TOOLS: ToolDefinition[] = [
  createGoalTool,
  categorizeTransactionTool,
  createChallengeTool,
];

/** Convert to Anthropic API tools format */
export function getAnthropicTools(): Anthropic.Tool[] {
  return CLEO_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }));
}

/** Execute a tool by name */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string,
): Promise<ToolResult> {
  const tool = CLEO_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return { success: false, message: `Tool "${name}" não encontrada.` };
  }

  try {
    return await tool.execute(input, userId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao executar ${name}: ${msg}` };
  }
}

export type { ToolDefinition, ToolResult };
