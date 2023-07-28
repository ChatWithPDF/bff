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
const Papa = require('papaparse');
import axios from "axios";

@Injectable()
export class AiToolsService {
  private logger: CustomLogger;
  constructor(
    private configService: ConfigService
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
    let translateURL = 'text_translation/bhashini/remote/';
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
    console.log(raw)

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    try {
      let response: any = await fetch(
        `${this.configService.get("AKAI_AI_TOOLS_BASE_URL")}/llm/openai/chatgpt3`,
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

  async getPDFChunks(text: string, pdfId: string): Promise<any>{
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      this.configService.get("AI_TOOLS_AUTH_HEADER")
    );
    text = text.replace(/\s{2,}/g, ' ')
    text = text.replace(/\n/g,' ')
    text = text.replace(`"`,'')
    var raw = JSON.stringify({
      text
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };
    console.log("sending", text)
    try{
      let response: any = await fetch(`${this.configService.get("AI_TOOLS_BASE_URL")}/chunking/MPNet/local/`, requestOptions)
      response = await response.text()
      response = await Papa.parse(response)
      response = await Papa.unparse(response)
      const csvFilePath = path.join(__dirname, `../../../fileUploads/${pdfId}.csv`);
      fs.writeFileSync(csvFilePath, response);
    }catch(error){
      console.log('error', error)
    }
  }

  async getCSVFromChunks(pdfId: string): Promise<any> {
    var myHeaders = new Headers();

    var formdata = new FormData();
    const csvFilePath = path.join(__dirname, `../../../fileUploads/${pdfId}.csv`);
    formdata.append('file', fs.createReadStream(csvFilePath), 'data.csv');
    console.log(formdata.getHeaders(),myHeaders)
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

}
