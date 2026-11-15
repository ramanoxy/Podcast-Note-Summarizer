import { shallowReactive, reactive, effectScope, getCurrentScope, hasInjectionContext, getCurrentInstance, inject, toRef, computed, defineComponent, h, isReadonly, isRef, isShallow, isReactive, toRaw, ref, watch, mergeProps, unref, useSSRContext, nextTick, defineAsyncComponent, provide, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, createApp } from "vue";
import { $fetch } from "D:/Project/note-resume/node_modules/ofetch/dist/node.mjs";
import { baseURL } from "#internal/nuxt/paths";
import { createHooks } from "D:/Project/note-resume/node_modules/hookable/dist/index.mjs";
import { getContext } from "D:/Project/note-resume/node_modules/unctx/dist/index.mjs";
import { sanitizeStatusCode, createError as createError$1 } from "D:/Project/note-resume/node_modules/h3/dist/index.mjs";
import { hasProtocol, joinURL, withQuery, parseURL, encodePath, decodePath, isScriptProtocol, isEqual, stringifyParsedURL, stringifyQuery, parseQuery } from "D:/Project/note-resume/node_modules/ufo/dist/index.mjs";
import { defu } from "D:/Project/note-resume/node_modules/defu/dist/defu.mjs";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderStyle, ssrIncludeBooleanAttr, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from "vue/server-renderer";
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const nuxtDefaultErrorValue = null;
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.21.11";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    const unresolvedPluginsForThisPlugin = plugin.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.add(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
import.meta.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
function isScopeWithinInstance(instance) {
  const instanceScope = instance.scope;
  let scope = getCurrentScope();
  while (scope) {
    if (scope === instanceScope) {
      return true;
    }
    scope = scope.parent;
  }
  return false;
}
const useRoute = () => {
  if (hasInjectionContext()) {
    const instance = getCurrentInstance();
    if (!instance || isScopeWithinInstance(instance)) {
      return inject(PageRouteSymbol, useNuxtApp()._route);
    }
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const HTML_ATTR_UNSAFE_RE = /[&"'<>]/g;
const HTML_ATTR_ENCODE_MAP = {
  "&": "%26",
  '"': "%22",
  "'": "%27",
  "<": "%3C",
  ">": "%3E"
};
function encodeForHtmlAttr(value) {
  return value.replace(HTML_ATTR_UNSAFE_RE, (c) => HTML_ATTR_ENCODE_MAP[c]);
}
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedHeader = encodeURL(location2, isExternalHost);
        const encodedLoc = encodeForHtmlAttr(encodedHeader);
        nuxtApp.ssrContext["~renderResponse"] = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
  return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    const pathname = url.pathname.replace(/^\/{2,}/, "/");
    return pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
function encodeRoutePath(url) {
  const parsed = parseURL(url);
  return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const clearError = async (options = {}) => {
  const nuxtApp = useNuxtApp();
  const error = /* @__PURE__ */ useError();
  nuxtApp.callHook("app:error:cleared", options);
  if (options.redirect) {
    await useRouter().replace(options.redirect);
  }
  error.value = nuxtDefaultErrorValue;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  if (typeof error !== "string" && error.statusText) {
    error.message ??= error.statusText;
  }
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  Object.defineProperty(nuxtError, "status", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusCode,
    configurable: true
  });
  Object.defineProperty(nuxtError, "statusText", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusMessage,
    configurable: true
  });
  return nuxtError;
};
function freezeHead(head) {
  const realPush = head.push;
  head.push = () => ({ dispose: () => {
  }, patch: () => {
  }, _poll: () => {
  } });
  return () => {
    head.push = realPush;
  };
}
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    if (nuxtApp.ssrContext.islandContext) {
      const unfreeze = freezeHead(head);
      nuxtApp.hooks.hookOnce("app:created", unfreeze);
    }
    nuxtApp.vueApp.use(head);
  }
});
const routerOptions = {};
const sensitiveMatcher = (m, p) => {
  return [];
};
const foldedMatcher = sensitiveMatcher;
const decodeRoutePath = function decodeRoutePath2(path) {
  if (!path.includes("%")) return path;
  const queryIndex = path.indexOf("?");
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  try {
    return queryIndex === -1 ? decodeURI(pathname) : decodeURI(pathname) + path.slice(queryIndex);
  } catch {
    return path;
  }
};
const normalizePath = (path, fold) => {
  if (typeof path !== "string") {
    return path;
  }
  const decoded = decodeRoutePath(path);
  return fold ? decoded.toLowerCase() : decoded;
};
const _routeRulesMatcher = (path) => routerOptions.sensitive ? defu({}, ...sensitiveMatcher("", normalizePath(path, false)).map((r) => r.data).reverse()) : defu({}, ...foldedMatcher("", normalizePath(path, true)).map((r) => r.data).reverse());
const routeRulesMatcher = _routeRulesMatcher;
function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  try {
    return routeRulesMatcher(path);
  } catch (e) {
    console.error("[nuxt] Error matching route rules.", e);
    return {};
  }
}
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  const route = fullPath && typeof fullPath === "object" ? fullPath : {};
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: route.params || {},
    name: void 0,
    matched: route.matched || [],
    redirectedFrom: void 0,
    meta: route.meta || {},
    href: fullPath
  };
}
const router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => {
        const index = hooks[hook].indexOf(guard);
        if (index !== -1) {
          hooks[hook].splice(index, 1);
        }
      };
    };
    const baseURL2 = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    let navigationCounter = 0;
    async function handleNavigation(url, replace) {
      const navigationId = ++navigationCounter;
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (navigationId !== navigationCounter) {
            return;
          }
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return await handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
          if (navigationId !== navigationCounter) {
            return;
          }
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url, false),
      replace: (url) => handleNavigation(url, true),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          const route2 = router.resolve(props.to);
          return props.custom ? slots.default?.({ href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    const initialLayoutProps = nuxtApp.payload.state._layoutProps;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
          to.meta.layoutProps = initialLayoutProps;
        }
        nuxtApp._processingMiddleware = true;
        {
          nuxtApp._middlewareTo = to;
        }
        if (!nuxtApp.ssrContext?.islandContext) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          const routeRules = getRouteRules({ path: to.path });
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              const guard = nuxtApp._middleware.named[key];
              if (!guard) {
                continue;
              }
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(guard);
              } else {
                middlewareEntries.delete(guard);
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  status: 404,
                  statusText: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                delete nuxtApp._middlewareTo;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
        {
          delete nuxtApp._middlewareTo;
        }
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4
];
function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedOrShortsMatch = trimmed.match(/youtube\.com\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
  if (embedOrShortsMatch) return embedOrShortsMatch[1];
  return null;
}
const pastSessions = ref([]);
const currentSession = ref({
  id: "",
  videoUrl: "",
  videoId: "",
  title: "",
  notes: "",
  updatedAt: Date.now()
});
const undoStack = ref([]);
let saveTimeout = null;
function useSessions() {
  function createNewSession() {
    const newId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    currentSession.value = {
      id: newId,
      videoUrl: "",
      videoId: "",
      title: "Catatan Baru Tanpa Judul",
      notes: "",
      updatedAt: Date.now()
    };
    undoStack.value = [];
  }
  function saveCurrentSession(immediate = false) {
    if (!currentSession.value.id) {
      currentSession.value.id = "session_" + Date.now();
    }
    currentSession.value.updatedAt = Date.now();
    if (!currentSession.value.videoId && currentSession.value.videoUrl) {
      currentSession.value.videoId = extractYouTubeId(currentSession.value.videoUrl) || "";
    }
    const idx = pastSessions.value.findIndex((s) => s.id === currentSession.value.id);
    if (idx >= 0) {
      pastSessions.value[idx] = { ...currentSession.value };
    } else {
      pastSessions.value.unshift({ ...currentSession.value });
    }
    if (immediate) {
      if (saveTimeout) clearTimeout(saveTimeout);
    } else {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
      }, 300);
    }
  }
  function loadSession(id) {
    const found = pastSessions.value.find((s) => s.id === id);
    if (found) {
      currentSession.value = { ...found };
      undoStack.value = [];
    }
  }
  function deleteSession(id) {
    pastSessions.value = pastSessions.value.filter((s) => s.id !== id);
    if (currentSession.value.id === id) {
      createNewSession();
    }
  }
  function updateNotesWithSnapshot(newNotes) {
    undoStack.value.push(currentSession.value.notes);
    currentSession.value.notes = newNotes;
    saveCurrentSession(true);
  }
  function undoLastRefinement() {
    if (undoStack.value.length > 0) {
      const prev = undoStack.value.pop();
      currentSession.value.notes = prev;
      saveCurrentSession(true);
    }
  }
  const canUndo = computed(() => undoStack.value.length > 0);
  return {
    currentSession,
    pastSessions,
    saveCurrentSession,
    loadSession,
    deleteSession,
    createNewSession,
    updateNotesWithSnapshot,
    undoLastRefinement,
    canUndo
  };
}
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "AppHeader",
  __ssrInlineRender: true,
  emits: ["toggle-history"],
  setup(__props, { emit: __emit }) {
    const { currentSession: currentSession2, pastSessions: pastSessions2 } = useSessions();
    const inputUrl = ref(currentSession2.value.videoUrl || "");
    watch(() => currentSession2.value.videoUrl, (newUrl) => {
      inputUrl.value = newUrl || "";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "border-b border-monomax-800 bg-black text-monomax-100 font-mono text-xs select-none sticky top-0 z-40" }, _attrs))}><div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"><div class="flex items-center space-x-3"><button type="button" class="px-2.5 py-1.5 border border-monomax-700 bg-monomax-900 text-white hover:bg-white hover:text-black transition-colors flex items-center space-x-2 text-[11px] font-bold" title="Buka daftar riwayat sesi catatan"><span class="inline-block w-3 h-0.5 bg-current"></span><span>HISTORY [${ssrInterpolate(unref(pastSessions2).length)}]</span></button><div class="flex items-center space-x-2"><span class="font-bold text-white tracking-widest text-sm">SYNTH</span><span class="text-monomax-600">//</span><span class="text-[10px] text-monomax-400 tracking-wider hidden sm:inline-block">PODCAST ACTIVE NOTE</span></div></div><form class="flex-1 max-w-xl flex items-center min-w-[280px]"><div class="relative flex-1 flex items-center"><span class="absolute left-2.5 text-monomax-600 text-[10px]">URL:</span><input${ssrRenderAttr("value", inputUrl.value)} type="text" placeholder="Tempel link video YouTube (cth: https://youtu.be/...)" class="w-full pl-12 pr-3 py-1.5 bg-monomax-950 border border-monomax-800 text-white placeholder-monomax-600 text-xs font-mono outline-none focus:border-white transition-colors"></div><button type="submit" class="px-3 py-1.5 bg-white text-black font-bold border border-white hover:bg-monomax-200 transition-colors text-[11px] uppercase tracking-wider shrink-0"> LOAD VIDEO </button></form><div class="flex items-center space-x-2"><button type="button" class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors text-[11px] uppercase" title="Buat sesi catatan baru"> + NEW NOTE </button><div class="hidden lg:flex items-center space-x-1.5 text-[10px] text-monomax-500 border border-monomax-900 px-2 py-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span><span>AUTOSAVE ON</span></div></div></div></header>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppHeader.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "HistoryDrawer",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const { pastSessions: pastSessions2, currentSession: currentSession2 } = useSessions();
    function formatDate(timestamp) {
      if (!timestamp) return "-";
      const d = new Date(timestamp);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (__props.isOpen) {
        _push(`<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([
        "fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-monomax-950 border-r border-monomax-800 z-50 flex flex-col font-mono text-xs transition-transform duration-200 ease-out shadow-2xl",
        __props.isOpen ? "translate-x-0" : "-translate-x-full"
      ])}"><div class="p-4 border-b border-monomax-800 flex items-center justify-between bg-black"><div class="flex items-center space-x-2"><span class="font-bold text-white tracking-wider uppercase text-sm">RIWAYAT CATATAN</span><span class="text-monomax-500 text-[10px]">(${ssrInterpolate(unref(pastSessions2).length)})</span></div><button type="button" class="p-1 border border-monomax-800 text-monomax-400 hover:text-white hover:border-white transition-colors"> [ESC / X] </button></div><div class="flex-1 overflow-y-auto divide-y divide-monomax-850 p-2 space-y-2">`);
      if (unref(pastSessions2).length === 0) {
        _push(`<div class="p-8 text-center text-monomax-600 font-sans text-xs"> Belum ada riwayat sesi yang tersimpan. Catatanmu akan otomatis disimpan saat kamu mengetik. </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(pastSessions2), (session) => {
        _push(`<div class="${ssrRenderClass([
          "p-3 border transition-colors cursor-pointer flex flex-col space-y-2 group",
          unref(currentSession2).id === session.id ? "border-white bg-monomax-900" : "border-monomax-850 bg-black hover:border-monomax-700"
        ])}"><div class="flex items-start space-x-3"><div class="w-16 h-10 bg-monomax-900 border border-monomax-800 overflow-hidden shrink-0 relative">`);
        if (session.videoId) {
          _push(`<img${ssrRenderAttr("src", `https://img.youtube.com/vi/${session.videoId}/mqdefault.jpg`)} alt="Thumbnail" class="w-full h-full object-cover filter grayscale contrast-125">`);
        } else {
          _push(`<div class="w-full h-full flex items-center justify-center text-[9px] text-monomax-600"> NO IMG </div>`);
        }
        _push(`</div><div class="flex-1 min-w-0"><h4 class="font-bold text-white text-[11px] truncate leading-tight group-hover:underline">${ssrInterpolate(session.title || "Catatan Tanpa Judul")}</h4><p class="text-[10px] text-monomax-500 mt-1">${ssrInterpolate(formatDate(session.updatedAt))}</p></div></div><p class="text-[10px] text-monomax-400 font-sans line-clamp-2 bg-monomax-950 p-1.5 border border-monomax-900">${ssrInterpolate(session.notes ? session.notes.substring(0, 120) : "(Belum ada teks catatan)")}</p><div class="flex items-center justify-between pt-1 text-[10px]">`);
        if (unref(currentSession2).id === session.id) {
          _push(`<span class="text-white font-bold flex items-center space-x-1"><span class="w-1.5 h-1.5 bg-white rounded-full"></span><span>SEDANG AKTIF</span></span>`);
        } else {
          _push(`<span class="text-monomax-600">KLIK UNTUK BUKA</span>`);
        }
        _push(`<button type="button" class="text-monomax-600 hover:text-white transition-colors" title="Hapus sesi ini"> [HAPUS] </button></div></div>`);
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/HistoryDrawer.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false);
const playbackRate = ref(1);
const seekTarget = ref(null);
let seekEventCounter = 0;
const playToggleTrigger = ref(0);
function usePlayer() {
  function seekTo(seconds) {
    const safeSeconds = Math.max(0, seconds);
    currentTime.value = safeSeconds;
    seekEventCounter++;
    seekTarget.value = {
      seconds: safeSeconds,
      id: seekEventCounter
    };
  }
  function skipSeconds(delta) {
    const newTime = Math.max(0, currentTime.value + delta);
    seekTo(newTime);
  }
  function togglePlay() {
    playToggleTrigger.value++;
  }
  function setPlaybackRate(rate) {
    playbackRate.value = rate;
  }
  function setPlayingState(playing) {
    isPlaying.value = playing;
  }
  function setCurrentTime(time) {
    currentTime.value = time;
  }
  function setDuration(dur) {
    duration.value = dur;
  }
  return {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    seekTarget,
    playToggleTrigger,
    seekTo,
    skipSeconds,
    togglePlay,
    setPlaybackRate,
    setPlayingState,
    setCurrentTime,
    setDuration
  };
}
function parseTimestampToSeconds(ts) {
  if (!ts) return 0;
  const clean = ts.replace(/[\[\]]/g, "").trim();
  const parts = clean.split(":").map((part) => parseInt(part, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}
function formatSecondsToTimestamp(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor(total % 3600 / 60);
  const secs = total % 60;
  const pad = (num) => num.toString().padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}
function extractTimestamps(text) {
  if (!text) return [];
  const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
  const results = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      raw: match[0],
      seconds: parseTimestampToSeconds(match[1]),
      index: match.index
    });
  }
  return results;
}
function replaceTimestampsWithBadges(markdown) {
  if (!markdown) return "";
  return markdown.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, (match, timeStr) => {
    const seconds = parseTimestampToSeconds(timeStr);
    return `<button type="button" class="timestamp-badge inline-flex items-center px-1.5 py-0.5 my-0.5 rounded font-mono text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer mr-1" data-timestamp="${seconds}">[${timeStr}]</button>`;
  });
}
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "YouTubePlayer",
  __ssrInlineRender: true,
  props: {
    videoId: {}
  },
  setup(__props) {
    const props = __props;
    const playerStore = usePlayer();
    const { currentTime: currentTime2, duration: duration2, isPlaying: isPlaying2, playbackRate: playbackRate2, seekTarget: seekTarget2, playToggleTrigger: playToggleTrigger2 } = playerStore;
    const formattedCurrentTime = computed(() => formatSecondsToTimestamp(currentTime2.value));
    const formattedDuration = computed(() => formatSecondsToTimestamp(duration2.value));
    async function createPlayer() {
      if (!props.videoId || true) return;
    }
    watch(seekTarget2, (target) => {
    });
    watch(playToggleTrigger2, () => {
    });
    watch(() => props.videoId, async (newId) => {
      if (newId) {
        await nextTick();
        createPlayer();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col h-full bg-monomax-900 border border-monomax-800 rounded-none overflow-hidden font-mono" }, _attrs))}><div class="flex items-center justify-between px-3 py-2 bg-monomax-950 border-b border-monomax-800 text-xs"><div class="flex items-center space-x-2"><span class="${ssrRenderClass([unref(isPlaying2) ? "bg-white animate-pulse" : "bg-monomax-600", "inline-block w-2 h-2 rounded-full"])}"></span><span class="text-monomax-400 uppercase tracking-widest text-[10px]">VIDEO SOURCE</span>`);
      if (__props.videoId) {
        _push(`<span class="text-monomax-200">ID: ${ssrInterpolate(__props.videoId)}</span>`);
      } else {
        _push(`<span class="text-monomax-600">NO MEDIA LOADED</span>`);
      }
      _push(`</div><div class="flex items-center space-x-3 text-xs"><span class="text-white font-bold">${ssrInterpolate(formattedCurrentTime.value)}</span><span class="text-monomax-600">/</span><span class="text-monomax-400">${ssrInterpolate(formattedDuration.value)}</span></div></div><div class="relative flex-1 bg-black flex items-center justify-center min-h-[240px] md:min-h-[320px]"><div class="w-full h-full" style="${ssrRenderStyle(__props.videoId ? null : { display: "none" })}"><div id="youtube-iframe-container" class="w-full h-full"></div></div>`);
      if (!__props.videoId) {
        _push(`<div class="flex flex-col items-center justify-center text-center p-8 max-w-sm"><div class="w-12 h-12 border border-monomax-700 flex items-center justify-center mb-4 text-monomax-400"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><p class="text-xs uppercase tracking-wider text-monomax-300 mb-2 font-bold">READY TO LISTEN</p><p class="text-[11px] text-monomax-600 leading-relaxed font-sans"> Tempelkan link video YouTube podcast di header atas untuk memulai sesi menyimak dan mencatat. </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-3 bg-monomax-950 border-t border-monomax-800 flex flex-wrap items-center justify-between gap-3 text-xs"><div class="flex items-center space-x-2"><button type="button"${ssrIncludeBooleanAttr(!__props.videoId) ? " disabled" : ""} class="px-3 py-1.5 border border-monomax-700 bg-monomax-900 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase text-[11px] font-bold tracking-wider">${ssrInterpolate(unref(isPlaying2) ? "PAUSE [ALT+SPACE]" : "PLAY [ALT+SPACE]")}</button><button type="button"${ssrIncludeBooleanAttr(!__props.videoId) ? " disabled" : ""} class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-[11px]" title="Mundur 5 detik (Alt + ArrowLeft)"> -5s </button><button type="button"${ssrIncludeBooleanAttr(!__props.videoId) ? " disabled" : ""} class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-[11px]" title="Maju 5 detik (Alt + ArrowRight)"> +5s </button></div><div class="flex items-center space-x-1"><span class="text-[10px] text-monomax-500 uppercase mr-1">SPEED</span><!--[-->`);
      ssrRenderList([0.75, 1, 1.25, 1.5, 2], (rate) => {
        _push(`<button type="button"${ssrIncludeBooleanAttr(!__props.videoId) ? " disabled" : ""} class="${ssrRenderClass([
          "px-1.5 py-0.5 border text-[10px] transition-colors",
          unref(playbackRate2) === rate ? "border-white bg-white text-black font-bold" : "border-monomax-800 text-monomax-400 hover:border-monomax-600"
        ])}">${ssrInterpolate(rate)}x </button>`);
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/YouTubePlayer.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "MarkdownPreview",
  __ssrInlineRender: true,
  props: {
    markdown: {}
  },
  setup(__props) {
    const props = __props;
    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function parseInlineMarkdown(text) {
      return text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-monomax-800 text-white rounded font-mono text-[11px]">$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>').replace(/\*([^*]+)\*/g, '<em class="italic text-monomax-300">$1</em>');
    }
    const renderedHtml = computed(() => {
      if (!props.markdown) {
        return '<p class="text-monomax-600 italic">Belum ada catatan. Mulai ketik catatan atau tekan shortcut Ctrl+T untuk menyisipkan waktu video.</p>';
      }
      const lines = props.markdown.split("\n");
      const htmlLines = [];
      let inList = false;
      for (const rawLine of lines) {
        let line = escapeHtml(rawLine);
        if (line.startsWith("### ")) {
          if (inList) {
            htmlLines.push("</ul>");
            inList = false;
          }
          htmlLines.push(`<h4 class="text-xs uppercase tracking-wider font-bold text-monomax-200 mt-4 mb-2 font-mono">${parseInlineMarkdown(line.substring(4))}</h4>`);
          continue;
        }
        if (line.startsWith("## ")) {
          if (inList) {
            htmlLines.push("</ul>");
            inList = false;
          }
          htmlLines.push(`<h3 class="text-sm font-bold text-white mt-6 mb-3 font-mono border-b border-monomax-800 pb-1">${parseInlineMarkdown(line.substring(3))}</h3>`);
          continue;
        }
        if (line.startsWith("# ")) {
          if (inList) {
            htmlLines.push("</ul>");
            inList = false;
          }
          htmlLines.push(`<h2 class="text-base font-bold text-white mt-6 mb-3 font-mono">${parseInlineMarkdown(line.substring(2))}</h2>`);
          continue;
        }
        if (line.startsWith("&gt; ")) {
          if (inList) {
            htmlLines.push("</ul>");
            inList = false;
          }
          htmlLines.push(`<blockquote class="border-l-2 border-white pl-3 text-monomax-300 italic my-2">${parseInlineMarkdown(line.substring(5))}</blockquote>`);
          continue;
        }
        if (line.match(/^[-*•]\s+/)) {
          if (!inList) {
            htmlLines.push('<ul class="space-y-1.5 my-2">');
            inList = true;
          }
          const itemText = line.replace(/^[-*•]\s+/, "");
          htmlLines.push(`<li class="text-monomax-200">${parseInlineMarkdown(itemText)}</li>`);
          continue;
        }
        if (inList) {
          htmlLines.push("</ul>");
          inList = false;
        }
        if (!line.trim()) {
          htmlLines.push('<div class="h-2"></div>');
        } else {
          htmlLines.push(`<p class="my-1 text-monomax-200">${parseInlineMarkdown(line)}</p>`);
        }
      }
      if (inList) {
        htmlLines.push("</ul>");
      }
      const rawHtml = htmlLines.join("\n");
      return replaceTimestampsWithBadges(rawHtml);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "prose prose-invert prose-zinc max-w-none font-sans text-xs leading-relaxed overflow-y-auto p-4 select-text" }, _attrs))}>${renderedHtml.value ?? ""}</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MarkdownPreview.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "NotesEditor",
  __ssrInlineRender: true,
  setup(__props) {
    const { currentSession: currentSession2, canUndo, saveCurrentSession } = useSessions();
    ref(null);
    const viewMode = ref("edit");
    const isRefining = ref(false);
    const copyStatus = ref(false);
    const alertMessage = ref("");
    const notesContent = computed({
      get: () => currentSession2.value.notes || "",
      set: (val) => {
        currentSession2.value.notes = val;
        saveCurrentSession();
      }
    });
    const wordCount = computed(() => {
      const text = notesContent.value.trim();
      return text ? text.split(/\s+/).length : 0;
    });
    const timestampCount = computed(() => {
      return extractTimestamps(notesContent.value).length;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col h-full bg-monomax-900 border border-monomax-800 rounded-none overflow-hidden font-mono" }, _attrs))}><div class="flex flex-wrap items-center justify-between p-2.5 bg-monomax-950 border-b border-monomax-800 gap-2 text-xs"><div class="flex items-center space-x-2"><button type="button" class="px-2.5 py-1.5 bg-white text-black border border-white font-bold hover:bg-monomax-200 transition-colors flex items-center space-x-1.5 text-[11px] uppercase tracking-wider" title="Sisipkan penanda waktu video saat ini (Ctrl + T)"><span class="inline-block w-1.5 h-1.5 bg-black rounded-full"></span><span>+ TIMESTAMP [Ctrl+T]</span></button><button type="button"${ssrIncludeBooleanAttr(isRefining.value || !notesContent.value.trim()) ? " disabled" : ""} class="px-2.5 py-1.5 bg-monomax-900 text-white border border-monomax-700 hover:border-white transition-colors flex items-center space-x-1.5 text-[11px] uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none">`);
      if (isRefining.value) {
        _push(`<span class="animate-spin inline-block">/</span>`);
      } else {
        _push(`<span>✨</span>`);
      }
      _push(`<span>${ssrInterpolate(isRefining.value ? "MEMPROSES..." : "RAPIKAN DENGAN AI")}</span></button>`);
      if (unref(canUndo)) {
        _push(`<button type="button" class="px-2 py-1.5 border border-monomax-700 text-monomax-300 hover:text-white hover:border-white transition-colors text-[10px] uppercase" title="Kembalikan ke catatan sebelum AI"> ↺ UNDO AI </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center space-x-2"><div class="flex border border-monomax-800 p-0.5 bg-black text-[10px]"><button type="button" class="${ssrRenderClass([
        "px-2 py-1 transition-colors uppercase",
        viewMode.value === "edit" ? "bg-monomax-800 text-white font-bold" : "text-monomax-400 hover:text-monomax-200"
      ])}"> EDIT </button><button type="button" class="${ssrRenderClass([
        "px-2 py-1 transition-colors uppercase",
        viewMode.value === "preview" ? "bg-monomax-800 text-white font-bold" : "text-monomax-400 hover:text-monomax-200"
      ])}"> PREVIEW </button><button type="button" class="${ssrRenderClass([
        "px-2 py-1 transition-colors uppercase hidden md:inline-block",
        viewMode.value === "split" ? "bg-monomax-800 text-white font-bold" : "text-monomax-400 hover:text-monomax-200"
      ])}"> SPLIT </button></div><button type="button" class="px-2 py-1.5 border border-monomax-800 text-monomax-300 hover:text-white hover:border-white transition-colors text-[11px] uppercase tracking-wider" title="Salin semua catatan ke clipboard">${ssrInterpolate(copyStatus.value ? "COPIED!" : "COPY")}</button><button type="button" class="px-2 py-1.5 border border-monomax-800 text-monomax-300 hover:text-white hover:border-white transition-colors text-[11px] uppercase tracking-wider" title="Unduh catatan sebagai file .md"> EXPORT .MD </button></div></div>`);
      if (alertMessage.value) {
        _push(`<div class="px-3 py-1.5 bg-monomax-850 border-b border-monomax-700 text-monomax-200 text-xs flex items-center justify-between"><span>${ssrInterpolate(alertMessage.value)}</span><button class="text-monomax-500 hover:text-white">×</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex-1 relative flex overflow-hidden"><div class="${ssrRenderClass(["h-full flex flex-col", viewMode.value === "split" ? "w-1/2 border-r border-monomax-800" : "w-full"])}" style="${ssrRenderStyle(viewMode.value === "edit" || viewMode.value === "split" ? null : { display: "none" })}"><textarea placeholder="Mulai ketik rangkuman atau catatan dari podcast di sini...

Gunakan shortcut:
- Ctrl+T : Sisipkan waktu video [mm:ss]
- Alt+Space : Play/Pause video
- Alt+Left/Right : Mundur/Maju 5 detik" class="flex-1 w-full h-full p-4 bg-transparent text-monomax-100 placeholder-monomax-700 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-white selection:text-black">${ssrInterpolate(notesContent.value)}</textarea></div><div class="${ssrRenderClass(["h-full overflow-y-auto bg-black", viewMode.value === "split" ? "w-1/2" : "w-full"])}" style="${ssrRenderStyle(viewMode.value === "preview" || viewMode.value === "split" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_sfc_main$4, { markdown: notesContent.value }, null, _parent));
      _push(`</div></div><div class="px-3 py-1.5 bg-monomax-950 border-t border-monomax-800 flex items-center justify-between text-[10px] text-monomax-500"><div class="flex items-center space-x-3"><span>WORDS: ${ssrInterpolate(wordCount.value)}</span><span>TIMESTAMPS: ${ssrInterpolate(timestampCount.value)}</span></div><div><span>AUTO-SAVED IN LOCAL STORAGE</span></div></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/NotesEditor.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const isHistoryOpen = ref(false);
    const { currentSession: currentSession2 } = useSessions();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-black text-monomax-100 flex flex-col font-sans selection:bg-white selection:text-black grid-bg" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$7, {
        onToggleHistory: ($event) => isHistoryOpen.value = !isHistoryOpen.value
      }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$6, {
        "is-open": isHistoryOpen.value,
        onClose: ($event) => isHistoryOpen.value = false
      }, null, _parent));
      _push(`<main class="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col"><div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full min-h-[calc(100vh-120px)]"><section class="h-[360px] lg:h-full flex flex-col">`);
      _push(ssrRenderComponent(_sfc_main$5, {
        "video-id": unref(currentSession2).videoId
      }, null, _parent));
      _push(`</section><section class="h-[520px] lg:h-full flex flex-col">`);
      _push(ssrRenderComponent(_sfc_main$3, null, null, _parent));
      _push(`</section></div></main><footer class="border-t border-monomax-800 bg-monomax-950 px-4 py-2 font-mono text-[10px] text-monomax-500 flex flex-wrap items-center justify-between gap-2 select-none"><div class="flex items-center space-x-4"><span class="text-white font-bold tracking-widest">SYNTH v1.0</span><span class="text-monomax-600">//</span><span>ACTIVE NOTE-TAKING &amp; AI COMPANION</span></div><div class="flex items-center space-x-3 text-monomax-400"><span>[Ctrl+T]: Timestamp</span><span>•</span><span>[Alt+Space]: Play/Pause</span><span>•</span><span>[Alt+←/→]: ±5s</span></div></footer></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    const status = Number(_error.statusCode || 500);
    const is404 = status === 404;
    const statusText = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import("./_nuxt/error-404-Bxh9vG2T.js"));
    const _Error = defineAsyncComponent(() => import("./_nuxt/error-500-kVM69fOP.js"));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ status: unref(status), statusText: unref(statusText), statusCode: unref(status), statusMessage: unref(statusText), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup", []);
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    function invokeAppErrorHandler(err, target, info) {
      const errorHandler = nuxtApp.vueApp.config.errorHandler;
      if (errorHandler && !errorHandler.__nuxt_default) {
        try {
          errorHandler(err, target, info);
        } catch (handlerError) {
          console.error("[nuxt] Error in `app.config.errorHandler`", handlerError);
        }
      }
    }
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        invokeAppErrorHandler(err, target, info);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = ((ssrContext) => entry(ssrContext));
export {
  useNuxtApp as a,
  useRuntimeConfig as b,
  nuxtLinkDefaults as c,
  entry_default as default,
  encodeRoutePath as e,
  navigateTo as n,
  resolveRouteObject as r,
  tryUseNuxtApp as t,
  useRouter as u
};
//# sourceMappingURL=server.mjs.map
