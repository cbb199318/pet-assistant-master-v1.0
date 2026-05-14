import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductSku } from './product-sku.entity';
import { UserAddress } from './user-address.entity';
import { ShopOrder } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Merchant } from './merchant.entity';

type OrderActor = {
  userId?: number;
  adminId?: number;
  username?: string;
  role?: string;
  account_type?: string;
  merchant_id?: number | null;
};

type CreateOrderInput = {
  addressId: number;
  remark?: string;
  items: Array<{
    productId: number;
    skuId: number;
    quantity: number;
  }>;
};

const USER_CANCELABLE_STATUS = ['pending_confirmation'] as const;
const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_confirmation: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,
    @InjectRepository(ShopOrder)
    private readonly orderRepository: Repository<ShopOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly dataSource: DataSource,
  ) {}

  private formatMerchant(merchant?: Merchant | null) {
    if (!merchant) {
      return null;
    }

    return {
      id: merchant.id,
      name: merchant.name,
      status: merchant.status,
    };
  }

  private formatProduct(product: Product, includeSkus = false) {
    return {
      id: product.id,
      name: product.name,
      cover_image: product.cover_image,
      description: product.description,
      status: product.status,
      price_range: product.price_range,
      stock: product.stock,
      is_recommended: product.is_recommended,
      sort_order: product.sort_order,
      created_at: product.created_at,
      updated_at: product.updated_at,
      merchant: this.formatMerchant(product.merchant),
      skus: includeSkus
        ? (product.skus || []).map((sku) => ({
            id: sku.id,
            spec_name: sku.spec_name,
            spec_value: sku.spec_value,
            price: sku.price,
            stock: sku.stock,
            status: sku.status,
          }))
        : undefined,
    };
  }

  private formatAddress(address: UserAddress) {
    return {
      id: address.id,
      receiver_name: address.receiver_name,
      receiver_phone: address.receiver_phone,
      receiver_address: address.receiver_address,
      is_default: address.is_default,
      created_at: address.created_at,
      updated_at: address.updated_at,
    };
  }

  private formatOrder(order: ShopOrder, includeItems = true) {
    return {
      id: order.id,
      order_no: order.order_no,
      status: order.status,
      total_amount: order.total_amount,
      receiver_name: order.receiver_name,
      receiver_phone: order.receiver_phone,
      receiver_address: order.receiver_address,
      remark: order.remark,
      created_at: order.created_at,
      updated_at: order.updated_at,
      merchant: this.formatMerchant(order.merchant),
      items: includeItems
        ? (order.items || []).map((item) => ({
            id: item.id,
            product_id: item.product_id,
            sku_id: item.sku_id,
            product_name_snapshot: item.product_name_snapshot,
            sku_snapshot: item.sku_snapshot,
            price: item.price,
            quantity: item.quantity,
            amount: item.amount,
          }))
        : undefined,
    };
  }

  private async refreshProductSummaries(productIds: number[]) {
    if (productIds.length === 0) {
      return;
    }

    const uniqueIds = Array.from(new Set(productIds));
    const skuRows = await this.productSkuRepository.find({
      where: { product_id: In(uniqueIds) },
      order: { price: 'ASC', id: 'ASC' },
    });

    for (const productId of uniqueIds) {
      const skus = skuRows.filter((item) => item.product_id === productId && item.status === 'active');
      const stock = skus.reduce((sum, item) => sum + (item.stock || 0), 0);
      const prices = skus.map((item) => item.price).filter((value) => Number.isFinite(value));
      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        continue;
      }

      product.stock = stock;
      if (prices.length === 0) {
        product.price_range = '0.00';
      } else {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        product.price_range = min === max ? min.toFixed(2) : `${min.toFixed(2)} - ${max.toFixed(2)}`;
      }
      await this.productRepository.save(product);
    }
  }

  private buildOrderNo() {
    return `PA${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private assertOrderTransition(currentStatus: string, nextStatus: string) {
    const allowed = ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`订单状态不允许从 ${currentStatus} 更新为 ${nextStatus}`);
    }
  }

  private normalizeAdminMerchantId(actor: OrderActor, merchantId?: number | null) {
    if (actor.account_type === 'merchant') {
      if (!actor.merchant_id) {
        throw new ForbiddenException('商家账号未绑定商家主体');
      }
      return actor.merchant_id;
    }

    const normalizedMerchantId = Number(merchantId) || 0;
    if (!normalizedMerchantId) {
      throw new BadRequestException('商家 ID 不能为空');
    }
    return normalizedMerchantId;
  }

  private parseSkuInput(input: Array<{
    id?: number;
    spec_name: string;
    spec_value: string;
    price: number;
    stock: number;
    status?: string;
  }>) {
    const normalizedSkus = (input || [])
      .map((item) => ({
        id: item.id ? Number(item.id) : undefined,
        spec_name: item.spec_name?.trim(),
        spec_value: item.spec_value?.trim(),
        price: Number(item.price),
        stock: Number(item.stock),
        status: item.status || 'active',
      }))
      .filter((item) => item.spec_name && item.spec_value);

    if (normalizedSkus.length === 0) {
      throw new BadRequestException('至少需要一个有效规格');
    }

    normalizedSkus.forEach((item) => {
      if (!Number.isFinite(item.price) || item.price < 0) {
        throw new BadRequestException('商品价格不合法');
      }
      if (!Number.isFinite(item.stock) || item.stock < 0) {
        throw new BadRequestException('商品库存不合法');
      }
    });

    return normalizedSkus;
  }

  async getProducts(limit = 20, keyword = '') {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .where('product.status = :status', { status: 'active' });

    if (keyword.trim()) {
      const searchKeyword = `%${keyword.trim()}%`;
      queryBuilder.andWhere('(product.name LIKE :keyword OR product.description LIKE :keyword)', {
        keyword: searchKeyword,
      });
    }

    const products = await queryBuilder
      .orderBy('product.sort_order', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .take(Math.min(Math.max(limit, 1), 50))
      .getMany();

    return products.map((item) => this.formatProduct(item));
  }

  async getRecommendedProducts(limit = 6) {
    const products = await this.productRepository.find({
      where: { status: 'active', is_recommended: true },
      relations: ['merchant'],
      order: { sort_order: 'DESC', created_at: 'DESC' },
      take: Math.min(Math.max(limit, 1), 20),
    });

    return products.map((item) => this.formatProduct(item));
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id, status: 'active' },
      relations: ['merchant', 'skus'],
    });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    product.skus = (product.skus || []).filter((item) => item.status === 'active');
    return this.formatProduct(product, true);
  }

  async getAdminProducts(
    params: { keyword?: string; page: number; pageSize: number },
    actor: OrderActor,
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .leftJoinAndSelect('product.skus', 'skus')
      .where('1 = 1');

    if (actor.account_type === 'merchant') {
      queryBuilder.andWhere('product.merchant_id = :merchantId', {
        merchantId: this.normalizeAdminMerchantId(actor),
      });
    }

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.andWhere(
        '(product.name LIKE :keyword OR product.description LIKE :keyword OR merchant.name LIKE :keyword)',
        { keyword },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('product.sort_order', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.formatProduct(item, true)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminProductById(id: number, actor: OrderActor) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['merchant', 'skus'],
    });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    if (actor.account_type === 'merchant' && product.merchant_id !== actor.merchant_id) {
      throw new ForbiddenException('无权查看该商品');
    }

    return this.formatProduct(product, true);
  }

  async createAdminProduct(
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
    actor: OrderActor,
  ) {
    const merchantId = this.normalizeAdminMerchantId(actor, data.merchant_id);
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }

    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestException('商品名称不能为空');
    }
    const skus = this.parseSkuInput(data.skus);

    const product = await this.productRepository.save(
      this.productRepository.create({
        merchant,
        merchant_id: merchant.id,
        name,
        cover_image: data.cover_image?.trim() || null,
        description: data.description?.trim() || null,
        status: data.status || 'active',
        sort_order: Number(data.sort_order) || 0,
        is_recommended: Boolean(data.is_recommended),
        price_range: '0.00',
        stock: 0,
      }),
    );

    for (const sku of skus) {
      await this.productSkuRepository.save(
        this.productSkuRepository.create({
          product,
          product_id: product.id,
          spec_name: sku.spec_name,
          spec_value: sku.spec_value,
          price: sku.price,
          stock: sku.stock,
          status: sku.status,
        }),
      );
    }

    await this.refreshProductSummaries([product.id]);
    return this.getAdminProductById(product.id, actor);
  }

  async updateAdminProduct(
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
    actor: OrderActor,
  ) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['merchant', 'skus'],
    });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    if (actor.account_type === 'merchant' && product.merchant_id !== actor.merchant_id) {
      throw new ForbiddenException('无权修改该商品');
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('商品名称不能为空');
      }
      product.name = name;
    }
    if (data.cover_image !== undefined) product.cover_image = data.cover_image.trim() || null;
    if (data.description !== undefined) product.description = data.description.trim() || null;
    if (data.status !== undefined) product.status = data.status;
    if (data.sort_order !== undefined) product.sort_order = Number(data.sort_order) || 0;
    if (data.is_recommended !== undefined) product.is_recommended = Boolean(data.is_recommended);

    await this.productRepository.save(product);

    if (data.skus) {
      const normalizedSkus = this.parseSkuInput(data.skus);
      const existingSkuIds = new Set((product.skus || []).map((item) => item.id));
      const matchedExistingSkuIds = new Set<number>();
      const incomingSkuIds = new Set<number>();

      for (const sku of normalizedSkus) {
        if (sku.id && existingSkuIds.has(sku.id)) {
          const existingSku = (product.skus || []).find((item) => item.id === sku.id);
          if (!existingSku) {
            continue;
          }
          existingSku.spec_name = sku.spec_name;
          existingSku.spec_value = sku.spec_value;
          existingSku.price = sku.price;
          existingSku.stock = sku.stock;
          existingSku.status = sku.status;
          await this.productSkuRepository.save(existingSku);
          incomingSkuIds.add(existingSku.id);
          matchedExistingSkuIds.add(existingSku.id);
        } else {
          const fallbackExistingSku = (product.skus || []).find(
            (item) =>
              !matchedExistingSkuIds.has(item.id)
              && item.spec_name === sku.spec_name
              && item.spec_value === sku.spec_value,
          );

          if (fallbackExistingSku) {
            fallbackExistingSku.price = sku.price;
            fallbackExistingSku.stock = sku.stock;
            fallbackExistingSku.status = sku.status;
            await this.productSkuRepository.save(fallbackExistingSku);
            incomingSkuIds.add(fallbackExistingSku.id);
            matchedExistingSkuIds.add(fallbackExistingSku.id);
            continue;
          }

          const savedSku = await this.productSkuRepository.save(
            this.productSkuRepository.create({
              product,
              product_id: product.id,
              spec_name: sku.spec_name,
              spec_value: sku.spec_value,
              price: sku.price,
              stock: sku.stock,
              status: sku.status,
            }),
          );
          incomingSkuIds.add(savedSku.id);
        }
      }

      const removedSkuIds = (product.skus || [])
        .map((item) => item.id)
        .filter((skuId) => !incomingSkuIds.has(skuId));
      if (removedSkuIds.length > 0) {
        const referencedRows = await this.orderItemRepository.find({
          where: { sku_id: In(removedSkuIds) },
          select: ['sku_id'],
        });
        const referencedSkuIds = new Set(referencedRows.map((item) => item.sku_id));
        const skuIdsToDelete = removedSkuIds.filter((skuId) => !referencedSkuIds.has(skuId));
        const skuIdsToDeactivate = removedSkuIds.filter((skuId) => referencedSkuIds.has(skuId));

        if (skuIdsToDelete.length > 0) {
          await this.productSkuRepository.delete({ id: In(skuIdsToDelete) });
        }

        if (skuIdsToDeactivate.length > 0) {
          await this.productSkuRepository
            .createQueryBuilder()
            .update(ProductSku)
            .set({ status: 'inactive' })
            .where({ id: In(skuIdsToDeactivate) })
            .execute();
        }
      }
    }

    await this.refreshProductSummaries([product.id]);
    return this.getAdminProductById(product.id, actor);
  }

  async deleteAdminProduct(id: number, actor: OrderActor) {
    const product = await this.productRepository.findOne({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    if (actor.account_type === 'merchant' && product.merchant_id !== actor.merchant_id) {
      throw new ForbiddenException('无权删除该商品');
    }

    await this.productSkuRepository.delete({ product_id: product.id });
    await this.productRepository.delete(id);
    return { message: '商品删除成功' };
  }

  async getAddresses(userId: number) {
    const addresses = await this.userAddressRepository.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', updated_at: 'DESC', id: 'DESC' },
    });
    return addresses.map((item) => this.formatAddress(item));
  }

  async createAddress(userId: number, data: {
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    is_default?: boolean;
  }) {
    const receiver_name = data.receiver_name?.trim();
    const receiver_phone = data.receiver_phone?.trim();
    const receiver_address = data.receiver_address?.trim();
    if (!receiver_name || !receiver_phone || !receiver_address) {
      throw new BadRequestException('收货人、手机号和收货地址不能为空');
    }

    if (data.is_default) {
      await this.userAddressRepository.update({ user_id: userId }, { is_default: false });
    }

    const address = await this.userAddressRepository.save(
      this.userAddressRepository.create({
        user_id: userId,
        receiver_name,
        receiver_phone,
        receiver_address,
        is_default: Boolean(data.is_default),
      }),
    );

    return this.formatAddress(address);
  }

  async updateAddress(userId: number, id: number, data: {
    receiver_name?: string;
    receiver_phone?: string;
    receiver_address?: string;
    is_default?: boolean;
  }) {
    const address = await this.userAddressRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!address) {
      throw new NotFoundException('收货地址不存在');
    }

    if (data.receiver_name !== undefined) {
      const value = data.receiver_name.trim();
      if (!value) {
        throw new BadRequestException('收货人不能为空');
      }
      address.receiver_name = value;
    }
    if (data.receiver_phone !== undefined) {
      const value = data.receiver_phone.trim();
      if (!value) {
        throw new BadRequestException('手机号不能为空');
      }
      address.receiver_phone = value;
    }
    if (data.receiver_address !== undefined) {
      const value = data.receiver_address.trim();
      if (!value) {
        throw new BadRequestException('收货地址不能为空');
      }
      address.receiver_address = value;
    }

    if (data.is_default !== undefined) {
      if (data.is_default) {
        await this.userAddressRepository.update({ user_id: userId }, { is_default: false });
      }
      address.is_default = Boolean(data.is_default);
    }

    const saved = await this.userAddressRepository.save(address);
    return this.formatAddress(saved);
  }

  async deleteAddress(userId: number, id: number) {
    const address = await this.userAddressRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!address) {
      throw new NotFoundException('收货地址不存在');
    }

    await this.userAddressRepository.delete(id);
    return { message: '收货地址已删除' };
  }

  async createOrder(userId: number, input: CreateOrderInput) {
    if (!input.items?.length) {
      throw new BadRequestException('请至少选择一个商品');
    }

    const address = await this.userAddressRepository.findOne({
      where: { id: input.addressId, user_id: userId },
    });
    if (!address) {
      throw new NotFoundException('收货地址不存在');
    }

    const productIds = Array.from(new Set(input.items.map((item) => Number(item.productId))));
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['merchant', 'skus'],
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('存在不存在的商品');
    }

    const productMap = new Map(products.map((item) => [item.id, item]));
    const merchantIds = new Set<number>();
    let totalAmount = 0;

    const normalizedItems = input.items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        throw new BadRequestException('商品数量必须大于 0');
      }

      const product = productMap.get(Number(item.productId));
      if (!product || product.status !== 'active') {
        throw new BadRequestException('商品不可下单');
      }

      const sku = (product.skus || []).find((skuItem) => skuItem.id === Number(item.skuId));
      if (!sku || sku.status !== 'active') {
        throw new BadRequestException('商品规格不可下单');
      }
      if (sku.stock < quantity) {
        throw new BadRequestException(`${product.name} 库存不足`);
      }

      merchantIds.add(product.merchant_id);
      const amount = Number((sku.price * quantity).toFixed(2));
      totalAmount = Number((totalAmount + amount).toFixed(2));

      return {
        product,
        sku,
        quantity,
        amount,
      };
    });

    if (merchantIds.size !== 1) {
      throw new BadRequestException('一个订单只能包含同一商家的商品');
    }

    const merchantId = Array.from(merchantIds)[0];

    const savedOrderId = await this.dataSource.transaction(async (manager) => {
      const order = await manager.save(
        ShopOrder,
        manager.create(ShopOrder, {
          order_no: this.buildOrderNo(),
          user_id: userId,
          merchant_id: merchantId,
          status: 'pending_confirmation',
          total_amount: totalAmount,
          receiver_name: address.receiver_name,
          receiver_phone: address.receiver_phone,
          receiver_address: address.receiver_address,
          remark: input.remark?.trim() || null,
        }),
      );

      for (const item of normalizedItems) {
        const currentSku = await manager.findOne(ProductSku, {
          where: { id: item.sku.id, product_id: item.product.id },
        });
        if (!currentSku || currentSku.status !== 'active') {
          throw new BadRequestException('商品规格不可下单');
        }
        if (currentSku.stock < item.quantity) {
          throw new BadRequestException(`${item.product.name} 库存不足`);
        }

        currentSku.stock -= item.quantity;
        await manager.save(ProductSku, currentSku);

        await manager.save(
          OrderItem,
          manager.create(OrderItem, {
            order_id: order.id,
            product_id: item.product.id,
            sku_id: item.sku.id,
            product_name_snapshot: item.product.name,
            sku_snapshot: `${item.sku.spec_name}: ${item.sku.spec_value}`,
            price: item.sku.price,
            quantity: item.quantity,
            amount: item.amount,
          }),
        );
      }

      return order.id;
    });

    await this.refreshProductSummaries(productIds);
    return this.getOrderById(userId, savedOrderId);
  }

  async getOrders(userId: number) {
    const orders = await this.orderRepository.find({
      where: { user_id: userId },
      relations: ['merchant', 'items'],
      order: { created_at: 'DESC', id: 'DESC' },
    });

    return orders.map((item) => this.formatOrder(item, true));
  }

  async getOrderById(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { id, user_id: userId },
      relations: ['merchant', 'items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.formatOrder(order, true);
  }

  async payOrder(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { id, user_id: userId },
      relations: ['merchant', 'items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.status !== 'pending_confirmation') {
      throw new BadRequestException('当前订单状态不支持支付');
    }

    order.status = 'processing';
    await this.orderRepository.save(order);
    return this.formatOrder(order, true);
  }

  async cancelOrder(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (!USER_CANCELABLE_STATUS.includes(order.status as (typeof USER_CANCELABLE_STATUS)[number])) {
      throw new BadRequestException('当前订单状态不支持取消');
    }

    const orderItems = await this.orderItemRepository.find({
      where: { order_id: order.id },
    });

    await this.dataSource.transaction(async (manager) => {
      order.status = 'cancelled';
      await manager.save(ShopOrder, order);

      for (const item of orderItems) {
        const sku = await manager.findOne(ProductSku, {
          where: { id: item.sku_id, product_id: item.product_id },
        });
        if (!sku) {
          continue;
        }
        sku.stock += item.quantity;
        await manager.save(ProductSku, sku);
      }
    });

    await this.refreshProductSummaries(orderItems.map((item) => item.product_id));
    return this.getOrderById(userId, id);
  }

  async getAdminOrders(
    params: { keyword?: string; page: number; pageSize: number },
    actor: OrderActor,
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('shop_order')
      .leftJoinAndSelect('shop_order.merchant', 'merchant')
      .leftJoinAndSelect('shop_order.items', 'items')
      .where('1 = 1');

    if (actor.account_type === 'merchant') {
      if (!actor.merchant_id) {
        throw new ForbiddenException('商家账号未绑定商家主体');
      }
      queryBuilder.andWhere('shop_order.merchant_id = :merchantId', {
        merchantId: actor.merchant_id,
      });
    }

    if (params.keyword?.trim()) {
      const keyword = `%${params.keyword.trim()}%`;
      queryBuilder.andWhere(
        '(shop_order.order_no LIKE :keyword OR shop_order.receiver_name LIKE :keyword OR merchant.name LIKE :keyword)',
        { keyword },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('shop_order.created_at', 'DESC')
      .addOrderBy('shop_order.id', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.formatOrder(item, true)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminOrderById(id: number, actor: OrderActor) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['merchant', 'items', 'user'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (actor.account_type === 'merchant' && order.merchant_id !== actor.merchant_id) {
      throw new ForbiddenException('无权查看该订单');
    }

    return {
      ...this.formatOrder(order, true),
      user: order.user
        ? {
            id: order.user.id,
            phone: order.user.phone,
            nickname: order.user.nickname,
          }
        : null,
    };
  }

  async updateAdminOrderStatus(id: number, status: string, actor: OrderActor) {
    const order = await this.orderRepository.findOne({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (actor.account_type === 'merchant' && order.merchant_id !== actor.merchant_id) {
      throw new ForbiddenException('无权修改该订单');
    }
    if (order.status === 'pending_confirmation' && status === 'processing') {
      throw new BadRequestException('待支付订单只能由用户发起模拟支付');
    }

    this.assertOrderTransition(order.status, status);
    const orderItems = await this.orderItemRepository.find({
      where: { order_id: order.id },
    });

    await this.dataSource.transaction(async (manager) => {
      if (status === 'cancelled') {
        for (const item of orderItems) {
          const sku = await manager.findOne(ProductSku, {
            where: { id: item.sku_id, product_id: item.product_id },
          });
          if (!sku) {
            continue;
          }
          sku.stock += item.quantity;
          await manager.save(ProductSku, sku);
        }
      }

      order.status = status;
      await manager.save(ShopOrder, order);
    });

    if (status === 'cancelled') {
      await this.refreshProductSummaries(orderItems.map((item) => item.product_id));
    }

    return this.getAdminOrderById(id, actor);
  }
}
