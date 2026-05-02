import { resolve } from 'path';

export const AI_UPLOAD_LIMIT = 10 * 1024 * 1024;
export const AI_AUDIO_UPLOAD_LIMIT = 20 * 1024 * 1024;
export const UPLOAD_ROOT = resolve(__dirname, '..', '..', 'uploads');
export const AI_UPLOAD_DIR = resolve(UPLOAD_ROOT, 'ai');
export const AI_UPLOAD_PUBLIC_PREFIX = '/uploads/ai';
