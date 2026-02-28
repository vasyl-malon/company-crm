import { Module } from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { S3Service } from './s3.service';
import { S3Controller } from './s3.controller';

@Module({
  providers: [S3Provider, S3Service],
  exports: [S3Service],
  controllers: [S3Controller],
})
export class S3Module {}
