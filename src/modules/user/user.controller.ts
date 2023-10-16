import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { query } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/logger';
import { AuthGuard } from 'src/common/auth-gaurd';
const fetch = require('node-fetch'); 
const { Headers } = fetch;

@Controller('user')
@UseGuards(AuthGuard)
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
    @Query('mobileNumber') mobileNumber: string
  ): Promise<query[]> {
    let userId = null
    if(request.headers.roles.indexOf('Admin') != -1) {
      userId = adminUserId
      if(!userId && mobileNumber) {
        var myHeaders = new Headers();
        myHeaders.append("x-application-id", this.configService.get("FRONTEND_APPLICATION_ID"));
        myHeaders.append("Authorization", this.configService.get('FUSION_AUTH_API_KEY'));

        var requestOptions: any = {
          method: 'GET',
          headers: myHeaders,
          redirect: 'follow'
        };
        try{
          let res: any = await fetch(`${this.configService.get('FUSION_AUTH_BASE_URL')}api/user?username=${mobileNumber}`, requestOptions)
          res = await res.json()
          userId = res.user.id
        } catch(error) {
          this.logger.error(error)
        }
      }
    } else {
      userId = request.headers.userId
    }
    return this.userService.conversationsList(
      userId
    );
  }

  @Get("/chathistory/:conversationId")
  async chatHistory(@Param("conversationId") conversationId: string, @Request() request, @Query('userid') adminUserId: string): Promise<query[]> {
    let userId = request.headers.userId
    if(request.headers.roles.indexOf('Admin') != -1) {
      userId = adminUserId
    }
    return this.userService.conversationHistory(conversationId,userId);
  }

  @Get("conversations/delete/:conversationId")
  async deleteConversation(@Param("conversationId") conversationId: string, @Request() request): Promise<boolean> {
    const userId = request.headers.userId
    return this.userService.deleteConversation(conversationId,userId)
  }

  @Get("profile/:mobileNumber")
  async getEmployeeDetails(@Param("mobileNumber") mobileNumber: string) {
    return this.userService.getUserProfile(mobileNumber)
  }
}