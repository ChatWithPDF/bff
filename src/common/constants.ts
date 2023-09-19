export const REPHRASE_YOUR_QUESTION = (inputLanguage) =>
inputLanguage && inputLanguage == 'en' ? "Please try rephrasing your question or try again later." :
"ଦୟାକରି ଆପଣଙ୍କର ପ୍ରଶ୍ନର ପୁନରାବୃତ୍ତି କରିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |";

export const CONTACT_AMAKRUSHI_HELPLINE = (inputLanguage) => 
inputLanguage && inputLanguage == 'en' ? "You can contact the Ama Krushi helpline by dialing 155333. They will provide you with information and reply to your queries within 24 hours." : "ଆପଣ 155333 ଡାଏଲ୍ କରି ଆମା କ୍ରୁସି ହେଲ୍ପଲାଇନ ସହିତ ଯୋଗାଯୋଗ କରିପାରିବେ | ସେମାନେ ଆପଣଙ୍କୁ ସୂଚନା ପ୍ରଦାନ କରିବେ ଏବଂ 24 ଘଣ୍ଟା ମଧ୍ୟରେ ଆପଣଙ୍କ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେବେ |"

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
              `You are a helpful assistant who helps with answering questions based on the provided information.  Consider the user question critically. For example if they ask how many leaves they have remaining, check how many leaves they are provided each year, how many they have taken and how many are carried over from last year and calculate the number of leaves that are remaining that they can take based on calculations provided. 
              ${expertContext}
              `,
      }
  ]
  history.forEach(text => {
      input.push({
          role: text.indexOf('User:') != -1 ? "user": "assistant",
          content: text
      })
  });
  input.pop()
  input.push({
      role: "user",
      content: neuralCoreference || userQuestion
  })
  return input
}
