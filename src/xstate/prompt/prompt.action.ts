import { assign } from 'xstate';
import {PromptContext} from './prompt.machine'
import { NO_CONTEXT_ANSWER } from '../../common/constants';

export const promptActions = {

  updatePromptWithUserHistory: assign<PromptContext, any>((context, event) => {
    return {
    ...context,
    prompt: {
      ...context.prompt,
      userHistory: event.data?.length ? event.data : [],
    },
    workflow: [{
      state: "getUserHistory",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  }}),

  setNeuralCoreferenceAsInput: assign<PromptContext, any>((context, event) => {
    return {
    ...context,
    prompt: {
      ...context.prompt,
      neuralCoreference: context.prompt.input.body
    },
    workflow: [...context.workflow,{
      state: "getNeuralCoreference",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  }}),

  updateContextWithCoreferencedPrompt: assign<PromptContext, any>((context, event) => {
    return {
    ...context,
    prompt: {
      ...context.prompt,
      neuralCoreference: event.data["response"]?.replace("User: ","")
    },
    workflow: [...context.workflow,{
      state: "getNeuralCoreference",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  }}),

  updateContextWithBestMatchingChunks: assign<PromptContext, any>((context, event) => {
    return {
    ...context,
    prompt: {
      ...context.prompt,
      similarDocs: event.data,
      oldSimilarDocs: context.prompt.similarDocs,
      responseType: "Response given from highest matching chunk"
    },
    workflow: [...context.workflow,{
      state: "getBestMatchingChunks",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  }}),

  updateContextWithSimilarQuestion: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      similarQuestion: event.data?.length ? event.data : [],
      output: event.data?.length ? event.data[0].responseInEnglish: '',
      responseType: "Response given from previous similar question with similarity > 0.85"
    },
    workflow: [...context.workflow,{
      state: "getSimlilarQuestion",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithSimilarDocs: assign<PromptContext, any>((context, event) => {
    return {
    ...context,
    prompt: {
      ...context.prompt,
      similarDocs: event.data,
    },
    workflow: [...context.workflow,{
      state: "getSimilarDocs",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  }}),

  updateContextForResponseWithoutContent: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      responseType: `Response given through GPT without content`,
      output: NO_CONTEXT_ANSWER
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
      output: NO_CONTEXT_ANSWER
    },
    workflow: [...context.workflow,{
      state: "getResponse(bogus question)",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithEmployeeData: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      employeeData: event.data
    },
    workflow: [...context.workflow,{
      state: "getEmployeeData",
      timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
    }]
  })),

  updateContextWithGeneratedResponse: assign<PromptContext, any>((context, event) => ({
    ...context,
    prompt: {
      ...context.prompt,
      output: event.data["response"],
      responseType: `Response given using content`
    },
    workflow: [...context.workflow,{
      state: "getResponse",
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

};
 