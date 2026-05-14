import { useEffect, useMemo, useState } from 'react';
import { adminApi, getAdminToken, setAdminToken } from './api';

const overviewLabels = [
  ['totalUsers', '用户总数'],
  ['totalPets', '宠物档案'],
  ['totalVaccinations', '疫苗记录'],
  ['totalDewormings', '驱虫记录'],
  ['totalCheckups', '体检记录'],
  ['totalCares', '护理记录'],
  ['totalPosts', '社区帖子'],
  ['totalComments', '社区评论'],
  ['totalBookings', '社区预约'],
  ['totalArticles', '知识文章'],
  ['totalCategories', '知识分类'],
];

const emptyOverview = Object.fromEntries(overviewLabels.map(([key]) => [key, 0]));

const tabs = [
  {
    key: 'dashboard',
    label: '数据分析',
    eyebrow: '数据分析',
    title: '数据分析',
    placeholder: '',
    permission: 'dashboard:view',
    group: 'workspace',
  },
  {
    key: 'adminUsers',
    label: '权限管理',
    eyebrow: '权限管理',
    title: '管理员与角色',
    placeholder: '按管理员账号搜索',
    permission: 'admin_users:view',
    group: 'management',
  },
  {
    key: 'users',
    label: '用户管理',
    eyebrow: '用户管理',
    title: '用户列表',
    placeholder: '按手机号或昵称搜索',
    permission: 'users:view',
    group: 'management',
  },
  {
    key: 'posts',
    label: '帖子管理',
    eyebrow: '内容管理',
    title: '社区帖子',
    placeholder: '按标题、正文、作者搜索',
    permission: 'posts:view',
    group: 'content',
  },
  {
    key: 'comments',
    label: '评论管理',
    eyebrow: '内容管理',
    title: '社区评论',
    placeholder: '按评论、帖子标题、作者搜索',
    permission: 'comments:view',
    group: 'content',
  },
  {
    key: 'categories',
    label: '分类管理',
    eyebrow: '内容管理',
    title: '知识分类',
    placeholder: '按分类名或描述搜索',
    permission: 'categories:view',
    group: 'content',
  },
  {
    key: 'articles',
    label: '文章管理',
    eyebrow: '内容管理',
    title: '知识文章',
    placeholder: '按标题、正文、分类搜索',
    permission: 'articles:view',
    group: 'content',
  },
  {
    key: 'products',
    label: '商品管理',
    eyebrow: '商品管理',
    title: '商品管理',
    placeholder: '按商品名、描述、商家搜索',
    permission: 'products:view',
    group: 'commerce',
  },
  {
    key: 'orders',
    label: '订单管理',
    eyebrow: '订单履约',
    title: '订单管理',
    placeholder: '按订单号、收货人、商家搜索',
    permission: 'orders:view',
    group: 'commerce',
  },
  {
    key: 'settings',
    label: '系统配置',
    eyebrow: '系统配置',
    title: '配置项',
    placeholder: '按 key、标签或说明搜索',
    permission: 'settings:view',
    group: 'system',
  },
  {
    key: 'auditLogs',
    label: '审计日志',
    eyebrow: '操作留痕',
    title: '管理员审计日志',
    placeholder: '按管理员、动作或资源搜索',
    permission: 'audit_logs:view',
    group: 'system',
  },
];

const sidebarGroups = [
  {
    key: 'workspace',
    label: '工作区',
    icon: 'DA',
    caption: '查看整体数据与趋势',
  },
  {
    key: 'management',
    label: '权限与用户',
    icon: 'GU',
    caption: '管理员、角色与用户',
  },
  {
    key: 'content',
    label: '内容管理',
    icon: 'CM',
    caption: '帖子、评论、分类、文章',
  },
  {
    key: 'commerce',
    label: '商城履约',
    icon: 'OR',
    caption: '订单查看与状态处理',
  },
  {
    key: 'system',
    label: '系统设置',
    icon: 'ST',
    caption: '配置项与审计留痕',
  },
];

const listLoaders = {
  adminUsers: adminApi.getAdminUsers,
  users: adminApi.getUsers,
  posts: adminApi.getPosts,
  comments: adminApi.getComments,
  categories: adminApi.getCategories,
  articles: adminApi.getArticles,
  products: adminApi.getProducts,
  orders: adminApi.getOrders,
  settings: async () => {
    const items = await adminApi.getSystemSettings();
    return { items, total: items.length };
  },
  auditLogs: adminApi.getAuditLogs,
};

const detailLoaders = {
  users: adminApi.getUserDetail,
  posts: adminApi.getPostDetail,
  comments: adminApi.getCommentDetail,
  categories: adminApi.getCategoryDetail,
  articles: adminApi.getArticleDetail,
  products: adminApi.getProductDetail,
  orders: adminApi.getOrderDetail,
};

const trendMetrics = [
  ['users', '用户新增'],
  ['pets', '宠物新增'],
  ['posts', '帖子新增'],
  ['bookings', '预约新增'],
  ['articles', '文章新增'],
];

const tabIcons = {
  dashboard: 'DA',
  adminUsers: 'PM',
  users: 'US',
  posts: 'PO',
  comments: 'CM',
  categories: 'CT',
  articles: 'AR',
  products: 'PD',
  orders: 'OD',
  settings: 'ST',
  auditLogs: 'LG',
};

const heroMetricConfigs = [
  {
    key: 'totalUsers',
    label: '用户总数',
    helper: '平台注册用户',
    icon: 'US',
    tone: 'blue',
  },
  {
    key: 'totalPets',
    label: '宠物档案',
    helper: '已建立档案数量',
    icon: 'PT',
    tone: 'amber',
  },
  {
    key: 'totalArticles',
    label: '知识内容',
    helper: '文章与推荐内容',
    icon: 'KN',
    tone: 'green',
  },
  {
    key: 'totalBookings',
    label: '社区预约',
    helper: '用户预约记录',
    icon: 'BK',
    tone: 'violet',
  },
];

const secondaryMetricKeys = [
  'totalPosts',
  'totalComments',
  'totalVaccinations',
  'totalDewormings',
  'totalCheckups',
  'totalCares',
  'totalCategories',
];

const roleGuides = [
  {
    role: 'super_admin',
    title: '超级管理员',
    description: '拥有系统全部权限，可管理管理员账号、系统配置和危险删除操作。',
  },
  {
    role: 'content_admin',
    title: '内容管理员',
    description: '负责帖子评论审核、文章和分类维护，不可修改系统配置或执行危险删除。',
  },
  {
    role: 'viewer_admin',
    title: '只读管理员',
    description: '用于演示或巡检，只能查看数据、列表和审计日志，不能修改业务数据。',
  },
  {
    role: 'merchant_admin',
    title: '商家账号',
    description: '共用同一后台登录入口，只能查看并处理自己商家的订单。',
  },
];

const ORDER_STATUS_LABELS = {
  pending_confirmation: '待支付',
  processing: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

function getDefaultAdminTab(adminProfile) {
  const nextPermissions = adminProfile?.permissions || [];
  if (nextPermissions.includes('dashboard:view')) {
    return 'dashboard';
  }
  if (nextPermissions.includes('products:view')) {
    return 'products';
  }
  if (nextPermissions.includes('orders:view')) {
    return 'orders';
  }
  return tabs.find((item) => nextPermissions.includes(item.permission))?.key || 'dashboard';
}

function formatPrice(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function parseSkuText(value) {
  const lines = (value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [spec_name = '', spec_value = '', price = '0', stock = '0'] = line.split('|').map((item) => item.trim());
    return {
      spec_name,
      spec_value,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      status: 'active',
    };
  });
}

function stringifySkus(skus = []) {
  return skus
    .filter((item) => item.status !== 'inactive')
    .map((item) => [item.spec_name, item.spec_value, item.price, item.stock].join('|'))
    .join('\n');
}

function LoginView({ loading, error, onSubmit }) {
  const [form, setForm] = useState({
    username: 'admin',
    password: 'admin123456',
  });

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="eyebrow">Pet Assistant Admin</div>
        <h1>管理端登录</h1>
        <p className="login-copy">
          使用独立管理员账号进入管理台。默认演示账号来自后端环境变量。
        </p>
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <label>
            <span>管理员账号</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="请输入管理员账号"
            />
          </label>
          <label>
            <span>管理员密码</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="请输入管理员密码"
            />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? '登录中...' : '进入管理台'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DetailDrawer({ detailType, detailData, loading, onClose }) {
  return (
    <aside className={`drawer ${detailData || loading ? 'drawer-open' : ''}`}>
      <div className="drawer-header">
        <div>
          <div className="eyebrow">详情查看</div>
          <h2>{getDetailTitle(detailType, detailData, loading)}</h2>
          {detailType ? (
            <div className="drawer-subtitle">{getDetailSubtitle(detailType, detailData)}</div>
          ) : null}
        </div>
        <button className="ghost-button" onClick={onClose}>
          关闭
        </button>
      </div>

      {loading ? (
        <div className="panel-muted">正在加载详情...</div>
      ) : !detailData ? (
        <div className="panel-muted">暂无数据</div>
      ) : (
        <div className="drawer-content">{renderDetailContent(detailType, detailData)}</div>
      )}
    </aside>
  );
}

function CategoryModal({
  loading,
  visible,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">知识分类</div>
            <h2>{mode === 'create' ? '新增分类' : '编辑分类'}</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>分类名称</span>
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="请输入分类名称"
            />
          </label>
          <label>
            <span>分类描述</span>
            <textarea
              rows="5"
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              placeholder="请输入分类描述"
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={loading}>
            {loading ? '提交中...' : mode === 'create' ? '创建分类' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleModal({
  loading,
  visible,
  mode,
  form,
  categories,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-card-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">知识文章</div>
            <h2>{mode === 'create' ? '新增文章' : '编辑文章'}</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>文章标题</span>
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="请输入文章标题"
            />
          </label>
          <label>
            <span>所属分类</span>
            <select
              value={form.categoryId}
              onChange={(event) => onChange('categoryId', event.target.value)}
            >
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>封面图地址</span>
            <input
              value={form.cover_image}
              onChange={(event) => onChange('cover_image', event.target.value)}
              placeholder="/uploads/article-cover.jpg"
            />
          </label>
          <label>
            <span>内容类型</span>
            <select
              value={form.kind}
              onChange={(event) => onChange('kind', event.target.value)}
            >
              <option value="knowledge">知识文章</option>
              <option value="product">用品推荐</option>
            </select>
          </label>
          <label>
            <span>发布状态</span>
            <select
              value={form.status}
              onChange={(event) => onChange('status', event.target.value)}
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已下架</option>
            </select>
          </label>
          <label>
            <span>推荐权重</span>
            <input
              value={form.sort_order}
              onChange={(event) => onChange('sort_order', event.target.value)}
              placeholder="0"
            />
          </label>
          <label>
            <span>推荐理由</span>
            <input
              value={form.recommendation_reason}
              onChange={(event) => onChange('recommendation_reason', event.target.value)}
              placeholder="写给前台用户看的推荐理由"
            />
          </label>
          <label>
            <span>关联商品 ID</span>
            <input
              value={form.linked_product_id}
              onChange={(event) => onChange('linked_product_id', event.target.value)}
              placeholder="填写商品 ID 后，前台会优先跳商品详情"
            />
          </label>
          <label className="checkbox-field">
            <span>推荐位展示</span>
            <input
              type="checkbox"
              checked={Boolean(form.is_recommended)}
              onChange={(event) => onChange('is_recommended', event.target.checked)}
            />
          </label>
          <label>
            <span>文章正文</span>
            <textarea
              rows="12"
              value={form.content}
              onChange={(event) => onChange('content', event.target.value)}
              placeholder="请输入文章正文"
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={loading}>
            {loading ? '提交中...' : mode === 'create' ? '创建文章' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminUserModal({
  loading,
  visible,
  form,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">权限管理</div>
            <h2>新增管理员</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>管理员账号</span>
            <input
              value={form.username}
              onChange={(event) => onChange('username', event.target.value)}
              placeholder="请输入管理员账号"
            />
          </label>
          <label>
            <span>初始密码</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange('password', event.target.value)}
              placeholder="请输入初始密码"
            />
          </label>
          <label>
            <span>角色</span>
            <select
              value={form.role}
              onChange={(event) => onChange('role', event.target.value)}
            >
              {roleGuides.map((item) => (
                <option key={item.role} value={item.role}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={loading}>
            {loading ? '创建中...' : '创建管理员'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  loading,
  visible,
  mode,
  form,
  isMerchantAccount,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">商品管理</div>
            <h2>{mode === 'create' ? '新增商品' : '编辑商品'}</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="form-grid">
          {!isMerchantAccount ? (
            <label>
              <span>商家 ID</span>
              <input
                value={form.merchant_id}
                onChange={(event) => onChange('merchant_id', event.target.value)}
                placeholder="平台账号创建商品时必填"
              />
            </label>
          ) : null}
          <label>
            <span>商品名称</span>
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="请输入商品名称"
            />
          </label>
          <label>
            <span>封面图地址</span>
            <input
              value={form.cover_image}
              onChange={(event) => onChange('cover_image', event.target.value)}
              placeholder="/uploads/product-cover.jpg"
            />
          </label>
          <label>
            <span>状态</span>
            <select
              value={form.status}
              onChange={(event) => onChange('status', event.target.value)}
            >
              <option value="active">上架中</option>
              <option value="inactive">已下架</option>
            </select>
          </label>
          <label>
            <span>推荐权重</span>
            <input
              value={form.sort_order}
              onChange={(event) => onChange('sort_order', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="checkbox-field">
            <span>推荐商品</span>
            <input
              type="checkbox"
              checked={Boolean(form.is_recommended)}
              onChange={(event) => onChange('is_recommended', event.target.checked)}
            />
          </label>
          <label>
            <span>商品描述</span>
            <textarea
              rows="6"
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              placeholder="请输入商品描述"
            />
          </label>
          <label>
            <span>规格列表</span>
            <textarea
              rows="8"
              value={form.sku_text}
              onChange={(event) => onChange('sku_text', event.target.value)}
              placeholder={'每行一条规格，格式：规格名|规格值|价格|库存\n例如：颜色|森林绿|29.9|20'}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={loading}>
            {loading ? '提交中...' : mode === 'create' ? '创建商品' : '保存商品'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [admin, setAdmin] = useState(null);
  const [overview, setOverview] = useState(emptyOverview);
  const [trends, setTrends] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailType, setDetailType] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('create');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [articleModalMode, setArticleModalMode] = useState('create');
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    cover_image: '',
    categoryId: '',
    status: 'published',
    kind: 'knowledge',
    is_recommended: false,
    sort_order: '0',
    recommendation_reason: '',
    linked_product_id: '',
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [productModalMode, setProductModalMode] = useState('create');
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    merchant_id: '',
    name: '',
    cover_image: '',
    description: '',
    status: 'active',
    sort_order: '0',
    is_recommended: false,
    sku_text: '',
  });
  const [adminUserModalVisible, setAdminUserModalVisible] = useState(false);
  const [adminUserForm, setAdminUserForm] = useState({
    username: '',
    password: '',
    role: 'content_admin',
  });
  const [auditFilters, setAuditFilters] = useState({
    admin_username: '',
    action: '',
    resource_type: '',
  });
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const pageSize = 10;
  const permissions = admin?.permissions || [];
  const hasPermission = (permission) => permissions.includes(permission);
  const visibleTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (!admin) {
          return true;
        }
        return !tab.permission || permissions.includes(tab.permission);
      }),
    [admin, permissions],
  );

  const visibleTabGroups = useMemo(
    () =>
      sidebarGroups
        .map((group) => ({
          ...group,
          tabs: visibleTabs.filter((tab) => tab.group === group.key),
        }))
        .filter((group) => group.tabs.length > 0),
    [visibleTabs],
  );

  const activeTabMeta = useMemo(
    () => visibleTabs.find((tab) => tab.key === activeTab) || visibleTabs[0] || tabs[0],
    [activeTab, visibleTabs],
  );
  const activeGroupKey = activeTabMeta?.group || visibleTabGroups[0]?.key || '';

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  const bootstrap = async () => {
    const token = getAdminToken();
    if (!token) {
      setBooting(false);
      return;
    }

    try {
      const response = await adminApi.profile();
      setAdmin(response.admin);
      setActiveTab(getDefaultAdminTab(response.admin));
    } catch {
      setAdmin(null);
      setAdminToken('');
    } finally {
      setBooting(false);
    }
  };

  const loadOverview = async () => {
    if (!hasPermission('dashboard:view')) {
      return;
    }
    const [overviewData, trendData] = await Promise.all([
      adminApi.getOverview(),
      adminApi.getDashboardTrends(),
    ]);
    setOverview(overviewData);
    setTrends(trendData);
  };

  const loadList = async (tab = activeTab, nextPage = page, nextKeyword = keyword) => {
    if (tab === 'dashboard') {
      setRows([]);
      setTotal(0);
      return;
    }

    const loader = listLoaders[tab];
    if (!loader) {
      setRows([]);
      setTotal(0);
      return;
    }

    const response = await loader(
      tab === 'auditLogs'
        ? {
            keyword: nextKeyword,
            page: nextPage,
            pageSize,
            ...auditFilters,
          }
        : {
            keyword: nextKeyword,
            page: nextPage,
            pageSize,
          },
    );

    if (tab === 'settings') {
      const items = (response.items || []).filter((item) => {
        if (!nextKeyword) {
          return true;
        }
        const target = `${item.key || ''} ${item.label || ''} ${item.description || ''}`.toLowerCase();
        return target.includes(nextKeyword.toLowerCase());
      });
      setRows(items);
      setTotal(items.length);
      return;
    }

    setRows(response.items || []);
    setTotal(response.total || 0);
  };

  const refreshCurrentView = async (tab = activeTab, nextPage = page, nextKeyword = keyword) => {
    if (tab === 'dashboard') {
      await loadOverview();
      return;
    }

    const tasks = [loadList(tab, nextPage, nextKeyword)];
    if (hasPermission('dashboard:view')) {
      tasks.unshift(loadOverview());
    }
    await Promise.all(tasks);
  };

  const loadDetail = async (tab, id) => {
    const loader = detailLoaders[tab];
    if (!loader) {
      return;
    }

    setDetailLoading(true);
    setDetailType(tab);
    try {
      const response = await loader(id);
      setDetailData(response);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '获取详情失败'));
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadCategoryOptions = async () => {
    const response = await adminApi.getCategories({
      page: 1,
      pageSize: 100,
      keyword: '',
    });
    setCategoryOptions(response.items || []);
  };

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!admin) {
      return;
    }

    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key || 'dashboard');
    }
  }, [activeTab, admin, visibleTabs]);

  useEffect(() => {
    if (!activeGroupKey) {
      return;
    }

    setCollapsedGroups((prev) => ({
      ...prev,
      [activeGroupKey]: false,
    }));
  }, [activeGroupKey]);

  useEffect(() => {
    if (!admin) {
      return;
    }

    setListLoading(true);
    refreshCurrentView()
      .catch((error) => {
        window.alert(adminApi.getErrorMessage(error, '获取管理台数据失败'));
      })
      .finally(() => {
        setListLoading(false);
      });
  }, [admin, activeTab, keyword, page, auditFilters]);

  const handleLogin = async (form) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await adminApi.login(form);
      setAdminToken(response.token);
      setAdmin(response.admin);
      setActiveTab(getDefaultAdminTab(response.admin));
    } catch (error) {
      setAuthError(adminApi.getErrorMessage(error, '管理员登录失败'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdmin(null);
    setRows([]);
    setDetailType('');
    setDetailData(null);
    setOverview(emptyOverview);
    setTrends(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setKeywordInput('');
    setKeyword('');
    setPage(1);
    setDetailType('');
    setDetailData(null);
    setAuditFilters({
      admin_username: '',
      action: '',
      resource_type: '',
    });
  };

  const handleGroupToggle = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const handleDelete = async (tab, item) => {
    const actions = {
      users: {
        label: `用户“${item.nickname || item.phone || item.id}”`,
        message: '该用户及其宠物/记录将一并删除。',
        request: () => adminApi.deleteUser(item.id),
      },
      posts: {
        label: `帖子“${item.title || item.id}”`,
        message: '该帖子的评论也会一并删除。',
        request: () => adminApi.deletePost(item.id),
      },
      comments: {
        label: `评论 #${item.id}`,
        message: '删除后无法恢复。',
        request: () => adminApi.deleteComment(item.id),
      },
      products: {
        label: `商品“${item.name || item.id}”`,
        message: '删除后将同步移除该商品的规格。',
        request: () => adminApi.deleteProduct(item.id),
      },
      categories: {
        label: `分类“${item.name || item.id}”`,
        message: '如果分类下仍有文章，后端会阻止删除。',
        request: () => adminApi.deleteCategory(item.id),
      },
      articles: {
        label: `文章“${item.title || item.id}”`,
        message: '删除后无法恢复。',
        request: () => adminApi.deleteArticle(item.id),
      },
    };

    const action = actions[tab];
    if (!action) {
      return;
    }

    const confirmed = window.confirm(`确认删除${action.label}吗？${action.message}`);
    if (!confirmed) {
      return;
    }

    try {
      await action.request();
      if (detailData?.id === item.id && detailType === tab) {
        setDetailData(null);
        setDetailType('');
      }

      const nextTotal = total > 0 ? total - 1 : 0;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.min(page, nextTotalPages);

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await refreshCurrentView(tab, nextPage, keyword);
      }
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '删除失败'));
    }
  };

  const handleStatusUpdate = async (tab, item, status) => {
    try {
      if (tab === 'posts') {
        await adminApi.updatePostStatus(item.id, status);
      } else if (tab === 'comments') {
        await adminApi.updateCommentStatus(item.id, status);
      } else if (tab === 'orders') {
        await adminApi.updateOrderStatus(item.id, status);
      }
      await refreshCurrentView(tab, page, keyword);
      if (detailType === tab && detailData?.id === item.id) {
        await loadDetail(tab, item.id);
      }
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '更新状态失败'));
    }
  };

  const handleSettingUpdate = async (item) => {
    const nextValue = window.prompt(`更新配置 ${item.label || item.key}`, item.value || '');
    if (nextValue === null) {
      return;
    }

    try {
      await adminApi.updateSystemSetting(item.key, { value: nextValue });
      await refreshCurrentView('settings', 1, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '更新配置失败'));
    }
  };

  const openAdminUserModal = () => {
    setAdminUserForm({
      username: '',
      password: '',
      role: 'content_admin',
    });
    setAdminUserModalVisible(true);
  };

  const handleAdminUserSubmit = async () => {
    const payload = {
      username: adminUserForm.username.trim(),
      password: adminUserForm.password.trim(),
      role: adminUserForm.role,
    };

    if (!payload.username || !payload.password) {
      window.alert('管理员账号和密码不能为空');
      return;
    }

    setModalLoading(true);
    try {
      await adminApi.createAdminUser(payload);
      setAdminUserModalVisible(false);
      await refreshCurrentView('adminUsers', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '创建管理员失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleAdminRoleChange = async (item) => {
    const nextRole = window.prompt(
      '请输入新角色：super_admin / content_admin / viewer_admin / merchant_admin',
      item.role || 'content_admin',
    );
    if (!nextRole) {
      return;
    }

    try {
      await adminApi.updateAdminUserRole(item.id, nextRole.trim());
      await refreshCurrentView('adminUsers', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '更新角色失败'));
    }
  };

  const handleAdminStatusChange = async (item) => {
    const nextStatus = item.status === 'active' ? 'disabled' : 'active';
    const confirmed = window.confirm(
      `确认将管理员“${item.username}”设置为 ${nextStatus === 'active' ? '启用' : '停用'}吗？`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminApi.updateAdminUserStatus(item.id, nextStatus);
      await refreshCurrentView('adminUsers', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '更新状态失败'));
    }
  };

  const handleAdminPasswordReset = async (item) => {
    const nextPassword = window.prompt(`为管理员“${item.username}”设置新密码`);
    if (!nextPassword) {
      return;
    }

    try {
      await adminApi.resetAdminUserPassword(item.id, nextPassword.trim());
      window.alert('密码已重置');
      await refreshCurrentView('adminUsers', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '重置密码失败'));
    }
  };

  const openCategoryModalForCreate = () => {
    setEditingCategoryId(null);
    setCategoryModalMode('create');
    setCategoryForm({ name: '', description: '' });
    setCategoryModalVisible(true);
  };

  const openProductModalForCreate = () => {
    setEditingProductId(null);
    setProductModalMode('create');
    setProductForm({
      merchant_id: admin?.account_type === 'merchant' ? String(admin?.merchant_id || '') : '',
      name: '',
      cover_image: '',
      description: '',
      status: 'active',
      sort_order: '0',
      is_recommended: false,
      sku_text: '',
    });
    setProductModalVisible(true);
  };

  const openProductModalForEdit = async (productId) => {
    setModalLoading(true);
    try {
      const detail = await adminApi.getProductDetail(productId);
      setEditingProductId(productId);
      setProductModalMode('edit');
      setProductForm({
        merchant_id: detail.merchant?.id ? String(detail.merchant.id) : '',
        name: detail.name || '',
        cover_image: detail.cover_image || '',
        description: detail.description || '',
        status: detail.status || 'active',
        sort_order: String(detail.sort_order ?? 0),
        is_recommended: Boolean(detail.is_recommended),
        sku_text: stringifySkus(detail.skus || []),
      });
      setProductModalVisible(true);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '获取商品详情失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const openCategoryModalForEdit = async (categoryId) => {
    setModalLoading(true);
    try {
      const detail = await adminApi.getCategoryDetail(categoryId);
      setEditingCategoryId(categoryId);
      setCategoryModalMode('edit');
      setCategoryForm({
        name: detail.name || '',
        description: detail.description || '',
      });
      setCategoryModalVisible(true);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '获取分类详情失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const openArticleModalForCreate = async () => {
    setModalLoading(true);
    try {
      await loadCategoryOptions();
      setEditingArticleId(null);
      setArticleModalMode('create');
      setArticleForm({
        title: '',
        content: '',
        cover_image: '',
        categoryId: '',
        status: 'published',
        kind: 'knowledge',
        is_recommended: false,
        sort_order: '0',
        recommendation_reason: '',
        linked_product_id: '',
      });
      setArticleModalVisible(true);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '加载分类失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const openArticleModalForEdit = async (articleId) => {
    setModalLoading(true);
    try {
      const [detail] = await Promise.all([
        adminApi.getArticleDetail(articleId),
        loadCategoryOptions(),
      ]);

      setEditingArticleId(articleId);
      setArticleModalMode('edit');
      setArticleForm({
        title: detail.title || '',
        content: detail.content || '',
        cover_image: detail.cover_image || '',
        categoryId: detail.category?.id ? String(detail.category.id) : '',
        status: detail.status || 'published',
        kind: detail.kind || 'knowledge',
        is_recommended: Boolean(detail.is_recommended),
        sort_order: String(detail.sort_order ?? 0),
        recommendation_reason: detail.recommendation_reason || '',
        linked_product_id: detail.linked_product_id ? String(detail.linked_product_id) : '',
      });
      setArticleModalVisible(true);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '获取文章详情失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleCategorySubmit = async () => {
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
    };

    if (!payload.name) {
      window.alert('分类名称不能为空');
      return;
    }

    setModalLoading(true);
    try {
      if (categoryModalMode === 'create') {
        await adminApi.createCategory(payload);
      } else if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, payload);
      }

      setCategoryModalVisible(false);
      await refreshCurrentView('categories', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '保存分类失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleProductSubmit = async () => {
    const payload = {
      merchant_id: productForm.merchant_id ? Number(productForm.merchant_id) : null,
      name: productForm.name.trim(),
      cover_image: productForm.cover_image.trim(),
      description: productForm.description.trim(),
      status: productForm.status,
      sort_order: Number(productForm.sort_order) || 0,
      is_recommended: Boolean(productForm.is_recommended),
      skus: parseSkuText(productForm.sku_text),
    };

    if (!payload.name) {
      window.alert('商品名称不能为空');
      return;
    }
    if (!payload.skus.length) {
      window.alert('请至少填写一个规格');
      return;
    }

    setModalLoading(true);
    try {
      if (productModalMode === 'create') {
        await adminApi.createProduct(payload);
      } else if (editingProductId) {
        await adminApi.updateProduct(editingProductId, payload);
      }

      setProductModalVisible(false);
      await refreshCurrentView('products', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '保存商品失败'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleArticleSubmit = async () => {
    const payload = {
      title: articleForm.title.trim(),
      content: articleForm.content.trim(),
      cover_image: articleForm.cover_image.trim(),
      categoryId: Number(articleForm.categoryId),
      status: articleForm.status,
      kind: articleForm.kind,
      is_recommended: Boolean(articleForm.is_recommended),
      sort_order: Number(articleForm.sort_order) || 0,
      recommendation_reason: articleForm.recommendation_reason.trim(),
      linked_product_id: articleForm.linked_product_id ? Number(articleForm.linked_product_id) : null,
    };

    if (!payload.title || !payload.content || !payload.categoryId) {
      window.alert('标题、正文、分类不能为空');
      return;
    }

    setModalLoading(true);
    try {
      if (articleModalMode === 'create') {
        await adminApi.createArticle(payload);
      } else if (editingArticleId) {
        await adminApi.updateArticle(editingArticleId, payload);
      }

      setArticleModalVisible(false);
      await refreshCurrentView('articles', page, keyword);
    } catch (error) {
      window.alert(adminApi.getErrorMessage(error, '保存文章失败'));
    } finally {
      setModalLoading(false);
    }
  };

  if (booting) {
    return <div className="fullscreen-loading">正在加载管理台...</div>;
  }

  if (!admin) {
    return (
      <LoginView
        loading={authLoading}
        error={authError}
        onSubmit={handleLogin}
      />
    );
  }

  const heroMetrics = heroMetricConfigs.map((item) => ({
    ...item,
    value: overview[item.key] ?? 0,
  }));
  const secondaryMetrics = overviewLabels
    .filter(([key]) => secondaryMetricKeys.includes(key))
    .map(([key, label]) => ({ key, label, value: overview[key] ?? 0 }));
  const summaryHighlights = [
    `近 7 天帖子 ${trends?.recentActivity?.posts ?? 0}`,
    `评论 ${trends?.recentActivity?.comments ?? 0}`,
    `预约 ${trends?.recentActivity?.bookings ?? 0}`,
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">PA</div>
          <div>
            <div className="brand-title">宠物助手</div>
            <div className="brand-subtitle">Admin Console</div>
          </div>
        </div>

        <div className="sidebar-section-label">导航</div>
        <div className="sidebar-nav-groups">
          {visibleTabGroups.map((group) => (
            <section className="sidebar-nav-group" key={group.key}>
              <button
                className={`sidebar-group-trigger ${collapsedGroups[group.key] ? '' : 'sidebar-group-trigger-open'}`}
                onClick={() => handleGroupToggle(group.key)}
                type="button"
              >
                <span className="sidebar-group-main">
                  <span className="sidebar-group-icon">{group.icon}</span>
                  <span className="sidebar-group-copy">
                    <span className="sidebar-group-title">{group.label}</span>
                    <span className="sidebar-group-caption">
                      {group.caption}
                    </span>
                  </span>
                </span>
                <span className="sidebar-group-meta">
                  <span className={`sidebar-group-chevron ${collapsedGroups[group.key] ? '' : 'sidebar-group-chevron-open'}`}>
                    ▾
                  </span>
                </span>
              </button>
              <nav className={`sidebar-nav sidebar-subnav ${collapsedGroups[group.key] ? 'sidebar-subnav-collapsed' : ''}`}>
                {group.tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`sidebar-link ${activeTab === tab.key ? 'sidebar-link-active' : ''}`}
                    onClick={() => handleTabChange(tab.key)}
                  >
                    <span className="sidebar-link-icon">{tabIcons[tab.key] || 'TB'}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-section-label">当前角色</div>
          <div className="sidebar-role-card">
            <strong>{admin.role_label || '管理员'}</strong>
            <span>{admin.username}</span>
          </div>
          <button className="ghost-button sidebar-logout" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-topbar">
          <div className="workspace-heading">
            <div className="workspace-kicker">{activeTabMeta.eyebrow}</div>
            <h1>{activeTabMeta.title}</h1>
            <p className="workspace-copy">
              当前后端地址：{adminApi.getBaseUrl()}
            </p>
          </div>

          <div className="workspace-topbar-actions">
            <button
              className="ghost-button"
              onClick={() => {
                setListLoading(true);
                refreshCurrentView(activeTab, page, keyword)
                  .catch((error) => {
                    window.alert(adminApi.getErrorMessage(error, '刷新数据失败'));
                  })
                  .finally(() => setListLoading(false));
              }}
            >
              刷新数据
            </button>
            <div className="admin-pill">
              <span className="admin-pill-avatar">
                {(admin.username || 'A').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{admin.username}</strong>
                <span>{admin.role_label || admin.role || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="workspace-main">
          {activeTab === 'dashboard' ? (
            <>
              <section className="hero-metric-grid">
                {heroMetrics.map((item) => (
                  <article className={`hero-metric-card tone-${item.tone}`} key={item.key}>
                    <div className="hero-metric-icon">{item.icon}</div>
                    <div className="hero-metric-body">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.helper}</small>
                    </div>
                  </article>
                ))}
              </section>

              <section className="surface-panel summary-panel">
                <div className="summary-panel-header">
                  <div>
                    <div className="eyebrow">业务概览</div>
                    <h2>全局数据与活跃趋势</h2>
                  </div>
                  <div className="trend-summary-inline">
                    {summaryHighlights.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="summary-metric-strip">
                  {secondaryMetrics.map((item) => (
                    <div className="summary-metric-chip" key={item.key}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>

                {trends ? (
                  <div className="trend-card-grid">
                    {trendMetrics.map(([metricKey, label]) => (
                      <article className="trend-card" key={metricKey}>
                        <div className="trend-card-header">
                          <strong>{label}</strong>
                          <span>{`30 天 ${trends.last30Days?.totals?.[metricKey] ?? 0}`}</span>
                        </div>
                        <div className="trend-bars">
                          {(trends.last7Days?.daily || []).map((point) => {
                            const values = (trends.last7Days?.daily || []).map((item) => item[metricKey] || 0);
                            const maxValue = Math.max(...values, 1);
                            const height = `${Math.max(((point[metricKey] || 0) / maxValue) * 100, point[metricKey] ? 18 : 8)}%`;

                            return (
                              <div className="trend-bar-item" key={`${metricKey}-${point.date}`}>
                                <div className="trend-bar-track">
                                  <div className="trend-bar-fill" style={{ height }} />
                                </div>
                                <span className="trend-bar-value">{point[metricKey] || 0}</span>
                                <span className="trend-bar-label">{point.date.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          ) : null}

          {activeTab !== 'dashboard' ? (
          <section className="surface-panel control-panel">
            <div className="panel-header">
              <div className="panel-title-stack">
                <div className="eyebrow">{activeTabMeta.eyebrow}</div>
                <h2>{activeTabMeta.title}</h2>
              </div>

              <div className="panel-toolbar">
                {((activeTab === 'categories' && hasPermission('categories:create'))
                  || (activeTab === 'articles' && hasPermission('articles:create'))
                  || (activeTab === 'products' && hasPermission('products:create'))
                  || (activeTab === 'adminUsers' && hasPermission('admin_users:create'))) && (
                  <button
                    className="primary-button"
                    onClick={
                      activeTab === 'categories'
                        ? openCategoryModalForCreate
                        : activeTab === 'articles'
                          ? openArticleModalForCreate
                          : activeTab === 'products'
                            ? openProductModalForCreate
                          : openAdminUserModal
                    }
                    disabled={modalLoading}
                  >
                    {activeTab === 'categories'
                      ? '新增分类'
                      : activeTab === 'articles'
                        ? '新增文章'
                        : activeTab === 'products'
                          ? '新增商品'
                        : '新增管理员'}
                  </button>
                )}

                <form className="search-form" onSubmit={handleSearchSubmit}>
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder={activeTabMeta.placeholder}
                  />
                  <button className="ghost-button" type="submit">
                    搜索
                  </button>
                </form>
              </div>
            </div>

            {activeTab === 'auditLogs' ? (
              <div className="filter-row">
                <input
                  value={auditFilters.admin_username}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, admin_username: event.target.value }))
                  }
                  placeholder="按管理员筛选"
                />
                <input
                  value={auditFilters.action}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, action: event.target.value }))
                  }
                  placeholder="按动作筛选"
                />
                <input
                  value={auditFilters.resource_type}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, resource_type: event.target.value }))
                  }
                  placeholder="按资源类型筛选"
                />
              </div>
            ) : null}

            {activeTab === 'adminUsers' ? (
              <div className="role-guide-grid">
                {roleGuides.map((item) => (
                  <article className="role-guide-card" key={item.role}>
                    <strong>{item.title}</strong>
                    <span>{item.role}</span>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
          ) : null}

          {activeTab !== 'dashboard' ? (
          <section className="surface-panel content-panel">
            <div className="table-shell">
              <table>
                <thead>{renderTableHead(activeTab)}</thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={getColumnCount(activeTab)} className="panel-muted">
                        正在加载列表...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={getColumnCount(activeTab)} className="panel-muted">
                        暂无匹配数据
                      </td>
                    </tr>
                  ) : (
                    renderTableRows(activeTab, rows, {
                      onView: (id) => loadDetail(activeTab, id),
                      onDelete: (item) => handleDelete(activeTab, item),
                      onAdminRoleChange: handleAdminRoleChange,
                      onAdminStatusChange: handleAdminStatusChange,
                      onAdminPasswordReset: handleAdminPasswordReset,
                      onEditCategory: openCategoryModalForEdit,
                      onEditArticle: openArticleModalForEdit,
                      onEditProduct: openProductModalForEdit,
                      onStatusChange: (item, status) => handleStatusUpdate(activeTab, item, status),
                      onEditSetting: handleSettingUpdate,
                      canDeleteUsers: hasPermission('users:delete'),
                      canDeletePosts: hasPermission('posts:delete'),
                      canReviewPosts: hasPermission('posts:review'),
                      canDeleteComments: hasPermission('comments:delete'),
                      canReviewComments: hasPermission('comments:review'),
                      canCreateCategories: hasPermission('categories:create'),
                      canEditCategories: hasPermission('categories:update'),
                      canDeleteCategories: hasPermission('categories:delete'),
                      canCreateArticles: hasPermission('articles:create'),
                      canEditArticles: hasPermission('articles:update'),
                      canDeleteArticles: hasPermission('articles:delete'),
                      canCreateProducts: hasPermission('products:create'),
                      canEditProducts: hasPermission('products:update'),
                      canDeleteProducts: hasPermission('products:delete'),
                      canEditSettings: hasPermission('settings:update'),
                      canManageAdminUsers: hasPermission('admin_users:update_role') || hasPermission('admin_users:update_status') || hasPermission('admin_users:reset_password'),
                    })
                )}
              </tbody>
            </table>
            </div>

            <div className="pagination">
              <span>
                共 {total} 条，第 {page} / {totalPages} 页
              </span>
              <div className="pagination-actions">
                <button
                  className="ghost-button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  上一页
                </button>
                <button
                  className="ghost-button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          </section>
          ) : null}
        </main>
      </div>

      <DetailDrawer
        detailType={detailType}
        detailData={detailData}
        loading={detailLoading}
        onClose={() => {
          setDetailType('');
          setDetailData(null);
        }}
      />

      <CategoryModal
        loading={modalLoading}
        visible={categoryModalVisible}
        mode={categoryModalMode}
        form={categoryForm}
        onChange={(field, value) =>
          setCategoryForm((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setCategoryModalVisible(false)}
        onSubmit={handleCategorySubmit}
      />

      <ArticleModal
        loading={modalLoading}
        visible={articleModalVisible}
        mode={articleModalMode}
        form={articleForm}
        categories={categoryOptions}
        onChange={(field, value) =>
          setArticleForm((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setArticleModalVisible(false)}
        onSubmit={handleArticleSubmit}
      />

      <ProductModal
        loading={modalLoading}
        visible={productModalVisible}
        mode={productModalMode}
        form={productForm}
        isMerchantAccount={admin?.account_type === 'merchant'}
        onChange={(field, value) =>
          setProductForm((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setProductModalVisible(false)}
        onSubmit={handleProductSubmit}
      />

      <AdminUserModal
        loading={modalLoading}
        visible={adminUserModalVisible}
        form={adminUserForm}
        onChange={(field, value) =>
          setAdminUserForm((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setAdminUserModalVisible(false)}
        onSubmit={handleAdminUserSubmit}
      />
    </div>
  );
}

function renderTableHead(activeTab) {
  if (activeTab === 'adminUsers') {
    return (
      <tr>
        <th>ID</th>
        <th>管理员账号</th>
        <th>角色</th>
        <th>状态</th>
        <th>最近登录</th>
        <th>创建时间</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'users') {
    return (
      <tr>
        <th>ID</th>
        <th>昵称</th>
        <th>手机号</th>
        <th>邮箱</th>
        <th>注册时间</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'posts') {
    return (
      <tr>
        <th>ID</th>
        <th>帖子标题</th>
        <th>作者</th>
        <th>状态</th>
        <th>点赞</th>
        <th>评论</th>
        <th>发布时间</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'comments') {
    return (
      <tr>
        <th>ID</th>
        <th>评论内容</th>
        <th>所属帖子</th>
        <th>作者</th>
        <th>状态</th>
        <th>发布时间</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'settings') {
    return (
      <tr>
        <th>分组</th>
        <th>配置项</th>
        <th>当前值</th>
        <th>说明</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'auditLogs') {
    return (
      <tr>
        <th>时间</th>
        <th>管理员</th>
        <th>动作</th>
        <th>资源</th>
        <th>详情</th>
      </tr>
    );
  }

  if (activeTab === 'categories') {
    return (
      <tr>
        <th>ID</th>
        <th>分类名称</th>
        <th>描述</th>
        <th>文章数</th>
        <th>创建时间</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'products') {
    return (
      <tr>
        <th>ID</th>
        <th>商品名称</th>
        <th>商家</th>
        <th>状态</th>
        <th>价格区间</th>
        <th>库存</th>
        <th>操作</th>
      </tr>
    );
  }

  if (activeTab === 'orders') {
    return (
      <tr>
        <th>ID</th>
        <th>订单号</th>
        <th>商家</th>
        <th>收货人</th>
        <th>状态</th>
        <th>金额</th>
        <th>下单时间</th>
        <th>操作</th>
      </tr>
    );
  }

  return (
    <tr>
      <th>ID</th>
      <th>文章标题</th>
      <th>所属分类</th>
      <th>状态 / 类型</th>
      <th>浏览 / 点赞 / 收藏</th>
      <th>发布时间</th>
      <th>操作</th>
    </tr>
  );
}

function renderTableRows(activeTab, rows, handlers) {
  if (activeTab === 'adminUsers') {
    return rows.map((item) => (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>
          <div className="table-title">{item.username}</div>
          <div className="table-subcopy">{item.permissions?.length || 0} 个权限点</div>
        </td>
        <td>{item.role_label || item.role}</td>
        <td>{item.status === 'active' ? '启用中' : '已停用'}</td>
        <td>{formatDate(item.last_login_at)}</td>
        <td>{formatDate(item.created_at)}</td>
        <td>
          <div className="table-actions">
            {handlers.canManageAdminUsers ? (
              <>
                <button className="ghost-button" onClick={() => handlers.onAdminRoleChange(item)}>
                  改角色
                </button>
                <button className="ghost-button" onClick={() => handlers.onAdminStatusChange(item)}>
                  {item.status === 'active' ? '停用' : '启用'}
                </button>
                <button className="text-button" onClick={() => handlers.onAdminPasswordReset(item)}>
                  重置密码
                </button>
              </>
            ) : (
              <span className="table-subcopy">只读</span>
            )}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'users') {
    return rows.map((user) => (
      <tr key={user.id}>
        <td>{user.id}</td>
        <td>{user.nickname}</td>
        <td>{user.phone}</td>
        <td>{user.email || '未绑定'}</td>
        <td>{formatDate(user.created_at)}</td>
        <td>
          <div className="table-actions">
            <button className="text-button" onClick={() => handlers.onView(user.id)}>
              查看
            </button>
            {handlers.canDeleteUsers ? (
              <button className="danger-button" onClick={() => handlers.onDelete(user)}>
                删除
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'posts') {
    return rows.map((post) => (
      <tr key={post.id}>
        <td>{post.id}</td>
        <td>
          <div className="table-title">{post.title}</div>
          <div className="table-subcopy">{truncateText(post.content, 48)}</div>
        </td>
        <td>{post.author?.nickname || post.author?.phone || '--'}</td>
        <td>{post.status || 'approved'}</td>
        <td>{post.likes ?? 0}</td>
        <td>{post.comments ?? 0}</td>
        <td>{formatDate(post.created_at)}</td>
        <td>
          <div className="table-actions">
            <button className="text-button" onClick={() => handlers.onView(post.id)}>
              查看
            </button>
            {handlers.canReviewPosts ? (
              <button className="ghost-button" onClick={() => handlers.onStatusChange(post, post.status === 'approved' ? 'hidden' : 'approved')}>
                {post.status === 'approved' ? '下架' : '通过'}
              </button>
            ) : null}
            {handlers.canDeletePosts ? (
              <button className="danger-button" onClick={() => handlers.onDelete(post)}>
                删除
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'comments') {
    return rows.map((comment) => (
      <tr key={comment.id}>
        <td>{comment.id}</td>
        <td>{truncateText(comment.content, 42)}</td>
        <td>{comment.post?.title || '--'}</td>
        <td>{comment.author?.nickname || comment.author?.phone || '--'}</td>
        <td>{comment.status || 'approved'}</td>
        <td>{formatDate(comment.created_at)}</td>
        <td>
          <div className="table-actions">
            <button className="text-button" onClick={() => handlers.onView(comment.id)}>
              查看
            </button>
            {handlers.canReviewComments ? (
              <button className="ghost-button" onClick={() => handlers.onStatusChange(comment, comment.status === 'approved' ? 'hidden' : 'approved')}>
                {comment.status === 'approved' ? '下架' : '通过'}
              </button>
            ) : null}
            {handlers.canDeleteComments ? (
              <button className="danger-button" onClick={() => handlers.onDelete(comment)}>
                删除
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'categories') {
    return rows.map((category) => (
      <tr key={category.id}>
        <td>{category.id}</td>
        <td>{category.name}</td>
        <td>{truncateText(category.description, 48)}</td>
        <td>{category.articleCount ?? 0}</td>
        <td>{formatDate(category.created_at)}</td>
        <td>
          <div className="table-actions">
            <button className="text-button" onClick={() => handlers.onView(category.id)}>
              查看
            </button>
            {handlers.canEditCategories ? (
              <button
                className="ghost-button"
                onClick={() => handlers.onEditCategory(category.id)}
              >
                编辑
              </button>
            ) : null}
            {handlers.canDeleteCategories ? (
              <button className="danger-button" onClick={() => handlers.onDelete(category)}>
                删除
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'settings') {
    return rows.map((setting) => (
      <tr key={setting.key}>
        <td>{setting.group_name || '--'}</td>
        <td>
          <div className="table-title">{setting.label || setting.key}</div>
          <div className="table-subcopy">{setting.key}</div>
        </td>
        <td>{String(setting.value ?? '')}</td>
        <td>{truncateText(setting.description, 48)}</td>
        <td>
          <div className="table-actions">
            {handlers.canEditSettings ? (
              <button className="ghost-button" onClick={() => handlers.onEditSetting(setting)}>
                修改
              </button>
            ) : (
              <span className="table-subcopy">只读</span>
            )}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'auditLogs') {
    return rows.map((log) => (
      <tr key={log.id}>
        <td>{formatDate(log.created_at)}</td>
        <td>{`${log.admin_username || '--'} (${log.admin_role || '--'})`}</td>
        <td>{log.action || '--'}</td>
        <td>{`${log.resource_type || '--'} / ${log.resource_id || '--'}`}</td>
        <td>{truncateText(log.detail, 60)}</td>
      </tr>
    ));
  }

  if (activeTab === 'products') {
    return rows.map((product) => (
      <tr key={product.id}>
        <td>{product.id}</td>
        <td>
          <div className="table-title">{product.name}</div>
          <div className="table-subcopy">{truncateText(product.description, 42)}</div>
        </td>
        <td>{product.merchant?.name || '--'}</td>
        <td>{`${product.status === 'active' ? '上架中' : '已下架'}${product.is_recommended ? ' / 推荐' : ''}`}</td>
        <td>{`¥${product.price_range || '0.00'}`}</td>
        <td>{product.stock ?? 0}</td>
        <td>
          <div className="table-actions">
            <button className="text-button" onClick={() => handlers.onView(product.id)}>
              查看
            </button>
            {handlers.canEditProducts ? (
              <button className="ghost-button" onClick={() => handlers.onEditProduct(product.id)}>
                编辑
              </button>
            ) : null}
            {handlers.canDeleteProducts ? (
              <button className="danger-button" onClick={() => handlers.onDelete(product)}>
                删除
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }

  if (activeTab === 'orders') {
    return rows.map((order) => {
      const nextActionMap = {
        processing: 'shipped',
        shipped: 'completed',
      };
      const nextStatus = nextActionMap[order.status];
      const nextLabel = nextStatus ? ORDER_STATUS_LABELS[nextStatus] : '';

      return (
        <tr key={order.id}>
          <td>{order.id}</td>
          <td>
            <div className="table-title">{order.order_no}</div>
            <div className="table-subcopy">{order.items?.[0]?.product_name_snapshot || '--'}</div>
          </td>
          <td>{order.merchant?.name || '--'}</td>
          <td>{order.receiver_name || '--'}</td>
          <td>{ORDER_STATUS_LABELS[order.status] || order.status || '--'}</td>
          <td>{`¥${Number(order.total_amount || 0).toFixed(2)}`}</td>
          <td>{formatDate(order.created_at)}</td>
          <td>
            <div className="table-actions">
              <button className="text-button" onClick={() => handlers.onView(order.id)}>
                查看
              </button>
              {nextStatus ? (
                <button className="ghost-button" onClick={() => handlers.onStatusChange(order, nextStatus)}>
                  标记为{nextLabel}
                </button>
              ) : null}
              {order.status === 'pending_confirmation' ? (
                <span className="table-subcopy">等待用户支付</span>
              ) : null}
              {order.status === 'pending_confirmation' ? (
                <button className="danger-button" onClick={() => handlers.onStatusChange(order, 'cancelled')}>
                  取消订单
                </button>
              ) : null}
            </div>
          </td>
        </tr>
      );
    });
  }

  return rows.map((article) => (
    <tr key={article.id}>
      <td>{article.id}</td>
      <td>{article.title}</td>
      <td>{article.category?.name || '--'}</td>
      <td>{`${article.status || '--'} / ${article.kind || '--'}${article.is_recommended ? ' / 推荐' : ''}`}</td>
      <td>{`${article.views ?? 0} / ${article.likes ?? 0} / ${article.favorites ?? 0}`}</td>
      <td>{formatDate(article.created_at)}</td>
      <td>
        <div className="table-actions">
          <button className="text-button" onClick={() => handlers.onView(article.id)}>
            查看
          </button>
          {handlers.canEditArticles ? (
            <button
              className="ghost-button"
              onClick={() => handlers.onEditArticle(article.id)}
            >
              编辑
            </button>
          ) : null}
          {handlers.canDeleteArticles ? (
            <button className="danger-button" onClick={() => handlers.onDelete(article)}>
              删除
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  ));
}

function getColumnCount(activeTab) {
  if (activeTab === 'adminUsers') return 7;
  if (activeTab === 'posts') return 8;
  if (activeTab === 'comments') return 7;
  if (activeTab === 'products') return 7;
  if (activeTab === 'settings') return 5;
  if (activeTab === 'auditLogs') return 5;
  if (activeTab === 'orders') return 8;
  if (activeTab === 'articles') return 7;
  return 6;
}

function getDetailTitle(detailType, detailData, loading) {
  if (loading) {
    return '加载中';
  }

  if (!detailData) {
    return '未选择记录';
  }

  if (detailType === 'users') {
    return detailData.user?.nickname || detailData.user?.phone || '用户详情';
  }

  if (detailType === 'posts') {
    return detailData.title || '帖子详情';
  }

  if (detailType === 'comments') {
    return `评论 #${detailData.id}`;
  }

  if (detailType === 'categories') {
    return detailData.name || '分类详情';
  }

  if (detailType === 'articles') {
    return detailData.title || '文章详情';
  }

  if (detailType === 'products') {
    return detailData.name || '商品详情';
  }

  if (detailType === 'orders') {
    return detailData.order_no || `订单 #${detailData.id}`;
  }

  return '详情';
}

function getDetailSubtitle(detailType, detailData) {
  if (!detailData) {
    return '';
  }

  if (detailType === 'users') {
    return detailData.user?.phone || '';
  }

  if (detailType === 'posts') {
    return `作者：${detailData.author?.nickname || detailData.author?.phone || '--'}`;
  }

  if (detailType === 'comments') {
    return `作者：${detailData.author?.nickname || detailData.author?.phone || '--'}`;
  }

  if (detailType === 'categories') {
    return `${detailData.articles?.length || 0} 篇文章`;
  }

  if (detailType === 'articles') {
    return `分类：${detailData.category?.name || '--'}`;
  }

  if (detailType === 'products') {
    return `商家：${detailData.merchant?.name || '--'}`;
  }

  if (detailType === 'orders') {
    return `商家：${detailData.merchant?.name || '--'}`;
  }

  return '';
}

function renderDetailContent(detailType, detailData) {
  if (detailType === 'users') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>手机号</span>
            <strong>{detailData.user.phone}</strong>
          </div>
          <div className="detail-row">
            <span>邮箱</span>
            <strong>{detailData.user.email || '未绑定'}</strong>
          </div>
          <div className="detail-row">
            <span>注册时间</span>
            <strong>{formatDate(detailData.user.created_at)}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">宠物概览</div>
          {detailData.pets.length === 0 ? (
            <div className="panel-muted">该用户还没有宠物档案</div>
          ) : (
            <div className="pet-summary-list">
              {detailData.pets.map((pet) => (
                <div className="pet-summary-card" key={pet.id}>
                  <div className="pet-summary-header">
                    <strong>{pet.name}</strong>
                    <span>
                      {pet.species}
                      {pet.breed ? ` / ${pet.breed}` : ''}
                    </span>
                  </div>
                  <div className="pet-summary-metrics">
                    <span>疫苗 {pet.recordSummary.vaccinations}</span>
                    <span>驱虫 {pet.recordSummary.dewormings}</span>
                    <span>体检 {pet.recordSummary.checkups}</span>
                    <span>护理 {pet.recordSummary.cares}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  if (detailType === 'posts') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>发布时间</span>
            <strong>{formatDate(detailData.created_at)}</strong>
          </div>
          <div className="detail-row">
            <span>互动数据</span>
            <strong>{`点赞 ${detailData.likes ?? 0} / 评论 ${detailData.comments ?? 0}`}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">帖子正文</div>
          <div className="detail-copy">{detailData.content || '暂无内容'}</div>
          {detailData.images?.length ? (
            <div className="inline-list">
              {detailData.images.map((image, index) => (
                <span className="chip" key={`${image}-${index}`}>
                  图片 {index + 1}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="detail-block">
          <div className="section-title">评论列表</div>
          {detailData.commentList?.length ? (
            <div className="detail-stack">
              {detailData.commentList.map((comment) => (
                <div className="detail-list-card" key={comment.id}>
                  <div className="detail-list-header">
                    <strong>{comment.author?.nickname || comment.author?.phone || '--'}</strong>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="detail-copy">{comment.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-muted">暂无评论</div>
          )}
        </section>
      </>
    );
  }

  if (detailType === 'comments') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>发布时间</span>
            <strong>{formatDate(detailData.created_at)}</strong>
          </div>
          <div className="detail-row">
            <span>所属帖子</span>
            <strong>{detailData.post?.title || '已删除帖子'}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">评论正文</div>
          <div className="detail-copy">{detailData.content || '暂无内容'}</div>
        </section>

        {detailData.post ? (
          <section className="detail-block">
            <div className="section-title">帖子摘要</div>
            <div className="detail-copy">{detailData.post.content || '暂无内容'}</div>
          </section>
        ) : null}
      </>
    );
  }

  if (detailType === 'categories') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>创建时间</span>
            <strong>{formatDate(detailData.created_at)}</strong>
          </div>
          <div className="detail-row">
            <span>文章数量</span>
            <strong>{detailData.articles?.length || 0}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">分类描述</div>
          <div className="detail-copy">{detailData.description || '暂无描述'}</div>
        </section>

        <section className="detail-block">
          <div className="section-title">分类文章</div>
          {detailData.articles?.length ? (
            <div className="detail-stack">
              {detailData.articles.map((article) => (
                <div className="detail-list-card" key={article.id}>
                  <div className="detail-list-header">
                    <strong>{article.title}</strong>
                    <span>{`浏览 ${article.views} / 点赞 ${article.likes} / 收藏 ${article.favorites}`}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-muted">该分类下还没有文章</div>
          )}
        </section>
      </>
    );
  }

  if (detailType === 'articles') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>创建时间</span>
            <strong>{formatDate(detailData.created_at)}</strong>
          </div>
          <div className="detail-row">
            <span>最后更新</span>
            <strong>{formatDate(detailData.updated_at)}</strong>
          </div>
          <div className="detail-row">
            <span>数据表现</span>
            <strong>{`浏览 ${detailData.views} / 点赞 ${detailData.likes} / 收藏 ${detailData.favorites}`}</strong>
          </div>
        </section>

        {detailData.cover_image ? (
          <section className="detail-block">
            <div className="section-title">封面地址</div>
            <div className="detail-copy detail-link">{detailData.cover_image}</div>
          </section>
        ) : null}

        {detailData.linked_product ? (
          <section className="detail-block">
            <div className="section-title">关联商品</div>
            <div className="detail-copy">{`${detailData.linked_product.name} (#${detailData.linked_product.id})`}</div>
          </section>
        ) : null}

        <section className="detail-block">
          <div className="section-title">文章正文</div>
          <div className="detail-copy">{detailData.content || '暂无内容'}</div>
        </section>
      </>
    );
  }

  if (detailType === 'products') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>状态</span>
            <strong>{detailData.status === 'active' ? '上架中' : '已下架'}</strong>
          </div>
          <div className="detail-row">
            <span>价格区间</span>
            <strong>{`¥${detailData.price_range || '0.00'}`}</strong>
          </div>
          <div className="detail-row">
            <span>总库存</span>
            <strong>{detailData.stock ?? 0}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">商品描述</div>
          <div className="detail-copy">{detailData.description || '暂无描述'}</div>
        </section>

        <section className="detail-block">
          <div className="section-title">规格列表</div>
          {detailData.skus?.length ? (
            <div className="detail-stack">
              {detailData.skus.map((sku) => (
                <div className="detail-list-card" key={sku.id}>
                  <div className="detail-list-header">
                    <strong>{`${sku.spec_name} / ${sku.spec_value}`}</strong>
                    <span>{formatPrice(sku.price)}</span>
                  </div>
                  <div className="detail-copy">{`库存 ${sku.stock} · ${sku.status === 'active' ? '启用' : '停用'}`}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-muted">暂无规格</div>
          )}
        </section>
      </>
    );
  }

  if (detailType === 'orders') {
    return (
      <>
        <section className="detail-block">
          <div className="detail-row">
            <span>订单状态</span>
            <strong>{ORDER_STATUS_LABELS[detailData.status] || detailData.status || '--'}</strong>
          </div>
          <div className="detail-row">
            <span>下单时间</span>
            <strong>{formatDate(detailData.created_at)}</strong>
          </div>
          <div className="detail-row">
            <span>订单金额</span>
            <strong>{`¥${Number(detailData.total_amount || 0).toFixed(2)}`}</strong>
          </div>
        </section>

        <section className="detail-block">
          <div className="section-title">收货信息</div>
          <div className="detail-copy">{`${detailData.receiver_name || '--'} · ${detailData.receiver_phone || '--'}`}</div>
          <div className="detail-copy">{detailData.receiver_address || '--'}</div>
          <div className="detail-copy">{`备注：${detailData.remark || '无'}`}</div>
        </section>

        <section className="detail-block">
          <div className="section-title">商品明细</div>
          {detailData.items?.length ? (
            <div className="detail-stack">
              {detailData.items.map((item) => (
                <div className="detail-list-card" key={item.id}>
                  <div className="detail-list-header">
                    <strong>{item.product_name_snapshot}</strong>
                    <span>{`¥${Number(item.amount || 0).toFixed(2)}`}</span>
                  </div>
                  <div className="detail-copy">{`${item.sku_snapshot} · 单价 ¥${Number(item.price || 0).toFixed(2)} × ${item.quantity}`}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-muted">暂无商品明细</div>
          )}
        </section>
      </>
    );
  }

  return null;
}

function truncateText(value, limit = 50) {
  if (!value) {
    return '--';
  }

  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default App;
