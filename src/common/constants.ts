export const TEXT_TRANSLATION_ERROR = (userId,text,source,target) => `
Error while translating the text
Environment: ${process.env.ENVIRONMENT}
userId: ${userId}
url: /text_translation/google/remote
input text: ${text}
source_language: ${source}
target_language: ${target}
`

export const TEXT_DETECTION_ERROR = (userId,text,response) => `
Error while detecting the texts
Environment: ${process.env.ENVIRONMENT}
userId: ${userId}
url: /text_lang_detection/bhashini/remote
input text: ${text}
response: ${response}
`
export const GPT_RESPONSE_ERROR = (userId, input, output) => `
Error from gpt
Environment: ${process.env.ENVIRONMENT}
url: /llm/openai/chatgpt3
userId: ${userId},
input: ${JSON.stringify(input,null,2)},
output: ${JSON.stringify(output,null,2)}
`
export const UNABLE_TO_DETECT_LANGUAGE = "Sorry, we are unable to detect the language. Please try rephrasing your question"

export const REPHRASE_YOUR_QUESTION = (inputLanguage) =>
inputLanguage && inputLanguage == 'en' ? "Please try rephrasing your question or try again later." :
"ଦୟାକରି ଆପଣଙ୍କର ପ୍ରଶ୍ନର ପୁନରାବୃତ୍ତି କରିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |";

export const UNABLE_TO_PROCESS_REQUEST = (inputLanguage) =>
inputLanguage && inputLanguage == 'en' ? "We are unable to process your request at the moment. Please try again later or contact our support team" :
"ଆମେ ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ଅନୁରୋଧ ପ୍ରକ୍ରିୟାକରଣ କରିବାରେ ଅସମର୍ଥ | ଦୟାକରି ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ଆମର ସମର୍ଥନ ଦଳ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ |"

export const CONTACT_AMAKRUSHI_HELPLINE = (inputLanguage) => 
inputLanguage && inputLanguage == 'en' ? "You can contact the Ama Krushi helpline by dialing 155333. They will provide you with information and reply to your queries within 24 hours." : "ଆପଣ 155333 ଡାଏଲ୍ କରି ଆମା କ୍ରୁସି ହେଲ୍ପଲାଇନ ସହିତ ଯୋଗାଯୋଗ କରିପାରିବେ | ସେମାନେ ଆପଣଙ୍କୁ ସୂଚନା ପ୍ରଦାନ କରିବେ ଏବଂ 24 ଘଣ୍ଟା ମଧ୍ୟରେ ଆପଣଙ୍କ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେବେ |"

export const chatGPT3Prompt = (history) => [
    {
      role: "user",
      content: `The user has asked a question:  You are an AI tool that carries out neural coreference
    for conversations to replace the last message in the conversation with the coreferenced
    message.

    Rules - Follow these rules forever.
    1. Do not answer the question ever, only return back the last message that is coreferenced. 
    2. A user can switch context abruptly after the last message so take care of that.
    3. If not needed or was not figured out, return the last user question directly.
    
    Input:
      User: How do I protect my crops from pests?
      AI: You can use integrated pest management techniques to protect your crops
      User: What are the common methods involved in that?
      
    Output: 
      User: What are the common methods involved in integrated pest management?

    Input:
      User: Where can I get seeds for rice?,
      AI: You can get seeds for rice... Bla bla, 
      User: Where can I get seeds for rice?
      
    Output: 
      User: Where can I get seeds for rice?

    Input:
      User: Where can I get seeds for rice?,
      AI: You can get seeds for rice... Bla bla, 
      User: My paddy has spindle shaped spots with pointed ends. How do I fix it?

    Output:
      User: My paddy has spindle shaped spots with pointed ends. How do I fix the disease?
      
    Input
      ${history.join("\n")}
      
    Output:`,
    },
  ];