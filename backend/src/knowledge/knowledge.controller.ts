import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { Article } from './article.entity';
import { Category } from './category.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  // 分类相关接口
  @Post('categories')
  @UseGuards(AuthGuard('jwt'))
  async createCategory(@Body() categoryData: {
    name: string;
    description?: string;
  }): Promise<Category> {
    return this.knowledgeService.createCategory(categoryData);
  }

  @Get('categories')
  async getCategories(): Promise<Category[]> {
    return this.knowledgeService.getCategories();
  }

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: number): Promise<Category> {
    return this.knowledgeService.getCategoryById(id);
  }

  @Put('categories/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateCategory(@Param('id') id: number, @Body() categoryData: {
    name?: string;
    description?: string;
  }): Promise<Category> {
    return this.knowledgeService.updateCategory(id, categoryData);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCategory(@Param('id') id: number): Promise<void> {
    return this.knowledgeService.deleteCategory(id);
  }

  // 文章相关接口
  @Post('articles')
  @UseGuards(AuthGuard('jwt'))
  async createArticle(@Body() articleData: {
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
    return this.knowledgeService.createArticle(articleData);
  }

  @Get('articles')
  async getArticles(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('kind') kind: string = 'knowledge',
  ): Promise<Article[]> {
    return this.knowledgeService.getArticles(limit, offset, kind);
  }

  @Get('articles/:id')
  async getArticleById(@Param('id') id: number): Promise<Article> {
    return this.knowledgeService.getArticleById(id);
  }

  @Get('categories/:categoryId/articles')
  async getArticlesByCategoryId(
    @Param('categoryId') categoryId: number,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('kind') kind: string = 'knowledge',
  ): Promise<Article[]> {
    return this.knowledgeService.getArticlesByCategoryId(categoryId, limit, offset, kind);
  }

  @Put('articles/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateArticle(@Param('id') id: number, @Body() articleData: {
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
    return this.knowledgeService.updateArticle(id, articleData);
  }

  @Delete('articles/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteArticle(@Param('id') id: number): Promise<void> {
    return this.knowledgeService.deleteArticle(id);
  }

  @Post('articles/:id/like')
  @UseGuards(AuthGuard('jwt'))
  async likeArticle(@Param('id') id: number): Promise<Article> {
    return this.knowledgeService.likeArticle(id);
  }

  @Post('articles/:id/favorite')
  @UseGuards(AuthGuard('jwt'))
  async favoriteArticle(@Param('id') id: number): Promise<Article> {
    return this.knowledgeService.favoriteArticle(id);
  }

  // 搜索和推荐接口
  @Get('search')
  async searchArticles(@Query('keyword') keyword: string, @Query('limit') limit: number = 10): Promise<Article[]> {
    return this.knowledgeService.searchArticles(keyword, limit);
  }

  @Get('recommended')
  async getRecommendedArticles(@Query('limit') limit: number = 5): Promise<Article[]> {
    return this.knowledgeService.getRecommendedArticles(limit);
  }

  @Get('products/recommended')
  async getRecommendedProducts(@Query('limit') limit: number = 6): Promise<Article[]> {
    return this.knowledgeService.getRecommendedProducts(limit);
  }
}
