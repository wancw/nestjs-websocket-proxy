import { Module } from '@nestjs/common';
import { WsProxyModule } from './ws-proxy/ws-proxy.module';

@Module({
  imports: [WsProxyModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
