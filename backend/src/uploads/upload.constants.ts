import { resolve } from 'path';
import { UPLOAD_ROOT } from '../ai/ai.constants';

export const PROFILE_UPLOAD_DIR = resolve(UPLOAD_ROOT, 'profile');
export const PROFILE_UPLOAD_PUBLIC_PREFIX = '/uploads/profile';
export const PROFILE_UPLOAD_LIMIT = 10 * 1024 * 1024;

export const PRODUCT_UPLOAD_DIR = resolve(UPLOAD_ROOT, 'product');
export const PRODUCT_UPLOAD_PUBLIC_PREFIX = '/uploads/product';
export const PRODUCT_UPLOAD_LIMIT = 10 * 1024 * 1024;
