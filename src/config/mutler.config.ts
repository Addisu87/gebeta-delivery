import { MAX_UPLOAD_SIZE } from 'src/shared/constants';

export type MulterConfig = {
  dest: string;
};

export const multerConfig = () => ({
  multer: {
    dest: process.env.MULTER_DEST ?? './uploads',
  } satisfies MulterConfig,
});

export { MAX_UPLOAD_SIZE };
