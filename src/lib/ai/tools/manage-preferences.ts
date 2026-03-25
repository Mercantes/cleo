import type { ToolDefinition, ToolResult } from './types';
import { savePreferences, loadPreferences } from '@/lib/ai/preference-engine';

export const managePreferencesTool: ToolDefinition = {
  name: 'manage_preferences',
  description:
    'Salvar ou consultar preferências do usuário. Use quando o usuário pedir "lembre que eu prefiro...", "me chame de...", ou perguntar sobre suas preferências.',
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['save', 'list'],
        description: 'Ação: "save" para salvar preferência, "list" para listar todas',
      },
      preference_key: {
        type: 'string',
        description:
          'Chave da preferência (ex: response_style, nickname, show_charts, financial_goal)',
      },
      preference_value: {
        type: 'string',
        description: 'Valor da preferência',
      },
    },
    required: ['action'],
  },
  execute: async (input: Record<string, unknown>, userId: string): Promise<ToolResult> => {
    const action = input.action as string;

    if (action === 'list') {
      const prefs = await loadPreferences(userId);
      if (prefs.length === 0) {
        return {
          success: true,
          message: 'Nenhuma preferência salva ainda.',
          data: { preferences: [] },
        };
      }
      return {
        success: true,
        message: `${prefs.length} preferência(s) encontrada(s).`,
        data: {
          preferences: prefs.map((p) => ({
            key: p.key,
            value: p.value,
            source: p.source,
          })),
        },
      };
    }

    if (action === 'save') {
      const key = input.preference_key as string;
      const value = input.preference_value as string;

      if (!key || !value) {
        return {
          success: false,
          message: 'preference_key e preference_value são obrigatórios para salvar.',
        };
      }

      const count = await savePreferences(userId, [{ key, value }], 'explicit');

      if (count > 0) {
        return {
          success: true,
          message: `Preferência "${key}" salva com sucesso.`,
          data: { key, value },
        };
      }

      return { success: false, message: 'Erro ao salvar preferência.' };
    }

    return { success: false, message: `Ação "${action}" não reconhecida.` };
  },
};
