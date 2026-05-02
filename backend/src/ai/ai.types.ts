export type AiMessageRole = 'user' | 'assistant';
export type AiMessageType = 'text' | 'image' | 'audio';

export interface AiConversationMessage {
  role: AiMessageRole;
  type: AiMessageType;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface AiConversationPetSummary {
  id: number;
  name: string;
  species: string;
  breed?: string | null;
  gender?: 'male' | 'female' | null;
  birthday?: string | null;
  sterilized: boolean;
  avatar?: string | null;
}

export interface TextProviderMessage {
  role: AiMessageRole;
  content: string;
}

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface UploadedAudioFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}
