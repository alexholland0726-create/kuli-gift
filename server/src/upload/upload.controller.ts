import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
export function fileExtension(buffer: Buffer): string | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return '.png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return '.jpg';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return '.webp';
  if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString())) return '.gif';
  if (buffer.subarray(0, 5).toString() === '%PDF-') return '.pdf';
  return null;
}
@Controller('api/upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    const extension = fileExtension(file.buffer);
    if (!extension) throw new BadRequestException('仅支持 JPG、PNG、WebP、GIF 图片和 PDF');
    const type = extension === '.pdf' ? 'pdf' : 'image';
    if (type === 'image' && file.size > 8 * 1024 * 1024) throw new BadRequestException('图片不能超过 8 MB');
    const name = randomUUID() + extension;
    const directory = join(__dirname, '..', '..', 'uploads', type === 'pdf' ? 'materials' : '');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), file.buffer, { flag: 'wx' });
    return { url: '/uploads/' + (type === 'pdf' ? 'materials/' : '') + name, filename: file.originalname, type, size: file.size };
  }
}
