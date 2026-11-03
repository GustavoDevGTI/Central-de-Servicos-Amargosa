"use client";
import { audienceSelection, audienceSelectionValue, serviceAudienceOptions } from "../service-audiences";

export function AudienceSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selection = audienceSelection(value);
  return <fieldset className="admin-editor-modalities"><legend>Público-alvo / usuário</legend>
    {serviceAudienceOptions.map((option) => <label key={option.id}><input type="checkbox" checked={selection.ids.includes(option.id)} onChange={(event) => {
      const ids = new Set(selection.ids);
      if (event.target.checked) ids.add(option.id); else ids.delete(option.id);
      onChange(audienceSelectionValue(ids));
    }} />{option.label}</label>)}
    {!selection.valid && <p>Valor atual: {value}</p>}
  </fieldset>;
}
