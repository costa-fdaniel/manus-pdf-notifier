#!/usr/bin/env python3
"""
PDF Table Extractor Service
Extrai tabelas de PDFs usando Camelot e retorna dados estruturados em JSON.
"""

import sys
import json
import camelot
from pathlib import Path


def extract_tables_from_pdf(pdf_path: str) -> dict:
    """
    Extrai todas as tabelas de um PDF e retorna em formato JSON.
    
    Args:
        pdf_path: Caminho absoluto para o arquivo PDF
        
    Returns:
        Dict com estrutura: {
            "success": bool,
            "total_tables": int,
            "tables": [
                {
                    "page": int,
                    "rows": [
                        {"Nº": "1", "EMPRESAS": "...", "CNPJ": "..."},
                        ...
                    ]
                }
            ],
            "error": str (se houver erro)
        }
    """
    try:
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            return {
                "success": False,
                "error": f"Arquivo não encontrado: {pdf_path}"
            }
        
        # Extrair tabelas usando Camelot
        tables = camelot.read_pdf(pdf_path, pages="all", flavor="lattice")
        
        if not tables:
            # Tentar com flavor "stream" se lattice não funcionar
            tables = camelot.read_pdf(pdf_path, pages="all", flavor="stream")
        
        if not tables:
            return {
                "success": False,
                "total_tables": 0,
                "tables": [],
                "error": "Nenhuma tabela encontrada no PDF"
            }
        
        extracted_tables = []
        
        for idx, table in enumerate(tables):
            # Converter DataFrame para lista de dicts
            df = table.df
            
            # Usar primeira linha como headers se disponível
            if len(df) > 0:
                # Limpar dados vazios
                df = df.dropna(how='all')
                
                # Se a primeira linha parece ser header, usá-la
                headers = df.iloc[0].tolist() if len(df) > 0 else []
                
                # Converter para lista de dicts
                rows = []
                for row_idx in range(len(df)):
                    row_data = df.iloc[row_idx].tolist()
                    row_dict = {}
                    for col_idx, value in enumerate(row_data):
                        if col_idx < len(headers):
                            key = headers[col_idx].strip() if headers[col_idx] else f"col_{col_idx}"
                        else:
                            key = f"col_{col_idx}"
                        row_dict[key] = str(value).strip() if value else ""
                    rows.append(row_dict)
                
                extracted_tables.append({
                    "page": table.page,
                    "rows": rows
                })
        
        return {
            "success": True,
            "total_tables": len(extracted_tables),
            "tables": extracted_tables
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao processar PDF: {str(e)}"
        }


def extract_companies_from_tables(tables_data: list) -> dict:
    """
    Extrai dados de empresas (nome e CNPJ) das tabelas extraídas.
    
    Args:
        tables_data: Lista de tabelas retornadas por extract_tables_from_pdf
        
    Returns:
        Dict com estrutura: {
            "success": bool,
            "companies": [
                {"name": "...", "cnpj": "..."},
                ...
            ],
            "error": str (se houver erro)
        }
    """
    try:
        companies = []
        
        for table in tables_data:
            rows = table.get("rows", [])
            
            for row in rows:
                # Procurar colunas que contenham "EMPRESA" e "CNPJ"
                company_name = None
                cnpj = None
                
                for key, value in row.items():
                    key_upper = key.upper()
                    value_str = str(value).strip()
                    
                    # Procurar coluna de empresa
                    if "EMPRESA" in key_upper and value_str:
                        company_name = value_str
                    
                    # Procurar coluna de CNPJ
                    if "CNPJ" in key_upper and value_str:
                        cnpj = value_str
                
                # Adicionar se encontrou ambos
                if company_name and cnpj and cnpj != "CNPJ":  # Evitar headers
                    # Validar formato básico do CNPJ
                    cnpj_clean = cnpj.replace(".", "").replace("/", "").replace("-", "")
                    if len(cnpj_clean) == 14 and cnpj_clean.isdigit():
                        companies.append({
                            "name": company_name,
                            "cnpj": cnpj
                        })
        
        return {
            "success": True,
            "companies": companies,
            "total": len(companies)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao extrair empresas: {str(e)}"
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Uso: python3 pdf_extractor.py <caminho_pdf> [modo]"
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "extract_tables"
    
    if mode == "extract_tables":
        result = extract_tables_from_pdf(pdf_path)
    elif mode == "extract_companies":
        # Modo que extrai tabelas e depois empresas
        tables_result = extract_tables_from_pdf(pdf_path)
        if tables_result.get("success"):
            result = extract_companies_from_tables(tables_result.get("tables", []))
        else:
            result = tables_result
    else:
        result = {"success": False, "error": f"Modo desconhecido: {mode}"}
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
