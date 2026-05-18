import { createBaseten } from '@ai-sdk/baseten';
import { embedMany } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // 使用 Performance Client 和自定义模型 URL 进行批量嵌入
  // Performance Client 自动处理批处理和并行处理
  const EMBEDDING_MODEL_ID = '<model-id>'; // 例如03y7n6e3
  const EMBEDDING_MODEL_URL = `https://model-${EMBEDDING_MODEL_ID}.api.baseten.co/environments/production/sync`;

  const baseten = createBaseten({
    modelURL: EMBEDDING_MODEL_URL,
  });

  const { embeddings, usage, warnings } = await embedMany({
    model: baseten.embeddingModel(),
    values: [
      'sunny day at the beach',
      'rainy afternoon in the city',
      'snowy mountain peak',
      'foggy morning in the forest',
    ],
  });

  console.log('Number of embeddings:', embeddings.length);
  console.log('Embedding dimension:', embeddings[0].length);
  console.log('First embedding (first 5 values):', embeddings[0].slice(0, 5));
  console.log('Usage:', usage);
  console.log('Warnings:', warnings);
});
