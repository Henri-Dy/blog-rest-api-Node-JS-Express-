require('dotenv').config();
const { initializeDatabase, getDb, closeDatabase } = require('../db');
const bcrypt    = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const slugify   = require('slugify');

async function seed() {
  await initializeDatabase();
  const db = getDb();

  console.log('🌱 Starting seed...\n');

  // ── Nettoyage ────────────────────────────────────────────────
  db.exec(`
    DELETE FROM comments;
    DELETE FROM article_tags;
    DELETE FROM article_categories;
    DELETE FROM articles;
    DELETE FROM tags;
    DELETE FROM categories;
    DELETE FROM refresh_tokens;
    DELETE FROM users;
  `);
  console.log('🗑  Database cleared');

  // ── Users ────────────────────────────────────────────────────
  const ROUNDS  = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const adminId  = uuidv4();
  const author1Id = uuidv4();
  const author2Id = uuidv4();
  const reader1Id = uuidv4();
  const reader2Id = uuidv4();

  const users = [
    {
      id:       adminId,
      name:     'Admin User',
      email:    'admin@blog.com',
      password: await bcrypt.hash('Admin1234', ROUNDS),
      role:     'admin',
      bio:      'Platform administrator',
    },
    {
      id:       author1Id,
      name:     'Alice Martin',
      email:    'alice@blog.com',
      password: await bcrypt.hash('Author1234', ROUNDS),
      role:     'author',
      bio:      'Full-stack developer and technical writer. Passionate about Node.js and clean architecture.',
    },
    {
      id:       author2Id,
      name:     'Bob Dupont',
      email:    'bob@blog.com',
      password: await bcrypt.hash('Author1234', ROUNDS),
      role:     'author',
      bio:      'DevOps engineer. Writing about Docker, CI/CD and cloud infrastructure.',
    },
    {
      id:       reader1Id,
      name:     'Charlie Reader',
      email:    'charlie@blog.com',
      password: await bcrypt.hash('Reader1234', ROUNDS),
      role:     'reader',
      bio:      'Tech enthusiast and avid blog reader.',
    },
    {
      id:       reader2Id,
      name:     'Diana Viewer',
      email:    'diana@blog.com',
      password: await bcrypt.hash('Reader1234', ROUNDS),
      role:     'reader',
      bio:      null,
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, bio)
    VALUES (@id, @name, @email, @password, @role, @bio)
  `);
  users.forEach(u => insertUser.run(u));
  console.log(`👤 ${users.length} users created`);

  // ── Categories ───────────────────────────────────────────────
  const categories = [
    { id: uuidv4(), name: 'Technology',     description: 'Articles about software and tech' },
    { id: uuidv4(), name: 'Node.js',        description: 'Everything about Node.js' },
    { id: uuidv4(), name: 'DevOps',         description: 'CI/CD, Docker, Kubernetes and more' },
    { id: uuidv4(), name: 'Best Practices', description: 'Clean code, architecture and patterns' },
    { id: uuidv4(), name: 'Career',         description: 'Tips for developers career growth' },
  ].map(c => ({ ...c, slug: slugify(c.name, { lower: true, strict: true }) }));

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description)
    VALUES (@id, @name, @slug, @description)
  `);
  categories.forEach(c => insertCategory.run(c));
  console.log(`📁 ${categories.length} categories created`);

  // ── Tags ─────────────────────────────────────────────────────
  const tagNames = [
    'javascript', 'nodejs', 'express', 'sqlite', 'rest-api',
    'docker', 'ci-cd', 'clean-code', 'architecture', 'jwt',
    'authentication', 'testing', 'jest', 'beginner', 'advanced',
  ];

  const tags = tagNames.map(name => ({
    id:   uuidv4(),
    name,
    slug: slugify(name, { lower: true, strict: true }),
  }));

  const insertTag = db.prepare(`
    INSERT INTO tags (id, name, slug) VALUES (@id, @name, @slug)
  `);
  tags.forEach(t => insertTag.run(t));
  console.log(`🏷  ${tags.length} tags created`);

  // ── Helper slug ───────────────────────────────────────────────
  const makeSlug = (title) => slugify(title, { lower: true, strict: true });

  // ── Helper find ───────────────────────────────────────────────
  const cat  = (name) => categories.find(c => c.name === name);
  const tag  = (name) => tags.find(t => t.name === name);

  // ── Articles ─────────────────────────────────────────────────
  const now = new Date().toISOString();

  const articlesData = [
    {
      id:      uuidv4(),
      userId:  author1Id,
      title:   'Building a REST API with Node.js and Express',
      excerpt: 'A step-by-step guide to building a production-ready REST API.',
      content: `# Building a REST API with Node.js and Express

## Introduction
Node.js combined with Express.js is one of the most popular stacks for building REST APIs.
In this article, we will explore how to create a clean, scalable, and maintainable API.

## Setting Up the Project
First, initialize your project with npm and install the required dependencies.
Express.js will handle routing, while additional packages like helmet, cors, and morgan
add security and logging capabilities.

## Project Structure
A well-organized project structure is crucial for maintainability.
Separate your routes, controllers, services, and repositories into distinct layers.

## Conclusion
Following these practices will help you build APIs that are easy to maintain and scale.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('Node.js'), cat('Technology')],
      tags:        [tag('nodejs'), tag('express'), tag('rest-api'), tag('beginner')],
    },
    {
      id:      uuidv4(),
      userId:  author1Id,
      title:   'JWT Authentication Best Practices',
      excerpt: 'How to implement secure JWT authentication in your Node.js application.',
      content: `# JWT Authentication Best Practices

## What is JWT?
JSON Web Tokens (JWT) are a compact, URL-safe means of representing claims
between two parties. They are widely used for authentication and authorization.

## Access Tokens vs Refresh Tokens
Access tokens should be short-lived (15 minutes) while refresh tokens can last longer (7 days).
This limits the damage if an access token is compromised.

## Token Rotation
Implement refresh token rotation: each time a refresh token is used,
invalidate it and issue a new one. This detects token theft.

## Storage
Never store tokens in localStorage. Use httpOnly cookies for refresh tokens
and keep access tokens in memory.

## Conclusion
Proper JWT implementation significantly improves your application security.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('Node.js'), cat('Best Practices')],
      tags:        [tag('jwt'), tag('authentication'), tag('nodejs'), tag('advanced')],
    },
    {
      id:      uuidv4(),
      userId:  author1Id,
      title:   'Clean Architecture in Express.js Applications',
      excerpt: 'Applying SOLID principles and clean architecture to your Express apps.',
      content: `# Clean Architecture in Express.js Applications

## The Problem with Spaghetti Code
As applications grow, poorly structured code becomes increasingly difficult to maintain.
Routes containing business logic, direct database calls in controllers — these are red flags.

## The Solution: Layered Architecture
Separate your application into distinct layers:
- **Routes**: Define endpoints and delegate to controllers
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data access

## Dependency Flow
Dependencies should only flow inward. Your business logic should not depend on
Express or SQLite directly — this makes it testable and replaceable.

## Conclusion
Clean architecture takes more upfront effort but pays dividends as your codebase grows.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('Best Practices'), cat('Technology')],
      tags:        [tag('clean-code'), tag('architecture'), tag('nodejs')],
    },
    {
      id:      uuidv4(),
      userId:  author2Id,
      title:   'Docker for Node.js Developers',
      excerpt: 'Containerize your Node.js application with Docker for consistent deployments.',
      content: `# Docker for Node.js Developers

## Why Docker?
Docker ensures your application runs the same way in development, staging, and production.
No more "works on my machine" problems.

## Writing a Dockerfile
A production-ready Dockerfile for Node.js uses a multi-stage build to keep the image small.
Start from an official Node.js Alpine image for minimal size.

## Docker Compose
Use Docker Compose to define and run multi-container applications.
Define your app, database, and other services in a single YAML file.

## Best Practices
- Use .dockerignore to exclude node_modules
- Run as non-root user
- Use specific image versions, not latest

## Conclusion
Docker is an essential tool for modern Node.js development and deployment.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('DevOps'), cat('Technology')],
      tags:        [tag('docker'), tag('nodejs'), tag('advanced')],
    },
    {
      id:      uuidv4(),
      userId:  author2Id,
      title:   'CI/CD Pipeline for Node.js with GitHub Actions',
      excerpt: 'Automate testing and deployment with GitHub Actions.',
      content: `# CI/CD Pipeline for Node.js with GitHub Actions

## What is CI/CD?
Continuous Integration and Continuous Deployment automate the process of
testing and deploying your application every time you push code.

## Setting Up GitHub Actions
Create a .github/workflows/main.yml file in your repository.
Define triggers, jobs, and steps to run your tests and deploy your app.

## Running Tests Automatically
Configure your workflow to install dependencies and run your test suite
on every pull request and push to main.

## Deploying Automatically
After tests pass, automatically deploy to your hosting platform.
GitHub Actions supports deployments to AWS, Heroku, DigitalOcean and more.

## Conclusion
CI/CD pipelines catch bugs early and reduce deployment risk.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('DevOps')],
      tags:        [tag('ci-cd'), tag('docker'), tag('testing')],
    },
    {
      id:      uuidv4(),
      userId:  author1Id,
      title:   'Testing Express APIs with Jest and Supertest',
      excerpt: 'Write comprehensive tests for your REST API using Jest and Supertest.',
      content: `# Testing Express APIs with Jest and Supertest

## Why Testing Matters
Tests catch bugs before they reach production and serve as living documentation
of your API's expected behavior.

## Setting Up Jest
Install Jest and Supertest as dev dependencies.
Configure Jest to use the Node.js test environment.

## Writing Your First Test
Use supertest to make HTTP requests to your Express app in tests.
Test happy paths and error cases for each endpoint.

## Test Structure
Organize tests by feature. Use beforeAll/afterAll for setup and teardown.
Use descriptive test names so failures are self-documenting.

## Conclusion
A well-tested API is a reliable API. Aim for high coverage on critical paths.`,
      status:      'published',
      publishedAt: now,
      categories:  [cat('Best Practices'), cat('Node.js')],
      tags:        [tag('testing'), tag('jest'), tag('nodejs'), tag('express')],
    },
    {
      id:      uuidv4(),
      userId:  author1Id,
      title:   'Draft: Advanced SQLite Techniques',
      excerpt: 'Exploring advanced SQLite features for production use.',
      content: 'Work in progress — coming soon.',
      status:  'draft',
      publishedAt: null,
      categories: [cat('Technology')],
      tags:       [tag('sqlite'), tag('advanced')],
    },
  ];

  const insertArticle = db.prepare(`
    INSERT INTO articles (id, user_id, title, slug, excerpt, content, status, published_at)
    VALUES (@id, @userId, @title, @slug, @excerpt, @content, @status, @publishedAt)
  `);
  const insertArticleCategory = db.prepare(`
    INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)
  `);
  const insertArticleTag = db.prepare(`
    INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)
  `);

  for (const art of articlesData) {
    insertArticle.run({
      id:          art.id,
      userId:      art.userId,
      title:       art.title,
      slug:        makeSlug(art.title),
      excerpt:     art.excerpt,
      content:     art.content,
      status:      art.status,
      publishedAt: art.publishedAt,
    });
    art.categories?.forEach(c => { if (c) insertArticleCategory.run(art.id, c.id); });
    art.tags?.forEach(t => { if (t) insertArticleTag.run(art.id, t.id); });
  }
  console.log(`📝 ${articlesData.length} articles created`);

  // ── Comments ──────────────────────────────────────────────────
  const publishedArticles = articlesData.filter(a => a.status === 'published');
  const firstArticleId    = publishedArticles[0].id;
  const secondArticleId   = publishedArticles[1].id;

  const comment1Id = uuidv4();
  const comment2Id = uuidv4();
  const comment3Id = uuidv4();

  const comments = [
    {
      id:        comment1Id,
      articleId: firstArticleId,
      userId:    reader1Id,
      parentId:  null,
      content:   'Excellent article! This helped me set up my first REST API.',
      status:    'approved',
    },
    {
      id:        uuidv4(),
      articleId: firstArticleId,
      userId:    author1Id,
      parentId:  comment1Id,
      content:   'Thank you Charlie! Glad it was helpful. Feel free to ask if you have questions.',
      status:    'approved',
    },
    {
      id:        comment2Id,
      articleId: firstArticleId,
      userId:    reader2Id,
      parentId:  null,
      content:   'Would love to see a follow-up article about adding a database layer.',
      status:    'approved',
    },
    {
      id:        comment3Id,
      articleId: firstArticleId,
      userId:    reader1Id,
      parentId:  null,
      content:   'This needs more examples.',
      status:    'pending',
    },
    {
      id:        uuidv4(),
      articleId: secondArticleId,
      userId:    reader1Id,
      parentId:  null,
      content:   'The section on token rotation was very clear. Thanks!',
      status:    'approved',
    },
    {
      id:        uuidv4(),
      articleId: secondArticleId,
      userId:    reader2Id,
      parentId:  null,
      content:   'Spam comment — should be rejected.',
      status:    'rejected',
    },
  ];

  const insertComment = db.prepare(`
    INSERT INTO comments (id, article_id, user_id, parent_id, content, status)
    VALUES (@id, @articleId, @userId, @parentId, @content, @status)
  `);
  comments.forEach(c => insertComment.run(c));
  console.log(`💬 ${comments.length} comments created`);

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!\n');
  console.log('─────────────────────────────────────');
  console.log('📧 Test accounts:');
  console.log('   admin@blog.com   / Admin1234  (admin)');
  console.log('   alice@blog.com   / Author1234 (author)');
  console.log('   bob@blog.com     / Author1234 (author)');
  console.log('   charlie@blog.com / Reader1234 (reader)');
  console.log('   diana@blog.com   / Reader1234 (reader)');
  console.log('─────────────────────────────────────\n');

  closeDatabase();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});