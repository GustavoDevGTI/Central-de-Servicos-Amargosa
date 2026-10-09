"""Copy catalog cell text without editing spelling, punctuation or whitespace."""
import hashlib
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

source = Path(sys.argv[1])
destination = Path(__file__).resolve().parents[1] / "app/workbook-service-data.json"
sheet = load_workbook(source, data_only=True)["Catálogo consolidado"]
headers = {cell.column: str(cell.value).strip() for cell in sheet[1] if cell.value is not None}
rows = {}
for row in sheet.iter_rows(min_row=2):
    if row[0].value is None:
        continue
    cells = {header: "" if row[column - 1].value is None else str(row[column - 1].value)
             for column, header in headers.items()}
    rows[str(row[0].value)] = {"sheetRow": row[0].row, "cells": cells}
destination.write_text(json.dumps({
    "source": source.name,
    "sheet": sheet.title,
    "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "rows": rows,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Copied {len(rows)} rows to {destination}")
