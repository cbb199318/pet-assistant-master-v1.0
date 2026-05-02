import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getApiErrorMessage, healthApi } from '../services/api';

const HealthManagementScreen = ({ navigation, route }: any) => {
  const { pet } = route.params;
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [dewormings, setDewormings] = useState<any[]>([]);
  const [checkups, setCheckups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthRecords = async () => {
    try {
      const [vaccinationResponse, dewormingResponse, checkupResponse] = await Promise.all([
        healthApi.getVaccinations(pet.id),
        healthApi.getDewormings(pet.id),
        healthApi.getCheckups(pet.id),
      ]);
      setVaccinations(vaccinationResponse);
      setDewormings(dewormingResponse);
      setCheckups(checkupResponse);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取健康记录失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHealthRecords();
    }, [pet.id]),
  );

  const handleDelete = async (
    type: 'vaccination' | 'deworming' | 'checkup',
    recordId: number,
  ) => {
    Alert.alert('确认删除', '确定删除这条健康记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            if (type === 'vaccination') {
              await healthApi.deleteVaccination(recordId, pet.id);
            } else if (type === 'deworming') {
              await healthApi.deleteDeworming(recordId, pet.id);
            } else {
              await healthApi.deleteCheckup(recordId, pet.id);
            }
            await fetchHealthRecords();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除失败'));
          }
        },
      },
    ]);
  };

  const renderActions = (editRoute: string, record: any, type: 'vaccination' | 'deworming' | 'checkup') => (
    <View style={styles.recordActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate(editRoute, { pet, record })}
      >
        <Text style={styles.actionText}>编辑</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteAction]}
        onPress={() => handleDelete(type, record.id)}
      >
        <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>健康管理</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petDetails}>
          {pet.species || '宠物'} · {pet.breed || '未知品种'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text>加载中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>疫苗接种</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddVaccination', { pet })}
              >
                <Text style={styles.addButtonText}>+ 添加</Text>
              </TouchableOpacity>
            </View>
            {vaccinations.length === 0 ? (
              <Text style={styles.emptyText}>暂无疫苗接种记录</Text>
            ) : (
              vaccinations.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <Text style={styles.recordTitle}>{item.vaccine_name}</Text>
                  <Text style={styles.recordMeta}>
                    接种日期: {new Date(item.vaccination_date).toLocaleDateString()}
                  </Text>
                  {item.next_date ? (
                    <Text style={styles.recordMeta}>
                      下次接种: {new Date(item.next_date).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {item.notes ? <Text style={styles.recordNotes}>备注: {item.notes}</Text> : null}
                  {renderActions('EditVaccination', item, 'vaccination')}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>驱虫记录</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddDeworming', { pet })}
              >
                <Text style={styles.addButtonText}>+ 添加</Text>
              </TouchableOpacity>
            </View>
            {dewormings.length === 0 ? (
              <Text style={styles.emptyText}>暂无驱虫记录</Text>
            ) : (
              dewormings.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <Text style={styles.recordTitle}>{item.product_name}</Text>
                  <Text style={styles.recordMeta}>
                    类型: {item.type === 'internal' ? '体内' : item.type === 'external' ? '体外' : '体内外'}
                  </Text>
                  <Text style={styles.recordMeta}>
                    驱虫日期: {new Date(item.deworming_date).toLocaleDateString()}
                  </Text>
                  {item.next_date ? (
                    <Text style={styles.recordMeta}>
                      下次驱虫: {new Date(item.next_date).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {item.notes ? <Text style={styles.recordNotes}>备注: {item.notes}</Text> : null}
                  {renderActions('EditDeworming', item, 'deworming')}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>体检记录</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddCheckup', { pet })}
              >
                <Text style={styles.addButtonText}>+ 添加</Text>
              </TouchableOpacity>
            </View>
            {checkups.length === 0 ? (
              <Text style={styles.emptyText}>暂无体检记录</Text>
            ) : (
              checkups.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <Text style={styles.recordTitle}>{item.hospital}</Text>
                  <Text style={styles.recordMeta}>
                    体检日期: {new Date(item.checkup_date).toLocaleDateString()}
                  </Text>
                  {item.doctor ? <Text style={styles.recordMeta}>医生: {item.doctor}</Text> : null}
                  {item.weight ? <Text style={styles.recordMeta}>体重: {item.weight} kg</Text> : null}
                  {item.temperature ? (
                    <Text style={styles.recordMeta}>体温: {item.temperature} ℃</Text>
                  ) : null}
                  {item.diagnosis ? <Text style={styles.recordNotes}>诊断: {item.diagnosis}</Text> : null}
                  {item.recommendations ? (
                    <Text style={styles.recordNotes}>建议: {item.recommendations}</Text>
                  ) : null}
                  {renderActions('EditCheckup', item, 'checkup')}
                </View>
              ))
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { color: '#fff', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  petInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  petDetails: { fontSize: 14, color: '#666' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, minHeight: 0, padding: 20 },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  emptyText: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  recordMeta: { fontSize: 14, color: '#666', marginBottom: 4 },
  recordNotes: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20 },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  actionButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#edf3ee' },
  actionText: { color: '#325d46', fontWeight: '600' },
  deleteAction: { backgroundColor: '#faecea' },
  deleteText: { color: '#b24a3e' },
});

export default HealthManagementScreen;
