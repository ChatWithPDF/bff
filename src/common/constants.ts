import * as moment from "moment";

export const REPHRASE_YOUR_QUESTION = (inputLanguage) =>
inputLanguage && inputLanguage == 'en' ? "Please try rephrasing your question or try again later." :
"ଦୟାକରି ଆପଣଙ୍କର ପ୍ରଶ୍ନର ପୁନରାବୃତ୍ତି କରିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |";

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


export const generalPrompt = (history, expertContext, userQuestion, neuralCoreference, employeeData) => {
  let input = [
      {
        role: "system",
        content: 
`
You are a Employee onbaording assistant who helps with answering questions for Samagra employees based on the search results.
Only answer based on the context provided and do not consider generic information.
You refer to the employees by name when answering the questions and tailor the answers with relevance to their roles, tracks, joining dates, etc.
`
      },
      {
        role: "user",
        content:
`
Instructions: Compose a comprehensive reply to the query using the relevant Samagra Corpus given.
The corpus are chunks with 'Heading' and 'Content' like they are sections from a book.
Ensure you go through them all, reorganise them and then answer the query step by step.
Make sure the answer is correct and don't output false content.
If the text does not relate to the query, simply state 'Text Not Found in PDF'.
Be as verbose and comprehensive as you need to be.
Structure the answers in bullet points and sections.
Ignore outliers corpus which has nothing to do with the question.
You refer to me by name when answering the questions.
Tailor the answers with relevance to my roles, tracks, joining dates, etc.

Answer step-by-step and walk through your process as you go.
Always contextualize the answer to the question based on my information as an employee.
Omit reproducing information that doesn't concern me.

General Information:
Today's date: ${moment().format('MMM DD, YYYY (dddd)')}
More information about myself: {
   "employeeId": "EMP-077",
   "firstName": "Prateek",
   "lastName": "Jakhar",
   "middleName": "",
   "email": "prateek@samagragovernance.in",
   "track": "Engineering Track",
   "designation": "Software Engineer I",
   "role": "Software Engineer",
   "program": "Engineering",
   "dateOfJoining": "2022-11-13T18:30:00.000Z",
   "dateOfBirth": "2001-11-09T18:30:00.000Z",
   "age": "21 year(s) 11 month(s)",
   "gender": "Male",
   "maritalStatus": "Single",
   "mobileNumber": "9034350533",
   "presentAddress": "",
   "permanentAddress": ""
}

Tailor your answer with me in mind using the above information.

When answering just answer, don't repeat my query or try to be over verbose. Be a teacher but don't repeat.

Format of the Query and Answer
Query: {question}
Answer: {answer}

${expertContext}

${userQuestion}
`
      }
//       {
//           role: "system",
//           content:
// `You are a helpful assistant who helps with answering questions for Samagra employees based on the provided information. Only answer based on the context provided and do not consider generic information. You provide context number in square brackets. You may use more than one context to answer. Some of the context is a summary of the image, so you can use pharases like "As shown in the image below" when using that context. The context with image will be in <> brackets along with the context number (example: <image 1>).

// Use below data while answering the question:
// General Information:
// Today's date: ${moment().format('MMM DD, YYYY dddd')}

// ${employeeData ? `
// Information of the employee asking the question is given in JSON format below, use this data to give a personalized answer for this employee to the question asked, mention employee name in answer:
// ${JSON.stringify(employeeData,null,3)}
// `:''}

// ${expertContext}

// Examples shared below
// ---------------------------------------------------
// Question: How many leaves do I get in a year?

// Context:
// 1. You get 22 planned leaves in a year.
// 2. You can avail 15 wedding leaves. <image>

// Answer: You get 22 planned and 15 wedding leaves [1]  as shown in the image below <image 2>.
// ---------------------------------------------------

// Question:  How many total leaves do I get?
// Context:
// 1. You get 22 planned leaves in a year.
// 2. You can avail 15 wedding leaves. <Image>
// 3. You get 4 optional holidays to choose from as well.
// 4. You can take sabbatical for 1 month without pay as well.

// Answer: You get today 41 leave an year which included 22 planned leaves [1], 15 wedding leaves [2] and 4 optional holidays [3]. Additionaly, you may also take 1 month sabbatical without pay.
// ---------------------------------------------------`
//       ,}
  ]
  history.forEach(text => {
      input.push({
          role: text.indexOf('User:') != -1 ? "user": "assistant",
          content: text.replace('User:','').replace('AI: ','').trim()
      })
  });
  input.pop()
  input.push({
      role: "user",
      content: neuralCoreference || userQuestion
  })
  return input
}

export const restructureContentPrompt = (history, expertContext, userQuestion, neuralCoreference, employeeData) => {
  let input = [
    {
      role: "system",
      content: 
`
Restructure and organize the below Relevant Samagra Corpus according to the user question, do not use any genric infomation other than Samagra corpus:
${expertContext}
`
    },
    {
      role: "user",
      content: `${userQuestion}`
    }
  ]
  return input
}