const { v4: uuidv4 } = require('uuid');
const slugify        = require('slugify');
const categoryRepo   = require('../repositories/category.repository');
const ApiError       = require('../utils/ApiError');
const { paginate, paginationMeta } = require('../utils/pagination');

class CategoryService {

  async getAll() {
    return categoryRepo.findAll();
  }

  async getBySlug(slug, query = {}) {
    const category = categoryRepo.findBySlug(slug);
    if (!category) throw ApiError.notFound('Category not found');

    const { page, limit, offset } = paginate(query);
    const articles = categoryRepo.getArticles(category.id, { limit, offset });
    const total    = categoryRepo.countArticles(category.id);

    return {
      category,
      articles,
      pagination: paginationMeta(total, page, limit),
    };
  }

  async create({ name, description }) {
    const existing = categoryRepo.findByName(name);
    if (existing) throw ApiError.conflict('Category already exists');

    const slug = await this._uniqueSlug(name);
    return categoryRepo.create({ id: uuidv4(), name, slug, description });
  }

  async update(id, { name, description }) {
    const category = categoryRepo.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

    const fields = {};

    if (name && name !== category.name) {
      const existing = categoryRepo.findByName(name);
      if (existing) throw ApiError.conflict('Category name already in use');
      fields.name = name;
      fields.slug = await this._uniqueSlug(name, id);
    }

    if (description !== undefined) fields.description = description;

    return categoryRepo.update(id, fields);
  }

  async delete(id) {
    const category = categoryRepo.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    categoryRepo.delete(id);
    return true;
  }

  async _uniqueSlug(name, excludeId = null) {
    const base     = slugify(name, { lower: true, strict: true });
    const existing = categoryRepo.findBySlugLike(base);
    const slugs    = existing.map(r => r.slug).filter(s => {
      if (!excludeId) return true;
      const cat = categoryRepo.findBySlug(s);
      return cat && cat.id !== excludeId;
    });

    if (!slugs.includes(base)) return base;
    let i = 1;
    while (slugs.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }
}

module.exports = new CategoryService();