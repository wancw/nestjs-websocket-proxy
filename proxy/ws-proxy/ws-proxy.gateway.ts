import {
  OnGatewayConnection,
  OnGatewayDisconnect,
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

    client.onAny((event, ...args: unknown[]) => {
      console.info('[pre] c -> s: %j', args);
      this.handleClient(client, event, ...args);
    });

    // connect to upstream()
    const upstream = io(WS_UPSTREAM);
    this.clientIdToUpstream[client.id] = upstream;

    upstream.once('connect', () => {
      this.upstreamIdToClient[upstream.id] = client;
    });
    upstream.onAny((event, ...args) => {
      console.info('[pre] s -> c: %j', args);
      this.handleUpstream(upstream, event, ...args);
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

  private handleClient(
    client: Socket,
    event: string,
    ...args: unknown[]
  ): void {
    console.info('c -> s: %o: %o', event, args);
    const upstream = this.clientIdToUpstream[client.id];
    upstream.emit(event, ...args);
  }

  // Server -> Client events

  private handleUpstream(
    upstream: ClientSocket,
    event: string,
    ...args: unknown[]
  ): void {
    console.info('s -> c: %o: %o', event, args);
    const client = this.upstreamIdToClient[upstream.id];
    client.emit(event, ...args);
  }
}
