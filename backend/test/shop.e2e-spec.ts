import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const sqljsLocation = join(tmpdir(), `pet-assistant-shop-e2e-${Date.now()}.sqlite`);

process.env.DB_TYPE = 'sqljs';
process.env.SQLJS_LOCATION = sqljsLocation;
process.env.JWT_SECRET = 'pet-assistant-shop-e2e-secret';
process.env.ADMIN_JWT_SECRET = 'pet-assistant-shop-e2e-admin-secret';
process.env.DEMO_SEED_ENABLED = 'true';
process.env.npm_lifecycle_event = 'start:dev';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../src/app.module');

describe('Shop flow e2e', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userToken = '';
  let merchantOneToken = '';
  let merchantTwoToken = '';

  beforeAll(async () => {
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const userLogin = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        phone: '13900009999',
        password: 'demo123456',
      })
      .expect(201);
    userToken = userLogin.body.token;

    const merchantOneLogin = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        username: 'merchant_demo_1',
        password: 'merchant123456',
      })
      .expect(201);
    merchantOneToken = merchantOneLogin.body.token;

    const merchantTwoLogin = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        username: 'merchant_demo_2',
        password: 'merchant123456',
      })
      .expect(201);
    merchantTwoToken = merchantTwoLogin.body.token;
  });

  afterAll(async () => {
    await app?.close();
    await fs.rm(sqljsLocation, { force: true }).catch(() => {});
  });

  it('should allow user order creation, merchant scoping, and inventory restore on cancel', async () => {
    const productResponse = await request(app.getHttpServer())
      .get('/api/shop/products/recommended')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(productResponse.body.length).toBeGreaterThanOrEqual(2);

    const merchantOneProduct = productResponse.body.find((item: any) => item.merchant?.name === '宠物生活馆');
    const merchantTwoProduct = productResponse.body.find((item: any) => item.merchant?.name === '健康护理实验室');

    expect(merchantOneProduct).toBeTruthy();
    expect(merchantTwoProduct).toBeTruthy();

    const merchantOneDetailBefore = await request(app.getHttpServer())
      .get(`/api/shop/products/${merchantOneProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    const merchantTwoDetailBefore = await request(app.getHttpServer())
      .get(`/api/shop/products/${merchantTwoProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const merchantOneSku = merchantOneDetailBefore.body.skus[0];
    const merchantTwoSku = merchantTwoDetailBefore.body.skus[0];

    const addressResponse = await request(app.getHttpServer())
      .get('/api/shop/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(addressResponse.body.length).toBeGreaterThan(0);

    const defaultAddressId = addressResponse.body[0].id;

    const orderOneResponse = await request(app.getHttpServer())
      .post('/api/shop/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addressId: defaultAddressId,
        remark: 'e2e order one',
        items: [
          {
            productId: merchantOneProduct.id,
            skuId: merchantOneSku.id,
            quantity: 2,
          },
        ],
      })
      .expect(201);

    expect(orderOneResponse.body.status).toBe('pending_confirmation');

    const merchantOneDetailAfter = await request(app.getHttpServer())
      .get(`/api/shop/products/${merchantOneProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(merchantOneDetailAfter.body.skus[0].stock).toBe(merchantOneSku.stock - 2);

    const orderTwoResponse = await request(app.getHttpServer())
      .post('/api/shop/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addressId: defaultAddressId,
        remark: 'e2e order two',
        items: [
          {
            productId: merchantTwoProduct.id,
            skuId: merchantTwoSku.id,
            quantity: 1,
          },
        ],
      })
      .expect(201);

    const merchantOneOrdersResponse = await request(app.getHttpServer())
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .expect(200);
    expect(merchantOneOrdersResponse.body.items.some((item: any) => item.id === orderOneResponse.body.id)).toBe(true);
    expect(merchantOneOrdersResponse.body.items.some((item: any) => item.id === orderTwoResponse.body.id)).toBe(false);

    const merchantTwoOrdersResponse = await request(app.getHttpServer())
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${merchantTwoToken}`)
      .expect(200);
    expect(merchantTwoOrdersResponse.body.items.some((item: any) => item.id === orderTwoResponse.body.id)).toBe(true);
    expect(merchantTwoOrdersResponse.body.items.some((item: any) => item.id === orderOneResponse.body.id)).toBe(false);

    await request(app.getHttpServer())
      .get(`/api/admin/orders/${orderTwoResponse.body.id}`)
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .put(`/api/admin/orders/${orderOneResponse.body.id}/status`)
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .send({ status: 'processing' })
      .expect(400);

    const orderOneProcessingResponse = await request(app.getHttpServer())
      .put(`/api/shop/orders/${orderOneResponse.body.id}/pay`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(orderOneProcessingResponse.body.status).toBe('processing');

    const merchantOneShippedResponse = await request(app.getHttpServer())
      .put(`/api/admin/orders/${orderOneResponse.body.id}/status`)
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .send({ status: 'shipped' })
      .expect(200);
    expect(merchantOneShippedResponse.body.status).toBe('shipped');

    const orderTwoCancelledResponse = await request(app.getHttpServer())
      .put(`/api/shop/orders/${orderTwoResponse.body.id}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(orderTwoCancelledResponse.body.status).toBe('cancelled');

    const merchantTwoDetailAfterCancel = await request(app.getHttpServer())
      .get(`/api/shop/products/${merchantTwoProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    const restoredSku = merchantTwoDetailAfterCancel.body.skus.find((item: any) => item.id === merchantTwoSku.id);
    expect(restoredSku.stock).toBe(merchantTwoSku.stock);

    const createdProductResponse = await request(app.getHttpServer())
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .send({
        name: 'e2e 商家新商品',
        cover_image: '/uploads/demo/e2e-product.jpg',
        description: '商家可以自己上架的轻量商品',
        status: 'active',
        sort_order: 10,
        is_recommended: false,
        skus: [
          {
            spec_name: '规格',
            spec_value: '标准版',
            price: 19.9,
            stock: 9,
          },
        ],
      })
      .expect(201);
    expect(createdProductResponse.body.name).toBe('e2e 商家新商品');

    const merchantOneProductsResponse = await request(app.getHttpServer())
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .expect(200);
    expect(merchantOneProductsResponse.body.items.some((item: any) => item.id === createdProductResponse.body.id)).toBe(true);

    const createdProductOrderResponse = await request(app.getHttpServer())
      .post('/api/shop/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addressId: defaultAddressId,
        remark: 'e2e sku migration order',
        items: [
          {
            productId: createdProductResponse.body.id,
            skuId: createdProductResponse.body.skus[0].id,
            quantity: 2,
          },
        ],
      })
      .expect(201);
    expect(createdProductOrderResponse.body.status).toBe('pending_confirmation');

    const updatedProductResponse = await request(app.getHttpServer())
      .put(`/api/admin/products/${createdProductResponse.body.id}`)
      .set('Authorization', `Bearer ${merchantOneToken}`)
      .send({
        name: 'e2e 商家新商品',
        cover_image: '/uploads/demo/e2e-product.jpg',
        description: '商家更新后的轻量商品',
        status: 'active',
        sort_order: 11,
        is_recommended: true,
        skus: [
          {
            spec_name: '规格',
            spec_value: '升级版',
            price: 29.9,
            stock: 5,
          },
        ],
      })
      .expect(200);
    expect(updatedProductResponse.body.skus.some((item: any) => item.spec_value === '升级版' && item.status === 'active')).toBe(true);
    expect(updatedProductResponse.body.skus.some((item: any) => item.spec_value === '标准版' && item.status === 'inactive')).toBe(true);
    expect(updatedProductResponse.body.stock).toBe(5);

    const cancelledUpdatedProductOrder = await request(app.getHttpServer())
      .put(`/api/shop/orders/${createdProductOrderResponse.body.id}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(cancelledUpdatedProductOrder.body.status).toBe('cancelled');

    const updatedProductDetailForUser = await request(app.getHttpServer())
      .get(`/api/shop/products/${createdProductResponse.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(updatedProductDetailForUser.body.skus).toHaveLength(1);
    expect(updatedProductDetailForUser.body.skus[0].spec_value).toBe('升级版');
    expect(updatedProductDetailForUser.body.stock).toBe(5);

    await request(app.getHttpServer())
      .get(`/api/admin/products/${createdProductResponse.body.id}`)
      .set('Authorization', `Bearer ${merchantTwoToken}`)
      .expect(403);
  });
});
