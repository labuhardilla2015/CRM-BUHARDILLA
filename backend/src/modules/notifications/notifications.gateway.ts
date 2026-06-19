import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Gateway de notificaciones en tiempo real. El cliente se conecta enviando el
 * access token en `auth.token`; se valida y se une a la sala `user:<id>`.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token ?? '') as string;
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  /** Emite un evento a todas las conexiones de un usuario. */
  emitir(usuarioId: string, evento: string, data: unknown) {
    this.server.to(`user:${usuarioId}`).emit(evento, data);
  }
}
