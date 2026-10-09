"""Verify literal DOM text against the original XLSX, independently of JS mapping."""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

from openpyxl import load_workbook

root = Path(__file__).resolve().parents[1]
folder = root / "tmp/workbook-audit"
workbook = load_workbook(Path(sys.argv[1]) if len(sys.argv) > 1 else root / "tmp/catalog-current.xlsx", data_only=True)
sheet = workbook["Catálogo consolidado"]
headers = {c.column: str(c.value).strip() for c in sheet[1] if c.value is not None}
original = {str(row[0].value): {header: "" if row[col - 1].value is None else str(row[col - 1].value)
                              for col, header in headers.items()}
            for row in sheet.iter_rows(min_row=2) if row[0].value is not None}
copied = json.loads((root / "app/workbook-service-data.json").read_text(encoding="utf8"))
for row_id, row in copied["rows"].items():
    assert row["cells"] == original[row_id], f"Source cells changed: {row_id}"

class CellText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.column = None; self.depth = 0; self.cells = {}; self.section_ids = []; self.in_h1 = False; self.title = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h1": self.in_h1 = True
        if tag == "section": self.section_ids.append(attrs.get("id"))
        if tag == "span":
            if self.column: self.depth += 1
            elif "data-workbook-column" in attrs:
                self.column = attrs["data-workbook-column"]; self.depth = 1; self.cells[self.column] = []
    def handle_endtag(self, tag):
        if tag == "h1": self.in_h1 = False
        if tag == "span" and self.column:
            self.depth -= 1
            if not self.depth: self.column = None
    def handle_data(self, data):
        if self.column: self.cells[self.column].append(data)
        if self.in_h1: self.title.append(data)

catalog = {s["id"]: s for s in json.loads((folder / "catalog-after.json").read_text(encoding="utf8"))}
pages = json.loads((folder / "rendered-pages.json").read_text(encoding="utf8"))
count = 0
for service_id, html in pages.items():
    parser = CellText(); parser.feed(html)
    cells = original[str(catalog[service_id]["sourceRow"])]
    assert "".join(parser.title) == cells["Nome do serviço consolidado"], service_id
    expected = ["O que é", "Quem pode solicitar2", "Como solicitar - etapas", "Onde e quando solicitar2", "Custo", "Prazo"]
    expected += [c for c in ["Documentos obrigatórios", "Documentos opcionais"] if cells[c]]
    if cells["Documentação necessária"] and cells["Documentação necessária"] != cells["Documentos obrigatórios"]:
        expected += ["Documentação necessária"]
    expected += [c for c in ["Setor/Unidade responsável no SEI", "Secretaria responsável", "Telefone", "Ramal", "E-mail do setor/unidade", "É digital?", "Plataforma", "Link de acesso"] if cells[c]]
    assert set(parser.cells) == set(expected), f"Missing/extra displayed fields: {service_id}"
    for column in expected:
        assert "".join(parser.cells[column]) == cells[column], f"Changed DOM text: {service_id}: {column}"
        count += 1
    assert "legislacao" not in parser.section_ids, f"Extra legislation: {service_id}"
result = {"sourceRows": len(original), "fullPages": len(pages), "renderedCells": count, "differences": 0}
(folder / "render-verification.json").write_text(json.dumps(result), encoding="utf8")
print(json.dumps(result))
