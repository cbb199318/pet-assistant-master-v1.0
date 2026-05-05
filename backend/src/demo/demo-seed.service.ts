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
    await this.ensureKnowledgeContent();

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

    await this.ensureBooking({
      user,
      serviceType: 'hospital',
      serviceName: '安心宠物门诊年度复查',
      serviceAddress: '上海市徐汇区演示路 18 号',
      bookingDate: this.getDateOffset(3),
      bookingTime: '10:00',
      notes: '用于展示我的预约、状态和后台统计。',
    });
  }

  private async ensureKnowledgeContent() {
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
        notes: input.notes,
        user: input.user,
      });
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
    }

    return this.articleRepository.save(article);
  }

  private getDateOffset(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
