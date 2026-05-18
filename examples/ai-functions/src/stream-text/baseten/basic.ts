import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { run } from '../../lib/run';

const BASETEN_MODEL_ID = '<model-id>'; // 例如5q3z8xcw
const BASETEN_MODEL_URL = `https://model-${BASETEN_MODEL_ID}.api.baseten.co/environments/production/sync/v1`;

const baseten = createOpenAICompatible({
  name: 'baseten',
  baseURL: BASETEN_MODEL_URL,
  headers: {
    Authorization: `Bearer ${process.env.BASETEN_API_KEY ?? ''}`,
  },
});

run(async () => {
  const result = streamText({
    model: baseten('<model-name>'), // 您在 Baseten 部署中提供服务的模型的名称
    prompt: 'Give me a poem about life',
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log();
  console.log('Token usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
});
