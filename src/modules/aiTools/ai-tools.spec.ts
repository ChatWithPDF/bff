import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiToolsService } from './ai-tools.service';
import { PrismaService } from '../../global-services/prisma.service';
import { Language } from '../../language';

describe('AppService', () => {
  let aiToolsService: AiToolsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiToolsService,
        PrismaService,
        ConfigService
      ],
    }).compile();

    aiToolsService = module.get<AiToolsService>(AiToolsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect language correctly', async () => {
      const result = await aiToolsService.detectLanguage("ଓଡ଼ିଶାରେ");
      expect(result.language).toBe('or');
    });

    it('should use regex and check when language detection fails (eng text)', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce('Language detection failed');
      let res = await aiToolsService.detectLanguage("Hello") 
      expect(res.language).toBe('en');
    });

    it('should use regex and check when language detection fails (odiya text)', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce('Language detection failed');
      let res = await aiToolsService.detectLanguage("ଓଡ଼ିଶାରେ ଉତ୍ପାଦନ ହେଉଥିବା ବିଭିନ୍ନ ପ୍ରକାର ମିଲେଟ୍ ଗୁଡିକ କ'ଣ ?")
      expect(res.language).toBe('unk');
    });
  });

  describe('translate', () => {
    it('should translate text correctly', async () => {
      const source = Language.or;
      const target = Language.en;
      const text = 'ନମସ୍କାର';
      const expectedResult = {"error": null, "translated": "Hello"};
      const result = await aiToolsService.translate(source, target, text);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should handle error when translation fails (returns empty string)', async () => {
      const source = Language.or;
      const target = Language.en;
      const text = 'Hola';
      jest.spyOn(global, 'fetch').mockRejectedValueOnce('Translation failed');
      await expect(!aiToolsService.translate(source, target, text)).toBe(false);
    });
  });

  describe('llm', () => {
    it('should handle error when GPT-3 response is not available', async () => {
      const prompt = 'Tell me a joke';
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(undefined);
      let res = await aiToolsService.llm(prompt)
      expect(res).toStrictEqual({response:null, allContent:null, error: "Cannot read properties of undefined (reading 'json')"});
    });
  });
});