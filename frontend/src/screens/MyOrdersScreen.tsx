import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, Order, shopApi } from '../services/api';
import { formatCurrency, getOrderStatusLabel } from '../utils/shop';

const MyOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const response = await shopApi.getOrders();
      setOrders(response);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取订单失败'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, []),
  );

  const handleCancel = (order: Order) => {
    Alert.alert('取消订单', '确定取消这个订单吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '取消订单',
        style: 'destructive',
        onPress: async () => {
          try {
            await shopApi.cancelOrder(order.id);
            await loadOrders();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '取消订单失败'));
          }
        },
      },
    ]);
  };

  const handlePay = async (order: Order) => {
    try {
      await shopApi.payOrder(order.id);
      await loadOrders();
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
        <Text style={styles.title}>我的订单</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadOrders();
          }} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>还没有订单</Text>
              <Text style={styles.emptyText}>从知识里的用品推荐进入商品详情后，就可以直接下单。</Text>
            </View>
          ) : (
            orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              >
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderNo}>{order.order_no}</Text>
                  <Text style={styles.orderStatus}>{getOrderStatusLabel(order.status)}</Text>
                </View>
                <Text style={styles.orderMeta}>{order.merchant?.name || '平台自营'}</Text>
                <Text style={styles.orderMeta}>{order.items?.[0]?.product_name_snapshot || '商品'}</Text>
                <Text style={styles.orderMeta}>
                  共 {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} 件商品
                </Text>
                <View style={styles.orderBottomRow}>
                  <Text style={styles.orderAmount}>{formatCurrency(order.total_amount)}</Text>
                  <View style={styles.inlineActions}>
                    {order.status === 'pending_confirmation' ? (
                      <>
                        <TouchableOpacity style={styles.payButton} onPress={() => handlePay(order)}>
                          <Text style={styles.payButtonText}>去支付</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(order)}>
                          <Text style={styles.cancelButtonText}>取消订单</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  emptyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#243029' },
  emptyText: { marginTop: 8, color: '#748077', textAlign: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { color: '#243029', fontWeight: '700', flex: 1, marginRight: 10 },
  orderStatus: { color: '#2f7d4f', fontWeight: '700' },
  orderMeta: { marginTop: 8, color: '#607067' },
  orderBottomRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderAmount: { color: '#243029', fontWeight: '800', fontSize: 18 },
  inlineActions: { flexDirection: 'row', gap: 8 },
  payButton: { backgroundColor: '#2f7d4f', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  payButtonText: { color: '#fff', fontWeight: '700' },
  cancelButton: { backgroundColor: '#fff2f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  cancelButtonText: { color: '#d45645', fontWeight: '700' },
});

export default MyOrdersScreen;
