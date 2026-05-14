import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from './admin-jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { PRODUCT_UPLOAD_DIR, PRODUCT_UPLOAD_LIMIT, PRODUCT_UPLOAD_PUBLIC_PREFIX } from '../uploads/upload.constants';

@Controller('api/admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private saveProductCover(file: { originalname: string; buffer: Buffer }) {
    mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extname(file.originalname || '.jpg') || '.jpg'}`;
    writeFileSync(`${PRODUCT_UPLOAD_DIR}/${filename}`, file.buffer);
    return `${PRODUCT_UPLOAD_PUBLIC_PREFIX}/${filename}`;
  }

  @Get('dashboard/overview')
  async getOverview(@Req() req) {
    return this.adminService.getOverview(req.user);
  }

  @Get('dashboard/trends')
  async getTrends(@Req() req) {
    return this.adminService.getTrends(req.user);
  }

  @Get('admin-users')
  async getAdminUsers(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getAdminUsers(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Post('admin-users')
  async createAdminUser(
    @Body() body: { username: string; password: string; role: string },
    @Req() req,
  ) {
    return this.adminService.createAdminUser(body, req.user);
  }

  @Put('admin-users/:id/role')
  async updateAdminUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Req() req,
  ) {
    return this.adminService.updateAdminUserRole(Number(id), body, req.user);
  }

  @Put('admin-users/:id/status')
  async updateAdminUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    return this.adminService.updateAdminUserStatus(Number(id), body, req.user);
  }

  @Put('admin-users/:id/reset-password')
  async resetAdminUserPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
    @Req() req,
  ) {
    return this.adminService.resetAdminUserPassword(Number(id), body, req.user);
  }

  @Get('users')
  async getUsers(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getUsers(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string, @Req() req) {
    return this.adminService.getUserById(Number(id), req.user);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteUser(Number(id), req.user);
  }

  @Get('content/posts')
  async getPosts(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getPosts(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('content/posts/:id')
  async getPostById(@Param('id') id: string, @Req() req) {
    return this.adminService.getPostById(Number(id), req.user);
  }

  @Delete('content/posts/:id')
  async deletePost(@Param('id') id: string, @Req() req) {
    return this.adminService.deletePost(Number(id), req.user);
  }

  @Put('content/posts/:id/status')
  async updatePostStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    return this.adminService.updatePostStatus(Number(id), body.status, req.user);
  }

  @Get('content/comments')
  async getComments(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getComments(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('content/comments/:id')
  async getCommentById(@Param('id') id: string, @Req() req) {
    return this.adminService.getCommentById(Number(id), req.user);
  }

  @Delete('content/comments/:id')
  async deleteComment(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteComment(Number(id), req.user);
  }

  @Put('content/comments/:id/status')
  async updateCommentStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    return this.adminService.updateCommentStatus(Number(id), body.status, req.user);
  }

  @Get('content/categories')
  async getCategories(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getCategories(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('content/categories/:id')
  async getCategoryById(@Param('id') id: string, @Req() req) {
    return this.adminService.getCategoryById(Number(id), req.user);
  }

  @Post('content/categories')
  async createCategory(@Body() body: { name: string; description?: string }, @Req() req) {
    return this.adminService.createCategory(body, req.user);
  }

  @Put('content/categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @Req() req,
  ) {
    return this.adminService.updateCategory(Number(id), body, req.user);
  }

  @Delete('content/categories/:id')
  async deleteCategory(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteCategory(Number(id), req.user);
  }

  @Get('content/articles')
  async getArticles(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getArticles(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('content/articles/:id')
  async getArticleById(@Param('id') id: string, @Req() req) {
    return this.adminService.getArticleById(Number(id), req.user);
  }

  @Post('content/articles')
  async createArticle(
    @Body()
    body: {
        title: string;
        content: string;
        cover_image?: string;
        categoryId: number;
        status?: string;
        kind?: string;
        is_recommended?: boolean;
        sort_order?: number;
        recommendation_reason?: string;
        linked_product_id?: number | null;
      },
    @Req() req,
  ) {
    return this.adminService.createArticle(body, req.user);
  }

  @Put('content/articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body()
    body: {
        title?: string;
        content?: string;
        cover_image?: string;
        categoryId?: number;
        status?: string;
        kind?: string;
        is_recommended?: boolean;
        sort_order?: number;
        recommendation_reason?: string;
        linked_product_id?: number | null;
      },
    @Req() req,
  ) {
    return this.adminService.updateArticle(Number(id), body, req.user);
  }

  @Delete('content/articles/:id')
  async deleteArticle(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteArticle(Number(id), req.user);
  }

  @Get('orders')
  async getOrders(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getOrders(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string, @Req() req) {
    return this.adminService.getOrderById(Number(id), req.user);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    return this.adminService.updateOrderStatus(Number(id), body.status, req.user);
  }

  @Get('products')
  async getProducts(
    @Query('keyword') keyword: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getProducts(
      {
        keyword,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string, @Req() req) {
    return this.adminService.getProductById(Number(id), req.user);
  }

  @Post('products/cover-upload')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: PRODUCT_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('仅支持上传图片文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadProductCover(@UploadedFile() file: any, @Req() req) {
    if (!file) {
      throw new BadRequestException('请上传商品封面图');
    }
    const url = this.saveProductCover(file);
    return this.adminService.recordProductCoverUpload(url, req.user);
  }

  @Post('products')
  async createProduct(
    @Body()
    body: {
      merchant_id?: number | null;
      name: string;
      cover_image?: string;
      description?: string;
      status?: string;
      sort_order?: number;
      is_recommended?: boolean;
      skus: Array<{
        spec_name: string;
        spec_value: string;
        price: number;
        stock: number;
        status?: string;
      }>;
    },
    @Req() req,
  ) {
    return this.adminService.createProduct(body, req.user);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      cover_image?: string;
      description?: string;
      status?: string;
      sort_order?: number;
      is_recommended?: boolean;
      skus?: Array<{
        id?: number;
        spec_name: string;
        spec_value: string;
        price: number;
        stock: number;
        status?: string;
      }>;
    },
    @Req() req,
  ) {
    return this.adminService.updateProduct(Number(id), body, req.user);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteProduct(Number(id), req.user);
  }

  @Get('system/settings')
  async getSystemSettings(@Req() req) {
    return this.adminService.getSystemSettings(req.user);
  }

  @Put('system/settings/:key')
  async updateSystemSetting(
    @Param('key') key: string,
    @Body() body: { value?: string; label?: string; description?: string; group_name?: string },
    @Req() req,
  ) {
    return this.adminService.updateSystemSetting(key, body, req.user);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('keyword') keyword: string = '',
    @Query('action') action: string = '',
    @Query('resource_type') resource_type: string = '',
    @Query('admin_username') admin_username: string = '',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req,
  ) {
    return this.adminService.getAuditLogs(
      {
        keyword,
        action,
        resource_type,
        admin_username,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      req.user,
    );
  }
}
