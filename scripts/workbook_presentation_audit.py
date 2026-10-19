"""Independently verify source slices and contact deduplication authorized by the user."""
import json
import re

COLUMN = "Onde e quando solicitar2"
LABELS = {"telefone": "Telefone", "e-mail": "E-mail do setor/unidade", "ramal": "Ramal", "canal": "Plataforma", "plataforma": "Plataforma"}

def verify_where_when(cells, partitions, visible_slices, visible_fields):
    parts = json.loads(partitions)
    source = cells[COLUMN]
    encoded_source = source.encode("utf-16-le")
    source_length = len(encoded_source) // 2
    cursor = 0
    expected_slices = []
    for part in parts:
        start, end = part["start"], part["end"]
        assert isinstance(start, int) and isinstance(end, int) and start == cursor and start < end <= source_length, "Invalid source coverage"
        raw = encoded_source[start * 2:end * 2].decode("utf-16-le")
        if part["placement"] == "duplicate":
            match = re.match(r"(Telefone|E-mail|Ramal|Canal|Plataforma):\s*(.*)", raw, re.I | re.S)
            assert match and LABELS[match[1].lower()] == part["column"], "Unknown deduplicated field"
            value = match[2].strip().removesuffix(".").removesuffix(";").rstrip()
            column = part["column"]
            assert cells[column].strip() and value == cells[column].strip(), "Different contact discarded"
            assert cells[column] in visible_fields.get(column, []), "Contact has no visible equivalent"
        else:
            assert part["placement"] in {"intro", "hours"}
            if part["placement"] == "hours":
                assert re.match(r"Horários?(?: de atendimento)?:|Horário e atendimento presencial devem ser confirmados com a unidade responsável\.", raw, re.I), "Unknown schedule extraction"
            if raw.strip(): expected_slices.append((str(start), str(end), raw, part["placement"]))
        cursor = end
    assert cursor == source_length, "Source information lost"
    actual = [tuple(item) for item in visible_slices if item[2].strip()]
    assert sorted(actual) == sorted(expected_slices), "Moved text is missing, repeated or rewritten"
    return len(actual)
