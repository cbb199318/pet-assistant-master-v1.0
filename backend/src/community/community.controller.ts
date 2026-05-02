import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommunityService } from './community.service';
import { Post as PostEntity } from './post.entity';
import { Comment } from './comment.entity';
import { Booking } from './booking.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  // 帖子相关接口
  @Post('posts')
  async createPost(@Body() postData: {
    title: string;
    content: string;
    image?: string;
  }, @Request() req): Promise<PostEntity> {
    return this.communityService.createPost({
      ...postData,
      userId: req.user.userId,
    });
  }

  @Get('posts')
  async getPosts(@Query('limit') limit: number = 10, @Query('offset') offset: number = 0): Promise<PostEntity[]> {
    return this.communityService.getPosts(limit, offset);
  }

  @Get('my-posts')
  async getMyPosts(@Request() req): Promise<PostEntity[]> {
    return this.communityService.getMyPosts(req.user.userId);
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: number): Promise<PostEntity> {
    return this.communityService.getPostById(id);
  }

  @Put('posts/:id')
  async updatePost(@Param('id') id: number, @Body() postData: {
    title?: string;
    content?: string;
    image?: string;
  }, @Request() req): Promise<PostEntity> {
    return this.communityService.updatePost(id, postData, req.user.userId);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: number, @Request() req): Promise<void> {
    return this.communityService.deletePost(id, req.user.userId);
  }

  @Post('posts/:id/like')
  async likePost(@Param('id') id: number): Promise<PostEntity> {
    return this.communityService.likePost(id);
  }

  // 评论相关接口
  @Post('comments')
  async createComment(@Body() commentData: {
    content: string;
    postId: number;
  }, @Request() req): Promise<Comment> {
    return this.communityService.createComment({
      ...commentData,
      userId: req.user.userId,
    });
  }

  @Get('posts/:postId/comments')
  async getCommentsByPostId(@Param('postId') postId: number): Promise<Comment[]> {
    return this.communityService.getCommentsByPostId(postId);
  }

  @Get('my-comments')
  async getMyComments(@Request() req): Promise<Comment[]> {
    return this.communityService.getMyComments(req.user.userId);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: number, @Request() req): Promise<void> {
    return this.communityService.deleteComment(id, req.user.userId);
  }

  // 服务预订相关接口
  @Post('bookings')
  async createBooking(@Body() bookingData: {
    serviceType: string;
    serviceName: string;
    serviceAddress: string;
    bookingDate: Date;
    bookingTime: string;
    notes?: string;
  }, @Request() req): Promise<Booking> {
    return this.communityService.createBooking({
      ...bookingData,
      userId: req.user.userId,
    });
  }

  @Get('bookings')
  async getBookingsByUserId(@Request() req): Promise<Booking[]> {
    return this.communityService.getBookingsByUserId(req.user.userId);
  }

  @Put('bookings/:id/status')
  async updateBookingStatus(@Param('id') id: number, @Body() statusData: {
    status: string;
  }, @Request() req): Promise<Booking> {
    return this.communityService.updateBookingStatus(id, req.user.userId, statusData.status);
  }

  @Delete('bookings/:id')
  async deleteBooking(@Param('id') id: number, @Request() req): Promise<void> {
    return this.communityService.deleteBooking(id, req.user.userId);
  }
}
