import {
  createProviderDefinedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

const textEditor_20250124InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      command: z.enum(['view', 'create', 'str_replace', 'insert', 'undo_edit']),
      path: z.string(),
      file_text: z.string().optional(),
      insert_line: z.number().int().optional(),
      new_str: z.string().optional(),
      insert_text: z.string().optional(),
      old_str: z.string().optional(),
      view_range: z.array(z.number().int()).optional(),
    }),
  ),
);

export const textEditor_20250124 = createProviderDefinedToolFactory<
  {
    /**
     * 要运行的命令。允许的选项有：“view”、“create”、“str_replace”、“insert”、“undo_edit”。
     */
    command: 'view' | 'create' | 'str_replace' | 'insert' | 'undo_edit';

    /**
     * 文件或目录的绝对路径，例如`/repo/file.py` 或 `/repo`。
     */
    path: string;

    /**
     * `create` 命令必需的参数，包含要创建的文件的内容。
     */
    file_text?: string;

    /**
     * `insert` 命令的必需参数。 `new_str` 将被插入到 `path` 的 `insert_line` 行之后。
     */
    insert_line?: number;

    /**
     * 包含新字符串的 `str_replace` 命令的可选参数（如果未给出，则不会添加任何字符串）。
     */
    new_str?: string;

    /**
     * 包含要插入的文本的“insert”命令的必需参数。
     */
    insert_text?: string;

    /**
     * `str_replace` 命令的必需参数，包含要替换的 `path` 中的字符串。
     */
    old_str?: string;

    /**
     * 当“path”指向文件时，“view”命令的可选参数。如果没有给出，则显示完整文件。如果提供，文件将显示在指定的行号范围内，例如[11, 12] 将显示第 11 行和第 12 行。索引从 1 开始。设置“[start_line, -1]”显示从“start_line”到文件末尾的所有行。
     */
    view_range?: number[];
  },
  {}
>({
  id: 'anthropic.text_editor_20250124',
  inputSchema: textEditor_20250124InputSchema,
});
