import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, Product, ProductSku, resolveMediaUrl, shopApi } from '../services/api';
import { formatCurrency } from '../utils/shop';

const ProductDetailScreen = ({ navigation, route }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const selectedSku = useMemo<ProductSku | undefined>(
    () => product?.skus?.find((item) => item.id === selectedSkuId) || product?.skus?.[0],
    [product, selectedSkuId],
  );

  const loadDetail = async () => {
    try {
      const response = await shopApi.getProductDetail(Number(productId));
      setProduct(response);
      const firstSkuId = response.skus?.[0]?.id ?? null;
      setSelectedSkuId(firstSkuId);
      setQuantity(1);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取商品详情失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDetail();
    }, [productId]),
  );

  const handleCheckout = () => {
    if (!product || !selectedSku) {
      Alert.alert('提示', '当前商品规格不可用');
      return;
    }

    navigation.navigate('OrderConfirm', {
      productId: product.id,
      skuId: selectedSku.id,
      quantity,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>商品详情</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : !product ? (
        <View style={styles.loadingState}>
          <Text style={styles.emptyText}>商品不存在</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {product.cover_image ? (
              <Image source={{ uri: resolveMediaUrl(product.cover_image) }} style={styles.coverImage} />
            ) : null}

            <View style={styles.card}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.priceText}>
                {selectedSku ? formatCurrency(selectedSku.price) : `¥${product.price_range}`}
              </Text>
              <Text style={styles.metaText}>
                {product.merchant?.name || '平台自营'} · 库存 {selectedSku?.stock ?? product.stock}
              </Text>
              <Text style={styles.descriptionText}>{product.description || '暂无商品描述'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>选择规格</Text>
              <View style={styles.skuWrap}>
                {(product.skus || []).map((sku) => (
                  <TouchableOpacity
                    key={sku.id}
                    style={[
                      styles.skuChip,
                      selectedSku?.id === sku.id && styles.skuChipActive,
                    ]}
                    onPress={() => setSelectedSkuId(sku.id)}
                  >
                    <Text
                      style={[
                        styles.skuChipText,
                        selectedSku?.id === sku.id && styles.skuChipTextActive,
                      ]}
                    >
                      {sku.spec_value}
                    </Text>
                    <Text
                      style={[
                        styles.skuChipMeta,
                        selectedSku?.id === sku.id && styles.skuChipTextActive,
                      ]}
                    >
                      {formatCurrency(sku.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>购买数量</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity((prev) => {
                      const maxStock = selectedSku?.stock ?? product.stock ?? 1;
                      return Math.min(maxStock, prev + 1);
                    })
                  }
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>立即下单</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f3' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 10 },
  backButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6f7d74' },
  coverImage: { width: '100%', height: 260, backgroundColor: '#e7ece8' },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  productTitle: { fontSize: 24, fontWeight: '700', color: '#243029' },
  priceText: { marginTop: 10, fontSize: 26, fontWeight: '800', color: '#2f7d4f' },
  metaText: { marginTop: 8, color: '#7a867f' },
  descriptionText: { marginTop: 14, lineHeight: 24, color: '#45524b' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#243029' },
  skuWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  skuChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#eff4f0',
    minWidth: 110,
  },
  skuChipActive: { backgroundColor: '#2f7d4f' },
  skuChipText: { color: '#314039', fontWeight: '700' },
  skuChipMeta: { marginTop: 6, color: '#738078', fontSize: 12 },
  skuChipTextActive: { color: '#fff' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#edf3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: { fontSize: 22, fontWeight: '700', color: '#2f7d4f' },
  quantityValue: { marginHorizontal: 18, minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#ffffffee',
    borderTopWidth: 1,
    borderTopColor: '#e4ebe5',
  },
  checkoutButton: {
    backgroundColor: '#2f7d4f',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default ProductDetailScreen;
