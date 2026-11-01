import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PresignUploadDto } from '../seller-catalog/catalog.dto.js';

@Injectable()
export class UploadsService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('CLOUDFLARE_ACCOUNT_ID') ?? '';
    this.bucket = config.get<string>('CLOUDFLARE_R2_BUCKET_PUBLIC') ?? '';
    this.publicUrl = (
      config.get<string>('CLOUDFLARE_R2_PUBLIC_URL') ?? ''
    ).replace(/\/$/, '');
    // Any S3-compatible store works: the R2 endpoint stays the default, and
    // S3_ENDPOINT points at something else (Supabase Storage, B2, MinIO).
    this.client = new S3Client({
      region: config.get<string>('S3_REGION') || 'auto',
      endpoint:
        config.get<string>('S3_ENDPOINT') ||
        `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: config.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey:
          config.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async presign(sellerId: string, dto: PresignUploadDto) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(dto.contentType))
      throw new BadRequestException('Unsupported image type');
    const extension = extname(dto.fileName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, '');
    const folder = (dto.folder ?? 'products').replace(/[^a-z0-9-]/gi, '');
    const objectKey = `${folder}/${sellerId}/${randomUUID()}${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: dto.contentType,
    });
    return {
      uploadUrl: await getSignedUrl(this.client, command, { expiresIn: 300 }),
      objectKey,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${objectKey}` : undefined,
      expiresIn: 300,
    };
  }
}
