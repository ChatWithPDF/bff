import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { AiToolsService } from "../aiTools/ai-tools.service";
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as PDFParser from 'pdf-parse';

@Injectable()
export class PDFService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private aiToolsService: AiToolsService,
    // private pdfParser: PDFParser
  ) {
    this.aiToolsService = new AiToolsService(configService)
  }
  async processCSV(csvBuffer: any): Promise<Array<any>> {
    const data= [];

    await new Promise<void>((resolve, reject) => {
      const stream = csvParser({ separator: ',' });
      const writeStream = fs.createReadStream(csvBuffer);

      writeStream.pipe(stream);

      stream.on('data', (row) => {
        // Perform any additional data transformation if needed
        data.push(row);
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });

    return data;
  }

  async readPdf(filePath: string): Promise<string> {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const options = {};
      const pdfData = await PDFParser(pdfBuffer, options)
      return pdfData.text
    } catch (error) {
      console.error('Error parsing PDF:', error);
    }
  }

}