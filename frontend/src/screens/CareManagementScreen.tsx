import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PetAvatar from '../components/PetAvatar';
import { careApi, getApiErrorMessage, type PetSummary } from '../services/api';

const CareManagementScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pet } = route.params as { pet: PetSummary };
  const [cares, setCares] = useState<any[]>([]);
  const [todayPlans, setTodayPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCares = async () => {
    try {
      const [careResponse, todayPlanResponse] = await Promise.all([
        careApi.getCares(pet.id),
        careApi.getTodayPlans(pet.id),
      ]);
      setCares(careResponse);
      setTodayPlans(todayPlanResponse);
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

  const getRepeatLabel = (repeatPattern?: string) => {
    const labelMap: Record<string, string> = {
      daily: '每天',
      weekdays: '工作日',
      weekly: '每周',
      custom: '自定义',
    };
    return repeatPattern ? labelMap[repeatPattern] || repeatPattern : '未设置';
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

  const plans = cares.filter((item) => item.mode === 'plan');
  const records = cares.filter((item) => item.mode !== 'plan');

  const renderPlanItem = (item: any) => (
    <View key={item.id} style={styles.planCard}>
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.careType}>{getCareTypeLabel(item.type)}</Text>
          <Text style={styles.planSubtext}>
            {item.time || item.reminder_time || '未设置时间'} · {getRepeatLabel(item.repeat_pattern)}
          </Text>
          {item.last_completed_at ? (
            <Text style={styles.planSubtext}>
              最近完成：{new Date(item.last_completed_at).toLocaleDateString('zh-CN')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.planBadge, item.completedToday && styles.planBadgeDone]}>
          <Text style={[styles.planBadgeText, item.completedToday && styles.planBadgeTextDone]}>
            {item.completedToday ? '今日已完成' : '计划中'}
          </Text>
        </View>
      </View>
      {item.description ? <Text style={styles.careDescription}>{item.description}</Text> : null}
      {item.quantity ? <Text style={styles.careDetail}>数量：{item.quantity}</Text> : null}
      {item.notes ? <Text style={styles.careNotes}>备注：{item.notes}</Text> : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, item.completedToday && styles.actionButtonDisabled]}
          disabled={item.completedToday}
          onPress={async () => {
            try {
              await careApi.completeTodayPlan(item.id);
              await fetchCares();
            } catch (error: any) {
              Alert.alert('错误', getApiErrorMessage(error, '更新计划状态失败'));
            }
          }}
        >
          <Text style={styles.actionText}>{item.completedToday ? '今日已完成' : '完成今日计划'}</Text>
        </TouchableOpacity>
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.addButton, styles.secondaryAddButton]}
              onPress={() => navigation.navigate('AddCare', { pet_id: pet.id, initialMode: 'plan' })}
            >
              <Text style={[styles.addButtonText, styles.secondaryAddButtonText]}>添加计划</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddCare', { pet_id: pet.id, initialMode: 'record' })}
            >
              <Text style={styles.addButtonText}>添加记录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.petInfoCard}>
        <PetAvatar pet={pet} size={80} />
        <View style={styles.petInfoText}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petMeta}>
            {[pet.species || '宠物', pet.breed || '未知品种'].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.petHint}>这里集中查看这只宠物的护理计划、今日待办和历史留痕。</Text>
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
            onPress={() => navigation.navigate('AddCare', { pet_id: pet.id, initialMode: 'plan' })}
          >
            <Text style={styles.addFirstButtonText}>先创建护理计划</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.listContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>今日待办</Text>
              <Text style={styles.sectionHint}>计划 / 执行 / 留痕</Text>
            </View>
            {todayPlans.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>今天没有待执行的护理计划</Text>
              </View>
            ) : (
              todayPlans.map((item) => (
                <View key={`today-${item.id}`} style={styles.todayPlanCard}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.careType}>{getCareTypeLabel(item.type)}</Text>
                      <Text style={styles.planSubtext}>
                        {item.time || item.reminder_time || '未设置时间'} · {getRepeatLabel(item.repeat_pattern)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.todayDoneButton, item.completedToday && styles.todayDoneButtonDisabled]}
                      disabled={item.completedToday}
                      onPress={async () => {
                        try {
                          await careApi.completeTodayPlan(item.id);
                          await fetchCares();
                        } catch (error: any) {
                          Alert.alert('错误', getApiErrorMessage(error, '完成今日计划失败'));
                        }
                      }}
                    >
                      <Text style={[styles.todayDoneButtonText, item.completedToday && styles.todayDoneButtonTextDisabled]}>
                        {item.completedToday ? '已完成' : '一键完成'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {item.description ? <Text style={styles.careDescription}>{item.description}</Text> : null}
                  {item.notes ? <Text style={styles.careNotes}>备注：{item.notes}</Text> : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>定时计划</Text>
              <Text style={styles.sectionHint}>适合喂食、遛狗等高频护理</Text>
            </View>
            {plans.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>还没有护理计划</Text>
              </View>
            ) : (
              plans.map((item) => renderPlanItem(item))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>历史记录</Text>
              <Text style={styles.sectionHint}>单次完成后留档</Text>
            </View>
            {records.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>还没有单次护理记录</Text>
              </View>
            ) : (
              records.map((item) => <View key={item.id}>{renderCareItem({ item })}</View>)
            )}
          </View>
        </ScrollView>
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
    marginLeft: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  backButton: { padding: 10 },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', gap: 10 },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#4CAF50', fontWeight: 'bold' },
  secondaryAddButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryAddButtonText: {
    color: '#fff',
  },
  petInfoCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eeea',
  },
  petInfoText: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#243029',
    marginBottom: 5,
  },
  petMeta: {
    fontSize: 14,
    color: '#627065',
    marginBottom: 6,
  },
  petHint: {
    fontSize: 13,
    color: '#728077',
    lineHeight: 18,
  },
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
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#243029', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#75837b' },
  emptySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  emptySectionText: { color: '#88958e' },
  todayPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dce9df',
  },
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
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planSubtext: {
    marginTop: 4,
    color: '#6f7c75',
    fontSize: 13,
  },
  planBadge: {
    backgroundColor: '#e8f5eb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  planBadgeDone: {
    backgroundColor: '#edf1ef',
  },
  planBadgeText: {
    color: '#2f7d4f',
    fontSize: 12,
    fontWeight: '700',
  },
  planBadgeTextDone: {
    color: '#6a7770',
  },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  actionButton: { backgroundColor: '#edf3ee', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionButtonDisabled: { opacity: 0.55 },
  actionText: { color: '#335c47', fontWeight: '600' },
  deleteAction: { backgroundColor: '#faecea' },
  deleteText: { color: '#b24a3e' },
  todayDoneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayDoneButtonDisabled: {
    backgroundColor: '#edf3ee',
  },
  todayDoneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  todayDoneButtonTextDisabled: {
    color: '#5f7268',
  },
});

export default CareManagementScreen;
