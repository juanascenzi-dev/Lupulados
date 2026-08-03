import * as Sentry from "@sentry/react";
import { getMonitoringConfig } from "./config";

let initialized = false;

export function initMonitoring(): void {
  const config = getMonitoringConfig();
  if (!config.configured) return;

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    sendDefaultPii: false,
    integrations: [],
  });
  initialized = true;
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
