import { Module } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    ConfigService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class UserModule {}
