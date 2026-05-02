import { resolve } from 'path';
import { UPLOAD_ROOT } from '../ai/ai.constants';

export const HEALTH_UPLOAD_LIMIT = 10 * 1024 * 1024;
export const HEALTH_UPLOAD_DIR = resolve(UPLOAD_ROOT, 'health');
export const HEALTH_UPLOAD_PUBLIC_PREFIX = '/uploads/health';
