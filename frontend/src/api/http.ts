const BASE_URL = 'https://api.da-fire.com';
const REQUEST_TIMEOUT = 10000;
const OFFLINE_PREVIEW = false;

function normalizeAssetUrl(value: any): any {
  if (typeof value === 'string' && value.startsWith('/uploads/')) {
    return BASE_URL + value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeAssetUrl);
  }
  if (value && typeof value === 'object') {
    const next: any = {};
    Object.keys(value).forEach((key) => {
      next[key] = normalizeAssetUrl(value[key]);
    });
    return next;
  }
  return value;
}

function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any) {
  return new Promise<any>((resolve, reject) => {
    if (OFFLINE_PREVIEW) {
      reject({ errMsg: 'offline preview mode', method, url, data });
      return;
    }

    uni.request({
      url: BASE_URL + url,
      method,
      data,
      timeout: REQUEST_TIMEOUT,
      header: getHeader(),
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(normalizeAssetUrl(res.data));
          return;
        }
        reject(res);
      },
      fail: (err) => reject(err),
    });
  });
}

const http = {
  get: (url: string, data?: any) => request('GET', url, data),
  post: (url: string, data?: any) => request('POST', url, data),
  put: (url: string, data?: any) => request('PUT', url, data),
  del: (url: string) => request('DELETE', url),
};

function getHeader() {
  const token = uni.getStorageSync('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
}

export default http;
