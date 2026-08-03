import { beforeEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();
const init = vi.fn();

vi.mock("@sentry/react", () => ({ init, captureException }));

const getMonitoringConfig = vi.fn();
vi.mock("./config", () => ({ getMonitoringConfig }));

async function loadSentryModule() {
  vi.resetModules();
  return import("./sentry");
}

describe("reportError", () => {
  beforeEach(() => {
    captureException.mockReset();
    init.mockReset();
    getMonitoringConfig.mockReset();
  });

  it("does not report to Sentry when monitoring was never initialized", async () => {
    getMonitoringConfig.mockReturnValue({ configured: false, reason: "missing_dsn" });
    const { initMonitoring, reportError } = await loadSentryModule();

    initMonitoring();
    reportError(new Error("boom"));

    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("initializes Sentry and reports errors once configured", async () => {
    getMonitoringConfig.mockReturnValue({
      configured: true,
      dsn: "https://example@o1.ingest.sentry.io/1",
      environment: "production",
    });
    const { initMonitoring, reportError } = await loadSentryModule();

    initMonitoring();
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://example@o1.ingest.sentry.io/1",
        environment: "production",
        sendDefaultPii: false,
      }),
    );

    const error = new Error("boom");
    reportError(error, { scope: "test" });
    expect(captureException).toHaveBeenCalledWith(error, { extra: { scope: "test" } });
  });

  it("reports without an extra payload when no context is given", async () => {
    getMonitoringConfig.mockReturnValue({
      configured: true,
      dsn: "https://example@o1.ingest.sentry.io/1",
      environment: "production",
    });
    const { initMonitoring, reportError } = await loadSentryModule();

    initMonitoring();
    const error = new Error("boom");
    reportError(error);
    expect(captureException).toHaveBeenCalledWith(error, undefined);
  });
});
