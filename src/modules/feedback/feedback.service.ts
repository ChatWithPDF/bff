import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { query } from "@prisma/client";

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService
  ) {}

  //using raw queries as right now unable to add unique index to id without createdAt
  //error while migrating: cannot create a unique index without the column "createdAt" (used in partitioning)
  async likeQuery(id): Promise<query> {
    try {
      await this.prisma.$queryRawUnsafe(`
        UPDATE "query" SET 
        "reaction" = 1, 
        "updatedAt" = NOW() 
        WHERE "id" = '${id}'`);
    } catch {
      return null;
    }
    return this.prisma.$queryRawUnsafe(`
      SELECT * from "query" where id = '${id}'
    `);
  }

  async dislikeQuery(id): Promise<query> {
    try {
      await this.prisma.$queryRawUnsafe(`
        UPDATE "query" SET 
        "reaction" = -1, 
        "updatedAt" = NOW() 
        WHERE "id" = '${id}'`);
    } catch {
      return null;
    }
    return this.prisma.$queryRawUnsafe(`
      SELECT * from "query" where id = '${id}'
    `);
  }

  async removeReactionOnQuery(id): Promise<query> {
    try {
      await this.prisma.$queryRawUnsafe(`
        UPDATE "query" SET 
        "reaction" = 0, 
        "updatedAt" = NOW() 
        WHERE "id" = '${id}'`);
    } catch {
      return null;
    }
    return this.prisma.$queryRawUnsafe(`
      SELECT * from "query" where id = '${id}'
    `);
  }

}
