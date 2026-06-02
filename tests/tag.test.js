const request = require('supertest');
const app     = require('../src/app');
const { initializeDatabase, closeDatabase } = require('../src/database/db');

beforeAll(async () => { await initializeDatabase(); });
afterAll(() => closeDatabase());

let adminToken, authorToken;
let tagId, tagSlug;

beforeAll(async () => {
  const ts = Date.now();

  await request(app).post('/api/v1/auth/register').send({
    name: 'Admin',  email: `tagadm_${ts}@test.com`, password: 'Admin1234',  role: 'admin',
  });
  await request(app).post('/api/v1/auth/register').send({
    name: 'Author', email: `tagaut_${ts}@test.com`, password: 'Author1234', role: 'author',
  });

  const la = await request(app).post('/api/v1/auth/login')
    .send({ email: `tagadm_${ts}@test.com`, password: 'Admin1234' });
  const lb = await request(app).post('/api/v1/auth/login')
    .send({ email: `tagaut_${ts}@test.com`, password: 'Author1234' });

  adminToken  = la.body.data.accessToken;
  authorToken = lb.body.data.accessToken;
});

// ── POST /tags ────────────────────────────────────────────────
describe('POST /api/v1/tags', () => {
  it('admin can create a tag', async () => {
    const res = await request(app)
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'JavaScript' });
    expect(res.status).toBe(201);
    expect(res.body.data.tag.slug).toBe('javascript');
    tagId   = res.body.data.tag.id;
    tagSlug = res.body.data.tag.slug;
  });

  it('rejects duplicate tag name', async () => {
    const res = await request(app)
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'JavaScript' });
    expect(res.status).toBe(409);
  });

  it('author cannot create a tag', async () => {
    const res = await request(app)
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ name: 'Python' });
    expect(res.status).toBe(403);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── GET /tags ─────────────────────────────────────────────────
describe('GET /api/v1/tags', () => {
  it('returns all tags publicly', async () => {
    const res = await request(app).get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body.data.tags).toBeInstanceOf(Array);
  });
});

// ── GET /tags/:slug ───────────────────────────────────────────
describe('GET /api/v1/tags/:slug', () => {
  it('returns tag with articles', async () => {
    const res = await request(app).get(`/api/v1/tags/${tagSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.tag.slug).toBe(tagSlug);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/v1/tags/unknown-tag');
    expect(res.status).toBe(404);
  });
});

// ── PUT /tags/:id ─────────────────────────────────────────────
describe('PUT /api/v1/tags/:id', () => {
  it('admin can update a tag', async () => {
    const res = await request(app)
      .put(`/api/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'JS' });
    expect(res.status).toBe(200);
    expect(res.body.data.tag.name).toBe('JS');
  });

  it('author cannot update a tag', async () => {
    const res = await request(app)
      .put(`/api/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

// ── DELETE /tags/:id ──────────────────────────────────────────
describe('DELETE /api/v1/tags/:id', () => {
  it('admin can delete a tag', async () => {
    const res = await request(app)
      .delete(`/api/v1/tags/${tagId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/tags/${tagSlug}`);
    expect(res.status).toBe(404);
  });
});