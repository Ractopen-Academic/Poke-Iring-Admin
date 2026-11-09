# Agent notes - Poke: Iring Admin (Next.js Console)

## Local Compilation & Heavy Task Policy
- **Never run heavy builds or heavy compilations locally**: Commands like heavy container builds or full production artifact generation should be handled in CI/cloud.
- **Stop local testing and compilation if heavy**: Any operation that takes longer than a minute or consumes high CPU/memory must not run locally.
- **Lightweight checks only**: Fast linting (`pnpm lint` / `eslint`), type-checking (`tsc --noEmit`), and fast checks are allowed locally.
- **Cloud & GitHub Actions Priority**: Use GitHub Actions / Vercel cloud deployments for heavy end-to-end pipelines.
- **User Permission Required**: Always ask the user before compiling or running heavy builds.
