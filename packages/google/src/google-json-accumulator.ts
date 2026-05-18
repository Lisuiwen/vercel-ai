export type PartialArg = {
  jsonPath: string;
  stringValue?: string | null;
  numberValue?: number | null;
  boolValue?: boolean | null;
  nullValue?: unknown;
  willContinue?: boolean | null;
};

type PathSegment = string | number;

type StackEntry = {
  segment: PathSegment;
  isArray: boolean;
  childCount: number;
};

/**
 * 从 Google 的流“partialArgs”增量构建 JSON 对象
 * 在工具调用函数调用期间发出的块。跟踪结构化
 * 对象和运行的 JSON 文本表示形式，以便调用者可以发出文本增量
 * 连接时，形成有效的嵌套 JSON 匹配 JSON.stringify 输出。
 *
 * 输入：[{jsonPath:"$.location",stringValue:"波士顿"}]
 * 输出：'{"location":"Boston"'，然后 Finalize() → openingDelta='}'
 */
export class GoogleJSONAccumulator {
  private accumulatedArgs: Record<string, unknown> = {};
  private jsonText = '';

  /**
   * 表示 JSON 输出中当前“打开”容器的堆栈。
   * 一旦写入第一个值，条目 0 始终是根“{”对象。
   */
  private pathStack: StackEntry[] = [];

  /**
   * 字符串值当前是否“打开”（willContinue 为 true），
   * 这意味着收盘价尚未发出。
   */
  private stringOpen = false;

  /**
   * 输入：[{jsonPath:"$.brightness",numberValue:50}]
   * 输出：{ currentJSON:{brightness:50}, textDelta:'{"brightness":50' }
   */
  processPartialArgs(partialArgs: PartialArg[]): {
    currentJSON: Record<string, unknown>;
    textDelta: string;
  } {
    let delta = '';

    for (const arg of partialArgs) {
      const rawPath = arg.jsonPath.replace(/^\$\./, '');
      if (!rawPath) continue;

      const segments = parsePath(rawPath);

      const existingValue = getNestedValue(this.accumulatedArgs, segments);
      const isStringContinuation =
        arg.stringValue != null && existingValue !== undefined;

      if (isStringContinuation) {
        const escaped = JSON.stringify(arg.stringValue).slice(1, -1);
        setNestedValue(
          this.accumulatedArgs,
          segments,
          (existingValue as string) + arg.stringValue,
        );
        delta += escaped;
        continue;
      }

      const resolved = resolvePartialArgValue(arg);
      if (resolved == null) continue;

      setNestedValue(this.accumulatedArgs, segments, resolved.value);
      delta += this.emitNavigationTo(segments, arg, resolved.json);
    }

    this.jsonText += delta;

    return {
      currentJSON: this.accumulatedArgs,
      textDelta: delta,
    };
  }

  /**
   * 输入：jsonText='{"亮度":50',accumulatedArgs={亮度:50}
   * 输出: { FinalJSON:'{"brightness":50}', openingDelta:'}' }
   */
  finalize(): { finalJSON: string; closingDelta: string } {
    const finalArgs = JSON.stringify(this.accumulatedArgs);
    const closingDelta = finalArgs.slice(this.jsonText.length);
    return { finalJSON: finalArgs, closingDelta };
  }

  /**
   * 输入：pathStack=[]（第一次调用）或pathStack=[root,...]（后续调用）
   * 输出：'{'（第一次调用）或''（后续调用）
   */
  private ensureRoot(): string {
    if (this.pathStack.length === 0) {
      this.pathStack.push({ segment: '', isArray: false, childCount: 0 });
      return '{';
    }
    return '';
  }

  /**
   * 发出从当前打开位置导航所需的 JSON 文本片段
   * `targetSegments` 处新叶子的路径，然后写入值。
   *
   * 输入：targetSegments=["recipe","name"], arg={jsonPath:"$.recipe.name",stringValue:"Lasagna"}, valueJson='"Lasagna"'
   * 输出：'{“食谱”：{“名称”：“烤宽面条”'
   */
  private emitNavigationTo(
    targetSegments: PathSegment[],
    arg: PartialArg,
    valueJson: string,
  ): string {
    let fragment = '';

    if (this.stringOpen) {
      fragment += '"';
      this.stringOpen = false;
    }

    fragment += this.ensureRoot();

    const targetContainerSegments = targetSegments.slice(0, -1);
    const leafSegment = targetSegments[targetSegments.length - 1];

    const commonDepth = this.findCommonStackDepth(targetContainerSegments);

    fragment += this.closeDownTo(commonDepth);
    fragment += this.openDownTo(targetContainerSegments, leafSegment);
    fragment += this.emitLeaf(leafSegment, arg, valueJson);

    return fragment;
  }

  /**
   * 返回导航到新目标时要保留的堆栈深度
   * 容器路径。始终 >= 1（根永远不会弹出）。
   *
   * 输入：stack=[root,"菜谱","原料",0], target=["菜谱","原料",1]
   * 输出：3（保留根+“配方”+“原料”）
   */
  private findCommonStackDepth(targetContainer: PathSegment[]): number {
    const maxDepth = Math.min(
      this.pathStack.length - 1,
      targetContainer.length,
    );
    let common = 0;
    for (let i = 0; i < maxDepth; i++) {
      if (this.pathStack[i + 1].segment === targetContainer[i]) {
        common++;
      } else {
        break;
      }
    }
    return common + 1;
  }

  /**
   * 关闭从当前堆栈深度回到“targetDepth”的容器。
   *
   * 输入：this.pathStack=[root,"菜谱","配料",0], targetDepth=3
   * 输出：'}'
   */
  private closeDownTo(targetDepth: number): string {
    let fragment = '';
    while (this.pathStack.length > targetDepth) {
      const entry = this.pathStack.pop()!;
      fragment += entry.isArray ? ']' : '}';
    }
    return fragment;
  }

  /**
   * 打开从当前堆栈深度到完整目标的容器
   * 容器路径，根据需要发出开头“{”、“[”、键和逗号。
   * `leafSegment` 用于判断最里面的容器是否是数组。
   *
   * 输入：this.pathStack=[root], targetContainer=["recipe","ingredients"], leafSegment=0
   * Output: '"recipe":{"ingredients":['
   */
  private openDownTo(
    targetContainer: PathSegment[],
    leafSegment: PathSegment,
  ): string {
    let fragment = '';

    const startIdx = this.pathStack.length - 1;

    for (let i = startIdx; i < targetContainer.length; i++) {
      const seg = targetContainer[i];
      const parentEntry = this.pathStack[this.pathStack.length - 1];

      if (parentEntry.childCount > 0) {
        fragment += ',';
      }
      parentEntry.childCount++;

      if (typeof seg === 'string') {
        fragment += `${JSON.stringify(seg)}:`;
      }

      const childSeg =
        i + 1 < targetContainer.length ? targetContainer[i + 1] : leafSegment;
      const isArray = typeof childSeg === 'number';

      fragment += isArray ? '[' : '{';

      this.pathStack.push({ segment: seg, isArray, childCount: 0 });
    }

    return fragment;
  }

  /**
   * 发出当前容器中叶条目的逗号、键和值。
   *
   * 输入：leafSegment =“name”，arg = {stringValue：“烤宽面条”}，valueJson ='“烤宽面条”'
   * 输出：'“name”：“Lasagna”'（或'，“name”：“Lasagna”'如果container.childCount> 0）
   */
  private emitLeaf(
    leafSegment: PathSegment,
    arg: PartialArg,
    valueJson: string,
  ): string {
    let fragment = '';
    const container = this.pathStack[this.pathStack.length - 1];

    if (container.childCount > 0) {
      fragment += ',';
    }
    container.childCount++;

    if (typeof leafSegment === 'string') {
      fragment += `${JSON.stringify(leafSegment)}:`;
    }

    if (arg.stringValue != null && arg.willContinue) {
      fragment += valueJson.slice(0, -1);
      this.stringOpen = true;
    } else {
      fragment += valueJson;
    }

    return fragment;
  }
}

/**
 * 将点/括号内的 JSON 路径（如“recipe.ingredients[0].name”）拆分为段。
 *
 * 输入：“recipe.ingredients[0].name”
 * 输出：[“食谱”，“成分”，0，“名称”]
 */
function parsePath(rawPath: string): Array<string | number> {
  const segments: Array<string | number> = [];
  for (const part of rawPath.split('.')) {
    const bracketIdx = part.indexOf('[');
    if (bracketIdx === -1) {
      segments.push(part);
    } else {
      if (bracketIdx > 0) segments.push(part.slice(0, bracketIdx));
      for (const m of part.matchAll(/\[(\d+)\]/g)) {
        segments.push(parseInt(m[1], 10));
      }
    }
  }
  return segments;
}

/**
 * 沿着给定的路径段遍历嵌套对象并返回叶子值。
 *
 * 输入：（{食谱：{名称：“千层面”}}，[“食谱”，“名称”]）
 * 输出：“烤宽面条”
 */
function getNestedValue(
  obj: Record<string, unknown>,
  segments: Array<string | number>,
): unknown {
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string | number, unknown>)[seg];
  }
  return current;
}

/**
 * 在嵌套路径处设置一个值，根据需要创建中间对象或数组。
 *
 * 输入：obj={},segment=["菜谱","配料",0,"名称"], value="面条"
 * 输出：{食谱：{成分：[{名称：“面条”}]}}
 */
function setNestedValue(
  obj: Record<string, unknown>,
  segments: Array<string | number>,
  value: unknown,
): void {
  let current: Record<string | number, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    if (current[seg] == null) {
      current[seg] = typeof nextSeg === 'number' ? [] : {};
    }
    current = current[seg] as Record<string | number, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}

/**
 * 从部分 arg 中提取第一个非空类型值，并以其 JSON 表示形式返回它。
 *
 * 输入：arg={stringValue:"Boston"} 或 arg={numberValue:50}
 * 输出：{value:"Boston", json:'"Boston"'} 或 {value:50, json:'50'}
 */
function resolvePartialArgValue(arg: {
  stringValue?: string | null;
  numberValue?: number | null;
  boolValue?: boolean | null;
  nullValue?: unknown;
}): { value: unknown; json: string } | undefined {
  const value = arg.stringValue ?? arg.numberValue ?? arg.boolValue;
  if (value != null) return { value, json: JSON.stringify(value) };
  if ('nullValue' in arg) return { value: null, json: 'null' };
  return undefined;
}
