import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { Product } from '../shop/product.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ name: 'cover_image', type: 'varchar', length: 255, nullable: true })
  cover_image: string | null;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  favorites: number;

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'knowledge' })
  kind: string;

  @Column({ type: 'boolean', default: false })
  is_recommended: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recommendation_reason: string | null;

  @ManyToOne(() => Product, { nullable: true })
  linked_product: Product | null;

  @Column({ type: 'int', nullable: true })
  linked_product_id: number | null;

  @ManyToOne(() => Category, category => category.articles)
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
