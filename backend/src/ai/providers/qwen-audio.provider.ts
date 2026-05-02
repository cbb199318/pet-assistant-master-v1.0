import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class QwenAudioProvider {
  private readonly apiKey = process.env.QWEN_API_KEY || '';
  private readonly baseUrl =
    process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  private readonly model = process.env.QWEN_AUDIO_MODEL || 'qwen3.5-omni-flash';

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async transcribeAudio(audioBase64: string, prompt?: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        modalities: ['text'],
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的中文语音转写助手。请准确转写用户音频中的内容，只输出转写文本，不要添加解释，不要总结。',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: `data:audio/mp3;base64,${audioBase64}`,
                },
              },
              {
                type: 'text',
                text:
                  prompt?.trim() ||
                  '请准确转写这段宠物相关语音内容，只输出转写文本。',
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 30000,
      },
    );

    return response.data.choices?.[0]?.message?.content?.trim() || '';
  }

  async synthesizeSpeech(text: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          modalities: ['text', 'audio'],
          audio: { voice: 'Chelsie', format: 'wav' },
          messages: [
            {
              role: 'system',
              content:
                '你是一个专业的宠物健康助手，请用自然流畅的中文朗读以下内容。',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const audioData = response.data.choices?.[0]?.message?.audio?.data;
      if (!audioData) {
        return null;
      }
      return audioData;
    } catch (error) {
      console.error('Qwen TTS error:', error);
      return null;
    }
  }
}
