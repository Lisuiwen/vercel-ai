/**
 * 演示图像生成的网关超时错误处理的示例
 *
 * 本示例使用具有极短超时（1ms）的undici来触发
 * 超时错误。 Gateway SDK 将捕获此问题并提供有用的帮助
 * 带有故障排除指南的错误消息。
 *
 * 先决条件：
 * - 设置AI_GATEWAY_API_KEY环境变量
 * （有关设置说明，请参阅 .env.example）
 *
 * 运行：pnpm tsx src/generate-image/gateway/timeout.ts
 */
import { createGateway, generateImage } from 'ai';
import { Agent, fetch as undiciFetch } from 'undici';
import { run } from '../../lib/run';

run(async () => {
  try {
    // 创建一个具有非常短超时时间的undici代理
    // bodyTimeout 适用于接收整个响应正文
    const agent = new Agent({
      headersTimeout: 1, // 1ms - 等待标头将超时
      bodyTimeout: 1, // 1ms - 读取响应正文将超时
    });

    // 使用 undici 和配置的代理创建自定义提取
    const customFetch = (
      url: string | URL | Request,
      options?: RequestInit,
    ): Promise<Response> => {
      return undiciFetch(url as Parameters<typeof undiciFetch>[0], {
        ...(options as any),
        dispatcher: agent,
      }) as Promise<Response>;
    };

    // 创建具有自定义获取的网关提供商
    const gateway = createGateway({
      fetch: customFetch,
    });

    console.log('Making image generation request with 1ms timeout...');
    console.log(
      'This should timeout immediately and show the timeout error handling.\n',
    );

    const { image } = await generateImage({
      model: gateway.imageModel('bfl/flux-2-pro'),
      prompt: 'A serene mountain landscape at sunset',
    });

    console.log('Success! Image generated:');
    console.log('Base64 length:', image.base64.length);
    console.log('Media type:', image.mediaType);
  } catch (error) {
    console.error(
      '╔════════════════════════════════════════════════════════════════╗',
    );
    console.error(
      '║                    TIMEOUT ERROR CAUGHT                        ║',
    );
    console.error(
      '╚════════════════════════════════════════════════════════════════╝\n',
    );
    console.error('Error Name:', (error as Error).name);
    console.error('Error Type:', (error as any).type);
    console.error('Status Code:', (error as any).statusCode);
    console.error('Error Code:', (error as any).code);
    console.error('\nError Message:');
    console.error('─'.repeat(70));
    console.error((error as Error).message);
    console.error('─'.repeat(70));

    // 记录原因以查看原始undici错误
    if ((error as any).cause) {
      console.error('\n📋 Original Error (cause):');
      console.error('  Name:', ((error as any).cause as Error).name);
      console.error('  Code:', ((error as any).cause as any).code);
      console.error('  Message:', ((error as any).cause as Error).message);
      console.error(
        '  Constructor:',
        ((error as any).cause as Error).constructor.name,
      );
    }
  }
});
