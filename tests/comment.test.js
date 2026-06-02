const request = require('supertest');
const app     = require('../src/app');
const { initializeDatabase, closeDatabase } = require('../src/database/db');

beforeAll(async () => { await initializeDatabase(); });
afterAll(() => closeDatabase());

let adminToken, authorToken, readerToken;
let readerUserId;
let articleId;
let commentId, replyId;

// ── Setup ─────────────────────────────────────────────────────
beforeAll(async () => {
  const ts = Date.now();

  await request(app).post('/api/v1/auth/register').send({
    name: 'Admin',  email: `cadmin_${ts}@test.com`,
    password: 'Admin1234', role: 'admin',
  });
  await request(app).post('/api/v1/auth/register').send({
    name: 'Author', email: `cauthor_${ts}@test.com`,
    password: 'Author1234', role: 'author',
  });
  await request(app).post('/api/v1/auth/register').send({
    name: 'Reader', email: `creader_${ts}@test.com`,
    password: 'Reader1234', role: 'reader',
  });

  const la = await request(app).post('/api/v1/auth/login')
    .send({ email: `cadmin_${ts}@test.com`,  password: 'Admin1234' });
  const lb = await request(app).post('/api/v1/auth/login')
    .send({ email: `cauthor_${ts}@test.com`, password: 'Author1234' });
  const lc = await request(app).post('/api/v1/auth/login')
    .send({ email: `creader_${ts}@test.com`, password: 'Reader1234' });

  adminToken  = la.body.data.accessToken;
  authorToken = lb.body.data.accessToken;
  readerToken = lc.body.data.accessToken;
  readerUserId = lc.body.data.user.id;

  // Créer et publier un article
  const art = await request(app)
    .post('/api/v1/articles')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({
      title:   `Comment Test Article ${ts}`,
      content: 'Article content for comment testing.',
      status:  'published',
    });

  articleId = art.body.data.article.id;
});

// ── POST /comments ────────────────────────────────────────────
describe('POST /api/v1/comments', () => {
  it('authenticated user can post a comment', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ articleId, content: 'This is a great article!' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.status).toBe('pending');
    expect(res.body.data.comment.content).toBe('This is a great article!');
    commentId = res.body.data.comment.id;
  });

  it('unauthenticated user cannot post a comment', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .send({ articleId, content: 'Anonymous comment' });
    expect(res.status).toBe(401);
  });

  it('rejects empty content', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ articleId, content: '' });
    expect(res.status).toBe(400);
  });

  it('rejects comment on nonexistent article', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ articleId: 'nonexistent-id', content: 'Ghost comment' });
    expect(res.status).toBe(404);
  });
});

// ── GET /comments/article/:articleId ─────────────────────────
describe('GET /api/v1/comments/article/:articleId', () => {
  it('returns approved comments publicly (pending not shown)', async () => {
    const res = await request(app)
      .get(`/api/v1/comments/article/${articleId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // Le commentaire pending ne doit pas apparaître
    res.body.data.forEach(c => expect(c.status).toBe('approved'));
  });
});

// ── GET /comments/pending ─────────────────────────────────────
describe('GET /api/v1/comments/pending', () => {
  it('admin can see pending comments', async () => {
    const res = await request(app)
      .get('/api/v1/comments/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('non-admin cannot access pending list', async () => {
    const res = await request(app)
      .get('/api/v1/comments/pending')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });
});

// ── PATCH /comments/:id/approve ───────────────────────────────
describe('PATCH /api/v1/comments/:id/approve', () => {
  it('admin can approve a comment', async () => {
    const res = await request(app)
      .patch(`/api/v1/comments/${commentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.comment.status).toBe('approved');
  });

  it('cannot approve an already approved comment', async () => {
    const res = await request(app)
      .patch(`/api/v1/comments/${commentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

// ── Réponses imbriquées ───────────────────────────────────────
describe('Nested replies', () => {
  it('user can reply to an approved comment', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        articleId,
        content:  'Thanks for the feedback!',
        parentId: commentId,
      });
    expect(res.status).toBe(201);
    replyId = res.body.data.comment.id;
  });

  it('cannot reply to a reply (max 1 level)', async () => {
    // Approuver la réponse d'abord
    await request(app)
      .patch(`/api/v1/comments/${replyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({
        articleId,
        content:  'Nested reply',
        parentId: replyId,
      });
    expect(res.status).toBe(400);
  });

  it('approved comment includes replies', async () => {
    const res = await request(app)
      .get(`/api/v1/comments/article/${articleId}`);
    expect(res.status).toBe(200);
    const root = res.body.data.find(c => c.id === commentId);
    expect(root).toBeDefined();
    expect(root.replies).toBeInstanceOf(Array);
    expect(root.replies.length).toBeGreaterThan(0);
  });
});

// ── PUT /comments/:id ─────────────────────────────────────────
describe('PUT /api/v1/comments/:id', () => {
  it('owner can edit own comment', async () => {
    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ content: 'Updated comment content' });
    expect(res.status).toBe(200);
    expect(res.body.data.comment.content).toBe('Updated comment content');
    expect(res.body.data.comment.status).toBe('pending');
  });

  it('other user cannot edit comment', async () => {
    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Hacked content' });
    expect(res.status).toBe(403);
  });
});

// ── PATCH /comments/:id/reject ────────────────────────────────
describe('PATCH /api/v1/comments/:id/reject', () => {
  it('admin can reject a comment', async () => {
    const res = await request(app)
      .patch(`/api/v1/comments/${commentId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.comment.status).toBe('rejected');
  });
});

// ── DELETE /comments/:id ──────────────────────────────────────
describe('DELETE /api/v1/comments/:id', () => {
  it('admin can delete any comment', async () => {
    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('reader cannot delete another comment', async () => {
    // Créer un nouveau commentaire à tenter de supprimer
    const newComment = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ articleId, content: 'Author comment to protect' });

    const res = await request(app)
      .delete(`/api/v1/comments/${newComment.body.data.comment.id}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });
});