import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { execFile } from 'child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import axios from 'axios';
import ffmpegPath from 'ffmpeg-static';
import { AiConversation } from './ai-conversation.entity';
import { User } from '../users/user.entity';
import { AI_UPLOAD_DIR, AI_UPLOAD_PUBLIC_PREFIX } from './ai.constants';
import {
  AiConversationMessage,
  AiConversationPetSummary,
  TextProviderMessage,
  UploadedAudioFile,
  UploadedImageFile,
} from './ai.types';
import { DeepseekTextProvider } from './providers/deepseek-text.provider';
import { QwenAudioProvider } from './providers/qwen-audio.provider';
import { QwenVisionProvider } from './providers/qwen-vision.provider';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly conversationRepository: Repository<AiConversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Vaccination)
    private readonly vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Deworming)
    private readonly dewormingRepository: Repository<Deworming>,
    @InjectRepository(Checkup)
    private readonly checkupRepository: Repository<Checkup>,
    @InjectRepository(Care)
    private readonly careRepository: Repository<Care>,
    private readonly deepseekTextProvider: DeepseekTextProvider,
    private readonly qwenAudioProvider: QwenAudioProvider,
    private readonly qwenVisionProvider: QwenVisionProvider,
  ) {}

  private formatDate(date?: Date | string | null) {
    if (!date) {
      return '';
    }

    const normalizedDate = new Date(date);
    if (Number.isNaN(normalizedDate.getTime())) {
      return '';
    }

    return normalizedDate.toISOString().slice(0, 10);
  }

  private toPetSummary(pet: Pet): AiConversationPetSummary {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      gender: pet.gender || null,
      birthday: this.formatDate(pet.birthday),
      sterilized: Boolean(pet.sterilized),
      avatar: pet.avatar || null,
    };
  }

  private async getPetByUser(userId: number, petId: number) {
    const pet = await this.petRepository.findOne({
      where: { id: petId, user_id: userId },
    });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  private async buildPetContext(userId: number, petId: number) {
    const pet = await this.getPetByUser(userId, petId);
    const [vaccinations, dewormings, checkups, cares] = await Promise.all([
      this.vaccinationRepository.find({
        where: { pet_id: petId },
        order: { vaccination_date: 'DESC', id: 'DESC' },
        take: 2,
      }),
      this.dewormingRepository.find({
        where: { pet_id: petId },
        order: { deworming_date: 'DESC', id: 'DESC' },
        take: 2,
      }),
      this.checkupRepository.find({
        where: { pet_id: petId },
        order: { checkup_date: 'DESC', id: 'DESC' },
        take: 2,
      }),
      this.careRepository.find({
        where: { pet_id: petId },
        order: { date: 'DESC', id: 'DESC' },
        take: 3,
      }),
    ]);

    const lines = [
      '以下是当前咨询宠物的档案，请将它作为背景信息结合用户问题回答。除非用户追问，不需要逐条复述档案原文。',
      `- 宠物名字：${pet.name}`,
      `- 种类：${pet.species || '未知'}`,
      `- 品种：${pet.breed || '未知'}`,
      `- 性别：${pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}`,
      `- 生日：${this.formatDate(pet.birthday) || '未知'}`,
      `- 是否绝育：${pet.sterilized ? '已绝育' : '未绝育'}`,
      `- 最近疫苗：${
        vaccinations.length > 0
          ? vaccinations
              .map(
                (item) =>
                  `${item.vaccine_name}（${this.formatDate(item.vaccination_date) || '日期未知'}）`,
              )
              .join('；')
          : '暂无记录'
      }`,
      `- 最近驱虫：${
        dewormings.length > 0
          ? dewormings
              .map(
                (item) =>
                  `${item.product_name} ${item.type === 'internal' ? '体内' : item.type === 'external' ? '体外' : '体内外'}（${this.formatDate(item.deworming_date) || '日期未知'}）`,
              )
              .join('；')
          : '暂无记录'
      }`,
      `- 最近体检：${
        checkups.length > 0
          ? checkups
              .map(
                (item) =>
                  `${item.hospital}（${this.formatDate(item.checkup_date) || '日期未知'}）${item.diagnosis ? `，诊断：${item.diagnosis}` : ''}`,
              )
              .join('；')
          : '暂无记录'
      }`,
      `- 最近护理：${
        cares.length > 0
          ? cares
              .map(
                (item) =>
                  `${item.type}（${this.formatDate(item.date) || '日期未知'}）${item.description ? `，${item.description}` : ''}`,
              )
              .join('；')
          : '暂无记录'
      }`,
    ];

    return {
      summary: this.toPetSummary(pet),
      prompt: lines.join('\n'),
    };
  }

  private getFallbackMessage(type: 'chat' | 'image' | 'advice') {
    if (type === 'chat' && !this.deepseekTextProvider.isConfigured()) {
      return 'AI 服务暂未配置，请在后端环境变量中设置 DEEPSEEK_API_KEY 后重试。';
    }
    if (type === 'image' && !this.qwenVisionProvider.isConfigured()) {
      return '图片识别服务暂未配置，请在后端环境变量中设置 QWEN_API_KEY 后重试。';
    }
    if (type === 'advice' && !this.deepseekTextProvider.isConfigured()) {
      return 'AI 健康建议暂未配置，请先设置 DEEPSEEK_API_KEY。';
    }

    if (type === 'chat') {
      return '抱歉，我暂时无法提供回答，请稍后再试。';
    }
    if (type === 'image') {
      return '抱歉，我暂时无法分析图片，请稍后再试。';
    }
    return '抱歉，我暂时无法提供健康建议，请稍后再试。';
  }

  private getProviderErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message?.trim()) {
      return error.message.trim();
    }

    return fallback;
  }

  private isServiceErrorMessage(content?: string) {
    return Boolean(
      content &&
        /(配置异常|暂未配置|请求超时|调用失败|无效或已失效|未采集到有效声音|录音文件过短|录音过短)/.test(
          content,
        ),
    );
  }

  private normalizeMessage(message: any): AiConversationMessage | null {
    if (!message || !['user', 'assistant'].includes(message.role)) {
      return null;
    }

    const normalizedType =
      message.type === 'image' ? 'image' : message.type === 'audio' ? 'audio' : 'text';
    const normalizedContent =
      typeof message.content === 'string' ? message.content.trim() : '';
    const normalizedImageUrl =
      typeof message.imageUrl === 'string' && message.imageUrl.trim()
        ? message.imageUrl.trim()
        : undefined;
    const normalizedAudioUrl =
      typeof message.audioUrl === 'string' && message.audioUrl.trim()
        ? message.audioUrl.trim()
        : undefined;

    if (normalizedType === 'image' && !normalizedImageUrl) {
      if (!normalizedContent) {
        return null;
      }

      return {
        role: message.role,
        type: 'text',
        content: normalizedContent,
      };
    }

    if (normalizedType === 'audio' && !normalizedAudioUrl) {
      if (!normalizedContent) {
        return null;
      }

      return {
        role: message.role,
        type: 'text',
        content: normalizedContent,
      };
    }

    if (normalizedType === 'text' && !normalizedContent) {
      return null;
    }

    return {
        role: message.role,
        type: normalizedType,
        content:
          normalizedContent ||
          (normalizedType === 'image'
            ? '请帮我识别这张宠物相关图片。'
            : normalizedType === 'audio'
              ? '请帮我识别这段宠物相关语音。'
              : ''),
        imageUrl: normalizedImageUrl,
        audioUrl: normalizedAudioUrl,
      };
  }

  private normalizeMessages(messages: any[]): AiConversationMessage[] {
    return (messages || [])
      .map((message) => this.normalizeMessage(message))
      .filter(Boolean) as AiConversationMessage[];
  }

  private buildTitle(messages: AiConversationMessage[]) {
    const firstUserMessage = messages.find((message) => message.role === 'user');
    if (!firstUserMessage) {
      return '新的 AI 对话';
    }

    if (firstUserMessage.type === 'image') {
      return '图片识别会话';
    }
    if (firstUserMessage.type === 'audio') {
      return '语音问答会话';
    }

    const normalizedContent = firstUserMessage.content.replace(/\s+/g, ' ').trim();
    return normalizedContent.length > 24
      ? `${normalizedContent.slice(0, 24)}...`
      : normalizedContent;
  }

  private getPreviewText(message?: AiConversationMessage) {
    if (!message) {
      return '';
    }

    if (message.type === 'image') {
      return message.content || '用户上传了一张图片';
    }
    if (message.type === 'audio') {
      return message.content || '用户发送了一段语音';
    }

    return message.content || '';
  }

  private toConversationSummary(
    conversation: AiConversation,
    pet?: AiConversationPetSummary | null,
  ) {
    const normalizedMessages = this.normalizeMessages(conversation.messages);
    const lastMessage = normalizedMessages[normalizedMessages.length - 1];
    return {
      id: conversation.id,
      title: conversation.title,
      messageCount: normalizedMessages.length,
      lastMessagePreview: this.getPreviewText(lastMessage).slice(0, 80),
      pet: pet || null,
      updated_at: conversation.updated_at,
      created_at: conversation.created_at,
    };
  }

  private toTextProviderMessages(
    messages: AiConversationMessage[],
    petContextPrompt?: string,
  ): TextProviderMessage[] {
    const providerMessages = messages.map((message) => {
      if (message.type === 'image') {
        return {
          role: message.role,
          content: `${message.content || '用户上传了一张图片'}${message.imageUrl ? `（图片地址：${message.imageUrl}）` : ''}`,
        };
      }
      if (message.type === 'audio') {
        return {
          role: message.role,
          content: `语音转写内容：${message.content}`,
        };
      }

      return {
        role: message.role,
        content: message.content,
      };
    });

    if (!petContextPrompt) {
      return providerMessages;
    }

    return [
      {
        role: 'user',
        content: petContextPrompt,
      },
      ...providerMessages,
    ];
  }

  private async getConversationForUser(userId: number, conversationId: number) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('AI 会话不存在');
    }
    if (conversation.user_id !== userId) {
      throw new ForbiddenException('无权访问该会话');
    }
    return conversation;
  }

  private async saveConversation(
    userId: number,
    messages: AiConversationMessage[],
    conversationId?: number,
    petId?: number | null,
  ) {
    let conversation: AiConversation | null = null;
    if (conversationId) {
      conversation = await this.getConversationForUser(userId, conversationId);
    }

    if (!conversation) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      conversation = this.conversationRepository.create({
        user_id: userId,
        user,
        title: this.buildTitle(messages),
        messages,
        pet_id: petId ?? null,
      });
    } else {
      conversation.title = this.buildTitle(messages);
      conversation.messages = messages;
      if (petId !== undefined) {
        conversation.pet_id = petId;
      }
    }

    return this.conversationRepository.save(conversation);
  }

  private getImageExtension(mimetype: string, originalname?: string) {
    const originalExt = extname(originalname || '').toLowerCase();
    if (originalExt) {
      return originalExt;
    }

    if (mimetype === 'image/png') return '.png';
    if (mimetype === 'image/webp') return '.webp';
    if (mimetype === 'image/gif') return '.gif';
    return '.jpg';
  }

  private async persistFile(file: { originalname: string; mimetype: string; buffer: Buffer }, prefix: string) {
    await mkdir(AI_UPLOAD_DIR, { recursive: true });
    const extension = this.getMediaExtension(file.mimetype, file.originalname);
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    const absolutePath = `${AI_UPLOAD_DIR}/${filename}`;
    await writeFile(absolutePath, file.buffer);
    return `${AI_UPLOAD_PUBLIC_PREFIX}/${filename}`;
  }

  private async persistImage(file: UploadedImageFile) {
    return this.persistFile(file, 'ai-image');
  }

  private async persistAudio(file: UploadedAudioFile) {
    return this.persistFile(file, 'ai-audio');
  }

  private toImageDataUrl(file: UploadedImageFile) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  private getMediaExtension(mimetype: string, originalname?: string) {
    const originalExt = extname(originalname || '').toLowerCase();
    if (originalExt) {
      return originalExt;
    }

    if (mimetype === 'image/png') return '.png';
    if (mimetype === 'image/webp') return '.webp';
    if (mimetype === 'image/gif') return '.gif';
    if (mimetype === 'audio/webm') return '.webm';
    if (mimetype === 'audio/mpeg') return '.mp3';
    if (mimetype === 'audio/wav') return '.wav';
    if (mimetype === 'audio/mp4' || mimetype === 'audio/m4a') return '.m4a';
    return mimetype.startsWith('audio/') ? '.m4a' : '.jpg';
  }

  private async transcodeAudioToMp3(file: UploadedAudioFile) {
    if (!file.buffer?.length || file.buffer.length < 1024) {
      throw new Error('录音文件过短或未采集到有效声音');
    }

    if (!ffmpegPath) {
      throw new Error('ffmpeg static binary 不可用');
    }
    const resolvedFfmpegPath = ffmpegPath;

    const sourceExtension = this.getMediaExtension(file.mimetype, file.originalname);
    const sourcePath = join(
      tmpdir(),
      `pet-ai-source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${sourceExtension}`,
    );
    const targetPath = join(
      tmpdir(),
      `pet-ai-target-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`,
    );

    await writeFile(sourcePath, file.buffer);

    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          resolvedFfmpegPath,
          ['-y', '-i', sourcePath, '-vn', '-acodec', 'libmp3lame', targetPath],
          (error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          },
        );
      });

      const transcodedBuffer = await readFile(targetPath);
      return transcodedBuffer.toString('base64');
    } finally {
      await Promise.allSettled([rm(sourcePath), rm(targetPath)]);
    }
  }

  private getDefaultImagePrompt() {
    return '请识别这张宠物相关图片：先描述你看到了什么，再给出宠物护理或健康建议。如果存在风险迹象，请提醒尽快线下就医，并明确说明仅供参考，不能替代兽医诊断。';
  }

  private async generateSpeechAudio(text: string): Promise<string | undefined> {
    if (!this.qwenAudioProvider.isConfigured()) {
      return undefined;
    }

    try {
      const audioBase64 = await this.qwenAudioProvider.synthesizeSpeech(text);
      if (!audioBase64) {
        return undefined;
      }

      const buffer = Buffer.from(audioBase64, 'base64');
      await mkdir(AI_UPLOAD_DIR, { recursive: true });
      const filename = `ai-tts-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.wav`;
      const absolutePath = `${AI_UPLOAD_DIR}/${filename}`;
      await writeFile(absolutePath, buffer);
      return `${AI_UPLOAD_PUBLIC_PREFIX}/${filename}`;
    } catch (error) {
      console.error('TTS generation error:', error);
      return undefined;
    }
  }

  private getDefaultAudioPrompt() {
    return '请准确转写这段宠物相关语音内容。';
  }

  async chat(
    userId: number,
    messages: AiConversationMessage[],
    conversationId?: number,
    petId?: number,
  ) {
    const sanitizedMessages = this.normalizeMessages(messages);
    if (sanitizedMessages.length === 0) {
      return {
        response: '请先输入你想咨询的问题。',
        conversationId: conversationId || 0,
      };
    }

    const existingConversation = conversationId
      ? await this.getConversationForUser(userId, conversationId)
      : null;
    const resolvedPetId =
      petId !== undefined ? petId : existingConversation?.pet_id ?? null;
    const petContext = resolvedPetId
      ? await this.buildPetContext(userId, resolvedPetId)
      : null;

    let response = this.getFallbackMessage('chat');
    if (this.deepseekTextProvider.isConfigured()) {
      try {
        response = await this.deepseekTextProvider.chat(
          this.toTextProviderMessages(sanitizedMessages, petContext?.prompt),
        );
      } catch (error) {
        console.error('AI API error:', error);
        response = this.getFallbackMessage('chat');
      }
    }

    const savedMessages: AiConversationMessage[] = [
      ...sanitizedMessages,
      {
        role: 'assistant',
        type: 'text',
        content: response,
      },
    ];

    const savedConversation = await this.saveConversation(
      userId,
      savedMessages,
      conversationId,
      resolvedPetId,
    );

    const responseAudioUrl = await this.generateSpeechAudio(response);

    return {
      response,
      conversationId: savedConversation.id,
      responseAudioUrl,
    };
  }

  async analyzeImage(
    userId: number,
    file: UploadedImageFile,
    prompt?: string,
    conversationId?: number,
    petId?: number,
  ) {
    const imageUrl = await this.persistImage(file);
    const imagePrompt = prompt?.trim() || this.getDefaultImagePrompt();
    const existingConversation = conversationId
      ? await this.getConversationForUser(userId, conversationId)
      : null;
    const resolvedPetId =
      petId !== undefined ? petId : existingConversation?.pet_id ?? null;
    const petContext = resolvedPetId
      ? await this.buildPetContext(userId, resolvedPetId)
      : null;
    const providerPrompt = petContext
      ? `${imagePrompt}\n\n${petContext.prompt}`
      : imagePrompt;

    let response = this.getFallbackMessage('image');
    if (this.qwenVisionProvider.isConfigured()) {
      try {
        response = await this.qwenVisionProvider.analyzeImage(
          this.toImageDataUrl(file),
          providerPrompt,
        );
      } catch (error) {
        console.error('Qwen image analysis error:', error);
        response = this.getProviderErrorMessage(error, this.getFallbackMessage('image'));
      }
    }

    const baseMessages = existingConversation
      ? this.normalizeMessages(existingConversation.messages)
      : [];

    const savedMessages: AiConversationMessage[] = [
      ...baseMessages,
      {
        role: 'user',
        type: 'image',
        content: imagePrompt,
        imageUrl,
      },
      {
        role: 'assistant',
        type: 'text',
        content: response,
      },
    ];

    const savedConversation = await this.saveConversation(
      userId,
      savedMessages,
      conversationId,
      resolvedPetId,
    );

    return {
      response,
      conversationId: savedConversation.id,
      imageUrl,
    };
  }

  async chatWithAudio(
    userId: number,
    file: UploadedAudioFile,
    prompt?: string,
    conversationId?: number,
    petId?: number,
  ) {
    const audioUrl = await this.persistAudio(file);
    const existingConversation = conversationId
      ? await this.getConversationForUser(userId, conversationId)
      : null;
    const resolvedPetId =
      petId !== undefined ? petId : existingConversation?.pet_id ?? null;
    const petContext = resolvedPetId
      ? await this.buildPetContext(userId, resolvedPetId)
      : null;
    const audioPrompt = prompt || this.getDefaultAudioPrompt();

    let transcript = '语音转写服务暂未配置，请在后端环境变量中设置 QWEN_API_KEY 后重试。';
    if (this.qwenAudioProvider.isConfigured()) {
      try {
        transcript =
          (await this.qwenAudioProvider.transcribeAudio(
            await this.transcodeAudioToMp3(file),
            audioPrompt,
          )) || '未能识别出清晰语音内容，请重试。';
      } catch (error) {
        console.error('Qwen audio transcription error:', error);
        transcript = this.getProviderErrorMessage(error, '语音转写失败，请稍后重试。');
      }
    }

    const baseMessages = existingConversation
      ? this.normalizeMessages(existingConversation.messages)
      : [];

    const audioMessage: AiConversationMessage = {
      role: 'user',
      type: 'audio',
      content: transcript,
      audioUrl,
    };

    if (this.isServiceErrorMessage(transcript)) {
      const savedConversation = await this.saveConversation(
        userId,
        [
          ...baseMessages,
          audioMessage,
          {
            role: 'assistant',
            type: 'text',
            content: transcript,
          },
        ],
        conversationId,
        resolvedPetId || undefined,
      );

      return {
        response: transcript,
        transcript,
        conversationId: savedConversation.id,
        audioUrl,
      };
    }

    const chatResult = await this.chat(
      userId,
      [...baseMessages, audioMessage],
      conversationId,
      resolvedPetId || undefined,
    );

    return {
      response: chatResult.response,
      transcript,
      conversationId: chatResult.conversationId,
      audioUrl,
      responseAudioUrl: chatResult.responseAudioUrl,
    };
  }

  async getConversations(userId: number) {
    const conversations = await this.conversationRepository.find({
      where: { user_id: userId },
      order: { updated_at: 'DESC' },
    });

    const petIds = Array.from(
      new Set(
        conversations
          .map((conversation) => conversation.pet_id)
          .filter((petId): petId is number => typeof petId === 'number'),
      ),
    );
    const pets = petIds.length
      ? await this.petRepository.find({
          where: petIds.map((petId) => ({ id: petId, user_id: userId })),
        })
      : [];
    const petMap = new Map(pets.map((pet) => [pet.id, this.toPetSummary(pet)]));

    return conversations.map((conversation) =>
      this.toConversationSummary(
        conversation,
        conversation.pet_id ? petMap.get(conversation.pet_id) || null : null,
      ),
    );
  }

  async getConversationById(userId: number, id: number) {
    const conversation = await this.getConversationForUser(userId, id);
    const petSummary =
      conversation.pet_id != null
        ? this.toPetSummary(await this.getPetByUser(userId, conversation.pet_id))
        : null;

    return {
      id: conversation.id,
      title: conversation.title,
      pet: petSummary,
      messages: this.normalizeMessages(conversation.messages || []),
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    };
  }

  async deleteConversation(userId: number, id: number) {
    const conversation = await this.getConversationForUser(userId, id);
    await this.conversationRepository.delete(conversation.id);
    return { message: 'AI 会话删除成功' };
  }

  async getHealthAdvice(symptoms: string, petType: string): Promise<string> {
    if (!this.deepseekTextProvider.isConfigured()) {
      return this.getFallbackMessage('advice');
    }

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                '你是一个专业的宠物健康助手，专注于提供准确的宠物健康建议。请基于用户描述的症状，为用户提供专业、友好的健康建议。',
            },
            {
              role: 'user',
              content: `我的${petType}出现了以下症状：${symptoms}。请提供相关的健康建议和处理方法。`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
          },
        },
      );

      return response.data.choices?.[0]?.message?.content || this.getFallbackMessage('advice');
    } catch (error) {
      console.error('AI health advice error:', error);
      return this.getFallbackMessage('advice');
    }
  }
}
