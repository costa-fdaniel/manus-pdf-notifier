import { describe, it, expect } from "vitest";
import { validateCnpj, formatCnpj } from "./pdf_processing_service";

describe("PDF Processing Service", () => {
  describe("validateCnpj", () => {
    it("deve validar CNPJ com 14 dígitos", () => {
      expect(validateCnpj("11222333000181")).toBe(true);
    });

    it("deve validar CNPJ formatado", () => {
      expect(validateCnpj("11.222.333/0001-81")).toBe(true);
    });

    it("deve rejeitar CNPJ com menos de 14 dígitos", () => {
      expect(validateCnpj("1122233300018")).toBe(false);
    });

    it("deve rejeitar CNPJ com mais de 14 dígitos", () => {
      expect(validateCnpj("112223330001811")).toBe(false);
    });

    it("deve rejeitar CNPJ com caracteres inválidos", () => {
      expect(validateCnpj("11222333000ABC")).toBe(false);
    });
  });

  describe("formatCnpj", () => {
    it("deve formatar CNPJ corretamente", () => {
      expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
    });

    it("deve retornar CNPJ original se inválido", () => {
      expect(formatCnpj("123")).toBe("123");
    });

    it("deve formatar CNPJ mesmo se já estiver parcialmente formatado", () => {
      const result = formatCnpj("11.222.333/0001-81");
      expect(result).toBe("11.222.333/0001-81");
    });
  });
});
