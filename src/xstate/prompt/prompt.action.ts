import { assign } from 'xstate';
import {PromptContext} from './prompt.machine'
import { NO_CONTEXT_ANSWER, REPHRASE_YOUR_QUESTION } from '../../common/constants';

export const promptActions = {

  updatePromptWithUserHistory: assign<PromptContext, any>((context, event) => {
    try{
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
      }
    } catch (error) {
      console.log(error)
    }    
  }),

  setNeuralCoreferenceAsInput: assign<PromptContext, any>((context, event) => {
    try{
      let ret =  {
        ...context,
        prompt: {
          ...context.prompt,
          neuralCoreference: context.prompt.input.body
        },
        workflow: [...context?.workflow,{
          state: "getNeuralCoreference",
          timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
        }]
      }
      return ret
    } catch(error){
      console.log(error)
    }
  }),

  updateContextWithCoreferencedPrompt: assign<PromptContext, any>((context, event) => {
      try{
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
        }
      } catch(error) {
        console.log(error)
      }
  }),

  updateContextWithSimilarDocs: assign<PromptContext, any>((context, event) => {
      try{
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
        }
      }catch(error){
        console.log(error)
      }
  }),

  updateContextForResponseWithoutContent: assign<PromptContext, any>((context, event) => {
      try{
        return {
          ...context,
          prompt: {
            ...context.prompt,
            responseType: `Response given through GPT without content`,
            outputInEnglish: NO_CONTEXT_ANSWER
          },
          workflow: [...context.workflow,{
            state: "getResponse(without hitting the content DB)",
            timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
          }]
        }
      } catch(error){
        console.log(error)
      }
    }),

  updateContextForBogusQuestion: assign<PromptContext, any>((context, event) => {
    try {
      return {
        ...context,
        prompt: {
          ...context.prompt,
          responseType: "Response given to bogus question",
          output: REPHRASE_YOUR_QUESTION
        },
        workflow: [...context.workflow,{
          state: "getResponse(bogus question)",
          timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
        }]
      }
    } catch (error){
      console.log(error)
    }
  }),

  updateContextWithGeneratedResponse: assign<PromptContext, any>((context, event) => {
    try {
      return {
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
      }
    } catch (error) {
      console.log(error)
    }
  }),

  updateContextWithTimeTakenToStoreMessage: assign<PromptContext, any>((context, _) => {
    try {
      return {
        ...context,
        workflow: [...context.workflow,{
          state: "storeAndSendMessage",
          timeTaken: `${(Date.now() - context.currentStateStartTime)/1000} sec`
        }]
      }
    } catch (error) {
      console.log(error)
    }
  }),

  setStartTimeForCompleteFlow: assign<PromptContext, any>((context, _) => {
    try {
      return {
        ...context,
        prompt: {
          ...context.prompt,
          timestamp: new Date().getTime()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }),

  setStartTime: assign<PromptContext, any>((context, _) => {
    try {
      return {
        ...context,
        currentStateStartTime: Date.now()
      }
    } catch (error) {
      console.log(error)
    }
  }),

  updateContextWithError: assign<PromptContext, any>((context, event) => {
    try {
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
    } catch (error) {
      console.log(error)
    }
  }),

  updateContextWithErrorRate: assign<PromptContext, any>((context, _) => {
    try {
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
    } catch (error) {
      console.log(error)
    }
  }),

};
 