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
  // 订单
  orders: {
    create: (data: any) => http.post('/api/orders', data),
    list: () => http.get('/api/orders'),
    detail: (id: number) => http.get(`/api/orders/${id}`),
  },
  // 分享
  share: {
    record: (productId: number) => http.post('/api/share/record', { productId }),
    stats: () => http.get('/api/share/stats'),
  },
  // 用户
  user: {
    login: (openid: string, info?: any) => http.post('/api/auth/login', { openid, ...info }),
    info: () => http.get('/api/auth/user'),
  },
};
