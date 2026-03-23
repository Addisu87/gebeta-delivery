import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { Map } from './entities/map.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Map])],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
