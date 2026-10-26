import * as cheerio from 'cheerio';

export interface RecipeScope {
  origin: string;
  pathPrefix: string;
  language: string;
  jurisdiction: string;
}
export interface ExtractionRecipe {
  schemaVersion: 1;
  id: string;
  revision: number;
  scope: RecipeScope;
  /** A single unique document root. No JavaScript, commands or network access. */
  rootSelector: string;
}

export function validateRecipe(value: unknown): asserts value is ExtractionRecipe {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_recipe');
  const recipe = value as ExtractionRecipe;
  if (Object.keys(recipe).sort().join(',') !== 'id,revision,rootSelector,schemaVersion,scope'
    || recipe.schemaVersion !== 1 || typeof recipe.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/.test(recipe.id)
    || !Number.isSafeInteger(recipe.revision) || recipe.revision < 1
    || typeof recipe.rootSelector !== 'string' || !recipe.rootSelector.trim() || recipe.rootSelector.length > 256
    || !recipe.scope || Object.keys(recipe.scope).sort().join(',') !== 'jurisdiction,language,origin,pathPrefix') {
    throw new Error('invalid_recipe');
  }
  const scope = recipe.scope;
  const origin = new URL(scope.origin);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== scope.origin
    || typeof scope.pathPrefix !== 'string' || !scope.pathPrefix.startsWith('/') || /[?#]/.test(scope.pathPrefix)
    || typeof scope.language !== 'string' || !scope.language.trim()
    || typeof scope.jurisdiction !== 'string' || !scope.jurisdiction.trim()) throw new Error('invalid_recipe_scope');
  // Parse the selector eagerly. Ambiguous matches are refused at execution time.
  cheerio.load('<html><body></body></html>')(recipe.rootSelector);
}

export function recipeApplies(recipe: ExtractionRecipe, url: string, language: string, jurisdiction: string): boolean {
  const parsed = new URL(url);
  const prefix = recipe.scope.pathPrefix.replace(/\/$/, '');
  return parsed.origin === recipe.scope.origin && (parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))
    && language === recipe.scope.language && jurisdiction === recipe.scope.jurisdiction;
}

export function applyRecipe(html: string, recipe: ExtractionRecipe): string {
  const $ = cheerio.load(html);
  const roots = $(recipe.rootSelector);
  if (roots.length !== 1) throw new Error('recipe_root_not_unique');
  // Preserve the selected root, IDs and fragment boundaries for the existing validator.
  return `<html><body>${$.html(roots)}</body></html>`;
}
