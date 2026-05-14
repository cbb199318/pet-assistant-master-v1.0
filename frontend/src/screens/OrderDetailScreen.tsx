import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, Order, shopApi } from '../services/api';
import { formatCurrency, getOrderStatusLabel } from '../utils/shop';

const OrderDetailScreen = ({ navigation, route }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    try {
      const response = await shopApi.getOrderDetail(Number(orderId));
      setOrder(response);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取订单详情失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDetail();
    }, [orderId]),
  );

  const handleCancel = () => {
    if (!order) {
      return;
    }

    Alert.alert('取消订单', '确定取消这个订单吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '取消订单',
        style: 'destructive',
        onPress: async () => {
          try {
            await shopApi.cancelOrder(order.id);
            await loadDetail();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '取消订单失败'));
          }
        },
      },
    ]);
  };

  const handlePay = async () => {
    if (!order) {
      return;
    }

    try {
      await shopApi.payOrder(order.id);
      await loadDetail();
      Alert.alert('支付成功', '已完成模拟支付，商家可以开始处理订单。');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '支付失败'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>订单详情</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : !order ? (
        <View style={styles.loadingState}>
          <Text style={styles.emptyText}>订单不存在</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>订单编号</Text>
              <Text style={styles.value}>{order.order_no}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>订单状态</Text>
              <Text style={styles.statusValue}>{getOrderStatusLabel(order.status)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>商家</Text>
              <Text style={styles.value}>{order.merchant?.name || '平台自营'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>订单备注</Text>
              <Text style={styles.value}>{order.remark || '无'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>商品明细</Text>
            {(order.items || []).map((item) => (
              <View style={styles.itemCard} key={item.id}>
                <Text style={styles.itemTitle}>{item.product_name_snapshot}</Text>
                <Text style={styles.itemMeta}>{item.sku_snapshot}</Text>
                <View style={styles.row}>
                  <Text style={styles.itemMeta}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </Text>
                  <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>收货信息</Text>
            <Text style={styles.infoText}>{order.receiver_name} · {order.receiver_phone}</Text>
            <Text style={styles.infoText}>{order.receiver_address}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>订单总额</Text>
              <Text style={styles.totalAmount}>{formatCurrency(order.total_amount)}</Text>
            </View>
            {order.status === 'pending_confirmation' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                  <Text style={styles.payButtonText}>立即支付</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>取消订单</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f4' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#748077' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#6f7a73' },
  value: { color: '#243029', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  statusValue: { color: '#2f7d4f', fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#243029' },
  itemCard: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#f4f7f5' },
  itemTitle: { color: '#243029', fontWeight: '700' },
  itemMeta: { marginTop: 6, color: '#6d7a72' },
  itemAmount: { color: '#243029', fontWeight: '700' },
  infoText: { marginTop: 10, color: '#516057', lineHeight: 22 },
  totalAmount: { color: '#2f7d4f', fontSize: 22, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  payButton: { flex: 1, backgroundColor: '#2f7d4f', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700' },
  cancelButton: { flex: 1, backgroundColor: '#fff2f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { color: '#d45645', fontWeight: '700' },
});

export default OrderDetailScreen;
