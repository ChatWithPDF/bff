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

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback,
) => {
  if (!file.originalname.match(/\.(pdf)$/)) {
    return callback(new UnsupportedMediaTypeException('Only pdf files are allowed!'), false);
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
  @Post('upload')
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body, @Headers() headers) {
    let pdfId = uuidv4()
    await this.aiToolsService.getPDFChunks(file.path,pdfId)
    await this.aiToolsService.getCSVFromChunks(pdfId)
    const csvFilePath = path.join(__dirname, `../../../files/${pdfId}.csv`);
    let data = await this.pdfService.processCSV(csvFilePath)
    await unlink(csvFilePath)
    for(let i=0;i<data.length;i++){
        let document = await this.prisma.document.create({
            data:{
                content: data[i].content,
                summary: data[i].content,
                pdfId,
                pdfName: csvFilePath,
                metaData: {
                  startPage: data[i].start_page,
                  endPage: data[i].end_page
                }
            }
        })
        await this.prisma.$queryRawUnsafe(
          `UPDATE document 
            SET "contentEmbedding" = '[${JSON.parse(data[i].embeddings)
            .map((x) => `${x}`)
            .join(",")}]', 
            "summaryEmbedding" = '[${JSON.parse(data[i].embeddings)
              .map((x) => `${x}`)
              .join(",")}]'
            WHERE id = ${document.id}`
        );
    }
    return pdfId;
  }

  @Post('addpdfdata')
  async addData(){
    let csvnames = ['document_data']
    let pdfIds= [];
    for(let i=0;i<csvnames.length;i++){
      let pdfId = uuidv4()
      const csvFilePath = path.join(__dirname, `../../../files/${csvnames[i]}.csv`);
      console.log('processing CSV',csvFilePath);
      let data = await this.pdfService.processCSV(csvFilePath)
      console.log('CSV processed',csvFilePath)
      console.log('adding data to db',csvFilePath)
      for(let i=0;i<data.length;i++){
        let document = await this.prisma.document.create({
            data:{
                content: data[i].content,
                heading: data[i].heading,
                summary: data[i].summary,
                pdfId,
                pdfName: csvFilePath,
                metaData: {
                  startPage: data[i].start_page,
                  endPage: data[i].end_page
                },
                chunkId: data[i]?.chunkId ? parseInt(data[i].chunkId): null
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
              WHERE id = ${document.id}`
          );
      }
      console.log('data added to db',csvFilePath)
      pdfIds.push({
        id:pdfId,
        name: csvnames[i]
      })
    }
    return pdfIds;
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
}