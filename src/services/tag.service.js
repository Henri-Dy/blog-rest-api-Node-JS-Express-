const { v4: uuidv4 } = require('uuid');
const slugify        = require('slugify');
const tagRepo        = require('../repositories/tag.repository');
const ApiError       = require('../utils/ApiError');
const { paginate, paginationMeta } = require('../utils/pagination');

class TagService {

  async getAll() {
    return tagRepo.findAll();
  }

  async getBySlug(slug, query = {}) {
    const tag = tagRepo.findBySlug(slug);
    if (!tag) throw ApiError.notFound('Tag not found');

    const { page, limit, offset } = paginate(query);
    const articles = tagRepo.getArticles(tag.id, { limit, offset });
    const total    = tagRepo.countArticles(tag.id);

    return {
      tag,
      articles,
      pagination: paginationMeta(total, page, limit),
    };
  }

  async create({ name }) {
    const existing = tagRepo.findByName(name);
    if (existing) throw ApiError.conflict('Tag already exists');

    const slug = await this._uniqueSlug(name);
    return tagRepo.create({ id: uuidv4(), name, slug });
  }

  async update(id, { name }) {
    const tag = tagRepo.findById(id);
    if (!tag) throw ApiError.notFound('Tag not found');

    if (!name) return tag;

    if (name !== tag.name) {
      const existing = tagRepo.findByName(name);
      if (existing) throw ApiError.conflict('Tag name already in use');
    }

    const slug = await this._uniqueSlug(name, id);
    return tagRepo.update(id, { name, slug });
  }

  async delete(id) {
    const tag = tagRepo.findById(id);
    if (!tag) throw ApiError.notFound('Tag not found');
    tagRepo.delete(id);
    return true;
  }

  async _uniqueSlug(name, excludeId = null) {
    const base     = slugify(name, { lower: true, strict: true });
    const existing = tagRepo.findBySlugLike(base);
    const slugs    = existing.map(r => r.slug).filter(s => {
      if (!excludeId) return true;
      const t = tagRepo.findBySlug(s);
      return t && t.id !== excludeId;
    });

    if (!slugs.includes(base)) return base;
    let i = 1;
    while (slugs.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }
}

module.exports = new TagService();