type State =
  | 'ROOT'
  | 'FINISH'
  | 'INSIDE_STRING'
  | 'INSIDE_STRING_ESCAPE'
  | 'INSIDE_LITERAL'
  | 'INSIDE_NUMBER'
  | 'INSIDE_OBJECT_START'
  | 'INSIDE_OBJECT_KEY'
  | 'INSIDE_OBJECT_AFTER_KEY'
  | 'INSIDE_OBJECT_BEFORE_VALUE'
  | 'INSIDE_OBJECT_AFTER_VALUE'
  | 'INSIDE_OBJECT_AFTER_COMMA'
  | 'INSIDE_ARRAY_START'
  | 'INSIDE_ARRAY_AFTER_VALUE'
  | 'INSIDE_ARRAY_AFTER_COMMA';

// 作为具有附加固定装置的扫描仪实现
// 对部分 JSON 执行单个线性时间扫描。
//
// 理想情况下，这些状态应该与 JSON 规范中的相关状态匹配：
// https://www.json.org/json-en.html
//
// 请注意，不要考虑/覆盖 JSON 的 JSON，因为它
// 假设生成的 JSON 将由标准处理
// JSON 解析器将检测任何无效的 JSON。
export function fixJson(input: string): string {
  const stack: State[] = ['ROOT'];
  let lastValidIndex = -1;
  let literalStart: number | null = null;

  function processValueStart(char: string, i: number, swapState: State) {
    {
      switch (char) {
        case '"': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_STRING');
          break;
        }

        case 'f':
        case 't':
        case 'n': {
          lastValidIndex = i;
          literalStart = i;
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_LITERAL');
          break;
        }

        case '-': {
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_NUMBER');
          break;
        }
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_NUMBER');
          break;
        }

        case '{': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_OBJECT_START');
          break;
        }

        case '[': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push('INSIDE_ARRAY_START');
          break;
        }
      }
    }
  }

  function processAfterObjectValue(char: string, i: number) {
    switch (char) {
      case ',': {
        stack.pop();
        stack.push('INSIDE_OBJECT_AFTER_COMMA');
        break;
      }
      case '}': {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }

  function processAfterArrayValue(char: string, i: number) {
    switch (char) {
      case ',': {
        stack.pop();
        stack.push('INSIDE_ARRAY_AFTER_COMMA');
        break;
      }
      case ']': {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const currentState = stack[stack.length - 1];

    switch (currentState) {
      case 'ROOT':
        processValueStart(char, i, 'FINISH');
        break;

      case 'INSIDE_OBJECT_START': {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push('INSIDE_OBJECT_KEY');
            break;
          }
          case '}': {
            lastValidIndex = i;
            stack.pop();
            break;
          }
        }
        break;
      }

      case 'INSIDE_OBJECT_AFTER_COMMA': {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push('INSIDE_OBJECT_KEY');
            break;
          }
        }
        break;
      }

      case 'INSIDE_OBJECT_KEY': {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push('INSIDE_OBJECT_AFTER_KEY');
            break;
          }
        }
        break;
      }

      case 'INSIDE_OBJECT_AFTER_KEY': {
        switch (char) {
          case ':': {
            stack.pop();
            stack.push('INSIDE_OBJECT_BEFORE_VALUE');

            break;
          }
        }
        break;
      }

      case 'INSIDE_OBJECT_BEFORE_VALUE': {
        processValueStart(char, i, 'INSIDE_OBJECT_AFTER_VALUE');
        break;
      }

      case 'INSIDE_OBJECT_AFTER_VALUE': {
        processAfterObjectValue(char, i);
        break;
      }

      case 'INSIDE_STRING': {
        switch (char) {
          case '"': {
            stack.pop();
            lastValidIndex = i;
            break;
          }

          case '\\': {
            stack.push('INSIDE_STRING_ESCAPE');
            break;
          }

          default: {
            lastValidIndex = i;
          }
        }

        break;
      }

      case 'INSIDE_ARRAY_START': {
        switch (char) {
          case ']': {
            lastValidIndex = i;
            stack.pop();
            break;
          }

          default: {
            lastValidIndex = i;
            processValueStart(char, i, 'INSIDE_ARRAY_AFTER_VALUE');
            break;
          }
        }
        break;
      }

      case 'INSIDE_ARRAY_AFTER_VALUE': {
        switch (char) {
          case ',': {
            stack.pop();
            stack.push('INSIDE_ARRAY_AFTER_COMMA');
            break;
          }

          case ']': {
            lastValidIndex = i;
            stack.pop();
            break;
          }

          default: {
            lastValidIndex = i;
            break;
          }
        }

        break;
      }

      case 'INSIDE_ARRAY_AFTER_COMMA': {
        processValueStart(char, i, 'INSIDE_ARRAY_AFTER_VALUE');
        break;
      }

      case 'INSIDE_STRING_ESCAPE': {
        stack.pop();
        lastValidIndex = i;

        break;
      }

      case 'INSIDE_NUMBER': {
        switch (char) {
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9': {
            lastValidIndex = i;
            break;
          }

          case 'e':
          case 'E':
          case '-':
          case '.': {
            break;
          }

          case ',': {
            stack.pop();

            if (stack[stack.length - 1] === 'INSIDE_ARRAY_AFTER_VALUE') {
              processAfterArrayValue(char, i);
            }

            if (stack[stack.length - 1] === 'INSIDE_OBJECT_AFTER_VALUE') {
              processAfterObjectValue(char, i);
            }

            break;
          }

          case '}': {
            stack.pop();

            if (stack[stack.length - 1] === 'INSIDE_OBJECT_AFTER_VALUE') {
              processAfterObjectValue(char, i);
            }

            break;
          }

          case ']': {
            stack.pop();

            if (stack[stack.length - 1] === 'INSIDE_ARRAY_AFTER_VALUE') {
              processAfterArrayValue(char, i);
            }

            break;
          }

          default: {
            stack.pop();
            break;
          }
        }

        break;
      }

      case 'INSIDE_LITERAL': {
        const partialLiteral = input.substring(literalStart!, i + 1);

        if (
          !'false'.startsWith(partialLiteral) &&
          !'true'.startsWith(partialLiteral) &&
          !'null'.startsWith(partialLiteral)
        ) {
          stack.pop();

          if (stack[stack.length - 1] === 'INSIDE_OBJECT_AFTER_VALUE') {
            processAfterObjectValue(char, i);
          } else if (stack[stack.length - 1] === 'INSIDE_ARRAY_AFTER_VALUE') {
            processAfterArrayValue(char, i);
          }
        } else {
          lastValidIndex = i;
        }

        break;
      }
    }
  }

  let result = input.slice(0, lastValidIndex + 1);

  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i];

    switch (state) {
      case 'INSIDE_STRING': {
        result += '"';
        break;
      }

      case 'INSIDE_OBJECT_KEY':
      case 'INSIDE_OBJECT_AFTER_KEY':
      case 'INSIDE_OBJECT_AFTER_COMMA':
      case 'INSIDE_OBJECT_START':
      case 'INSIDE_OBJECT_BEFORE_VALUE':
      case 'INSIDE_OBJECT_AFTER_VALUE': {
        result += '}';
        break;
      }

      case 'INSIDE_ARRAY_START':
      case 'INSIDE_ARRAY_AFTER_COMMA':
      case 'INSIDE_ARRAY_AFTER_VALUE': {
        result += ']';
        break;
      }

      case 'INSIDE_LITERAL': {
        const partialLiteral = input.substring(literalStart!, input.length);

        if ('true'.startsWith(partialLiteral)) {
          result += 'true'.slice(partialLiteral.length);
        } else if ('false'.startsWith(partialLiteral)) {
          result += 'false'.slice(partialLiteral.length);
        } else if ('null'.startsWith(partialLiteral)) {
          result += 'null'.slice(partialLiteral.length);
        }
      }
    }
  }

  return result;
}
