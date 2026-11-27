import type { Service } from "./service-catalog";

export const vacationServiceId = "1doc-ferias-marcacao-e-alteracao";
export const tutorialSectionId = "tutorial";
export const originalTutorialVideo = "original";
export const tutorialVideoLimit = 25 * 1024 * 1024;

export function hasVacationTutorial(service: Pick<Service, "id">) {
  return service.id === vacationServiceId;
}

export function isUploadedTutorialVideo(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

export function tutorialVideoForService(service: Pick<Service, "id" | "directEdit">) {
  return hasVacationTutorial(service) ? service.directEdit?.fields.tutorialVideo ?? originalTutorialVideo : "";
}

export function tutorialVideoSrc(video: string) {
  return video === originalTutorialVideo || isUploadedTutorialVideo(video) ? `/api/service-tutorial/${video}` : undefined;
}

export function tutorialVideoLabel(video: string) {
  if (video === originalTutorialVideo) return "Vídeo original";
  return isUploadedTutorialVideo(video) ? `Vídeo enviado (${video.slice(0, 8)})` : "";
}
