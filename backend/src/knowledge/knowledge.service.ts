import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { Category } from './category.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
  ) {}

  // 分类相关操作
  async createCategory(categoryData: {
    name: string;
    description?: string;
  }): Promise<Category> {
    const category = this.categoryRepository.create(categoryData);
    return this.categoryRepository.save(category);
  }

  async getCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['articles'],
    });
  }

  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['articles'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(id: number, categoryData: {
    name?: string;
    description?: string;
  }): Promise<Category> {
    const category = await this.getCategoryById(id);
    Object.assign(category, categoryData);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
  }

  // 文章相关操作
  async createArticle(articleData: {
    title: string;
    content: string;
    cover_image?: string;
    image?: string;
    categoryId: number;
    status?: string;
    kind?: string;
    is_recommended?: boolean;
    sort_order?: number;
    recommendation_reason?: string;
  }): Promise<Article> {
    const category = await this.categoryRepository.findOne({ where: { id: articleData.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const article = this.articleRepository.create({
      title: articleData.title,
      content: articleData.content,
      cover_image: articleData.cover_image || articleData.image,
      category,
      status: articleData.status || 'published',
      kind: articleData.kind || 'knowledge',
      is_recommended: Boolean(articleData.is_recommended),
      sort_order: Number(articleData.sort_order) || 0,
      recommendation_reason: articleData.recommendation_reason || null,
    });

    return this.articleRepository.save(article);
  }

  async getArticles(limit: number = 10, offset: number = 0, kind: string = 'knowledge'): Promise<Article[]> {
    return this.articleRepository.find({
      where: { status: 'published', kind },
      relations: ['category'],
      order: { sort_order: 'DESC', created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getArticleById(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id, status: 'published' },
      relations: ['category'],
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 增加浏览量
    article.views++;
    await this.articleRepository.save(article);

    return article;
  }

  async getArticlesByCategoryId(categoryId: number, limit: number = 10, offset: number = 0, kind: string = 'knowledge'): Promise<Article[]> {
    return this.articleRepository.find({
      where: { category: { id: categoryId }, status: 'published', kind },
      relations: ['category'],
      order: { sort_order: 'DESC', created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateArticle(id: number, articleData: {
    title?: string;
    content?: string;
    cover_image?: string;
    image?: string;
    categoryId?: number;
    status?: string;
    kind?: string;
    is_recommended?: boolean;
    sort_order?: number;
    recommendation_reason?: string;
  }): Promise<Article> {
    const article = await this.getArticleById(id);

    if (articleData.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: articleData.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      article.category = category;
      delete articleData.categoryId;
    }

    Object.assign(article, {
      ...articleData,
      cover_image: articleData.cover_image || articleData.image || article.cover_image,
      is_recommended:
        articleData.is_recommended !== undefined
          ? Boolean(articleData.is_recommended)
          : article.is_recommended,
      sort_order:
        articleData.sort_order !== undefined ? Number(articleData.sort_order) || 0 : article.sort_order,
      recommendation_reason:
        articleData.recommendation_reason !== undefined
          ? articleData.recommendation_reason || null
          : article.recommendation_reason,
    });
    delete (article as Partial<Article> & { image?: string }).image;
    return this.articleRepository.save(article);
  }

  async deleteArticle(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Article not found');
    }
  }

  async likeArticle(id: number): Promise<Article> {
    const article = await this.getArticleById(id);
    article.likes++;
    return this.articleRepository.save(article);
  }

  async favoriteArticle(id: number): Promise<Article> {
    const article = await this.getArticleById(id);
    article.favorites++;
    return this.articleRepository.save(article);
  }

  // 搜索和推荐
  async searchArticles(keyword: string, limit: number = 10): Promise<Article[]> {
    return this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.status = :status', { status: 'published' })
      .andWhere('article.kind = :kind', { kind: 'knowledge' })
      .andWhere('(article.title LIKE :keyword OR article.content LIKE :keyword)', { keyword: `%${keyword}%` })
      .orderBy('article.sort_order', 'DESC')
      .addOrderBy('article.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async getRecommendedArticles(limit: number = 5): Promise<Article[]> {
    return this.articleRepository.find({
      where: { status: 'published', kind: 'knowledge', is_recommended: true },
      relations: ['category'],
      order: { sort_order: 'DESC', views: 'DESC' },
      take: limit,
    });
  }

  async getRecommendedProducts(limit: number = 6): Promise<Article[]> {
    return this.articleRepository.find({
      where: { status: 'published', kind: 'product', is_recommended: true },
      relations: ['category'],
      order: { sort_order: 'DESC', created_at: 'DESC' },
      take: limit,
    });
  }
}
