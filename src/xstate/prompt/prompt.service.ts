import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EmbeddingsService } from "../../modules/embeddings/embeddings.service";
import { PromptHistoryService } from "../../modules/prompt-history/prompt-history.service";
import { AiToolsService } from "../../modules/aiTools/ai-tools.service";
import { Language } from "../../language";
import { CustomLogger } from "../../common/logger";
import { chatGPT3Prompt } from "../../common/constants";
const fetch = require('node-fetch'); 
const { Headers } = fetch;

const prismaService = new PrismaService()
const configService = new ConfigService()
const aiToolsService = new AiToolsService(configService, prismaService)
const promptHistoryService = new PromptHistoryService(
    prismaService,
    configService,
    aiToolsService
)
const embeddingsService = new EmbeddingsService(
    prismaService,
    configService,
    promptHistoryService,
    aiToolsService
)
const logger = new CustomLogger('promptService')

export const promptServices = {

    detectLanguage: async (context) => {
        let response = await aiToolsService.detectLanguage(context.prompt.input.body)
        return response
    },

    translateInput: async (context) => {
        if(context.prompt.inputLanguage != Language.en) {
            let response = await aiToolsService.translate(
                context.prompt.inputLanguage as Language,
                Language.en,
                context.prompt.input.body,
                context.prompt.input.mobileNumber
            )
            return response
        } else {
            return {
                translated: context.prompt.input.body,
                error: null
            }
        }
    },

    getUserHistory: async (context) => {
        let userHistoryWhere: any = {};
        userHistoryWhere.userId = context.prompt.input.userId;
        if(context.prompt.input.conversationId) userHistoryWhere.conversationId = context.prompt.input.conversationId;
        const userHistory = await prismaService.query.findMany({
            where: userHistoryWhere,
            orderBy: {
                createdAt: "desc",
            },
            take: 2,
        });
        let history = []
        for (let i = 0; i < userHistory.length; i++) {
            history.push(`User: ${userHistory[i].queryInEnglish}`);
            history.push(`AI: ${userHistory[i].responseInEnglish}`);
          }
        history.push(`User: ${context.prompt.inputTextInEnglish}`);
        return history
    },

    neuralCoreference: async (context) => {
        const nuralCoref = await aiToolsService.nuralCoref(context.prompt.userHistory.join(' '))
        return { response: nuralCoref, allContent: {}, error: null }
    },

    findSimilarQuestion: async (context) => {
        let pdfIds = context.prompt.input.pdfId ? 
                        [context.prompt.input.pdfId] : 
                        context.prompt.input.pdfIds && context.prompt.input.pdfIds.length ?
                        context.prompt.input.pdfIds :
                        JSON.parse(configService.get('DEFAULT_PDFS'))
        const olderSimilarQuestion =
        await promptHistoryService.findByCriteria({
            query: context.prompt.neuralCoreference,
            pdfIds,
            similarityThreshold: 0.97,
            matchCount: 1,
        });
        return olderSimilarQuestion
    },

    getSimilarDocs: async(context) => {
        let pdfIds = context.prompt.input.pdfId ? 
                        [context.prompt.input.pdfId] : 
                        context.prompt.input.pdfIds && context.prompt.input.pdfIds.length ?
                        context.prompt.input.pdfIds :
                        JSON.parse(configService.get('DEFAULT_PDFS'))
        let similarDocsFromEmbeddingsService =
        await embeddingsService.findByCriteria({
          query: context.prompt.neuralCoreference,
          pdfIds,
          similarityThreshold: 0,
          matchCount: 10,
        });
        similarDocsFromEmbeddingsService = similarDocsFromEmbeddingsService.map((doc)=>{
            return {
                ...doc,
                content:doc.content.replace(/\s{2,}/g, ' ')
            }
        })
        console.log("getSimilarDocs", similarDocsFromEmbeddingsService)
        return similarDocsFromEmbeddingsService
    },

    generateResponse: async (context) => {
        let content = JSON.stringify(
            context.prompt.similarDocs ? context.prompt.similarDocs
            .map((doc) => {
            return doc.content;
            }):[]
        )
        let prompt = await prismaService.config.findUnique({ where: { key: "GPTPrompt" } });
        let llmInput
        try {
            if(prompt){
                llmInput = prompt.value
                .replace("{{user_history}}",context.prompt.userHistory)
                .replace("{{user_question}}",context.prompt.neuralCoreference)
                .replace("{{context}}",content.replace(/"/g,"'"))
                console.log("llm string",llmInput)
                llmInput = JSON.parse(llmInput)
            } else {
                llmInput = chatGPT3Prompt(
                    context.prompt.userHistory,
                    context.prompt.neuralCoreference,
                    content
                )
            }
        } catch {
            llmInput = chatGPT3Prompt(
                context.prompt.userHistory,
                context.prompt.neuralCoreference,
                content
            )
        }
        console.log("llmInput",llmInput)
        const { response: finalResponse, allContent: ac, error } = await aiToolsService.llm(llmInput);
        return { response: finalResponse, allContent: ac, error }
    },

    translateOutput: async (context) => {
        if(context.prompt.inputLanguage != Language.en) {
            let response = await aiToolsService.translate(
                Language.en,
                context.prompt.inputLanguage as Language,
                context.prompt.outputInEnglish,
                context.prompt.input.mobileNumber
            )
            return response
        } else {
            return {
                translated: context.prompt.outputInEnglish,
                error: null
            }
        }
    },

    storeAndSendMessage: async (context) => {
        await promptHistoryService.createOrUpdate({
            id: context.prompt.similarQuestion ? context.prompt.similarQuestion[0].id : null,
            queryInEnglish: context.prompt.inputTextInEnglish,
            responseInEnglish: context.prompt.outputInEnglish,
            responseTime: new Date().getTime() - context.prompt.timestamp,
            metadata: [],
            queryId: context.prompt.input.messageId,
            pdfId: context.prompt.input.pdfId,
        });

        // if(context.prompt.similarDocs && context.prompt.similarDocs.length > 0){
        //     let similarDocsCreateData = context.prompt.similarDocs.map(e=>{
        //       e['queryId'] = context.prompt.input.messageId
        //       e['documentId'] = e.id
        //       delete e.id
        //       return e
        //     })
        //     await prismaService.similarity_search_response.createMany({
        //       data: similarDocsCreateData
        //     })
        // }

        return context
    },

    done: async (context) => {
        logger.logWithCustomFields({
            userId: context.prompt.input.userId,
            messageId: context.prompt.input.messageId
        },'verbose')('done',context)
        await prismaService.query.create({
            data: {
              id: context.prompt.input.messageId,
              userId: context.prompt.input.userId,
              query: context.prompt.input.body,
              response: context.prompt.output,
              responseTime: new Date().getTime() - context.prompt.timestamp,
              queryInEnglish: context.prompt.inputTextInEnglish,
              responseInEnglish: context.prompt.outputInEnglish,
              conversationId: context.prompt.input.conversationId,
              coreferencedPrompt: context.prompt.neuralCoreference,
              errorRate: 0,
              responseType: context.prompt.responseType,
              workflow: {
                create: {
                  userId: context.prompt.input.userId,
                  content: context.workflow,
                },
              }
            },
        });
        return context
    },

    logError: async (context, event) =>{
        logger.logWithCustomFields({
            userId: context.prompt.input.userId,
            messageId: context.prompt.input.messageId
        },'error')('Error',event)
        return event.data
    }
}
