import { elevenLabs } from '@ai-sdk/elevenlabs';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { saveAudioFile } from '../../lib/save-audio';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateSpeech({
    model: elevenLabs.speech('eleven_multilingual_v2'),
    text: 'This audio is generated in high-quality MP3 format.',
    outputFormat: 'mp3_44100_192', // 192kbps 的高品质 MP3
  });

  console.log('Audio:', result.audio);
  console.log('Warnings:', result.warnings);
  console.log('Responses:', result.responses);
  console.log('Provider Metadata:', result.providerMetadata);
  console.log('Output format: MP3 at 44.1kHz, 192kbps');

  await saveAudioFile(result.audio);
});
