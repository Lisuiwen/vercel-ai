import {
  amazonBedrock,
  type AmazonBedrockEmbeddingModelOptions,
} from '@ai-sdk/amazon-bedrock';
import { embed } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // Nova 嵌入模型支持自定义尺寸和用途
  const { embedding, usage, warnings } = await embed({
    model: amazonBedrock.embedding('amazon.nova-2-multimodal-embeddings-v1:0'),
    value: 'sunny day at the beach',
    providerOptions: {
      bedrock: {
        embeddingDimension: 256,
        embeddingPurpose: 'TEXT_RETRIEVAL',
        truncate: 'END',
      } satisfies AmazonBedrockEmbeddingModelOptions,
    },
  });

  console.log(`Embedding dimensions: ${embedding.length}`);
  console.log(embedding);
  console.log(usage);
  console.log(warnings);
});
