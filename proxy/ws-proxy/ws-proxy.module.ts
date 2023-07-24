import { Module } from '@nestjs/common';
import { WsProxyGateway } from './ws-proxy.gateway';

@Module({
  providers: [WsProxyGateway],
})
export class WsProxyModule {}
