// @ts-nocheck
import { assign, createMachine } from 'xstate';
import { promptServices } from './prompt.service';
import { PromptDto } from '../../app.controller';
import { promptActions } from './prompt.action';
import { promptGuards } from './prompt.gaurd';

export interface PromptContext {
  prompt: {
    input: PromptDto;
    output?: string;
    maxTokens?: number;
    similarDocs?: any;
    timeTaken?: number;
    timestamp?: number;
    responseType?: string;
    userHistory?: any[];
    neuralCoreference?: string;
    similarQuestion?: any[];
    errorRate?: number;
    employeeData?: any;
  };
  currentStateStartTime?: any;
  workflow?: Array<{
    state?: string;
    description?: string;
    input?: any;
    output?: any;
    timeTaken?: string;
  }>,
  stateErrorRateData?: any; 
  currentState?: string;
}

export const promptMachine = createMachine<PromptContext>({
    id: 'promptProcessing',
    predictableActionArguments: true,
    initial: 'getUserHistory',
    context: {
      prompt: null,
      workflow: [],
      stateErrorRateData: null,
      currentState: 'getUserHistory'
    },
    states: {
      getUserHistory: {
        entry: ['setStartTime','setStartTimeForCompleteFlow'],
        invoke: {
          src: 'getUserHistory',
          onDone: [
            {
              cond: 'isUserHistoryEmpty',
              target: 'getSimilarDocs',
              actions: ['setNeuralCoreferenceAsInput']
            },
            {
              target: 'neuralCoreference',
              actions: ['updatePromptWithUserHistory']
            },
          ],
          onError: 'handleError',
        },
      },
      neuralCoreference: {
        entry: ['setStartTime'],
        invoke: {
          src: 'neuralCoreference',
          onDone: [
            {
              cond: 'llmResponseIsEmpty',
              target: 'handleError',
              actions: [
                assign({
                  prompt:(context,_)=>context.prompt,
                  workflow:(context,_)=>context.workflow,
                  stateErrorRateData:{
                    errorRate: 5, 
                    delayThreshold: 4000,
                    delayErrorRate: 2,
                  },
                  currentState:'neuralCoreferenceIsEmpty'
                }),
                'updateContextWithErrorRate'
              ],
              
            },
            {
              target: 'findSimilarQuestion',
              actions: [
                assign({prompt:(context,_)=>context.prompt,workflow:(context,_)=>context.workflow,stateErrorRateData:{
                  delayThreshold: 4000,
                  delayErrorRate: 2,
                }}),
                'updateContextWithErrorRate',
                'updateContextWithCoreferencedPrompt'
              ]
            }
          ],
          onError: 'handleError',
        },
      },
      findSimilarQuestion: {
        entry: ['setStartTime'],
        invoke: {
          src: 'findSimilarQuestion',
          onDone: [
            {
              cond: 'ifSimilarQuestionFound',
              target: 'storeAndSendMessage',
              actions: ['updateContextWithSimilarQuestion']
            },
            {
              target: 'getSimilarDocs',
              actions: []
            }
          ],
          onError: 'handleError',
        },
      },
      getSimilarDocs: {
        entry: ['setStartTime'],
        invoke: {
          src: 'getSimilarDocs',
          onDone: [
            {
              cond: 'ifSimilarDocsFound',
              target: 'getBestMatchingChunks',
              actions: ['updateContextWithSimilarDocs'],
            }
          ],
          onError: 'handleError',
        },
      },
      getBestMatchingChunks:{
        entry: ['setStartTime'],
        invoke: {
          src: 'getBestMatchingChunks',
          onDone: [
            {
              cond: 'ifBestMatchingChunksFound',
              target: 'getEmployeeData',
              actions: ['updateContextWithBestMatchingChunks']
            },
            {
              target: 'storeAndSendMessage',
              actions: ["updateContextForResponseWithoutContent"]
            }
          ],
          onError: 'handleError',
        },
      },
      getEmployeeData: {
        entry: ['setStartTime'],
        invoke: {
          src: 'getEmployeeData',
          onDone: [
            {
              target: 'generateResponse',
              actions: ['updateContextWithEmployeeData'],
            }
          ],
          onError: 'handleError',
        },
      },
      generateResponse: {
        entry: ['setStartTime'],
        invoke: {
          src: 'generateResponse',
          onDone: [
            {
              cond: 'llmResponseIsEmpty',
              target: 'handleError',
              actions: [
                assign({
                  prompt:(context,_)=>context.prompt,
                  workflow:(context,_)=>context.workflow,
                  stateErrorRateData:{
                    errorRate: 5, 
                    delayThreshold: 15000, 
                    delayErrorRate: 2, 
                    delayLevel: 'state'
                  },
                  currentState: "gptResponseIsEmpty"
                }),
                'updateContextWithErrorRate'
              ]
            },
            {
              target: 'storeAndSendMessage',
              actions: [
                'updateContextWithGeneratedResponse',
                assign({prompt:(context,_)=>context.prompt,workflow:(context,_)=>context.workflow,stateErrorRateData:{
                  delayThreshold: 15000, 
                  delayErrorRate: 2, 
                  delayLevel: 'state'
                }}),
                'updateContextWithErrorRate'
              ],
            }
          ],
          onError: 'handleError',
        }
      },
      storeAndSendMessage: {
        entry: ['setStartTime'],
        invoke: {
          src: 'storeAndSendMessage',
          onDone: {
            target: 'done',
            actions: [
              'updateContextWithTimeTakenToStoreMessage',
              assign({prompt:(context,_)=>context.prompt,workflow:(context,_)=>context.workflow,stateErrorRateData:{
                delayThreshold: 25000, 
                delayErrorRate: 1,
                delayLevel: 'totalFlow'
              }}),
              'updateContextWithErrorRate'
            ]
          },
          onError: 'handleError',
        },
      },
      handleError: {
        invoke: {
          src: 'logError',
          onDone: {
            target: 'done',
            actions: ['updateContextWithError']
          }
        }
      },
      done: {
        type: 'final',
        invoke: {
          src: 'done'
        }
      }
    },
},
{
  services: promptServices,
  actions: promptActions,
  guards: promptGuards
}
);