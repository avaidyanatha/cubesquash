export type BlogLike = { title?: string; body?: string };

const AUTOMATIC = /automatic post\s*$/i;

/** Cube Cobra fills in "Cube Updated – Automatic Post" when you commit without writing a post. */
export function isAutomaticPost(blog: BlogLike | undefined | null): boolean {
  if (!blog) return false;
  return AUTOMATIC.test((blog.title ?? '').trim()) && (blog.body ?? '').trim().length === 0;
}

/** The title to show for a post, or undefined when the post is Cube Cobra's automatic placeholder. */
export function blogTitleOf(blog: BlogLike | undefined | null): string | undefined {
  if (!blog || isAutomaticPost(blog)) return undefined;
  const t = (blog.title ?? '').trim();
  return t.length ? t : undefined;
}
