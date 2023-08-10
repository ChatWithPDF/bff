import { Body, Controller, Post, UseInterceptors, UploadedFile, UnsupportedMediaTypeException, Headers} from "@nestjs/common";
import { FastifyFileInterceptor } from "../../interceptors/file.interceptor";
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { AiToolsService } from "../aiTools/ai-tools.service";
import { ConfigService } from "@nestjs/config";

const editFileName = (req: Request, file: Express.Multer.File, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback,
) => {
  if (!file.originalname.match(/\.(wav)$/)) {
    return callback(new UnsupportedMediaTypeException('Only wav files are allowed!'), false);
  }
  callback(null, true);
};

@Controller("aitools")
export class AIToolsController {
    constructor(
        private configService: ConfigService,
        private aiToolsService: AiToolsService
    ){
        this.aiToolsService = new AiToolsService(configService) 
    }

    @Post('asr')
    @UseInterceptors(
        FastifyFileInterceptor('file', {
        storage: diskStorage({
            destination: './files',
            filename: editFileName,
        }),
        fileFilter: imageFileFilter,
        })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body, @Headers() headers) {
       return await this.aiToolsService.asr(file.path)
    }
}
