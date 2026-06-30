const prisma = require("../config/prisma");
const { slugify } = require("../utils/generators");
const { z } = require("zod");

const blogPostSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional(),
  author: z.string().min(2),
});

const commentSchema = z.object({ name: z.string().min(1), comment: z.string().min(1) });

async function listPosts(req, res) {
  const { category, search } = req.query;
  const where = {};
  if (category && category !== "All") where.category = String(category);
  if (search) where.title = { contains: String(search), mode: "insensitive" };

  const posts = await prisma.blogPost.findMany({
    where,
    include: { _count: { select: { comments: true } } },
    orderBy: { publishedAt: "desc" },
  });
  res.json(posts);
}

async function getPostBySlug(req, res) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: req.params.slug },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
}

async function createPost(req, res) {
  const data = blogPostSchema.parse(req.body);
  const slug = slugify(data.title);
  const post = await prisma.blogPost.create({ data: { ...data, slug, tags: data.tags ?? [] } });
  res.status(201).json(post);
}

async function updatePost(req, res) {
  const data = blogPostSchema.partial().parse(req.body);
  const post = await prisma.blogPost.update({
    where: { id: req.params.id },
    data: { ...data, ...(data.title && { slug: slugify(data.title) }) },
  });
  res.json(post);
}

async function deletePost(req, res) {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

async function addComment(req, res) {
  const data = commentSchema.parse(req.body);
  const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = await prisma.blogComment.create({
    data: { blogPostId: post.id, name: data.name, comment: data.comment, userId: req.user?.id },
  });
  res.status(201).json(comment);
}

module.exports = { listPosts, getPostBySlug, createPost, updatePost, deletePost, addComment };
