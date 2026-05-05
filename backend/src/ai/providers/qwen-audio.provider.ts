import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { Readable } from 'stream';

@Injectable()
export class QwenAudioProvider {
  private readonly apiKey = process.env.QWEN_API_KEY || '';
  private readonly baseUrl =
    process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  private readonly model = process.env.QWEN_AUDIO_MODEL || 'qwen3.5-omni-plus';
  private readonly voice = process.env.QWEN_AUDIO_VOICE || 'Tina';

  isConfigured() {
    return Boolean(this.apiKey);
  }

  private toUserFriendlyError(error: any, scene: 'transcription' | 'tts') {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const providerMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message;
      const providerCode = error.response?.data?.error?.code;

      if (status === 401 || providerCode === 'invalid_api_key') {
        return new Error(
          scene === 'transcription'
            ? '语音转写服务配置异常：当前 QWEN_API_KEY 无效或已失效，请更新后重试。'
            : '语音播报服务配置异常：当前 QWEN_API_KEY 无效或已失效，请更新后重试。',
        );
      }

      if (
        providerCode === 'model_not_found' ||
        (/model/i.test(String(providerMessage || '')) &&
          /not found|invalid/i.test(String(providerMessage || '')))
      ) {
        return new Error(
          scene === 'transcription'
            ? '语音转写模型配置异常，请检查 QWEN_AUDIO_MODEL。'
            : '语音播报模型配置异常，请检查 QWEN_AUDIO_MODEL。',
        );
      }

      if (error.code === 'ECONNABORTED') {
        return new Error(
          scene === 'transcription' ? '语音转写请求超时，请稍后重试。' : '语音播报请求超时，请稍后重试。',
        );
      }

      if (scene === 'tts' && /voice .* not supported/i.test(String(providerMessage || ''))) {
        return new Error('语音播报音色配置异常，请检查 QWEN_AUDIO_VOICE。');
      }

      return new Error(
        `${scene === 'transcription' ? '语音转写' : '语音播报'}服务调用失败：${providerMessage || '未知错误'}`,
      );
    }

    if (error instanceof Error) {
      if (scene === 'tts' && /voice .* not supported/i.test(error.message)) {
        return new Error('语音播报音色配置异常，请检查 QWEN_AUDIO_VOICE。');
      }
      return error;
    }

    return new Error(`${scene === 'transcription' ? '语音转写' : '语音播报'}服务调用失败，请稍后重试。`);
  }

  async transcribeAudio(audioBase64: string, prompt?: string): Promise<string> {
    try {
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
    } catch (error) {
      throw this.toUserFriendlyError(error, 'transcription');
    }
  }

  private async collectStreamedAudio(stream: Readable): Promise<string | null> {
    let buffer = '';
    let audioBase64 = '';

    for await (const chunk of stream) {
      buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue;
          }

          const payloadText = line.slice(5).trim();
          if (!payloadText || payloadText === '[DONE]') {
            continue;
          }

          const payload = JSON.parse(payloadText);
          if (payload?.error?.message) {
            throw new Error(payload.error.message);
          }

          const deltaAudio = payload?.choices?.[0]?.delta?.audio?.data;
          if (typeof deltaAudio === 'string' && deltaAudio.length > 0) {
            audioBase64 += deltaAudio;
          }
        }
      }
    }

    return audioBase64 || null;
  }

  async synthesizeSpeech(text: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          stream: true,
          stream_options: {
            include_usage: true,
          },
          modalities: ['text', 'audio'],
          audio: { voice: this.voice, format: 'wav' },
          messages: [
            {
              role: 'user',
              content: `请用自然流畅的中文朗读以下内容，不要补充额外说明：\n${text}`,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
          responseType: 'stream',
        },
      );

      return this.collectStreamedAudio(response.data);
    } catch (error) {
      console.error('Qwen TTS error:', error);
      throw this.toUserFriendlyError(error, 'tts');
    }
  }
}
