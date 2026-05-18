import { cohere, type CohereEmbeddingModelOptions } from '@ai-sdk/cohere';
import { embed } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // 输出尺寸：256、512、1024 或 1536（默认）
  const { embedding, usage, warnings } = await embed({
    model: cohere.embedding('embed-v4.0'),
    value: 'sunny day at the beach',
    providerOptions: {
      cohere: {
        outputDimension: 256,
      } satisfies CohereEmbeddingModelOptions,
    },
  });

  console.log(embedding);
  console.log(usage);
  console.log(warnings);
});
