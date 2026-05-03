import React, { useCallback, useState } from 'react';
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
import { getApiErrorMessage, knowledgeApi } from '../services/api';

const KnowledgeScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | number>('all');
  const [loading, setLoading] = useState(true);

  const loadBaseData = async () => {
    try {
      const [categoryData, articleData, recommendedData, productData] = await Promise.all([
        knowledgeApi.getCategories(),
        knowledgeApi.getArticles({ limit: 30, offset: 0 }),
        knowledgeApi.getRecommendedArticles({ limit: 6 }),
        knowledgeApi.getRecommendedProducts({ limit: 6 }),
      ]);
      setCategories(categoryData);
      setArticles(articleData);
      setRecommendedArticles(recommendedData);
      setRecommendedProducts(productData);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取知识内容失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadBaseData();
    }, []),
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setActiveCategory('all');
      setLoading(true);
      await loadBaseData();
      return;
    }

    setLoading(true);
    try {
      const result = await knowledgeApi.searchArticles(searchQuery.trim(), 30);
      setActiveCategory('search');
      setArticles(result);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '搜索失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = async (categoryId: number | string) => {
    setActiveCategory(categoryId);
    setLoading(true);
    try {
      if (categoryId === 'all') {
        const result = await knowledgeApi.getArticles({ limit: 30, offset: 0 });
        setArticles(result);
      } else {
        const result = await knowledgeApi.getArticlesByCategory(Number(categoryId), {
          limit: 30,
          offset: 0,
        });
        setArticles(result);
      }
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取文章失败'));
    } finally {
      setLoading(false);
    }
  };

  const renderArticleCard = (article: any, compact = false) => (
    <TouchableOpacity
      key={article.id}
      style={compact ? styles.recommendedCard : styles.articleCard}
      activeOpacity={0.88}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
    >
      {article.cover_image ? (
        <Image
          source={{ uri: article.cover_image }}
          style={compact ? styles.recommendedImage : styles.articleImage}
        />
      ) : null}
      <View style={compact ? undefined : styles.articleContent}>
        <Text
          style={compact ? styles.recommendedTitle : styles.articleTitle}
          numberOfLines={compact ? 2 : 3}
        >
          {article.title || '未命名文章'}
        </Text>
        {!compact ? (
          <Text style={styles.articleMeta}>
            {article.category?.name || '未分类'} · 👁️ {article.views || 0}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>知识百科</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜索宠物知识..."
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推荐文章</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCardsRow}
          >
            {recommendedArticles.map((article) => renderArticleCard(article, true))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用品推荐与护理要点</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCardsRow}
          >
            {recommendedProducts.length === 0 ? (
              <View style={styles.productCard}>
                <Text style={styles.productTitle}>推荐内容筹备中</Text>
                <Text style={styles.productDescription}>后台发布推荐用品后，这里会自动展示推荐理由和护理建议。</Text>
              </View>
            ) : (
              recommendedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
                >
                  <Text style={styles.productTitle}>{item.title}</Text>
                  <Text style={styles.productDescription}>
                    {item.recommendation_reason || item.content || '点击查看推荐详情'}
                  </Text>
                  <Text style={styles.productMeta}>{item.category?.name || '用品推荐'}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.communityCard}>
            <Text style={styles.communityTitle}>经验交流</Text>
            <Text style={styles.communityDescription}>
              去社区看看别人的喂养经验、医院建议和用品心得，内容会更全面。
            </Text>
            <TouchableOpacity
              style={styles.communityButton}
              onPress={() => navigation.navigate('CommunityTab')}
            >
              <Text style={styles.communityButtonText}>进入交流社区</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>文章分类</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                activeCategory === 'all' && styles.activeCategoryButton,
              ]}
              onPress={() => handleCategoryPress('all')}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  activeCategory === 'all' && styles.activeCategoryButtonText,
                ]}
              >
                全部
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  activeCategory === category.id && styles.activeCategoryButton,
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    activeCategory === category.id && styles.activeCategoryButtonText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'search'
              ? '搜索结果'
              : activeCategory === 'all'
                ? '全部文章'
                : categories.find((item) => item.id === activeCategory)?.name || '文章'}
          </Text>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : articles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无文章</Text>
            </View>
          ) : (
            <View>
              {articles.map((article) => renderArticleCard(article))}
            </View>
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  horizontalCardsRow: {
    paddingRight: 16,
  },
  recommendedCard: {
    width: 156,
    marginLeft: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  recommendedImage: {
    width: '100%',
    height: 92,
  },
  recommendedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#243029',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    lineHeight: 18,
  },
  productCard: {
    width: 188,
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 12,
    color: '#64736b',
    lineHeight: 18,
  },
  productMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  communityCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  communityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    color: '#64736b',
    lineHeight: 20,
    marginBottom: 14,
  },
  communityButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  communityButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  categoryButton: {
    marginLeft: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#eaf0eb',
  },
  activeCategoryButton: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#53655c',
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  articleImage: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginRight: 12,
  },
  articleContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    lineHeight: 22,
  },
  articleMeta: {
    fontSize: 13,
    color: '#728078',
  },
  loadingState: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#728078',
    fontSize: 15,
  },
});

export default KnowledgeScreen;
