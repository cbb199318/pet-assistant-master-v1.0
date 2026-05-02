import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, Brackets } from 'typeorm';
import { User } from '../users/user.entity';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { Booking } from '../community/booking.entity';
import { Article } from '../knowledge/article.entity';
import { Category } from '../knowledge/category.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Pet) private petRepository: Repository<Pet>,
    @InjectRepository(Vaccination)
    private vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Deworming)
    private dewormingRepository: Repository<Deworming>,
    @InjectRepository(Checkup)
    private checkupRepository: Repository<Checkup>,
    @InjectRepository(Care)
    private careRepository: Repository<Care>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  private toUserSummary(user: User) {
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      created_at: user.created_at,
    };
  }

  async getOverview() {
    const [
      totalUsers,
      totalPets,
      totalVaccinations,
      totalDewormings,
      totalCheckups,
      totalCares,
      totalPosts,
      totalComments,
      totalArticles,
      totalCategories,
    ] = await Promise.all([
      this.userRepository.count(),
      this.petRepository.count(),
      this.vaccinationRepository.count(),
      this.dewormingRepository.count(),
      this.checkupRepository.count(),
      this.careRepository.count(),
      this.postRepository.count(),
      this.commentRepository.count(),
      this.articleRepository.count(),
      this.categoryRepository.count(),
    ]);

    return {
      totalUsers,
      totalPets,
      totalVaccinations,
      totalDewormings,
      totalCheckups,
      totalCares,
      totalPosts,
      totalComments,
      totalArticles,
      totalCategories,
    };
  }

  private buildPaging(params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));

    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    };
  }

  async getUsers(params: {
    keyword?: string;
    page: number;
    pageSize: number;
  }) {
    const { page, pageSize, skip } = this.buildPaging(params);

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('user.phone LIKE :keyword', { keyword }).orWhere(
            'user.nickname LIKE :keyword',
            { keyword },
          );
        }),
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.toUserSummary(item)),
      total,
      page,
      pageSize,
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['pets'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const pets = await Promise.all(
      user.pets.map(async (pet) => {
        const [vaccinationCount, dewormingCount, checkupCount, careCount] =
          await Promise.all([
            this.vaccinationRepository.count({ where: { pet_id: pet.id } }),
            this.dewormingRepository.count({ where: { pet_id: pet.id } }),
            this.checkupRepository.count({ where: { pet_id: pet.id } }),
            this.careRepository.count({ where: { pet_id: pet.id } }),
          ]);

        return {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          created_at: pet.created_at,
          recordSummary: {
            vaccinations: vaccinationCount,
            dewormings: dewormingCount,
            checkups: checkupCount,
            cares: careCount,
          },
        };
      }),
    );

    return {
      user: this.toUserSummary(user),
      pets,
    };
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.dataSource.transaction(async (manager) => {
      const pets = await manager.find(Pet, { where: { user_id: id } });
      const petIds = pets.map((pet) => pet.id);

      if (petIds.length > 0) {
        await manager.delete(Care, { pet_id: In(petIds) });
        await manager.delete(Vaccination, { pet_id: In(petIds) });
        await manager.delete(Deworming, { pet_id: In(petIds) });
        await manager.delete(Checkup, { pet_id: In(petIds) });
        await manager.delete(Pet, { id: In(petIds) });
      }

      const userPosts = await manager.find(Post, {
        where: { user_id: id },
        select: ['id'],
      });
      const postIds = userPosts.map((post) => post.id);

      if (postIds.length > 0) {
        await manager.delete(Comment, { post_id: In(postIds) });
        await manager.delete(Post, { id: In(postIds) });
      }

      await manager.delete(Comment, { user_id: id });

      await manager
        .createQueryBuilder()
        .delete()
        .from(Booking)
        .where('userId = :userId', { userId: id })
        .execute();

      await manager.delete(User, { id });
    });

    return {
      message: '用户删除成功',
    };
  }

  async getPosts(params: { keyword?: string; page: number; pageSize: number }) {
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('post.title LIKE :keyword', { keyword })
            .orWhere('post.content LIKE :keyword', { keyword })
            .orWhere('user.nickname LIKE :keyword', { keyword })
            .orWhere('user.phone LIKE :keyword', { keyword });
        }),
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('post.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        likes: post.likes,
        comments: post.comments,
        created_at: post.created_at,
        author: this.toUserSummary(post.user),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getPostById(id: number) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'commentList', 'commentList.user'],
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      images: post.images || [],
      likes: post.likes,
      comments: post.comments,
      created_at: post.created_at,
      author: this.toUserSummary(post.user),
      commentList: post.commentList.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: this.toUserSummary(comment.user),
      })),
    };
  }

  async deletePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    await this.commentRepository.delete({ post_id: id });
    await this.postRepository.delete(id);

    return { message: '帖子删除成功' };
  }

  async getComments(params: { keyword?: string; page: number; pageSize: number }) {
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('comment.content LIKE :keyword', { keyword })
            .orWhere('post.title LIKE :keyword', { keyword })
            .orWhere('user.nickname LIKE :keyword', { keyword })
            .orWhere('user.phone LIKE :keyword', { keyword });
        }),
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('comment.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: this.toUserSummary(comment.user),
        post: comment.post
          ? {
              id: comment.post.id,
              title: comment.post.title,
            }
          : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getCommentById(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'post', 'post.user'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author: this.toUserSummary(comment.user),
      post: comment.post
        ? {
            id: comment.post.id,
            title: comment.post.title,
            content: comment.post.content,
            author: comment.post.user ? this.toUserSummary(comment.post.user) : null,
          }
        : null,
    };
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['post'],
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.post?.comments > 0) {
      comment.post.comments--;
      await this.postRepository.save(comment.post);
    }

    await this.commentRepository.delete(id);
    return { message: '评论删除成功' };
  }

  async getCategories(params: { keyword?: string; page: number; pageSize: number }) {
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.articles', 'article');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('category.name LIKE :keyword', { keyword }).orWhere(
            'category.description LIKE :keyword',
            { keyword },
          );
        }),
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('category.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        created_at: category.created_at,
        articleCount: category.articles?.length || 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getCategoryById(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['articles'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.created_at,
      articles: (category.articles || []).map((article) => ({
        id: article.id,
        title: article.title,
        views: article.views,
        likes: article.likes,
        favorites: article.favorites,
      })),
    };
  }

  async createCategory(data: { name: string; description?: string }) {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: number, data: { name?: string; description?: string }) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['articles'],
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    if ((category.articles || []).length > 0) {
      throw new BadRequestException('该分类下仍有文章，请先删除文章');
    }

    await this.categoryRepository.delete(id);
    return { message: '分类删除成功' };
  }

  async getArticles(params: { keyword?: string; page: number; pageSize: number }) {
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('article.title LIKE :keyword', { keyword })
            .orWhere('article.content LIKE :keyword', { keyword })
            .orWhere('category.name LIKE :keyword', { keyword });
        }),
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('article.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((article) => ({
        id: article.id,
        title: article.title,
        cover_image: article.cover_image,
        views: article.views,
        likes: article.likes,
        favorites: article.favorites,
        created_at: article.created_at,
        category: article.category
          ? {
              id: article.category.id,
              name: article.category.name,
            }
          : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getArticleById(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      cover_image: article.cover_image,
      views: article.views,
      likes: article.likes,
      favorites: article.favorites,
      created_at: article.created_at,
      updated_at: article.updated_at,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            description: article.category.description,
          }
        : null,
    };
  }

  async createArticle(data: {
    title: string;
    content: string;
    cover_image?: string;
    categoryId: number;
  }) {
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    const article = this.articleRepository.create({
      title: data.title,
      content: data.content,
      cover_image: data.cover_image,
      category,
    });

    return this.articleRepository.save(article);
  }

  async updateArticle(
    id: number,
    data: {
      title?: string;
      content?: string;
      cover_image?: string;
      categoryId?: number;
    },
  ) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    if (data.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
      article.category = category;
    }

    if (data.title !== undefined) {
      article.title = data.title;
    }
    if (data.content !== undefined) {
      article.content = data.content;
    }
    if (data.cover_image !== undefined) {
      article.cover_image = data.cover_image;
    }

    return this.articleRepository.save(article);
  }

  async deleteArticle(id: number) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    await this.articleRepository.delete(id);
    return { message: '文章删除成功' };
  }
}
