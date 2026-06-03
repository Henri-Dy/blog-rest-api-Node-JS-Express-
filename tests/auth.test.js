const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, closeDatabase } = require('./helpers/db');

beforeAll(async () => { await setupTestDb(); });
afterAll(() => closeDatabase());

const user = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'Password1',
};

let accessToken, refreshToken;

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it('should reject invalid data', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login and return tokens', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: user.email, password: user.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: user.email, password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return current user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('should return new tokens', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should logout successfully', async () => {
    const res = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(res.status).toBe(200);
  });
});