const request = require('supertest');
const app     = require('../src/app');
const { initializeDatabase, closeDatabase, getDb } = require('../src/database/db');

beforeAll(async () => { await initializeDatabase(); });
afterAll(() => closeDatabase());

// ── Helpers ──────────────────────────────────────────────────
const adminCredentials  = { email: 'admin@blog.com',  password: 'Admin1234' };
const authorCredentials = { email: 'author@blog.com', password: 'Author1234' };
const readerCredentials = { email: 'reader@blog.com', password: 'Reader1234' };

let adminToken, authorToken, readerToken;
let adminId, authorId, readerId;

async function registerAndLogin(data, role = 'reader') {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ ...data, name: role, role });

  // Si déjà existant on tente juste le login
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: data.email, password: data.password });

  return {
    token: login.body.data.accessToken,
    id:    login.body.data.user.id,
  };
}

beforeAll(async () => {
  await initializeDatabase();

  const admin  = await registerAndLogin(adminCredentials,  'admin');
  const author = await registerAndLogin(authorCredentials, 'author');
  const reader = await registerAndLogin(readerCredentials, 'reader');

  adminToken  = admin.token;  adminId  = admin.id;
  authorToken = author.token; authorId = author.id;
  readerToken = reader.token; readerId = reader.id;
});

// ── GET /users ────────────────────────────────────────────────
describe('GET /api/v1/users', () => {
  it('admin can list all users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it('non-admin cannot list users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot list users', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});

// ── GET /users/:id ────────────────────────────────────────────
describe('GET /api/v1/users/:id', () => {
  it('returns a user by id', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${readerId}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(readerId);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/users/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ── PUT /users/:id ────────────────────────────────────────────
describe('PUT /api/v1/users/:id', () => {
  it('user can update own profile', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${readerId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ name: 'Updated Reader', bio: 'New bio' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Reader');
  });

  it('user cannot update another user profile', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${authorId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('admin can update any profile', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${readerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Updated' });
    expect(res.status).toBe(200);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${readerId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

// ── DELETE /users/:id ─────────────────────────────────────────
describe('DELETE /api/v1/users/:id', () => {
  it('user can delete own account', async () => {
    // Créer un compte temporaire
    const tmp = await registerAndLogin(
      { email: `tmp_${Date.now()}@test.com`, password: 'Tmp12345' },
      'reader'
    );
    const res = await request(app)
      .delete(`/api/v1/users/${tmp.id}`)
      .set('Authorization', `Bearer ${tmp.token}`);
    expect(res.status).toBe(204);
  });

  it('user cannot delete another account', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${authorId}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });
});