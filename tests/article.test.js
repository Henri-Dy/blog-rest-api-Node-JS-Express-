const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, closeDatabase } = require('./helpers/db');

beforeAll(async () => { await setupTestDb(); });
afterAll(() => closeDatabase());

let authorToken, adminToken, readerToken;
let authorId, articleId, articleSlug;

// ── Setup ────────────────────────────────────────────────────
beforeAll(async () => {
  const ts = Date.now();

  const regAuthor = await request(app).post('/api/v1/auth/register').send({
    name: 'Author', email: `author_${ts}@test.com`, password: 'Author1234', role: 'author',
  });
  const regAdmin = await request(app).post('/api/v1/auth/register').send({
    name: 'Admin', email: `admin_${ts}@test.com`, password: 'Admin1234', role: 'admin',
  });
  const regReader = await request(app).post('/api/v1/auth/register').send({
    name: 'Reader', email: `reader_${ts}@test.com`, password: 'Reader1234', role: 'reader',
  });

  const loginAuthor = await request(app).post('/api/v1/auth/login')
    .send({ email: `author_${ts}@test.com`, password: 'Author1234' });
  const loginAdmin = await request(app).post('/api/v1/auth/login')
    .send({ email: `admin_${ts}@test.com`, password: 'Admin1234' });
  const loginReader = await request(app).post('/api/v1/auth/login')
    .send({ email: `reader_${ts}@test.com`, password: 'Reader1234' });

  authorToken = loginAuthor.body.data.accessToken;
  adminToken  = loginAdmin.body.data.accessToken;
  readerToken = loginReader.body.data.accessToken;
  authorId    = loginAuthor.body.data.user.id;
});

// ── POST /articles ────────────────────────────────────────────
describe('POST /api/v1/articles', () => {
  it('author can create a draft article', async () => {
    const res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title:   'My First Article',
        content: 'This is the content of my first article.',
        excerpt: 'Short excerpt',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.article.slug).toBe('my-first-article');
    expect(res.body.data.article.status).toBe('draft');
    articleId   = res.body.data.article.id;
    articleSlug = res.body.data.article.slug;
  });

  it('author can create a published article directly', async () => {
    const res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title:   'My First Article',
        content: 'Content here for published article.',
        status:  'published',
      });
    expect(res.status).toBe(201);
    // Slug doit être unique : my-first-article-1
    expect(res.body.data.article.slug).toMatch(/my-first-article/);
    expect(res.body.data.article.status).toBe('published');
  });

  it('reader cannot create an article', async () => {
    const res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ title: 'Hack', content: 'Content here.' });
    expect(res.status).toBe(403);
  });

  it('rejects missing title', async () => {
    const res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'No title here.' });
    expect(res.status).toBe(400);
  });
});

// ── GET /articles ─────────────────────────────────────────────
describe('GET /api/v1/articles', () => {
  it('returns published articles (public)', async () => {
    const res = await request(app).get('/api/v1/articles');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
    // Tous les articles retournés doivent être publiés
    res.body.data.forEach(a => expect(a.status).toBe('published'));
  });

  it('supports search filter', async () => {
    const res = await request(app).get('/api/v1/articles?search=First');
    expect(res.status).toBe(200);
  });

  it('supports pagination', async () => {
    const res = await request(app).get('/api/v1/articles?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
  });
});

// ── GET /articles/my ─────────────────────────────────────────
describe('GET /api/v1/articles/my', () => {
  it('author sees own articles including drafts', async () => {
    const res = await request(app)
      .get('/api/v1/articles/my')
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('reader cannot access /my', async () => {
    const res = await request(app)
      .get('/api/v1/articles/my')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /articles/:slug ───────────────────────────────────────
describe('GET /api/v1/articles/:slug', () => {
  it('returns a published article by slug', async () => {
    // Récupère le slug d'un article publié
    const list = await request(app).get('/api/v1/articles');
    const slug = list.body.data[0]?.slug;
    if (!slug) return;

    const res = await request(app).get(`/api/v1/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.article.slug).toBe(slug);
  });

  it('draft is hidden from public', async () => {
    const res = await request(app).get(`/api/v1/articles/${articleSlug}`);
    expect(res.status).toBe(404);
  });

  it('author can see own draft', async () => {
    const res = await request(app)
      .get(`/api/v1/articles/${articleSlug}`)
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
  });
});

// ── PATCH /articles/:id/publish ───────────────────────────────
describe('PATCH /api/v1/articles/:id/publish', () => {
  it('author can publish own article', async () => {
    const res = await request(app)
      .patch(`/api/v1/articles/${articleId}/publish`)
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.article.status).toBe('published');
    expect(res.body.data.article.published_at).not.toBeNull();
  });

  it('cannot publish an already published article', async () => {
    const res = await request(app)
      .patch(`/api/v1/articles/${articleId}/publish`)
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(400);
  });
});

// ── PATCH /articles/:id/archive ───────────────────────────────
describe('PATCH /api/v1/articles/:id/archive', () => {
  it('author can archive own article', async () => {
    const res = await request(app)
      .patch(`/api/v1/articles/${articleId}/archive`)
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.article.status).toBe('archived');
  });
});

// ── PUT /articles/:id ─────────────────────────────────────────
describe('PUT /api/v1/articles/:id', () => {
  it('author can update own article', async () => {
    const res = await request(app)
      .put(`/api/v1/articles/${articleId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ title: 'Updated Title', content: 'Updated content here.' });
    expect(res.status).toBe(200);
    expect(res.body.data.article.title).toBe('Updated Title');
  });

  it('reader cannot update an article', async () => {
    const res = await request(app)
      .put(`/api/v1/articles/${articleId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

// ── DELETE /articles/:id ──────────────────────────────────────
describe('DELETE /api/v1/articles/:id', () => {
  it('admin can delete any article', async () => {
    const res = await request(app)
      .delete(`/api/v1/articles/${articleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for deleted article', async () => {
    const res = await request(app)
      .get(`/api/v1/articles/${articleSlug}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});