import { describe, expect, it } from "vitest";
import { parseMonitoringConfig } from "./config";

describe("parseMonitoringConfig", () => {
  it("reports monitoring as unconfigured without a DSN", () => {
    expect(parseMonitoringConfig({}, true)).toEqual({ configured: false, reason: "missing_dsn" });
  });

  it("reports monitoring as unconfigured outside of production, even with a DSN", () => {
    expect(
      parseMonitoringConfig({ VITE_SENTRY_DSN: "https://example@o1.ingest.sentry.io/1" }, false),
    ).toEqual({ configured: false, reason: "dev_mode" });
  });

  it("activates monitoring with a DSN in production", () => {
    expect(
      parseMonitoringConfig(
        { VITE_SENTRY_DSN: "https://example@o1.ingest.sentry.io/1", MODE: "production" },
        true,
      ),
    ).toEqual({
      configured: true,
      dsn: "https://example@o1.ingest.sentry.io/1",
      environment: "production",
    });
  });

  it("falls back to a default environment when MODE is missing", () => {
    expect(
      parseMonitoringConfig({ VITE_SENTRY_DSN: "https://example@o1.ingest.sentry.io/1" }, true),
    ).toEqual({
      configured: true,
      dsn: "https://example@o1.ingest.sentry.io/1",
      environment: "production",
    });
  });

  it("ignores a blank DSN", () => {
    expect(parseMonitoringConfig({ VITE_SENTRY_DSN: "   " }, true)).toEqual({
      configured: false,
      reason: "missing_dsn",
    });
  });
});
