export default function ChangePasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        <p className="text-sm font-medium text-foreground/60">
          Loading account security…
        </p>
      </div>
    </div>
  );
}
