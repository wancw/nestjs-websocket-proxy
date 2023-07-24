import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface ClientInfo {
  socket: Socket;
  nickName: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CharRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private clientInfos: Record<string, ClientInfo> = {};

  handleConnection(client: Socket): void {
    this.broadcast('join', { id: client.id, nickName: client.id });
    this.clientInfos[client.id] = {
      socket: client,
      nickName: client.id,
    };
  }

  handleDisconnect(client: Socket) {
    const {
      nickName,
      socket: { id },
    } = this.clientInfos[client.id];
    delete this.clientInfos[client.id];
    this.broadcast('leave', { id, nickName });
  }

  private broadcast(event: string, message: unknown) {
    for (const c of Object.values(this.clientInfos)) {
      c.socket.emit(event, JSON.stringify(message));
    }
  }

  @SubscribeMessage('changeNickName')
  async onChangeNick(client: Socket, newNick: string): Promise<void> {
    console.info('[changeNickName] %o', newNick);

    const clientInfo = this.clientInfos[client.id];
    const {
      socket: { id },
    } = clientInfo;

    const { nickName: currentNick } = clientInfo;

    if (currentNick == newNick) {
      return;
    }

    clientInfo.nickName = newNick;

    this.broadcast('nickNameChanged', {
      id,
      nickName: newNick,
      previousNickName: currentNick,
    });
  }

  @SubscribeMessage('message')
  async onMessage(client: Socket, message: string): Promise<void> {
    console.info('[message] %o', message);

    const {
      nickName,
      socket: { id },
    } = this.clientInfos[client.id];

    this.broadcast('message', { id, nickName, message });
  }
}
