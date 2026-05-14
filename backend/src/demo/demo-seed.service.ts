import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { Booking } from '../community/booking.entity';
import { Category } from '../knowledge/category.entity';
import { Article } from '../knowledge/article.entity';
import { Merchant } from '../shop/merchant.entity';
import { Product } from '../shop/product.entity';
import { ProductSku } from '../shop/product-sku.entity';
import { UserAddress } from '../shop/user-address.entity';
import { ShopOrder } from '../shop/order.entity';
import { OrderItem } from '../shop/order-item.entity';
import { AdminUser } from '../admin/admin-user.entity';

const DEMO_USER = {
  phone: '13900009999',
  password: 'demo123456',
  nickname: '答辩演示用户',
  email: 'demo.user@pet.local',
  avatar: '/uploads/demo/user-avatar.png',
};

const DEMO_PETS = [
  {
    name: '可乐',
    species: '狗',
    breed: '柯基犬',
    gender: 'male' as const,
    birthday: '2022-04-18',
    sterilized: false,
    avatar: '/uploads/demo/dog-avatar.png',
  },
  {
    name: '奶糖',
    species: '猫',
    breed: '英短',
    gender: 'female' as const,
    birthday: '2023-02-08',
    sterilized: true,
    avatar: '/uploads/demo/cat-avatar.png',
  },
];

const DEMO_CATEGORIES = [
  { name: '宠物健康管理', description: '用于展示疫苗、驱虫、体检和日常健康知识。' },
  { name: '日常护理技巧', description: '用于展示喂食、遛狗、清洁和陪伴护理内容。' },
  { name: '宠物用品推荐', description: '用于展示答辩中的用品推荐和选购理由。' },
];

const DEMO_POST_IMAGES = {
  walking: '/uploads/demo/real-final/community-walking.jpg',
  checkup: '/uploads/demo/real-final/community-checkup.jpg',
  supplies: '/uploads/demo/real-final/community-supplies.jpg',
};

const DEMO_ARTICLE_IMAGES = {
  vaccine: '/uploads/demo/real-final/article-vaccine.jpg',
  deworming: '/uploads/demo/real-final/article-deworming.jpg',
  carePlan: '/uploads/demo/real-final/article-care-plan.jpg',
  ocr: '/uploads/demo/real-final/article-ocr.jpg',
  bowl: '/uploads/demo/real-final/product-water-bowl.jpg',
  folder: '/uploads/demo/real-final/product-record-folder.jpg',
  board: '/uploads/demo/real-final/product-reminder-board.jpg',
};

const DEMO_MERCHANTS = [
  {
    name: '宠物生活馆',
    contact_name: '陈店长',
    contact_phone: '13800001111',
  },
  {
    name: '健康护理实验室',
    contact_name: '林顾问',
    contact_phone: '13800002222',
  },
];

const DEMO_BOOKINGS = [
  {
    serviceType: 'hospital',
    serviceName: '安心宠物门诊年度复查',
    serviceAddress: '上海市徐汇区演示路 18 号',
    bookingDateOffset: 3,
    bookingTime: '10:00',
    status: 'pending',
    notes: '用于展示待确认状态和后台统计。',
  },
  {
    serviceType: 'hospital',
    serviceName: '友宠动物医院疫苗加强针',
    serviceAddress: '上海市长宁区虹桥路 220 号',
    bookingDateOffset: 6,
    bookingTime: '14:30',
    status: 'confirmed',
    notes: '用于展示已确认状态和可选时间段。',
  },
  {
    serviceType: 'grooming',
    serviceName: '尾巴星球洗护美容',
    serviceAddress: '上海市静安区安远路 66 号',
    bookingDateOffset: 9,
    bookingTime: '11:30',
    status: 'completed',
    notes: '用于展示洗护预约完成后的历史记录。',
  },
];

@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Pet) private readonly petRepository: Repository<Pet>,
    @InjectRepository(Vaccination)
    private readonly vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Deworming)
    private readonly dewormingRepository: Repository<Deworming>,
    @InjectRepository(Checkup)
    private readonly checkupRepository: Repository<Checkup>,
    @InjectRepository(Care) private readonly careRepository: Repository<Care>,
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
    @InjectRepository(Merchant) private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSku) private readonly productSkuRepository: Repository<ProductSku>,
    @InjectRepository(UserAddress) private readonly userAddressRepository: Repository<UserAddress>,
    @InjectRepository(ShopOrder) private readonly orderRepository: Repository<ShopOrder>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(AdminUser) private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  async onModuleInit() {
    if (!this.shouldAutoSeed()) {
      return;
    }

    await this.seedDemoData();
  }

  private shouldAutoSeed() {
    if (process.env.npm_lifecycle_event !== 'start:dev') {
      return false;
    }

    const explicitFlag = process.env.DEMO_SEED_ENABLED?.trim().toLowerCase();
    if (explicitFlag) {
      return !['0', 'false', 'off', 'no'].includes(explicitFlag);
    }

    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    return process.env.npm_lifecycle_event === 'start:dev';
  }

  async seedDemoData() {
    const demoUser = await this.ensureDemoUser();
    const pets = await this.ensureDemoPets(demoUser);
    await this.ensureHealthRecords(pets);
    await this.ensureCarePlans(pets);
    await this.ensureCommunityContent(demoUser);
    const commerceData = await this.ensureCommerceData(demoUser);
    await this.ensureKnowledgeContent(commerceData.productsByKey);
    await this.ensureMerchantAdminAccounts(commerceData.merchantsByName);

    this.logger.log(`demo seed ready for ${DEMO_USER.phone}`);
  }

  private async ensureDemoUser() {
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
    let user = await this.userRepository.findOne({
      where: { phone: DEMO_USER.phone },
    });

    if (!user) {
      user = this.userRepository.create({
        phone: DEMO_USER.phone,
        password: hashedPassword,
        nickname: DEMO_USER.nickname,
        email: DEMO_USER.email,
        avatar: DEMO_USER.avatar,
      });
      return this.userRepository.save(user);
    }

    user.password = hashedPassword;
    user.nickname = DEMO_USER.nickname;
    user.email = DEMO_USER.email;
    user.avatar = DEMO_USER.avatar;
    return this.userRepository.save(user);
  }

  private async ensureDemoPets(user: User) {
    const pets: Pet[] = [];

    for (const item of DEMO_PETS) {
      let pet = await this.petRepository.findOne({
        where: {
          user_id: user.id,
          name: item.name,
        },
      });

      if (!pet) {
        pet = this.petRepository.create({
          ...item,
          birthday: new Date(item.birthday),
          user_id: user.id,
          user,
        });
      } else {
        Object.assign(pet, {
          ...item,
          birthday: new Date(item.birthday),
        });
      }

      pets.push(await this.petRepository.save(pet));
    }

    return pets;
  }

  private async ensureHealthRecords(pets: Pet[]) {
    const [dog, cat] = pets;

    await this.ensureVaccination({
      pet: dog,
      vaccine_name: '犬四联疫苗',
      vaccination_date: '2025-02-16',
      next_date: '2026-02-16',
      hospital: '友宠动物医院',
      doctor: '王医生',
      record_image_url: '/uploads/demo/medical-record.png',
      notes: '用于演示 OCR 回填后的手动确认结果。',
    });

    await this.ensureVaccination({
      pet: cat,
      vaccine_name: '猫三联疫苗',
      vaccination_date: '2025-03-09',
      next_date: '2026-03-09',
      hospital: '安心宠物门诊',
      doctor: '李医生',
      record_image_url: '/uploads/demo/medical-record.png',
      notes: '答辩展示用记录，带机构与医生信息。',
    });

    await this.ensureDeworming({
      pet: dog,
      type: 'both',
      product_name: '拜宠清',
      deworming_date: '2025-04-02',
      next_date: '2025-07-02',
      hospital: '友宠动物医院',
      doctor: '王医生',
      record_image_url: '/uploads/demo/medical-record.png',
      notes: '体内外驱虫一体化记录示例。',
    });

    await this.ensureDeworming({
      pet: cat,
      type: 'internal',
      product_name: '海乐妙',
      deworming_date: '2025-04-15',
      next_date: '2025-07-15',
      hospital: '安心宠物门诊',
      doctor: '周医生',
      record_image_url: '/uploads/demo/medical-record.png',
      notes: '用于演示驱虫提醒和历史留档。',
    });

    await this.ensureCheckup({
      pet: dog,
      checkup_date: '2025-01-20',
      hospital: '友宠动物医院',
      doctor: '王医生',
      weight: 11.8,
      temperature: 38.4,
      diagnosis: '整体状态稳定，适合继续规律运动。',
      recommendations: '保持早晚散步和定时补水。',
      record_image_url: '/uploads/demo/medical-record.png',
    });

    await this.ensureCheckup({
      pet: cat,
      checkup_date: '2025-02-26',
      hospital: '安心宠物门诊',
      doctor: '李医生',
      weight: 4.2,
      temperature: 38.6,
      diagnosis: '牙龈轻微敏感，需要加强日常护理。',
      recommendations: '建议每周洁牙护理并关注饮水量。',
      record_image_url: '/uploads/demo/medical-record.png',
    });
  }

  private async ensureCarePlans(pets: Pet[]) {
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10);

    await this.ensureCare({
      pet_id: pets[0].id,
      type: 'feeding',
      description: '工作日早间喂食计划',
      mode: 'plan',
      date: dateString,
      time: '08:00:00',
      reminder_time: '07:50:00',
      repeat_pattern: 'daily',
      quantity: '狗粮 120g',
      notes: '用于展示首页今日待办与一键完成。',
    });

    await this.ensureCare({
      pet_id: pets[0].id,
      type: 'walking',
      description: '傍晚遛狗计划',
      mode: 'plan',
      date: dateString,
      time: '18:30:00',
      reminder_time: '18:00:00',
      repeat_pattern: 'daily',
      duration: 35,
      notes: '用于展示护理计划执行留痕。',
    });
  }

  private async ensureCommunityContent(user: User) {
    const postA = await this.ensurePost({
      user,
      title: '演示帖：今天的遛狗打卡',
      content: '可乐今天完成了傍晚散步，路线和完成状态会同步到护理计划展示。',
      images: [DEMO_POST_IMAGES.walking],
      likes: 12,
      status: 'approved',
    });

    const postB = await this.ensurePost({
      user,
      title: '演示帖：奶糖的体检复查记录',
      content: '体检页已经补充了医院、医生和建议字段，适合现场展示完整链路。',
      images: [DEMO_POST_IMAGES.checkup],
      likes: 8,
      status: 'approved',
    });

    const postC = await this.ensurePost({
      user,
      title: '演示帖：用品推荐真的省心吗',
      content: '知识页现在能从后台维护推荐用品内容，这条帖子用于承接社区互动演示。',
      images: [DEMO_POST_IMAGES.supplies],
      likes: 6,
      status: 'approved',
    });

    await this.ensureComment({
      post: postA,
      user,
      content: '这条帖子用于展示社区详情和评论列表，不需要现场临时造数据。',
    });
    await this.ensureComment({
      post: postB,
      user,
      content: '评论审核和后台状态筛选也可以直接拿这条内容演示。',
    });
    await this.ensureComment({
      post: postC,
      user,
      content: '预约、知识推荐和社区内容已经能串成完整讲解路径。',
    });

    for (const booking of DEMO_BOOKINGS) {
      await this.ensureBooking({
        user,
        serviceType: booking.serviceType,
        serviceName: booking.serviceName,
        serviceAddress: booking.serviceAddress,
        bookingDate: this.getDateOffset(booking.bookingDateOffset),
        bookingTime: booking.bookingTime,
        status: booking.status,
        notes: booking.notes,
      });
    }
  }

  private async ensureCommerceData(user: User) {
    const merchantsByName = new Map<string, Merchant>();
    for (const item of DEMO_MERCHANTS) {
      let merchant = await this.merchantRepository.findOne({
        where: { name: item.name },
      });

      if (!merchant) {
        merchant = this.merchantRepository.create({
          name: item.name,
          contact_name: item.contact_name,
          contact_phone: item.contact_phone,
          status: 'active',
        });
      } else {
        merchant.contact_name = item.contact_name;
        merchant.contact_phone = item.contact_phone;
        merchant.status = 'active';
      }

      merchant = await this.merchantRepository.save(merchant);
      merchantsByName.set(merchant.name, merchant);
    }

    const productsByKey = new Map<string, Product>();
    const bowl = await this.ensureProduct({
      merchant: merchantsByName.get('宠物生活馆')!,
      name: '便携折叠水碗',
      cover_image: DEMO_ARTICLE_IMAGES.bowl,
      description: '外出遛狗和长时等待时更方便补水，适合狗狗和猫咪共用。',
      is_recommended: true,
      sort_order: 95,
      skus: [
        { spec_name: '颜色', spec_value: '森林绿', price: 29.9, stock: 30 },
        { spec_name: '颜色', spec_value: '奶油白', price: 29.9, stock: 24 },
      ],
    });
    productsByKey.set('bowl', bowl);

    const folder = await this.ensureProduct({
      merchant: merchantsByName.get('健康护理实验室')!,
      name: '分装药盒与疫苗凭证夹',
      cover_image: DEMO_ARTICLE_IMAGES.folder,
      description: '把驱虫药、疫苗凭证和医院单据收在同一套工具里，方便长期管理。',
      is_recommended: true,
      sort_order: 85,
      skus: [
        { spec_name: '规格', spec_value: '基础版', price: 39.9, stock: 18 },
        { spec_name: '规格', spec_value: '加厚版', price: 49.9, stock: 12 },
      ],
    });
    productsByKey.set('folder', folder);

    const board = await this.ensureProduct({
      merchant: merchantsByName.get('宠物生活馆')!,
      name: '每日喂食量磁吸提醒板',
      cover_image: DEMO_ARTICLE_IMAGES.board,
      description: '适合多人协作照顾宠物，减少重复喂食和执行遗漏。',
      is_recommended: true,
      sort_order: 75,
      skus: [
        { spec_name: '尺寸', spec_value: '标准版', price: 45.0, stock: 20 },
      ],
    });
    productsByKey.set('board', board);

    const address = await this.ensureUserAddress({
      user_id: user.id,
      receiver_name: '答辩演示用户',
      receiver_phone: '13900009999',
      receiver_address: '上海市徐汇区演示路 66 号 801 室',
      is_default: true,
    });

    await this.ensureOrder({
      user,
      merchant: bowl.merchant,
      address,
      status: 'processing',
      remark: '用于展示商家后台订单处理链路。',
      items: [
        {
          product: bowl,
          sku: (bowl.skus || [])[0],
          quantity: 1,
        },
      ],
    });

    return {
      merchantsByName,
      productsByKey,
    };
  }

  private async ensureKnowledgeContent(productsByKey: Map<string, Product>) {
    const categoryMap = new Map<string, Category>();
    for (const categoryData of DEMO_CATEGORIES) {
      let category = await this.categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!category) {
        category = this.categoryRepository.create(categoryData);
      } else {
        category.description = categoryData.description;
      }

      category = await this.categoryRepository.save(category);
      categoryMap.set(category.name, category);
    }

    await this.ensureArticle({
      title: '演示知识：疫苗记录为什么要保留医院和医生信息',
      content:
        '这篇文章用于展示知识详情页和后台推荐位。内容重点说明疫苗记录不仅要保存日期，还要留存医院、医生和图片凭证，方便后续复查与补打。',
      kind: 'knowledge',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.vaccine,
      category: categoryMap.get('宠物健康管理')!,
      is_recommended: true,
      sort_order: 100,
      recommendation_reason: '适合讲解健康记录闭环。',
    });

    await this.ensureArticle({
      title: '演示知识：驱虫提醒如何和日常护理计划联动',
      content:
        '这篇文章用于展示护理计划与健康管理的关系。答辩时可以结合今日待办说明高频操作从手动记录升级为计划式管理。',
      kind: 'knowledge',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.deworming,
      category: categoryMap.get('宠物健康管理')!,
      is_recommended: true,
      sort_order: 90,
      recommendation_reason: '适合衔接健康管理和护理计划。',
    });

    await this.ensureArticle({
      title: '演示知识：喂食与遛狗为什么更适合做成定时计划',
      content:
        '这篇文章用于解释为什么高频操作不该每次手填。配合首页今日待办，能够直观看到计划、执行和留痕三个阶段。',
      kind: 'knowledge',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.carePlan,
      category: categoryMap.get('日常护理技巧')!,
      is_recommended: false,
      sort_order: 80,
      recommendation_reason: null,
    });

    await this.ensureArticle({
      title: '演示知识：拍照上传后如何快速整理体检单',
      content:
        '这篇文章用于承接健康记录拍照上传功能，强调拍照、OCR 回填、手动修正和保存回显的完整体验。',
      kind: 'knowledge',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.ocr,
      category: categoryMap.get('日常护理技巧')!,
      is_recommended: false,
      sort_order: 70,
      recommendation_reason: null,
    });

    await this.ensureArticle({
      title: '演示用品：便携折叠水碗',
      content:
        '用于展示后台可维护的用品推荐内容。推荐理由强调外出遛狗、体检排队和长时出行时的便携补水体验。',
      kind: 'product',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.bowl,
      category: categoryMap.get('宠物用品推荐')!,
      is_recommended: true,
      sort_order: 95,
      recommendation_reason: '适合搭配遛狗和外出场景讲解。',
      linked_product_id: productsByKey.get('bowl')?.id ?? null,
    });

    await this.ensureArticle({
      title: '演示用品：分装药盒与疫苗凭证夹',
      content:
        '用于展示健康管理扩展价值。推荐理由强调把驱虫药、疫苗凭证和医院单据收纳在同一套工具中。',
      kind: 'product',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.folder,
      category: categoryMap.get('宠物用品推荐')!,
      is_recommended: true,
      sort_order: 85,
      recommendation_reason: '适合衔接医院和医生信息管理。',
      linked_product_id: productsByKey.get('folder')?.id ?? null,
    });

    await this.ensureArticle({
      title: '演示用品：每日喂食量磁吸提醒板',
      content:
        '用于展示护理计划之外的生活方式补充。推荐理由强调在多人照顾宠物时减少重复喂食和遗漏执行。',
      kind: 'product',
      status: 'published',
      cover_image: DEMO_ARTICLE_IMAGES.board,
      category: categoryMap.get('宠物用品推荐')!,
      is_recommended: true,
      sort_order: 75,
      recommendation_reason: '适合讲解计划执行与线下配合。',
      linked_product_id: productsByKey.get('board')?.id ?? null,
    });
  }

  private async ensureVaccination(input: {
    pet: Pet;
    vaccine_name: string;
    vaccination_date: string;
    next_date: string;
    hospital: string;
    doctor: string;
    record_image_url: string;
    notes: string;
  }) {
    let record = await this.vaccinationRepository.findOne({
      where: {
        pet_id: input.pet.id,
        vaccine_name: input.vaccine_name,
      },
    });

    if (!record) {
      record = this.vaccinationRepository.create({
        pet: input.pet,
        pet_id: input.pet.id,
        vaccine_name: input.vaccine_name,
        vaccination_date: new Date(input.vaccination_date),
        next_date: new Date(input.next_date),
        hospital: input.hospital,
        doctor: input.doctor,
        record_image_url: input.record_image_url,
        notes: input.notes,
      });
    }

    return this.vaccinationRepository.save(record);
  }

  private async ensureDeworming(input: {
    pet: Pet;
    type: 'internal' | 'external' | 'both';
    product_name: string;
    deworming_date: string;
    next_date: string;
    hospital: string;
    doctor: string;
    record_image_url: string;
    notes: string;
  }) {
    let record = await this.dewormingRepository.findOne({
      where: {
        pet_id: input.pet.id,
        product_name: input.product_name,
      },
    });

    if (!record) {
      record = this.dewormingRepository.create({
        pet: input.pet,
        pet_id: input.pet.id,
        type: input.type,
        product_name: input.product_name,
        deworming_date: new Date(input.deworming_date),
        next_date: new Date(input.next_date),
        hospital: input.hospital,
        doctor: input.doctor,
        record_image_url: input.record_image_url,
        notes: input.notes,
      });
    }

    return this.dewormingRepository.save(record);
  }

  private async ensureCheckup(input: {
    pet: Pet;
    checkup_date: string;
    hospital: string;
    doctor: string;
    weight: number;
    temperature: number;
    diagnosis: string;
    recommendations: string;
    record_image_url: string;
  }) {
    let record = await this.checkupRepository.findOne({
      where: {
        pet_id: input.pet.id,
        hospital: input.hospital,
      },
    });

    if (!record) {
      record = this.checkupRepository.create({
        pet: input.pet,
        pet_id: input.pet.id,
        checkup_date: new Date(input.checkup_date),
        hospital: input.hospital,
        doctor: input.doctor,
        weight: input.weight,
        temperature: input.temperature,
        diagnosis: input.diagnosis,
        recommendations: input.recommendations,
        record_image_url: input.record_image_url,
      });
    }

    return this.checkupRepository.save(record);
  }

  private async ensureCare(input: {
    pet_id: number;
    type: string;
    description: string;
    mode: 'record' | 'plan';
    date: string;
    time?: string;
    reminder_time?: string;
    repeat_pattern?: 'daily' | 'weekdays' | 'weekly' | 'custom';
    duration?: number;
    quantity?: string;
    notes?: string;
  }) {
    let record = await this.careRepository.findOne({
      where: {
        pet_id: input.pet_id,
        type: input.type,
        mode: input.mode,
        description: input.description,
      },
    });

    if (!record) {
      record = this.careRepository.create({
        ...input,
        date: new Date(input.date),
      });
    }

    return this.careRepository.save(record);
  }

  private async ensurePost(input: {
    user: User;
    title: string;
    content: string;
    images: string[];
    likes: number;
    status: string;
  }) {
    let post = await this.postRepository.findOne({
      where: {
        user_id: input.user.id,
        title: input.title,
      },
    });

    if (!post) {
      post = this.postRepository.create({
        user_id: input.user.id,
        user: input.user,
        title: input.title,
        content: input.content,
        images: input.images,
        likes: input.likes,
        comments: 0,
        status: input.status,
      });
    } else {
      post.content = input.content;
      post.images = input.images;
      post.likes = input.likes;
      post.status = input.status;
    }

    return this.postRepository.save(post);
  }

  private async ensureComment(input: {
    post: Post;
    user: User;
    content: string;
  }) {
    let comment = await this.commentRepository.findOne({
      where: {
        post_id: input.post.id,
        user_id: input.user.id,
        content: input.content,
      },
    });

    if (!comment) {
      comment = this.commentRepository.create({
        post_id: input.post.id,
        post: input.post,
        user_id: input.user.id,
        user: input.user,
        content: input.content,
        status: 'approved',
      });
      await this.commentRepository.save(comment);
    }

    const commentCount = await this.commentRepository.count({
      where: { post_id: input.post.id },
    });
    if (input.post.comments < commentCount) {
      input.post.comments = commentCount;
      await this.postRepository.save(input.post);
    }

    return comment;
  }

  private async ensureBooking(input: {
    user: User;
    serviceType: string;
    serviceName: string;
    serviceAddress: string;
    bookingDate: string;
    bookingTime: string;
    status?: string;
    notes?: string;
  }) {
    let booking = await this.bookingRepository.findOne({
      where: {
        serviceName: input.serviceName,
        bookingTime: input.bookingTime,
        user: { id: input.user.id },
      },
      relations: ['user'],
    });

    if (!booking) {
      booking = this.bookingRepository.create({
        serviceType: input.serviceType,
        serviceName: input.serviceName,
        serviceAddress: input.serviceAddress,
        bookingDate: new Date(input.bookingDate),
        bookingTime: input.bookingTime,
        status: input.status || 'pending',
        notes: input.notes,
        user: input.user,
      });
    } else {
      booking.serviceType = input.serviceType;
      booking.serviceName = input.serviceName;
      booking.serviceAddress = input.serviceAddress;
      booking.bookingDate = new Date(input.bookingDate);
      booking.bookingTime = input.bookingTime;
      booking.status = input.status || booking.status;
      booking.notes = input.notes || null;
    }

    return this.bookingRepository.save(booking);
  }

  private async ensureArticle(input: {
    title: string;
    content: string;
    cover_image: string;
    kind: string;
    status: string;
    is_recommended: boolean;
    sort_order: number;
    recommendation_reason: string | null;
    category: Category;
    linked_product_id?: number | null;
  }) {
    let article = await this.articleRepository.findOne({
      where: { title: input.title },
      relations: ['category'],
    });

    if (!article) {
      article = this.articleRepository.create({
        title: input.title,
        content: input.content,
        cover_image: input.cover_image,
        kind: input.kind,
        status: input.status,
        is_recommended: input.is_recommended,
        sort_order: input.sort_order,
        recommendation_reason: input.recommendation_reason,
        category: input.category,
        linked_product_id: input.linked_product_id ?? null,
      });
    } else {
      article.content = input.content;
      article.cover_image = input.cover_image;
      article.kind = input.kind;
      article.status = input.status;
      article.is_recommended = input.is_recommended;
      article.sort_order = input.sort_order;
      article.recommendation_reason = input.recommendation_reason;
      article.category = input.category;
      article.linked_product_id = input.linked_product_id ?? null;
    }

    return this.articleRepository.save(article);
  }

  private async ensureProduct(input: {
    merchant: Merchant;
    name: string;
    cover_image: string;
    description: string;
    is_recommended: boolean;
    sort_order: number;
    skus: Array<{
      spec_name: string;
      spec_value: string;
      price: number;
      stock: number;
    }>;
  }) {
    let product = await this.productRepository.findOne({
      where: {
        merchant_id: input.merchant.id,
        name: input.name,
      },
      relations: ['merchant', 'skus'],
    });

    if (!product) {
      product = this.productRepository.create({
        merchant: input.merchant,
        merchant_id: input.merchant.id,
        name: input.name,
        cover_image: input.cover_image,
        description: input.description,
        status: 'active',
        is_recommended: input.is_recommended,
        sort_order: input.sort_order,
        price_range: '0.00',
        stock: 0,
      });
    } else {
      product.cover_image = input.cover_image;
      product.description = input.description;
      product.status = 'active';
      product.is_recommended = input.is_recommended;
      product.sort_order = input.sort_order;
    }

    product = await this.productRepository.save(product);

    let totalStock = 0;
    const prices: number[] = [];
    const skus: ProductSku[] = [];

    for (const skuInput of input.skus) {
      let sku = await this.productSkuRepository.findOne({
        where: {
          product_id: product.id,
          spec_name: skuInput.spec_name,
          spec_value: skuInput.spec_value,
        },
      });

      if (!sku) {
        sku = this.productSkuRepository.create({
          product,
          product_id: product.id,
          spec_name: skuInput.spec_name,
          spec_value: skuInput.spec_value,
          price: skuInput.price,
          stock: skuInput.stock,
          status: 'active',
        });
      } else {
        sku.price = skuInput.price;
        sku.stock = skuInput.stock;
        sku.status = 'active';
      }

      sku = await this.productSkuRepository.save(sku);
      totalStock += sku.stock;
      prices.push(sku.price);
      skus.push(sku);
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    product.stock = totalStock;
    product.price_range = min === max ? min.toFixed(2) : `${min.toFixed(2)} - ${max.toFixed(2)}`;
    product = await this.productRepository.save(product);
    product.skus = skus;

    return product;
  }

  private async ensureUserAddress(input: {
    user_id: number;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    is_default: boolean;
  }) {
    let address = await this.userAddressRepository.findOne({
      where: {
        user_id: input.user_id,
        receiver_phone: input.receiver_phone,
        receiver_address: input.receiver_address,
      },
    });

    if (!address) {
      address = this.userAddressRepository.create(input);
    } else {
      address.receiver_name = input.receiver_name;
      address.receiver_phone = input.receiver_phone;
      address.receiver_address = input.receiver_address;
      address.is_default = input.is_default;
    }

    if (input.is_default) {
      await this.userAddressRepository.update({ user_id: input.user_id }, { is_default: false });
      address.is_default = true;
    }

    return this.userAddressRepository.save(address);
  }

  private async ensureOrder(input: {
    user: User;
    merchant: Merchant;
    address: UserAddress;
    status: string;
    remark?: string;
    items: Array<{
      product: Product;
      sku: ProductSku;
      quantity: number;
    }>;
  }) {
    const orderNo = `DEMO-${input.user.id}-${input.merchant.id}`;
    let order = await this.orderRepository.findOne({
      where: { order_no: orderNo },
      relations: ['items'],
    });

    const totalAmount = Number(
      input.items
        .reduce((sum, item) => sum + item.sku.price * item.quantity, 0)
        .toFixed(2),
    );

    if (!order) {
      order = this.orderRepository.create({
        order_no: orderNo,
        user: input.user,
        user_id: input.user.id,
        merchant: input.merchant,
        merchant_id: input.merchant.id,
        status: input.status,
        total_amount: totalAmount,
        receiver_name: input.address.receiver_name,
        receiver_phone: input.address.receiver_phone,
        receiver_address: input.address.receiver_address,
        remark: input.remark || null,
      });
      order = await this.orderRepository.save(order);
    } else {
      order.status = input.status;
      order.total_amount = totalAmount;
      order.receiver_name = input.address.receiver_name;
      order.receiver_phone = input.address.receiver_phone;
      order.receiver_address = input.address.receiver_address;
      order.remark = input.remark || null;
      order = await this.orderRepository.save(order);
      await this.orderItemRepository.delete({ order_id: order.id });
    }

    for (const item of input.items) {
      await this.orderItemRepository.save(
        this.orderItemRepository.create({
          order,
          order_id: order.id,
          product: item.product,
          product_id: item.product.id,
          sku: item.sku,
          sku_id: item.sku.id,
          product_name_snapshot: item.product.name,
          sku_snapshot: `${item.sku.spec_name}: ${item.sku.spec_value}`,
          price: item.sku.price,
          quantity: item.quantity,
          amount: Number((item.sku.price * item.quantity).toFixed(2)),
        }),
      );
    }

    return order;
  }

  private async ensureMerchantAdminAccounts(merchantsByName: Map<string, Merchant>) {
    await this.ensureMerchantAdmin({
      username: 'merchant_demo_1',
      password: 'merchant123456',
      merchant: merchantsByName.get('宠物生活馆')!,
    });
    await this.ensureMerchantAdmin({
      username: 'merchant_demo_2',
      password: 'merchant123456',
      merchant: merchantsByName.get('健康护理实验室')!,
    });
  }

  private async ensureMerchantAdmin(input: {
    username: string;
    password: string;
    merchant: Merchant;
  }) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    let adminUser = await this.adminUserRepository.findOne({
      where: { username: input.username },
    });

    if (!adminUser) {
      adminUser = this.adminUserRepository.create({
        username: input.username,
        password: hashedPassword,
        role: 'merchant_admin',
        status: 'active',
        account_type: 'merchant',
        merchant_id: input.merchant.id,
        merchant: input.merchant,
      });
    } else {
      adminUser.password = hashedPassword;
      adminUser.role = 'merchant_admin';
      adminUser.status = 'active';
      adminUser.account_type = 'merchant';
      adminUser.merchant_id = input.merchant.id;
      adminUser.merchant = input.merchant;
    }

    await this.adminUserRepository.save(adminUser);
  }

  private getDateOffset(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
