const request = require('supertest');
const app     = require('../src/app');
const { initializeDatabase, closeDatabase } = require('../src/database/db');

beforeAll(async () => { await initializeDatabase(); });
afterAll(() => closeDatabase());

let adminToken, authorToken, readerToken;
let categoryId, categorySlug;

beforeAll(async () => {
  const ts = Date.now();

  await request(app).post('/api/v1/auth/register').send({
    name: 'Admin',  email: `adm_${ts}@test.com`, password: 'Admin1234',  role: 'admin',
  });
  await request(app).post('/api/v1/auth/register').send({
    name: 'Author', email: `aut_${ts}@test.com`, password: 'Author1234', role: 'author',
  });
  await request(app).post('/api/v1/auth/register').send({
    name: 'Reader', email: `rdr_${ts}@test.com`, password: 'Reader1234', role: 'reader',
  });

  const la = await request(app).post('/api/v1/auth/login')
    .send({ email: `adm_${ts}@test.com`, password: 'Admin1234' });
  const lb = await request(app).post('/api/v1/auth/login')
    .send({ email: `aut_${ts}@test.com`, password: 'Author1234' });
  const lc = await request(app).post('/api/v1/auth/login')
    .send({ email: `rdr_${ts}@test.com`, password: 'Reader1234' });

  adminToken  = la.body.data.accessToken;
  authorToken = lb.body.data.accessToken;
  readerToken = lc.body.data.accessToken;
});

// ── POST /categories ──────────────────────────────────────────
describe('POST /api/v1/categories', () => {
  it('admin can create a category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology', description: 'Tech articles' });
    expect(res.status).toBe(201);
    expect(res.body.data.category.slug).toBe('technology');
    categoryId   = res.body.data.category.id;
    categorySlug = res.body.data.category.slug;
  });

  it('rejects duplicate category name', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Technology' });
    expect(res.status).toBe(409);
  });

  it('author cannot create a category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ name: 'Science' });
    expect(res.status).toBe(403);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No name' });
    expect(res.status).toBe(400);
  });
});

// ── GET /categories ───────────────────────────────────────────
describe('GET /api/v1/categories', () => {
  it('returns all categories publicly', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toBeInstanceOf(Array);
  });
});

// ── GET /categories/:slug ─────────────────────────────────────
describe('GET /api/v1/categories/:slug', () => {
  it('returns category with articles', async () => {
    const res = await request(app).get(`/api/v1/categories/${categorySlug}`);
    expect(res.status).toBe(200);
    expect(res.body.category.slug).toBe(categorySlug);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/v1/categories/unknown-cat');
    expect(res.status).toBe(404);
  });
});

// ── PUT /categories/:id ───────────────────────────────────────
describe('PUT /api/v1/categories/:id', () => {
  it('admin can update a category', async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.data.category.description).toBe('Updated description');
  });

  it('non-admin cannot update a category', async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

// ── DELETE /categories/:id ────────────────────────────────────
describe('DELETE /api/v1/categories/:id', () => {
  it('admin can delete a category', async () => {
    const res = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/categories/${categorySlug}`);
    expect(res.status).toBe(404);
  });
});