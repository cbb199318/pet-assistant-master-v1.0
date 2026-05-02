import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { careApi, getApiErrorMessage } from '../services/api';

const CareManagementScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pet } = route.params as { pet: { id: number; name: string } };
  const [cares, setCares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCares = async () => {
    try {
      const response = await careApi.getCares(pet.id);
      setCares(response);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取护理记录失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCares();
    }, [pet.id]),
  );

  const getCareTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      feeding: '喂食',
      walking: '遛狗',
      grooming: '美容',
      bathing: '洗澡',
      play: '玩耍',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const handleDeleteCare = async (id: number) => {
    Alert.alert('确认删除', '确定删除这条护理记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await careApi.deleteCare(id);
            await fetchCares();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除护理记录失败'));
          }
        },
      },
    ]);
  };

  const renderCareItem = ({ item }: any) => (
    <View style={styles.careItem}>
      <View style={styles.careHeader}>
        <Text style={styles.careType}>{getCareTypeLabel(item.type)}</Text>
        <Text style={styles.careDate}>{new Date(item.date).toLocaleDateString('zh-CN')}</Text>
      </View>
      {item.description ? <Text style={styles.careDescription}>{item.description}</Text> : null}
      {item.time ? <Text style={styles.careDetail}>时间：{item.time}</Text> : null}
      {item.duration ? <Text style={styles.careDetail}>持续时间：{item.duration} 分钟</Text> : null}
      {item.quantity ? <Text style={styles.careDetail}>数量：{item.quantity}</Text> : null}
      {item.notes ? <Text style={styles.careNotes}>备注：{item.notes}</Text> : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditCare', { pet_id: pet.id, care: item })}
        >
          <Text style={styles.actionText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => handleDeleteCare(item.id)}
        >
          <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{pet.name}的护理记录</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCare', { pet_id: pet.id })}
          >
            <Text style={styles.addButtonText}>添加记录</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      ) : cares.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无护理记录</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddCare', { pet_id: pet.id })}
          >
            <Text style={styles.addFirstButtonText}>添加第一条记录</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cares}
          renderItem={renderCareItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 12 },
  backButton: { padding: 10 },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#4CAF50', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#999', marginBottom: 20 },
  addFirstButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstButtonText: { color: '#fff', fontWeight: 'bold' },
  listContent: { padding: 16 },
  careItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  careHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  careType: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  careDate: { fontSize: 14, color: '#666' },
  careDescription: { fontSize: 16, color: '#333', marginBottom: 8 },
  careDetail: { fontSize: 14, color: '#666', marginBottom: 4 },
  careNotes: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  actionButton: { backgroundColor: '#edf3ee', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#335c47', fontWeight: '600' },
  deleteAction: { backgroundColor: '#faecea' },
  deleteText: { color: '#b24a3e' },
});

export default CareManagementScreen;
