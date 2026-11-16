'use strict';
// A-504: Sentry crash/error reporting for the Android (Capacitor) build only.
// The GitHub Pages site never initializes Sentry: start() requires Capacitor.isNativePlatform()
// and a DSN. The DSN is not in the repo; it is injected at Android build time into the
// gitignored www/sentry-config.js (see scripts/build-web.js and docs/ANDROID-BUILD.md).
// Funnel/analytics events are intentionally not sent in A-504 (later task, if approved).
(function (root) {
  const DSN_RE = /^https:\/\/[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\/\d+$/;

  function validateDsn(s) {
    s = String(s == null ? '' : s).trim();
    return DSN_RE.test(s) ? s : '';
  }

  function normEnv(s) {
    return s === 'production' ? 'production' : 'debug';
  }

  function makeConfigJs(cfg) {
    cfg = cfg && typeof cfg === 'object' ? cfg : {};
    return 'window.GC_SENTRY=' + JSON.stringify({
      dsn: validateDsn(cfg.dsn),
      environment: normEnv(cfg.environment),
      release: String(cfg.release == null ? '' : cfg.release)
    }) + ';\n';
  }

  function isNative(r) {
    r = r || root;
    try {
      const C = r && r.Capacitor;
      return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
    } catch (e) {
      return false;
    }
  }

  function readConfig(r) {
    r = r || root;
    const c = r && r.GC_SENTRY && typeof r.GC_SENTRY === 'object' ? r.GC_SENTRY : {};
    return { dsn: validateDsn(c.dsn), environment: normEnv(c.environment), release: String(c.release || '') };
  }

  function scrubUrl(u) {
    if (u == null || typeof u !== 'string') return u;
    const raw = u;
    try {
      const x = new URL(u, 'https://localhost');
      const host = x.hostname || '';
      if (/supabase\.co$/i.test(host) || /\.supabase\.co$/i.test(host) || /sentry\.io$/i.test(host) || /\.sentry\.io$/i.test(host)) {
        x.search = '';
        x.hash = '';
        return x.toString();
      }
      if (x.search && /token|sig(?:nature)?|sign|auth|apikey|key/i.test(x.search)) {
        x.search = '';
        return x.toString();
      }
      return u;
    } catch (e) {
      return raw.split('?')[0];
    }
  }

  function beforeBreadcrumb(b) {
    if (!b || typeof b !== 'object') return null;
    const cat = String(b.category || '');
    const type = String(b.type || '');
    if (cat === 'console' || type === 'console' || cat === 'ui.input') return null;
    if (cat === 'navigation' || type === 'navigation') {
      const d = b.data && typeof b.data === 'object' ? b.data : {};
      return { type: 'navigation', category: 'navigation', timestamp: b.timestamp, data: { from: d.from, to: d.to } };
    }
    const out = { type: b.type, category: b.category, timestamp: b.timestamp, message: b.message, level: b.level };
    if (b.data && typeof b.data === 'object') {
      const d = {};
      for (const k of Object.keys(b.data)) {
        if (k === 'body' || k === 'request_body' || k === 'response_body' || k === 'headers' || k === 'cookies' || k === 'data') continue;
        d[k] = k === 'url' || k === 'to' || k === 'from' ? scrubUrl(b.data[k]) : b.data[k];
      }
      out.data = d;
    }
    return out;
  }

  function beforeSend(event) {
    if (!event || typeof event !== 'object') return event;
    event.user = { ip_address: null };
    delete event.server_name;
    if (event.request && typeof event.request === 'object') {
      delete event.request.headers;
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.env;
      delete event.request.query_string;
      if (event.request.url) event.request.url = scrubUrl(event.request.url);
    }
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map(beforeBreadcrumb).filter(Boolean);
    }
    return event;
  }

  function integrationsFilter(ints) {
    return (Array.isArray(ints) ? ints : []).filter(i => {
      const n = String((i && i.name) || '');
      return !/Replay|Feedback|BrowserTracing|BrowserProfiling|HttpContext/i.test(n);
    });
  }

  function initOptions(cfg) {
    cfg = cfg && typeof cfg === 'object' ? cfg : {};
    return {
      dsn: validateDsn(cfg.dsn),
      release: String(cfg.release || ''),
      environment: normEnv(cfg.environment),
      sendDefaultPii: false,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false
      },
      tracesSampleRate: 0,
      profilesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      enableLogs: false,
      enableNative: true,
      enableNativeNagger: false,
      beforeSend: beforeSend,
      beforeBreadcrumb: beforeBreadcrumb,
      integrations: integrationsFilter
    };
  }

  function shouldInit(opts) {
    opts = opts && typeof opts === 'object' ? opts : {};
    const native = 'native' in opts ? !!opts.native : isNative(opts.root);
    return native && !!validateDsn(opts.dsn != null ? opts.dsn : (readConfig(opts.root).dsn));
  }

  function start(Sentry, env) {
    env = env && typeof env === 'object' ? env : {};
    const r = env.root || root;
    const native = 'native' in env ? !!env.native : isNative(r);
    const cfg = {
      dsn: env.dsn != null ? validateDsn(env.dsn) : readConfig(r).dsn,
      environment: env.environment != null ? normEnv(env.environment) : readConfig(r).environment,
      release: env.release != null ? String(env.release) : readConfig(r).release
    };
    if (!Sentry || typeof Sentry.init !== 'function') return false;
    if (!shouldInit({ native: native, dsn: cfg.dsn })) return false;
    Sentry.init(initOptions(cfg));
    if (cfg.environment === 'debug') {
      try {
        r.__gcSentryTestCrash = function () {
          setTimeout(function () { throw new Error('gc-sentry-test-crash'); }, 0);
        };
        if (typeof Sentry.nativeCrash === 'function') {
          r.__gcSentryTestNativeCrash = function () { Sentry.nativeCrash(); };
        }
      } catch (e) {}
    }
    return true;
  }

  const api = {
    validateDsn, makeConfigJs, isNative, readConfig, scrubUrl,
    beforeSend, beforeBreadcrumb, integrationsFilter, initOptions, shouldInit, start
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.GC_SENTRY_LIB = api;
  try { start(root.Sentry, { root: root }); } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
