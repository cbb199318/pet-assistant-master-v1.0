import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AI_AUDIO_UPLOAD_LIMIT, AI_UPLOAD_LIMIT } from './ai.constants';
import type {
  AiConversationMessage,
  UploadedAudioFile,
  UploadedImageFile,
} from './ai.types';

@Controller('api/ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req, @Body() body: {
    messages: AiConversationMessage[];
    conversationId?: number;
    petId?: number;
  }): Promise<{ response: string; conversationId: number; responseAudioUrl?: string }> {
    return this.aiService.chat(
      req.user.userId,
      body.messages,
      body.conversationId,
      body.petId,
    );
  }

  @Get('conversations')
  async getConversations(@Req() req) {
    return this.aiService.getConversations(req.user.userId);
  }

  @Get('conversations/:id')
  async getConversationById(@Req() req, @Param('id') id: string) {
    return this.aiService.getConversationById(req.user.userId, Number(id));
  }

  @Delete('conversations/:id')
  async deleteConversation(@Req() req, @Param('id') id: string) {
    return this.aiService.deleteConversation(req.user.userId, Number(id));
  }

  @Post('image/analyze')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: AI_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('仅支持上传图片文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async analyzeImage(
    @Req() req,
    @UploadedFile() file: UploadedImageFile,
    @Body() body: {
      prompt?: string;
      conversationId?: string;
      petId?: string;
    },
  ): Promise<{ response: string; conversationId: number; imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const conversationId = body.conversationId ? Number(body.conversationId) : undefined;
    if (body.conversationId && Number.isNaN(conversationId)) {
      throw new BadRequestException('conversationId 格式错误');
    }
    const petId = body.petId ? Number(body.petId) : undefined;
    if (body.petId && Number.isNaN(petId)) {
      throw new BadRequestException('petId 格式错误');
    }

    return this.aiService.analyzeImage(
      req.user.userId,
      file,
      body.prompt,
      conversationId,
      petId,
    );
  }

  @Post('audio/chat')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: AI_AUDIO_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('audio/') && !file.mimetype.includes('webm')) {
          return callback(new BadRequestException('仅支持上传音频文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async chatWithAudio(
    @Req() req,
    @UploadedFile() file: UploadedAudioFile,
    @Body() body: {
      prompt?: string;
      conversationId?: string;
      petId?: string;
    },
  ): Promise<{ response: string; transcript: string; conversationId: number; audioUrl: string; responseAudioUrl?: string }> {
    if (!file) {
      throw new BadRequestException('请上传音频文件');
    }

    const conversationId = body.conversationId ? Number(body.conversationId) : undefined;
    if (body.conversationId && Number.isNaN(conversationId)) {
      throw new BadRequestException('conversationId 格式错误');
    }
    const petId = body.petId ? Number(body.petId) : undefined;
    if (body.petId && Number.isNaN(petId)) {
      throw new BadRequestException('petId 格式错误');
    }

    return this.aiService.chatWithAudio(
      req.user.userId,
      file,
      body.prompt,
      conversationId,
      petId,
    );
  }

  @Post('health-advice')
  async getHealthAdvice(@Body() body: {
    symptoms: string;
    petType: string;
  }): Promise<{ response: string }> {
    const response = await this.aiService.getHealthAdvice(body.symptoms, body.petType);
    return { response };
  }
}
