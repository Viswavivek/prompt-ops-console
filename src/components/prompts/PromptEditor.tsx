import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Select, Spinner } from '@/components/common';
import {
  validatePrompt,
  guessLanguage,
  type PromptLanguage,
  type PromptValidation,
} from './promptValidation';

export function PromptEditor({
  value,
  onChange,
  readOnly = false,
  height = 420,
  onValidationChange,
}: {
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  height?: number;
  onValidationChange?: (v: PromptValidation) => void;
}) {
  const [language, setLanguage] = useState<PromptLanguage>(() => guessLanguage(value));
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(() => {
    onValidationChange?.(validatePrompt(value, language));
  }, [value, language, onValidationChange]);

  const validation = validatePrompt(value, language);

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-content-subtle">Syntax</span>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value as PromptLanguage)}
            className="h-7 w-auto py-0 text-xs"
          >
            <option value="plaintext">Plain text</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </Select>
        </div>
        {!readOnly && !validation.ok && (
          <span className="text-danger">{validation.message}</span>
        )}
        {readOnly && <span className="text-content-subtle">read-only</span>}
      </div>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        loading={<Spinner className="h-5 w-5" />}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'var(--font-mono, monospace)',
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          renderWhitespace: 'boundary',
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
