import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { careApi, getApiErrorMessage } from '../services/api';

const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [todayPlans, setTodayPlans] = useState<any[]>([]);
  const [planError, setPlanError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    loadUser();
    // 启动动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const loadTodayPlans = async () => {
    try {
      const response = await careApi.getTodayPlans();
      setTodayPlans(response);
      setPlanError('');
    } catch (error: any) {
      setPlanError(getApiErrorMessage(error, '今日护理计划加载失败'));
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      void loadUser();
      void loadTodayPlans();
    }, []),
  );

  const menuItems = [
    {
      title: '宠物档案',
      icon: '📋',
      onPress: () => navigation.navigate('PetsTab'),
      color: '#4CAF50',
    },
    {
      title: '健康管理',
      icon: '🏥',
      onPress: () => navigation.navigate('PetsTab'),
      color: '#2196F3',
    },
    {
      title: '日常护理',
      icon: '🧴',
      onPress: () => navigation.navigate('PetsTab'),
      color: '#FF9800',
    },
    {
      title: 'AI助手',
      icon: '🤖',
      onPress: () => navigation.navigate('AiAssistant'),
      color: '#F44336',
    },
    {
      title: '设置',
      icon: '⚙️',
      onPress: () => navigation.navigate('SettingsTab'),
      color: '#607D8B',
    },
    {
      title: '社区',
      icon: '💬',
      onPress: () => navigation.navigate('CommunityTab'),
      color: '#8E44AD',
    },
    {
      title: '知识百科',
      icon: '📚',
      onPress: () => navigation.navigate('KnowledgeTab'),
      color: '#16A085',
    },
  ];

  const handleMenuPress = (onPress: () => void) => {
    // 添加点击反馈动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPress();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>宠物健康助手</Text>
            <Text style={styles.greeting}>
              欢迎回来，{user?.nickname || '用户'}！
            </Text>
          </View>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.nickname?.charAt(0) || '用'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Animated.ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.menuGrid,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderTopColor: item.color }]}
              onPress={() => handleMenuPress(item.onPress)}
              activeOpacity={0.8}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>健康提醒</Text>
            <Text style={styles.cardBadge}>重要</Text>
          </View>
          {todayPlans.length > 0 ? (
            <View style={styles.todayPlanList}>
              <Text style={styles.cardContent}>今天共有 {todayPlans.length} 条护理计划待执行。</Text>
              {todayPlans.slice(0, 3).map((plan) => (
                <View key={plan.id} style={styles.todayPlanRow}>
                  <View style={styles.todayPlanContent}>
                    <Text style={styles.todayPlanTitle}>{plan.pet?.name || '宠物'} · {plan.type}</Text>
                    <Text style={styles.todayPlanMeta}>
                      {plan.time || plan.reminder_time || '未设置时间'} · {plan.completedToday ? '今天已完成' : '待完成'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.todayPlanButton, plan.completedToday && styles.todayPlanButtonDone]}
                    disabled={plan.completedToday}
                    onPress={async () => {
                      try {
                        await careApi.completeTodayPlan(plan.id);
                        await loadTodayPlans();
                      } catch (error: any) {
                        setPlanError(getApiErrorMessage(error, '更新今日计划失败'));
                      }
                    }}
                  >
                    <Text style={[styles.todayPlanButtonText, plan.completedToday && styles.todayPlanButtonTextDone]}>
                      {plan.completedToday ? '已完成' : '完成'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.cardContent}>先添加宠物档案，再进入健康管理和护理记录。</Text>
          )}
          {planError ? <Text style={styles.inlineErrorText}>{planError}</Text> : null}
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={() => navigation.navigate('PetsTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>{todayPlans.length > 0 ? '进入护理与健康管理' : '进入宠物档案'}</Text>
            <Text style={styles.cardButtonIcon}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              marginBottom: 30,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI 问答</Text>
            <Text style={styles.cardTag}>在线</Text>
          </View>
          <Text style={styles.cardContent}>支持宠物日常护理与健康问题的基础问答。</Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={() => navigation.navigate('AiAssistant')}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>开始提问</Text>
            <Text style={styles.cardButtonIcon}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              marginBottom: 30,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>社区与知识</Text>
            <Text style={styles.cardTag}>完整版</Text>
          </View>
          <Text style={styles.cardContent}>浏览养宠经验，查看知识百科，补充日常照护参考。</Text>
          <View style={styles.dualActionRow}>
            <TouchableOpacity
              style={[styles.cardButton, styles.secondaryCardButton]}
              onPress={() => navigation.navigate('CommunityTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.cardButtonText}>进入社区</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardButton, styles.secondaryCardButton]}
              onPress={() => navigation.navigate('KnowledgeTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.cardButtonText}>查看知识</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    minHeight: 0,
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopWidth: 4,
  },
  menuIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardBadge: {
    backgroundColor: '#FF5722',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardTag: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  todayPlanList: {
    marginBottom: 6,
  },
  todayPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf3ee',
  },
  todayPlanContent: {
    flex: 1,
    paddingRight: 10,
  },
  todayPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#243029',
    marginBottom: 4,
  },
  todayPlanMeta: {
    fontSize: 12,
    color: '#6c7b72',
  },
  todayPlanButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayPlanButtonDone: {
    backgroundColor: '#edf5ee',
  },
  todayPlanButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  todayPlanButtonTextDone: {
    color: '#4d6658',
  },
  inlineErrorText: {
    color: '#c0392b',
    fontSize: 12,
    marginBottom: 12,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
  cardButtonIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryCardButton: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default HomeScreen;
