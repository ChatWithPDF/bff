import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { v4 as uuidv4 } from 'uuid';
import { AiToolsService } from './modules/aiTools/ai-tools.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './global-services/prisma.service';
import { AppController, PromptDto } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingsService } from './modules/embeddings/embeddings.service';
import { PromptHistoryService } from './modules/prompt-history/prompt-history.service';
const similarity = require('compute-cosine-similarity');
const ExcelJS = require('exceljs');
const path = require('path');

describe('API Testing', () => {
  let app;
  let aiToolsService: AiToolsService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let appController: AppController;
  let workbook,worksheet;
  let queryIds: Array<any> = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = new PrismaService();
    configService = new ConfigService();
    aiToolsService = new AiToolsService(configService);
    if (process.env.RUN_MANUAL_TEST === 'true') {
      workbook = new ExcelJS.Workbook();
      worksheet = workbook.addWorksheet('Test Report');
      worksheet.addRow(['Question', 'Response', 'Expected Answer', 'Similarity','Time taken','Result','Error']);
    }
  });

  afterAll(async () => {
    if (process.env.RUN_MANUAL_TEST === 'true') {
      const reportFileName = 'testReport.xlsx';
      console.log(path.join(__dirname, `../files/${reportFileName}`))
      await workbook.xlsx.writeFile(path.join(__dirname, `../files/${reportFileName}`)); 
      await prismaService.query.deleteMany({
        where:{
          userId:"cbdb186f-14b3-450d-bcb3-5b3c5474d749"
        }
      })
      for(let i=0;i<queryIds.length;i++){
        await prismaService.prompt_history.deleteMany({
          where: {
            queryId: queryIds[i].queryId
          }
        })
      }
    }
    process.env.RUN_MANUAL_TEST = 'false';
    await app.close();
  });

  describe('Automated testing setup for prompt API', () => { 
    if (process.env.RUN_MANUAL_TEST === 'true') {
      let testDataSet = require(`../files/testDataSet.json`);
      it.concurrent.each(testDataSet)(`should return the expected answer for "$question"`, async ({question, expectedAnswer}) => {
        const startTime = Date.now();
        let similarityScore, responseData;
        try{
          const body: PromptDto = {
            "body": question,
            "userId": "cbdb186f-14b3-450d-bcb3-5b3c5474d749",
            "messageId": uuidv4(),
            "conversationId":"aa66ab84-8665-5ef8-a720-ee2fd15e9164"
          }
          let promptHistoryService: PromptHistoryService = new PromptHistoryService(
            prismaService,
            configService,
            aiToolsService
          );
          let embeddingsService: EmbeddingsService = new EmbeddingsService(
            prismaService,
            configService,
            promptHistoryService,
            aiToolsService
          );
          let appService: AppService = new AppService(
            prismaService,
            configService,
            embeddingsService,
            promptHistoryService
          );
          appController = new AppController(appService);
          responseData = await appController.prompt(body)
          let timeTaken = `${(Date.now() - startTime)/1000} sec`;
          queryIds.push({queryId:responseData.id})
          let responseEmbeddings = (await aiToolsService.getEmbedding(responseData.output))[0];
          let expectedAnswerEmbeddings = (await aiToolsService.getEmbedding(expectedAnswer))[0];
          similarityScore = similarity(responseEmbeddings,expectedAnswerEmbeddings);
          worksheet.addRow([question, responseData.output, expectedAnswer, similarityScore, timeTaken, similarityScore>0.8,null]);
        }catch(error){
          console.log(error)
          let timeTaken = `${(Date.now() - startTime)/1000} sec`;
          worksheet.addRow([question, null, expectedAnswer, null, timeTaken, null,error]);
          return
        }
        expect(responseData.output).toBeDefined();
        expect(similarityScore).toBeGreaterThan(0.8)
      },30000)
    }
    it("default test",()=>{
      expect(true).toBe(true)
    })
   })
});