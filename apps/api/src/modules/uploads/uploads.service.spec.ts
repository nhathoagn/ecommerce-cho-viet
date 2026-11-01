import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadsService } from './uploads.service.js';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example/put'),
}));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
}));

function uploads(publicUrl = 'https://cdn.example') {
  return new UploadsService({
    get: (key: string) => {
      if (key === 'CLOUDFLARE_R2_PUBLIC_URL') return publicUrl;
      if (key === 'CLOUDFLARE_R2_BUCKET_PUBLIC') return 'public';
      if (key.startsWith('S3_')) return '';
      return 'account';
    },
  } as unknown as ConfigService);
}

describe('UploadsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['image/jpeg', 'image/png', 'image/webp'])('presigns %s', async (contentType) => {
    const result = await uploads().presign('s1', { fileName: 'a.JPG', contentType, folder: 'products' });
    expect(result.objectKey).toMatch(/^products\/s1\/.+\.jpg$/);
    expect(result.expiresIn).toBe(300);
    expect(result.publicUrl).toMatch(/^https:\/\/cdn\.example\//);
    expect(getSignedUrl).toHaveBeenCalled();
  });

  it.each(['image/gif', 'application/pdf', 'text/plain', ''])('rejects %j', async (contentType) => {
    await expect(uploads().presign('s1', { fileName: 'a.bin', contentType })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('sanitizes the folder and strips a trailing public slash', async () => {
    const messy = await uploads().presign('s1', {
      fileName: 'a.JP$G',
      contentType: 'image/jpeg',
      folder: '../Products_A!',
    });
    expect(messy.objectKey.startsWith('ProductsA/s1/')).toBe(true);
    expect(messy.objectKey.includes('..')).toBe(false);
    const bare = await uploads('https://cdn.example/').presign('s1', {
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
    });
    expect(bare.publicUrl).not.toContain('example//');
    const hidden = await uploads('').presign('s1', { fileName: 'a.jpg', contentType: 'image/jpeg' });
    expect(hidden.publicUrl).toBeUndefined();
  });
});
