import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Repository } from 'typeorm';
import { DemoSeedService } from './demo-seed.service';
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

const sqljsLocation = join(tmpdir(), `pet-assistant-demo-seed-${Date.now()}.sqlite`);
process.env.DB_TYPE = 'sqljs';
process.env.SQLJS_LOCATION = sqljsLocation;
process.env.JWT_SECRET = 'demo-seed-test-secret';
process.env.ADMIN_JWT_SECRET = 'demo-seed-test-admin-secret';
process.env.DEMO_SEED_ENABLED = 'true';
process.env.npm_lifecycle_event = 'start:dev';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../app.module');

describe('DemoSeedService', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let demoSeedService: DemoSeedService;

  let userRepository: Repository<User>;
  let petRepository: Repository<Pet>;
  let vaccinationRepository: Repository<Vaccination>;
  let dewormingRepository: Repository<Deworming>;
  let checkupRepository: Repository<Checkup>;
  let careRepository: Repository<Care>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;
  let bookingRepository: Repository<Booking>;
  let categoryRepository: Repository<Category>;
  let articleRepository: Repository<Article>;

  beforeAll(async () => {
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    demoSeedService = moduleFixture.get(DemoSeedService);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    petRepository = moduleFixture.get(getRepositoryToken(Pet));
    vaccinationRepository = moduleFixture.get(getRepositoryToken(Vaccination));
    dewormingRepository = moduleFixture.get(getRepositoryToken(Deworming));
    checkupRepository = moduleFixture.get(getRepositoryToken(Checkup));
    careRepository = moduleFixture.get(getRepositoryToken(Care));
    postRepository = moduleFixture.get(getRepositoryToken(Post));
    commentRepository = moduleFixture.get(getRepositoryToken(Comment));
    bookingRepository = moduleFixture.get(getRepositoryToken(Booking));
    categoryRepository = moduleFixture.get(getRepositoryToken(Category));
    articleRepository = moduleFixture.get(getRepositoryToken(Article));
  });

  afterAll(async () => {
    await app?.close();
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});
  });

  it('should auto seed demo data on dev startup and allow demo user login', async () => {
    expect(await userRepository.count()).toBe(1);
    expect(await petRepository.count()).toBe(2);
    expect(await vaccinationRepository.count()).toBe(2);
    expect(await dewormingRepository.count()).toBe(2);
    expect(await checkupRepository.count()).toBe(2);
    expect(await careRepository.count()).toBe(2);
    expect(await postRepository.count()).toBe(3);
    expect(await commentRepository.count()).toBe(3);
    expect(await bookingRepository.count()).toBe(1);
    expect(await categoryRepository.count()).toBe(3);
    expect(await articleRepository.count()).toBe(7);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        phone: '13900009999',
        password: 'demo123456',
      })
      .expect(201);

    expect(loginResponse.body.user.nickname).toBe('答辩演示用户');
    expect(loginResponse.body.user.avatar).toBe('/uploads/demo/user-avatar.svg');
  });

  it('should remain idempotent when seed runs again', async () => {
    await demoSeedService.seedDemoData();

    expect(await userRepository.count()).toBe(1);
    expect(await petRepository.count()).toBe(2);
    expect(await vaccinationRepository.count()).toBe(2);
    expect(await dewormingRepository.count()).toBe(2);
    expect(await checkupRepository.count()).toBe(2);
    expect(await careRepository.count()).toBe(2);
    expect(await postRepository.count()).toBe(3);
    expect(await commentRepository.count()).toBe(3);
    expect(await bookingRepository.count()).toBe(1);
    expect(await categoryRepository.count()).toBe(3);
    expect(await articleRepository.count()).toBe(7);
  });
});
