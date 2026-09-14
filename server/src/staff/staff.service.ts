import { BadRequestException, ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { StaffAccount } from './staff.entity';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, hash] = encoded.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
@Injectable()
export class StaffService implements OnModuleInit {
  constructor(@InjectRepository(StaffAccount) private repo: Repository<StaffAccount>, private config: ConfigService, private jwt: JwtService) {}
  async onModuleInit() {
    if (await this.repo.count()) return;
    const username = this.config.get<string>('STAFF_BOOTSTRAP_USERNAME');
    const password = this.config.get<string>('STAFF_BOOTSTRAP_PASSWORD');
    if (!username || !password) return;
    if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(username) || password.length < 12 || password.length > 128) throw new Error('Bootstrap staff credentials are invalid');
    await this.repo.save(this.repo.create({ username, name: '管理员', role: 'owner', passwordHash: hashPassword(password) }));
  }
  async login(username: string, password: string) {
    const account = await this.repo.createQueryBuilder('staff').addSelect('staff.passwordHash').where('staff.username = :username', { username }).getOne();
    if (!account || !account.active || !verifyPassword(password, account.passwordHash)) throw new UnauthorizedException('账号或密码不正确，或账号已停用');
    const token = this.jwt.sign({ sub: account.id, purpose: 'staff', version: account.sessionVersion }, { secret: this.secret(), expiresIn: '8h', audience: 'kuli-admin', issuer: 'kuli-api' });
    const { passwordHash, ...user } = account;
    return { token, user };
  }
  secret() {
    const value = this.config.get<string>('STAFF_JWT_SECRET');
    if (!value || value.length < 32) throw new Error('STAFF_JWT_SECRET must contain at least 32 characters');
    return value;
  }
  async authenticate(token: string) {
    try {
      const payload = this.jwt.verify(token, { secret: this.secret(), audience: 'kuli-admin', issuer: 'kuli-api', algorithms: ['HS256'] });
      if (payload.purpose !== 'staff') throw new Error();
      const account = await this.repo.findOneBy({ id: payload.sub });
      if (!account?.active || account.sessionVersion !== payload.version) throw new Error();
      return account;
    } catch { throw new UnauthorizedException('登录已失效，请重新登录'); }
  }
  list() { return this.repo.find({ order: { id: 'ASC' } }); }
  async create(data: CreateStaffDto) {
    if (await this.repo.findOneBy({ username: data.username })) throw new ConflictException('账号已存在');
    const user = await this.repo.save(this.repo.create({ username: data.username, name: data.name, role: 'editor', passwordHash: hashPassword(data.password) }));
    const { passwordHash, ...safe } = user;
    return safe;
  }
  async update(id: number, data: UpdateStaffDto) {
    const user = await this.repo.findOneBy({ id });
    if (!user || user.role === 'owner') throw new BadRequestException('只能修改同事账号，管理员请使用修改密码');
    if (data.active !== undefined) user.active = data.active;
    if (data.password) user.passwordHash = hashPassword(data.password);
    user.sessionVersion++;
    await this.repo.save(user);
    return { ok: true };
  }
  async changePassword(id: number, currentPassword: string, password: string) {
    const user = await this.repo.createQueryBuilder('staff').addSelect('staff.passwordHash').where('staff.id = :id', { id }).getOne();
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) throw new UnauthorizedException('当前密码不正确');
    user.passwordHash = hashPassword(password);
    user.sessionVersion++;
    await this.repo.save(user);
    return { ok: true };
  }
}
