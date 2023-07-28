import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { query } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/logger';
const fetch = require('node-fetch'); 
const { Headers } = fetch;

@Controller('user')
export class UserController {
  private logger: CustomLogger;
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {
    this.logger = new CustomLogger("UserService");
  }

  @Get("/conversations")
  async conversations(
    @Request() request, 
    @Query('userid') adminUserId: string, 
    @Query('page') page: number, 
    @Query('perPage') perPage: number,
    @Query('mobileNumber') mobileNumber: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string
  ): Promise<query[]> {
    let userId = null
    userId = adminUserId
    // if(request.headers.roles.indexOf('Admin') != -1) {
    //   userId = adminUserId
    //   if(!userId && mobileNumber) {
    //     var myHeaders = new Headers();
    //     myHeaders.append("x-application-id", this.configService.get("FRONTEND_APPLICATION_ID"));
    //     myHeaders.append("Authorization", this.configService.get('FUSION_AUTH_API_KEY'));

    //     var requestOptions: RequestInit = {
    //       method: 'GET',
    //       headers: myHeaders,
    //       redirect: 'follow'
    //     };
    //     try{
    //       let res: any = await fetch(`${this.configService.get('FUSION_AUTH_BASE_URL')}api/user?username=${mobileNumber}`, requestOptions)
    //       res = await res.json()
    //       userId = res.user.id
    //     } catch(error) {
    //       this.logger.error(error)
    //     }
    //   }
    // } else {
    //   userId = request.headers.userId
    // }
    page = page?page:1
    perPage = perPage?perPage:10
    return this.userService.conversationsList(
      userId,
      parseInt(`${page}`),
      parseInt(`${perPage}`),
      fromDate,
      toDate
    );
  }

  @Get("/chathistory/:conversationId")
  async chatHistory(@Param("conversationId") conversationId: string, @Request() request, @Query('userid') adminUserId: string): Promise<query[]> {
    let userId = adminUserId
    // let userId = request.headers.userId
    // if(request.headers.roles.indexOf('Admin') != -1) {
    //   userId = adminUserId
    // }
    return this.userService.conversationHistory(conversationId,userId);
  }

  @Get("conversations/delete/:conversationId")
  async deleteConversation(@Param("conversationId") conversationId: string, @Request() request): Promise<boolean> {
    const userId = request.headers.userId
    return this.userService.deleteConversation(conversationId,userId)
  }
}