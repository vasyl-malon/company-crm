import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3_CLIENT } from './s3.constants';
import { extname } from 'path';

@Injectable()
export class S3Service {
  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  async uploadFile(file: Express.Multer.File) {
    const fileExt = extname(file.originalname);
    const fileName = `image-${Date.now()}${fileExt}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    console.log(file);

    try {
      await this.s3.send(command);
      const url = `${process.env.STORAGE_ENDPOINT}/object/public/${process.env.S3_BUCKET_NAME}/${fileName}`;
      return {
        name: file.originalname,
        url,
      };
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }
}
