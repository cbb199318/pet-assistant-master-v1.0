import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Booking } from './booking.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  // 帖子相关操作
  async createPost(postData: {
    title: string;
    content: string;
    image?: string;
    userId: number;
  }): Promise<Post> {
    const user = await this.userRepository.findOne({ where: { id: postData.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = this.postRepository.create({
      title: postData.title,
      content: postData.content,
      images: postData.image ? [postData.image] : [],
      user_id: user.id,
      user,
    });

    return this.postRepository.save(post);
  }

  async getPosts(limit: number = 10, offset: number = 0): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getMyPosts(userId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { user_id: userId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'commentList', 'commentList.user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async updatePost(id: number, postData: {
    title?: string;
    content?: string;
    image?: string;
  }, userId: number): Promise<Post> {
    const post = await this.getPostById(id);
    if (post.user_id !== userId) {
      throw new ForbiddenException('无权修改该帖子');
    }

    Object.assign(post, {
      title: postData.title ?? post.title,
      content: postData.content ?? post.content,
      images: postData.image ? [postData.image] : post.images,
    });
    return this.postRepository.save(post);
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.getPostById(id);
    if (post.user_id !== userId) {
      throw new ForbiddenException('无权删除该帖子');
    }

    await this.commentRepository.delete({ post_id: id });
    await this.postRepository.delete(id);
  }

  async likePost(id: number): Promise<Post> {
    const post = await this.getPostById(id);
    post.likes++;
    return this.postRepository.save(post);
  }

  // 评论相关操作
  async createComment(commentData: {
    content: string;
    postId: number;
    userId: number;
  }): Promise<Comment> {
    const user = await this.userRepository.findOne({ where: { id: commentData.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postRepository.findOne({ where: { id: commentData.postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepository.create({
      content: commentData.content,
      post_id: post.id,
      user_id: user.id,
      user,
      post,
    });

    // 更新帖子的评论数
    post.comments++;
    await this.postRepository.save(post);

    return this.commentRepository.save(comment);
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  async getMyComments(userId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { user_id: userId },
      relations: ['user', 'post'],
      order: { created_at: 'DESC' },
    });
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['post'],
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenException('无权删除该评论');
    }

    // 更新帖子的评论数
    if (comment.post.comments > 0) {
      comment.post.comments--;
      await this.postRepository.save(comment.post);
    }

    await this.commentRepository.delete(id);
  }

  // 服务预订相关操作
  async createBooking(bookingData: {
    serviceType: string;
    serviceName: string;
    serviceAddress: string;
    bookingDate: Date;
    bookingTime: string;
    notes?: string;
    userId: number;
  }): Promise<Booking> {
    const user = await this.userRepository.findOne({ where: { id: bookingData.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = this.bookingRepository.create({
      ...bookingData,
      user,
    });

    return this.bookingRepository.save(booking);
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { bookingDate: 'ASC' },
    });
  }

  async updateBookingStatus(id: number, userId: number, status: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.user?.id !== userId) {
      throw new ForbiddenException('无权修改该预约');
    }
    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async deleteBooking(id: number, userId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.user?.id !== userId) {
      throw new ForbiddenException('无权删除该预约');
    }
    await this.bookingRepository.delete(id);
  }
}
