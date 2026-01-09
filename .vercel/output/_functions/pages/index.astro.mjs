import { e as createComponent, f as createAstro, r as renderTemplate, k as renderScript, l as renderHead, h as addAttribute } from '../chunks/astro/server_C8QuHruS.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/png" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="description" content="A QR Code for joining a HoloSpace-XR Lobby."><meta name="generator"', "><title>HSXR Join Code</title>", '</head> <body> <h1>Join Code</h1> <div id="qrcode"></div> <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script> ', " </body> </html>"])), addAttribute(Astro2.generator, "content"), renderHead(), renderScript($$result, "C:/Unity/NWDL/hsxr/src/pages/index.astro?astro&type=script&index=0&lang.ts"));
}, "C:/Unity/NWDL/hsxr/src/pages/index.astro", void 0);

const $$file = "C:/Unity/NWDL/hsxr/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
