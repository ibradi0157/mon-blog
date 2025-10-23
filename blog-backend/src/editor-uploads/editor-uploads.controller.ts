import { Controller, Post, Delete, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/editor-uploads')
export class EditorUploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { id: 'temp-image', url: '/uploads/editor/images/temp.jpg' };
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { id: 'temp-file', url: '/uploads/editor/files/temp.bin' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { success: true };
  }
}

