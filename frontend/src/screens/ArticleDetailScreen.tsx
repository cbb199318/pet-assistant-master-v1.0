import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, knowledgeApi, resolveMediaUrl } from '../services/api';

const ArticleDetailScreen = ({ navigation, route }: any) => {
  const { articleId } = route.params;
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    try {
      const response = await knowledgeApi.getArticleDetail(articleId);
      setArticle(response);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取文章详情失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDetail();
    }, [articleId]),
  );

  const handleLike = async () => {
    try {
      await knowledgeApi.likeArticle(articleId);
      await loadDetail();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '点赞失败'));
    }
  };

  const handleFavorite = async () => {
    try {
      await knowledgeApi.favoriteArticle(articleId);
      await loadDetail();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '收藏失败'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>文章详情</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : !article ? (
        <View style={styles.loadingState}>
          <Text style={styles.emptyText}>文章不存在</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {article.cover_image ? (
            <Image source={{ uri: resolveMediaUrl(article.cover_image) }} style={styles.coverImage} />
          ) : null}
          <View style={styles.articleCard}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.metaText}>
              {article.category?.name || '未分类'} · 👁️ {article.views || 0}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionChip} onPress={handleLike}>
                <Text style={styles.actionChipText}>👍 {article.likes || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={handleFavorite}>
                <Text style={styles.actionChipText}>⭐ {article.favorites || 0}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.contentText}>{article.content}</Text>
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
  backButton: { padding: 10 },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: 36 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#7a867f' },
  coverImage: { width: '100%', height: 220 },
  articleCard: { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 18 },
  articleTitle: { fontSize: 22, fontWeight: '700', color: '#243029', lineHeight: 30 },
  metaText: { color: '#76827b', marginTop: 10, marginBottom: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  actionChip: {
    backgroundColor: '#edf2ef',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionChipText: { color: '#446254', fontWeight: '600' },
  contentText: { color: '#43504a', lineHeight: 26, fontSize: 15 },
});

export default ArticleDetailScreen;
