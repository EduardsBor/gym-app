// Shim so the bundled @sentry/capacitor talks to the Capacitor runtime
// injected into the Android WebView, not a second copy of @capacitor/core.
'use strict';
const C = (typeof globalThis !== 'undefined' && globalThis.Capacitor) || {};
function registerPlugin(name, options) {
  return typeof C.registerPlugin === 'function' ? C.registerPlugin(name, options) : { name: name };
}
module.exports = { Capacitor: C, registerPlugin, Plugins: C.Plugins || {} };
