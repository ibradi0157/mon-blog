import { Module } from '@nestjs/common';
import { EditorUploadsController } from './editor-uploads.controller';

@Module({
  controllers: [EditorUploadsController],
})
export class EditorUploadsModule {}

