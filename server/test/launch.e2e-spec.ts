import { All, Controller, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { join } from 'path';
import { CategoryController, AdminCategoryController } from '../src/category/category.controller';
import { CategoryService } from '../src/category/category.service';
import { Category } from '../src/category/entities/category.entity';
import { AccessGuard } from '../src/staff/access.guard';
import { StaffService } from '../src/staff/staff.service';
import { ProductController } from '../src/product/product.controller';
import { ProductService } from '../src/product/product.service';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { UserService } from '../src/user/user.service';
import { UploadsExceptionFilter } from '../src/uploads-exception.filter';

@Controller('api')
class LegacyController {
  @All(['cart', 'orders', 'coupons/available', 'groupons', 'pay/create', 'addresses', 'share/stats', 'users', 'auth/other'])
  legacy() { return { shouldNotReach: true }; }
}

describe('W1–W6 HTTP regression (isolated, no .env or database)', () => {
  let app: INestApplication;
  const owner = 'Bearer owner';
  const secret = 'test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
  const jwt = new JwtService({ secret });
  const database = { query: jest.fn() };
  const rows = [{ id: 1, name: '启用', isActive: true, sort: 0, children: [{ id: 3, isActive: false, sort: 0 }] }, { id: 2, name: '停用', isActive: false, sort: 1, children: [] }];
  const repo = {
    find: jest.fn(async ({ where }) => rows.filter(x => !where.isActive || x.isActive)),
    findOneBy: jest.fn(async ({ id }) => rows.find(x => x.id === id)),
    save: jest.fn(async data => ({ id: 10, ...data })),
  };
  const products = { update: jest.fn(async () => ({ ok: true })) };
  const users = { findById: jest.fn(async id => id === 7 ? { id: 7, isActive: true } : null) };
  const auth = {
    login: jest.fn(async body => ({ codeReceived: body.code })),
    getUser: jest.fn(async id => ({ id, nickname: '本人' })),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ServeStaticModule.forRoot({
        rootPath: join(__dirname, 'fixtures/uploads'), serveRoot: '/uploads',
        exclude: ['/uploads', '/uploads/{*path}'], serveStaticOptions: { index: false },
      })],
      controllers: [CategoryController, AdminCategoryController, ProductController, AppController, AuthController, LegacyController],
      providers: [CategoryService, AppService, JwtStrategy,
        { provide: getRepositoryToken(Category), useValue: repo },
        { provide: ProductService, useValue: products },
        { provide: DataSource, useValue: database },
        { provide: AuthService, useValue: auth },
        { provide: UserService, useValue: users },
        { provide: ConfigService, useValue: { get: () => secret } },
        { provide: StaffService, useValue: { authenticate: async token => {
          if (!['owner', 'editor'].includes(token)) throw new UnauthorizedException();
          return { id: 1, role: token };
        } } },
        { provide: APP_GUARD, useClass: AccessGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new UploadsExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => { jest.clearAllMocks(); database.query.mockResolvedValue([{ '1': 1 }]); });

  it('requires staff authentication for category writes and inactive listing', async () => {
    await request(app.getHttpServer()).post('/api/categories').send({ name: 'test' }).expect(401);
    await request(app.getHttpServer()).get('/api/admin/categories').expect(401);
  });
  it.each([{}, { name: '' }, { name: '  ' }, { name: null }, { name: 42 }])('rejects missing/invalid category name with 400: %j', async body => {
    await request(app.getHttpServer()).post('/api/categories').set('Authorization', owner).send(body).expect(400);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('trims valid category names and ignores body id', async () => {
    const result = await request(app.getHttpServer()).post('/api/categories').set('Authorization', owner).send({ id: 99, name: ' 礼品 ', sort: 3, isActive: true }).expect(201);
    expect(result.body).toMatchObject({ id: 10, name: '礼品', sort: 3 });
  });
  it('supports partial disable/enable without requiring name', async () => {
    await request(app.getHttpServer()).put('/api/categories/1').set('Authorization', owner).send({ isActive: false }).expect(200);
    await request(app.getHttpServer()).put('/api/categories/2').set('Authorization', owner).send({ isActive: true }).expect(200);
  });
  it.each([{ name: null }, { name: '  ' }, { sort: -1 }, { sort: 1.5 }, { isActive: 'false' }, { isActive: null }])('rejects invalid category update %j', async body => {
    await request(app.getHttpServer()).put('/api/categories/1').set('Authorization', owner).send(body).expect(400);
  });
  it('hides inactive public categories and children but lists all for staff', async () => {
    const visible = await request(app.getHttpServer()).get('/api/categories').expect(200);
    expect(visible.body.map(x => x.id)).toEqual([1]);
    expect(visible.body[0].children).toEqual([]);
    const all = await request(app.getHttpServer()).get('/api/admin/categories').set('Authorization', owner).expect(200);
    expect(all.body).toHaveLength(2);
  });
  it('rejects edits for a missing category', async () => {
    await request(app.getHttpServer()).put('/api/categories/999').set('Authorization', owner).send({ name: '新名' }).expect(404);
  });
  it('prevents editor from bypassing unpublish restriction through PUT', async () => {
    await request(app.getHttpServer()).put('/api/products/1').set('Authorization', 'Bearer editor').send({ isActive: false }).expect(403);
    expect(products.update).not.toHaveBeenCalled();
  });
  it('allows owner to change category and unpublish, and editor to publish', async () => {
    const product = { name: '商品', price: 0, categoryId: 1, coverImage: '/uploads/a.png', isActive: false };
    await request(app.getHttpServer()).put('/api/products/1').set('Authorization', owner).send(product).expect(200);
    await request(app.getHttpServer()).put('/api/products/1').set('Authorization', 'Bearer editor').send({ ...product, isActive: true }).expect(200);
    expect(products.update).toHaveBeenCalledTimes(2);
  });
  it.each(['cart', 'orders', 'coupons/available', 'groupons', 'pay/create', 'addresses', 'share/stats', 'users', 'auth/other'])('retains 403 commerce gate: %s', async path => {
    await request(app.getHttpServer()).get('/api/' + path).expect(403);
  });
  it('allows code login but rejects openid-only spoofing', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ openid: 'forged' }).expect(400);
    await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'wechat-code', openid: 'forged' }).expect(201);
    expect(auth.login).toHaveBeenCalledWith({ code: 'wechat-code' });
  });
  it('requires valid customer JWT and only reads its subject, ignoring query user id', async () => {
    await request(app.getHttpServer()).get('/api/auth/user').expect(401);
    await request(app.getHttpServer()).get('/api/auth/user').set('Authorization', 'Bearer invalid').expect(401);
    await request(app.getHttpServer()).get('/api/auth/user').set('Authorization', 'Bearer ' + jwt.sign({ id: 7 }, { expiresIn: -1 })).expect(401);
    const result = await request(app.getHttpServer()).get('/api/auth/user?id=999').set('Authorization', 'Bearer ' + jwt.sign({ id: 7 })).expect(200);
    expect(result.body.id).toBe(7); expect(auth.getUser).toHaveBeenCalledWith(7);
  });
  it('reports database state without leaking database errors', async () => {
    const healthy = await request(app.getHttpServer()).get('/health').expect(200);
    expect(healthy.body).toEqual({ status: 'ok', database: 'up', version: '1.0.0' });
    database.query.mockRejectedValueOnce(new Error('/private/database/password'));
    const failed = await request(app.getHttpServer()).get('/health').expect(503);
    expect(failed.body).toEqual({ status: 'degraded', database: 'down', version: '1.0.0' });
  });
  it.each(['/uploads', '/uploads/', '/uploads/missing.png'])('sanitizes missing upload %s', async path => {
    const result = await request(app.getHttpServer()).get(path).expect(404);
    expect(result.body).toEqual({ statusCode: 404, message: '文件不存在' });
  });
  it('continues serving existing upload files', async () => {
    const result = await request(app.getHttpServer()).get('/uploads/example.txt').expect(200);
    expect(result.text.trim()).toBe('existing-upload');
  });
});
