/** Shown on admin pages when no database is configured (e.g. before `.env.local` exists). */
export function DbNotice() {
  return (
    <div className="rounded-sm border border-line bg-cream/60 p-4 text-sm text-stone">
      <p className="font-medium text-ink">Database not connected</p>
      <p className="mt-1">
        Set <code className="text-xs">DATABASE_URL</code> in <code className="text-xs">.env.local</code>, then run{" "}
        <code className="text-xs">pnpm db:push</code> to create the tables.
      </p>
    </div>
  );
}

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);
