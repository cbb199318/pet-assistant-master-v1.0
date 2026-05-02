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
import { useFocusEffect } from '@react-navigation/native';
import { communityApi, getApiErrorMessage } from '../services/api';

type TabKey = 'all' | 'mine' | 'comments' | 'bookings';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部帖子' },
  { key: 'mine', label: '我的帖子' },
  { key: 'comments', label: '我的评论' },
  { key: 'bookings', label: '我的预约' },
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
    serviceName: '',
    serviceAddress: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });
  const canGoBack = navigation.canGoBack();

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
      serviceName: '',
      serviceAddress: '',
      bookingDate: '',
      bookingTime: '',
      notes: '',
    });
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
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
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
        {canGoBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
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
                onPress={() => setBookingForm((prev) => ({ ...prev, serviceType: value }))}
              >
                <Text style={[styles.bookingTypeChipText, bookingForm.serviceType === value && styles.bookingTypeChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.titleInput}
            value={bookingForm.serviceName}
            onChangeText={(serviceName) => setBookingForm((prev) => ({ ...prev, serviceName }))}
            placeholder="服务名称，例如某某宠物医院"
          />
          <TextInput
            style={styles.titleInput}
            value={bookingForm.serviceAddress}
            onChangeText={(serviceAddress) => setBookingForm((prev) => ({ ...prev, serviceAddress }))}
            placeholder="服务地址"
          />
          <View style={styles.bookingDateRow}>
            <TextInput
              style={[styles.titleInput, styles.bookingDateInput]}
              value={bookingForm.bookingDate}
              onChangeText={(bookingDate) => setBookingForm((prev) => ({ ...prev, bookingDate }))}
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              style={[styles.titleInput, styles.bookingDateInput]}
              value={bookingForm.bookingTime}
              onChangeText={(bookingTime) => setBookingForm((prev) => ({ ...prev, bookingTime }))}
              placeholder="HH:mm"
            />
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
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
    gap: 12,
  },
  bookingDateInput: {
    flex: 1,
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
