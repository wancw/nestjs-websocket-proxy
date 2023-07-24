import { Module } from '@nestjs/common';
import { CharRoomGateway } from './char-room.gateway';

@Module({
  providers: [CharRoomGateway],
})
export class ChatRoomModule {}
