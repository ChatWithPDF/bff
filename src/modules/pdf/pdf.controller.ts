import { Body, Controller, Post, UseInterceptors, UploadedFile, UnsupportedMediaTypeException, Headers} from "@nestjs/common";
import { PDFService } from "./pdf.service";
import { PrismaService } from "src/global-services/prisma.service";
const path = require('path');
import { v4 as uuidv4 } from 'uuid';
import { FastifyFileInterceptor } from "src/interceptors/file.interceptor";
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { unlink } from 'fs/promises';
import { AiToolsService } from "../aiTools/ai-tools.service";
import { ConfigService } from "@nestjs/config";

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
    this.aiToolsService = new AiToolsService(configService)
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
    let pdf_data = await this.pdfService.readPdf(file.path)
    await unlink(file.path);
    let pdfId = uuidv4()
    await this.aiToolsService.getPDFChunks(pdf_data,pdfId)
    await this.aiToolsService.getCSVFromChunks(pdfId)
    const csvFilePath = path.join(__dirname, `../../../fileUploads/${pdfId}.csv`);
    let data = await this.pdfService.processCSV(csvFilePath)
    await unlink(csvFilePath)
    for(let i=0;i<data.length;i++){
        let document = await this.prisma.document.create({
            data:{
                content: data[i].content,
                pdfId,
                pdfName: csvFilePath,
                embeddingType: 'PDF'
            }
        })
        await this.prisma.$queryRawUnsafe(
            `UPDATE document SET pdf = '[${JSON.parse(data[i].embeddings)
              .map((x) => `${x}`)
              .join(",")}]' WHERE id = ${document.id}`
          );
    }
    return pdfId;
  }
}