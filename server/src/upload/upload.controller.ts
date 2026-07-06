import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

@Controller('api/upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const isPdf = file.mimetype === 'application/pdf' || extname(file.originalname).toLowerCase() === '.pdf';
          const destination = isPdf ? './uploads/materials' : './uploads';
          mkdirSync(destination, { recursive: true });
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const name = uuid() + extname(file.originalname);
          cb(null, name);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedImage = file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/);
        const allowedPdf = file.mimetype === 'application/pdf' || ext === '.pdf';
        if (!allowedImage && !allowedPdf) {
          cb(new BadRequestException('仅支持图片或 PDF 资料上传'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    const isPdf = file.mimetype === 'application/pdf' || extname(file.originalname).toLowerCase() === '.pdf';
    return {
      url: isPdf ? '/uploads/materials/' + file.filename : '/uploads/' + file.filename,
      filename: file.originalname,
      type: isPdf ? 'pdf' : 'image',
      size: file.size,
    };
  }
}
