
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FeedbackService } from './feedback.service';
import { query } from '@prisma/client';

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get("query/like/:id")
  async likeQuery(@Param('id') id: string): Promise<query> {
    return this.feedbackService.likeQuery(id);
  }

  @Get("query/dislike/:id")
  async dislikeQuery(@Param('id') id: string): Promise<query> {
    return this.feedbackService.dislikeQuery(id);
  }

  @Get("query/removelike/:id")
  async removeLike(@Param('id') id: string): Promise<query> {
    return this.feedbackService.removeReactionOnQuery(id);
  }
}
