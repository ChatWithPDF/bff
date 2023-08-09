import { Controller, Get, Post, Headers, Body, UseInterceptors, Param } from "@nestjs/common";
import { AppService, Prompt } from "./app.service";
import { IsNotEmpty,IsUUID, IsOptional, IsArray } from 'class-validator';
import { interpret } from "xstate";
import { promptMachine } from "./xstate/prompt/prompt.machine";

export class PromptDto {
  @IsNotEmpty()
  body: string;
  @IsNotEmpty()
  @IsUUID()
  userId: string;
  @IsNotEmpty()
  @IsUUID()
  messageId: string;
  @IsOptional()
  @IsUUID()
  conversationId?: string;
  @IsOptional()
  @IsUUID()
  pdfId?: string;
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  pdfIds?: string[];
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("/prompt")
  async prompt(@Body() promptDto: PromptDto): Promise<any> {
    let prompt: Prompt = {
      input: promptDto,
    };
    const promptProcessingService = interpret(
      promptMachine.withContext({
        prompt
      })
    ).start()

    await new Promise((resolve) => {
      promptProcessingService.onDone((state) => {
        resolve(state);
      });
    });
    let result = promptProcessingService.getSnapshot().context.prompt
    // Stop the state machine
    promptProcessingService.stop();
    return {
      id: result.input.messageId,
      neuralCoreferencedQuestion: result.neuralCoreference,
      output: result.output,
      outputInEnglish: result.outputInEnglish,
      context: result?.similarDocs?.length && result?.similarDocs?.slice(0,2)
    };
  }

  @Post("/update/config")
  async updateConfig(@Body() body:any){
    return this.appService.createOrUpdateConfig(body)
  }

  @Get("/health/:minutes")
  health(@Param("minutes") minutes: number): any {
    return this.appService.getHealth(parseInt(`${minutes}`));
  }
  
}
