import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { io, Socket as ClientSocket } from 'socket.io-client';

const WS_UPSTREAM = 'ws://localhost:3000';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsProxyGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private clientIdToUpstream: Record<string, ClientSocket> = {};
  private upstreamIdToClient: Record<string, Socket> = {};

  handleConnection(client: Socket): void {
    console.info('client connected');
    const upstream = io(WS_UPSTREAM);
    this.clientIdToUpstream[client.id] = upstream;

    upstream.once('connect', () => {
      this.upstreamIdToClient[upstream.id] = client;
      this.registerUpstreamHandler(upstream);
    });
  }

  handleDisconnect(client: Socket) {
    console.info('client disconnected');

    const clientId = client.id;
    const upstream = this.clientIdToUpstream[clientId];
    const upstreamId = upstream.id;
    upstream.close();

    delete this.clientIdToUpstream[clientId];
    delete this.upstreamIdToClient[upstreamId];
  }

  // Client -> Server events

  @SubscribeMessage('message')
  async onClientMessage(client: Socket, raw: unknown): Promise<unknown> {
    return this.handleClient(client, 'message', raw);
  }

  @SubscribeMessage('changeNickName')
  async onChangeNickName(client: Socket, raw: unknown): Promise<unknown> {
    return this.handleClient(client, 'changeNickName', raw);
  }

  private async handleClient(
    client: Socket,
    event: string,
    raw: unknown,
  ): Promise<unknown> {
    console.info('c -> s: %o: %o', event, raw);
    const upstream = this.clientIdToUpstream[client.id];
    return upstream.emit(event, raw);
  }

  // Server -> Client events

  private registerUpstreamHandler(upstream: ClientSocket) {
    const events = ['message', 'nickNameChanged'];
    events.forEach((e) => {
      upstream.on(e, (raw: unknown) => this.handleUpstream(upstream, e, raw));
    });
  }

  private async handleUpstream(
    upstream: ClientSocket,
    event: string,
    raw: unknown,
  ): Promise<unknown> {
    console.info('s -> c: %o: %o', event, raw);
    const client = this.upstreamIdToClient[upstream.id];
    return client.emit(event, raw);
  }
}
