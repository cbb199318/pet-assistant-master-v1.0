import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PetAvatar from '../components/PetAvatar';
import {
  careApi,
  getApiErrorMessage,
  healthApi,
  petApi,
  resolveMediaUrl,
  type PetSummary,
} from '../services/api';
import { resolvePrimaryPet, setPrimaryPetId } from '../utils/primaryPet';

type HealthSummary = {
  todayPlanCount: number;
  latestCheckup: string;
  nextVaccination: string;
  nextDeworming: string;
};

const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [primaryPet, setPrimaryPet] = useState<PetSummary | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({
    todayPlanCount: 0,
    latestCheckup: '暂无体检记录',
    nextVaccination: '暂无疫苗提醒',
    nextDeworming: '暂无驱虫提醒',
  });
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    void loadUser();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadHomeData();
    }, []),
  );

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

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '';
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

  const getPetQuote = (pet?: PetSummary | null) => {
    if (!pet) {
      return '先添加一只宠物，我们再一起照顾它。';
    }

    if (pet.species === '猫') {
      return `${pet.name}说：今天也要优雅地晒太阳，再按时健康打卡。`;
    }

    if (pet.species === '狗') {
      return `${pet.name}说：今天也要摇着尾巴，把散步和喂食都安排好。`;
    }

    return `${pet.name}说：今天也要元气满满，记得按计划照顾我。`;
  };

  const buildHealthSummary = async (pet: PetSummary) => {
    const [vaccinations, dewormings, checkups, todayPlans] = await Promise.all([
      healthApi.getVaccinations(pet.id),
      healthApi.getDewormings(pet.id),
      healthApi.getCheckups(pet.id),
      careApi.getTodayPlans(pet.id),
    ]);

    const sortedVaccinations = [...vaccinations].sort(
      (left, right) =>
        new Date(right.next_date || right.vaccination_date).getTime() -
        new Date(left.next_date || left.vaccination_date).getTime(),
    );
    const sortedDewormings = [...dewormings].sort(
      (left, right) =>
        new Date(right.next_date || right.deworming_date).getTime() -
        new Date(left.next_date || left.deworming_date).getTime(),
    );
    const sortedCheckups = [...checkups].sort(
      (left, right) =>
        new Date(right.checkup_date).getTime() - new Date(left.checkup_date).getTime(),
    );

    const latestCheckup = sortedCheckups[0];
    const nextVaccination = sortedVaccinations[0];
    const nextDeworming = sortedDewormings[0];

    setHealthSummary({
      todayPlanCount: todayPlans.filter((item) => !item.completedToday).length,
      latestCheckup: latestCheckup
        ? `${formatDate(latestCheckup.checkup_date)} · ${latestCheckup.hospital || '已记录'}`
        : '暂无体检记录',
      nextVaccination: nextVaccination
        ? `${nextVaccination.vaccine_name} · ${formatDate(
            nextVaccination.next_date || nextVaccination.vaccination_date,
          )}`
        : '暂无疫苗提醒',
      nextDeworming: nextDeworming
        ? `${nextDeworming.product_name} · ${formatDate(
            nextDeworming.next_date || nextDeworming.deworming_date,
          )}`
        : '暂无驱虫提醒',
    });
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const petList = await petApi.getPets();
      setPets(petList);

      const selectedPet = await resolvePrimaryPet(petList);
      setPrimaryPet(selectedPet);
      setErrorText('');

      if (selectedPet) {
        await buildHealthSummary(selectedPet);
      } else {
        setHealthSummary({
          todayPlanCount: 0,
          latestCheckup: '暂无体检记录',
          nextVaccination: '暂无疫苗提醒',
          nextDeworming: '暂无驱虫提醒',
        });
      }
    } catch (error: any) {
      setErrorText(getApiErrorMessage(error, '首页数据加载失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrimaryPet = async (pet: PetSummary) => {
    setSwitcherVisible(false);
    setPrimaryPet(pet);
    await setPrimaryPetId(pet.id);
    await buildHealthSummary(pet);
  };

  const navigateWithPrimaryPet = (screenName: string) => {
    if (!primaryPet) {
      navigation.navigate('AddPet');
      return;
    }

    navigation.navigate(screenName, { pet: primaryPet });
  };

  const renderUserAvatar = () => {
    if (user?.avatar) {
      return <Image source={{ uri: resolveMediaUrl(user.avatar) }} style={styles.userAvatar} />;
    }

    return (
      <View style={styles.userAvatarFallback}>
        <Text style={styles.userAvatarText}>{user?.nickname?.charAt(0) || '你'}</Text>
      </View>
    );
  };

  const heroTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>首页</Text>
          <Text style={styles.headerGreeting}>欢迎回来，{user?.nickname || '宠物主人'}。</Text>
        </View>
        {renderUserAvatar()}
      </View>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>正在整理主宠物视图...</Text>
            <Text style={styles.emptyStateText}>马上就好，我们先把今天的照护信息准备一下。</Text>
          </View>
        ) : primaryPet ? (
          <>
            <View style={styles.heroCard}>
              <TouchableOpacity
                style={styles.switchButton}
                activeOpacity={0.88}
                onPress={() => setSwitcherVisible(true)}
              >
                <Text style={styles.switchButtonText}>切换宠物</Text>
              </TouchableOpacity>

              <View style={styles.heroContent}>
                <Animated.View
                  style={[
                    styles.heroAvatarWrap,
                    {
                      transform: [{ translateY: heroTranslateY }, { scale: pulseAnim }],
                    },
                  ]}
                >
                  <PetAvatar pet={primaryPet} size={124} borderColor="#ffffff" borderWidth={4} />
                </Animated.View>

                <View style={styles.heroInfo}>
                  <Text style={styles.heroPetName}>{primaryPet.name}</Text>
                  <Text style={styles.heroPetMeta}>
                    {[primaryPet.species, primaryPet.breed || '未知品种'].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.heroPetMeta}>
                    {primaryPet.gender === 'male' ? '公' : primaryPet.gender === 'female' ? '母' : '性别未设置'}
                    {' · '}
                    {getAgeText(primaryPet.birthday)}
                    {' · '}
                    {primaryPet.sterilized ? '已绝育' : '未绝育'}
                  </Text>

                  <View style={styles.quoteBubble}>
                    <Text style={styles.quoteText}>{getPetQuote(primaryPet)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>今日护理</Text>
                  <Text style={styles.statValue}>{healthSummary.todayPlanCount} 项</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>最近体检</Text>
                  <Text style={styles.statValue} numberOfLines={2}>
                    {healthSummary.latestCheckup}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>下次疫苗</Text>
                <Text style={styles.summaryValue}>{healthSummary.nextVaccination}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>下次驱虫</Text>
                <Text style={styles.summaryValue}>{healthSummary.nextDeworming}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>当前主宠物入口</Text>
              <Text style={styles.sectionHint}>围绕这只宠物查看档案、健康和护理</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionCard}
              activeOpacity={0.9}
              onPress={() => navigateWithPrimaryPet('PetProfile')}
            >
              <View>
                <Text style={styles.primaryActionTitle}>宠物档案</Text>
                <Text style={styles.primaryActionText}>查看 {primaryPet.name} 的基础信息、生日、绝育状态和头像。</Text>
              </View>
              <Text style={styles.primaryActionIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryActionCard}
              activeOpacity={0.9}
              onPress={() => navigateWithPrimaryPet('HealthManagement')}
            >
              <View>
                <Text style={styles.primaryActionTitle}>健康管理</Text>
                <Text style={styles.primaryActionText}>查看疫苗、驱虫和体检记录，继续补充医院和医生信息。</Text>
              </View>
              <Text style={styles.primaryActionIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryActionCard}
              activeOpacity={0.9}
              onPress={() => navigateWithPrimaryPet('CareManagement')}
            >
              <View>
                <Text style={styles.primaryActionTitle}>日常护理</Text>
                <Text style={styles.primaryActionText}>继续执行喂食、遛狗等计划，查看今天待办和历史留痕。</Text>
              </View>
              <Text style={styles.primaryActionIcon}>→</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyHeroCircle}>
              <Text style={styles.emptyHeroIcon}>🐾</Text>
            </View>
            <Text style={styles.emptyStateTitle}>还没有主宠物</Text>
            <Text style={styles.emptyStateText}>
              先添加第一只宠物，首页才会显示它的健康、护理和档案入口。
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('AddPet')}
            >
              <Text style={styles.emptyStateButtonText}>添加第一只宠物</Text>
            </TouchableOpacity>
          </View>
        )}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </Animated.ScrollView>

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
            <Text style={styles.switcherTitle}>切换当前主宠物</Text>
            <Text style={styles.switcherHint}>切换后，首页和宠物入口都会围绕它展开。</Text>

            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petOptionRow,
                  primaryPet?.id === pet.id && styles.petOptionRowActive,
                ]}
                activeOpacity={0.88}
                onPress={() => void handleSelectPrimaryPet(pet)}
              >
                <PetAvatar pet={pet} size={52} />
                <View style={styles.petOptionInfo}>
                  <Text style={styles.petOptionName}>{pet.name}</Text>
                  <Text style={styles.petOptionMeta}>
                    {[pet.species, pet.breed || '未知品种'].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.petOptionState,
                    primaryPet?.id === pet.id && styles.petOptionStateActive,
                  ]}
                >
                  {primaryPet?.id === pet.id ? '当前' : '切换'}
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
    backgroundColor: '#eef5f0',
  },
  header: {
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#7cb47d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerGreeting: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 34,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginTop: -12,
    marginBottom: 16,
    shadowColor: '#5b7560',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  switchButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#edf6ee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 16,
  },
  switchButtonText: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarWrap: {
    marginRight: 18,
  },
  heroInfo: {
    flex: 1,
  },
  heroPetName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#213126',
    marginBottom: 8,
  },
  heroPetMeta: {
    fontSize: 14,
    color: '#627065',
    marginBottom: 4,
  },
  quoteBubble: {
    marginTop: 12,
    backgroundColor: '#fff7df',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quoteText: {
    color: '#7a5e1f',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#f3f7f3',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statLabel: {
    color: '#6e7c71',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    color: '#253329',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#d8ead9',
    borderRadius: 22,
    padding: 16,
  },
  summaryTitle: {
    color: '#2f5d38',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#24432b',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    color: '#243029',
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6c7b72',
  },
  primaryActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#5d7962',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryActionTitle: {
    color: '#213126',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  primaryActionText: {
    color: '#69766d',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 250,
  },
  primaryActionIcon: {
    color: '#2f6e43',
    fontSize: 22,
    fontWeight: '800',
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyHeroCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#f4ead6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHeroIcon: {
    fontSize: 52,
  },
  emptyStateTitle: {
    color: '#243029',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptyStateText: {
    color: '#6f7c73',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyStateButton: {
    backgroundColor: '#4b8b5c',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  errorText: {
    color: '#b94735',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 22, 16, 0.38)',
    justifyContent: 'flex-end',
  },
  switcherPanel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  switcherTitle: {
    color: '#223026',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  switcherHint: {
    color: '#718076',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  petOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6faf6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  petOptionRowActive: {
    backgroundColor: '#e6f3e7',
  },
  petOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petOptionName: {
    color: '#203025',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  petOptionMeta: {
    color: '#718076',
    fontSize: 13,
  },
  petOptionState: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
  petOptionStateActive: {
    color: '#234d31',
  },
});

export default HomeScreen;
