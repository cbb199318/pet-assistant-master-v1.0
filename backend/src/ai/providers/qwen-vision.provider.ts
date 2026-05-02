import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class QwenVisionProvider {
  private readonly apiKey = process.env.QWEN_API_KEY || '';
  private readonly baseUrl =
    process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  private readonly model = process.env.QWEN_VISION_MODEL || 'qwen3-vl-flash';

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async analyzeImage(imageDataUrl: string, prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的宠物图片识别助手。请先客观描述图片中看到的内容，再结合宠物健康与护理场景给出建议。如果出现皮肤异常、伤口、排泄物异常、呕吐物、明显疼痛或其他风险迹象，请明确提醒用户尽快线下就医。所有分析都必须说明仅供参考，不能替代兽医诊断。',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
              {
                type: 'text',
                text: prompt,
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
        timeout: 45000,
      },
    );

    return response.data.choices?.[0]?.message?.content || '抱歉，我暂时无法完成图片分析，请稍后再试。';
  }
}
