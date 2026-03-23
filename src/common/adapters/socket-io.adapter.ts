import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: Record<string, unknown>) {
    const serverOptions = {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    };
    return super.createIOServer(port, serverOptions);
  }
}
