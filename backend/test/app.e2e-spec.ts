import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Repository } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Post } from '../src/community/post.entity';
import { Comment } from '../src/community/comment.entity';

const superAdminUsername = 'super-admin-e2e';
const superAdminPassword = 'super-admin-pass';
const contentAdminUsername = 'content-admin-e2e';
const contentAdminPassword = 'content-admin-pass';
const sqljsLocation = join(tmpdir(), `pet-assistant-e2e-${Date.now()}.sqlite`);

process.env.DB_TYPE = 'sqljs';
process.env.SQLJS_LOCATION = sqljsLocation;
process.env.ADMIN_USERNAME = superAdminUsername;
process.env.ADMIN_PASSWORD = superAdminPassword;
process.env.CONTENT_ADMIN_USERNAME = contentAdminUsername;
process.env.CONTENT_ADMIN_PASSWORD = contentAdminPassword;
process.env.JWT_SECRET = 'pet-assistant-e2e-secret';
process.env.ADMIN_JWT_SECRET = 'pet-assistant-e2e-admin-secret';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../src/app.module');

describe('P2 delivery e2e', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;

  let seededUserId = 0;
  let seededPostId = 0;
  let seededCommentId = 0;
  let createdCategoryId = 0;
  let createdArticleId = 0;
  let viewerAdminToken = '';
  let superAdminToken = '';
  let contentAdminToken = '';

  beforeAll(async () => {
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    postRepository = moduleFixture.get(getRepositoryToken(Post));
    commentRepository = moduleFixture.get(getRepositoryToken(Comment));

    const seededUser = await userRepository.save(
      userRepository.create({
        phone: '13900000001',
        password: 'plain-password',
        nickname: '审核用用户',
      }),
    );
    seededUserId = seededUser.id;

    const seededPost = await postRepository.save(
      postRepository.create({
        user_id: seededUser.id,
        user: seededUser,
        title: '待审核帖子',
        content: '这是一条待审核帖子内容',
        images: [],
        likes: 0,
        comments: 1,
        status: 'pending',
      }),
    );
    seededPostId = seededPost.id;

    const seededComment = await commentRepository.save(
      commentRepository.create({
        post_id: seededPost.id,
        post: seededPost,
        user_id: seededUser.id,
        user: seededUser,
        content: '这是一条待审核评论',
        status: 'pending',
      }),
    );
    seededCommentId = seededComment.id;
  });

  afterAll(async () => {
    await app?.close();
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});
  });

  const loginAdmin = async (username: string, password: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ username, password })
      .expect(201);

    return response.body;
  };

  it('GET / and GET /health should respond normally', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.databaseType).toBe('sqljs');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('should login both admin roles and expose role in profile', async () => {
    const superAdminLogin = await loginAdmin(superAdminUsername, superAdminPassword);
    const contentAdminLogin = await loginAdmin(contentAdminUsername, contentAdminPassword);

    superAdminToken = superAdminLogin.token;
    contentAdminToken = contentAdminLogin.token;

    expect(superAdminLogin.admin.role).toBe('super_admin');
    expect(contentAdminLogin.admin.role).toBe('content_admin');
    expect(superAdminLogin.admin.permissions).toContain('admin_users:create');
    expect(contentAdminLogin.admin.permissions).toContain('posts:review');
    expect(contentAdminLogin.admin.permissions).not.toContain('settings:update');

    const profileResponse = await request(app.getHttpServer())
      .get('/api/admin/auth/profile')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(200);

    expect(profileResponse.body.admin.role).toBe('content_admin');
    expect(profileResponse.body.admin.permissions).toContain('audit_logs:view');
  });

  it('content admin should audit content and be blocked from dangerous actions', async () => {
    const postStatusResponse = await request(app.getHttpServer())
      .put(`/api/admin/content/posts/${seededPostId}/status`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .send({ status: 'approved' })
      .expect(200);
    expect(postStatusResponse.body.status).toBe('approved');

    const commentStatusResponse = await request(app.getHttpServer())
      .put(`/api/admin/content/comments/${seededCommentId}/status`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .send({ status: 'approved' })
      .expect(200);
    expect(commentStatusResponse.body.status).toBe('approved');

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/admin/content/categories')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .send({
        name: '内容管理员分类',
        description: '用于内容管理员权限验证',
      })
      .expect(201);
    createdCategoryId = categoryResponse.body.id;

    const articleResponse = await request(app.getHttpServer())
      .post('/api/admin/content/articles')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .send({
        title: '内容管理员文章',
        content: '这是一篇由内容管理员创建的文章',
        categoryId: createdCategoryId,
        status: 'published',
        kind: 'knowledge',
        is_recommended: true,
        sort_order: 3,
        recommendation_reason: '适合答辩展示',
      })
      .expect(201);
    createdArticleId = articleResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/api/admin/content/posts/${seededPostId}`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/content/comments/${seededCommentId}`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/content/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/content/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .put('/api/admin/system/settings/ai_shortcuts_enabled')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .send({ value: 'false' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/users/${seededUserId}`)
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/admin/admin-users')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .expect(403);

    const auditResponse = await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${contentAdminToken}`)
      .query({
        admin_username: contentAdminUsername,
        action: 'update_post_status',
        resource_type: 'post',
      })
      .expect(200);

    expect(auditResponse.body.items.length).toBeGreaterThan(0);
  });

  it('super admin should manage settings, trends, audit filters and dangerous deletes', async () => {
    const settingResponse = await request(app.getHttpServer())
      .put('/api/admin/system/settings/ai_shortcuts_enabled')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ value: 'false' })
      .expect(200);
    expect(settingResponse.body.value).toBe('false');

    const trendsResponse = await request(app.getHttpServer())
      .get('/api/admin/dashboard/trends')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(trendsResponse.body.last7Days.daily).toHaveLength(7);
    expect(trendsResponse.body.last30Days.daily).toHaveLength(30);
    expect(typeof trendsResponse.body.recentActivity.posts).toBe('number');
    expect(typeof trendsResponse.body.last7Days.totals.users).toBe('number');

    const auditResponse = await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .query({
        admin_username: superAdminUsername,
        action: 'update_setting',
        resource_type: 'system_setting',
      })
      .expect(200);

    expect(auditResponse.body.items.length).toBeGreaterThan(0);

    const createdAdminResponse = await request(app.getHttpServer())
      .post('/api/admin/admin-users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: 'viewer-admin-e2e',
        password: 'viewer-admin-pass',
        role: 'viewer_admin',
      })
      .expect(201);

    expect(createdAdminResponse.body.role).toBe('viewer_admin');
    expect(createdAdminResponse.body.permissions).toContain('admin_users:view');

    const adminListResponse = await request(app.getHttpServer())
      .get('/api/admin/admin-users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const viewerAdmin = adminListResponse.body.items.find((item) => item.username === 'viewer-admin-e2e');
    expect(viewerAdmin).toBeDefined();

    await request(app.getHttpServer())
      .put(`/api/admin/admin-users/${viewerAdmin.id}/reset-password`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ password: 'viewer-admin-pass-2' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/admin-users/${viewerAdmin.id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'disabled' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ username: 'viewer-admin-e2e', password: 'viewer-admin-pass-2' })
      .expect(409);

    await request(app.getHttpServer())
      .put(`/api/admin/admin-users/${viewerAdmin.id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'active' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/admin-users/${viewerAdmin.id}/role`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'viewer_admin' })
      .expect(200);

    const viewerLogin = await loginAdmin('viewer-admin-e2e', 'viewer-admin-pass-2');
    viewerAdminToken = viewerLogin.token;
    expect(viewerLogin.admin.permissions).toContain('dashboard:view');
    expect(viewerLogin.admin.permissions).not.toContain('posts:review');

    await request(app.getHttpServer())
      .get('/api/admin/admin-users')
      .set('Authorization', `Bearer ${viewerAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/admin/system/settings/ai_shortcuts_enabled')
      .set('Authorization', `Bearer ${viewerAdminToken}`)
      .send({ value: 'true' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/admin/content/articles/${createdArticleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/admin/content/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const removableUser = await userRepository.save(
      userRepository.create({
        phone: '13900000002',
        password: 'plain-password',
        nickname: '待删除用户',
      }),
    );

    await request(app.getHttpServer())
      .delete(`/api/admin/users/${removableUser.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
  });
});
