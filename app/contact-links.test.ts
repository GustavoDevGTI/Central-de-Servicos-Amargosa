import assert from "node:assert/strict";
import test from "node:test";
import { whatsappHref } from "./contact-links.ts";

test("WhatsApp links accept the documented mobile number with a space after the ninth digit", () => {
  assert.equal(whatsappHref("(75) 9 8104-9490"), "https://wa.me/5575981049490");
  assert.equal(whatsappHref("(75) 3512-7811"), "https://wa.me/557535127811");
});
