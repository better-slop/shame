/**
 * Client-side configuration constants
 */

export const GITHUB_APP_SLUG = import.meta.env.VITE_GITHUB_APP_SLUG ?? "bs-shame";

/**
 * GitHub App installation URL
 */
export const GITHUB_APP_INSTALL_URL = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
