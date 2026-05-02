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

type TabKey = 'all' | 'mine' | 'comments';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部帖子' },
  { key: 'mine', label: '我的帖子' },
  { key: 'comments', label: '我的评论' },
];

const CommunityScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchCommunityData = async () => {
    try {
      const [allPostResponse, myPostResponse, myCommentResponse] = await Promise.all([
        communityApi.getPosts({ limit: 30, offset: 0 }),
        communityApi.getMyPosts(),
        communityApi.getMyComments(),
      ]);
      setPosts(allPostResponse);
      setMyPosts(myPostResponse);
      setMyComments(myCommentResponse);
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
    return posts;
  }, [activeTab, myComments, myPosts, posts]);

  const resetComposer = () => {
    setShowComposer(false);
    setEditingPostId(null);
    setTitle('');
    setContent('');
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
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
            {showComposer ? '收起' : editingPostId ? '编辑中' : '发帖'}
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

      {showComposer ? (
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : visibleList.length === 0 ? (
          renderEmptyState()
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
  titleInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
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
});

export default CommunityScreen;
