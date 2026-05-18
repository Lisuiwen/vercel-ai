import {
  createProviderDefinedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

const computer_20251124InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      action: z.enum([
        'key',
        'hold_key',
        'type',
        'cursor_position',
        'mouse_move',
        'left_mouse_down',
        'left_mouse_up',
        'left_click',
        'left_click_drag',
        'right_click',
        'middle_click',
        'double_click',
        'triple_click',
        'scroll',
        'wait',
        'screenshot',
        'zoom',
      ]),
      coordinate: z.tuple([z.number().int(), z.number().int()]).optional(),
      duration: z.number().optional(),
      region: z
        .tuple([
          z.number().int(),
          z.number().int(),
          z.number().int(),
          z.number().int(),
        ])
        .optional(),
      scroll_amount: z.number().optional(),
      scroll_direction: z.enum(['up', 'down', 'left', 'right']).optional(),
      start_coordinate: z
        .tuple([z.number().int(), z.number().int()])
        .optional(),
      text: z.string().optional(),
    }),
  ),
);

export const computer_20251124 = createProviderDefinedToolFactory<
  {
    /**
     * - `key`：按键盘上的键或组合键。
     *   - 这支持 xdotool 的“key”语法。
     *   - 示例：“a”、“Return”、“alt+Tab”、“ctrl+s”、“Up”、“KP_0”（用于数字键盘 0 键）。
     * - `hold_key`：按住一个键或多个键指定的持续时间（以秒为单位）。支持与“key”相同的语法。
     * - `type`：在键盘上输入文本字符串。
     * - `cursor_position`：获取光标在屏幕上的当前（x，y）像素坐标。
     * - `mouse_move`：将光标移动到屏幕上指定的（x，y）像素坐标。
     * - `left_mouse_down`：按下鼠标左键。
     * - `left_mouse_up`：释放鼠标左键。
     * - `left_click`：在屏幕上指定的（x，y）像素坐标处单击鼠标左键。您还可以包含一个组合键，以便在使用“text”参数单击时按住。
     * - `left_click_drag`：单击并将光标从`start_coordinate`拖动到屏幕上指定的（x，y）像素坐标。
     * - `right_click`：在屏幕上指定的（x，y）像素坐标处单击鼠标右键。
     * - `middle_click`：在屏幕上指定的（x，y）像素坐标处单击鼠标中键。
     * - `double_click`：在屏幕上指定的 (x, y) 像素坐标处双击鼠标左键。
     * - `triple_click`：在屏幕上指定的 (x, y) 像素坐标处三次单击鼠标左键。
     * - `scroll`：在指定的 (x, y) 像素坐标处，按指定的滚轮点击次数，以指定的方向滚动屏幕。请勿使用 PageUp/PageDown 滚动。
     * - `wait`：等待指定的持续时间（以秒为单位）。
     * - `屏幕截图`：截取屏幕截图。
     * - “缩放”：以全分辨率查看屏幕的特定区域。需要工具定义中的“enableZoom: true”。采用“region”参数，其坐标“[x1, y1, x2, y2]”定义要检查区域的左上角和右下角。
     */
    action:
      | 'key'
      | 'hold_key'
      | 'type'
      | 'cursor_position'
      | 'mouse_move'
      | 'left_mouse_down'
      | 'left_mouse_up'
      | 'left_click'
      | 'left_click_drag'
      | 'right_click'
      | 'middle_click'
      | 'double_click'
      | 'triple_click'
      | 'scroll'
      | 'wait'
      | 'screenshot'
      | 'zoom';

    /**
     * (x, y)：鼠标移动到的 x（距左边缘的像素）和 y（距上边缘的像素）坐标。仅“action=mouse_move”和“action=left_click_drag”需要。
     */
    coordinate?: [number, number];

    /**
     * 按住按键的持续时间。仅“action=hold_key”和“action=wait”需要。
     */
    duration?: number;

    /**
     * [x1, y1, x2, y2]：定义要放大的区域的坐标。 x1, y1 是左上角，x2, y2 是右下角。仅“action=zoom”需要。
     */
    region?: [number, number, number, number];

    /**
     * 滚动的“点击”次数。仅由 `action=scroll` 需要。
     */
    scroll_amount?: number;

    /**
     * 滚动屏幕的方向。仅由 `action=scroll` 需要。
     */
    scroll_direction?: 'up' | 'down' | 'left' | 'right';

    /**
     * (x, y)：开始拖动的 x（距左边缘的像素）和 y（距上边缘的像素）坐标。仅“action=left_click_drag”需要。
     */
    start_coordinate?: [number, number];

    /**
     * 仅“action=type”、“action=key”和“action=hold_key”需要。还可以通过单击或滚动操作来在单击或滚动时按住按键。
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

    /**
     * 启用缩放操作。设置为 true 以允许 Claude 放大到特定的屏幕区域。默认值：假。
     */
    enableZoom?: boolean;
  }
>({
  id: 'anthropic.computer_20251124',
  inputSchema: computer_20251124InputSchema,
});
