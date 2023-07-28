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

  async conversationsList(
    userId: string, 
    page: number, 
    perPage: number,
    fromDate: string,
    toDate: string
  ): Promise<any> {
    if (
      fromDate &&
      !moment(fromDate, "YYYY-MM-DD HH:mm:ss", true).isValid()
    ) {
      throw new BadRequestException("Invalid 'fromDate' format. Please provide it in 'YYYY-MM-DD HH:mm:ss' format.");
    }

    if (toDate && !moment(toDate, "YYYY-MM-DD HH:mm:ss", true).isValid()) {
      throw new BadRequestException("Invalid 'toDate' format. Please provide it in 'YYYY-MM-DD HH:mm:ss' format.");
    }
    try {
      let whereClause = '';

      if (fromDate) {
        const utcFromDateTime = momentTZ
          .tz(fromDate, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata")
          .utc()
          .format();
        whereClause += `m."updatedAt" >= '${utcFromDateTime}'::timestamptz`;
      }

      if (toDate) {
        const utcToDateTime = momentTZ
          .tz(toDate, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata")
          .utc()
          .format();
        whereClause += `${fromDate ? ' AND ' : ''}m."updatedAt" <= '${utcToDateTime}'::timestamptz`;
      }

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
        ${whereClause ? `AND ${whereClause}` : ''}
        ORDER BY q."conversationId" ASC, q."createdAt" ASC
        OFFSET ${(page - 1) * perPage} LIMIT ${perPage}
      `);

      // userHistory = await Promise.all(userHistory.map( async (message) => {
      //   //get users mobile number
      //   var myHeaders = new Headers();
      //   myHeaders.append("x-application-id", this.configService.get('FRONTEND_APPLICATION_ID'));
      //   myHeaders.append("Authorization", this.configService.get('FUSION_AUTH_API_KEY'));
      //   var requestOptions: RequestInit = {
      //     method: 'GET',
      //     headers: myHeaders,
      //     redirect: 'follow'
      //   };
      //   try {
      //     let res: any = await fetch(`${this.configService.get('FUSION_AUTH_BASE_URL')}api/user?userId=${message.userId}`, requestOptions)
      //     res = await res.json()
      //     message['mobileNumber'] = res.user.mobilePhone
      //   } catch(error) {
      //     this.logger.error(error)
      //     message['mobileNumber'] = null
      //   }
      //   return message
      // }))

      const conversations: any =  await this.prisma.$queryRawUnsafe(`
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
        ${whereClause ? `AND ${whereClause}` : ''}
        ORDER BY q."conversationId" ASC, q."createdAt" ASC
      `);
      const totalConversations = conversations.length;
      const totalPages = Math.ceil(totalConversations / perPage);
      const pagination = { page, perPage, totalPages, totalConversations };
      return {pagination, userHistory};
    } catch (error) {
      throw new BadRequestException([
        "Something went wrong while fetching user history",
      ]);
    }
  }

  async conversationHistory(
    conversationId: string,
    userId: string
  ): Promise<query[]> {
    try {
      const userHistory = await this.prisma.query.findMany({
        where: {
          conversationId: conversationId,
          userId,
          isConversationDeleted: false
        },
        orderBy: [{ createdAt: "asc" }]
      });
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
}
