import {
  elevenLabs,
  type ElevenLabsSpeechModelOptions,
} from '@ai-sdk/elevenlabs';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { saveAudioFile } from '../../lib/save-audio';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateSpeech({
    model: elevenLabs.speech('eleven_multilingual_v2'),
    text: 'This speech has custom voice settings for more expressive output.',
    speed: 1.2,
    providerOptions: {
      elevenlabs: {
        voiceSettings: {
          stability: 0.3, // 降低以获得更多变化
          similarityBoost: 0.8, // 越高越接近原始声音
          style: 0.6, // 控制说话风格
          useSpeakerBoost: true, // 增强语音清晰度
        },
      } satisfies ElevenLabsSpeechModelOptions,
    },
  });

  console.log('Audio:', result.audio);
  console.log('Warnings:', result.warnings);
  console.log('Responses:', result.responses);
  console.log('Provider Metadata:', result.providerMetadata);

  await saveAudioFile(result.audio);
});
