import {
  createProviderDefinedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

const computer_20241022InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      action: z.enum([
        'key',
        'type',
        'mouse_move',
        'left_click',
        'left_click_drag',
        'right_click',
        'middle_click',
        'double_click',
        'screenshot',
        'cursor_position',
      ]),
      coordinate: z.array(z.number().int()).optional(),
      text: z.string().optional(),
    }),
  ),
);

export const computer_20241022 = createProviderDefinedToolFactory<
  {
    /**
     * 要执行的操作。可用的操作有：
     * - `key`：按键盘上的键或组合键。
     *   - 这支持 xdotool 的“key”语法。
     *   - 示例：“a”、“Return”、“alt+Tab”、“ctrl+s”、“Up”、“KP_0”（用于数字键盘 0 键）。
     * - `type`：在键盘上输入文本字符串。
     * - `cursor_position`：获取光标在屏幕上的当前（x，y）像素坐标。
     * - `mouse_move`：将光标移动到屏幕上指定的（x，y）像素坐标。
     * - `left_click`：单击鼠标左键。
     * - `left_click_drag`：单击并将光标拖动到屏幕上指定的（x，y）像素坐标。
     * - `right_click`：单击鼠标右键。
     * - `middle_click`：单击鼠标中键。
     * - `double_click`：双击鼠标左键。
     * - `屏幕截图`：截取屏幕截图。
     */
    action:
      | 'key'
      | 'type'
      | 'mouse_move'
      | 'left_click'
      | 'left_click_drag'
      | 'right_click'
      | 'middle_click'
      | 'double_click'
      | 'screenshot'
      | 'cursor_position';

    /**
     * (x, y)：鼠标移动到的 x（距左边缘的像素）和 y（距上边缘的像素）坐标。仅“action=mouse_move”和“action=left_click_drag”需要。
     */
    coordinate?: number[];

    /**
     * 仅“action=type”和“action=key”需要。
     */
    text?: string;
  },
  {
    /**
     * 由模型控制的显示宽度（以像素为单位）。
     */
    displayWidthPx: number;

    /**
     * 由模型控制的显示高度（以像素为单位）。
     */
    displayHeightPx: number;

    /**
     * 要控制的显示编号（仅与 X11 环境相关）。如果指定，将在工具定义中为工具提供显示编号。
     */
    displayNumber?: number;
  }
>({
  id: 'anthropic.computer_20241022',
  inputSchema: computer_20241022InputSchema,
});
