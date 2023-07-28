import { assign } from 'xstate';
import {PromptContext} from './prompt.machine'
import { CONTACT_AMAKRUSHI_HELPLINE, REPHRASE_YOUR_QUESTION } from '../../common/constants';
import { Language } from '../../language';
import { TEXT_DETECTION_ERROR } from '../../common/constants';
import { TEXT_TRANSLATION_ERROR } from '../../common/constants';
import { GPT_RESPONSE_ERROR } from '../../common/constants';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/logger';

const configService = new ConfigService()
const logger = new CustomLogger('promptService')

export const promptActions = {

  updatePromptHistoryWithDetectedLanguage: assign<PromptContext, any>((context, event) => {
    let ret =  {
      ...context,
      prompt: {
        ...context.prompt,
        inputLanguage: event.data["language"],
      },
      workflow: [{
        state: "detectLanguage",
        timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
      }]
    }
    return ret
  }),

  updateContextWithTranslatedInput: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      inputTextInEnglish: event.data["translated"]
    },
    workflow: [...context.workflow,{
      state: "translateInput",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithContactResponse: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      inputTextInEnglish: event.data["translated"],
      outputInEnglish: CONTACT_AMAKRUSHI_HELPLINE('en'),
      output: CONTACT_AMAKRUSHI_HELPLINE(event.data["translated"])
    },
    workflow: [...context.workflow,{
      state: "translateInput",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updatePromptWithUserHistory: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      userHistory: event.data?.length ? event.data : [],
    },
    workflow: [...context.workflow,{
      state: "getUserHistory",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  setNeuralCoreferenceAsInput: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      neuralCoreference: context.prompt.inputTextInEnglish
    },
    workflow: [...context.workflow,{
      state: "getNeuralCoreference",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithCoreferencedPrompt: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      neuralCoreference: event.data["response"]?.replace("User: ","")
    },
    workflow: [...context.workflow,{
      state: "getNeuralCoreference",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithSimilarQuestion: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      similarQuestion: event.data?.length ? event.data : [],
      outputInEnglish: event.data?.length ? event.data[0].responseInEnglish: '',
      responseType: "Response given from previous similar question with similarity > 0.97"
    },
    workflow: [...context.workflow,{
      state: "getSimlilarQuestion",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithSimilarDocs: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      similarDocs: event.data?.length ? event.data : [],
    },
    workflow: [...context.workflow,{
      state: "getSimilarDocs",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextForResponseWithoutContent: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      responseType: `Response given through GPT without content`
    },
    workflow: [...context.workflow,{
      state: "getResponse(without hitting the content DB)",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextForBogusQuestion: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      responseType: "Response given to bogus question",
      output: REPHRASE_YOUR_QUESTION(context.prompt.inputLanguage),
      outputInEnglish: REPHRASE_YOUR_QUESTION(Language.en)
    },
    workflow: [...context.workflow,{
      state: "getResponse(bogus question)",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithGeneratedResponse: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      outputInEnglish: event.data["response"],
      responseType: `Response given using content`
    },
    workflow: [...context.workflow,{
      state: "getResponse",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithTranslatedOutput: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      output: event.data["translated"]
    },
    workflow: [...context.workflow,{
      state: "translateOutput",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithTimeTakenToStoreMessage: assign<PromptContext, any>((context, _) => ({
    ...context,
    workflow: [...context.workflow,{
      state: "storeAndSendMessage",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  setStartTimeForCompleteFlow: assign<PromptContext, any>((context, _) => {
    return {
      ...context,
      prompt: {
        ...context.prompt,
        timestamp: new Date().getTime()
      }
    }
  }),

  setStartTime: assign<PromptContext, any>((context, _) => {
    return {
      ...context,
      currentStateStartTime: Date.now()
    }
  }),

  updateContextWithError: assign<PromptContext, any>((context, event) => {
    return {
      ...context,
      prompt: {
        ...context.prompt,
        error: `${event.data}`
      },
      workflow: [...context.workflow,{
        state: "error",
        timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`,
        error: `${event.data}`
      }]
    }
  }),

  updateContextWithErrorRate: assign<PromptContext, any>((context, _) => {
    let { delayThreshold, delayErrorRate, errorRate, delayLevel } = context.stateErrorRateData
    if(errorRate) {
      errorRate += context?.prompt?.errorRate ? context?.prompt?.errorRate : 0
    }
    if(delayThreshold && delayErrorRate){
      if(!errorRate) {
        errorRate = context?.prompt?.errorRate ? context?.prompt?.errorRate : 0
      }
      if(new Date().getTime() - (delayLevel == 'totalFlow' ? context.prompt.timestamp : context.currentStateStartTime) > delayThreshold)
      errorRate+=delayErrorRate
    }
    return {
      ...context,
      prompt: {
        ...context.prompt,
        errorRate: errorRate?errorRate:0
      }
    }
  }),

  sendAlert: (context, event) => {
    let message = context.currentState;
    let alertMessage;
    switch(message){
      case 'unableToDetectLanguage':
        alertMessage = TEXT_DETECTION_ERROR(
          context.prompt.input.userId,
          context.prompt.input.body,
          JSON.stringify(event.data,null,2)
        )
        break;
      case 'unableToTranslateInput':
        alertMessage = TEXT_TRANSLATION_ERROR(
          context.prompt.input.userId,
          context.prompt.input.body,
          context.prompt.inputLanguage,
          'en'
        )
        break;
      case 'unableToTranslateOutput':
        alertMessage = TEXT_TRANSLATION_ERROR(
          context.prompt.input.userId,
          context.prompt.outputInEnglish,
          'en',
          context.prompt.inputLanguage
        )
        break;
      case 'neuralCoreferenceIsEmpty':
        alertMessage = GPT_RESPONSE_ERROR(
          context.prompt.input.userId,
          context.prompt.inputTextInEnglish,
          JSON.stringify(event.data,null,2)
        )
        break;
      case 'gptResponseIsEmpty':
        alertMessage = GPT_RESPONSE_ERROR(
          context.prompt.input.userId,
          context.prompt.inputTextInEnglish,
          JSON.stringify(event.data,null,2)
        )
        break;
      default:
        alertMessage = ''
    }
  }

};
 