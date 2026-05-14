import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, Product, ProductSku, resolveMediaUrl, shopApi, UserAddress } from '../services/api';
import { formatCurrency } from '../utils/shop';

const OrderConfirmScreen = ({ navigation, route }: any) => {
  const { productId, skuId, quantity: initialQuantity = 1 } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(Number(skuId) || null);
  const [quantity, setQuantity] = useState(Number(initialQuantity) || 1);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedSku = useMemo<ProductSku | undefined>(
    () => product?.skus?.find((item) => item.id === selectedSkuId) || product?.skus?.[0],
    [product, selectedSkuId],
  );

  const totalAmount = useMemo(
    () => Number(((selectedSku?.price || 0) * quantity).toFixed(2)),
    [quantity, selectedSku],
  );

  const loadData = async () => {
    try {
      const [productResponse, addressResponse] = await Promise.all([
        shopApi.getProductDetail(Number(productId)),
        shopApi.getAddresses(),
      ]);

      setProduct(productResponse);
      setAddresses(addressResponse);
      setSelectedSkuId(Number(skuId) || productResponse.skus?.[0]?.id || null);
      setSelectedAddressId(addressResponse.find((item) => item.is_default)?.id || addressResponse[0]?.id || null);
      setQuantity(Math.max(1, Number(initialQuantity) || 1));
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '加载确认订单信息失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [productId, skuId, initialQuantity]),
  );

  const handleSubmit = async () => {
    if (!product || !selectedSku) {
      Alert.alert('提示', '商品信息还未准备好');
      return;
    }

    if (!selectedAddressId) {
      Alert.alert('提示', '请先选择收货地址');
      return;
    }

    try {
      setSubmitting(true);
      const order = await shopApi.createOrder({
        addressId: selectedAddressId,
        remark: remark.trim(),
        items: [
          {
            productId: product.id,
            skuId: selectedSku.id,
            quantity,
          },
        ],
      });

      navigation.replace('OrderDetail', { orderId: order.id });
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '提交订单失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>确认订单</Text>
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
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>收货地址</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddressManagement')}>
                  <Text style={styles.linkText}>管理地址</Text>
                </TouchableOpacity>
              </View>
              {addresses.length === 0 ? (
                <View style={styles.emptyAddressCard}>
                  <Text style={styles.emptyText}>还没有收货地址</Text>
                  <TouchableOpacity style={styles.inlineButton} onPress={() => navigation.navigate('AddressManagement')}>
                    <Text style={styles.inlineButtonText}>去新增</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address.id && styles.addressCardActive,
                    ]}
                    onPress={() => setSelectedAddressId(address.id)}
                  >
                    <Text style={styles.addressName}>
                      {address.receiver_name} · {address.receiver_phone}
                    </Text>
                    <Text style={styles.addressText}>{address.receiver_address}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>商品信息</Text>
              <View style={styles.productRow}>
                {product.cover_image ? (
                  <Image source={{ uri: resolveMediaUrl(product.cover_image) }} style={styles.productImage} />
                ) : null}
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productMeta}>{product.merchant?.name || '平台自营'}</Text>
                  <Text style={styles.productMeta}>
                    规格：{selectedSku?.spec_name} {selectedSku?.spec_value}
                  </Text>
                  <Text style={styles.priceText}>{formatCurrency(selectedSku?.price)}</Text>
                </View>
              </View>
              <View style={styles.quantityRow}>
                <Text style={styles.label}>购买数量</Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prev) => Math.min(selectedSku?.stock || 1, prev + 1))}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>订单备注</Text>
              <TextInput
                style={styles.remarkInput}
                value={remark}
                onChangeText={setRemark}
                placeholder="选填，给商家留言"
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>实付款</Text>
              <Text style={styles.footerAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? '提交中...' : '提交订单'}</Text>
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
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6e7b74' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#243029' },
  linkText: { color: '#2f7d4f', fontWeight: '700' },
  emptyAddressCard: { marginTop: 14, alignItems: 'center', gap: 12 },
  inlineButton: { backgroundColor: '#edf3ee', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  inlineButtonText: { color: '#2f7d4f', fontWeight: '700' },
  addressCard: { marginTop: 12, borderRadius: 14, padding: 14, backgroundColor: '#f2f5f3' },
  addressCardActive: { backgroundColor: '#e9f5ec', borderWidth: 1, borderColor: '#75b88b' },
  addressName: { color: '#243029', fontWeight: '700' },
  addressText: { marginTop: 8, lineHeight: 21, color: '#536057' },
  productRow: { flexDirection: 'row', marginTop: 14 },
  productImage: { width: 92, height: 92, borderRadius: 16, backgroundColor: '#eef2ef' },
  productInfo: { flex: 1, marginLeft: 14 },
  productTitle: { fontSize: 16, fontWeight: '700', color: '#243029' },
  productMeta: { marginTop: 6, color: '#738078' },
  priceText: { marginTop: 8, color: '#2f7d4f', fontWeight: '800', fontSize: 18 },
  quantityRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#45524b', fontWeight: '600' },
  quantityStepper: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#edf2ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { color: '#2f7d4f', fontSize: 20, fontWeight: '700' },
  quantityValue: { marginHorizontal: 16, minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  remarkInput: {
    marginTop: 14,
    minHeight: 92,
    borderRadius: 14,
    backgroundColor: '#f3f6f4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { color: '#738078', fontSize: 12 },
  footerAmount: { color: '#2f7d4f', fontWeight: '800', fontSize: 24, marginTop: 4 },
  submitButton: { backgroundColor: '#2f7d4f', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default OrderConfirmScreen;
