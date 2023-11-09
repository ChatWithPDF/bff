import { Body, Controller, Post, UseInterceptors, UploadedFile, UnsupportedMediaTypeException, Headers} from "@nestjs/common";
import { PDFService } from "./pdf.service";
import { PrismaService } from "../../global-services/prisma.service";
const path = require('path');
import { v4 as uuidv4 } from 'uuid';
import { FastifyFileInterceptor } from "../../interceptors/file.interceptor";
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { unlink } from 'fs/promises';
import { AiToolsService } from "../aiTools/ai-tools.service";
import { ConfigService } from "@nestjs/config";
const { parse } = require('date-fns');

const editFileName = (req: Request, file: Express.Multer.File, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const csvFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback,
) => {
  if (!file.originalname.match(/\.(csv)$/)) {
    return callback(new UnsupportedMediaTypeException('Only csv files are allowed!'), false);
  }
  callback(null, true);
};

@Controller("pdf")
export class PDFController {
  constructor(
    private prisma: PrismaService,
    private readonly pdfService: PDFService,
    private configService: ConfigService,
    private aiToolsService: AiToolsService,
  ) {
    this.aiToolsService = new AiToolsService(configService, prisma)
  }
  // @Post('upload')
  // @UseInterceptors(
  //   FastifyFileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './files',
  //       filename: editFileName,
  //     }),
  //     fileFilter: imageFileFilter,
  //   })
  // )
  // async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body, @Headers() headers) {
  //   let pdfId = uuidv4()
  //   await this.aiToolsService.getPDFChunks(file.path,pdfId)
  //   await this.aiToolsService.getCSVFromChunks(pdfId)
  //   const csvFilePath = path.join(__dirname, `../../../files/${pdfId}.csv`);
  //   let data = await this.pdfService.processCSV(csvFilePath)
  //   await unlink(csvFilePath)
  //   for(let i=0;i<data.length;i++){
  //       let document = await this.prisma.document.create({
  //           data:{
  //               content: data[i].content,
  //               summary: data[i].content,
  //               pdfId,
  //               pdfName: csvFilePath,
  //               metaData: {
  //                 startPage: data[i].start_page,
  //                 endPage: data[i].end_page
  //               }
  //           }
  //       })
  //       await this.prisma.$queryRawUnsafe(
  //         `UPDATE document 
  //           SET "contentEmbedding" = '[${JSON.parse(data[i].embeddings)
  //           .map((x) => `${x}`)
  //           .join(",")}]', 
  //           "summaryEmbedding" = '[${JSON.parse(data[i].embeddings)
  //             .map((x) => `${x}`)
  //             .join(",")}]'
  //           WHERE id = ${document.id}`
  //       );
  //   }
  //   return pdfId;
  // }

  @Post('addData')
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: csvFileFilter,
    })
  )
  async addData(@UploadedFile() file: Express.Multer.File, @Body() body: any){ 
      const csvFilePath = path.join(__dirname, `../../../files/${file.filename}`);
      let contentEmbedStatus, headingEmbedStatus, summaryEmbedStatus, timeTakenForContentEmbedding, timeTakenForHeadingEmbedding, timeTakenForSummaryEmbedding;
      if(body.generateEmbeddings){
        let startTime = Date.now()
        contentEmbedStatus = await this.aiToolsService.getCSVFromChunks(file.filename)
        timeTakenForContentEmbedding = Date.now() - startTime;
        if(contentEmbedStatus != 200) {
          await unlink(csvFilePath)
          return {
            contentEmbedStatus,
            timeTakenForContentEmbedding,
            message: `Failed with status code ${contentEmbedStatus} while embedding content chunks.`
          }
        }
        await this.pdfService.replacePDFHeader(",embeddings",",contentEmbedding",file.filename)
        await this.pdfService.replacePDFHeader("content,heading,","ignore1,content,",file.filename)
        headingEmbedStatus = await this.aiToolsService.getCSVFromChunks(file.filename)
        timeTakenForHeadingEmbedding = Date.now() - startTime;
        if(headingEmbedStatus != 200){
          await unlink(csvFilePath)
          return {
            contentEmbedStatus,
            timeTakenForContentEmbedding,
            headingEmbedStatus,
            timeTakenForHeadingEmbedding,
            message: `Failed with status code ${headingEmbedStatus} while embedding heading chunks.`
          }
        } 
        await this.pdfService.replacePDFHeader(",embeddings",",headingEmbedding",file.filename)
        await this.pdfService.replacePDFHeader("ignore1,content,summary,","ignore1,ignore2,content,",file.filename)
        summaryEmbedStatus = await this.aiToolsService.getCSVFromChunks(file.filename)
        timeTakenForSummaryEmbedding = Date.now() - startTime;
        if(summaryEmbedStatus != 200){
          await unlink(csvFilePath)
          return {
            contentEmbedStatus,
            timeTakenForContentEmbedding,
            headingEmbedStatus,
            timeTakenForHeadingEmbedding,
            summaryEmbedStatus,
            timeTakenForSummaryEmbedding,
            message: `Failed with status code ${summaryEmbedStatus} while embedding summary chunks.`
          }
        }
        await this.pdfService.replacePDFHeader(",embeddings",",summaryEmbedding",file.filename)
        await this.pdfService.replacePDFHeader("ignore1,ignore2,content,","content,heading,summary,",file.filename)
      }
      let data = await this.pdfService.processCSV(csvFilePath)
      await unlink(csvFilePath)
      try {
        for(let i=0;i<data.length;i++){
          await this.prisma.document.upsert({
              where: {
                chunkId: parseInt(data[i].chunkId)
              },
              create:{
                  content: data[i].content,
                  heading: data[i].heading,
                  summary: data[i].summary,
                  pdfName: csvFilePath,
                  metaData: {
                    startPage: data[i].startPage,
                    endPage: data[i].endPage
                  },
                  chunkId: parseInt(data[i].chunkId),
                  type: data[i].type
              },
              update:{
                content: data[i].content,
                heading: data[i].heading,
                summary: data[i].summary,
                pdfName: csvFilePath,
                metaData: {
                  startPage: data[i].startPage,
                  endPage: data[i].endPage
                },
                chunkId: parseInt(data[i].chunkId),
                type: data[i].type
            }
          })
          await this.prisma.$queryRawUnsafe(
              `UPDATE document 
                SET "contentEmbedding" = '[${JSON.parse(data[i].contentEmbedding)
                .map((x) => `${x}`)
                .join(",")}]', 
                "headingEmbedding" = '[${JSON.parse(data[i].headingEmbedding)
                  .map((x) => `${x}`)
                  .join(",")}]', 
                "summaryEmbedding" = '[${JSON.parse(data[i].summaryEmbedding)
                  .map((x) => `${x}`)
                  .join(",")}]'
                WHERE "chunkId" = ${parseInt(data[i].chunkId)}`
            );
        }
        return {
          contentEmbedStatus,
          timeTakenForContentEmbedding,
          headingEmbedStatus,
          timeTakenForHeadingEmbedding,
          summaryEmbedStatus,
          timeTakenForSummaryEmbedding,
          message: `Document uploaded successfully.`
        }
      } catch (error) {
        return {
          contentEmbedStatus,
          timeTakenForContentEmbedding,
          headingEmbedStatus,
          timeTakenForHeadingEmbedding,
          summaryEmbedStatus,
          timeTakenForSummaryEmbedding,
          message: `${error.message}`
        }
      }
  }

  @Post('create-or-update-employee')
  async addEmployeeData(){
    let csvnames = ['EmployeeDb']
    for(let i=0;i<csvnames.length;i++){
      const csvFilePath = path.join(__dirname, `../../../files/${csvnames[i]}.csv`);
      console.log('processing CSV',csvFilePath);
      let data = await this.pdfService.processCSV(csvFilePath)
      console.log('CSV processed',csvFilePath)
      console.log('adding data to db',csvFilePath)
      for(let i=0;i<data.length;i++){
        let employee = {
          employeeId: data[i].employeeId,
          firstName: data[i].firstName,
          lastName: data[i].lastName,
          middleName: data[i].middleName,
          email: data[i].email,
          track: data[i].track,
          designation: data[i].designation,
          role: data[i].role,
          program: data[i].program,
          dateOfJoining: parse(data[i].dateOfJoining, 'dd-MM-yyyy', new Date()),
          dateOfBirth: parse(data[i].dateOfBirth, 'dd-MM-yyyy', new Date()),
          age: data[i].age,
          gender: data[i].gender,
          maritalStatus: data[i].maritalStatus, 
          mobileNumber: data[i].mobileNumber.replace("91-",""),
          presentAddress: data[i].presentAddress,
          permanentAddress: data[i].permanentAddress
        }
        await this.prisma.employee.upsert({
          where: { employeeId: employee.employeeId },
          update: { ...employee },
          create: { ...employee },
        });
      }
      console.log('data added to db',csvFilePath)
      return `data added to db, ${csvFilePath}`
    }
    return "Error Occurred, Unable to add employee data";
  }

  @Post('addSimilarQuestions')
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: csvFileFilter,
    })
  )
  async addSimilarQuestions(@UploadedFile() file: Express.Multer.File, @Body() body: any){ 
    const csvFilePath = path.join(__dirname, `../../../files/${file.filename}`);
    let data = await this.pdfService.processCSV(csvFilePath)
    await unlink(csvFilePath)
    try {
      for(let i=0;i<data.length;i++){
        let embedding = (await this.aiToolsService.getEmbedding(data[i].queryInEnglish))[0];
        let prompt = await this.prisma.prompt_history.upsert({
            where: {
              queryInEnglish: data[i].queryInEnglish
            },
            create:{
              responseTime: 0,
              queryInEnglish: data[i].queryInEnglish,
              responseInEnglish: data[i].responseInEnglish,
              timesUsed: 0
            },
            update:{
              responseTime: 0,
              queryInEnglish: data[i].queryInEnglish,
              responseInEnglish: data[i].responseInEnglish,
              timesUsed: 0
          }
        })
        await this.prisma.$queryRawUnsafe(
            `UPDATE prompt_history 
              SET "embedding" = '[${embedding
              .map((x) => `${x}`)
              .join(",")}]'
              WHERE "id" = ${prompt.id}`
          );
      }
      return {
        message: `Questions uploaded successfully.`
      }
    } catch (error) {
      return {
        message: `${error.message}`
      }
    }
}
}