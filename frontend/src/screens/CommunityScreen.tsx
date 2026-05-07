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
import DatePickerField from '../components/DatePickerField';
import { useFocusEffect } from '@react-navigation/native';
import { communityApi, getApiErrorMessage, resolveMediaUrl } from '../services/api';

type TabKey = 'all' | 'mine' | 'comments' | 'bookings';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部帖子' },
  { key: 'mine', label: '我的帖子' },
  { key: 'comments', label: '我的评论' },
  { key: 'bookings', label: '我的预约' },
];

const BOOKING_SERVICE_OPTIONS = [
  {
    serviceType: 'hospital',
    label: '医院问诊',
    locations: [
      {
        name: '安心宠物门诊',
        address: '上海市徐汇区演示路 18 号',
        description: '适合疫苗复查、体检咨询与常规化验。',
        timeSlots: ['10:00', '14:30', '16:00'],
      },
      {
        name: '友宠动物医院',
        address: '上海市长宁区虹桥路 220 号',
        description: '适合驱虫复查、皮肤检查与年度复诊。',
        timeSlots: ['09:30', '11:00', '15:30'],
      },
    ],
  },
  {
    serviceType: 'grooming',
    label: '洗护美容',
    locations: [
      {
        name: '尾巴星球洗护美容',
        address: '上海市静安区安远路 66 号',
        description: '提供洗澡、修毛、指甲护理等服务。',
        timeSlots: ['11:30', '13:30', '17:00'],
      },
      {
        name: '喵汪生活馆',
        address: '上海市普陀区岚皋路 89 号',
        description: '适合基础洗护、除毛和香波护理。',
        timeSlots: ['10:30', '14:00', '18:30'],
      },
    ],
  },
  {
    serviceType: 'boarding',
    label: '寄养托管',
    locations: [
      {
        name: '陪伴宠物寄养中心',
        address: '上海市浦东新区锦绣路 288 号',
        description: '适合节假日寄养、白天托管和短住观察。',
        timeSlots: ['09:00', '12:00', '19:00'],
      },
    ],
  },
  {
    serviceType: 'other',
    label: '其他服务',
    locations: [
      {
        name: '宠物行为训练工作室',
        address: '上海市杨浦区国顺东路 155 号',
        description: '适合行为咨询、基础社交训练和家庭陪伴建议。',
        timeSlots: ['10:00', '15:00', '18:00'],
      },
    ],
  },
];

const CommunityScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bookingForm, setBookingForm] = useState({
    serviceType: 'hospital',
    serviceName: BOOKING_SERVICE_OPTIONS[0].locations[0].name,
    serviceAddress: BOOKING_SERVICE_OPTIONS[0].locations[0].address,
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });
  const selectedServiceOption =
    BOOKING_SERVICE_OPTIONS.find((item) => item.serviceType === bookingForm.serviceType) ||
    BOOKING_SERVICE_OPTIONS[0];
  const selectedLocation =
    selectedServiceOption.locations.find((item) => item.name === bookingForm.serviceName) || null;
  const fetchCommunityData = async () => {
    try {
      const [allPostResponse, myPostResponse, myCommentResponse, bookingResponse] = await Promise.all([
        communityApi.getPosts({ limit: 30, offset: 0 }),
        communityApi.getMyPosts(),
        communityApi.getMyComments(),
        communityApi.getBookings(),
      ]);
      setPosts(allPostResponse);
      setMyPosts(myPostResponse);
      setMyComments(myCommentResponse);
      setBookings(bookingResponse);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取社区数据失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCommunityData();
    }, []),
  );

  const visibleList = useMemo(() => {
    if (activeTab === 'mine') {
      return myPosts;
    }
    if (activeTab === 'comments') {
      return myComments;
    }
    if (activeTab === 'bookings') {
      return bookings;
    }
    return posts;
  }, [activeTab, bookings, myComments, myPosts, posts]);

  const resetComposer = () => {
    setShowComposer(false);
    setEditingPostId(null);
    setTitle('');
    setContent('');
    setBookingForm({
      serviceType: 'hospital',
      serviceName: BOOKING_SERVICE_OPTIONS[0].locations[0].name,
      serviceAddress: BOOKING_SERVICE_OPTIONS[0].locations[0].address,
      bookingDate: '',
      bookingTime: '',
      notes: '',
    });
  };

  const handleBookingServiceTypeChange = (serviceType: string) => {
    const nextService =
      BOOKING_SERVICE_OPTIONS.find((item) => item.serviceType === serviceType) ||
      BOOKING_SERVICE_OPTIONS[0];
    const firstLocation = nextService.locations[0];

    setBookingForm((prev) => ({
      ...prev,
      serviceType,
      serviceName: firstLocation?.name || '',
      serviceAddress: firstLocation?.address || '',
      bookingTime: '',
    }));
  };

  const handleBookingLocationSelect = (name: string, address: string) => {
    setBookingForm((prev) => ({
      ...prev,
      serviceName: name,
      serviceAddress: address,
      bookingTime: '',
    }));
  };

  const handleCreateOrUpdatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('提示', '请输入帖子标题和内容');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPostId) {
        await communityApi.updatePost(editingPostId, {
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await communityApi.createPost({
          title: title.trim(),
          content: content.trim(),
        });
      }

      resetComposer();
      await fetchCommunityData();
      Alert.alert('成功', editingPostId ? '帖子更新成功' : '帖子发布成功');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, editingPostId ? '更新帖子失败' : '发布帖子失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      await communityApi.likePost(postId);
      await fetchCommunityData();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '点赞失败'));
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setTitle(post.title || '');
    setContent(post.content || '');
    setShowComposer(true);
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert('确认删除', '删除后无法恢复，确定删除这篇帖子吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityApi.deletePost(postId);
            await fetchCommunityData();
            Alert.alert('成功', '帖子删除成功');
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除帖子失败'));
          }
        },
      },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('确认删除', '删除后无法恢复，确定删除这条评论吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityApi.deleteComment(commentId);
            await fetchCommunityData();
            Alert.alert('成功', '评论删除成功');
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除评论失败'));
          }
        },
      },
    ]);
  };

  const handleCreateBooking = async () => {
    if (!bookingForm.serviceName.trim() || !bookingForm.serviceAddress.trim() || !bookingForm.bookingDate.trim() || !bookingForm.bookingTime.trim()) {
      Alert.alert('提示', '请补全预约服务名称、地址、日期和时间');
      return;
    }

    setSubmitting(true);
    try {
      await communityApi.createBooking({
        serviceType: bookingForm.serviceType,
        serviceName: bookingForm.serviceName.trim(),
        serviceAddress: bookingForm.serviceAddress.trim(),
        bookingDate: bookingForm.bookingDate.trim(),
        bookingTime: bookingForm.bookingTime.trim(),
        notes: bookingForm.notes.trim() || undefined,
      });
      resetComposer();
      await fetchCommunityData();
      Alert.alert('成功', '预约已创建');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '创建预约失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = (booking: any) => {
    Alert.alert('取消预约', '确定取消这条预约吗？', [
      { text: '返回', style: 'cancel' },
      {
        text: '取消预约',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityApi.updateBookingStatus(booking.id, 'cancelled');
            await fetchCommunityData();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '取消预约失败'));
          }
        },
      },
    ]);
  };

  const renderPostCard = (post: any, isMine: boolean) => (
    <TouchableOpacity
      key={post.id}
      style={styles.postCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
    >
      <View style={styles.postHeader}>
        {post.user?.avatar ? (
          <Image source={{ uri: resolveMediaUrl(post.user.avatar) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {post.user?.nickname?.charAt(0) || '宠'}
            </Text>
          </View>
        )}
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{post.user?.nickname || '宠物主人'}</Text>
          <Text style={styles.postTime}>
            {new Date(post.created_at).toLocaleString('zh-CN')}
          </Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={4}>
        {post.content}
      </Text>
      {post.images?.length ? (
        <Image source={{ uri: resolveMediaUrl(post.images[0]) }} style={styles.postImage} />
      ) : null}

      <View style={styles.postFooter}>
        <TouchableOpacity onPress={() => handleLikePost(post.id)}>
          <Text style={styles.footerAction}>❤️ {post.likes || 0}</Text>
        </TouchableOpacity>
        <Text style={styles.footerAction}>💬 {post.comments || 0}</Text>
        <Text style={styles.footerAction}>查看详情 →</Text>
      </View>

      {isMine ? (
        <View style={styles.manageRow}>
          <TouchableOpacity style={styles.manageButton} onPress={() => handleEditPost(post)}>
            <Text style={styles.manageButtonText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manageButton, styles.manageDangerButton]}
            onPress={() => handleDeletePost(post.id)}
          >
            <Text style={[styles.manageButtonText, styles.manageDangerText]}>删除</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderCommentCard = (comment: any) => (
    <View key={comment.id} style={styles.commentCard}>
      <Text style={styles.commentTitle}>{comment.post?.title || '原帖已删除'}</Text>
      <Text style={styles.commentBody}>{comment.content}</Text>
      <Text style={styles.commentMeta}>
        {new Date(comment.created_at).toLocaleString('zh-CN')}
      </Text>
      <View style={styles.manageRow}>
        {comment.post?.id ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('PostDetail', { postId: comment.post.id })}
          >
            <Text style={styles.manageButtonText}>查看原帖</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.manageButton, styles.manageDangerButton]}
          onPress={() => handleDeleteComment(comment.id)}
        >
          <Text style={[styles.manageButtonText, styles.manageDangerText]}>删除评论</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBookingCard = (booking: any) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingTitleWrap}>
          <Text style={styles.bookingTitle}>{booking.serviceName}</Text>
          <Text style={styles.bookingType}>
            {booking.serviceType === 'hospital'
              ? '医院问诊'
              : booking.serviceType === 'grooming'
                ? '洗护美容'
                : booking.serviceType === 'boarding'
                  ? '寄养托管'
                  : '其他服务'}
          </Text>
        </View>
        <View style={[styles.bookingStatusBadge, booking.status === 'cancelled' && styles.bookingStatusBadgeCancelled]}>
          <Text style={[styles.bookingStatusText, booking.status === 'cancelled' && styles.bookingStatusTextCancelled]}>
            {booking.status === 'pending'
              ? '待确认'
              : booking.status === 'confirmed'
                ? '已确认'
                : booking.status === 'completed'
                  ? '已完成'
                  : '已取消'}
          </Text>
        </View>
      </View>
      <Text style={styles.bookingMeta}>地址：{booking.serviceAddress}</Text>
      <Text style={styles.bookingMeta}>预约时间：{booking.bookingDate} {booking.bookingTime}</Text>
      {booking.notes ? <Text style={styles.bookingMeta}>备注：{booking.notes}</Text> : null}
      <View style={styles.manageRow}>
        {booking.status !== 'cancelled' && booking.status !== 'completed' ? (
          <TouchableOpacity style={styles.manageButton} onPress={() => handleCancelBooking(booking)}>
            <Text style={styles.manageButtonText}>取消预约</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.manageButton, styles.manageDangerButton]}
          onPress={async () => {
            try {
              await communityApi.deleteBooking(booking.id);
              await fetchCommunityData();
            } catch (error: any) {
              Alert.alert('错误', getApiErrorMessage(error, '删除预约失败'));
            }
          }}
        >
          <Text style={[styles.manageButtonText, styles.manageDangerText]}>删除记录</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (activeTab === 'mine') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>你还没有发布帖子</Text>
          <Text style={styles.emptySubtitle}>先发一篇帖子，再在这里进行编辑和删除。</Text>
        </View>
      );
    }

    if (activeTab === 'comments') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>你还没有评论记录</Text>
          <Text style={styles.emptySubtitle}>去社区互动后，这里会展示你的评论历史。</Text>
        </View>
      );
    }

    if (activeTab === 'bookings') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>你还没有预约记录</Text>
          <Text style={styles.emptySubtitle}>可以先预约医院问诊、洗护美容或寄养服务，这里会集中展示状态。</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>还没有帖子</Text>
        <Text style={styles.emptySubtitle}>发布第一条动态，和其他宠物主人分享经验。</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>社区</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => {
            if (showComposer) {
              resetComposer();
              return;
            }
            setShowComposer(true);
          }}
        >
          <Text style={styles.composeButtonText}>
            {showComposer ? '收起' : activeTab === 'bookings' ? '预约' : editingPostId ? '编辑中' : '发帖'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showComposer && activeTab !== 'bookings' ? (
        <View style={styles.composerCard}>
          <Text style={styles.composerTitle}>{editingPostId ? '编辑帖子' : '发布帖子'}</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="输入帖子标题"
          />
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="分享你的宠物故事、经验或问题..."
            multiline
            numberOfLines={5}
            maxLength={1000}
          />
          <View style={styles.composerActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={resetComposer}
            >
              <Text style={styles.secondaryButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={handleCreateOrUpdatePost}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? '提交中...' : editingPostId ? '保存修改' : '发布'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showComposer && activeTab === 'bookings' ? (
        <View style={styles.composerCard}>
          <Text style={styles.composerTitle}>创建预约</Text>
          <View style={styles.bookingTypeRow}>
            {[
              ['hospital', '医院问诊'],
              ['grooming', '洗护美容'],
              ['boarding', '寄养托管'],
              ['other', '其他服务'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.bookingTypeChip, bookingForm.serviceType === value && styles.bookingTypeChipActive]}
                onPress={() => handleBookingServiceTypeChange(value)}
              >
                <Text style={[styles.bookingTypeChipText, bookingForm.serviceType === value && styles.bookingTypeChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.bookingSectionLabel}>选择门店</Text>
          <View style={styles.bookingLocationList}>
            {selectedServiceOption.locations.map((item) => {
              const active = bookingForm.serviceName === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.bookingLocationCard, active && styles.bookingLocationCardActive]}
                  onPress={() => handleBookingLocationSelect(item.name, item.address)}
                >
                  <Text style={[styles.bookingLocationName, active && styles.bookingLocationNameActive]}>
                    {item.name}
                  </Text>
                  <Text style={styles.bookingLocationAddress}>{item.address}</Text>
                  <Text style={styles.bookingLocationDescription}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.bookingDateRow}>
            <View style={styles.bookingDateInput}>
              <DatePickerField
                value={bookingForm.bookingDate}
                onChange={(bookingDate) => setBookingForm((prev) => ({ ...prev, bookingDate }))}
                placeholder="请选择预约日期"
                title="选择预约日期"
              />
            </View>
          </View>
          <Text style={styles.bookingSectionLabel}>选择时间段</Text>
          <View style={styles.bookingTimeSlotRow}>
            {(selectedLocation?.timeSlots || []).map((slot) => {
              const active = bookingForm.bookingTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.bookingTimeSlot, active && styles.bookingTimeSlotActive]}
                  onPress={() => setBookingForm((prev) => ({ ...prev, bookingTime: slot }))}
                >
                  <Text style={[styles.bookingTimeSlotText, active && styles.bookingTimeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.contentInput}
            value={bookingForm.notes}
            onChangeText={(notes) => setBookingForm((prev) => ({ ...prev, notes }))}
            placeholder="补充预约说明，例如疫苗复查、体检咨询、洗护需求等"
            multiline
            numberOfLines={4}
          />
          <View style={styles.composerActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={resetComposer}
            >
              <Text style={styles.secondaryButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={handleCreateBooking}
            >
              <Text style={styles.primaryButtonText}>{submitting ? '提交中...' : '创建预约'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : visibleList.length === 0 ? (
          renderEmptyState()
        ) : activeTab === 'bookings' ? (
          visibleList.map((booking) => renderBookingCard(booking))
        ) : activeTab === 'comments' ? (
          visibleList.map((comment) => renderCommentCard(comment))
        ) : (
          visibleList.map((post) => renderPostCard(post, activeTab === 'mine'))
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
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  composeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  composeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#e7ece9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#d4ead9',
  },
  tabButtonText: {
    color: '#617168',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#245b38',
  },
  composerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  composerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 12,
  },
  bookingTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  bookingTypeChip: {
    backgroundColor: '#edf2ee',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bookingTypeChipActive: {
    backgroundColor: '#d4ead9',
  },
  bookingTypeChipText: {
    color: '#54655b',
    fontWeight: '600',
    fontSize: 13,
  },
  bookingTypeChipTextActive: {
    color: '#245b38',
  },
  titleInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  bookingDateRow: {
    flexDirection: 'row',
  },
  bookingDateInput: {
    width: '100%',
  },
  bookingSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#42544a',
    marginBottom: 10,
  },
  bookingLocationList: {
    gap: 10,
    marginBottom: 14,
  },
  bookingLocationCard: {
    borderWidth: 1,
    borderColor: '#dce7df',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f9fbfa',
  },
  bookingLocationCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#eef9f0',
  },
  bookingLocationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243029',
  },
  bookingLocationNameActive: {
    color: '#2c8b42',
  },
  bookingLocationAddress: {
    fontSize: 12,
    color: '#607067',
    marginTop: 6,
  },
  bookingLocationDescription: {
    fontSize: 12,
    color: '#728078',
    marginTop: 4,
    lineHeight: 18,
  },
  bookingTimeSlotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  bookingTimeSlot: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#edf2ef',
  },
  bookingTimeSlotActive: {
    backgroundColor: '#4CAF50',
  },
  bookingTimeSlotText: {
    color: '#4d6055',
    fontWeight: '600',
  },
  bookingTimeSlotTextActive: {
    color: '#fff',
  },
  contentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#eef2ef',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#4f5d55',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  loadingState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7b8880',
    textAlign: 'center',
    lineHeight: 22,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#d9eadf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#326348',
    fontWeight: '700',
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontWeight: '700',
    color: '#243029',
  },
  postTime: {
    color: '#7d8b83',
    fontSize: 12,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 10,
  },
  postContent: {
    fontSize: 15,
    color: '#4a5951',
    lineHeight: 23,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: '#eef3ef',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  footerAction: {
    color: '#4d6256',
    fontWeight: '600',
  },
  manageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  manageButton: {
    backgroundColor: '#edf3ee',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  manageDangerButton: {
    backgroundColor: '#fdeaea',
  },
  manageButtonText: {
    color: '#355347',
    fontWeight: '700',
  },
  manageDangerText: {
    color: '#b54848',
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
  },
  commentBody: {
    color: '#4a5951',
    lineHeight: 22,
  },
  commentMeta: {
    marginTop: 10,
    color: '#809087',
    fontSize: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 4,
  },
  bookingType: {
    fontSize: 12,
    color: '#6f7f76',
  },
  bookingStatusBadge: {
    backgroundColor: '#e6f4ea',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bookingStatusBadgeCancelled: {
    backgroundColor: '#f8ecea',
  },
  bookingStatusText: {
    color: '#277245',
    fontSize: 12,
    fontWeight: '700',
  },
  bookingStatusTextCancelled: {
    color: '#b05d50',
  },
  bookingMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: '#596a61',
    marginBottom: 4,
  },
});

export default CommunityScreen;
