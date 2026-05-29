const BASE_URL = 'http://localhost:3001';

const http = {
  get: (url: string, data?: any) => {
    return new Promise<any>((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method: 'GET',
        data,
        header: getHeader(),
        success: (res) => resolve(res.data),
        fail: (err) => reject(err),
      });
    });
  },
  post: (url: string, data?: any) => {
    return new Promise<any>((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method: 'POST',
        data,
        header: getHeader(),
        success: (res) => resolve(res.data),
        fail: (err) => reject(err),
      });
    });
  },
  put: (url: string, data?: any) => {
    return new Promise<any>((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method: 'PUT',
        data,
        header: getHeader(),
        success: (res) => resolve(res.data),
        fail: (err) => reject(err),
      });
    });
  },
  del: (url: string) => {
    return new Promise<any>((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method: 'DELETE',
        header: getHeader(),
        success: (res) => resolve(res.data),
        fail: (err) => reject(err),
      });
    });
  },
};

function getHeader() {
  const token = uni.getStorageSync('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
}

export default http;
