import { isPendingServiceValue, serviceDisplayValue } from "./service-presentation";

/** Source text stays literal; only missing main-field answers receive the visual notice. */
export function serviceValue(value: string | undefined | null, column?: string) {
  return isPendingServiceValue(value)
    ? <em className="service-pending-information">{serviceDisplayValue(value, column)}</em>
    : value;
}
