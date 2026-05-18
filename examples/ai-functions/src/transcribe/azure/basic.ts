import { azure } from '@ai-sdk/azure';
import { experimental_transcribe as transcribe } from 'ai';
import { readFile } from 'fs/promises';
import { run } from '../../lib/run';

/**
 *
 * *** 注意 ***
 * 据报道，转录在默认版本中无法按预期工作。
 * 如果您想使用工作版本，请尝试下面的源代码。
 *
 * ai\examples\ai-functions\src\transcribe\azure-deployment-based.ts
 *
 */

run(async () => {
  const result = await transcribe({
    model: azure.transcription('whisper-1'), // 使用您自己的部署
    audio: await readFile('data/galileo.mp3'),
  });

  console.log('Text:', result.text);
  console.log('Duration:', result.durationInSeconds);
  console.log('Language:', result.language);
  console.log('Segments:', result.segments);
  console.log('Warnings:', result.warnings);
  console.log('Responses:', result.responses);
});
