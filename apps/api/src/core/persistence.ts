export function useDatabasePersistence(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  return Boolean(process.env.DATABASE_URL);
}
