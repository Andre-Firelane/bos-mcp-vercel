const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes

function formatRelative(importedAt: string): string {
  const diff = Date.now() - new Date(importedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes === 1) return 'vor 1 Minute';
  if (minutes < 60) return `vor ${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'vor 1 Stunde';
  return `vor ${hours} Stunden`;
}

export function LastImportBadge({ importedAt }: { importedAt: string | null }) {
  if (!importedAt) {
    return (
      <span className="text-sm text-gray-500">Noch keine Daten importiert</span>
    );
  }

  const isStale =
    Date.now() - new Date(importedAt).getTime() > STALE_THRESHOLD_MS;

  return (
    <span
      className={`text-sm ${isStale ? 'text-yellow-400' : 'text-gray-400'}`}
      title={new Date(importedAt).toLocaleString('de-DE')}
    >
      Zuletzt aktualisiert: {formatRelative(importedAt)}
      {isStale && ' ⚠'}
    </span>
  );
}
