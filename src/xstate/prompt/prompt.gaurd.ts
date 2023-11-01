export const promptGuards = {
    isUserHistoryEmpty: (_, event) => event.data.length === 0,
    ifSimilarDocsFound: (_, event) => event.data.length > 1,
    llmResponseIsEmpty: (_, event) => {
        if(!event.data['response']){
            return true
        }
        if(event.data.error){
            return true
        }
    }
}