import type { JSONSchema7 } from '@ai-sdk/provider';

const DEFAULT_SCHEMA_PREFIX = 'JSON schema:';
const DEFAULT_SCHEMA_SUFFIX =
  'You MUST answer with a JSON object that matches the JSON schema above.';
const DEFAULT_GENERIC_SUFFIX = 'You MUST answer with JSON.';

export function injectJsonInstruction({
  prompt,
  schema,
  schemaPrefix = schema != null ? DEFAULT_SCHEMA_PREFIX : undefined,
  schemaSuffix = schema != null
    ? DEFAULT_SCHEMA_SUFFIX
    : DEFAULT_GENERIC_SUFFIX,
}: {
  prompt?: string;
  schema?: JSONSchema7;
  schemaPrefix?: string;
  schemaSuffix?: string;
}): string {
  return [
    prompt != null && prompt.length > 0 ? prompt : undefined,
    prompt != null && prompt.length > 0 ? '' : undefined, // 如果提示不为空，则添加换行符
    schemaPrefix,
    schema != null ? JSON.stringify(schema) : undefined,
    schemaSuffix,
  ]
    .filter(line => line != null)
    .join('\n');
}
