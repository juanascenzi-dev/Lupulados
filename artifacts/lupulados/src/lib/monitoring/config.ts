export type MonitoringConfig =
  | { configured: true; dsn: string; environment: string }
  | { configured: false; reason: "missing_dsn" | "dev_mode" };

export interface MonitoringEnv {
  VITE_SENTRY_DSN?: string;
  MODE?: string;
}

export function parseMonitoringConfig(env: MonitoringEnv, isProd: boolean): MonitoringConfig {
  const dsn = env.VITE_SENTRY_DSN?.trim() ?? "";
  if (!dsn) return { configured: false, reason: "missing_dsn" };
  if (!isProd) return { configured: false, reason: "dev_mode" };

  return { configured: true, dsn, environment: env.MODE?.trim() || "production" };
}

export function getMonitoringConfig(): MonitoringConfig {
  return parseMonitoringConfig(
    { VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN, MODE: import.meta.env.MODE },
    import.meta.env.PROD,
  );
}
