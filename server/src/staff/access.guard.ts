import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { StaffService } from './staff.service';

@Injectable()
export class AccessGuard implements CanActivate {
  private windows = new Map<string, { count: number; expires: number }>();
  constructor(private staff: StaffService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const path = (req.path as string).replace(/\/+$/, '').toLowerCase();
    const method = req.method;
    if (method === 'OPTIONS') return true;
    if (['/api/admin/login', '/api/auth/login', '/api/inquiries'].includes(path) && method === 'POST') {
      const now = Date.now();
      for (const [key, value] of this.windows) if (value.expires <= now) this.windows.delete(key);
      const key = path + ':' + req.ip;
      const window = this.windows.get(key) || { count: 0, expires: now + 60000 };
      if (++window.count > 10 || this.windows.size > 10000) throw new HttpException('操作太频繁，请稍后再试', 429);
      this.windows.set(key, window);
      return true;
    }
    // The controller's JWT guard checks identity; no other user/commerce route is opened.
    if (path === '/api/auth/user' && ['GET', 'HEAD'].includes(method)) return true;
    const admin = path === '/api/admin' || path.startsWith('/api/admin/');
    const catalogWrite = !['GET', 'HEAD'].includes(method) && /^\/api\/(products|categories|upload)(\/|$)/.test(path);
    if (admin || catalogWrite) {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new UnauthorizedException('请登录管理后台');
      req.staff = await this.staff.authenticate(token);
      if (req.staff.role !== 'owner' && /^\/api\/products\/\d+$/.test(path)
        && method === 'PUT' && req.body?.isActive === false) {
        throw new ForbiddenException('下架产品需要管理员权限');
      }
      if ((path.startsWith('/api/admin/staff') || method === 'DELETE') && req.staff.role !== 'owner') throw new ForbiddenException('需要管理员权限');
      return true;
    }
    // The first release is an inquiry catalog. Legacy commerce endpoints stay unavailable.
    if (/^\/api\/(pay|orders?|cart|coupons?|groupons?|address|addresses|share|user|users|auth)(\/|$)/.test(path)) {
      throw new ForbiddenException('当前版本仅支持产品展示和询价');
    }
    return true;
  }
}
