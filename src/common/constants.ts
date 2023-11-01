import * as moment from "moment";

export const REPHRASE_YOUR_QUESTION = "Please try rephrasing your question or try again later."

export const NO_CONTEXT_ANSWER = "Apologies, but I currently lack access to this information. Your query has been forwarded to the OD team, who will work on adding this data to my content repository. In the meantime, is there anything else I can assist you with?"

export const chatGPT3Prompt = (
  history,
  userQuestion,
  context
) => [
  {
    role: "system",
    content:
        "You are an AI assistant who answers questions by the context provided. Answer my current question provided below based on a summary of the context provided. Ignore the context if irrelevant to the question asked. Do not repeat the question again in the response otherwise people will die. And only just give the answer as the output, if you are unable to find any relevant information in the context provided just ignore the context and give a generic response. And do not answer question as a third persons perspective, answer the question as if you are talking to the user directly.",
  },
  {
    role: "user",
    content: `${history && history.length ?
    `Some important elements of the conversation so far between the me (User) and you (AI) have been extracted in a dictionary here:
    ${history.join("\n")}`
    :''}
    My current question: ${userQuestion}
    Some expert context is provided in dictionary format here:
    ${context}
    `
  }
];


export const generalPrompt = (history, expertContext, userQuestion, neuralCoreference) => {
  let input = [
      {
        role: "system",
        content: 
`
You are a document chat assistant who helps with answering questions  based on the search results. 
If question is not relevant to search reults/corpus, refuse to answer.

Follow the instructions while answering :
1. You compose a comprehensive reply to the query using the relevant  Corpus given and quote verbatim from the corpus as much as possible 
2. If no part of the content is relevant/useful to the answer do not use the content, just provide an answer that that relevant content is not available.
3. Ensure you go through them all the content, reorganise them and then answer the query step by step.
4. No matter what, do not output false content

Format of the Query and Answer
Query: {question}
Answer: {answer}
`
      },
      {
        role: "user",
        content:
`
${expertContext}
`
      }]
  history.forEach(text => {
      input.push({
          role: text.indexOf('User:') != -1 ? "user": "assistant",
          content: text.replace('User:','').replace('AI: ','').trim()
      })
  });
  input.push({
      role: "user",
      content: neuralCoreference || userQuestion
  })
  return input
}