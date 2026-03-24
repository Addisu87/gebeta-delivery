import { MAX_UPLOAD_SIZE } from 'src/shared/constants';

export type MulterConfig = {
  dest: string;
};

export const multerConfig = () => {
  const dest = process.env.MULTER_DEST;
  if (!dest) {
    throw new Error('MULTER_DEST is required in environment');
  }
  return {
    multer: { dest } satisfies MulterConfig,
  };
};

export { MAX_UPLOAD_SIZE };
