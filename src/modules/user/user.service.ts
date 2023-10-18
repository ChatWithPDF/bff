import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { query } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { CustomLogger } from "../../common/logger";
import * as momentTZ from "moment-timezone";
import * as moment from 'moment';
const fetch = require('node-fetch'); 
const { Headers } = fetch;

@Injectable()
export class UserService {
  private logger: CustomLogger;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.logger = new CustomLogger("UserService");
  }

  async conversationHistory(
    conversationId: string,
    userId: string
  ): Promise<query[]> {
    try {
      let userHistory:any = await this.prisma.query.findMany({
        where: {
          conversationId: conversationId,
          userId,
          isConversationDeleted: false
        },
        orderBy: [{ createdAt: "asc" }]
      });
      for(let data of userHistory) {
        data["context"] = await this.prisma.similarity_search_response.findMany({
          where:{
            queryId: data.id
          }
        })
        for(let doc of data["context"]){
          doc["metaData"] = (await this.prisma.document.findUnique({
            where: {
              id: doc.id
            },
            select: {
              metaData: true
            }
          }))['metaData']
        }
      }
      return userHistory;
    } catch (error) {
      throw new BadRequestException([
        "Something went wrong while fetching conversation history",
      ]);
    }
  }

  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const userHistory = await this.prisma.query.updateMany({
        where: {
          conversationId: conversationId,
          userId
        },
        data: {
          isConversationDeleted: true
        }
      });
      return userHistory? true: false;
    } catch (error) {
      throw new BadRequestException([
        "Something went wrong while deleting conversation history",
      ]);
    }
  }

  async getUserProfile(
    mobileNumber: string
  ) {
    try {
      let employee = await this.prisma.employee.findFirst({
          where: {
              mobileNumber: mobileNumber
          }
      })
      return employee
    } catch(error) {
        return null
    }
  }

  async conversationsList(
    userId: string,
  ): Promise<any> {
    try {
      let userHistory: any = await this.prisma.$queryRawUnsafe(`
        SELECT DISTINCT ON (q."conversationId") q.*, m."updatedAt" AS "lastConversationAt"
        FROM (
          SELECT *
          FROM "query"
          WHERE ${userId ? `"userId" = '${userId}' AND `:''}"isConversationDeleted" = false
        ) q
        INNER JOIN "query" m ON q."conversationId" = m."conversationId"
        WHERE m."updatedAt" = (
          SELECT MAX("updatedAt")
          FROM "query"
          WHERE "conversationId" = q."conversationId"
        )
        ORDER BY q."conversationId" ASC, q."createdAt" ASC
      `);
      return userHistory;
    } catch (error) {
      console.log(error)
      throw new BadRequestException([
        "Something went wrong while fetching user history",
      ]);
    }
  }
}
