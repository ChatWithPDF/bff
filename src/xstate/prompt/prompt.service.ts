import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EmbeddingsService } from "../../modules/embeddings/embeddings.service";
import { AiToolsService } from "../../modules/aiTools/ai-tools.service";
import { CustomLogger } from "../../common/logger";
import { generalPrompt } from "../../common/constants";

const prismaService = new PrismaService()
const configService = new ConfigService()
const aiToolsService = new AiToolsService(configService, prismaService)
const embeddingsService = new EmbeddingsService(
    prismaService,
    configService,
    aiToolsService
)
const logger = new CustomLogger('promptService')

export const promptServices = {

    getUserHistory: async (context) => {
        let userHistoryWhere: any = {};
        userHistoryWhere.userId = context.prompt.input.userId;
        userHistoryWhere.query = {
            not: context.prompt.input.body
        }
        if(!context.prompt.input.conversationId) return []
        userHistoryWhere.conversationId = context.prompt.input.conversationId;
        const userHistory = await prismaService.query.findMany({
            distinct:['query'],
            where: userHistoryWhere,
            orderBy: {
                createdAt: "desc",
            },
            take: 3,
        });
        let history = []
        for (let i = 0; i < userHistory.length; i++) {
            history.push(`User: ${userHistory[i].query}`);
            history.push(`AI: ${userHistory[i].response}`);
        }
        return history
    },

    neuralCoreference: async (context) => {
        const nuralCoref = await aiToolsService.nuralCoref(context.prompt.userHistory.join(' '))
        return { response: nuralCoref, allContent: {}, error: null }
    },

    getSimilarDocs: async(context) => {
        let pdfIds = context.prompt.input.pdfId ? 
                        [context.prompt.input.pdfId] : 
                        context.prompt.input.pdfIds && context.prompt.input.pdfIds.length ?
                        context.prompt.input.pdfIds :
                        JSON.parse(configService.get('DEFAULT_PDFS'))     
        let contentDocs = await embeddingsService.findByCriteria({
                query: context.prompt.neuralCoreference.replace("Samagra", "").replace("Samagra's", ""),
                pdfIds,
                similarityThreshold: 0,
                matchCount: 5,
            }
        );
        return contentDocs
    },

    generateResponse: async (context) => {
        try {
            const userQuestion =
`
Query: ${context.prompt.neuralCoreference}
Answer:
`
            let expertContext = "Relavent corpous:\n"
            context.prompt.similarDocs && context.prompt.similarDocs.forEach((doc)=> {
                expertContext+=`${doc.id}. ${doc.content}\n`
            })
            let prompt = generalPrompt(context.prompt.userHistory,expertContext,userQuestion, context.prompt.neuralCoreference)
            console.log(prompt)
            let { response: finalResponse, allContent: ac, error } = await aiToolsService.llm(prompt);
            finalResponse = finalResponse.replace("AI: ",'')
                                         .replace('B sased on the context provided ','')
                                         .replace("Based on the context provided, ",'')
                                         .replace('According to the context provided ','')
                                         .replace('According to the context provided, ','')
                                         .replace('Based on the information provided ', '')
                                         .replace('Based on the information provided, ', '')
                                         .replace('Based on the provided context, ','')
                                         .replace('Based on the provided context ','')
                                         .replace(/HR/g,'OD')
                                         .replace('I apologize for the confusion earlier. ','')
            return { response: finalResponse, allContent: ac, error }
        } catch(error){
            console.log(error)
        }
    },

    storeAndSendMessage: async (context) => {
        if(context.prompt.similarDocs && context.prompt.similarDocs.length > 0){
            let data = JSON.parse(JSON.stringify(context.prompt.similarDocs))
            let similarDocsCreateData = data.map(e=>{
              e['content'] = e.content.replace(/\s{2,}/g, ' ')
              e['queryId'] = context.prompt.input.messageId
              e['documentId'] = e.id
              delete e.pdfId
              delete e.id
              delete e.metaData
              return e
            })
            await prismaService.similarity_search_response.createMany({
              data: similarDocsCreateData
            })
        }

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
