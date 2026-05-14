import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShopOrder } from './order.entity';
import { Product } from './product.entity';
import { ProductSku } from './product-sku.entity';

@Entity('shop_order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShopOrder, order => order.items)
  order: ShopOrder;

  @Column({ type: 'int' })
  order_id: number;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => ProductSku)
  sku: ProductSku;

  @Column({ type: 'int' })
  sku_id: number;

  @Column({ type: 'varchar', length: 120 })
  product_name_snapshot: string;

  @Column({ type: 'varchar', length: 120 })
  sku_snapshot: string;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
