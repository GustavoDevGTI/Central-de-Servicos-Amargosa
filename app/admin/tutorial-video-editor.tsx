import { useState } from "react";
import { tutorialVideoLabel } from "../service-tutorial";

export function TutorialVideoEditor({ value, disabled, uploading, onUpload, onRemove }: {
  value: string;
  disabled: boolean;
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  return <div className="admin-tutorial-video">
    <p role="status">{uploading ? "Enviando vídeo…" : tutorialVideoLabel(value) || "Nenhum vídeo selecionado."}</p>
    <div
      className={`admin-tutorial-drop${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length) onUpload(event.dataTransfer.files);
      }}
    >
      <label htmlFor="edit-tutorial-video">Arraste um vídeo aqui ou selecione um arquivo</label>
      <input id="edit-tutorial-video" type="file" accept="video/mp4,video/webm,.mp4,.webm" aria-describedby="tutorial-video-formats" disabled={disabled} onChange={(event) => {
        const files = event.currentTarget.files;
        if (files?.length) onUpload(files);
        event.currentTarget.value = "";
      }} />
      <small id="tutorial-video-formats">MP4 ou WebM, até 25 MB.</small>
    </div>
    {value && <button type="button" disabled={disabled} onClick={onRemove}>Remover vídeo</button>}
  </div>;
}
