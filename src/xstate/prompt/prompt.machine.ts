// @ts-nocheck
import { assign, createMachine } from 'xstate';
import { promptServices } from './prompt.service';
import { PromptDto } from '../../app.controller';
import { Language } from '../../language';
import { promptActions } from './prompt.action';
import { promptGuards } from './prompt.gaurd';

export interface PromptContext {
  prompt: {
    input: PromptDto;
    output?: string;
    outputInEnglish?: string;
    inputLanguage?: Language;
    inputTextInEnglish?: string;
    maxTokens?: number;
    outputLanguage?: Language;
    similarDocs?: any;

    // More output metadata
    timeTaken?: number;
    timestamp?: number;
    responseType?: string;
    userHistory?: any[];
    neuralCoreference?: string;
    similarQuestion?: any[];
    errorRate?: number;
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
  // other context properties
}

export const promptMachine = createMachine<PromptContext>({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgBQwGM5YBLAOygDoIwcxCcAZAQ0oFcWYBiCdcsFQoA3dAGtBaLLgLpisMpRp0GzNlE4wEIuSxyl+AbQAMAXROnEKdGX38rIAB6IATADYALFQCM3gKxubi7Gxn5+ABx+AOxuADQgAJ6IAJx+3lQebuGRAS4AzMZued4AviXxUtj4RCQU1LT0jKwcXGC8-II6ElSVMjUKdcqNai1aOoR6BuQWht6WSCDINqR25A7OCAC0BX5UeckeeR6p3i7J3qnxSQjJnlQHfh6+F+G+LlFlFRhVsvKK9SomupNG0wKgMKgegAbPQAM3QqEwPW+fTktSUDVUzQ0rW05FEE1WMzMDiWtim60QmxcfmSVCiLg84WSBzyZ0eHiuiCikSoxmS7Jc4SiHiiYTyn0WKOqaIGShwqDYsBh9AAkuRkOwcO0BEJ8eJJNLfujqAqlSqwOrNTg8QTJkYzBZSctVpStr4efdvPtjBdokEuQhvEy6W4AlEDocYvkPJLejK-oMzeRlXpLRqtTrOvruvHjXLTYqUxarVrbboiY65s7yfYFhtfMYolQ3P4PGEsiLktlA8HmS3w5G8tGjnGjf1-lRk6m1RntXxdV1DdIEyap0WZ+nreXCVMZi55tZa2t64h0sG-KEw5k3Mkm-sXL2QwO3BGPFGgqPylKV-nJ9OSznbgwQhaE4QRJE8wnJMN0A7dxntaZHRJBYyRWClTy2GkXD5dsXF8NkPDOFx3l7Nl0iKP1h27V4-BcMdf2gpQYBwABVWAwQACVIWAcARBIsz1URc3HWVJxY9iuJ4vjUASHdEOJQ9FhdDDQA2M4vF9Rk8j8PJ9j071e3OLxvDDciaQiYwdIYn4mOoCSONQbjeP4wSl2RRixMGBypJc2T5Mrcxq1QlS6zUqlh2MKh3nfJkRXwzw-CM4MfDM-CLPCKy-Bs1FE2YuhJKc6TXJAhEwJweFEQ82yvPytjHOcmS5IQwKnRC483WpAI+WybwRTcUJznyXtMrpTJvHCIJRW9CIPm-KDauoAR2EVKEAGEETAWEwTAchiDcnNlxqvKlrAFaWHWzbttQXbiACvdkKUtDXUwzZAmbRksuiFlJvwwNGXcPlW3cIVzl9HLVwLKhltWjabuu262gXbNhKO3K1xhi64a2na9rAe6HSCp7QpPcL3WyHxjFFY5TipvJIn+oi3CB05hWyMG3Ahv9Bkxy74dx-bSshZAVUqyDRJO6Gzthq6BfxlqHvMFCj3QsKnCpWlwh630WRiKmLjiRJXH8ZnCncKJhyZ18ubsqhYQoCAAGVSEwUgYVQABFdg4FWA7Ueq9Goft8gnZdt2WE973eKmAmkKV4mOsw95z0t9xTiIyI8n+sVm3pk4ol9Kzjhtxa7Yd53Xfdr2famP2DQDyHJ2D0PK4j6vo-4WOZmClWXrJ7ZwjyPYsj9aJGSiE3s8y4eBp5Bkoh5d4S8l5uK-DyOa-4YDwTKkXwKqhaV-LsOq6j1Yu8emtVdJ9WbiKKhhQtopbyjRlGcKFsGVFMMIyOAJl7XCxNe7sAAichYAADEESsWQMgMEAAVAAFjdWAiD0BQggHXESnlJZAJPhHMBhBIHQNgQg5BcA0EYIvvHK+fdb6bDCHyYMmQqbjUyAEQMelzhUDCAEPqAoabZXmhLQBdBgEEPAVA1AMC4GoCQSgyhmDkZCXrofUROBxGoEIcQ6RpC5HkNQegiA1DZgJ2vp1QeUVeHClBgEb+nCnheF0vhCMngYzhAAVDPBrctGSJIbI+RFCjHb1AnvCqEEG7czqpo7RUiZFkIUUYkxytlKJ37uEY4LZkj00KGKCIopHxGwQAUCaewChEW7DpV475PHiTEfg3xRCpFMHQAAdwSUEjBWC0aN28vUnxsSEQtPafoxJVCFaEzar3VS9DHh0mMCRC2pl4qHE4bcZmOkaRNgXoEUytS+kaIaYM1AwyOmGK6co9yaivH9PXsc05ozOnGImXHUxtCZkbE2N4LSGRRQClfFTfCTY1mBD2HRS8C8Yitk5sInB6iYl+JOW0s5iiQm71FhE65dTDkDMRQ8wJ5znn6l3JMlJz0PlUl8O2FsMVxq+jyLeJKRSGXT19OEFxYZjDZBhV8OFNyBCKnoAAJTgEsFMSMOgqOwcdURAq0witgGKjiySzF0M+VkOktwiKmSsnnP6RT3z9jMgbNIYYsj7PynK4Vor+AcW6ZE22MArVgAVUq+WxKFJVlVRSrCukWyvh5CEXS0QJ6BkNaGZxr5Uh0Umha+yu0wTypteKtFwsMUHxEfyxN1rFW2vdXaVqZKSYWMYb-fYrZdaBGSGG9wUV3wMp9IUDwTY43rnNGmAA8lqa09qsUwXbfQLtOB4IesLd6tWGxrx7ALjsX0wZbzhEDBCpxrwLjtj6t6VtAFO3dszJcw6DrS7bsHbum0Lzu7jpvhsNkUV-nHALgKd4twmXXGXTw1dbJAjZFCFu2CO7h2ZiFuVMWh7JbHrAEOkdBbFZTNSeYzCFtdhTQuMEXJuSw29R4b4NI3z3giiEbymVUM-JgAAIIh0drtCAABZEgrRe2ZsnCR8jTsqO0YULic9l92rwbJjsHwARUiZX8MEZkS7aReDZDyDJvhhSnFbcxijbG6M8CA2EkDfalCKdYyHdjsBOOjpg0WtJt8J44WKKZR+DKYyciKbpDJD9PBhkiJ2emrbEFsAgFCMAABRHeqAGN8snB5kO3m-MQhVe8idlLIoCZ1neaaE1vCBiCKkHhurjL8MiGUb85B0C0HgKhRjdQotXspU8LW-h4tUwnkllLmQeHZJCI-TwYp6KwqI5OTEQJRhgFK26dI7hUgDRCGcPqYRF1FItppAULJjjvH0u1wjgd-x-tnNafrmFMlRoXSKUIl5B69iFEPSi2TMoTb0jyn8nWDmFUavxTbZNqXPzFO+OiTxQi2euH1CeGRWyTSsj95IPJW282xgjPGj36F6Q+vkQIZx2U6Xpv9WTQN3jpTThGOay3elKFXg09udDyXReKXRekER3tncKGEf6LLP40jZBEIUmRW3eLuYi+JjzCVQ8+fTJDY8mTem9ORF9rhuxRT0jVpZ2Tzas9uaAvFyKueKJ51SHkzNuwHE8KZXS9LOFuKYeysM3pDjdgI9dlbfTnWurzarrYhx0g6VFAyNkGSx41pIr8nSmvC5Lw65b+Ua2IOnrtwyyTQpB4kQCEEEiGH3g8MCKKJsrxmTm809QbTlHdMqb6zxtViAjjpF9EUIiczhzsiXRZvYmUC7SfG1d9PVAQted8-5u3XzNl8nBcUSF7LDtFNnvM-YLCGRBCKK25Gofbj3EiL4LIxRRM0hS+4XYa63g8m9+1soQA */
    id: 'promptProcessing',
    predictableActionArguments: true,
    initial: 'detectLanguage',
    context: {
      prompt: null,
      workflow: [],
      stateErrorRateData: null,
      currentState: 'detectLanguage'
    },
    states: {
      detectLanguage: {
        entry: ['setStartTimeForCompleteFlow','setStartTime'],
        invoke: {
          src: 'detectLanguage',
          onDone: [
            {
              target: 'translateInput',
              cond: 'unableToDetectLanguage',
              actions: [
                assign({
                  prompt:(context,_)=>context.prompt,
                  workflow:(context,_)=>context.workflow,
                  stateErrorRateData: (context,_)=>context.stateErrorRateData,
                  currentState: 'unableToDetectLanguage'
                }),
                'updatePromptHistoryWithDetectedLanguage'
              ]
            },
            {
              target: 'translateInput',
              actions: ['updatePromptHistoryWithDetectedLanguage']
            }
          ],
          onError: 'handleError',
        }
      },
      translateInput: {
        entry: ['setStartTime'],
        invoke: {
          src: 'translateInput',
          onDone: [
            {
              cond: 'unableToTranslate',
              target: 'handleError',
              actions: [
                assign({
                  prompt:(context,_)=>context.prompt,
                  workflow:(context,_)=>context.workflow,
                  stateErrorRateData: (context,_)=>context.stateErrorRateData,
                  currentState: 'unableToTranslateInput'
                }),
              ]
            },
            {
              target: 'getUserHistory',
              actions: ['updateContextWithTranslatedInput']
            }
          ],
          onError: 'handleError',
        },
      },
      getUserHistory: {
        entry: ['setStartTime'],
        invoke: {
          src: 'getUserHistory',
          onDone: [
            {
              cond: 'isUserHistoryEmpty',
              target: 'findSimilarQuestion',
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
              target: 'translateOutput',
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
              target: 'generateResponse',
              actions: ['updateContextWithSimilarDocs'],
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
              target: 'translateOutput',
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
      translateOutput: {
        entry: ['setStartTime'],
        invoke: {
          src: 'translateOutput',
          onDone: [
            {
              cond: 'unableToTranslate',
              target: 'handleError',
              actions: [
                assign({
                  prompt:(context,_)=>context.prompt,
                  workflow:(context,_)=>context.workflow,
                  stateErrorRateData: (context,_)=>context.stateErrorRateData,
                  currentState: 'unableToTranslateOutput'
                }),
              ]
            },
            {
              target: 'storeAndSendMessage',
              actions: ['updateContextWithTranslatedOutput',],
            }
          ],
          onError: 'handleError',
        },
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