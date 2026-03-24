import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JOB_NOTIFICATION_CREATED } from 'src/shared/constants';
import { Notification } from './entities/notification.entity';

type SocketJwtPayload = {
  sub: string | number;
  email: string;
};

@WebSocketGateway({
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn('Socket connection rejected: missing token');
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(token);
      const room = this.getUserRoom(payload.email);
      await client.join(room);
      this.logger.log(`Client connected to notifications gateway room=${room}`);
    } catch {
      this.logger.warn('Socket connection rejected: invalid token');
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    this.logger.log('Client disconnected from notifications gateway');
  }

  emitNotificationCreated(notification: Notification) {
    if (notification.recipientEmail) {
      this.server
        .to(this.getUserRoom(notification.recipientEmail))
        .emit(JOB_NOTIFICATION_CREATED, notification);
      return;
    }
    this.server.emit(JOB_NOTIFICATION_CREATED, notification);
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.startsWith('Bearer ')
        ? authToken.slice(7).trim()
        : authToken;
    }

    const headerToken = client.handshake.headers.authorization;
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice(7).trim();
    }

    return undefined;
  }

  private getUserRoom(email: string): string {
    return `user:${email.toLowerCase()}`;
  }
}
