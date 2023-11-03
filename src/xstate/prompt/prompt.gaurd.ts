export const promptGuards = {
    isUserHistoryEmpty: (_, event) => event.data.length === 0,
    ifSimilarQuestionFound: (_, event) => event.data?.length > 0,
    ifSimilarDocsFound: (_, event) => event.data.documentsFound,
    ifBestMatchingChunksFound: (_, event) =>{return event.data.matchType ? true: false},
    llmResponseIsEmpty: (_, event) => {
        if(!event.data['response']){
            return true
        }
        if(event.data.error){
            return true
        }
    }
}