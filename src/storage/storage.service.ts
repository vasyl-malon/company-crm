import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { s3Client } from 'src/integrations/s3.client';

@Injectable()
export class StorageService {
  async uploadFile(file: Express.Multer.File) {
    const fileExt = extname(file.originalname);
    const fileName = `image-${Date.now()}${fileExt}`;

    console.log(process.env.S3_REGION)

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await s3Client.send(command);
      const publicUrl = `${process.env.STORAGE_ENDPOINT}/object/public/${process.env.S3_BUCKET_NAME}/${fileName}`;
      return publicUrl;
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }
}
