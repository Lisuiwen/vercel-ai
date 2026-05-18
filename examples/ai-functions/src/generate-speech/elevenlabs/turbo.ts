import { elevenLabs } from '@ai-sdk/elevenlabs';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { saveAudioFile } from '../../lib/save-audio';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateSpeech({
    model: elevenLabs.speech('eleven_turbo_v2_5'),
    text: 'This uses the Turbo model which balances quality and speed, supporting 32 languages.',
    language: 'en', // 可以是 32 种支持的语言中的任何一种
  });

  console.log('Audio:', result.audio);
  console.log('Warnings:', result.warnings);
  console.log('Responses:', result.responses);
  console.log('Provider Metadata:', result.providerMetadata);
  console.log('Model used: eleven_turbo_v2_5 (low latency, high quality)');

  await saveAudioFile(result.audio);
});
