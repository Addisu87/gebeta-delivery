import { ParseFilePipeBuilder } from '@nestjs/common';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { MAX_UPLOAD_SIZE } from 'src/config/mutler.config';

const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!allowedImageMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error('Invalid file type. Only jpg, png, and webp are allowed'),
      false,
    );
  }
  callback(null, true);
}

export function imageUploadOptions(folder: string) {
  return {
    storage: diskStorage({
      destination: `${process.env.MULTER_DEST ?? './uploads'}/${folder}`,
      filename: (_req: Express.Request, file: Express.Multer.File, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { fileSize: MAX_UPLOAD_SIZE },
  };
}

export function buildImageParseFilePipe() {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/i })
    .addMaxSizeValidator({ maxSize: MAX_UPLOAD_SIZE })
    .build({ fileIsRequired: true });
}
