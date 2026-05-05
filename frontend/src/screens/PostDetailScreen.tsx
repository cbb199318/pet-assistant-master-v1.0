import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { communityApi, getApiErrorMessage, resolveMediaUrl } from '../services/api';

const PostDetailScreen = ({ navigation, route }: any) => {
  const { postId } = route.params;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = async () => {
    try {
      const localUser = await AsyncStorage.getItem('user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setCurrentUserId(parsedUser?.id || null);
      }

      const [postData, commentData] = await Promise.all([
        communityApi.getPostDetail(postId),
        communityApi.getComments(postId),
      ]);
      setPost(postData);
      setComments(commentData);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取帖子详情失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDetail();
    }, [postId]),
  );

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      await communityApi.createComment({
        postId,
        content: commentInput.trim(),
      });
      setCommentInput('');
      await loadDetail();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '发表评论失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      await communityApi.likePost(postId);
      await loadDetail();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '点赞失败'));
    }
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
            await loadDetail();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除评论失败'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>帖子详情</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : !post ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>帖子不存在</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postMeta}>
              {post.author?.nickname || '宠物主人'} · {new Date(post.created_at).toLocaleString('zh-CN')}
            </Text>
            {post.images?.length ? (
              <Image source={{ uri: resolveMediaUrl(post.images[0]) }} style={styles.postImage} />
            ) : null}
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionChip} onPress={handleLike}>
                <Text style={styles.actionChipText}>❤️ {post.likes || 0}</Text>
              </TouchableOpacity>
              <View style={styles.actionChip}>
                <Text style={styles.actionChipText}>💬 {comments.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.commentComposer}>
            <Text style={styles.sectionTitle}>发表评论</Text>
            <TextInput
              style={styles.commentInput}
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="写下你的看法..."
              multiline
            />
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmitComment}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>{submitting ? '提交中...' : '提交评论'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>全部评论</Text>
            {comments.length === 0 ? (
              <Text style={styles.emptyText}>还没有评论</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>{comment.user?.nickname || '宠物主人'}</Text>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleString('zh-CN')}
                  </Text>
                  {currentUserId && comment.user?.id === currentUserId ? (
                    <TouchableOpacity
                      style={styles.commentDeleteButton}
                      onPress={() => handleDeleteComment(comment.id)}
                    >
                      <Text style={styles.commentDeleteButtonText}>删除评论</Text>
                    </TouchableOpacity>
                  ) : null}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 10 },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, minHeight: 0 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#77847d', fontSize: 14 },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  postTitle: { fontSize: 20, fontWeight: '700', color: '#243029', marginBottom: 10 },
  postMeta: { color: '#758079', fontSize: 13, marginBottom: 12 },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: '#eef3ef',
  },
  postContent: { color: '#485650', fontSize: 15, lineHeight: 24 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionChip: {
    backgroundColor: '#edf3ee',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionChipText: { color: '#416252', fontWeight: '600' },
  commentComposer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#243029', marginBottom: 12 },
  commentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  commentCard: {
    borderTopWidth: 1,
    borderTopColor: '#eef2ef',
    paddingVertical: 12,
  },
  commentAuthor: { fontWeight: '700', color: '#243029', marginBottom: 4 },
  commentContent: { color: '#485650', lineHeight: 22 },
  commentTime: { color: '#87928c', fontSize: 12, marginTop: 6 },
  commentDeleteButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fdeaea',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentDeleteButtonText: {
    color: '#b54848',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default PostDetailScreen;
