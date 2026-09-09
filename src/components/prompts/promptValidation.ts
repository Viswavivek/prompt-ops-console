export type PromptLanguage = 'plaintext' | 'json' | 'markdown';

export interface PromptValidation {
  ok: boolean;
  message?: string;
}

/** Validate content before it can be saved (docs spec §5). */
export function validatePrompt(content: string, language: PromptLanguage): PromptValidation {
  if (!content.trim()) return { ok: false, message: 'Prompt content cannot be empty.' };
  if (language === 'json') {
    try {
      JSON.parse(content);
    } catch (e) {
      return { ok: false, message: `Invalid JSON: ${(e as Error).message}` };
    }
  }
  return { ok: true };
}

export function guessLanguage(content: string): PromptLanguage {
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || trimmed.startsWith('[')) return 'json';
  if (/^#|\n#|\*\*|```/.test(trimmed)) return 'markdown';
  return 'plaintext';
}
