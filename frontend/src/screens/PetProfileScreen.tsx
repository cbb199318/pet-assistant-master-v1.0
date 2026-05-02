import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getApiErrorMessage, petApi } from '../services/api';

const PetProfileScreen = ({ navigation }: any) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const canGoBack = navigation.canGoBack();

  // 使用 useFocusEffect 替代 useEffect，实现热刷新
  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const fetchPets = async () => {
    try {
      const response = await petApi.getPets();
      setPets(response);
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      Alert.alert('错误', '获取宠物列表失败: ' + getApiErrorMessage(error, '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  const handleEditPet = (pet: any) => {
    navigation.navigate('EditPet', { pet });
  };

  const handleDeletePet = (id: number) => {
    console.log('删除按钮被点击，宠物ID:', id);
    Alert.alert(
      '确认删除',
      '确定要删除这个宠物档案吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            console.log('确认删除按钮被点击');
            const deletePet = async () => {
              try {
                await petApi.deletePet(id);
                Alert.alert('成功', '宠物档案已删除');
                fetchPets();
              } catch (error: any) {
                console.error('删除宠物失败:', error);
                Alert.alert('错误', '删除宠物档案失败: ' + getApiErrorMessage(error, '未知错误'));
              }
            };
            deletePet();
          },
        },
      ],
    );
  };

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

      <ScrollView style={styles.content}>
        {pets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>还没有添加宠物</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddPet}>
              <Text style={styles.emptyButtonText}>立即添加</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pets.map((pet: any) => (
            <View key={pet.id} style={styles.petCard}>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDetails}>
                  {pet.species} · {pet.breed || '未知品种'}
                </Text>
                <Text style={styles.petDetails}>
                  {pet.gender === 'male' ? '公' : '母'} · {pet.sterilized ? '已绝育' : '未绝育'}
                </Text>
                {pet.birthday && (
                  <Text style={styles.petDetails}>生日: {new Date(pet.birthday).toLocaleDateString()}</Text>
                )}
              </View>
              <View style={styles.petActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('HealthManagement', { pet })}
                >
                  <Text style={styles.actionButtonText}>健康管理</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CareManagement', { pet })}
                >
                  <Text style={styles.actionButtonText}>护理管理</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditPet(pet)}
                >
                  <Text style={styles.actionButtonText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeletePet(pet.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f5f5f5',
  },
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
    minHeight: 0,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  petInfo: {
    marginBottom: 15,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  petActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
  },
  deleteButtonText: {
    color: '#fff',
  },
});

export default PetProfileScreen;
