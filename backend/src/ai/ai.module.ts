import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiConversation } from './ai-conversation.entity';
import { User } from '../users/user.entity';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';
import { DeepseekTextProvider } from './providers/deepseek-text.provider';
import { QwenAudioProvider } from './providers/qwen-audio.provider';
import { QwenVisionProvider } from './providers/qwen-vision.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
      User,
      Pet,
      Vaccination,
      Deworming,
      Checkup,
      Care,
    ]),
  ],
  providers: [AiService, DeepseekTextProvider, QwenVisionProvider, QwenAudioProvider],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
