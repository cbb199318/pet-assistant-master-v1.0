import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TextProviderMessage } from '../ai.types';

@Injectable()
export class DeepseekTextProvider {
  private readonly apiKey = process.env.DEEPSEEK_API_KEY || '';
  private readonly baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  private readonly model = process.env.DEEPSEEK_TEXT_MODEL || 'deepseek-chat';

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async chat(messages: TextProviderMessage[]): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的宠物健康助手，专注于提供准确的宠物健康建议和护理指导。请基于你的知识，为用户提供专业、友好的回答。',
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 30000,
      },
    );

    return response.data.choices?.[0]?.message?.content || '抱歉，我暂时无法提供回答，请稍后再试。';
  }
}
