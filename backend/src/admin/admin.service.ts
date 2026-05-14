import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource, In, ObjectLiteral, Repository } from 'typeorm';
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
import { ShopOrder } from '../shop/order.entity';
import { OrderItem } from '../shop/order-item.entity';
import { UserAddress } from '../shop/user-address.entity';
import { AdminAuditLog } from './admin-audit-log.entity';
import { AdminUser } from './admin-user.entity';
import { AdminPermission, AdminRole, getAdminPermissions, getRoleLabel, hasAdminPermission, isAdminRole } from './admin-permissions';
import { SystemSetting } from './system-setting.entity';
import { ShopService } from '../shop/shop.service';

type AdminActor = {
  adminId: number;
  username: string;
  role: string;
  account_type?: string;
  merchant_id?: number | null;
  merchant_name?: string | null;
};

type TrendDailyPoint = {
  date: string;
  users: number;
  pets: number;
  posts: number;
  bookings: number;
  articles: number;
};

const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: 'knowledge_products_enabled',
    value: 'true',
    label: '用品推荐展示',
    group_name: 'knowledge',
    description: '控制用户端知识页是否展示用品推荐板块。',
  },
  {
    key: 'knowledge_recommendation_title',
    value: '用品推荐与护理要点',
    label: '用品推荐标题',
    group_name: 'knowledge',
    description: '用户端知识页用品推荐区域标题。',
  },
  {
    key: 'ai_shortcuts_enabled',
    value: 'true',
    label: 'AI 快捷问题',
    group_name: 'ai',
    description: '控制 AI 页面是否展示快捷问题模板。',
  },
  {
    key: 'community_booking_enabled',
    value: 'true',
    label: '社区预约功能',
    group_name: 'community',
    description: '控制用户端社区页是否展示预约服务入口。',
  },
];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
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
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ShopOrder)
    private orderRepository: Repository<ShopOrder>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(UserAddress)
    private userAddressRepository: Repository<UserAddress>,
    @InjectRepository(AdminAuditLog)
    private adminAuditLogRepository: Repository<AdminAuditLog>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    private shopService: ShopService,
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

  private buildPaging(params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));

    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    };
  }

  private formatAdminSummary(adminUser: AdminUser) {
    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      role_label: getRoleLabel(adminUser.role),
      permissions: getAdminPermissions(adminUser.role),
      status: adminUser.status,
      account_type: adminUser.account_type || 'platform',
      merchant_id: adminUser.merchant_id ?? null,
      merchant_name: adminUser.merchant?.name || null,
      last_login_at: adminUser.last_login_at,
      created_at: adminUser.created_at,
      updated_at: adminUser.updated_at,
    };
  }

  private assertPermission(actor: AdminActor, permission: AdminPermission) {
    if (!hasAdminPermission(actor.role, permission)) {
      throw new ForbiddenException('当前管理员角色无权执行该操作');
    }
  }

  private ensureRole(role: string): AdminRole {
    if (!isAdminRole(role)) {
      throw new BadRequestException('管理员角色不合法');
    }
    return role;
  }

  private async logAdminAction(
    actor: AdminActor,
    action: string,
    resourceType: string,
    resourceId?: string | number | null,
    detail?: string,
  ) {
    await this.adminAuditLogRepository.save(
      this.adminAuditLogRepository.create({
        admin_id: actor.adminId,
        admin_username: actor.username,
        admin_role: actor.role,
        action,
        resource_type: resourceType,
        resource_id: resourceId != null ? String(resourceId) : null,
        detail: detail || null,
      }),
    );
  }

  private async ensureDefaultSystemSettings() {
    for (const item of DEFAULT_SYSTEM_SETTINGS) {
      const existing = await this.systemSettingRepository.findOne({
        where: { key: item.key },
      });
      if (!existing) {
        await this.systemSettingRepository.save(
          this.systemSettingRepository.create(item),
        );
      }
    }
  }

  private formatSetting(setting: SystemSetting) {
    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      label: setting.label,
      group_name: setting.group_name,
      description: setting.description,
      created_at: setting.created_at,
      updated_at: setting.updated_at,
    };
  }

  private async countCreatedSince<T extends { created_at?: Date; createdAt?: Date }>(
    repository: Repository<T>,
    field: 'created_at' | 'createdAt',
    since: Date,
  ) {
    return repository
      .createQueryBuilder('item')
      .where(`item.${field} >= :since`, { since: since.toISOString() })
      .getCount();
  }

  private formatDateKey(value?: string | Date | null) {
    if (!value) {
      return '';
    }

    const normalizedDate = new Date(value);
    if (Number.isNaN(normalizedDate.getTime())) {
      return '';
    }

    return normalizedDate.toISOString().slice(0, 10);
  }

  private buildDateKeys(rangeDays: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const keys: string[] = [];
    for (let offset = rangeDays - 1; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      keys.push(date.toISOString().slice(0, 10));
    }

    return keys;
  }

  private async getCreatedDateKeys<T extends ObjectLiteral>(
    repository: Repository<T>,
    field: 'created_at' | 'createdAt',
    since: Date,
  ) {
    const rows = await repository
      .createQueryBuilder('item')
      .select(`item.${field}`, 'createdAt')
      .where(`item.${field} >= :since`, { since: since.toISOString() })
      .getRawMany<{ createdAt: string | Date }>();

    return rows
      .map((row) => this.formatDateKey(row.createdAt))
      .filter(Boolean);
  }

  private buildCounterMap(keys: string[]) {
    return keys.reduce((accumulator, key) => {
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {} as Record<string, number>);
  }

  private async buildTrendSnapshot(rangeDays: number) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (rangeDays - 1));

    const [userDates, petDates, postDates, bookingDates, articleDates] = await Promise.all([
      this.getCreatedDateKeys(this.userRepository, 'created_at', startDate),
      this.getCreatedDateKeys(this.petRepository, 'created_at', startDate),
      this.getCreatedDateKeys(this.postRepository, 'created_at', startDate),
      this.getCreatedDateKeys(this.bookingRepository, 'createdAt', startDate),
      this.getCreatedDateKeys(this.articleRepository, 'created_at', startDate),
    ]);

    const userCounter = this.buildCounterMap(userDates);
    const petCounter = this.buildCounterMap(petDates);
    const postCounter = this.buildCounterMap(postDates);
    const bookingCounter = this.buildCounterMap(bookingDates);
    const articleCounter = this.buildCounterMap(articleDates);

    const daily = this.buildDateKeys(rangeDays).map((date) => ({
      date,
      users: userCounter[date] || 0,
      pets: petCounter[date] || 0,
      posts: postCounter[date] || 0,
      bookings: bookingCounter[date] || 0,
      articles: articleCounter[date] || 0,
    })) satisfies TrendDailyPoint[];

    return {
      rangeDays,
      daily,
      totals: daily.reduce(
        (accumulator, item) => ({
          users: accumulator.users + item.users,
          pets: accumulator.pets + item.pets,
          posts: accumulator.posts + item.posts,
          bookings: accumulator.bookings + item.bookings,
          articles: accumulator.articles + item.articles,
        }),
        {
          users: 0,
          pets: 0,
          posts: 0,
          bookings: 0,
          articles: 0,
        },
      ),
    };
  }

  async getAdminUsers(
    params: { keyword?: string; page: number; pageSize: number },
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'admin_users:view');
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.adminUserRepository
      .createQueryBuilder('admin_user')
      .leftJoinAndSelect('admin_user.merchant', 'merchant');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where('admin_user.username LIKE :keyword', { keyword });
    }

    const [items, total] = await queryBuilder
      .orderBy('admin_user.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.formatAdminSummary(item)),
      total,
      page,
      pageSize,
    };
  }

  async createAdminUser(
    data: { username: string; password: string; role: string },
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'admin_users:create');
    const username = data.username?.trim();
    const password = data.password?.trim();
    if (!username || !password) {
      throw new BadRequestException('用户名和密码不能为空');
    }

    const role = this.ensureRole(data.role);
    const existing = await this.adminUserRepository.findOne({
      where: { username },
    });
    if (existing) {
      throw new BadRequestException('管理员用户名已存在');
    }

    const saved = await this.adminUserRepository.save(
      this.adminUserRepository.create({
        username,
        password: await bcrypt.hash(password, 10),
        role,
        status: 'active',
        account_type: 'platform',
        merchant_id: null,
      }),
    );

    await this.logAdminAction(actor, 'create_admin_user', 'admin_user', saved.id, `${saved.username} (${saved.role})`);

    return this.formatAdminSummary(saved);
  }

  async updateAdminUserRole(id: number, data: { role: string }, actor: AdminActor) {
    this.assertPermission(actor, 'admin_users:update_role');
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });
    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }
    if (actor.adminId === id) {
      throw new BadRequestException('不能修改当前登录管理员自己的角色');
    }

    const role = this.ensureRole(data.role);
    adminUser.role = role;
    const saved = await this.adminUserRepository.save(adminUser);
    await this.logAdminAction(actor, 'update_admin_role', 'admin_user', id, `${saved.username} -> ${saved.role}`);
    return this.formatAdminSummary(saved);
  }

  async updateAdminUserStatus(id: number, data: { status: string }, actor: AdminActor) {
    this.assertPermission(actor, 'admin_users:update_status');
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });
    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }
    if (actor.adminId === id) {
      throw new BadRequestException('不能停用当前登录管理员自己');
    }
    if (!['active', 'disabled'].includes(data.status)) {
      throw new BadRequestException('管理员状态不合法');
    }

    adminUser.status = data.status;
    const saved = await this.adminUserRepository.save(adminUser);
    await this.logAdminAction(actor, 'update_admin_status', 'admin_user', id, `${saved.username} -> ${saved.status}`);
    return this.formatAdminSummary(saved);
  }

  async resetAdminUserPassword(id: number, data: { password: string }, actor: AdminActor) {
    this.assertPermission(actor, 'admin_users:reset_password');
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });
    if (!adminUser) {
      throw new NotFoundException('管理员不存在');
    }

    const password = data.password?.trim();
    if (!password) {
      throw new BadRequestException('新密码不能为空');
    }

    adminUser.password = await bcrypt.hash(password, 10);
    await this.adminUserRepository.save(adminUser);
    await this.logAdminAction(actor, 'reset_admin_password', 'admin_user', id, adminUser.username);

    return { message: '管理员密码已重置' };
  }

  async getOverview(actor: AdminActor) {
    this.assertPermission(actor, 'dashboard:view');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalPets,
      totalVaccinations,
      totalDewormings,
      totalCheckups,
      totalCares,
      totalPosts,
      totalComments,
      totalBookings,
      totalArticles,
      totalCategories,
      recentUsers,
      recentPosts,
      recentBookings,
      recentArticles,
    ] = await Promise.all([
      this.userRepository.count(),
      this.petRepository.count(),
      this.vaccinationRepository.count(),
      this.dewormingRepository.count(),
      this.checkupRepository.count(),
      this.careRepository.count(),
      this.postRepository.count(),
      this.commentRepository.count(),
      this.bookingRepository.count(),
      this.articleRepository.count(),
      this.categoryRepository.count(),
      this.countCreatedSince(this.userRepository, 'created_at', sevenDaysAgo),
      this.countCreatedSince(this.postRepository, 'created_at', sevenDaysAgo),
      this.countCreatedSince(this.bookingRepository, 'createdAt', sevenDaysAgo),
      this.countCreatedSince(this.articleRepository, 'created_at', sevenDaysAgo),
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
      totalBookings,
      totalArticles,
      totalCategories,
      recentMetrics: {
        recentUsers,
        recentPosts,
        recentBookings,
        recentArticles,
      },
    };
  }

  async getTrends(actor: AdminActor) {
    this.assertPermission(actor, 'dashboard:view');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [last7Days, last30Days, recentComments] = await Promise.all([
      this.buildTrendSnapshot(7),
      this.buildTrendSnapshot(30),
      this.countCreatedSince(this.commentRepository, 'created_at', sevenDaysAgo),
    ]);

    return {
      last7Days,
      last30Days,
      recentActivity: {
        periodDays: 7,
        posts: last7Days.totals.posts,
        comments: recentComments,
        bookings: last7Days.totals.bookings,
      },
    };
  }

  async getUsers(params: {
    keyword?: string;
    page: number;
    pageSize: number;
  }, actor: AdminActor) {
    this.assertPermission(actor, 'users:view');
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

  async getUserById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'users:view');
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

  async deleteUser(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'users:delete');
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
      const userOrders = await manager.find(ShopOrder, {
        where: { user_id: id },
        select: ['id'],
      });
      const orderIds = userOrders.map((order) => order.id);
      if (orderIds.length > 0) {
        await manager.delete(OrderItem, { order_id: In(orderIds) });
        await manager.delete(ShopOrder, { id: In(orderIds) });
      }
      await manager.delete(UserAddress, { user_id: id });
      await manager
        .createQueryBuilder()
        .delete()
        .from(Booking)
        .where('userId = :userId', { userId: id })
        .execute();
      await manager.delete(User, { id });
    });

    await this.logAdminAction(actor, 'delete_user', 'user', id, `删除用户 ${user.nickname}`);

    return {
      message: '用户删除成功',
    };
  }

  async getPosts(params: { keyword?: string; page: number; pageSize: number }, actor: AdminActor) {
    this.assertPermission(actor, 'posts:view');
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
        status: post.status,
        created_at: post.created_at,
        author: this.toUserSummary(post.user),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getPostById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'posts:view');
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
      status: post.status,
      created_at: post.created_at,
      author: this.toUserSummary(post.user),
      commentList: post.commentList.map((comment) => ({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        created_at: comment.created_at,
        author: this.toUserSummary(comment.user),
      })),
    };
  }

  async updatePostStatus(id: number, status: string, actor: AdminActor) {
    this.assertPermission(actor, 'posts:review');
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }
    post.status = status;
    const saved = await this.postRepository.save(post);
    await this.logAdminAction(actor, 'update_post_status', 'post', id, `状态更新为 ${status}`);
    return saved;
  }

  async deletePost(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'posts:delete');
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    await this.commentRepository.delete({ post_id: id });
    await this.postRepository.delete(id);
    await this.logAdminAction(actor, 'delete_post', 'post', id, post.title);

    return { message: '帖子删除成功' };
  }

  async getComments(params: { keyword?: string; page: number; pageSize: number }, actor: AdminActor) {
    this.assertPermission(actor, 'comments:view');
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
        status: comment.status,
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

  async getCommentById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'comments:view');
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
      status: comment.status,
      created_at: comment.created_at,
      author: this.toUserSummary(comment.user),
      post: comment.post
        ? {
            id: comment.post.id,
            title: comment.post.title,
            content: comment.post.content,
            status: comment.post.status,
            author: comment.post.user ? this.toUserSummary(comment.post.user) : null,
          }
        : null,
    };
  }

  async updateCommentStatus(id: number, status: string, actor: AdminActor) {
    this.assertPermission(actor, 'comments:review');
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    comment.status = status;
    const saved = await this.commentRepository.save(comment);
    await this.logAdminAction(actor, 'update_comment_status', 'comment', id, `状态更新为 ${status}`);
    return saved;
  }

  async deleteComment(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'comments:delete');
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
    await this.logAdminAction(actor, 'delete_comment', 'comment', id, comment.content.slice(0, 80));
    return { message: '评论删除成功' };
  }

  async getCategories(params: { keyword?: string; page: number; pageSize: number }, actor: AdminActor) {
    this.assertPermission(actor, 'categories:view');
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

  async getCategoryById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'categories:view');
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
        status: article.status,
        kind: article.kind,
        views: article.views,
        likes: article.likes,
        favorites: article.favorites,
      })),
    };
  }

  async createCategory(data: { name: string; description?: string }, actor: AdminActor) {
    this.assertPermission(actor, 'categories:create');
    const category = this.categoryRepository.create(data);
    const saved = await this.categoryRepository.save(category);
    await this.logAdminAction(actor, 'create_category', 'category', saved.id, saved.name);
    return saved;
  }

  async updateCategory(id: number, data: { name?: string; description?: string }, actor: AdminActor) {
    this.assertPermission(actor, 'categories:update');
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    Object.assign(category, data);
    const saved = await this.categoryRepository.save(category);
    await this.logAdminAction(actor, 'update_category', 'category', id, saved.name);
    return saved;
  }

  async deleteCategory(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'categories:delete');
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
    await this.logAdminAction(actor, 'delete_category', 'category', id, category.name);
    return { message: '分类删除成功' };
  }

  async getArticles(params: { keyword?: string; page: number; pageSize: number }, actor: AdminActor) {
    this.assertPermission(actor, 'articles:view');
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.linked_product', 'linked_product');

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
      .orderBy('article.sort_order', 'DESC')
      .addOrderBy('article.created_at', 'DESC')
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
        status: article.status,
        kind: article.kind,
        is_recommended: article.is_recommended,
        sort_order: article.sort_order,
        recommendation_reason: article.recommendation_reason,
        linked_product_id: article.linked_product_id,
        linked_product: article.linked_product
          ? {
              id: article.linked_product.id,
              name: article.linked_product.name,
            }
          : null,
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

  async getArticleById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'articles:view');
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'linked_product'],
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
      status: article.status,
      kind: article.kind,
      is_recommended: article.is_recommended,
      sort_order: article.sort_order,
      recommendation_reason: article.recommendation_reason,
      linked_product_id: article.linked_product_id,
      linked_product: article.linked_product
        ? {
            id: article.linked_product.id,
            name: article.linked_product.name,
          }
        : null,
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

  async createArticle(
    data: {
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
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'articles:create');
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
      status: data.status || 'published',
      kind: data.kind || 'knowledge',
      is_recommended: Boolean(data.is_recommended),
      sort_order: Number(data.sort_order) || 0,
      recommendation_reason: data.recommendation_reason || null,
      linked_product_id: data.linked_product_id || null,
    });

    const saved = await this.articleRepository.save(article);
    await this.logAdminAction(actor, 'create_article', 'article', saved.id, saved.title);
    return saved;
  }

  async updateArticle(
    id: number,
    data: {
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
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'articles:update');
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'linked_product'],
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

    if (data.title !== undefined) article.title = data.title;
    if (data.content !== undefined) article.content = data.content;
    if (data.cover_image !== undefined) article.cover_image = data.cover_image;
    if (data.status !== undefined) article.status = data.status;
    if (data.kind !== undefined) article.kind = data.kind;
    if (data.is_recommended !== undefined) article.is_recommended = Boolean(data.is_recommended);
    if (data.sort_order !== undefined) article.sort_order = Number(data.sort_order) || 0;
    if (data.recommendation_reason !== undefined) {
      article.recommendation_reason = data.recommendation_reason || null;
    }
    if (data.linked_product_id !== undefined) {
      article.linked_product_id = data.linked_product_id || null;
    }

    const saved = await this.articleRepository.save(article);
    await this.logAdminAction(actor, 'update_article', 'article', id, saved.title);
    return saved;
  }

  async deleteArticle(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'articles:delete');
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    await this.articleRepository.delete(id);
    await this.logAdminAction(actor, 'delete_article', 'article', id, article.title);
    return { message: '文章删除成功' };
  }

  async getOrders(
    params: { keyword?: string; page: number; pageSize: number },
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'orders:view');
    return this.shopService.getAdminOrders(params, actor);
  }

  async getOrderById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'orders:view');
    return this.shopService.getAdminOrderById(id, actor);
  }

  async updateOrderStatus(id: number, status: string, actor: AdminActor) {
    this.assertPermission(actor, 'orders:update_status');
    const result = await this.shopService.updateAdminOrderStatus(id, status, actor);
    await this.logAdminAction(actor, 'update_order_status', 'order', id, `订单状态更新为 ${status}`);
    return result;
  }

  async getProducts(
    params: { keyword?: string; page: number; pageSize: number },
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'products:view');
    return this.shopService.getAdminProducts(params, actor);
  }

  async getProductById(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'products:view');
    return this.shopService.getAdminProductById(id, actor);
  }

  async createProduct(
    data: {
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
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'products:create');
    const product = await this.shopService.createAdminProduct(data, actor);
    await this.logAdminAction(actor, 'create_product', 'product', product.id, product.name);
    return product;
  }

  async updateProduct(
    id: number,
    data: {
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
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'products:update');
    const product = await this.shopService.updateAdminProduct(id, data, actor);
    await this.logAdminAction(actor, 'update_product', 'product', id, product.name);
    return product;
  }

  async deleteProduct(id: number, actor: AdminActor) {
    this.assertPermission(actor, 'products:delete');
    const result = await this.shopService.deleteAdminProduct(id, actor);
    await this.logAdminAction(actor, 'delete_product', 'product', id, `删除商品 ${id}`);
    return result;
  }

  async getSystemSettings(actor: AdminActor) {
    this.assertPermission(actor, 'settings:view');
    await this.ensureDefaultSystemSettings();
    const settings = await this.systemSettingRepository.find({
      order: {
        group_name: 'ASC',
        key: 'ASC',
      },
    });
    return settings.map((item) => this.formatSetting(item));
  }

  async updateSystemSetting(
    key: string,
    data: { value?: string; label?: string; description?: string; group_name?: string },
    actor: AdminActor,
  ) {
    this.assertPermission(actor, 'settings:update');
    await this.ensureDefaultSystemSettings();
    const setting = await this.systemSettingRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException('配置项不存在');
    }

    if (data.value !== undefined) setting.value = data.value;
    if (data.label !== undefined) setting.label = data.label;
    if (data.description !== undefined) setting.description = data.description;
    if (data.group_name !== undefined) setting.group_name = data.group_name;

    const saved = await this.systemSettingRepository.save(setting);
    await this.logAdminAction(actor, 'update_setting', 'system_setting', saved.key, saved.value || '');
    return this.formatSetting(saved);
  }

  async getAuditLogs(params: {
    keyword?: string;
    action?: string;
    resource_type?: string;
    admin_username?: string;
    page: number;
    pageSize: number;
  }, actor: AdminActor) {
    this.assertPermission(actor, 'audit_logs:view');
    const { page, pageSize, skip } = this.buildPaging(params);
    const queryBuilder = this.adminAuditLogRepository.createQueryBuilder('log');

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('log.admin_username LIKE :keyword', { keyword })
            .orWhere('log.action LIKE :keyword', { keyword })
            .orWhere('log.resource_type LIKE :keyword', { keyword })
            .orWhere('log.detail LIKE :keyword', { keyword });
        }),
      );
    }

    if (params.action?.trim()) {
      queryBuilder.andWhere('log.action = :action', { action: params.action.trim() });
    }

    if (params.resource_type?.trim()) {
      queryBuilder.andWhere('log.resource_type = :resourceType', {
        resourceType: params.resource_type.trim(),
      });
    }

    if (params.admin_username?.trim()) {
      queryBuilder.andWhere('log.admin_username = :adminUsername', {
        adminUsername: params.admin_username.trim(),
      });
    }

    const [items, total] = await queryBuilder
      .orderBy('log.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
