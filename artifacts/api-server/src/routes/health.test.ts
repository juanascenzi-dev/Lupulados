import { describe, expect, it } from "vitest";
import supertest from "supertest";
import app from "../app";

describe("GET /api/healthz", () => {
  it("responde 200 con status ok", async () => {
    const response = await supertest(app).get("/api/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
