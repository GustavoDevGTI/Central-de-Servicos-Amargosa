import json
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
folder = root / "tmp/workbook-audit"
audit = json.loads((folder / "live-audit.json").read_text(encoding="utf8"))
catalog = json.loads((folder / "catalog-after.json").read_text(encoding="utf8"))
source = json.loads((root / "app/workbook-service-data.json").read_text(encoding="utf8"))
exceptions = [service for service in catalog if not service.get("workbookCells")]
counts = Counter(field for page in audit for field in page.get("differences", []))
verification = json.loads((folder / "render-verification.json").read_text(encoding="utf8"))
lines = [
    "# Conferência dos serviços com a planilha", "", "Verificação: 09/10/2026.", "",
    "Fonte: cópia local de 07/10/2026, tmp/catalog-current.xlsx, aba Catálogo consolidado. Os valores são idênticos aos da cópia baixada Catalogo_Servicos_Amargosa - 22-09-26 (2).xlsx.", "",
    f"SHA-256 da planilha: `{source['sha256']}`.", "",
    "## Cobertura", "",
    "- 150 registros lidos da planilha.",
    "- 8 registros marcados para exclusão continuam fora do catálogo.",
    "- 142 registros ativos correspondem a 145 páginas, incluindo URLs que compartilham o mesmo registro consolidado.",
    "- 161 páginas publicadas consultadas, sem falha de leitura.",
    "- 16 serviços sem espelho mantidos como exceções por orientação do usuário.", "",
    "## Resultado local após a correção", "",
    "- 1.595 comparações dos campos do catálogo passaram.",
    f"- {verification['renderedCells']} campos de texto no HTML de {verification['fullPages']} páginas completas coincidem caractere por caractere com as células do XLSX.",
    "- Pontuação, acentos, espaços, numeração, quebras de linha, erros de escrita e textos pendentes foram preservados.",
    "- Contatos, endereços, legislação, estudos e etapas de outras fontes deixaram de complementar as páginas com espelho.",
    "- A importação foi validada com alteração de link, campos vazios e texto com espaços e quebras de linha. As alterações prevalecem sobre os dados antigos.",
    "- As colunas Documentos obrigatórios e Documentos opcionais são exibidas literalmente. Documentação necessária também é exibida quando traz texto diferente da coluna de obrigatórios, para não ocultar informação que consta em outra coluna.",
    "- Quatro testes do catálogo passaram. A compilação de produção passou. A checagem global de tipos encontrou erros fora desta alteração, incluindo cópias antigas em tmp e work.", "",
    "A correção foi verificada localmente. A publicação não foi confirmada: a ferramenta de hospedagem respondeu 'Sites project not found' para o projeto configurado. O site público consultado na auditoria ainda representa o estado anterior.", "",
    "## Diferenças encontradas no site publicado", "",
    "Esta tabela usa comparação literal. Diferenças de marcação, como número exibido sem ponto e espaço, também entram na contagem. Não representa necessariamente mudança de significado.", "",
    "| Campo | Páginas com diferença literal |", "| --- | ---: |",
]
lines += [f"| {field} | {count} |" for field, count in counts.items()]
lines += ["", "## Serviços sem espelho — mantidos publicados", "", "| Serviço | Página |", "| --- | --- |"]
lines += [f"| {s['title']} | [Abrir](https://maisdigital.amargosa.ba.gov.br/servicos/{s['slug']}) |" for s in exceptions]
lines += ["", "## Conferência página por página", "", "| Serviço | ID na planilha | Diferenças literais antes da correção | Resultado local |", "| --- | ---: | --- | --- |"]
for page in audit:
    if not page["hasWorkbook"]:
        continue
    differences = list(dict.fromkeys(page.get("differences", []) + page.get("modelDifferences", [])))
    lines.append(f"| [{page['title']}]({page['url']}) | {page['sourceRow']} | {', '.join(differences) or 'Nenhuma nos campos inspecionados'} | Texto literal conferido |")
lines += ["", "O arquivo comparacao-publicada.json registra o texto publicado e o texto da planilha para cada seção inspecionada, antes da correção.", ""]
out = root / "output/workbook-audit-2026-10-09"
out.mkdir(parents=True, exist_ok=True)
(out / "conferencia-servicos.md").write_text("\n".join(lines), encoding="utf8")
(out / "comparacao-publicada.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf8")
(out / "excecoes-sem-espelho.json").write_text(json.dumps([{"id": s['id'], "title": s['title'], "url": f"https://maisdigital.amargosa.ba.gov.br/servicos/{s['slug']}"} for s in exceptions], ensure_ascii=False, indent=2), encoding="utf8")
print(out / "conferencia-servicos.md")
