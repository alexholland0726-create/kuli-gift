import http from './http';

export const api = {
  // 分类
  categories: {
    list: () => http.get('/api/categories'),
    detail: (id: number) => http.get(`/api/categories/${id}`),
  },
  // 商品
  products: {
    list: (params?: any) => http.get('/api/products', params),
    detail: (id: number) => http.get(`/api/products/${id}`),
  },
  // 购物车
  cart: {
    list: () => http.get('/api/cart'),
    add: (data: { productId: number; quantity: number; spec?: string }) => http.post('/api/cart', data),
    updateQuantity: (id: number, quantity: number) => http.put(`/api/cart/${id}/quantity`, { quantity }),
    select: (ids: number[], selected: boolean) => http.put('/api/cart/select', { ids, selected }),
    remove: (id: number) => http.del(`/api/cart/${id}`),
    clear: () => http.del('/api/cart'),
  },
  // 订单
  orders: {
    create: (data: any) => http.post('/api/orders', data),
    list: () => http.get('/api/orders'),
    detail: (id: number) => http.get(`/api/orders/${id}`),
    updateStatus: (id: number, status: string) => http.put(`/api/orders/${id}/status`, { status }),
    cancel: (id: number) => http.put(`/api/orders/${id}/cancel`),
  },
  // 支付
  pay: {
    create: (orderId: number) => http.post('/api/pay/create', { orderId }),
    status: (orderNo: string) => http.get(`/api/pay/status/${orderNo}`),
  },
  // 地址
  addresses: {
    list: () => http.get('/api/addresses'),
    create: (data: any) => http.post('/api/addresses', data),
    update: (id: number, data: any) => http.put(`/api/addresses/${id}`, data),
    remove: (id: number) => http.del(`/api/addresses/${id}`),
  },
  // 分享
  share: {
    record: (productId: number) => http.post('/api/share/record', { productId }),
    stats: () => http.get('/api/share/stats'),
  },
  // 用户
  user: {
    login: (code: string, info?: any) => http.post('/api/auth/login', { code, ...info }),
    info: () => http.get('/api/auth/user'),
  },
};
