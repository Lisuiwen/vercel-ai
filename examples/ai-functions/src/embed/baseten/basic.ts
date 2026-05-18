import { createBaseten } from '@ai-sdk/baseten';
import { embed } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // 使用 Performance Client 和自定义模型 URL 进行嵌入
  // 性能客户端需要 /sync 端点并自动处理批处理
  const EMBEDDING_MODEL_ID = '<model-id>'; // 例如03y7n6e3
  const EMBEDDING_MODEL_URL = `https://model-${EMBEDDING_MODEL_ID}.api.baseten.co/environments/production/sync`;

  const baseten = createBaseten({
    modelURL: EMBEDDING_MODEL_URL,
  });

  const { embedding, usage, warnings } = await embed({
    model: baseten.embeddingModel(),
    value: 'sunny day at the beach',
  });

  console.log('Embedding dimension:', embedding.length);
  console.log('First 5 values:', embedding.slice(0, 5));
  console.log('Usage:', usage);
  console.log('Warnings:', warnings);
});
