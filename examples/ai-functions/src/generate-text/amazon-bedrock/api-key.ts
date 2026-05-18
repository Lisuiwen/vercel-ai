import { amazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  console.log('=== Amazon Bedrock API Key Authentication Example ===\n');

  // 示例 1：通过环境变量 (AWS_BEARER_TOKEN_BEDROCK) 使用 API 密钥
  // 这是生产应用程序的推荐方法
  console.log(
    'Example 1: Using API key from environment variable (AWS_BEARER_TOKEN_BEDROCK)',
  );
  try {
    const result1 = await generateText({
      model: amazonBedrock('anthropic.claude-3-haiku-20240307-v1:0'),
      prompt: 'Write a haiku about API keys.',
      // 注意：API 密钥自动从 AWS_BEARER_TOKEN_BEDROCK 环境变量加载
    });

    console.log('Generated haiku:', result1.text);
    console.log('Token usage:', result1.usage);
    console.log('Finish reason:', result1.finishReason);
  } catch (error) {
    console.log(
      'Error (expected if AWS_BEARER_TOKEN_BEDROCK not set):',
      (error as Error).message,
    );
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 示例 2：直接在提供程序配置中使用 API 密钥
  // 这演示了如何直接传递 API 密钥（不建议用于生产）
  console.log('Example 2: Using API key directly in provider configuration');

  // 出于演示目的 - 在实际应用中，从安全环境加载
  const exampleApiKey =
    process.env.AWS_BEARER_TOKEN_BEDROCK || 'your-api-key-here';

  try {
    // 使用显式 API 密钥创建提供程序
    const { createAmazonBedrock } = await import('@ai-sdk/amazon-bedrock');
    const bedrockWithApiKey = createAmazonBedrock({
      apiKey: exampleApiKey,
      region: 'us-east-1', // 可选：指定区域
    });

    const result2 = await generateText({
      model: bedrockWithApiKey('anthropic.claude-3-haiku-20240307-v1:0'),
      prompt: 'Explain the benefits of API key authentication over AWS SigV4.',
    });

    console.log('Generated explanation:', result2.text);
    console.log('Token usage:', result2.usage);
  } catch (error) {
    console.log(
      'Error (expected if API key not valid):',
      (error as Error).message,
    );
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 示例 3：与 SigV4 身份验证的比较
  console.log('Example 3: Comparison - API Key vs SigV4 Authentication');

  console.log(`
API Key Authentication (Simpler):
- Set AWS_BEARER_TOKEN_BEDROCK environment variable
- No need for AWS credentials (access key, secret key, session token)
- Simpler configuration and setup
- Bearer token authentication in HTTP headers

SigV4 Authentication (Traditional AWS):
- Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- Optional AWS_SESSION_TOKEN for temporary credentials
- More complex request signing process
- Full AWS IAM integration and policies

API Key authentication is ideal for:
- Simplified deployment scenarios
- Applications that don't need full AWS IAM integration
- Easier credential management
- Reduced complexity in authentication flow
  `);

  // 示例 4：错误处理和回退
  console.log('Example 4: Demonstrating fallback behavior');

  try {
    // 如果设置了 AWS_BEARER_TOKEN_BEDROCK，这将使用 API 密钥，
    // 否则回退到 SigV4 身份验证
    const result4 = await generateText({
      model: amazonBedrock('anthropic.claude-3-haiku-20240307-v1:0'),
      prompt: 'Write a short poem about authentication methods.',
    });

    console.log('Generated poem:', result4.text);
    console.log(
      'Authentication method used: API Key or SigV4 (automatic fallback)',
    );
  } catch (error) {
    console.log('Error:', (error as Error).message);
    console.log(
      'Make sure either AWS_BEARER_TOKEN_BEDROCK or AWS credentials are configured',
    );
  }
});
