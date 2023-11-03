import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/logger';
import { Language } from '../../language';
import { isMostlyEnglish } from '../../utils';
import * as fs from 'fs';
const fetch = require('node-fetch'); 
const { Headers } = fetch;
import { unlink } from 'fs/promises';
const path = require('path');
const FormData = require("form-data");
import axios from "axios";
import { PrismaService } from 'src/global-services/prisma.service';
const ffmpeg = require('fluent-ffmpeg');

@Injectable()
export class AiToolsService {
  private logger: CustomLogger;
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService
  ) {
    this.logger = new CustomLogger("AiToolsService");
  }
  async detectLanguage(text: string): Promise<any> {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );

    var raw = JSON.stringify({
      text: text.replace("?","")?.trim(),
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    try {
        let response = await fetch(
            `${this.configService.get(
              "AI_TOOLS_BASE_URL"
            )}/text_lang_detection/bhashini/remote/`,
            requestOptions
        )
        response = await response.json()
        return {
            language: response["language"] ? response["language"] as Language : 'unk',
            error: null
        }
    } catch (error) {
        if(isMostlyEnglish(text.replace("?","")?.trim())) {
            return {
                language: Language.en,
                error: error.message
            }
        } else {
            return {
                language: 'unk',
                error: error.message
            }
        }
    }
  }

  async translate(
    source: Language,
    target: Language,
    text: string,
    userMobile?: string,
  ): Promise<any> {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );

    var raw = JSON.stringify({
      source_language: source,
      target_language: target,
      text: text.replace("\n","."),
    });


    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw.replace('"unk\"','"or\"'),
    };
    let translateURL = 'text_translation/azure/remote/';
    translateURL = `${this.configService.get("AI_TOOLS_BASE_URL")}/${translateURL}`
    try {
      let response = await fetch(
        translateURL,
        requestOptions
      )
      response = await response.json()
      let translated = response["translated"] as string ? response["translated"] as string : "";
      return {
        translated,
        error: translated ? null : `unable to translated text ${text} trom ${source} to ${target}`
      }
    } catch(error) {
      return {
        translated: "",
        error: error.message
      }
    }
  }

  async llm(prompt: any): Promise<{ response: string; allContent: any; error: any }> {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );

    var raw = JSON.stringify({
      prompt: prompt,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    try {
      let response: any = await fetch(
        `${this.configService.get("AI_TOOLS_BASE_URL")}/llm/openai/chatgpt3/`,
        requestOptions
      )
      response = await response.json()
      const error = Object.keys(response).indexOf('error')!=-1
        return {
          response: error ? null : response["choices"][0].message.content,
          allContent: error ? null : response,
          error: error ? response.error : null
        };
    } catch(error) {
      console.log("error",error)
      return {response:null, allContent:null, error: error.message? error.message : "Unable to fetch gpt response."}
    }
  }

  async nuralCoref(userHistory: string): Promise<String> {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );

    var raw = JSON.stringify({text: userHistory});

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    try {
      let response: any = await fetch(`${this.configService.get("AI_TOOLS_BASE_URL")}/coref/fcoref/local/`, requestOptions)
      response = await response.json()
      response = response.text
      response = response.split("User: ");
      return response[response.length - 1];
    } catch (error) {
      console.log(error)
    }
  }

  async getEmbedding(query: string): Promise<any> {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );

    var raw = JSON.stringify({
      query
    });

    var requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    let embeddings;
    try {
      embeddings = await fetch(
        `${this.configService.get("AI_TOOLS_BASE_URL")}/embeddings/instructor/local/`,
        requestOptions
      )
      embeddings = await embeddings.json()
    } catch (error) {
      console.log(error)
    }
    
    if (embeddings) return embeddings
    else return []
  }

  async getPDFChunks(filePath: string, pdfId:string): Promise<any>{
    var formdata = new FormData();
    filePath = path.join(__dirname, `../../../${filePath}`);
    formdata.append('file', fs.createReadStream(filePath));
    let config: any = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.configService.get("AI_TOOLS_BASE_URL")}/chunking/MPNet/local/`,
      headers: { 
        'Content-Type': 'application/json', 
        ...formdata.getHeaders()
      },
      data : formdata
    };
    try{
      let response: any = await axios.request(config)
      response = await response.data
      await unlink(filePath)
      const csvFilePath = path.join(__dirname, `../../../files/${pdfId}.csv`);
      fs.writeFileSync(csvFilePath, response);
    }catch(error){
      console.log('error', error)
    }
  }

  async getCSVFromChunks(fileName: string): Promise<any> {
    var formdata = new FormData();
    const csvFilePath = path.join(__dirname, `../../../files/${fileName}`);
    formdata.append('file', fs.createReadStream(csvFilePath), 'data.csv');
    try{
      const response = await axios.post(
        `${this.configService.get("AI_TOOLS_BASE_URL")}/embeddings/instructor/local/`,
        formdata, {
        headers: formdata.getHeaders(),
      });
      await unlink(csvFilePath)
      fs.writeFileSync(csvFilePath, response.data);
    }catch(error){
      console.log('error', error)
    }
  }

  async getBhashiniConfig(task,config) {
    var myHeaders = new Headers();
    myHeaders.append("userID", this.configService.get("ULCA_USER_ID"));
    myHeaders.append("ulcaApiKey", this.configService.get("ULCA_API_KEY"));
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      "pipelineTasks": [
        {
          "taskType": task,
          "config": config
        }
      ],
      "pipelineRequestConfig": {
        "pipelineId": "64392f96daac500b55c543cd"
      }
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };
    try{
      console.log(`${new Date()}: Waiting for ${this.configService.get("ULCA_CONFIG_URL")} (config API) to respond ...`)
      let response  = await fetch(this.configService.get("ULCA_CONFIG_URL"), requestOptions)
      if(response.status != 200){
        console.log(response)
        throw new Error(`${new Date()}: API call to '${this.configService.get("ULCA_CONFIG_URL")}' with config '${JSON.stringify(config,null,3)}' failed with status code ${response.status}`)
      }
      response = await response.json()
      console.log(`${new Date()}: Responded succesfully`)
      return response
    } catch(error) {
      console.log(error);
      return {
        error
      }
    }
  }

  async computeBhashini(authorization, task, serviceId, url, config, input) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", " */*");
    myHeaders.append("Authorization", authorization);
    myHeaders.append("Content-Type", "application/json");
    config['serviceId']=serviceId
    if(task == 'tts'){
      config['gender']='male'
      config['samplingRate']=8000
    }
    var raw = JSON.stringify({
      "pipelineTasks": [
        {
          "taskType": task,
          "config": config
        }
      ],
      "inputData": input
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    try{
      console.log(`${new Date()}: Waiting for ${url} for task (${task}) to respond ...`)
      let response  = await fetch(url, requestOptions)
      if(response.status != 200){
        console.log(response)
        throw new Error(`${new Date()}: API call to '${url}' with config '${JSON.stringify(config,null,3)}' failed with status code ${response.status}`)
      }
      response = await response.json()
      console.log(`${new Date()}: Responded succesfully.`)
      return response
    } catch(error) {
      console.log(error);
      return {
        error
      }
    }
  }

  convertAudioAsync(inputFileName, outputFileName) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputFileName)
        .audioCodec('pcm_s16le')
        .audioChannels(2) // Adjust the number of audio channels if needed
        .on('end', () => {
          console.log('Conversion finished.');
          resolve(0);
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .save(outputFileName);
    });
  }

  async asr(filePath: string, body): Promise<any> {
    var formdata = new FormData();
    filePath = path.join(__dirname, `../../../${filePath}`);

    await this.convertAudioAsync(filePath, path.join(__dirname, `../../../modified.wav`));
    await unlink(filePath)
    filePath = path.join(__dirname, `../../../modified.wav`)

    formdata.append('file', fs.createReadStream(filePath));
    const base64Audio = await this.convertToBase64(filePath);
    await unlink(filePath)
    let config: any = await this.getBhashiniConfig(body.model,{
      "language": {
          "sourceLanguage": body.language
      }
    })

    let response: any = await this.computeBhashini(
      config?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value,
      "asr",
      config?.pipelineResponseConfig[0].config[0].serviceId,
      config?.pipelineInferenceAPIEndPoint?.callbackUrl,
      {
        "language": {
            "sourceLanguage": body.language
        },
        "postProcessors": [
          "itn"
        ],
      },
      {
        "audio":[
          {
            "audioContent": base64Audio
          }
        ]
      }
    )
    if(response["error"]){
      console.log(response["error"])
      throw new Error(response["error"])
    }
    return {
      text: response?.pipelineResponse[0]?.output[0]?.source,
      error: null
    }
  }

  async convertToBase64(filePath: string): Promise<string> {
    try {
      const audioBuffer = await fs.promises.readFile(filePath);
      const base64Encoded = audioBuffer.toString('base64');
      return base64Encoded;
    } catch (error) {
      throw new Error('Error converting audio to base64: ' + error.message);
    }
  }
}
