import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

export interface PostMeta {
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
  cover?: string;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
}

const POSTS_PATH = path.join(process.cwd(), 'content/posts');
const IDEAS_PATH = path.join(process.cwd(), 'content/ideas');

function getMdxFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.md' || path.extname(file) === '.mdx');
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return matter(rawContent);
}

function extractPostData(dir: string, filename: string): Post {
  const filePath = path.join(dir, filename);
  const { data, content } = readMDXFile(filePath);

  // Clean slug
  const slug = path.basename(filename, path.extname(filename));

  return {
    slug,
    meta: {
      title: data.title || slug,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      description: data.description || '',
      tags: data.tags || [],
      published: data.published !== false,
      featured: data.featured === true,
      ...data,
    },
    content,
  };
}

export function getPosts(): Post[] {
  const files = getMdxFiles(POSTS_PATH);

  const posts = files
    .map((filename) => extractPostData(POSTS_PATH, filename))
    .filter((post) => post.meta.published);

  return posts.sort((a, b) => (new Date(a.meta.date) < new Date(b.meta.date) ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getPosts();
  return posts.find((post) => post.slug === slug || post.slug.toLowerCase() === slug.toLowerCase());
}

export function getIdeas(): Post[] {
  const files = getMdxFiles(IDEAS_PATH);

  const ideas = files
    .map((filename) => extractPostData(IDEAS_PATH, filename))
    .filter((post) => post.meta.published);

  return ideas.sort((a, b) => (new Date(a.meta.date) < new Date(b.meta.date) ? 1 : -1));
}

export function getAllTags(): string[] {
  const posts = getPosts();
  const tags = new Set<string>();

  posts.forEach((post) => {
    if (post.meta.tags) {
      post.meta.tags.forEach((tag) => tags.add(tag));
    }
  });

  return Array.from(tags).sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getPosts().filter((post) =>
    post.meta.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  const slugger = new GithubSlugger();

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    if (!text || text.length < 2) continue;

    const id = slugger.slug(text);

    headings.push({ id, text, level });
  }

  return headings;
}
