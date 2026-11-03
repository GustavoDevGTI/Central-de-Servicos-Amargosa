"use client";
import { useRef, useState } from "react";
import { arrangeTopics, changeTopic, readTopics, writeTopics, type TopicList, type TopicMode } from "./topic-list";

/** The parent remounts this editor when a service is loaded, saved or discarded. */
export function TopicEditor({ id, label, name, value, mode, onChange }: {
  id: string; label: string; name: string; value: string; mode: TopicMode; onChange: (value: string) => void;
}) {
  const [list, setList] = useState(() => readTopics(value, mode));
  const [error, setError] = useState("");
  const container = useRef<HTMLFieldSetElement>(null);
  function update(next: TopicList, focus?: number) {
    const text = writeTopics(next);
    if (text.length > 20000) { setError("O campo deve ter no máximo 20.000 caracteres."); return; }
    setError(""); setList(next); onChange(text);
    if (focus !== undefined) requestAnimationFrame(() => container.current?.querySelectorAll("textarea")[focus]?.focus());
  }
  const List = mode === "numbered" ? "ol" : "ul";
  return <fieldset ref={container} className="admin-topic-editor" aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{label}</legend>
    <List>{list.items.map((text, index) => <li key={index}>
      <textarea id={`${id}-${index}`} aria-label={`${name} · Item ${index + 1}`} value={text} rows={2} maxLength={20000} onChange={(event) => update(changeTopic(list, index, event.target.value))} />
      <div className="admin-topic-actions">
        <button type="button" aria-label={`${name} · Mover item ${index + 1} para cima`} disabled={index === 0} onClick={() => update(arrangeTopics(list, "up", index), index - 1)}>↑</button>
        <button type="button" aria-label={`${name} · Mover item ${index + 1} para baixo`} disabled={index === list.items.length - 1} onClick={() => update(arrangeTopics(list, "down", index), index + 1)}>↓</button>
        <button type="button" aria-label={`${name} · Remover item ${index + 1}`} onClick={() => update(arrangeTopics(list, "remove", index), Math.max(0, index - 1))}>Remover</button>
      </div>
    </li>)}</List>
    <button type="button" onClick={() => update(arrangeTopics(list, "add"), list.items.length)}>Adicionar item</button>
    {error && <p id={`${id}-error`} className="admin-error" role="alert">{error}</p>}
  </fieldset>;
}
