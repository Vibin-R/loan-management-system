type Tone = 'error' | 'success' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  error: 'border-danger/30 bg-danger/5 text-danger',
  success: 'border-success/30 bg-success/5 text-success',
  info: 'border-primary/30 bg-primary/5 text-primary',
};

export function Alert({ tone = 'error', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-2.5 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
