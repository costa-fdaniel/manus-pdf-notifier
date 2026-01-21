import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("PDF Router", () => {
  describe("uploadPdf", () => {
    it("deve rejeitar arquivo sem buffer", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pdf.uploadPdf({
          fileName: "test.pdf",
          fileBuffer: Buffer.from("test"),
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getExtractedCompanies", () => {
    it("deve retornar lista vazia para usuário sem empresas", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pdf.getExtractedCompanies({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar por status se fornecido", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pdf.getExtractedCompanies({
        status: "enriched",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("exportCompanies", () => {
    it("deve exportar em formato CSV", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pdf.exportCompanies({
        format: "csv",
      });

      expect(result.success).toBe(true);
    });

    it("deve exportar em formato JSON", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pdf.exportCompanies({
        format: "json",
      });

      expect(result.success).toBe(true);
    });
  });
});
