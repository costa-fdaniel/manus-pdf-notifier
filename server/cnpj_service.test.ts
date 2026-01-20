import { describe, it, expect } from "vitest";
import { extractEmail, extractPhone, formatAddress } from "./cnpj_service";
import type { CnpjData } from "./cnpj_service";

describe("CNPJ Service", () => {
  const mockCnpjData: CnpjData = {
    cnpj: "11222333000181",
    razao_social: "Empresa Teste LTDA",
    nome_fantasia: "Empresa Teste",
    situacao_cadastral: "Ativa",
    data_situacao_cadastral: "2020-01-01",
    email: "contato@empresa.com",
    telefones: [
      {
        ddd: "11",
        numero: "999999999",
        is_fax: false,
      },
    ],
    logradouro: "Rua Teste",
    numero: "123",
    bairro: "Centro",
    cep: "01234567",
    uf: "SP",
    municipio: "São Paulo",
  };

  describe("extractEmail", () => {
    it("deve extrair email corretamente", () => {
      expect(extractEmail(mockCnpjData)).toBe("contato@empresa.com");
    });

    it("deve retornar null se não houver email", () => {
      const data = { ...mockCnpjData, email: undefined };
      expect(extractEmail(data)).toBeNull();
    });
  });

  describe("extractPhone", () => {
    it("deve extrair telefone corretamente", () => {
      const phone = extractPhone(mockCnpjData);
      expect(phone).toBe("+55 11 999999999");
    });

    it("deve retornar null se não houver telefone", () => {
      const data = { ...mockCnpjData, telefones: [] };
      expect(extractPhone(data)).toBeNull();
    });

    it("deve ignorar fax", () => {
      const data = {
        ...mockCnpjData,
        telefones: [
          {
            ddd: "11",
            numero: "999999999",
            is_fax: true,
          },
        ],
      };
      expect(extractPhone(data)).toBeNull();
    });
  });

  describe("formatAddress", () => {
    it("deve formatar endereço completo", () => {
      const address = formatAddress(mockCnpjData);
      expect(address).toBe(
        "Rua Teste, 123, Centro, São Paulo, SP"
      );
    });

    it("deve filtrar campos vazios", () => {
      const data = {
        ...mockCnpjData,
        numero: undefined,
        bairro: undefined,
      };
      const address = formatAddress(data as any);
      expect(address).toBe("Rua Teste, São Paulo, SP");
    });
  });
});
