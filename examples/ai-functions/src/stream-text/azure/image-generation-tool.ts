import { createAzure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { presentImages } from '../../lib/present-image';
import { run } from '../../lib/run';
import { convertBase64ToUint8Array } from '../../lib/convert-base64';

run(async () => {
  const azure = createAzure({
    headers: {
      'x-ms-oai-image-generation-deployment': 'gpt-image-1', // 使用您自己的图像模型部署
    },
  });

  const result = streamText({
    model: azure.responses('gpt-4.1-mini'), // 使用您自己的部署
    prompt: `Create an anime-like image of a cute raccoon waving hello.`,
    tools: {
      image_generation: azure.tools.imageGeneration({
        outputFormat: 'png', // 在 azure 上，支持的扩展名是 png 和 jpeg。
        quality: 'medium',
        size: '1024x1024',
      }),
    },
  });

  for await (const part of result.fullStream) {
    if (part.type == 'tool-result' && !part.dynamic) {
      await presentImages([
        {
          mediaType: 'image/png',
          base64: part.output.result,
          uint8Array: convertBase64ToUint8Array(part.output.result),
        },
      ]);
    }
  }
});
