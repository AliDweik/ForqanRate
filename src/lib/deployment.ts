export const appBasePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

export function withAppBase(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appBasePath}${normalizedPath}`;
}
