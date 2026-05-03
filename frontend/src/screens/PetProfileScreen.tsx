import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PetAvatar from '../components/PetAvatar';
import { getApiErrorMessage, petApi, type PetSummary } from '../services/api';
import { resolvePrimaryPet, setPrimaryPetId } from '../utils/primaryPet';

const PetProfileScreen = ({ navigation, route }: any) => {
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [currentPet, setCurrentPet] = useState<PetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const canGoBack = navigation.canGoBack();

  useFocusEffect(
    React.useCallback(() => {
      void fetchPets();
    }, [route.params?.pet?.id]),
  );

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '未设置';
    }

    return new Date(value).toLocaleDateString('zh-CN');
  };

  const getAgeText = (birthday?: string | null) => {
    if (!birthday) {
      return '生日未设置';
    }

    const now = new Date();
    const birth = new Date(birthday);
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years <= 0) {
      return `${Math.max(months, 1)}个月`;
    }

    if (months === 0) {
      return `${years}岁`;
    }

    return `${years}岁${months}个月`;
  };

  const fetchPets = async () => {
    try {
      const response = await petApi.getPets();
      setPets(response);

      const preferredPetId = currentPet?.id || route.params?.pet?.id;
      const nextPet = await resolvePrimaryPet(response, preferredPetId);
      setCurrentPet(nextPet);
    } catch (error: any) {
      Alert.alert('错误', '获取宠物列表失败: ' + getApiErrorMessage(error, '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  const handleEditPet = (pet: PetSummary) => {
    navigation.navigate('EditPet', { pet });
  };

  const handleSwitchPet = async (pet: PetSummary) => {
    setCurrentPet(pet);
    setSwitcherVisible(false);
    await setPrimaryPetId(pet.id);
  };

  const handleDeletePet = (pet: PetSummary) => {
    Alert.alert('确认删除', `确定要删除 ${pet.name} 的宠物档案吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await petApi.deletePet(pet.id);
            Alert.alert('成功', '宠物档案已删除');
            await fetchPets();
          } catch (error: any) {
            Alert.alert('错误', '删除宠物档案失败: ' + getApiErrorMessage(error, '未知错误'));
          }
        },
      },
    ]);
  };

  const otherPets = currentPet ? pets.filter((pet) => pet.id !== currentPet.id) : pets;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <View style={styles.headerContent}>
          <Text style={styles.title}>宠物档案</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
            <Text style={styles.addButtonText}>+ 添加宠物</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!currentPet ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>还没有添加宠物</Text>
            <Text style={styles.emptyHint}>添加第一只宠物后，首页和健康护理入口都会围绕它展开。</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddPet}>
              <Text style={styles.emptyButtonText}>立即添加</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <Text style={styles.currentBadge}>当前主宠物</Text>
                {pets.length > 1 ? (
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setSwitcherVisible(true)}
                  >
                    <Text style={styles.switchButtonText}>切换宠物</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.heroContent}>
                <PetAvatar pet={currentPet} size={108} borderColor="#ffffff" borderWidth={4} />
                <View style={styles.heroInfo}>
                  <Text style={styles.petName}>{currentPet.name}</Text>
                  <Text style={styles.petMeta}>
                    {[currentPet.species, currentPet.breed || '未知品种'].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.petMeta}>
                    {currentPet.gender === 'male' ? '公' : currentPet.gender === 'female' ? '母' : '性别未设置'}
                    {' · '}
                    {getAgeText(currentPet.birthday)}
                  </Text>
                  <Text style={styles.petMeta}>
                    {currentPet.sterilized ? '已绝育' : '未绝育'}
                    {' · '}
                    生日 {formatDate(currentPet.birthday)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>当前宠物操作</Text>
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={() => handleEditPet(currentPet)}
                >
                  <Text style={styles.inlineButtonText}>编辑当前宠物</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineButton, styles.deleteButton]}
                  onPress={() => handleDeletePet(currentPet)}
                >
                  <Text style={[styles.inlineButtonText, styles.deleteButtonText]}>删除当前宠物</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>其他宠物管理</Text>
                <TouchableOpacity onPress={handleAddPet}>
                  <Text style={styles.sectionLink}>继续添加</Text>
                </TouchableOpacity>
              </View>

              {otherPets.length === 0 ? (
                <View style={styles.emptySecondaryCard}>
                  <Text style={styles.emptySecondaryText}>目前只有这一只主宠物。</Text>
                </View>
              ) : (
                otherPets.map((pet) => (
                  <View key={pet.id} style={styles.secondaryPetCard}>
                    <PetAvatar pet={pet} size={64} />
                    <View style={styles.secondaryPetInfo}>
                      <Text style={styles.secondaryPetName}>{pet.name}</Text>
                      <Text style={styles.secondaryPetMeta}>
                        {[pet.species, pet.breed || '未知品种'].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      onPress={() => void handleSwitchPet(pet)}
                    >
                      <Text style={styles.secondaryActionText}>设为主宠物</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={switcherVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSwitcherVisible(false)}
        >
          <View style={styles.switcherPanel}>
            <Text style={styles.switcherTitle}>选择主宠物</Text>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.switcherItem,
                  currentPet?.id === pet.id && styles.switcherItemActive,
                ]}
                onPress={() => void handleSwitchPet(pet)}
              >
                <PetAvatar pet={pet} size={52} />
                <View style={styles.switcherItemInfo}>
                  <Text style={styles.switcherItemName}>{pet.name}</Text>
                  <Text style={styles.switcherItemMeta}>
                    {[pet.species, pet.breed || '未知品种'].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={styles.switcherItemState}>
                  {currentPet?.id === pet.id ? '当前' : '切换'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#eef5f0',
  },
  header: {
    width: '100%',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 10,
  },
  headerSpacer: {
    width: 44,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 34,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#243029',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#6f7c73',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentBadge: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#e9f5eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  switchButton: {
    backgroundColor: '#eef5f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  switchButtonText: {
    color: '#325d46',
    fontSize: 13,
    fontWeight: '700',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#223126',
    marginBottom: 8,
  },
  petMeta: {
    fontSize: 14,
    color: '#6a786f',
    marginBottom: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
  },
  primaryActionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#213126',
    marginBottom: 8,
  },
  primaryActionText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6d7a71',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#223126',
  },
  sectionLink: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  inlineButton: {
    flex: 1,
    backgroundColor: '#edf4ee',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inlineButtonText: {
    color: '#335c47',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fdecea',
  },
  deleteButtonText: {
    color: '#b24a3e',
  },
  emptySecondaryCard: {
    backgroundColor: '#f7faf7',
    borderRadius: 16,
    padding: 16,
  },
  emptySecondaryText: {
    color: '#6e7c73',
    fontSize: 14,
  },
  secondaryPetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6faf6',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  secondaryPetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  secondaryPetName: {
    color: '#203025',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  secondaryPetMeta: {
    color: '#708076',
    fontSize: 13,
  },
  secondaryActionButton: {
    backgroundColor: '#e2efe3',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: '#2f6e43',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 20, 14, 0.36)',
  },
  switcherPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 30,
  },
  switcherTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#223126',
    marginBottom: 14,
  },
  switcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6faf6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  switcherItemActive: {
    backgroundColor: '#e5f2e7',
  },
  switcherItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  switcherItemName: {
    color: '#223126',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  switcherItemMeta: {
    color: '#718076',
    fontSize: 13,
  },
  switcherItemState: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PetProfileScreen;
