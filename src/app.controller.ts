import { Controller, Get, Post, Headers, Body, UseInterceptors, Param } from "@nestjs/common";
import { AppService, Prompt } from "./app.service";
import { IsNotEmpty,IsUUID, IsOptional } from 'class-validator';
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
  @IsNotEmpty()
  @IsUUID()
  pdfId: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("/prompt")
  async prompt(@Body() promptDto: PromptDto, @Headers() headers): Promise<any> {
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
      responseType: result.responseType,
      output: result.output,
      outputInEnglish: result.outputInEnglish,
      context: result.similarDocs
    };
  }

  @Get("/health/:minutes")
  health(@Param("minutes") minutes: number): any {
    return this.appService.getHealth(parseInt(`${minutes}`));
  }
  
}
