export function formatCurrency(value?: number | null) {
  const amount = Number(value || 0);
  return `¥${amount.toFixed(2)}`;
}

export function getOrderStatusLabel(status?: string | null) {
  switch (status) {
    case 'pending_confirmation':
      return '待支付';
    case 'processing':
      return '待发货';
    case 'shipped':
      return '已发货';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return status || '未知状态';
  }
}
