/**
 * Converts a string into a URL-safe slug.
 * Handles unicode, special characters, and consecutive hyphens.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/&/g, "-and-")      // & → -and-
    .replace(/[^\w-]+/g, "")     // remove non-word chars
    .replace(/--+/g, "-")        // collapse multiple hyphens
    .replace(/^-+/, "")          // trim leading hyphens
    .replace(/-+$/, "");         // trim trailing hyphens
}

/**
 * Generates a unique slug by appending a numeric suffix if needed.
 * Pass an existsCheck function that returns true if the slug is already taken.
 */
export async function generateUniqueSlug(
  title: string,
  existsCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (await existsCheck(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
