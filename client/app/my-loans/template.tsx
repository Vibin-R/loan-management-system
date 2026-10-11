/** Re-mounts on every navigation, so each page fades in while the layout around it stays put. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
