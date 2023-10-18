export const promptGuards = {
    unableToDetectLanguage: (_, event) => event.data.language == 'unk',
    unableToTranslate: (_, event) => event.data.error!=null,
    isUserHistoryEmpty: (_, event) => event.data.length === 0,
    ifSimilarQuestionFound: (_, event) => event.data?.length > 0,
    ifSimilarDocsFound: (_, event) => event.data?.length > 0,
    ifHighestMatchingChunkFound: (_, event) => event.data ? true: false,
    llmResponseIsEmpty: (_, event) => {
        if(!event.data['response']){
            return true
        }
        if(event.data.error){
            return true
        }
    },
    wordContactInQuery: (_, event) => /contact/i.test(event.data?.translated)
}