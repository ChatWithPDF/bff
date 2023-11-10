import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { query } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/logger';
import { AuthGuard } from 'src/common/auth-gaurd';
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
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  async chatHistory(@Param("conversationId") conversationId: string, @Request() request, @Query('userid') adminUserId: string): Promise<query[]> {
    let userId = request.headers.userId
    if(request.headers.roles.indexOf('Admin') != -1) {
      userId = adminUserId
    }
    return this.userService.conversationHistory(conversationId,userId);
  }

  @Get("conversations/delete/:conversationId")
  @UseGuards(AuthGuard)
  async deleteConversation(@Param("conversationId") conversationId: string, @Request() request): Promise<boolean> {
    const userId = request.headers.userId
    return this.userService.deleteConversation(conversationId,userId)
  }

  @Get("profile/:mobileNumber")
  @UseGuards(AuthGuard)
  async getEmployeeDetails(@Param("mobileNumber") mobileNumber: string) {
    return this.userService.getUserProfile(mobileNumber)
  }

  @Get("/sendOTP")
  async sendOTP(@Query('phone') phone: string, ){
    let employee = await this.userService.getEmployee(phone)
    if(!employee) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try{
      var myHeaders = new Headers();
      myHeaders.append("Accept", "*/*");
      myHeaders.append("Accept", "*/*");

      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };

      let res: any = await fetch(`${this.configService.get('USER_SERVICE_BASE_URL')}/api/sendOTP?phone=${phone}`, requestOptions)
      res = await res.json()
      return res
    } catch (error) {
      return {
        error: error.message
      }
    }
  }

  @Get('/employee')
  @UseGuards(AuthGuard)
  getAllEmployees(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('mobileNumber') mobileNumber?: string,
    @Query('name') name?: string,
  ) {
    page = parseInt(`${page}`)
    pageSize = parseInt(`${pageSize}`)
    return this.userService.getAllEmployees(page, pageSize, mobileNumber, name);
  }

  @Get('/employee/:id')
  @UseGuards(AuthGuard)
  getEmployeeById(@Param('id') employeeId: string) {
    return this.userService.getEmployeeById(employeeId);
  }

  @Post('/employee')
  @UseGuards(AuthGuard)
  createEmployee(@Body() data: any) {
    return this.userService.createEmployee(data);
  }

  @Put('/employee/:id')
  @UseGuards(AuthGuard)
  updateEmployee(@Param('id') employeeId: string, @Body() data: any) {
    return this.userService.updateEmployee(employeeId, data);
  }

  @Delete('/employee/:id')
  @UseGuards(AuthGuard)
  deleteEmployee(@Param('id') employeeId: string) {
    return this.userService.deleteEmployee(employeeId);
  }
}