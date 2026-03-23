export type MulterConfig = {
  dest: string;
};

export const multerConfig = () => ({
  multer: {
    dest: process.env.MULTER_DEST ?? './uploads',
  } satisfies MulterConfig,
});

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
