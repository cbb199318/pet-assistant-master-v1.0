import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AdminScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'comments') {
      fetchComments();
    } else if (activeTab === 'articles') {
      fetchArticles();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      Alert.alert('错误', '获取用户列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/posts', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setPosts(response.data);
    } catch (error) {
      Alert.alert('错误', '获取帖子列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/comments', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setComments(response.data);
    } catch (error) {
      Alert.alert('错误', '获取评论列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/articles', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setArticles(response.data);
    } catch (error) {
      Alert.alert('错误', '获取文章列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/categories', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      Alert.alert('错误', '获取分类列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个用户吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
                headers: {
                  Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
              });
              Alert.alert('成功', '用户已删除');
              fetchUsers();
            } catch (error) {
              Alert.alert('错误', '删除用户失败');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个帖子吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://localhost:3000/api/admin/posts/${postId}`, {
                headers: {
                  Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
              });
              Alert.alert('成功', '帖子已删除');
              fetchPosts();
            } catch (error) {
              Alert.alert('错误', '删除帖子失败');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个评论吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://localhost:3000/api/admin/comments/${commentId}`, {
                headers: {
                  Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
              });
              Alert.alert('成功', '评论已删除');
              fetchComments();
            } catch (error) {
              Alert.alert('错误', '删除评论失败');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handleDeleteArticle = async (articleId: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这篇文章吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://localhost:3000/api/admin/articles/${articleId}`, {
                headers: {
                  Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
              });
              Alert.alert('成功', '文章已删除');
              fetchArticles();
            } catch (error) {
              Alert.alert('错误', '删除文章失败');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const renderUser = ({ item }: any) => (
    <View style={styles.userCard}>
      <Image
        source={{ uri: item.avatar || 'https://example.com/avatar.jpg' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nickname}</Text>
        <Text style={styles.userPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteUser(item.id)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPost = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postAuthor}>{item.user?.nickname || '用户'}</Text>
      </View>
      <Text style={styles.postContent} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.postActions}>
        <Text style={styles.postStats}>❤️ {item.likes || 0} 💬 {item.comments || 0}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item.id)}
        >
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: any) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{item.user?.nickname || '用户'}</Text>
        <Text style={styles.commentPost}>{item.post?.title || '帖子'}</Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteComment(item.id)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderArticle = ({ item }: any) => (
    <View style={styles.articleCard}>
      <View style={styles.articleHeader}>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <Text style={styles.articleCategory}>{item.category?.name || '分类'}</Text>
      </View>
      <Text style={styles.articleViews}>👁️ {item.views || 0}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteArticle(item.id)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategory = ({ item }: any) => (
    <View style={styles.categoryCard}>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>文章数: {item.articles?.length || 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>管理后台</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 系统统计 */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>用户数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>帖子数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalComments}</Text>
            <Text style={styles.statLabel}>评论数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalArticles}</Text>
            <Text style={styles.statLabel}>文章数</Text>
          </View>
        </View>
      )}

      {/* 导航标签 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            用户管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            帖子管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>
            评论管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'articles' && styles.activeTab]}
          onPress={() => setActiveTab('articles')}
        >
          <Text style={[styles.tabText, activeTab === 'articles' && styles.activeTabText]}>
            文章管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            分类管理
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 内容区域 */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <>
            {activeTab === 'users' && (
              users.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无用户</Text>
                </View>
              ) : (
                users.map((user: any) => renderUser({ item: user }))
              )
            )}
            {activeTab === 'posts' && (
              posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无帖子</Text>
                </View>
              ) : (
                posts.map((post: any) => renderPost({ item: post }))
              )
            )}
            {activeTab === 'comments' && (
              comments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无评论</Text>
                </View>
              ) : (
                comments.map((comment: any) => renderComment({ item: comment }))
              )
            )}
            {activeTab === 'articles' && (
              articles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无文章</Text>
                </View>
              ) : (
                articles.map((article: any) => renderArticle({ item: article }))
              )
            )}
            {activeTab === 'categories' && (
              categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无分类</Text>
                </View>
              ) : (
                categories.map((category: any) => renderCategory({ item: category }))
              )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    fontSize: 14,
    color: '#999',
  },
  commentCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentPost: {
    fontSize: 14,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  articleCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  articleCategory: {
    fontSize: 14,
    color: '#666',
  },
  articleViews: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminScreen;