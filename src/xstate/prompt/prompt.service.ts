import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EmbeddingsService } from "../../modules/embeddings/embeddings.service";
import { PromptHistoryService } from "../../modules/prompt-history/prompt-history.service";
import { AiToolsService } from "../../modules/aiTools/ai-tools.service";
import { Language } from "../../language";
import { CustomLogger } from "../../common/logger";
import { generalPrompt, restructureContentPrompt } from "../../common/constants";
import { flagsmith } from "../../common/flagsmith";
import { filterUnique } from "./prompt.utils";
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
        // let response = await aiToolsService.detectLanguage(context.prompt.input.body)
        // return response
        return {
            language: Language.en,
            error: null
        }
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
        userHistoryWhere.queryInEnglish = {
            not: context.prompt.input.body
        }
        if(!context.prompt.input.conversationId) return [`User: ${context.prompt.inputTextInEnglish}`]
        userHistoryWhere.conversationId = context.prompt.input.conversationId;
        const userHistory = await prismaService.query.findMany({
            distinct:['queryInEnglish'],
            where: userHistoryWhere,
            orderBy: {
                createdAt: "desc",
            },
            take: 3,
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
        const flags = await flagsmith.getIdentityFlags(context.prompt.input.userId);

        let allDocumentUsers = flags.getFeatureValue('all_document_users');
        if(allDocumentUsers) allDocumentUsers = JSON.parse(allDocumentUsers)
        else allDocumentUsers = []
        
        let isAllDocumentUser = false;

        if(context.prompt.input.mobileNumber && allDocumentUsers.indexOf(context.prompt.input.mobileNumber) != -1) isAllDocumentUser = true 

        // let similarityThresholdForHeading = flags.getFeatureValue('similarity_threshold_for_heading');
        // if(similarityThresholdForHeading) similarityThresholdForHeading = parseFloat(similarityThresholdForHeading)
        // else similarityThresholdForHeading = 0.85

        // let similarityThresholdForContent = flags.getFeatureValue('similarity_threshold_for_content');
        // if(similarityThresholdForContent) similarityThresholdForContent = parseFloat(similarityThresholdForContent)
        // else similarityThresholdForContent = 0.85

        let pdfIds = context.prompt.input.pdfId ? 
                        [context.prompt.input.pdfId] : 
                        context.prompt.input.pdfIds && context.prompt.input.pdfIds.length ?
                        context.prompt.input.pdfIds :
                        JSON.parse(configService.get('DEFAULT_PDFS'))
                        
        let contentDocs = await embeddingsService.findByCriteria({
                query: context.prompt.neuralCoreference.replace("Samagra", "").replace("Samagra's", ""),
                pdfIds,
                similarityThreshold: 0,
                matchCount: 6,
            },
            "contentEmbedding",
            isAllDocumentUser? null : 'policy'
        );

        let headingDocs = await embeddingsService.findByCriteria({
                query: context.prompt.neuralCoreference.replace("Samagra", "").replace("Samagra's", ""),
                pdfIds,
                similarityThreshold: 0,
                matchCount: 6,
            },
            "headingEmbedding",
            isAllDocumentUser? null : 'policy'
        );

        let summaryDocs = await embeddingsService.findByCriteria({
                query: context.prompt.neuralCoreference.replace("Samagra", "").replace("Samagra's", ""),
                pdfIds,
                similarityThreshold: 0,
                matchCount: 6,
            },
            "summaryEmbedding",
            isAllDocumentUser? null : 'policy'
        );

        return { 
            contentDocs, 
            headingDocs, 
            summaryDocs, 
            documentsFound: contentDocs.length || headingDocs.length || summaryDocs.length 
        }
    },

    getBestMatchingChunks: async(context) => {
        try{
            const flags = await flagsmith.getIdentityFlags(context.prompt.input.userId);

            let case3UpperThresh = flags.getFeatureValue('very_high_heading_match_threshold');
            if(case3UpperThresh) case3UpperThresh = parseFloat(case3UpperThresh)
            else case3UpperThresh = 0.95

            let case3ThreshDelta = flags.getFeatureValue('very_high_heading_delta');
            if(case3ThreshDelta) case3ThreshDelta = parseFloat(case3ThreshDelta)
            else case3ThreshDelta = 0.05

            let case1UpperThresh = flags.getFeatureValue('high_heading_and_summary_upper_threshold');
            if(case1UpperThresh) case1UpperThresh = parseFloat(case1UpperThresh)
            else case1UpperThresh = 0.93

            let case1LowerThresh = flags.getFeatureValue('high_heading_and_summary_lower_threshold');
            if(case1LowerThresh) case1LowerThresh = parseFloat(case1LowerThresh)
            else case1LowerThresh = 0.85

            let case2UpperThresh = flags.getFeatureValue('heading_and_summary_upper_threshold');
            if(case2UpperThresh) case2UpperThresh = parseFloat(case2UpperThresh)
            else case2UpperThresh = 0.86

            let case4UpperThresh = flags.getFeatureValue('all_over_upper_threshold');
            if(case4UpperThresh) case4UpperThresh = parseFloat(case4UpperThresh)
            else case4UpperThresh = 0.85

            let case4LowerThresh = flags.getFeatureValue('all_over_lower_threshold');
            if(case4LowerThresh) case4LowerThresh = parseFloat(case4LowerThresh)
            else case4LowerThresh = 0.81

            // let case_matched = 0
            // let relevant_corpus = []
            // const flags = await flagsmith.getIdentityFlags(context.prompt.input.userId);

            // let highestSimilarityThresholdForSummary = flags.getFeatureValue('highest_similarity_threshold_for_direct_answer_via_summary');
            // if(highestSimilarityThresholdForSummary) highestSimilarityThresholdForSummary = parseFloat(highestSimilarityThresholdForSummary)
            // else highestSimilarityThresholdForSummary = 0.91

            // let highestSimilarityThresholdForHeading = flags.getFeatureValue('highest_similarity_threshold_for_direct_answer_via_heading');
            // if(highestSimilarityThresholdForHeading) highestSimilarityThresholdForHeading = parseFloat(highestSimilarityThresholdForHeading)
            // else highestSimilarityThresholdForHeading = 0.91

            // let deltaForTopHeading = flags.getFeatureValue('delta_for_top_heading');
            // if(deltaForTopHeading) deltaForTopHeading = parseFloat(deltaForTopHeading)
            // else deltaForTopHeading = 0.03

            // let deltaForTopSummary = flags.getFeatureValue('delta_for_top_summary');
            // if(deltaForTopSummary) deltaForTopSummary = parseFloat(deltaForTopSummary)
            // else deltaForTopSummary = 0.03

            let hitsContent: any = context.prompt.similarDocs.contentDocs
            let hitsHeading: any = context.prompt.similarDocs.headingDocs
            let hitsSummary: any = context.prompt.similarDocs.summaryDocs

            // console.log("All content docs")
            // console.log(contentDocs)
            // console.log("highest matched content docs")
            // let topMatchedContentDocs = filterArrayByDeltaAndCutoff(contentDocs,0.03,0.85)
            // console.log(topMatchedContentDocs)

            // console.log("All heading docs")
            // console.log(headingDocs)
            // console.log("highest matched heading docs")
            // let topMatchedHeadingDocs = filterArrayByDeltaAndCutoff(headingDocs,deltaForTopHeading,highestSimilarityThresholdForHeading)
            // console.log(topMatchedHeadingDocs)

            // console.log("All summary docs")
            // console.log(summaryDocs)
            // console.log("highest matched summary docs")
            // let topMatchedSummaryDocs = filterArrayByDeltaAndCutoff(summaryDocs,deltaForTopSummary,highestSimilarityThresholdForSummary)
            // console.log(topMatchedSummaryDocs)

            // let topMatchedHeadingAndSummaryDocs = uniqueUnion(topMatchedHeadingDocs,topMatchedSummaryDocs)
            // console.log("highest matched summary and heading docs")
            // console.log(topMatchedHeadingAndSummaryDocs)

            // if(topMatchedHeadingAndSummaryDocs.length){
            //     if(topMatchedHeadingAndSummaryDocs.length == 1){
            //         //condition 1
            //         return {
            //             topMatchedChunks: topMatchedHeadingAndSummaryDocs,
            //             matchType: 1
            //         }
            //     } else {
            //         //condition 2
            //         return {
            //             topMatchedChunks: topMatchedHeadingAndSummaryDocs,
            //             matchType: 2
            //         }
            //     }
            // } else {
            //     if(summaryDocs.length){
            //         //condtion 3
            //         return {
            //             topMatchedChunks: summaryDocs.slice(0,3),
            //             matchType: 3
            //         }
            //     }
            //     if(headingDocs.length){
            //         //condition 4
            //         return {
            //             topMatchedChunks: headingDocs.slice(0,3),
            //             matchType: 4
            //         }
            //     }
            //     if(topMatchedContentDocs.length){
            //         //condition 5
            //         return {
            //             topMatchedChunks: topMatchedContentDocs.slice(0,3),
            //             matchType: 5
            //         }
            //     }
            //     if(contentDocs.length){
            //         //condition 6
            //         return {
            //             topMatchedChunks: contentDocs.slice(0,3),
            //             matchType: 6
            //         }
            //     }
            // }

            let caseMatched = 0;
            const relevantCorpus = [];

            // Case 3 => Very High Heading Match Single. Reproduce the content as is (Expected)
            if (
            hitsHeading[0]['similarity'] > case3UpperThresh &&
            hitsHeading[0]['similarity'] - hitsHeading[1]['similarity'] >= case3ThreshDelta
            ) {
                caseMatched = 3;
                relevantCorpus.push(hitsHeading[0]['id']);
            }

            // Case 1 => High Heading and High Summary + Both Match
            if (caseMatched === 0) {
                if (
                    hitsSummary[0]['similarity'] > case1UpperThresh &&
                    hitsSummary[1]['similarity'] < case1LowerThresh &&
                    hitsHeading[0]['similarity'] > case1UpperThresh &&
                    hitsHeading[0]['similarity'] > case1UpperThresh &&
                    hitsSummary[0]['id'] === hitsHeading[0]['id']
                ) {
                    caseMatched = 1;
                }
            }

            // Case 2 => Multiple High Heading or Multiple i.e. incorrect headings. Get all high context and send it to GPT
            if (caseMatched === 0) {
                const C = [];
                const B = [];
                for (const i of hitsSummary) {
                    if (i['similarity'] > case2UpperThresh) {
                    C.push(i['id']);
                    }
                }

                for (const i of hitsHeading) {
                    if (i['similarity'] > case2UpperThresh) {
                    B.push(i['id']);
                    }
                }

                const unionSet = new Set([...B, ...C]);
                if (unionSet.size > 0) {
                    caseMatched = 2;
                    relevantCorpus.push(...unionSet);
                }
            }

            // Case 4 => Low search match all over. Likely a small line somewhere - see common chunks and send them.
            if (caseMatched === 0) {
                const C = [];
                const B = [];
                const A = [];
                for (const i of hitsSummary) {
                    if (case4UpperThresh > i['similarity'] && i['similarity'] > case4LowerThresh) {
                    C.push(i['id']);
                    }
                }

                for (const i of hitsHeading) {
                    if (case4UpperThresh > i['similarity'] && i['similarity'] > case4LowerThresh) {
                    B.push(i['id']);
                    }
                }

                for (const i of hitsContent) {
                    if (case4UpperThresh > i['similarity'] && i['similarity'] > case4LowerThresh) {
                    A.push(i['id']);
                    }
                }

                let intersectionSet = new Set(A);
                intersectionSet = new Set([...intersectionSet].filter((x) => B.includes(x) && C.includes(x)));
                if (intersectionSet.size === 0) {
                    intersectionSet = new Set([...B].filter((x) => C.includes(x)));
                }
                if (intersectionSet.size === 0) {
                    intersectionSet = new Set([...B].filter((x) => A.includes(x)));
                }
                if (intersectionSet.size === 0) {
                    intersectionSet = new Set([...C].filter((x) => A.includes(x)));
                }
                if (intersectionSet.size > 0) {
                    caseMatched = 4;
                    relevantCorpus.push(...intersectionSet);
                }
            }

            if (caseMatched === 0) {
                return {
                    topMatchedChunks: [],
                    matchType: 0
                }
            } else {
                console.log("Case Matched", caseMatched);
                if (relevantCorpus.length === 0) {
                console.log("Answer", "Nothing matched");
                return {
                    topMatchedChunks: [],
                    matchType: 0
                }
                }
                if (caseMatched === 3) {
                    // let docId = relevantCorpus[0]
                    return {
                        topMatchedChunks: filterUnique([relevantCorpus[0]],[...hitsContent, ...hitsHeading, ...hitsSummary]),
                        matchType: 1
                    }
                    // let doc = await prismaService.document.findFirst({
                    //     where:{id:docId}
                    // })
                    // return doc
                } else {
                    return {
                        topMatchedChunks: filterUnique(relevantCorpus,[...hitsContent, ...hitsHeading, ...hitsSummary]),
                        matchType: 4
                    }
                    // let relavantDocs = []
                    // for (const relavantId of relevantCorpus) {
                    //     let doc = await prismaService.document.findFirst(
                    //         {
                    //             where: {id: relavantId}
                    //         }
                    //     )
                    //     relavantDocs.push(doc)
                    // }
                    // return relavantDocs
                //   const chunks = [];
                //   for (const rc of relevantCorpus) {
                //     let content = "";
                //     content += "Heading: " + data[rc]['heading'] + "\n";
                //     content += "Content: " + data[rc]['content'] + "\n";
                //     chunks.push(content);
                //   }
            
                //   // console.log(chunks);
                //   console.log("Answer", getQnaResponse(chunks, queries[0]));
                }
            }
        } catch (error) {
            console.log(error)
        }
    },

    getEmployeeData: async(context) => {
        if(context.prompt.input.mobileNumber){
            try {
                let employee = await prismaService.employee.findFirst({
                    where: {
                        mobileNumber: context.prompt.input.mobileNumber
                    }
                })
                return employee
            } catch(error) {
                return null
            }
        }
        return null;
    },

    generateResponse: async (context) => {
        try {
            const userQuestion =
`
Query: ${context.prompt.neuralCoreference}
Answer:
`
            let expertContext = "Relevant Samagra Corpus:\n"
            context.prompt.similarDocs.topMatchedChunks && context.prompt.similarDocs.topMatchedChunks.forEach((doc)=> {
                expertContext+=`${doc.id}. ${doc.content}\n`
            })
            let prompt;
            if(context.prompt.similarDocs.matchType == 1 ){
                prompt = restructureContentPrompt(context.prompt.userHistory,expertContext,userQuestion, context.prompt.neuralCoreference, context.prompt.employeeData)
            } else{
                prompt = generalPrompt(context.prompt.userHistory,expertContext,userQuestion, context.prompt.neuralCoreference, context.prompt.employeeData)
            }
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
            return { response: finalResponse, allContent: ac, error }
        } catch(error){
            console.log(error)
        }
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
        if(context.prompt.similarDocs.topMatchedChunks && context.prompt.similarDocs.topMatchedChunks.length > 0){
            let data = JSON.parse(JSON.stringify(context.prompt.similarDocs.topMatchedChunks))
            let similarDocsCreateData = data.map(e=>{
              e['content'] = e.content.replace(/\s{2,}/g, ' ')
              e['queryId'] = context.prompt.input.messageId
              e['documentId'] = e.id
              delete e.pdfId
              delete e.id
              delete e.metaData
              delete e.chunkId
              delete e.type
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
