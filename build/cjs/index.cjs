globalThis.nodeRequire = require;(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'] = {__FARM_TARGET_ENV__: 'node'};function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}function __commonJs(mod) {
  var module;
  return () => {
    if (module) {
      return module.exports;
    }
    module = {
      exports: {},
    };
    if(typeof mod === "function") {
      mod(module, module.exports);
    }else {
      mod[Object.keys(mod)[0]](module, module.exports);
    }
    return module.exports;
  };
}const __global_this__ = typeof globalThis !== 'undefined' ? globalThis : window;
var index_ts_default = {
    name: 'farm-runtime-import-meta',
    _moduleSystem: {},
    bootstrap (system) {
        this._moduleSystem = system;
    },
    moduleCreated (module) {
        module.meta.env = {
            ...{
                "FARM_FORMAT": "cjs",
                "NODE_ENV": "production",
                "mode": "production"
            } ?? {},
            dev: process.env.NODE_ENV === 'development',
            prod: process.env.NODE_ENV === 'production'
        };
        const publicPath = this._moduleSystem.publicPaths?.[0] || '';
        const { location } = __global_this__;
        const url = location ? `${location.protocol}//${location.host}${publicPath.replace(/\/$/, '')}/${module.id}?t=${Date.now()}` : module.resource_pot;
        module.meta.url = url;
    }
};

class Module {
    id;
    exports;
    resource_pot;
    meta;
    require;
    constructor(id, require){
        this.id = id;
        this.exports = {};
        this.meta = {
            env: {}
        };
        this.require = require;
    }
}

class FarmRuntimePluginContainer {
    plugins = [];
    constructor(plugins){
        this.plugins = plugins;
    }
    hookSerial(hookName, ...args) {
        for (const plugin of this.plugins){
            const hook = plugin[hookName];
            if (hook) {
                hook.apply(plugin, args);
            }
        }
    }
    hookBail(hookName, ...args) {
        for (const plugin$1 of this.plugins){
            const hook$1 = plugin$1[hookName];
            if (hook$1) {
                const result = hook$1.apply(plugin$1, args);
                if (result) {
                    return result;
                }
            }
        }
    }
}

const __farm_global_this__ = (globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'];
const targetEnv = __farm_global_this__.__FARM_TARGET_ENV__ || 'node';
const isBrowser = targetEnv === 'browser' && (globalThis || window).document;
class ResourceLoader {
    moduleSystem;
    _loadedResources;
    _loadingResources;
    publicPaths;
    constructor(moduleSystem, publicPaths){
        this.moduleSystem = moduleSystem;
        this._loadedResources = {};
        this._loadingResources = {};
        this.publicPaths = publicPaths;
    }
    load(resource, index = 0) {
        if (!isBrowser) {
            const result$1 = this.moduleSystem.pluginContainer.hookBail('loadResource', resource);
            if (result$1) {
                return result$1.then((res)=>{
                    if (!res.success && res.retryWithDefaultResourceLoader) {
                        if (resource.type === 'script') {
                            return this._loadScript(`./${resource.path}`);
                        } else if (resource.type === 'link') {
                            return this._loadLink(`./${resource.path}`);
                        }
                    } else if (!res.success) {
                        throw new Error(`[Farm] Failed to load resource: "${resource.path}, type: ${resource.type}". Original Error: ${res.err}`);
                    }
                });
            } else {
                if (resource.type === 'script') {
                    return this._loadScript(`./${resource.path}`);
                } else if (resource.type === 'link') {
                    return this._loadLink(`./${resource.path}`);
                }
            }
        }
        const publicPath = this.publicPaths[index];
        const url = `${publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath}/${resource.path}`;
        if (this._loadedResources[resource.path]) {
            return;
        } else if (this._loadingResources[resource.path]) {
            return this._loadingResources[resource.path];
        }
        const result$2 = this.moduleSystem.pluginContainer.hookBail('loadResource', resource);
        if (result$2) {
            return result$2.then((res)=>{
                if (res.success) {
                    this.setLoadedResource(resource.path);
                } else if (res.retryWithDefaultResourceLoader) {
                    return this._load(url, resource, index);
                } else {
                    throw new Error(`[Farm] Failed to load resource: "${resource.path}, type: ${resource.type}". Original Error: ${res.err}`);
                }
            });
        } else {
            return this._load(url, resource, index);
        }
    }
    setLoadedResource(path, loaded = true) {
        this._loadedResources[path] = loaded;
    }
    isResourceLoaded(path) {
        return this._loadedResources[path];
    }
    _load(url, resource, index) {
        let promise = Promise.resolve();
        if (resource.type === 'script') {
            promise = this._loadScript(url);
        } else if (resource.type === 'link') {
            promise = this._loadLink(url);
        }
        this._loadingResources[resource.path] = promise;
        promise.then(()=>{
            this._loadedResources[resource.path] = true;
            this._loadingResources[resource.path] = null;
        }).catch((e)=>{
            console.warn(`[Farm] Failed to load resource "${url}" using publicPath: ${this.publicPaths[index]}`);
            index++;
            if (index < this.publicPaths.length) {
                return this._load(url, resource, index);
            } else {
                this._loadingResources[resource.path] = null;
                throw new Error(`[Farm] Failed to load resource: "${resource.path}, type: ${resource.type}". ${e}`);
            }
        });
        return promise;
    }
    _loadScript(path) {
        if (!isBrowser) {
            return import(path);
        } else {
            return new Promise((resolve, reject)=>{
                const script = document.createElement('script');
                script.src = path;
                document.body.appendChild(script);
                script.onload = ()=>{
                    resolve();
                };
                script.onerror = (e)=>{
                    reject(e);
                };
            });
        }
    }
    _loadLink(path) {
        if (!isBrowser) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject)=>{
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = path;
                document.head.appendChild(link);
                link.onload = ()=>{
                    resolve();
                };
                link.onerror = (e)=>{
                    reject(e);
                };
            });
        }
    }
}

var global_d_ts_cjs = __commonJs((module, exports)=>{
    "use strict";
});

global_d_ts_cjs();
const __global_this__$1 = globalThis || window;
const scope__interop_require_default = typeof _interop_require_default === 'function' ? _interop_require_default : undefined;
const scope__interop_require_wildcard = typeof _interop_require_wildcard === 'function' ? _interop_require_wildcard : undefined;
const scope__export_star = typeof _export_star === 'function' ? _export_star : undefined;
const INTERNAL_MODULE_MAP = {
    '@swc/helpers/_/_interop_require_default': {
        default: scope__interop_require_default,
        _: scope__interop_require_default
    },
    '@swc/helpers/_/_interop_require_wildcard': {
        default: scope__interop_require_wildcard,
        _: scope__interop_require_wildcard
    },
    '@swc/helpers/_/_export_star': {
        default: scope__export_star,
        _: scope__export_star
    }
};
class ModuleSystem {
    modules;
    cache;
    externalModules;
    reRegisterModules;
    publicPaths;
    dynamicModuleResourcesMap;
    resourceLoader;
    pluginContainer;
    targetEnv;
    constructor(){
        this.modules = {};
        this.cache = {};
        this.publicPaths = [];
        this.dynamicModuleResourcesMap = {};
        this.resourceLoader = new ResourceLoader(this, this.publicPaths);
        this.pluginContainer = new FarmRuntimePluginContainer([]);
        this.targetEnv = targetEnv;
        this.externalModules = {};
        this.reRegisterModules = false;
    }
    require(moduleId, isCJS = false) {
        if (INTERNAL_MODULE_MAP[moduleId]) {
            return INTERNAL_MODULE_MAP[moduleId];
        }
        if (this.cache[moduleId]) {
            const shouldSkip = this.pluginContainer.hookBail('readModuleCache', this.cache[moduleId]);
            if (!shouldSkip) {
                return this.cache[moduleId].exports;
            }
        }
        const initializer = this.modules[moduleId];
        if (!initializer) {
            if (this.externalModules[moduleId]) {
                const exports = this.externalModules[moduleId];
                if (isCJS) {
                    return exports.default || exports;
                }
                return exports;
            }
            if ((this.targetEnv === 'node' || !isBrowser) && nodeRequire) {
                const externalModule = nodeRequire(moduleId);
                return externalModule;
            }
            this.pluginContainer.hookSerial('moduleNotFound', moduleId);
            console.debug(`[Farm] Module "${moduleId}" is not registered`);
            return {};
        }
        const module = new Module(moduleId, this.require.bind(this));
        module.resource_pot = initializer.__farm_resource_pot__;
        this.pluginContainer.hookSerial('moduleCreated', module);
        this.cache[moduleId] = module;
        if (!(globalThis || global || window || {}).require) {
            (globalThis || global || window || {
                require: undefined
            }).require = this.require.bind(this);
        }
        const result$3 = initializer(module, module.exports, this.require.bind(this), this.farmDynamicRequire.bind(this));
        if (result$3 && result$3 instanceof Promise) {
            return result$3.then(()=>{
                this.pluginContainer.hookSerial('moduleInitialized', module);
                return module.exports;
            });
        } else {
            this.pluginContainer.hookSerial('moduleInitialized', module);
            return module.exports;
        }
    }
    farmDynamicRequire(moduleId) {
        if (this.modules[moduleId]) {
            const exports$1 = this.require(moduleId);
            if (exports$1.__farm_async) {
                return exports$1.default;
            } else {
                return Promise.resolve(exports$1);
            }
        }
        return this.loadDynamicResources(moduleId);
    }
    loadDynamicResources(moduleId, force = false) {
        const resources = this.dynamicModuleResourcesMap[moduleId];
        if (!resources || resources.length === 0) {
            throw new Error(`Dynamic imported module "${moduleId}" does not belong to any resource`);
        }
        if (force) {
            this.reRegisterModules = true;
            this.clearCache(moduleId);
        }
        return Promise.all(resources.map((resource)=>{
            if (force) {
                this.resourceLoader.setLoadedResource(resource.path, false);
            }
            return this.resourceLoader.load(resource);
        })).then(()=>{
            if (!this.modules[moduleId]) {
                throw new Error(`Dynamic imported module "${moduleId}" is not registered.`);
            }
            this.reRegisterModules = false;
            const result$4 = this.require(moduleId);
            if (result$4.__farm_async) {
                return result$4.default;
            } else {
                return result$4;
            }
        }).catch((err)=>{
            console.error(`[Farm] Error loading dynamic module "${moduleId}"`, err);
            throw err;
        });
    }
    register(moduleId, initializer) {
        if (this.modules[moduleId] && !this.reRegisterModules) {
            console.warn(`Module "${moduleId}" has registered! It should not be registered twice`);
            return;
        }
        this.modules[moduleId] = initializer;
    }
    update(moduleId, init) {
        this.modules[moduleId] = init;
        this.clearCache(moduleId);
    }
    delete(moduleId) {
        if (this.modules[moduleId]) {
            this.clearCache(moduleId);
            delete this.modules[moduleId];
            return true;
        } else {
            return false;
        }
    }
    getModuleUrl(moduleId) {
        const publicPath$1 = this.publicPaths[0] ?? '';
        if (__global_this__$1.location) {
            const url$1 = `${__global_this__$1.location.protocol}//${__global_this__$1.location.host}${publicPath$1.endsWith('/') ? publicPath$1.slice(0, -1) : publicPath$1}/${this.modules[moduleId].__farm_resource_pot__}`;
            return url$1;
        } else {
            return this.modules[moduleId].__farm_resource_pot__;
        }
    }
    getCache(moduleId) {
        return this.cache[moduleId];
    }
    clearCache(moduleId) {
        if (this.cache[moduleId]) {
            delete this.cache[moduleId];
            return true;
        } else {
            return false;
        }
    }
    setInitialLoadedResources(resources) {
        for (const resource of resources){
            this.resourceLoader.setLoadedResource(resource);
        }
    }
    setDynamicModuleResourcesMap(dynamicModuleResourcesMap) {
        this.dynamicModuleResourcesMap = dynamicModuleResourcesMap;
    }
    setPublicPaths(publicPaths) {
        this.publicPaths = publicPaths;
        this.resourceLoader.publicPaths = this.publicPaths;
    }
    setPlugins(plugins) {
        this.pluginContainer.plugins = plugins;
    }
    addPlugin(plugin) {
        if (this.pluginContainer.plugins.every((p)=>p.name !== plugin.name)) {
            this.pluginContainer.plugins.push(plugin);
        }
    }
    removePlugin(pluginName) {
        this.pluginContainer.plugins = this.pluginContainer.plugins.filter((p)=>p.name !== pluginName);
    }
    setExternalModules(externalModules) {
        Object.assign(this.externalModules, externalModules || {});
    }
    bootstrap() {
        this.pluginContainer.hookSerial('bootstrap', this);
    }
}

__farm_global_this__.__farm_module_system__ = (function() {
    const moduleSystem = new ModuleSystem();
    return function() {
        return moduleSystem;
    };
})()();
(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__.setPlugins([
    index_ts_default
]);
var __farm_external_module_path = require("path");var __farm_external_module_util = require("util");(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__.setExternalModules({"path": __farm_external_module_path,"util": __farm_external_module_util});(function(_){for(var r in _){_[r].__farm_resource_pot__='file://'+__filename;(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__.register(r,_[r])}})({"0129a2e3":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const utils = farmRequire("90ccf097", true);
    const { CHAR_ASTERISK, CHAR_AT, CHAR_BACKWARD_SLASH, CHAR_COMMA, CHAR_DOT, CHAR_EXCLAMATION_MARK, CHAR_FORWARD_SLASH, CHAR_LEFT_CURLY_BRACE, CHAR_LEFT_PARENTHESES, CHAR_LEFT_SQUARE_BRACKET, CHAR_PLUS, CHAR_QUESTION_MARK, CHAR_RIGHT_CURLY_BRACE, CHAR_RIGHT_PARENTHESES, CHAR_RIGHT_SQUARE_BRACKET } = farmRequire("ee06a2f9", true);
    const isPathSeparator = (code)=>{
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    const depth = (token)=>{
        if (token.isPrefix !== true) {
            token.depth = token.isGlobstar ? Infinity : 1;
        }
    };
    const scan = (input, options)=>{
        const opts = options || {};
        const length = input.length - 1;
        const scanToEnd = opts.parts === true || opts.scanToEnd === true;
        const slashes = [];
        const tokens = [];
        const parts = [];
        let str = input;
        let index = -1;
        let start = 0;
        let lastIndex = 0;
        let isBrace = false;
        let isBracket = false;
        let isGlob = false;
        let isExtglob = false;
        let isGlobstar = false;
        let braceEscaped = false;
        let backslashes = false;
        let negated = false;
        let negatedExtglob = false;
        let finished = false;
        let braces = 0;
        let prev;
        let code;
        let token = {
            value: '',
            depth: 0,
            isGlob: false
        };
        const eos = ()=>index >= length;
        const peek = ()=>str.charCodeAt(index + 1);
        const advance = ()=>{
            prev = code;
            return str.charCodeAt(++index);
        };
        while(index < length){
            code = advance();
            let next;
            if (code === CHAR_BACKWARD_SLASH) {
                backslashes = token.backslashes = true;
                code = advance();
                if (code === CHAR_LEFT_CURLY_BRACE) {
                    braceEscaped = true;
                }
                continue;
            }
            if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
                braces++;
                while(eos() !== true && (code = advance())){
                    if (code === CHAR_BACKWARD_SLASH) {
                        backslashes = token.backslashes = true;
                        advance();
                        continue;
                    }
                    if (code === CHAR_LEFT_CURLY_BRACE) {
                        braces++;
                        continue;
                    }
                    if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
                        isBrace = token.isBrace = true;
                        isGlob = token.isGlob = true;
                        finished = true;
                        if (scanToEnd === true) {
                            continue;
                        }
                        break;
                    }
                    if (braceEscaped !== true && code === CHAR_COMMA) {
                        isBrace = token.isBrace = true;
                        isGlob = token.isGlob = true;
                        finished = true;
                        if (scanToEnd === true) {
                            continue;
                        }
                        break;
                    }
                    if (code === CHAR_RIGHT_CURLY_BRACE) {
                        braces--;
                        if (braces === 0) {
                            braceEscaped = false;
                            isBrace = token.isBrace = true;
                            finished = true;
                            break;
                        }
                    }
                }
                if (scanToEnd === true) {
                    continue;
                }
                break;
            }
            if (code === CHAR_FORWARD_SLASH) {
                slashes.push(index);
                tokens.push(token);
                token = {
                    value: '',
                    depth: 0,
                    isGlob: false
                };
                if (finished === true) continue;
                if (prev === CHAR_DOT && index === start + 1) {
                    start += 2;
                    continue;
                }
                lastIndex = index + 1;
                continue;
            }
            if (opts.noext !== true) {
                const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
                if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
                    isGlob = token.isGlob = true;
                    isExtglob = token.isExtglob = true;
                    finished = true;
                    if (code === CHAR_EXCLAMATION_MARK && index === start) {
                        negatedExtglob = true;
                    }
                    if (scanToEnd === true) {
                        while(eos() !== true && (code = advance())){
                            if (code === CHAR_BACKWARD_SLASH) {
                                backslashes = token.backslashes = true;
                                code = advance();
                                continue;
                            }
                            if (code === CHAR_RIGHT_PARENTHESES) {
                                isGlob = token.isGlob = true;
                                finished = true;
                                break;
                            }
                        }
                        continue;
                    }
                    break;
                }
            }
            if (code === CHAR_ASTERISK) {
                if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
                isGlob = token.isGlob = true;
                finished = true;
                if (scanToEnd === true) {
                    continue;
                }
                break;
            }
            if (code === CHAR_QUESTION_MARK) {
                isGlob = token.isGlob = true;
                finished = true;
                if (scanToEnd === true) {
                    continue;
                }
                break;
            }
            if (code === CHAR_LEFT_SQUARE_BRACKET) {
                while(eos() !== true && (next = advance())){
                    if (next === CHAR_BACKWARD_SLASH) {
                        backslashes = token.backslashes = true;
                        advance();
                        continue;
                    }
                    if (next === CHAR_RIGHT_SQUARE_BRACKET) {
                        isBracket = token.isBracket = true;
                        isGlob = token.isGlob = true;
                        finished = true;
                        break;
                    }
                }
                if (scanToEnd === true) {
                    continue;
                }
                break;
            }
            if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
                negated = token.negated = true;
                start++;
                continue;
            }
            if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
                isGlob = token.isGlob = true;
                if (scanToEnd === true) {
                    while(eos() !== true && (code = advance())){
                        if (code === CHAR_LEFT_PARENTHESES) {
                            backslashes = token.backslashes = true;
                            code = advance();
                            continue;
                        }
                        if (code === CHAR_RIGHT_PARENTHESES) {
                            finished = true;
                            break;
                        }
                    }
                    continue;
                }
                break;
            }
            if (isGlob === true) {
                finished = true;
                if (scanToEnd === true) {
                    continue;
                }
                break;
            }
        }
        if (opts.noext === true) {
            isExtglob = false;
            isGlob = false;
        }
        let base = str;
        let prefix = '';
        let glob = '';
        if (start > 0) {
            prefix = str.slice(0, start);
            str = str.slice(start);
            lastIndex -= start;
        }
        if (base && isGlob === true && lastIndex > 0) {
            base = str.slice(0, lastIndex);
            glob = str.slice(lastIndex);
        } else if (isGlob === true) {
            base = '';
            glob = str;
        } else {
            base = str;
        }
        if (base && base !== '' && base !== '/' && base !== str) {
            if (isPathSeparator(base.charCodeAt(base.length - 1))) {
                base = base.slice(0, -1);
            }
        }
        if (opts.unescape === true) {
            if (glob) glob = utils.removeBackslashes(glob);
            if (base && backslashes === true) {
                base = utils.removeBackslashes(base);
            }
        }
        const state = {
            prefix,
            input,
            start,
            base,
            glob,
            isBrace,
            isBracket,
            isGlob,
            isExtglob,
            isGlobstar,
            negated,
            negatedExtglob
        };
        if (opts.tokens === true) {
            state.maxDepth = 0;
            if (!isPathSeparator(code)) {
                tokens.push(token);
            }
            state.tokens = tokens;
        }
        if (opts.parts === true || opts.tokens === true) {
            let prevIndex;
            for(let idx = 0; idx < slashes.length; idx++){
                const n = prevIndex ? prevIndex + 1 : start;
                const i = slashes[idx];
                const value = input.slice(n, i);
                if (opts.tokens) {
                    if (idx === 0 && start !== 0) {
                        tokens[idx].isPrefix = true;
                        tokens[idx].value = prefix;
                    } else {
                        tokens[idx].value = value;
                    }
                    depth(tokens[idx]);
                    state.maxDepth += tokens[idx].depth;
                }
                if (idx !== 0 || value !== '') {
                    parts.push(value);
                }
                prevIndex = i;
            }
            if (prevIndex && prevIndex + 1 < input.length) {
                const value = input.slice(prevIndex + 1);
                parts.push(value);
                if (opts.tokens) {
                    tokens[tokens.length - 1].value = value;
                    depth(tokens[tokens.length - 1]);
                    state.maxDepth += tokens[tokens.length - 1].depth;
                }
            }
            state.slashes = slashes;
            state.parts = parts;
        }
        return state;
    };
    module.exports = scan;
}
,
"154d2100":/*!
 * fill-range <https://github.com/jonschlinkert/fill-range>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */ function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const util = farmRequire('util', true);
    const toRegexRange = farmRequire("558bdb9c", true);
    const isObject = (val)=>val !== null && typeof val === 'object' && !Array.isArray(val);
    const transform = (toNumber)=>{
        return (value)=>toNumber === true ? Number(value) : String(value);
    };
    const isValidValue = (value)=>{
        return typeof value === 'number' || typeof value === 'string' && value !== '';
    };
    const isNumber = (num)=>Number.isInteger(+num);
    const zeros = (input)=>{
        let value = `${input}`;
        let index = -1;
        if (value[0] === '-') value = value.slice(1);
        if (value === '0') return false;
        while(value[++index] === '0');
        return index > 0;
    };
    const stringify = (start, end, options)=>{
        if (typeof start === 'string' || typeof end === 'string') {
            return true;
        }
        return options.stringify === true;
    };
    const pad = (input, maxLength, toNumber)=>{
        if (maxLength > 0) {
            let dash = input[0] === '-' ? '-' : '';
            if (dash) input = input.slice(1);
            input = dash + input.padStart(dash ? maxLength - 1 : maxLength, '0');
        }
        if (toNumber === false) {
            return String(input);
        }
        return input;
    };
    const toMaxLen = (input, maxLength)=>{
        let negative = input[0] === '-' ? '-' : '';
        if (negative) {
            input = input.slice(1);
            maxLength--;
        }
        while(input.length < maxLength)input = '0' + input;
        return negative ? '-' + input : input;
    };
    const toSequence = (parts, options, maxLen)=>{
        parts.negatives.sort((a, b)=>a < b ? -1 : a > b ? 1 : 0);
        parts.positives.sort((a, b)=>a < b ? -1 : a > b ? 1 : 0);
        let prefix = options.capture ? '' : '?:';
        let positives = '';
        let negatives = '';
        let result;
        if (parts.positives.length) {
            positives = parts.positives.map((v)=>toMaxLen(String(v), maxLen)).join('|');
        }
        if (parts.negatives.length) {
            negatives = `-(${prefix}${parts.negatives.map((v)=>toMaxLen(String(v), maxLen)).join('|')})`;
        }
        if (positives && negatives) {
            result = `${positives}|${negatives}`;
        } else {
            result = positives || negatives;
        }
        if (options.wrap) {
            return `(${prefix}${result})`;
        }
        return result;
    };
    const toRange = (a, b, isNumbers, options)=>{
        if (isNumbers) {
            return toRegexRange(a, b, {
                wrap: false,
                ...options
            });
        }
        let start = String.fromCharCode(a);
        if (a === b) return start;
        let stop = String.fromCharCode(b);
        return `[${start}-${stop}]`;
    };
    const toRegex = (start, end, options)=>{
        if (Array.isArray(start)) {
            let wrap = options.wrap === true;
            let prefix = options.capture ? '' : '?:';
            return wrap ? `(${prefix}${start.join('|')})` : start.join('|');
        }
        return toRegexRange(start, end, options);
    };
    const rangeError = (...args)=>{
        return new RangeError('Invalid range arguments: ' + util.inspect(...args));
    };
    const invalidRange = (start, end, options)=>{
        if (options.strictRanges === true) throw rangeError([
            start,
            end
        ]);
        return [];
    };
    const invalidStep = (step, options)=>{
        if (options.strictRanges === true) {
            throw new TypeError(`Expected step "${step}" to be a number`);
        }
        return [];
    };
    const fillNumbers = (start, end, step = 1, options = {})=>{
        let a = Number(start);
        let b = Number(end);
        if (!Number.isInteger(a) || !Number.isInteger(b)) {
            if (options.strictRanges === true) throw rangeError([
                start,
                end
            ]);
            return [];
        }
        if (a === 0) a = 0;
        if (b === 0) b = 0;
        let descending = a > b;
        let startString = String(start);
        let endString = String(end);
        let stepString = String(step);
        step = Math.max(Math.abs(step), 1);
        let padded = zeros(startString) || zeros(endString) || zeros(stepString);
        let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
        let toNumber = padded === false && stringify(start, end, options) === false;
        let format = options.transform || transform(toNumber);
        if (options.toRegex && step === 1) {
            return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
        }
        let parts = {
            negatives: [],
            positives: []
        };
        let push = (num)=>parts[num < 0 ? 'negatives' : 'positives'].push(Math.abs(num));
        let range = [];
        let index = 0;
        while(descending ? a >= b : a <= b){
            if (options.toRegex === true && step > 1) {
                push(a);
            } else {
                range.push(pad(format(a, index), maxLen, toNumber));
            }
            a = descending ? a - step : a + step;
            index++;
        }
        if (options.toRegex === true) {
            return step > 1 ? toSequence(parts, options, maxLen) : toRegex(range, null, {
                wrap: false,
                ...options
            });
        }
        return range;
    };
    const fillLetters = (start, end, step = 1, options = {})=>{
        if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
            return invalidRange(start, end, options);
        }
        let format = options.transform || ((val)=>String.fromCharCode(val));
        let a = `${start}`.charCodeAt(0);
        let b = `${end}`.charCodeAt(0);
        let descending = a > b;
        let min = Math.min(a, b);
        let max = Math.max(a, b);
        if (options.toRegex && step === 1) {
            return toRange(min, max, false, options);
        }
        let range = [];
        let index = 0;
        while(descending ? a >= b : a <= b){
            range.push(format(a, index));
            a = descending ? a - step : a + step;
            index++;
        }
        if (options.toRegex === true) {
            return toRegex(range, null, {
                wrap: false,
                options
            });
        }
        return range;
    };
    const fill = (start, end, step, options = {})=>{
        if (end == null && isValidValue(start)) {
            return [
                start
            ];
        }
        if (!isValidValue(start) || !isValidValue(end)) {
            return invalidRange(start, end, options);
        }
        if (typeof step === 'function') {
            return fill(start, end, 1, {
                transform: step
            });
        }
        if (isObject(step)) {
            return fill(start, end, 0, step);
        }
        let opts = {
            ...options
        };
        if (opts.capture === true) opts.wrap = true;
        step = step || opts.step || 1;
        if (!isNumber(step)) {
            if (step != null && !isObject(step)) return invalidStep(step, opts);
            return fill(start, end, 1, step);
        }
        if (isNumber(start) && isNumber(end)) {
            return fillNumbers(start, end, step, opts);
        }
        return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
    };
    module.exports = fill;
}
,
"1553b537":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    exports.isInteger = (num)=>{
        if (typeof num === 'number') {
            return Number.isInteger(num);
        }
        if (typeof num === 'string' && num.trim() !== '') {
            return Number.isInteger(Number(num));
        }
        return false;
    };
    exports.find = (node, type)=>node.nodes.find((node)=>node.type === type);
    exports.exceedsLimit = (min, max, step = 1, limit)=>{
        if (limit === false) return false;
        if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
        return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports.escapeNode = (block, n = 0, type)=>{
        const node = block.nodes[n];
        if (!node) return;
        if (type && node.type === type || node.type === 'open' || node.type === 'close') {
            if (node.escaped !== true) {
                node.value = '\\' + node.value;
                node.escaped = true;
            }
        }
    };
    exports.encloseBrace = (node)=>{
        if (node.type !== 'brace') return false;
        if (node.commas >> 0 + node.ranges >> 0 === 0) {
            node.invalid = true;
            return true;
        }
        return false;
    };
    exports.isInvalidBrace = (block)=>{
        if (block.type !== 'brace') return false;
        if (block.invalid === true || block.dollar) return true;
        if (block.commas >> 0 + block.ranges >> 0 === 0) {
            block.invalid = true;
            return true;
        }
        if (block.open !== true || block.close !== true) {
            block.invalid = true;
            return true;
        }
        return false;
    };
    exports.isOpenOrClose = (node)=>{
        if (node.type === 'open' || node.type === 'close') {
            return true;
        }
        return node.open === true || node.close === true;
    };
    exports.reduce = (nodes)=>nodes.reduce((acc, node)=>{
            if (node.type === 'text') acc.push(node.value);
            if (node.type === 'range') node.type = 'text';
            return acc;
        }, []);
    exports.flatten = (...args)=>{
        const result = [];
        const flat = (arr)=>{
            for(let i = 0; i < arr.length; i++){
                const ele = arr[i];
                if (Array.isArray(ele)) {
                    flat(ele);
                    continue;
                }
                if (ele !== undefined) {
                    result.push(ele);
                }
            }
            return result;
        };
        flat(args);
        return result;
    };
}
,
"2d8459f3":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const constants = farmRequire("ee06a2f9", true);
    const utils = farmRequire("90ccf097", true);
    const { MAX_LENGTH, POSIX_REGEX_SOURCE, REGEX_NON_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_BACKREF, REPLACEMENTS } = constants;
    const expandRange = (args, options)=>{
        if (typeof options.expandRange === 'function') {
            return options.expandRange(...args, options);
        }
        args.sort();
        const value = `[${args.join('-')}]`;
        try {
            new RegExp(value);
        } catch (ex) {
            return args.map((v)=>utils.escapeRegex(v)).join('..');
        }
        return value;
    };
    const syntaxError = (type, char)=>{
        return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    const parse = (input, options)=>{
        if (typeof input !== 'string') {
            throw new TypeError('Expected a string');
        }
        input = REPLACEMENTS[input] || input;
        const opts = {
            ...options
        };
        const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
        let len = input.length;
        if (len > max) {
            throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
        }
        const bos = {
            type: 'bos',
            value: '',
            output: opts.prepend || ''
        };
        const tokens = [
            bos
        ];
        const capture = opts.capture ? '' : '?:';
        const win32 = utils.isWindows(options);
        const PLATFORM_CHARS = constants.globChars(win32);
        const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
        const { DOT_LITERAL, PLUS_LITERAL, SLASH_LITERAL, ONE_CHAR, DOTS_SLASH, NO_DOT, NO_DOT_SLASH, NO_DOTS_SLASH, QMARK, QMARK_NO_DOT, STAR, START_ANCHOR } = PLATFORM_CHARS;
        const globstar = (opts)=>{
            return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
        };
        const nodot = opts.dot ? '' : NO_DOT;
        const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
        let star = opts.bash === true ? globstar(opts) : STAR;
        if (opts.capture) {
            star = `(${star})`;
        }
        if (typeof opts.noext === 'boolean') {
            opts.noextglob = opts.noext;
        }
        const state = {
            input,
            index: -1,
            start: 0,
            dot: opts.dot === true,
            consumed: '',
            output: '',
            prefix: '',
            backtrack: false,
            negated: false,
            brackets: 0,
            braces: 0,
            parens: 0,
            quotes: 0,
            globstar: false,
            tokens
        };
        input = utils.removePrefix(input, state);
        len = input.length;
        const extglobs = [];
        const braces = [];
        const stack = [];
        let prev = bos;
        let value;
        const eos = ()=>state.index === len - 1;
        const peek = state.peek = (n = 1)=>input[state.index + n];
        const advance = state.advance = ()=>input[++state.index] || '';
        const remaining = ()=>input.slice(state.index + 1);
        const consume = (value = '', num = 0)=>{
            state.consumed += value;
            state.index += num;
        };
        const append = (token)=>{
            state.output += token.output != null ? token.output : token.value;
            consume(token.value);
        };
        const negate = ()=>{
            let count = 1;
            while(peek() === '!' && (peek(2) !== '(' || peek(3) === '?')){
                advance();
                state.start++;
                count++;
            }
            if (count % 2 === 0) {
                return false;
            }
            state.negated = true;
            state.start++;
            return true;
        };
        const increment = (type)=>{
            state[type]++;
            stack.push(type);
        };
        const decrement = (type)=>{
            state[type]--;
            stack.pop();
        };
        const push = (tok)=>{
            if (prev.type === 'globstar') {
                const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
                const isExtglob = tok.extglob === true || extglobs.length && (tok.type === 'pipe' || tok.type === 'paren');
                if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
                    state.output = state.output.slice(0, -prev.output.length);
                    prev.type = 'star';
                    prev.value = '*';
                    prev.output = star;
                    state.output += prev.output;
                }
            }
            if (extglobs.length && tok.type !== 'paren') {
                extglobs[extglobs.length - 1].inner += tok.value;
            }
            if (tok.value || tok.output) append(tok);
            if (prev && prev.type === 'text' && tok.type === 'text') {
                prev.value += tok.value;
                prev.output = (prev.output || '') + tok.value;
                return;
            }
            tok.prev = prev;
            tokens.push(tok);
            prev = tok;
        };
        const extglobOpen = (type, value)=>{
            const token = {
                ...EXTGLOB_CHARS[value],
                conditions: 1,
                inner: ''
            };
            token.prev = prev;
            token.parens = state.parens;
            token.output = state.output;
            const output = (opts.capture ? '(' : '') + token.open;
            increment('parens');
            push({
                type,
                value,
                output: state.output ? '' : ONE_CHAR
            });
            push({
                type: 'paren',
                extglob: true,
                value: advance(),
                output
            });
            extglobs.push(token);
        };
        const extglobClose = (token)=>{
            let output = token.close + (opts.capture ? ')' : '');
            let rest;
            if (token.type === 'negate') {
                let extglobStar = star;
                if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
                    extglobStar = globstar(opts);
                }
                if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
                    output = token.close = `)$))${extglobStar}`;
                }
                if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
                    const expression = parse(rest, {
                        ...options,
                        fastpaths: false
                    }).output;
                    output = token.close = `)${expression})${extglobStar})`;
                }
                if (token.prev.type === 'bos') {
                    state.negatedExtglob = true;
                }
            }
            push({
                type: 'paren',
                extglob: true,
                value,
                output
            });
            decrement('parens');
        };
        if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
            let backslashes = false;
            let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index)=>{
                if (first === '\\') {
                    backslashes = true;
                    return m;
                }
                if (first === '?') {
                    if (esc) {
                        return esc + first + (rest ? QMARK.repeat(rest.length) : '');
                    }
                    if (index === 0) {
                        return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
                    }
                    return QMARK.repeat(chars.length);
                }
                if (first === '.') {
                    return DOT_LITERAL.repeat(chars.length);
                }
                if (first === '*') {
                    if (esc) {
                        return esc + first + (rest ? star : '');
                    }
                    return star;
                }
                return esc ? m : `\\${m}`;
            });
            if (backslashes === true) {
                if (opts.unescape === true) {
                    output = output.replace(/\\/g, '');
                } else {
                    output = output.replace(/\\+/g, (m)=>{
                        return m.length % 2 === 0 ? '\\\\' : m ? '\\' : '';
                    });
                }
            }
            if (output === input && opts.contains === true) {
                state.output = input;
                return state;
            }
            state.output = utils.wrapOutput(output, state, options);
            return state;
        }
        while(!eos()){
            value = advance();
            if (value === '\u0000') {
                continue;
            }
            if (value === '\\') {
                const next = peek();
                if (next === '/' && opts.bash !== true) {
                    continue;
                }
                if (next === '.' || next === ';') {
                    continue;
                }
                if (!next) {
                    value += '\\';
                    push({
                        type: 'text',
                        value
                    });
                    continue;
                }
                const match = /^\\+/.exec(remaining());
                let slashes = 0;
                if (match && match[0].length > 2) {
                    slashes = match[0].length;
                    state.index += slashes;
                    if (slashes % 2 !== 0) {
                        value += '\\';
                    }
                }
                if (opts.unescape === true) {
                    value = advance();
                } else {
                    value += advance();
                }
                if (state.brackets === 0) {
                    push({
                        type: 'text',
                        value
                    });
                    continue;
                }
            }
            if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
                if (opts.posix !== false && value === ':') {
                    const inner = prev.value.slice(1);
                    if (inner.includes('[')) {
                        prev.posix = true;
                        if (inner.includes(':')) {
                            const idx = prev.value.lastIndexOf('[');
                            const pre = prev.value.slice(0, idx);
                            const rest = prev.value.slice(idx + 2);
                            const posix = POSIX_REGEX_SOURCE[rest];
                            if (posix) {
                                prev.value = pre + posix;
                                state.backtrack = true;
                                advance();
                                if (!bos.output && tokens.indexOf(prev) === 1) {
                                    bos.output = ONE_CHAR;
                                }
                                continue;
                            }
                        }
                    }
                }
                if (value === '[' && peek() !== ':' || value === '-' && peek() === ']') {
                    value = `\\${value}`;
                }
                if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
                    value = `\\${value}`;
                }
                if (opts.posix === true && value === '!' && prev.value === '[') {
                    value = '^';
                }
                prev.value += value;
                append({
                    value
                });
                continue;
            }
            if (state.quotes === 1 && value !== '"') {
                value = utils.escapeRegex(value);
                prev.value += value;
                append({
                    value
                });
                continue;
            }
            if (value === '"') {
                state.quotes = state.quotes === 1 ? 0 : 1;
                if (opts.keepQuotes === true) {
                    push({
                        type: 'text',
                        value
                    });
                }
                continue;
            }
            if (value === '(') {
                increment('parens');
                push({
                    type: 'paren',
                    value
                });
                continue;
            }
            if (value === ')') {
                if (state.parens === 0 && opts.strictBrackets === true) {
                    throw new SyntaxError(syntaxError('opening', '('));
                }
                const extglob = extglobs[extglobs.length - 1];
                if (extglob && state.parens === extglob.parens + 1) {
                    extglobClose(extglobs.pop());
                    continue;
                }
                push({
                    type: 'paren',
                    value,
                    output: state.parens ? ')' : '\\)'
                });
                decrement('parens');
                continue;
            }
            if (value === '[') {
                if (opts.nobracket === true || !remaining().includes(']')) {
                    if (opts.nobracket !== true && opts.strictBrackets === true) {
                        throw new SyntaxError(syntaxError('closing', ']'));
                    }
                    value = `\\${value}`;
                } else {
                    increment('brackets');
                }
                push({
                    type: 'bracket',
                    value
                });
                continue;
            }
            if (value === ']') {
                if (opts.nobracket === true || prev && prev.type === 'bracket' && prev.value.length === 1) {
                    push({
                        type: 'text',
                        value,
                        output: `\\${value}`
                    });
                    continue;
                }
                if (state.brackets === 0) {
                    if (opts.strictBrackets === true) {
                        throw new SyntaxError(syntaxError('opening', '['));
                    }
                    push({
                        type: 'text',
                        value,
                        output: `\\${value}`
                    });
                    continue;
                }
                decrement('brackets');
                const prevValue = prev.value.slice(1);
                if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
                    value = `/${value}`;
                }
                prev.value += value;
                append({
                    value
                });
                if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
                    continue;
                }
                const escaped = utils.escapeRegex(prev.value);
                state.output = state.output.slice(0, -prev.value.length);
                if (opts.literalBrackets === true) {
                    state.output += escaped;
                    prev.value = escaped;
                    continue;
                }
                prev.value = `(${capture}${escaped}|${prev.value})`;
                state.output += prev.value;
                continue;
            }
            if (value === '{' && opts.nobrace !== true) {
                increment('braces');
                const open = {
                    type: 'brace',
                    value,
                    output: '(',
                    outputIndex: state.output.length,
                    tokensIndex: state.tokens.length
                };
                braces.push(open);
                push(open);
                continue;
            }
            if (value === '}') {
                const brace = braces[braces.length - 1];
                if (opts.nobrace === true || !brace) {
                    push({
                        type: 'text',
                        value,
                        output: value
                    });
                    continue;
                }
                let output = ')';
                if (brace.dots === true) {
                    const arr = tokens.slice();
                    const range = [];
                    for(let i = arr.length - 1; i >= 0; i--){
                        tokens.pop();
                        if (arr[i].type === 'brace') {
                            break;
                        }
                        if (arr[i].type !== 'dots') {
                            range.unshift(arr[i].value);
                        }
                    }
                    output = expandRange(range, opts);
                    state.backtrack = true;
                }
                if (brace.comma !== true && brace.dots !== true) {
                    const out = state.output.slice(0, brace.outputIndex);
                    const toks = state.tokens.slice(brace.tokensIndex);
                    brace.value = brace.output = '\\{';
                    value = output = '\\}';
                    state.output = out;
                    for (const t of toks){
                        state.output += t.output || t.value;
                    }
                }
                push({
                    type: 'brace',
                    value,
                    output
                });
                decrement('braces');
                braces.pop();
                continue;
            }
            if (value === '|') {
                if (extglobs.length > 0) {
                    extglobs[extglobs.length - 1].conditions++;
                }
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (value === ',') {
                let output = value;
                const brace = braces[braces.length - 1];
                if (brace && stack[stack.length - 1] === 'braces') {
                    brace.comma = true;
                    output = '|';
                }
                push({
                    type: 'comma',
                    value,
                    output
                });
                continue;
            }
            if (value === '/') {
                if (prev.type === 'dot' && state.index === state.start + 1) {
                    state.start = state.index + 1;
                    state.consumed = '';
                    state.output = '';
                    tokens.pop();
                    prev = bos;
                    continue;
                }
                push({
                    type: 'slash',
                    value,
                    output: SLASH_LITERAL
                });
                continue;
            }
            if (value === '.') {
                if (state.braces > 0 && prev.type === 'dot') {
                    if (prev.value === '.') prev.output = DOT_LITERAL;
                    const brace = braces[braces.length - 1];
                    prev.type = 'dots';
                    prev.output += value;
                    prev.value += value;
                    brace.dots = true;
                    continue;
                }
                if (state.braces + state.parens === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
                    push({
                        type: 'text',
                        value,
                        output: DOT_LITERAL
                    });
                    continue;
                }
                push({
                    type: 'dot',
                    value,
                    output: DOT_LITERAL
                });
                continue;
            }
            if (value === '?') {
                const isGroup = prev && prev.value === '(';
                if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
                    extglobOpen('qmark', value);
                    continue;
                }
                if (prev && prev.type === 'paren') {
                    const next = peek();
                    let output = value;
                    if (next === '<' && !utils.supportsLookbehinds()) {
                        throw new Error('Node.js v10 or higher is required for regex lookbehinds');
                    }
                    if (prev.value === '(' && !/[!=<:]/.test(next) || next === '<' && !/<([!=]|\w+>)/.test(remaining())) {
                        output = `\\${value}`;
                    }
                    push({
                        type: 'text',
                        value,
                        output
                    });
                    continue;
                }
                if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
                    push({
                        type: 'qmark',
                        value,
                        output: QMARK_NO_DOT
                    });
                    continue;
                }
                push({
                    type: 'qmark',
                    value,
                    output: QMARK
                });
                continue;
            }
            if (value === '!') {
                if (opts.noextglob !== true && peek() === '(') {
                    if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
                        extglobOpen('negate', value);
                        continue;
                    }
                }
                if (opts.nonegate !== true && state.index === 0) {
                    negate();
                    continue;
                }
            }
            if (value === '+') {
                if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
                    extglobOpen('plus', value);
                    continue;
                }
                if (prev && prev.value === '(' || opts.regex === false) {
                    push({
                        type: 'plus',
                        value,
                        output: PLUS_LITERAL
                    });
                    continue;
                }
                if (prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace') || state.parens > 0) {
                    push({
                        type: 'plus',
                        value
                    });
                    continue;
                }
                push({
                    type: 'plus',
                    value: PLUS_LITERAL
                });
                continue;
            }
            if (value === '@') {
                if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
                    push({
                        type: 'at',
                        extglob: true,
                        value,
                        output: ''
                    });
                    continue;
                }
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (value !== '*') {
                if (value === '$' || value === '^') {
                    value = `\\${value}`;
                }
                const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
                if (match) {
                    value += match[0];
                    state.index += match[0].length;
                }
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (prev && (prev.type === 'globstar' || prev.star === true)) {
                prev.type = 'star';
                prev.star = true;
                prev.value += value;
                prev.output = star;
                state.backtrack = true;
                state.globstar = true;
                consume(value);
                continue;
            }
            let rest = remaining();
            if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
                extglobOpen('star', value);
                continue;
            }
            if (prev.type === 'star') {
                if (opts.noglobstar === true) {
                    consume(value);
                    continue;
                }
                const prior = prev.prev;
                const before = prior.prev;
                const isStart = prior.type === 'slash' || prior.type === 'bos';
                const afterStar = before && (before.type === 'star' || before.type === 'globstar');
                if (opts.bash === true && (!isStart || rest[0] && rest[0] !== '/')) {
                    push({
                        type: 'star',
                        value,
                        output: ''
                    });
                    continue;
                }
                const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
                const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
                if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
                    push({
                        type: 'star',
                        value,
                        output: ''
                    });
                    continue;
                }
                while(rest.slice(0, 3) === '/**'){
                    const after = input[state.index + 4];
                    if (after && after !== '/') {
                        break;
                    }
                    rest = rest.slice(3);
                    consume('/**', 3);
                }
                if (prior.type === 'bos' && eos()) {
                    prev.type = 'globstar';
                    prev.value += value;
                    prev.output = globstar(opts);
                    state.output = prev.output;
                    state.globstar = true;
                    consume(value);
                    continue;
                }
                if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
                    state.output = state.output.slice(0, -(prior.output + prev.output).length);
                    prior.output = `(?:${prior.output}`;
                    prev.type = 'globstar';
                    prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
                    prev.value += value;
                    state.globstar = true;
                    state.output += prior.output + prev.output;
                    consume(value);
                    continue;
                }
                if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
                    const end = rest[1] !== void 0 ? '|$' : '';
                    state.output = state.output.slice(0, -(prior.output + prev.output).length);
                    prior.output = `(?:${prior.output}`;
                    prev.type = 'globstar';
                    prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
                    prev.value += value;
                    state.output += prior.output + prev.output;
                    state.globstar = true;
                    consume(value + advance());
                    push({
                        type: 'slash',
                        value: '/',
                        output: ''
                    });
                    continue;
                }
                if (prior.type === 'bos' && rest[0] === '/') {
                    prev.type = 'globstar';
                    prev.value += value;
                    prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
                    state.output = prev.output;
                    state.globstar = true;
                    consume(value + advance());
                    push({
                        type: 'slash',
                        value: '/',
                        output: ''
                    });
                    continue;
                }
                state.output = state.output.slice(0, -prev.output.length);
                prev.type = 'globstar';
                prev.output = globstar(opts);
                prev.value += value;
                state.output += prev.output;
                state.globstar = true;
                consume(value);
                continue;
            }
            const token = {
                type: 'star',
                value,
                output: star
            };
            if (opts.bash === true) {
                token.output = '.*?';
                if (prev.type === 'bos' || prev.type === 'slash') {
                    token.output = nodot + token.output;
                }
                push(token);
                continue;
            }
            if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
                token.output = value;
                push(token);
                continue;
            }
            if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
                if (prev.type === 'dot') {
                    state.output += NO_DOT_SLASH;
                    prev.output += NO_DOT_SLASH;
                } else if (opts.dot === true) {
                    state.output += NO_DOTS_SLASH;
                    prev.output += NO_DOTS_SLASH;
                } else {
                    state.output += nodot;
                    prev.output += nodot;
                }
                if (peek() !== '*') {
                    state.output += ONE_CHAR;
                    prev.output += ONE_CHAR;
                }
            }
            push(token);
        }
        while(state.brackets > 0){
            if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
            state.output = utils.escapeLast(state.output, '[');
            decrement('brackets');
        }
        while(state.parens > 0){
            if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
            state.output = utils.escapeLast(state.output, '(');
            decrement('parens');
        }
        while(state.braces > 0){
            if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
            state.output = utils.escapeLast(state.output, '{');
            decrement('braces');
        }
        if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
            push({
                type: 'maybe_slash',
                value: '',
                output: `${SLASH_LITERAL}?`
            });
        }
        if (state.backtrack === true) {
            state.output = '';
            for (const token of state.tokens){
                state.output += token.output != null ? token.output : token.value;
                if (token.suffix) {
                    state.output += token.suffix;
                }
            }
        }
        return state;
    };
    parse.fastpaths = (input, options)=>{
        const opts = {
            ...options
        };
        const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
        const len = input.length;
        if (len > max) {
            throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
        }
        input = REPLACEMENTS[input] || input;
        const win32 = utils.isWindows(options);
        const { DOT_LITERAL, SLASH_LITERAL, ONE_CHAR, DOTS_SLASH, NO_DOT, NO_DOTS, NO_DOTS_SLASH, STAR, START_ANCHOR } = constants.globChars(win32);
        const nodot = opts.dot ? NO_DOTS : NO_DOT;
        const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
        const capture = opts.capture ? '' : '?:';
        const state = {
            negated: false,
            prefix: ''
        };
        let star = opts.bash === true ? '.*?' : STAR;
        if (opts.capture) {
            star = `(${star})`;
        }
        const globstar = (opts)=>{
            if (opts.noglobstar === true) return star;
            return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
        };
        const create = (str)=>{
            switch(str){
                case '*':
                    return `${nodot}${ONE_CHAR}${star}`;
                case '.*':
                    return `${DOT_LITERAL}${ONE_CHAR}${star}`;
                case '*.*':
                    return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
                case '*/*':
                    return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
                case '**':
                    return nodot + globstar(opts);
                case '**/*':
                    return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
                case '**/*.*':
                    return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
                case '**/.*':
                    return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
                default:
                    {
                        const match = /^(.*?)\.(\w+)$/.exec(str);
                        if (!match) return;
                        const source = create(match[1]);
                        if (!source) return;
                        return source + DOT_LITERAL + match[2];
                    }
            }
        };
        const output = utils.removePrefix(input, state);
        let source = create(output);
        if (source && opts.strictSlashes !== true) {
            source += `${SLASH_LITERAL}?`;
        }
        return source;
    };
    module.exports = parse;
}
,
"3b94ec0c":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const fill = farmRequire("154d2100", true);
    const stringify = farmRequire("cb2ae164", true);
    const utils = farmRequire("1553b537", true);
    const append = (queue = '', stash = '', enclose = false)=>{
        const result = [];
        queue = [].concat(queue);
        stash = [].concat(stash);
        if (!stash.length) return queue;
        if (!queue.length) {
            return enclose ? utils.flatten(stash).map((ele)=>`{${ele}}`) : stash;
        }
        for (const item of queue){
            if (Array.isArray(item)) {
                for (const value of item){
                    result.push(append(value, stash, enclose));
                }
            } else {
                for (let ele of stash){
                    if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
                    result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
                }
            }
        }
        return utils.flatten(result);
    };
    const expand = (ast, options = {})=>{
        const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;
        const walk = (node, parent = {})=>{
            node.queue = [];
            let p = parent;
            let q = parent.queue;
            while(p.type !== 'brace' && p.type !== 'root' && p.parent){
                p = p.parent;
                q = p.queue;
            }
            if (node.invalid || node.dollar) {
                q.push(append(q.pop(), stringify(node, options)));
                return;
            }
            if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
                q.push(append(q.pop(), [
                    '{}'
                ]));
                return;
            }
            if (node.nodes && node.ranges > 0) {
                const args = utils.reduce(node.nodes);
                if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
                    throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
                }
                let range = fill(...args, options);
                if (range.length === 0) {
                    range = stringify(node, options);
                }
                q.push(append(q.pop(), range));
                node.nodes = [];
                return;
            }
            const enclose = utils.encloseBrace(node);
            let queue = node.queue;
            let block = node;
            while(block.type !== 'brace' && block.type !== 'root' && block.parent){
                block = block.parent;
                queue = block.queue;
            }
            for(let i = 0; i < node.nodes.length; i++){
                const child = node.nodes[i];
                if (child.type === 'comma' && node.type === 'brace') {
                    if (i === 1) queue.push('');
                    queue.push('');
                    continue;
                }
                if (child.type === 'close') {
                    q.push(append(q.pop(), queue, enclose));
                    continue;
                }
                if (child.value && child.type !== 'open') {
                    queue.push(append(queue.pop(), child.value));
                    continue;
                }
                if (child.nodes) {
                    walk(child, node);
                }
            }
            return queue;
        };
        return utils.flatten(walk(ast));
    };
    module.exports = expand;
}
,
"4341f5bc":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const stringify = farmRequire("cb2ae164", true);
    const { MAX_LENGTH, CHAR_BACKSLASH, CHAR_BACKTICK, CHAR_COMMA, CHAR_DOT, CHAR_LEFT_PARENTHESES, CHAR_RIGHT_PARENTHESES, CHAR_LEFT_CURLY_BRACE, CHAR_RIGHT_CURLY_BRACE, CHAR_LEFT_SQUARE_BRACKET, CHAR_RIGHT_SQUARE_BRACKET, CHAR_DOUBLE_QUOTE, CHAR_SINGLE_QUOTE, CHAR_NO_BREAK_SPACE, CHAR_ZERO_WIDTH_NOBREAK_SPACE } = farmRequire("f6cc3d3d", true);
    const parse = (input, options = {})=>{
        if (typeof input !== 'string') {
            throw new TypeError('Expected a string');
        }
        const opts = options || {};
        const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
        if (input.length > max) {
            throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
        }
        const ast = {
            type: 'root',
            input,
            nodes: []
        };
        const stack = [
            ast
        ];
        let block = ast;
        let prev = ast;
        let brackets = 0;
        const length = input.length;
        let index = 0;
        let depth = 0;
        let value;
        const advance = ()=>input[index++];
        const push = (node)=>{
            if (node.type === 'text' && prev.type === 'dot') {
                prev.type = 'text';
            }
            if (prev && prev.type === 'text' && node.type === 'text') {
                prev.value += node.value;
                return;
            }
            block.nodes.push(node);
            node.parent = block;
            node.prev = prev;
            prev = node;
            return node;
        };
        push({
            type: 'bos'
        });
        while(index < length){
            block = stack[stack.length - 1];
            value = advance();
            if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
                continue;
            }
            if (value === CHAR_BACKSLASH) {
                push({
                    type: 'text',
                    value: (options.keepEscaping ? value : '') + advance()
                });
                continue;
            }
            if (value === CHAR_RIGHT_SQUARE_BRACKET) {
                push({
                    type: 'text',
                    value: '\\' + value
                });
                continue;
            }
            if (value === CHAR_LEFT_SQUARE_BRACKET) {
                brackets++;
                let next;
                while(index < length && (next = advance())){
                    value += next;
                    if (next === CHAR_LEFT_SQUARE_BRACKET) {
                        brackets++;
                        continue;
                    }
                    if (next === CHAR_BACKSLASH) {
                        value += advance();
                        continue;
                    }
                    if (next === CHAR_RIGHT_SQUARE_BRACKET) {
                        brackets--;
                        if (brackets === 0) {
                            break;
                        }
                    }
                }
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (value === CHAR_LEFT_PARENTHESES) {
                block = push({
                    type: 'paren',
                    nodes: []
                });
                stack.push(block);
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (value === CHAR_RIGHT_PARENTHESES) {
                if (block.type !== 'paren') {
                    push({
                        type: 'text',
                        value
                    });
                    continue;
                }
                block = stack.pop();
                push({
                    type: 'text',
                    value
                });
                block = stack[stack.length - 1];
                continue;
            }
            if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
                const open = value;
                let next;
                if (options.keepQuotes !== true) {
                    value = '';
                }
                while(index < length && (next = advance())){
                    if (next === CHAR_BACKSLASH) {
                        value += next + advance();
                        continue;
                    }
                    if (next === open) {
                        if (options.keepQuotes === true) value += next;
                        break;
                    }
                    value += next;
                }
                push({
                    type: 'text',
                    value
                });
                continue;
            }
            if (value === CHAR_LEFT_CURLY_BRACE) {
                depth++;
                const dollar = prev.value && prev.value.slice(-1) === '$' || block.dollar === true;
                const brace = {
                    type: 'brace',
                    open: true,
                    close: false,
                    dollar,
                    depth,
                    commas: 0,
                    ranges: 0,
                    nodes: []
                };
                block = push(brace);
                stack.push(block);
                push({
                    type: 'open',
                    value
                });
                continue;
            }
            if (value === CHAR_RIGHT_CURLY_BRACE) {
                if (block.type !== 'brace') {
                    push({
                        type: 'text',
                        value
                    });
                    continue;
                }
                const type = 'close';
                block = stack.pop();
                block.close = true;
                push({
                    type,
                    value
                });
                depth--;
                block = stack[stack.length - 1];
                continue;
            }
            if (value === CHAR_COMMA && depth > 0) {
                if (block.ranges > 0) {
                    block.ranges = 0;
                    const open = block.nodes.shift();
                    block.nodes = [
                        open,
                        {
                            type: 'text',
                            value: stringify(block)
                        }
                    ];
                }
                push({
                    type: 'comma',
                    value
                });
                block.commas++;
                continue;
            }
            if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
                const siblings = block.nodes;
                if (depth === 0 || siblings.length === 0) {
                    push({
                        type: 'text',
                        value
                    });
                    continue;
                }
                if (prev.type === 'dot') {
                    block.range = [];
                    prev.value += value;
                    prev.type = 'range';
                    if (block.nodes.length !== 3 && block.nodes.length !== 5) {
                        block.invalid = true;
                        block.ranges = 0;
                        prev.type = 'text';
                        continue;
                    }
                    block.ranges++;
                    block.args = [];
                    continue;
                }
                if (prev.type === 'range') {
                    siblings.pop();
                    const before = siblings[siblings.length - 1];
                    before.value += prev.value + value;
                    prev = before;
                    block.ranges--;
                    continue;
                }
                push({
                    type: 'dot',
                    value
                });
                continue;
            }
            push({
                type: 'text',
                value
            });
        }
        do {
            block = stack.pop();
            if (block.type !== 'root') {
                block.nodes.forEach((node)=>{
                    if (!node.nodes) {
                        if (node.type === 'open') node.isOpen = true;
                        if (node.type === 'close') node.isClose = true;
                        if (!node.nodes) node.type = 'text';
                        node.invalid = true;
                    }
                });
                const parent = stack[stack.length - 1];
                const index = parent.nodes.indexOf(block);
                parent.nodes.splice(index, 1, ...block.nodes);
            }
        }while (stack.length > 0)
        push({
            type: 'eos'
        });
        return ast;
    };
    module.exports = parse;
}
,
"558bdb9c":/*!
 * to-regex-range <https://github.com/micromatch/to-regex-range>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */ function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const isNumber = farmRequire("98628c15", true);
    const toRegexRange = (min, max, options)=>{
        if (isNumber(min) === false) {
            throw new TypeError('toRegexRange: expected the first argument to be a number');
        }
        if (max === void 0 || min === max) {
            return String(min);
        }
        if (isNumber(max) === false) {
            throw new TypeError('toRegexRange: expected the second argument to be a number.');
        }
        let opts = {
            relaxZeros: true,
            ...options
        };
        if (typeof opts.strictZeros === 'boolean') {
            opts.relaxZeros = opts.strictZeros === false;
        }
        let relax = String(opts.relaxZeros);
        let shorthand = String(opts.shorthand);
        let capture = String(opts.capture);
        let wrap = String(opts.wrap);
        let cacheKey = min + ':' + max + '=' + relax + shorthand + capture + wrap;
        if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
            return toRegexRange.cache[cacheKey].result;
        }
        let a = Math.min(min, max);
        let b = Math.max(min, max);
        if (Math.abs(a - b) === 1) {
            let result = min + '|' + max;
            if (opts.capture) {
                return `(${result})`;
            }
            if (opts.wrap === false) {
                return result;
            }
            return `(?:${result})`;
        }
        let isPadded = hasPadding(min) || hasPadding(max);
        let state = {
            min,
            max,
            a,
            b
        };
        let positives = [];
        let negatives = [];
        if (isPadded) {
            state.isPadded = isPadded;
            state.maxLen = String(state.max).length;
        }
        if (a < 0) {
            let newMin = b < 0 ? Math.abs(b) : 1;
            negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
            a = state.a = 0;
        }
        if (b >= 0) {
            positives = splitToPatterns(a, b, state, opts);
        }
        state.negatives = negatives;
        state.positives = positives;
        state.result = collatePatterns(negatives, positives, opts);
        if (opts.capture === true) {
            state.result = `(${state.result})`;
        } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
            state.result = `(?:${state.result})`;
        }
        toRegexRange.cache[cacheKey] = state;
        return state.result;
    };
    function collatePatterns(neg, pos, options) {
        let onlyNegative = filterPatterns(neg, pos, '-', false, options) || [];
        let onlyPositive = filterPatterns(pos, neg, '', false, options) || [];
        let intersected = filterPatterns(neg, pos, '-?', true, options) || [];
        let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
        return subpatterns.join('|');
    }
    function splitToRanges(min, max) {
        let nines = 1;
        let zeros = 1;
        let stop = countNines(min, nines);
        let stops = new Set([
            max
        ]);
        while(min <= stop && stop <= max){
            stops.add(stop);
            nines += 1;
            stop = countNines(min, nines);
        }
        stop = countZeros(max + 1, zeros) - 1;
        while(min < stop && stop <= max){
            stops.add(stop);
            zeros += 1;
            stop = countZeros(max + 1, zeros) - 1;
        }
        stops = [
            ...stops
        ];
        stops.sort(compare);
        return stops;
    }
    function rangeToPattern(start, stop, options) {
        if (start === stop) {
            return {
                pattern: start,
                count: [],
                digits: 0
            };
        }
        let zipped = zip(start, stop);
        let digits = zipped.length;
        let pattern = '';
        let count = 0;
        for(let i = 0; i < digits; i++){
            let [startDigit, stopDigit] = zipped[i];
            if (startDigit === stopDigit) {
                pattern += startDigit;
            } else if (startDigit !== '0' || stopDigit !== '9') {
                pattern += toCharacterClass(startDigit, stopDigit, options);
            } else {
                count++;
            }
        }
        if (count) {
            pattern += options.shorthand === true ? '\\d' : '[0-9]';
        }
        return {
            pattern,
            count: [
                count
            ],
            digits
        };
    }
    function splitToPatterns(min, max, tok, options) {
        let ranges = splitToRanges(min, max);
        let tokens = [];
        let start = min;
        let prev;
        for(let i = 0; i < ranges.length; i++){
            let max = ranges[i];
            let obj = rangeToPattern(String(start), String(max), options);
            let zeros = '';
            if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
                if (prev.count.length > 1) {
                    prev.count.pop();
                }
                prev.count.push(obj.count[0]);
                prev.string = prev.pattern + toQuantifier(prev.count);
                start = max + 1;
                continue;
            }
            if (tok.isPadded) {
                zeros = padZeros(max, tok, options);
            }
            obj.string = zeros + obj.pattern + toQuantifier(obj.count);
            tokens.push(obj);
            start = max + 1;
            prev = obj;
        }
        return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options) {
        let result = [];
        for (let ele of arr){
            let { string } = ele;
            if (!intersection && !contains(comparison, 'string', string)) {
                result.push(prefix + string);
            }
            if (intersection && contains(comparison, 'string', string)) {
                result.push(prefix + string);
            }
        }
        return result;
    }
    function zip(a, b) {
        let arr = [];
        for(let i = 0; i < a.length; i++)arr.push([
            a[i],
            b[i]
        ]);
        return arr;
    }
    function compare(a, b) {
        return a > b ? 1 : b > a ? -1 : 0;
    }
    function contains(arr, key, val) {
        return arr.some((ele)=>ele[key] === val);
    }
    function countNines(min, len) {
        return Number(String(min).slice(0, -len) + '9'.repeat(len));
    }
    function countZeros(integer, zeros) {
        return integer - integer % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
        let [start = 0, stop = ''] = digits;
        if (stop || start > 1) {
            return `{${start + (stop ? ',' + stop : '')}}`;
        }
        return '';
    }
    function toCharacterClass(a, b, options) {
        return `[${a}${b - a === 1 ? '' : '-'}${b}]`;
    }
    function hasPadding(str) {
        return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options) {
        if (!tok.isPadded) {
            return value;
        }
        let diff = Math.abs(tok.maxLen - String(value).length);
        let relax = options.relaxZeros !== false;
        switch(diff){
            case 0:
                return '';
            case 1:
                return relax ? '0?' : '0';
            case 2:
                return relax ? '0{0,2}' : '00';
            default:
                {
                    return relax ? `0{0,${diff}}` : `0{${diff}}`;
                }
        }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = ()=>toRegexRange.cache = {};
    module.exports = toRegexRange;
}
,
"5e10cad5":function  (module, exports, farmRequire, farmDynamicRequire) {
    module.exports = {
        "application/1d-interleaved-parityfec": {
            "source": "iana"
        },
        "application/3gpdash-qoe-report+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/3gpp-ims+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/3gpphal+json": {
            "source": "iana",
            "compressible": true
        },
        "application/3gpphalforms+json": {
            "source": "iana",
            "compressible": true
        },
        "application/a2l": {
            "source": "iana"
        },
        "application/ace+cbor": {
            "source": "iana"
        },
        "application/activemessage": {
            "source": "iana"
        },
        "application/activity+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-costmap+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-costmapfilter+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-directory+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-endpointcost+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-endpointcostparams+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-endpointprop+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-endpointpropparams+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-error+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-networkmap+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-networkmapfilter+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-updatestreamcontrol+json": {
            "source": "iana",
            "compressible": true
        },
        "application/alto-updatestreamparams+json": {
            "source": "iana",
            "compressible": true
        },
        "application/aml": {
            "source": "iana"
        },
        "application/andrew-inset": {
            "source": "iana",
            "extensions": [
                "ez"
            ]
        },
        "application/applefile": {
            "source": "iana"
        },
        "application/applixware": {
            "source": "apache",
            "extensions": [
                "aw"
            ]
        },
        "application/at+jwt": {
            "source": "iana"
        },
        "application/atf": {
            "source": "iana"
        },
        "application/atfx": {
            "source": "iana"
        },
        "application/atom+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "atom"
            ]
        },
        "application/atomcat+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "atomcat"
            ]
        },
        "application/atomdeleted+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "atomdeleted"
            ]
        },
        "application/atomicmail": {
            "source": "iana"
        },
        "application/atomsvc+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "atomsvc"
            ]
        },
        "application/atsc-dwd+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "dwd"
            ]
        },
        "application/atsc-dynamic-event-message": {
            "source": "iana"
        },
        "application/atsc-held+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "held"
            ]
        },
        "application/atsc-rdt+json": {
            "source": "iana",
            "compressible": true
        },
        "application/atsc-rsat+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rsat"
            ]
        },
        "application/atxml": {
            "source": "iana"
        },
        "application/auth-policy+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/bacnet-xdd+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/batch-smtp": {
            "source": "iana"
        },
        "application/bdoc": {
            "compressible": false,
            "extensions": [
                "bdoc"
            ]
        },
        "application/beep+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/calendar+json": {
            "source": "iana",
            "compressible": true
        },
        "application/calendar+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xcs"
            ]
        },
        "application/call-completion": {
            "source": "iana"
        },
        "application/cals-1840": {
            "source": "iana"
        },
        "application/captive+json": {
            "source": "iana",
            "compressible": true
        },
        "application/cbor": {
            "source": "iana"
        },
        "application/cbor-seq": {
            "source": "iana"
        },
        "application/cccex": {
            "source": "iana"
        },
        "application/ccmp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/ccxml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ccxml"
            ]
        },
        "application/cdfx+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "cdfx"
            ]
        },
        "application/cdmi-capability": {
            "source": "iana",
            "extensions": [
                "cdmia"
            ]
        },
        "application/cdmi-container": {
            "source": "iana",
            "extensions": [
                "cdmic"
            ]
        },
        "application/cdmi-domain": {
            "source": "iana",
            "extensions": [
                "cdmid"
            ]
        },
        "application/cdmi-object": {
            "source": "iana",
            "extensions": [
                "cdmio"
            ]
        },
        "application/cdmi-queue": {
            "source": "iana",
            "extensions": [
                "cdmiq"
            ]
        },
        "application/cdni": {
            "source": "iana"
        },
        "application/cea": {
            "source": "iana"
        },
        "application/cea-2018+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/cellml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/cfw": {
            "source": "iana"
        },
        "application/city+json": {
            "source": "iana",
            "compressible": true
        },
        "application/clr": {
            "source": "iana"
        },
        "application/clue+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/clue_info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/cms": {
            "source": "iana"
        },
        "application/cnrp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/coap-group+json": {
            "source": "iana",
            "compressible": true
        },
        "application/coap-payload": {
            "source": "iana"
        },
        "application/commonground": {
            "source": "iana"
        },
        "application/conference-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/cose": {
            "source": "iana"
        },
        "application/cose-key": {
            "source": "iana"
        },
        "application/cose-key-set": {
            "source": "iana"
        },
        "application/cpl+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "cpl"
            ]
        },
        "application/csrattrs": {
            "source": "iana"
        },
        "application/csta+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/cstadata+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/csvm+json": {
            "source": "iana",
            "compressible": true
        },
        "application/cu-seeme": {
            "source": "apache",
            "extensions": [
                "cu"
            ]
        },
        "application/cwt": {
            "source": "iana"
        },
        "application/cybercash": {
            "source": "iana"
        },
        "application/dart": {
            "compressible": true
        },
        "application/dash+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mpd"
            ]
        },
        "application/dash-patch+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mpp"
            ]
        },
        "application/dashdelta": {
            "source": "iana"
        },
        "application/davmount+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "davmount"
            ]
        },
        "application/dca-rft": {
            "source": "iana"
        },
        "application/dcd": {
            "source": "iana"
        },
        "application/dec-dx": {
            "source": "iana"
        },
        "application/dialog-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/dicom": {
            "source": "iana"
        },
        "application/dicom+json": {
            "source": "iana",
            "compressible": true
        },
        "application/dicom+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/dii": {
            "source": "iana"
        },
        "application/dit": {
            "source": "iana"
        },
        "application/dns": {
            "source": "iana"
        },
        "application/dns+json": {
            "source": "iana",
            "compressible": true
        },
        "application/dns-message": {
            "source": "iana"
        },
        "application/docbook+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "dbk"
            ]
        },
        "application/dots+cbor": {
            "source": "iana"
        },
        "application/dskpp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/dssc+der": {
            "source": "iana",
            "extensions": [
                "dssc"
            ]
        },
        "application/dssc+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xdssc"
            ]
        },
        "application/dvcs": {
            "source": "iana"
        },
        "application/ecmascript": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "es",
                "ecma"
            ]
        },
        "application/edi-consent": {
            "source": "iana"
        },
        "application/edi-x12": {
            "source": "iana",
            "compressible": false
        },
        "application/edifact": {
            "source": "iana",
            "compressible": false
        },
        "application/efi": {
            "source": "iana"
        },
        "application/elm+json": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/elm+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.cap+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/emergencycalldata.comment+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.control+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.deviceinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.ecall.msd": {
            "source": "iana"
        },
        "application/emergencycalldata.providerinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.serviceinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.subscriberinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emergencycalldata.veds+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/emma+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "emma"
            ]
        },
        "application/emotionml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "emotionml"
            ]
        },
        "application/encaprtp": {
            "source": "iana"
        },
        "application/epp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/epub+zip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "epub"
            ]
        },
        "application/eshop": {
            "source": "iana"
        },
        "application/exi": {
            "source": "iana",
            "extensions": [
                "exi"
            ]
        },
        "application/expect-ct-report+json": {
            "source": "iana",
            "compressible": true
        },
        "application/express": {
            "source": "iana",
            "extensions": [
                "exp"
            ]
        },
        "application/fastinfoset": {
            "source": "iana"
        },
        "application/fastsoap": {
            "source": "iana"
        },
        "application/fdt+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "fdt"
            ]
        },
        "application/fhir+json": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/fhir+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/fido.trusted-apps+json": {
            "compressible": true
        },
        "application/fits": {
            "source": "iana"
        },
        "application/flexfec": {
            "source": "iana"
        },
        "application/font-sfnt": {
            "source": "iana"
        },
        "application/font-tdpfr": {
            "source": "iana",
            "extensions": [
                "pfr"
            ]
        },
        "application/font-woff": {
            "source": "iana",
            "compressible": false
        },
        "application/framework-attributes+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/geo+json": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "geojson"
            ]
        },
        "application/geo+json-seq": {
            "source": "iana"
        },
        "application/geopackage+sqlite3": {
            "source": "iana"
        },
        "application/geoxacml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/gltf-buffer": {
            "source": "iana"
        },
        "application/gml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "gml"
            ]
        },
        "application/gpx+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "gpx"
            ]
        },
        "application/gxf": {
            "source": "apache",
            "extensions": [
                "gxf"
            ]
        },
        "application/gzip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "gz"
            ]
        },
        "application/h224": {
            "source": "iana"
        },
        "application/held+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/hjson": {
            "extensions": [
                "hjson"
            ]
        },
        "application/http": {
            "source": "iana"
        },
        "application/hyperstudio": {
            "source": "iana",
            "extensions": [
                "stk"
            ]
        },
        "application/ibe-key-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/ibe-pkg-reply+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/ibe-pp-data": {
            "source": "iana"
        },
        "application/iges": {
            "source": "iana"
        },
        "application/im-iscomposing+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/index": {
            "source": "iana"
        },
        "application/index.cmd": {
            "source": "iana"
        },
        "application/index.obj": {
            "source": "iana"
        },
        "application/index.response": {
            "source": "iana"
        },
        "application/index.vnd": {
            "source": "iana"
        },
        "application/inkml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ink",
                "inkml"
            ]
        },
        "application/iotp": {
            "source": "iana"
        },
        "application/ipfix": {
            "source": "iana",
            "extensions": [
                "ipfix"
            ]
        },
        "application/ipp": {
            "source": "iana"
        },
        "application/isup": {
            "source": "iana"
        },
        "application/its+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "its"
            ]
        },
        "application/java-archive": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "jar",
                "war",
                "ear"
            ]
        },
        "application/java-serialized-object": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "ser"
            ]
        },
        "application/java-vm": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "class"
            ]
        },
        "application/javascript": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "js",
                "mjs"
            ]
        },
        "application/jf2feed+json": {
            "source": "iana",
            "compressible": true
        },
        "application/jose": {
            "source": "iana"
        },
        "application/jose+json": {
            "source": "iana",
            "compressible": true
        },
        "application/jrd+json": {
            "source": "iana",
            "compressible": true
        },
        "application/jscalendar+json": {
            "source": "iana",
            "compressible": true
        },
        "application/json": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "json",
                "map"
            ]
        },
        "application/json-patch+json": {
            "source": "iana",
            "compressible": true
        },
        "application/json-seq": {
            "source": "iana"
        },
        "application/json5": {
            "extensions": [
                "json5"
            ]
        },
        "application/jsonml+json": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "jsonml"
            ]
        },
        "application/jwk+json": {
            "source": "iana",
            "compressible": true
        },
        "application/jwk-set+json": {
            "source": "iana",
            "compressible": true
        },
        "application/jwt": {
            "source": "iana"
        },
        "application/kpml-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/kpml-response+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/ld+json": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "jsonld"
            ]
        },
        "application/lgr+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "lgr"
            ]
        },
        "application/link-format": {
            "source": "iana"
        },
        "application/load-control+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/lost+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "lostxml"
            ]
        },
        "application/lostsync+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/lpf+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/lxf": {
            "source": "iana"
        },
        "application/mac-binhex40": {
            "source": "iana",
            "extensions": [
                "hqx"
            ]
        },
        "application/mac-compactpro": {
            "source": "apache",
            "extensions": [
                "cpt"
            ]
        },
        "application/macwriteii": {
            "source": "iana"
        },
        "application/mads+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mads"
            ]
        },
        "application/manifest+json": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "webmanifest"
            ]
        },
        "application/marc": {
            "source": "iana",
            "extensions": [
                "mrc"
            ]
        },
        "application/marcxml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mrcx"
            ]
        },
        "application/mathematica": {
            "source": "iana",
            "extensions": [
                "ma",
                "nb",
                "mb"
            ]
        },
        "application/mathml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mathml"
            ]
        },
        "application/mathml-content+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mathml-presentation+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-associated-procedure-description+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-deregister+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-envelope+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-msk+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-msk-response+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-protection-description+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-reception-report+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-register+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-register-response+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-schedule+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbms-user-service-description+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mbox": {
            "source": "iana",
            "extensions": [
                "mbox"
            ]
        },
        "application/media-policy-dataset+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mpf"
            ]
        },
        "application/media_control+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mediaservercontrol+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mscml"
            ]
        },
        "application/merge-patch+json": {
            "source": "iana",
            "compressible": true
        },
        "application/metalink+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "metalink"
            ]
        },
        "application/metalink4+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "meta4"
            ]
        },
        "application/mets+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mets"
            ]
        },
        "application/mf4": {
            "source": "iana"
        },
        "application/mikey": {
            "source": "iana"
        },
        "application/mipc": {
            "source": "iana"
        },
        "application/missing-blocks+cbor-seq": {
            "source": "iana"
        },
        "application/mmt-aei+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "maei"
            ]
        },
        "application/mmt-usd+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "musd"
            ]
        },
        "application/mods+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mods"
            ]
        },
        "application/moss-keys": {
            "source": "iana"
        },
        "application/moss-signature": {
            "source": "iana"
        },
        "application/mosskey-data": {
            "source": "iana"
        },
        "application/mosskey-request": {
            "source": "iana"
        },
        "application/mp21": {
            "source": "iana",
            "extensions": [
                "m21",
                "mp21"
            ]
        },
        "application/mp4": {
            "source": "iana",
            "extensions": [
                "mp4s",
                "m4p"
            ]
        },
        "application/mpeg4-generic": {
            "source": "iana"
        },
        "application/mpeg4-iod": {
            "source": "iana"
        },
        "application/mpeg4-iod-xmt": {
            "source": "iana"
        },
        "application/mrb-consumer+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/mrb-publish+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/msc-ivr+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/msc-mixer+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/msword": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "doc",
                "dot"
            ]
        },
        "application/mud+json": {
            "source": "iana",
            "compressible": true
        },
        "application/multipart-core": {
            "source": "iana"
        },
        "application/mxf": {
            "source": "iana",
            "extensions": [
                "mxf"
            ]
        },
        "application/n-quads": {
            "source": "iana",
            "extensions": [
                "nq"
            ]
        },
        "application/n-triples": {
            "source": "iana",
            "extensions": [
                "nt"
            ]
        },
        "application/nasdata": {
            "source": "iana"
        },
        "application/news-checkgroups": {
            "source": "iana",
            "charset": "US-ASCII"
        },
        "application/news-groupinfo": {
            "source": "iana",
            "charset": "US-ASCII"
        },
        "application/news-transmission": {
            "source": "iana"
        },
        "application/nlsml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/node": {
            "source": "iana",
            "extensions": [
                "cjs"
            ]
        },
        "application/nss": {
            "source": "iana"
        },
        "application/oauth-authz-req+jwt": {
            "source": "iana"
        },
        "application/oblivious-dns-message": {
            "source": "iana"
        },
        "application/ocsp-request": {
            "source": "iana"
        },
        "application/ocsp-response": {
            "source": "iana"
        },
        "application/octet-stream": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "bin",
                "dms",
                "lrf",
                "mar",
                "so",
                "dist",
                "distz",
                "pkg",
                "bpk",
                "dump",
                "elc",
                "deploy",
                "exe",
                "dll",
                "deb",
                "dmg",
                "iso",
                "img",
                "msi",
                "msp",
                "msm",
                "buffer"
            ]
        },
        "application/oda": {
            "source": "iana",
            "extensions": [
                "oda"
            ]
        },
        "application/odm+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/odx": {
            "source": "iana"
        },
        "application/oebps-package+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "opf"
            ]
        },
        "application/ogg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "ogx"
            ]
        },
        "application/omdoc+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "omdoc"
            ]
        },
        "application/onenote": {
            "source": "apache",
            "extensions": [
                "onetoc",
                "onetoc2",
                "onetmp",
                "onepkg"
            ]
        },
        "application/opc-nodeset+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/oscore": {
            "source": "iana"
        },
        "application/oxps": {
            "source": "iana",
            "extensions": [
                "oxps"
            ]
        },
        "application/p21": {
            "source": "iana"
        },
        "application/p21+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/p2p-overlay+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "relo"
            ]
        },
        "application/parityfec": {
            "source": "iana"
        },
        "application/passport": {
            "source": "iana"
        },
        "application/patch-ops-error+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xer"
            ]
        },
        "application/pdf": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "pdf"
            ]
        },
        "application/pdx": {
            "source": "iana"
        },
        "application/pem-certificate-chain": {
            "source": "iana"
        },
        "application/pgp-encrypted": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "pgp"
            ]
        },
        "application/pgp-keys": {
            "source": "iana",
            "extensions": [
                "asc"
            ]
        },
        "application/pgp-signature": {
            "source": "iana",
            "extensions": [
                "asc",
                "sig"
            ]
        },
        "application/pics-rules": {
            "source": "apache",
            "extensions": [
                "prf"
            ]
        },
        "application/pidf+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/pidf-diff+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/pkcs10": {
            "source": "iana",
            "extensions": [
                "p10"
            ]
        },
        "application/pkcs12": {
            "source": "iana"
        },
        "application/pkcs7-mime": {
            "source": "iana",
            "extensions": [
                "p7m",
                "p7c"
            ]
        },
        "application/pkcs7-signature": {
            "source": "iana",
            "extensions": [
                "p7s"
            ]
        },
        "application/pkcs8": {
            "source": "iana",
            "extensions": [
                "p8"
            ]
        },
        "application/pkcs8-encrypted": {
            "source": "iana"
        },
        "application/pkix-attr-cert": {
            "source": "iana",
            "extensions": [
                "ac"
            ]
        },
        "application/pkix-cert": {
            "source": "iana",
            "extensions": [
                "cer"
            ]
        },
        "application/pkix-crl": {
            "source": "iana",
            "extensions": [
                "crl"
            ]
        },
        "application/pkix-pkipath": {
            "source": "iana",
            "extensions": [
                "pkipath"
            ]
        },
        "application/pkixcmp": {
            "source": "iana",
            "extensions": [
                "pki"
            ]
        },
        "application/pls+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "pls"
            ]
        },
        "application/poc-settings+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/postscript": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ai",
                "eps",
                "ps"
            ]
        },
        "application/ppsp-tracker+json": {
            "source": "iana",
            "compressible": true
        },
        "application/problem+json": {
            "source": "iana",
            "compressible": true
        },
        "application/problem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/provenance+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "provx"
            ]
        },
        "application/prs.alvestrand.titrax-sheet": {
            "source": "iana"
        },
        "application/prs.cww": {
            "source": "iana",
            "extensions": [
                "cww"
            ]
        },
        "application/prs.cyn": {
            "source": "iana",
            "charset": "7-BIT"
        },
        "application/prs.hpub+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/prs.nprend": {
            "source": "iana"
        },
        "application/prs.plucker": {
            "source": "iana"
        },
        "application/prs.rdf-xml-crypt": {
            "source": "iana"
        },
        "application/prs.xsf+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/pskc+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "pskcxml"
            ]
        },
        "application/pvd+json": {
            "source": "iana",
            "compressible": true
        },
        "application/qsig": {
            "source": "iana"
        },
        "application/raml+yaml": {
            "compressible": true,
            "extensions": [
                "raml"
            ]
        },
        "application/raptorfec": {
            "source": "iana"
        },
        "application/rdap+json": {
            "source": "iana",
            "compressible": true
        },
        "application/rdf+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rdf",
                "owl"
            ]
        },
        "application/reginfo+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rif"
            ]
        },
        "application/relax-ng-compact-syntax": {
            "source": "iana",
            "extensions": [
                "rnc"
            ]
        },
        "application/remote-printing": {
            "source": "iana"
        },
        "application/reputon+json": {
            "source": "iana",
            "compressible": true
        },
        "application/resource-lists+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rl"
            ]
        },
        "application/resource-lists-diff+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rld"
            ]
        },
        "application/rfc+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/riscos": {
            "source": "iana"
        },
        "application/rlmi+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/rls-services+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rs"
            ]
        },
        "application/route-apd+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rapd"
            ]
        },
        "application/route-s-tsid+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "sls"
            ]
        },
        "application/route-usd+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rusd"
            ]
        },
        "application/rpki-ghostbusters": {
            "source": "iana",
            "extensions": [
                "gbr"
            ]
        },
        "application/rpki-manifest": {
            "source": "iana",
            "extensions": [
                "mft"
            ]
        },
        "application/rpki-publication": {
            "source": "iana"
        },
        "application/rpki-roa": {
            "source": "iana",
            "extensions": [
                "roa"
            ]
        },
        "application/rpki-updown": {
            "source": "iana"
        },
        "application/rsd+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "rsd"
            ]
        },
        "application/rss+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "rss"
            ]
        },
        "application/rtf": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rtf"
            ]
        },
        "application/rtploopback": {
            "source": "iana"
        },
        "application/rtx": {
            "source": "iana"
        },
        "application/samlassertion+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/samlmetadata+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/sarif+json": {
            "source": "iana",
            "compressible": true
        },
        "application/sarif-external-properties+json": {
            "source": "iana",
            "compressible": true
        },
        "application/sbe": {
            "source": "iana"
        },
        "application/sbml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "sbml"
            ]
        },
        "application/scaip+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/scim+json": {
            "source": "iana",
            "compressible": true
        },
        "application/scvp-cv-request": {
            "source": "iana",
            "extensions": [
                "scq"
            ]
        },
        "application/scvp-cv-response": {
            "source": "iana",
            "extensions": [
                "scs"
            ]
        },
        "application/scvp-vp-request": {
            "source": "iana",
            "extensions": [
                "spq"
            ]
        },
        "application/scvp-vp-response": {
            "source": "iana",
            "extensions": [
                "spp"
            ]
        },
        "application/sdp": {
            "source": "iana",
            "extensions": [
                "sdp"
            ]
        },
        "application/secevent+jwt": {
            "source": "iana"
        },
        "application/senml+cbor": {
            "source": "iana"
        },
        "application/senml+json": {
            "source": "iana",
            "compressible": true
        },
        "application/senml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "senmlx"
            ]
        },
        "application/senml-etch+cbor": {
            "source": "iana"
        },
        "application/senml-etch+json": {
            "source": "iana",
            "compressible": true
        },
        "application/senml-exi": {
            "source": "iana"
        },
        "application/sensml+cbor": {
            "source": "iana"
        },
        "application/sensml+json": {
            "source": "iana",
            "compressible": true
        },
        "application/sensml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "sensmlx"
            ]
        },
        "application/sensml-exi": {
            "source": "iana"
        },
        "application/sep+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/sep-exi": {
            "source": "iana"
        },
        "application/session-info": {
            "source": "iana"
        },
        "application/set-payment": {
            "source": "iana"
        },
        "application/set-payment-initiation": {
            "source": "iana",
            "extensions": [
                "setpay"
            ]
        },
        "application/set-registration": {
            "source": "iana"
        },
        "application/set-registration-initiation": {
            "source": "iana",
            "extensions": [
                "setreg"
            ]
        },
        "application/sgml": {
            "source": "iana"
        },
        "application/sgml-open-catalog": {
            "source": "iana"
        },
        "application/shf+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "shf"
            ]
        },
        "application/sieve": {
            "source": "iana",
            "extensions": [
                "siv",
                "sieve"
            ]
        },
        "application/simple-filter+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/simple-message-summary": {
            "source": "iana"
        },
        "application/simplesymbolcontainer": {
            "source": "iana"
        },
        "application/sipc": {
            "source": "iana"
        },
        "application/slate": {
            "source": "iana"
        },
        "application/smil": {
            "source": "iana"
        },
        "application/smil+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "smi",
                "smil"
            ]
        },
        "application/smpte336m": {
            "source": "iana"
        },
        "application/soap+fastinfoset": {
            "source": "iana"
        },
        "application/soap+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/sparql-query": {
            "source": "iana",
            "extensions": [
                "rq"
            ]
        },
        "application/sparql-results+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "srx"
            ]
        },
        "application/spdx+json": {
            "source": "iana",
            "compressible": true
        },
        "application/spirits-event+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/sql": {
            "source": "iana"
        },
        "application/srgs": {
            "source": "iana",
            "extensions": [
                "gram"
            ]
        },
        "application/srgs+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "grxml"
            ]
        },
        "application/sru+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "sru"
            ]
        },
        "application/ssdl+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "ssdl"
            ]
        },
        "application/ssml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ssml"
            ]
        },
        "application/stix+json": {
            "source": "iana",
            "compressible": true
        },
        "application/swid+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "swidtag"
            ]
        },
        "application/tamp-apex-update": {
            "source": "iana"
        },
        "application/tamp-apex-update-confirm": {
            "source": "iana"
        },
        "application/tamp-community-update": {
            "source": "iana"
        },
        "application/tamp-community-update-confirm": {
            "source": "iana"
        },
        "application/tamp-error": {
            "source": "iana"
        },
        "application/tamp-sequence-adjust": {
            "source": "iana"
        },
        "application/tamp-sequence-adjust-confirm": {
            "source": "iana"
        },
        "application/tamp-status-query": {
            "source": "iana"
        },
        "application/tamp-status-response": {
            "source": "iana"
        },
        "application/tamp-update": {
            "source": "iana"
        },
        "application/tamp-update-confirm": {
            "source": "iana"
        },
        "application/tar": {
            "compressible": true
        },
        "application/taxii+json": {
            "source": "iana",
            "compressible": true
        },
        "application/td+json": {
            "source": "iana",
            "compressible": true
        },
        "application/tei+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "tei",
                "teicorpus"
            ]
        },
        "application/tetra_isi": {
            "source": "iana"
        },
        "application/thraud+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "tfi"
            ]
        },
        "application/timestamp-query": {
            "source": "iana"
        },
        "application/timestamp-reply": {
            "source": "iana"
        },
        "application/timestamped-data": {
            "source": "iana",
            "extensions": [
                "tsd"
            ]
        },
        "application/tlsrpt+gzip": {
            "source": "iana"
        },
        "application/tlsrpt+json": {
            "source": "iana",
            "compressible": true
        },
        "application/tnauthlist": {
            "source": "iana"
        },
        "application/token-introspection+jwt": {
            "source": "iana"
        },
        "application/toml": {
            "compressible": true,
            "extensions": [
                "toml"
            ]
        },
        "application/trickle-ice-sdpfrag": {
            "source": "iana"
        },
        "application/trig": {
            "source": "iana",
            "extensions": [
                "trig"
            ]
        },
        "application/ttml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ttml"
            ]
        },
        "application/tve-trigger": {
            "source": "iana"
        },
        "application/tzif": {
            "source": "iana"
        },
        "application/tzif-leap": {
            "source": "iana"
        },
        "application/ubjson": {
            "compressible": false,
            "extensions": [
                "ubj"
            ]
        },
        "application/ulpfec": {
            "source": "iana"
        },
        "application/urc-grpsheet+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/urc-ressheet+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rsheet"
            ]
        },
        "application/urc-targetdesc+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "td"
            ]
        },
        "application/urc-uisocketdesc+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vcard+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vcard+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vemmi": {
            "source": "iana"
        },
        "application/vividence.scriptfile": {
            "source": "apache"
        },
        "application/vnd.1000minds.decision-model+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "1km"
            ]
        },
        "application/vnd.3gpp-prose+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp-prose-pc3ch+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp-v2x-local-service-information": {
            "source": "iana"
        },
        "application/vnd.3gpp.5gnas": {
            "source": "iana"
        },
        "application/vnd.3gpp.access-transfer-events+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.bsf+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.gmop+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.gtpc": {
            "source": "iana"
        },
        "application/vnd.3gpp.interworking-data": {
            "source": "iana"
        },
        "application/vnd.3gpp.lpp": {
            "source": "iana"
        },
        "application/vnd.3gpp.mc-signalling-ear": {
            "source": "iana"
        },
        "application/vnd.3gpp.mcdata-affiliation-command+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcdata-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcdata-payload": {
            "source": "iana"
        },
        "application/vnd.3gpp.mcdata-service-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcdata-signalling": {
            "source": "iana"
        },
        "application/vnd.3gpp.mcdata-ue-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcdata-user-profile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-affiliation-command+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-floor-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-location-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-service-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-signed+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-ue-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-ue-init-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcptt-user-profile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-location-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-service-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-transmission-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-ue-config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mcvideo-user-profile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.mid-call+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.ngap": {
            "source": "iana"
        },
        "application/vnd.3gpp.pfcp": {
            "source": "iana"
        },
        "application/vnd.3gpp.pic-bw-large": {
            "source": "iana",
            "extensions": [
                "plb"
            ]
        },
        "application/vnd.3gpp.pic-bw-small": {
            "source": "iana",
            "extensions": [
                "psb"
            ]
        },
        "application/vnd.3gpp.pic-bw-var": {
            "source": "iana",
            "extensions": [
                "pvb"
            ]
        },
        "application/vnd.3gpp.s1ap": {
            "source": "iana"
        },
        "application/vnd.3gpp.sms": {
            "source": "iana"
        },
        "application/vnd.3gpp.sms+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.srvcc-ext+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.srvcc-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.state-and-event-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp.ussd+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp2.bcmcsinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.3gpp2.sms": {
            "source": "iana"
        },
        "application/vnd.3gpp2.tcap": {
            "source": "iana",
            "extensions": [
                "tcap"
            ]
        },
        "application/vnd.3lightssoftware.imagescal": {
            "source": "iana"
        },
        "application/vnd.3m.post-it-notes": {
            "source": "iana",
            "extensions": [
                "pwn"
            ]
        },
        "application/vnd.accpac.simply.aso": {
            "source": "iana",
            "extensions": [
                "aso"
            ]
        },
        "application/vnd.accpac.simply.imp": {
            "source": "iana",
            "extensions": [
                "imp"
            ]
        },
        "application/vnd.acucobol": {
            "source": "iana",
            "extensions": [
                "acu"
            ]
        },
        "application/vnd.acucorp": {
            "source": "iana",
            "extensions": [
                "atc",
                "acutc"
            ]
        },
        "application/vnd.adobe.air-application-installer-package+zip": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "air"
            ]
        },
        "application/vnd.adobe.flash.movie": {
            "source": "iana"
        },
        "application/vnd.adobe.formscentral.fcdt": {
            "source": "iana",
            "extensions": [
                "fcdt"
            ]
        },
        "application/vnd.adobe.fxp": {
            "source": "iana",
            "extensions": [
                "fxp",
                "fxpl"
            ]
        },
        "application/vnd.adobe.partial-upload": {
            "source": "iana"
        },
        "application/vnd.adobe.xdp+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xdp"
            ]
        },
        "application/vnd.adobe.xfdf": {
            "source": "iana",
            "extensions": [
                "xfdf"
            ]
        },
        "application/vnd.aether.imp": {
            "source": "iana"
        },
        "application/vnd.afpc.afplinedata": {
            "source": "iana"
        },
        "application/vnd.afpc.afplinedata-pagedef": {
            "source": "iana"
        },
        "application/vnd.afpc.cmoca-cmresource": {
            "source": "iana"
        },
        "application/vnd.afpc.foca-charset": {
            "source": "iana"
        },
        "application/vnd.afpc.foca-codedfont": {
            "source": "iana"
        },
        "application/vnd.afpc.foca-codepage": {
            "source": "iana"
        },
        "application/vnd.afpc.modca": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-cmtable": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-formdef": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-mediummap": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-objectcontainer": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-overlay": {
            "source": "iana"
        },
        "application/vnd.afpc.modca-pagesegment": {
            "source": "iana"
        },
        "application/vnd.age": {
            "source": "iana",
            "extensions": [
                "age"
            ]
        },
        "application/vnd.ah-barcode": {
            "source": "iana"
        },
        "application/vnd.ahead.space": {
            "source": "iana",
            "extensions": [
                "ahead"
            ]
        },
        "application/vnd.airzip.filesecure.azf": {
            "source": "iana",
            "extensions": [
                "azf"
            ]
        },
        "application/vnd.airzip.filesecure.azs": {
            "source": "iana",
            "extensions": [
                "azs"
            ]
        },
        "application/vnd.amadeus+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.amazon.ebook": {
            "source": "apache",
            "extensions": [
                "azw"
            ]
        },
        "application/vnd.amazon.mobi8-ebook": {
            "source": "iana"
        },
        "application/vnd.americandynamics.acc": {
            "source": "iana",
            "extensions": [
                "acc"
            ]
        },
        "application/vnd.amiga.ami": {
            "source": "iana",
            "extensions": [
                "ami"
            ]
        },
        "application/vnd.amundsen.maze+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.android.ota": {
            "source": "iana"
        },
        "application/vnd.android.package-archive": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "apk"
            ]
        },
        "application/vnd.anki": {
            "source": "iana"
        },
        "application/vnd.anser-web-certificate-issue-initiation": {
            "source": "iana",
            "extensions": [
                "cii"
            ]
        },
        "application/vnd.anser-web-funds-transfer-initiation": {
            "source": "apache",
            "extensions": [
                "fti"
            ]
        },
        "application/vnd.antix.game-component": {
            "source": "iana",
            "extensions": [
                "atx"
            ]
        },
        "application/vnd.apache.arrow.file": {
            "source": "iana"
        },
        "application/vnd.apache.arrow.stream": {
            "source": "iana"
        },
        "application/vnd.apache.thrift.binary": {
            "source": "iana"
        },
        "application/vnd.apache.thrift.compact": {
            "source": "iana"
        },
        "application/vnd.apache.thrift.json": {
            "source": "iana"
        },
        "application/vnd.api+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.aplextor.warrp+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.apothekende.reservation+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.apple.installer+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mpkg"
            ]
        },
        "application/vnd.apple.keynote": {
            "source": "iana",
            "extensions": [
                "key"
            ]
        },
        "application/vnd.apple.mpegurl": {
            "source": "iana",
            "extensions": [
                "m3u8"
            ]
        },
        "application/vnd.apple.numbers": {
            "source": "iana",
            "extensions": [
                "numbers"
            ]
        },
        "application/vnd.apple.pages": {
            "source": "iana",
            "extensions": [
                "pages"
            ]
        },
        "application/vnd.apple.pkpass": {
            "compressible": false,
            "extensions": [
                "pkpass"
            ]
        },
        "application/vnd.arastra.swi": {
            "source": "iana"
        },
        "application/vnd.aristanetworks.swi": {
            "source": "iana",
            "extensions": [
                "swi"
            ]
        },
        "application/vnd.artisan+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.artsquare": {
            "source": "iana"
        },
        "application/vnd.astraea-software.iota": {
            "source": "iana",
            "extensions": [
                "iota"
            ]
        },
        "application/vnd.audiograph": {
            "source": "iana",
            "extensions": [
                "aep"
            ]
        },
        "application/vnd.autopackage": {
            "source": "iana"
        },
        "application/vnd.avalon+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.avistar+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.balsamiq.bmml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "bmml"
            ]
        },
        "application/vnd.balsamiq.bmpr": {
            "source": "iana"
        },
        "application/vnd.banana-accounting": {
            "source": "iana"
        },
        "application/vnd.bbf.usp.error": {
            "source": "iana"
        },
        "application/vnd.bbf.usp.msg": {
            "source": "iana"
        },
        "application/vnd.bbf.usp.msg+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.bekitzur-stech+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.bint.med-content": {
            "source": "iana"
        },
        "application/vnd.biopax.rdf+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.blink-idb-value-wrapper": {
            "source": "iana"
        },
        "application/vnd.blueice.multipass": {
            "source": "iana",
            "extensions": [
                "mpm"
            ]
        },
        "application/vnd.bluetooth.ep.oob": {
            "source": "iana"
        },
        "application/vnd.bluetooth.le.oob": {
            "source": "iana"
        },
        "application/vnd.bmi": {
            "source": "iana",
            "extensions": [
                "bmi"
            ]
        },
        "application/vnd.bpf": {
            "source": "iana"
        },
        "application/vnd.bpf3": {
            "source": "iana"
        },
        "application/vnd.businessobjects": {
            "source": "iana",
            "extensions": [
                "rep"
            ]
        },
        "application/vnd.byu.uapi+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cab-jscript": {
            "source": "iana"
        },
        "application/vnd.canon-cpdl": {
            "source": "iana"
        },
        "application/vnd.canon-lips": {
            "source": "iana"
        },
        "application/vnd.capasystems-pg+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cendio.thinlinc.clientconf": {
            "source": "iana"
        },
        "application/vnd.century-systems.tcp_stream": {
            "source": "iana"
        },
        "application/vnd.chemdraw+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "cdxml"
            ]
        },
        "application/vnd.chess-pgn": {
            "source": "iana"
        },
        "application/vnd.chipnuts.karaoke-mmd": {
            "source": "iana",
            "extensions": [
                "mmd"
            ]
        },
        "application/vnd.ciedi": {
            "source": "iana"
        },
        "application/vnd.cinderella": {
            "source": "iana",
            "extensions": [
                "cdy"
            ]
        },
        "application/vnd.cirpack.isdn-ext": {
            "source": "iana"
        },
        "application/vnd.citationstyles.style+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "csl"
            ]
        },
        "application/vnd.claymore": {
            "source": "iana",
            "extensions": [
                "cla"
            ]
        },
        "application/vnd.cloanto.rp9": {
            "source": "iana",
            "extensions": [
                "rp9"
            ]
        },
        "application/vnd.clonk.c4group": {
            "source": "iana",
            "extensions": [
                "c4g",
                "c4d",
                "c4f",
                "c4p",
                "c4u"
            ]
        },
        "application/vnd.cluetrust.cartomobile-config": {
            "source": "iana",
            "extensions": [
                "c11amc"
            ]
        },
        "application/vnd.cluetrust.cartomobile-config-pkg": {
            "source": "iana",
            "extensions": [
                "c11amz"
            ]
        },
        "application/vnd.coffeescript": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.document": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.document-template": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.presentation": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.presentation-template": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.spreadsheet": {
            "source": "iana"
        },
        "application/vnd.collabio.xodocuments.spreadsheet-template": {
            "source": "iana"
        },
        "application/vnd.collection+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.collection.doc+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.collection.next+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.comicbook+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.comicbook-rar": {
            "source": "iana"
        },
        "application/vnd.commerce-battelle": {
            "source": "iana"
        },
        "application/vnd.commonspace": {
            "source": "iana",
            "extensions": [
                "csp"
            ]
        },
        "application/vnd.contact.cmsg": {
            "source": "iana",
            "extensions": [
                "cdbcmsg"
            ]
        },
        "application/vnd.coreos.ignition+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cosmocaller": {
            "source": "iana",
            "extensions": [
                "cmc"
            ]
        },
        "application/vnd.crick.clicker": {
            "source": "iana",
            "extensions": [
                "clkx"
            ]
        },
        "application/vnd.crick.clicker.keyboard": {
            "source": "iana",
            "extensions": [
                "clkk"
            ]
        },
        "application/vnd.crick.clicker.palette": {
            "source": "iana",
            "extensions": [
                "clkp"
            ]
        },
        "application/vnd.crick.clicker.template": {
            "source": "iana",
            "extensions": [
                "clkt"
            ]
        },
        "application/vnd.crick.clicker.wordbank": {
            "source": "iana",
            "extensions": [
                "clkw"
            ]
        },
        "application/vnd.criticaltools.wbs+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wbs"
            ]
        },
        "application/vnd.cryptii.pipe+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.crypto-shade-file": {
            "source": "iana"
        },
        "application/vnd.cryptomator.encrypted": {
            "source": "iana"
        },
        "application/vnd.cryptomator.vault": {
            "source": "iana"
        },
        "application/vnd.ctc-posml": {
            "source": "iana",
            "extensions": [
                "pml"
            ]
        },
        "application/vnd.ctct.ws+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cups-pdf": {
            "source": "iana"
        },
        "application/vnd.cups-postscript": {
            "source": "iana"
        },
        "application/vnd.cups-ppd": {
            "source": "iana",
            "extensions": [
                "ppd"
            ]
        },
        "application/vnd.cups-raster": {
            "source": "iana"
        },
        "application/vnd.cups-raw": {
            "source": "iana"
        },
        "application/vnd.curl": {
            "source": "iana"
        },
        "application/vnd.curl.car": {
            "source": "apache",
            "extensions": [
                "car"
            ]
        },
        "application/vnd.curl.pcurl": {
            "source": "apache",
            "extensions": [
                "pcurl"
            ]
        },
        "application/vnd.cyan.dean.root+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cybank": {
            "source": "iana"
        },
        "application/vnd.cyclonedx+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.cyclonedx+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.d2l.coursepackage1p0+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.d3m-dataset": {
            "source": "iana"
        },
        "application/vnd.d3m-problem": {
            "source": "iana"
        },
        "application/vnd.dart": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "dart"
            ]
        },
        "application/vnd.data-vision.rdz": {
            "source": "iana",
            "extensions": [
                "rdz"
            ]
        },
        "application/vnd.datapackage+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dataresource+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dbf": {
            "source": "iana",
            "extensions": [
                "dbf"
            ]
        },
        "application/vnd.debian.binary-package": {
            "source": "iana"
        },
        "application/vnd.dece.data": {
            "source": "iana",
            "extensions": [
                "uvf",
                "uvvf",
                "uvd",
                "uvvd"
            ]
        },
        "application/vnd.dece.ttml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "uvt",
                "uvvt"
            ]
        },
        "application/vnd.dece.unspecified": {
            "source": "iana",
            "extensions": [
                "uvx",
                "uvvx"
            ]
        },
        "application/vnd.dece.zip": {
            "source": "iana",
            "extensions": [
                "uvz",
                "uvvz"
            ]
        },
        "application/vnd.denovo.fcselayout-link": {
            "source": "iana",
            "extensions": [
                "fe_launch"
            ]
        },
        "application/vnd.desmume.movie": {
            "source": "iana"
        },
        "application/vnd.dir-bi.plate-dl-nosuffix": {
            "source": "iana"
        },
        "application/vnd.dm.delegation+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dna": {
            "source": "iana",
            "extensions": [
                "dna"
            ]
        },
        "application/vnd.document+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dolby.mlp": {
            "source": "apache",
            "extensions": [
                "mlp"
            ]
        },
        "application/vnd.dolby.mobile.1": {
            "source": "iana"
        },
        "application/vnd.dolby.mobile.2": {
            "source": "iana"
        },
        "application/vnd.doremir.scorecloud-binary-document": {
            "source": "iana"
        },
        "application/vnd.dpgraph": {
            "source": "iana",
            "extensions": [
                "dpg"
            ]
        },
        "application/vnd.dreamfactory": {
            "source": "iana",
            "extensions": [
                "dfac"
            ]
        },
        "application/vnd.drive+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ds-keypoint": {
            "source": "apache",
            "extensions": [
                "kpxx"
            ]
        },
        "application/vnd.dtg.local": {
            "source": "iana"
        },
        "application/vnd.dtg.local.flash": {
            "source": "iana"
        },
        "application/vnd.dtg.local.html": {
            "source": "iana"
        },
        "application/vnd.dvb.ait": {
            "source": "iana",
            "extensions": [
                "ait"
            ]
        },
        "application/vnd.dvb.dvbisl+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.dvbj": {
            "source": "iana"
        },
        "application/vnd.dvb.esgcontainer": {
            "source": "iana"
        },
        "application/vnd.dvb.ipdcdftnotifaccess": {
            "source": "iana"
        },
        "application/vnd.dvb.ipdcesgaccess": {
            "source": "iana"
        },
        "application/vnd.dvb.ipdcesgaccess2": {
            "source": "iana"
        },
        "application/vnd.dvb.ipdcesgpdd": {
            "source": "iana"
        },
        "application/vnd.dvb.ipdcroaming": {
            "source": "iana"
        },
        "application/vnd.dvb.iptv.alfec-base": {
            "source": "iana"
        },
        "application/vnd.dvb.iptv.alfec-enhancement": {
            "source": "iana"
        },
        "application/vnd.dvb.notif-aggregate-root+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-container+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-generic+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-ia-msglist+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-ia-registration-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-ia-registration-response+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.notif-init+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.dvb.pfr": {
            "source": "iana"
        },
        "application/vnd.dvb.service": {
            "source": "iana",
            "extensions": [
                "svc"
            ]
        },
        "application/vnd.dxr": {
            "source": "iana"
        },
        "application/vnd.dynageo": {
            "source": "iana",
            "extensions": [
                "geo"
            ]
        },
        "application/vnd.dzr": {
            "source": "iana"
        },
        "application/vnd.easykaraoke.cdgdownload": {
            "source": "iana"
        },
        "application/vnd.ecdis-update": {
            "source": "iana"
        },
        "application/vnd.ecip.rlp": {
            "source": "iana"
        },
        "application/vnd.eclipse.ditto+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ecowin.chart": {
            "source": "iana",
            "extensions": [
                "mag"
            ]
        },
        "application/vnd.ecowin.filerequest": {
            "source": "iana"
        },
        "application/vnd.ecowin.fileupdate": {
            "source": "iana"
        },
        "application/vnd.ecowin.series": {
            "source": "iana"
        },
        "application/vnd.ecowin.seriesrequest": {
            "source": "iana"
        },
        "application/vnd.ecowin.seriesupdate": {
            "source": "iana"
        },
        "application/vnd.efi.img": {
            "source": "iana"
        },
        "application/vnd.efi.iso": {
            "source": "iana"
        },
        "application/vnd.emclient.accessrequest+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.enliven": {
            "source": "iana",
            "extensions": [
                "nml"
            ]
        },
        "application/vnd.enphase.envoy": {
            "source": "iana"
        },
        "application/vnd.eprints.data+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.epson.esf": {
            "source": "iana",
            "extensions": [
                "esf"
            ]
        },
        "application/vnd.epson.msf": {
            "source": "iana",
            "extensions": [
                "msf"
            ]
        },
        "application/vnd.epson.quickanime": {
            "source": "iana",
            "extensions": [
                "qam"
            ]
        },
        "application/vnd.epson.salt": {
            "source": "iana",
            "extensions": [
                "slt"
            ]
        },
        "application/vnd.epson.ssf": {
            "source": "iana",
            "extensions": [
                "ssf"
            ]
        },
        "application/vnd.ericsson.quickcall": {
            "source": "iana"
        },
        "application/vnd.espass-espass+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.eszigno3+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "es3",
                "et3"
            ]
        },
        "application/vnd.etsi.aoc+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.asic-e+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.etsi.asic-s+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.etsi.cug+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvcommand+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvdiscovery+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvprofile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvsad-bc+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvsad-cod+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvsad-npvr+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvservice+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvsync+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.iptvueprofile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.mcid+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.mheg5": {
            "source": "iana"
        },
        "application/vnd.etsi.overload-control-policy-dataset+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.pstn+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.sci+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.simservs+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.timestamp-token": {
            "source": "iana"
        },
        "application/vnd.etsi.tsl+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.etsi.tsl.der": {
            "source": "iana"
        },
        "application/vnd.eu.kasparian.car+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.eudora.data": {
            "source": "iana"
        },
        "application/vnd.evolv.ecig.profile": {
            "source": "iana"
        },
        "application/vnd.evolv.ecig.settings": {
            "source": "iana"
        },
        "application/vnd.evolv.ecig.theme": {
            "source": "iana"
        },
        "application/vnd.exstream-empower+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.exstream-package": {
            "source": "iana"
        },
        "application/vnd.ezpix-album": {
            "source": "iana",
            "extensions": [
                "ez2"
            ]
        },
        "application/vnd.ezpix-package": {
            "source": "iana",
            "extensions": [
                "ez3"
            ]
        },
        "application/vnd.f-secure.mobile": {
            "source": "iana"
        },
        "application/vnd.familysearch.gedcom+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.fastcopy-disk-image": {
            "source": "iana"
        },
        "application/vnd.fdf": {
            "source": "iana",
            "extensions": [
                "fdf"
            ]
        },
        "application/vnd.fdsn.mseed": {
            "source": "iana",
            "extensions": [
                "mseed"
            ]
        },
        "application/vnd.fdsn.seed": {
            "source": "iana",
            "extensions": [
                "seed",
                "dataless"
            ]
        },
        "application/vnd.ffsns": {
            "source": "iana"
        },
        "application/vnd.ficlab.flb+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.filmit.zfc": {
            "source": "iana"
        },
        "application/vnd.fints": {
            "source": "iana"
        },
        "application/vnd.firemonkeys.cloudcell": {
            "source": "iana"
        },
        "application/vnd.flographit": {
            "source": "iana",
            "extensions": [
                "gph"
            ]
        },
        "application/vnd.fluxtime.clip": {
            "source": "iana",
            "extensions": [
                "ftc"
            ]
        },
        "application/vnd.font-fontforge-sfd": {
            "source": "iana"
        },
        "application/vnd.framemaker": {
            "source": "iana",
            "extensions": [
                "fm",
                "frame",
                "maker",
                "book"
            ]
        },
        "application/vnd.frogans.fnc": {
            "source": "iana",
            "extensions": [
                "fnc"
            ]
        },
        "application/vnd.frogans.ltf": {
            "source": "iana",
            "extensions": [
                "ltf"
            ]
        },
        "application/vnd.fsc.weblaunch": {
            "source": "iana",
            "extensions": [
                "fsc"
            ]
        },
        "application/vnd.fujifilm.fb.docuworks": {
            "source": "iana"
        },
        "application/vnd.fujifilm.fb.docuworks.binder": {
            "source": "iana"
        },
        "application/vnd.fujifilm.fb.docuworks.container": {
            "source": "iana"
        },
        "application/vnd.fujifilm.fb.jfi+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.fujitsu.oasys": {
            "source": "iana",
            "extensions": [
                "oas"
            ]
        },
        "application/vnd.fujitsu.oasys2": {
            "source": "iana",
            "extensions": [
                "oa2"
            ]
        },
        "application/vnd.fujitsu.oasys3": {
            "source": "iana",
            "extensions": [
                "oa3"
            ]
        },
        "application/vnd.fujitsu.oasysgp": {
            "source": "iana",
            "extensions": [
                "fg5"
            ]
        },
        "application/vnd.fujitsu.oasysprs": {
            "source": "iana",
            "extensions": [
                "bh2"
            ]
        },
        "application/vnd.fujixerox.art-ex": {
            "source": "iana"
        },
        "application/vnd.fujixerox.art4": {
            "source": "iana"
        },
        "application/vnd.fujixerox.ddd": {
            "source": "iana",
            "extensions": [
                "ddd"
            ]
        },
        "application/vnd.fujixerox.docuworks": {
            "source": "iana",
            "extensions": [
                "xdw"
            ]
        },
        "application/vnd.fujixerox.docuworks.binder": {
            "source": "iana",
            "extensions": [
                "xbd"
            ]
        },
        "application/vnd.fujixerox.docuworks.container": {
            "source": "iana"
        },
        "application/vnd.fujixerox.hbpl": {
            "source": "iana"
        },
        "application/vnd.fut-misnet": {
            "source": "iana"
        },
        "application/vnd.futoin+cbor": {
            "source": "iana"
        },
        "application/vnd.futoin+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.fuzzysheet": {
            "source": "iana",
            "extensions": [
                "fzs"
            ]
        },
        "application/vnd.genomatix.tuxedo": {
            "source": "iana",
            "extensions": [
                "txd"
            ]
        },
        "application/vnd.gentics.grd+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.geo+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.geocube+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.geogebra.file": {
            "source": "iana",
            "extensions": [
                "ggb"
            ]
        },
        "application/vnd.geogebra.slides": {
            "source": "iana"
        },
        "application/vnd.geogebra.tool": {
            "source": "iana",
            "extensions": [
                "ggt"
            ]
        },
        "application/vnd.geometry-explorer": {
            "source": "iana",
            "extensions": [
                "gex",
                "gre"
            ]
        },
        "application/vnd.geonext": {
            "source": "iana",
            "extensions": [
                "gxt"
            ]
        },
        "application/vnd.geoplan": {
            "source": "iana",
            "extensions": [
                "g2w"
            ]
        },
        "application/vnd.geospace": {
            "source": "iana",
            "extensions": [
                "g3w"
            ]
        },
        "application/vnd.gerber": {
            "source": "iana"
        },
        "application/vnd.globalplatform.card-content-mgt": {
            "source": "iana"
        },
        "application/vnd.globalplatform.card-content-mgt-response": {
            "source": "iana"
        },
        "application/vnd.gmx": {
            "source": "iana",
            "extensions": [
                "gmx"
            ]
        },
        "application/vnd.google-apps.document": {
            "compressible": false,
            "extensions": [
                "gdoc"
            ]
        },
        "application/vnd.google-apps.presentation": {
            "compressible": false,
            "extensions": [
                "gslides"
            ]
        },
        "application/vnd.google-apps.spreadsheet": {
            "compressible": false,
            "extensions": [
                "gsheet"
            ]
        },
        "application/vnd.google-earth.kml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "kml"
            ]
        },
        "application/vnd.google-earth.kmz": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "kmz"
            ]
        },
        "application/vnd.gov.sk.e-form+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.gov.sk.e-form+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.gov.sk.xmldatacontainer+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.grafeq": {
            "source": "iana",
            "extensions": [
                "gqf",
                "gqs"
            ]
        },
        "application/vnd.gridmp": {
            "source": "iana"
        },
        "application/vnd.groove-account": {
            "source": "iana",
            "extensions": [
                "gac"
            ]
        },
        "application/vnd.groove-help": {
            "source": "iana",
            "extensions": [
                "ghf"
            ]
        },
        "application/vnd.groove-identity-message": {
            "source": "iana",
            "extensions": [
                "gim"
            ]
        },
        "application/vnd.groove-injector": {
            "source": "iana",
            "extensions": [
                "grv"
            ]
        },
        "application/vnd.groove-tool-message": {
            "source": "iana",
            "extensions": [
                "gtm"
            ]
        },
        "application/vnd.groove-tool-template": {
            "source": "iana",
            "extensions": [
                "tpl"
            ]
        },
        "application/vnd.groove-vcard": {
            "source": "iana",
            "extensions": [
                "vcg"
            ]
        },
        "application/vnd.hal+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hal+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "hal"
            ]
        },
        "application/vnd.handheld-entertainment+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "zmm"
            ]
        },
        "application/vnd.hbci": {
            "source": "iana",
            "extensions": [
                "hbci"
            ]
        },
        "application/vnd.hc+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hcl-bireports": {
            "source": "iana"
        },
        "application/vnd.hdt": {
            "source": "iana"
        },
        "application/vnd.heroku+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hhe.lesson-player": {
            "source": "iana",
            "extensions": [
                "les"
            ]
        },
        "application/vnd.hl7cda+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.hl7v2+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.hp-hpgl": {
            "source": "iana",
            "extensions": [
                "hpgl"
            ]
        },
        "application/vnd.hp-hpid": {
            "source": "iana",
            "extensions": [
                "hpid"
            ]
        },
        "application/vnd.hp-hps": {
            "source": "iana",
            "extensions": [
                "hps"
            ]
        },
        "application/vnd.hp-jlyt": {
            "source": "iana",
            "extensions": [
                "jlt"
            ]
        },
        "application/vnd.hp-pcl": {
            "source": "iana",
            "extensions": [
                "pcl"
            ]
        },
        "application/vnd.hp-pclxl": {
            "source": "iana",
            "extensions": [
                "pclxl"
            ]
        },
        "application/vnd.httphone": {
            "source": "iana"
        },
        "application/vnd.hydrostatix.sof-data": {
            "source": "iana",
            "extensions": [
                "sfd-hdstx"
            ]
        },
        "application/vnd.hyper+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hyper-item+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hyperdrive+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.hzn-3d-crossword": {
            "source": "iana"
        },
        "application/vnd.ibm.afplinedata": {
            "source": "iana"
        },
        "application/vnd.ibm.electronic-media": {
            "source": "iana"
        },
        "application/vnd.ibm.minipay": {
            "source": "iana",
            "extensions": [
                "mpy"
            ]
        },
        "application/vnd.ibm.modcap": {
            "source": "iana",
            "extensions": [
                "afp",
                "listafp",
                "list3820"
            ]
        },
        "application/vnd.ibm.rights-management": {
            "source": "iana",
            "extensions": [
                "irm"
            ]
        },
        "application/vnd.ibm.secure-container": {
            "source": "iana",
            "extensions": [
                "sc"
            ]
        },
        "application/vnd.iccprofile": {
            "source": "iana",
            "extensions": [
                "icc",
                "icm"
            ]
        },
        "application/vnd.ieee.1905": {
            "source": "iana"
        },
        "application/vnd.igloader": {
            "source": "iana",
            "extensions": [
                "igl"
            ]
        },
        "application/vnd.imagemeter.folder+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.imagemeter.image+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.immervision-ivp": {
            "source": "iana",
            "extensions": [
                "ivp"
            ]
        },
        "application/vnd.immervision-ivu": {
            "source": "iana",
            "extensions": [
                "ivu"
            ]
        },
        "application/vnd.ims.imsccv1p1": {
            "source": "iana"
        },
        "application/vnd.ims.imsccv1p2": {
            "source": "iana"
        },
        "application/vnd.ims.imsccv1p3": {
            "source": "iana"
        },
        "application/vnd.ims.lis.v2.result+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ims.lti.v2.toolproxy+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ims.lti.v2.toolproxy.id+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ims.lti.v2.toolsettings+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ims.lti.v2.toolsettings.simple+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.informedcontrol.rms+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.informix-visionary": {
            "source": "iana"
        },
        "application/vnd.infotech.project": {
            "source": "iana"
        },
        "application/vnd.infotech.project+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.innopath.wamp.notification": {
            "source": "iana"
        },
        "application/vnd.insors.igm": {
            "source": "iana",
            "extensions": [
                "igm"
            ]
        },
        "application/vnd.intercon.formnet": {
            "source": "iana",
            "extensions": [
                "xpw",
                "xpx"
            ]
        },
        "application/vnd.intergeo": {
            "source": "iana",
            "extensions": [
                "i2g"
            ]
        },
        "application/vnd.intertrust.digibox": {
            "source": "iana"
        },
        "application/vnd.intertrust.nncp": {
            "source": "iana"
        },
        "application/vnd.intu.qbo": {
            "source": "iana",
            "extensions": [
                "qbo"
            ]
        },
        "application/vnd.intu.qfx": {
            "source": "iana",
            "extensions": [
                "qfx"
            ]
        },
        "application/vnd.iptc.g2.catalogitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.conceptitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.knowledgeitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.newsitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.newsmessage+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.packageitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.iptc.g2.planningitem+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ipunplugged.rcprofile": {
            "source": "iana",
            "extensions": [
                "rcprofile"
            ]
        },
        "application/vnd.irepository.package+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "irp"
            ]
        },
        "application/vnd.is-xpr": {
            "source": "iana",
            "extensions": [
                "xpr"
            ]
        },
        "application/vnd.isac.fcs": {
            "source": "iana",
            "extensions": [
                "fcs"
            ]
        },
        "application/vnd.iso11783-10+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.jam": {
            "source": "iana",
            "extensions": [
                "jam"
            ]
        },
        "application/vnd.japannet-directory-service": {
            "source": "iana"
        },
        "application/vnd.japannet-jpnstore-wakeup": {
            "source": "iana"
        },
        "application/vnd.japannet-payment-wakeup": {
            "source": "iana"
        },
        "application/vnd.japannet-registration": {
            "source": "iana"
        },
        "application/vnd.japannet-registration-wakeup": {
            "source": "iana"
        },
        "application/vnd.japannet-setstore-wakeup": {
            "source": "iana"
        },
        "application/vnd.japannet-verification": {
            "source": "iana"
        },
        "application/vnd.japannet-verification-wakeup": {
            "source": "iana"
        },
        "application/vnd.jcp.javame.midlet-rms": {
            "source": "iana",
            "extensions": [
                "rms"
            ]
        },
        "application/vnd.jisp": {
            "source": "iana",
            "extensions": [
                "jisp"
            ]
        },
        "application/vnd.joost.joda-archive": {
            "source": "iana",
            "extensions": [
                "joda"
            ]
        },
        "application/vnd.jsk.isdn-ngn": {
            "source": "iana"
        },
        "application/vnd.kahootz": {
            "source": "iana",
            "extensions": [
                "ktz",
                "ktr"
            ]
        },
        "application/vnd.kde.karbon": {
            "source": "iana",
            "extensions": [
                "karbon"
            ]
        },
        "application/vnd.kde.kchart": {
            "source": "iana",
            "extensions": [
                "chrt"
            ]
        },
        "application/vnd.kde.kformula": {
            "source": "iana",
            "extensions": [
                "kfo"
            ]
        },
        "application/vnd.kde.kivio": {
            "source": "iana",
            "extensions": [
                "flw"
            ]
        },
        "application/vnd.kde.kontour": {
            "source": "iana",
            "extensions": [
                "kon"
            ]
        },
        "application/vnd.kde.kpresenter": {
            "source": "iana",
            "extensions": [
                "kpr",
                "kpt"
            ]
        },
        "application/vnd.kde.kspread": {
            "source": "iana",
            "extensions": [
                "ksp"
            ]
        },
        "application/vnd.kde.kword": {
            "source": "iana",
            "extensions": [
                "kwd",
                "kwt"
            ]
        },
        "application/vnd.kenameaapp": {
            "source": "iana",
            "extensions": [
                "htke"
            ]
        },
        "application/vnd.kidspiration": {
            "source": "iana",
            "extensions": [
                "kia"
            ]
        },
        "application/vnd.kinar": {
            "source": "iana",
            "extensions": [
                "kne",
                "knp"
            ]
        },
        "application/vnd.koan": {
            "source": "iana",
            "extensions": [
                "skp",
                "skd",
                "skt",
                "skm"
            ]
        },
        "application/vnd.kodak-descriptor": {
            "source": "iana",
            "extensions": [
                "sse"
            ]
        },
        "application/vnd.las": {
            "source": "iana"
        },
        "application/vnd.las.las+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.las.las+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "lasxml"
            ]
        },
        "application/vnd.laszip": {
            "source": "iana"
        },
        "application/vnd.leap+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.liberty-request+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.llamagraphics.life-balance.desktop": {
            "source": "iana",
            "extensions": [
                "lbd"
            ]
        },
        "application/vnd.llamagraphics.life-balance.exchange+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "lbe"
            ]
        },
        "application/vnd.logipipe.circuit+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.loom": {
            "source": "iana"
        },
        "application/vnd.lotus-1-2-3": {
            "source": "iana",
            "extensions": [
                "123"
            ]
        },
        "application/vnd.lotus-approach": {
            "source": "iana",
            "extensions": [
                "apr"
            ]
        },
        "application/vnd.lotus-freelance": {
            "source": "iana",
            "extensions": [
                "pre"
            ]
        },
        "application/vnd.lotus-notes": {
            "source": "iana",
            "extensions": [
                "nsf"
            ]
        },
        "application/vnd.lotus-organizer": {
            "source": "iana",
            "extensions": [
                "org"
            ]
        },
        "application/vnd.lotus-screencam": {
            "source": "iana",
            "extensions": [
                "scm"
            ]
        },
        "application/vnd.lotus-wordpro": {
            "source": "iana",
            "extensions": [
                "lwp"
            ]
        },
        "application/vnd.macports.portpkg": {
            "source": "iana",
            "extensions": [
                "portpkg"
            ]
        },
        "application/vnd.mapbox-vector-tile": {
            "source": "iana",
            "extensions": [
                "mvt"
            ]
        },
        "application/vnd.marlin.drm.actiontoken+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.marlin.drm.conftoken+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.marlin.drm.license+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.marlin.drm.mdcf": {
            "source": "iana"
        },
        "application/vnd.mason+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.maxar.archive.3tz+zip": {
            "source": "iana",
            "compressible": false
        },
        "application/vnd.maxmind.maxmind-db": {
            "source": "iana"
        },
        "application/vnd.mcd": {
            "source": "iana",
            "extensions": [
                "mcd"
            ]
        },
        "application/vnd.medcalcdata": {
            "source": "iana",
            "extensions": [
                "mc1"
            ]
        },
        "application/vnd.mediastation.cdkey": {
            "source": "iana",
            "extensions": [
                "cdkey"
            ]
        },
        "application/vnd.meridian-slingshot": {
            "source": "iana"
        },
        "application/vnd.mfer": {
            "source": "iana",
            "extensions": [
                "mwf"
            ]
        },
        "application/vnd.mfmp": {
            "source": "iana",
            "extensions": [
                "mfm"
            ]
        },
        "application/vnd.micro+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.micrografx.flo": {
            "source": "iana",
            "extensions": [
                "flo"
            ]
        },
        "application/vnd.micrografx.igx": {
            "source": "iana",
            "extensions": [
                "igx"
            ]
        },
        "application/vnd.microsoft.portable-executable": {
            "source": "iana"
        },
        "application/vnd.microsoft.windows.thumbnail-cache": {
            "source": "iana"
        },
        "application/vnd.miele+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.mif": {
            "source": "iana",
            "extensions": [
                "mif"
            ]
        },
        "application/vnd.minisoft-hp3000-save": {
            "source": "iana"
        },
        "application/vnd.mitsubishi.misty-guard.trustweb": {
            "source": "iana"
        },
        "application/vnd.mobius.daf": {
            "source": "iana",
            "extensions": [
                "daf"
            ]
        },
        "application/vnd.mobius.dis": {
            "source": "iana",
            "extensions": [
                "dis"
            ]
        },
        "application/vnd.mobius.mbk": {
            "source": "iana",
            "extensions": [
                "mbk"
            ]
        },
        "application/vnd.mobius.mqy": {
            "source": "iana",
            "extensions": [
                "mqy"
            ]
        },
        "application/vnd.mobius.msl": {
            "source": "iana",
            "extensions": [
                "msl"
            ]
        },
        "application/vnd.mobius.plc": {
            "source": "iana",
            "extensions": [
                "plc"
            ]
        },
        "application/vnd.mobius.txf": {
            "source": "iana",
            "extensions": [
                "txf"
            ]
        },
        "application/vnd.mophun.application": {
            "source": "iana",
            "extensions": [
                "mpn"
            ]
        },
        "application/vnd.mophun.certificate": {
            "source": "iana",
            "extensions": [
                "mpc"
            ]
        },
        "application/vnd.motorola.flexsuite": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.adsi": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.fis": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.gotap": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.kmr": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.ttc": {
            "source": "iana"
        },
        "application/vnd.motorola.flexsuite.wem": {
            "source": "iana"
        },
        "application/vnd.motorola.iprm": {
            "source": "iana"
        },
        "application/vnd.mozilla.xul+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xul"
            ]
        },
        "application/vnd.ms-3mfdocument": {
            "source": "iana"
        },
        "application/vnd.ms-artgalry": {
            "source": "iana",
            "extensions": [
                "cil"
            ]
        },
        "application/vnd.ms-asf": {
            "source": "iana"
        },
        "application/vnd.ms-cab-compressed": {
            "source": "iana",
            "extensions": [
                "cab"
            ]
        },
        "application/vnd.ms-color.iccprofile": {
            "source": "apache"
        },
        "application/vnd.ms-excel": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "xls",
                "xlm",
                "xla",
                "xlc",
                "xlt",
                "xlw"
            ]
        },
        "application/vnd.ms-excel.addin.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "xlam"
            ]
        },
        "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "xlsb"
            ]
        },
        "application/vnd.ms-excel.sheet.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "xlsm"
            ]
        },
        "application/vnd.ms-excel.template.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "xltm"
            ]
        },
        "application/vnd.ms-fontobject": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "eot"
            ]
        },
        "application/vnd.ms-htmlhelp": {
            "source": "iana",
            "extensions": [
                "chm"
            ]
        },
        "application/vnd.ms-ims": {
            "source": "iana",
            "extensions": [
                "ims"
            ]
        },
        "application/vnd.ms-lrm": {
            "source": "iana",
            "extensions": [
                "lrm"
            ]
        },
        "application/vnd.ms-office.activex+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ms-officetheme": {
            "source": "iana",
            "extensions": [
                "thmx"
            ]
        },
        "application/vnd.ms-opentype": {
            "source": "apache",
            "compressible": true
        },
        "application/vnd.ms-outlook": {
            "compressible": false,
            "extensions": [
                "msg"
            ]
        },
        "application/vnd.ms-package.obfuscated-opentype": {
            "source": "apache"
        },
        "application/vnd.ms-pki.seccat": {
            "source": "apache",
            "extensions": [
                "cat"
            ]
        },
        "application/vnd.ms-pki.stl": {
            "source": "apache",
            "extensions": [
                "stl"
            ]
        },
        "application/vnd.ms-playready.initiator+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ms-powerpoint": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "ppt",
                "pps",
                "pot"
            ]
        },
        "application/vnd.ms-powerpoint.addin.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "ppam"
            ]
        },
        "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "pptm"
            ]
        },
        "application/vnd.ms-powerpoint.slide.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "sldm"
            ]
        },
        "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "ppsm"
            ]
        },
        "application/vnd.ms-powerpoint.template.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "potm"
            ]
        },
        "application/vnd.ms-printdevicecapabilities+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ms-printing.printticket+xml": {
            "source": "apache",
            "compressible": true
        },
        "application/vnd.ms-printschematicket+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ms-project": {
            "source": "iana",
            "extensions": [
                "mpp",
                "mpt"
            ]
        },
        "application/vnd.ms-tnef": {
            "source": "iana"
        },
        "application/vnd.ms-windows.devicepairing": {
            "source": "iana"
        },
        "application/vnd.ms-windows.nwprinting.oob": {
            "source": "iana"
        },
        "application/vnd.ms-windows.printerpairing": {
            "source": "iana"
        },
        "application/vnd.ms-windows.wsd.oob": {
            "source": "iana"
        },
        "application/vnd.ms-wmdrm.lic-chlg-req": {
            "source": "iana"
        },
        "application/vnd.ms-wmdrm.lic-resp": {
            "source": "iana"
        },
        "application/vnd.ms-wmdrm.meter-chlg-req": {
            "source": "iana"
        },
        "application/vnd.ms-wmdrm.meter-resp": {
            "source": "iana"
        },
        "application/vnd.ms-word.document.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "docm"
            ]
        },
        "application/vnd.ms-word.template.macroenabled.12": {
            "source": "iana",
            "extensions": [
                "dotm"
            ]
        },
        "application/vnd.ms-works": {
            "source": "iana",
            "extensions": [
                "wps",
                "wks",
                "wcm",
                "wdb"
            ]
        },
        "application/vnd.ms-wpl": {
            "source": "iana",
            "extensions": [
                "wpl"
            ]
        },
        "application/vnd.ms-xpsdocument": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "xps"
            ]
        },
        "application/vnd.msa-disk-image": {
            "source": "iana"
        },
        "application/vnd.mseq": {
            "source": "iana",
            "extensions": [
                "mseq"
            ]
        },
        "application/vnd.msign": {
            "source": "iana"
        },
        "application/vnd.multiad.creator": {
            "source": "iana"
        },
        "application/vnd.multiad.creator.cif": {
            "source": "iana"
        },
        "application/vnd.music-niff": {
            "source": "iana"
        },
        "application/vnd.musician": {
            "source": "iana",
            "extensions": [
                "mus"
            ]
        },
        "application/vnd.muvee.style": {
            "source": "iana",
            "extensions": [
                "msty"
            ]
        },
        "application/vnd.mynfc": {
            "source": "iana",
            "extensions": [
                "taglet"
            ]
        },
        "application/vnd.nacamar.ybrid+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.ncd.control": {
            "source": "iana"
        },
        "application/vnd.ncd.reference": {
            "source": "iana"
        },
        "application/vnd.nearst.inv+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nebumind.line": {
            "source": "iana"
        },
        "application/vnd.nervana": {
            "source": "iana"
        },
        "application/vnd.netfpx": {
            "source": "iana"
        },
        "application/vnd.neurolanguage.nlu": {
            "source": "iana",
            "extensions": [
                "nlu"
            ]
        },
        "application/vnd.nimn": {
            "source": "iana"
        },
        "application/vnd.nintendo.nitro.rom": {
            "source": "iana"
        },
        "application/vnd.nintendo.snes.rom": {
            "source": "iana"
        },
        "application/vnd.nitf": {
            "source": "iana",
            "extensions": [
                "ntf",
                "nitf"
            ]
        },
        "application/vnd.noblenet-directory": {
            "source": "iana",
            "extensions": [
                "nnd"
            ]
        },
        "application/vnd.noblenet-sealer": {
            "source": "iana",
            "extensions": [
                "nns"
            ]
        },
        "application/vnd.noblenet-web": {
            "source": "iana",
            "extensions": [
                "nnw"
            ]
        },
        "application/vnd.nokia.catalogs": {
            "source": "iana"
        },
        "application/vnd.nokia.conml+wbxml": {
            "source": "iana"
        },
        "application/vnd.nokia.conml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nokia.iptv.config+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nokia.isds-radio-presets": {
            "source": "iana"
        },
        "application/vnd.nokia.landmark+wbxml": {
            "source": "iana"
        },
        "application/vnd.nokia.landmark+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nokia.landmarkcollection+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nokia.n-gage.ac+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ac"
            ]
        },
        "application/vnd.nokia.n-gage.data": {
            "source": "iana",
            "extensions": [
                "ngdat"
            ]
        },
        "application/vnd.nokia.n-gage.symbian.install": {
            "source": "iana",
            "extensions": [
                "n-gage"
            ]
        },
        "application/vnd.nokia.ncd": {
            "source": "iana"
        },
        "application/vnd.nokia.pcd+wbxml": {
            "source": "iana"
        },
        "application/vnd.nokia.pcd+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.nokia.radio-preset": {
            "source": "iana",
            "extensions": [
                "rpst"
            ]
        },
        "application/vnd.nokia.radio-presets": {
            "source": "iana",
            "extensions": [
                "rpss"
            ]
        },
        "application/vnd.novadigm.edm": {
            "source": "iana",
            "extensions": [
                "edm"
            ]
        },
        "application/vnd.novadigm.edx": {
            "source": "iana",
            "extensions": [
                "edx"
            ]
        },
        "application/vnd.novadigm.ext": {
            "source": "iana",
            "extensions": [
                "ext"
            ]
        },
        "application/vnd.ntt-local.content-share": {
            "source": "iana"
        },
        "application/vnd.ntt-local.file-transfer": {
            "source": "iana"
        },
        "application/vnd.ntt-local.ogw_remote-access": {
            "source": "iana"
        },
        "application/vnd.ntt-local.sip-ta_remote": {
            "source": "iana"
        },
        "application/vnd.ntt-local.sip-ta_tcp_stream": {
            "source": "iana"
        },
        "application/vnd.oasis.opendocument.chart": {
            "source": "iana",
            "extensions": [
                "odc"
            ]
        },
        "application/vnd.oasis.opendocument.chart-template": {
            "source": "iana",
            "extensions": [
                "otc"
            ]
        },
        "application/vnd.oasis.opendocument.database": {
            "source": "iana",
            "extensions": [
                "odb"
            ]
        },
        "application/vnd.oasis.opendocument.formula": {
            "source": "iana",
            "extensions": [
                "odf"
            ]
        },
        "application/vnd.oasis.opendocument.formula-template": {
            "source": "iana",
            "extensions": [
                "odft"
            ]
        },
        "application/vnd.oasis.opendocument.graphics": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "odg"
            ]
        },
        "application/vnd.oasis.opendocument.graphics-template": {
            "source": "iana",
            "extensions": [
                "otg"
            ]
        },
        "application/vnd.oasis.opendocument.image": {
            "source": "iana",
            "extensions": [
                "odi"
            ]
        },
        "application/vnd.oasis.opendocument.image-template": {
            "source": "iana",
            "extensions": [
                "oti"
            ]
        },
        "application/vnd.oasis.opendocument.presentation": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "odp"
            ]
        },
        "application/vnd.oasis.opendocument.presentation-template": {
            "source": "iana",
            "extensions": [
                "otp"
            ]
        },
        "application/vnd.oasis.opendocument.spreadsheet": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "ods"
            ]
        },
        "application/vnd.oasis.opendocument.spreadsheet-template": {
            "source": "iana",
            "extensions": [
                "ots"
            ]
        },
        "application/vnd.oasis.opendocument.text": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "odt"
            ]
        },
        "application/vnd.oasis.opendocument.text-master": {
            "source": "iana",
            "extensions": [
                "odm"
            ]
        },
        "application/vnd.oasis.opendocument.text-template": {
            "source": "iana",
            "extensions": [
                "ott"
            ]
        },
        "application/vnd.oasis.opendocument.text-web": {
            "source": "iana",
            "extensions": [
                "oth"
            ]
        },
        "application/vnd.obn": {
            "source": "iana"
        },
        "application/vnd.ocf+cbor": {
            "source": "iana"
        },
        "application/vnd.oci.image.manifest.v1+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oftn.l10n+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.contentaccessdownload+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.contentaccessstreaming+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.cspg-hexbinary": {
            "source": "iana"
        },
        "application/vnd.oipf.dae.svg+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.dae.xhtml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.mippvcontrolmessage+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.pae.gem": {
            "source": "iana"
        },
        "application/vnd.oipf.spdiscovery+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.spdlist+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.ueprofile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oipf.userprofile+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.olpc-sugar": {
            "source": "iana",
            "extensions": [
                "xo"
            ]
        },
        "application/vnd.oma-scws-config": {
            "source": "iana"
        },
        "application/vnd.oma-scws-http-request": {
            "source": "iana"
        },
        "application/vnd.oma-scws-http-response": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.drm-trigger+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.imd+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.ltkm": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.notification+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.provisioningtrigger": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.sgboot": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.sgdd+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.sgdu": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.simple-symbol-container": {
            "source": "iana"
        },
        "application/vnd.oma.bcast.smartcard-trigger+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.sprov+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.bcast.stkm": {
            "source": "iana"
        },
        "application/vnd.oma.cab-address-book+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.cab-feature-handler+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.cab-pcc+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.cab-subs-invite+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.cab-user-prefs+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.dcd": {
            "source": "iana"
        },
        "application/vnd.oma.dcdc": {
            "source": "iana"
        },
        "application/vnd.oma.dd2+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "dd2"
            ]
        },
        "application/vnd.oma.drm.risd+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.group-usage-list+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.lwm2m+cbor": {
            "source": "iana"
        },
        "application/vnd.oma.lwm2m+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.lwm2m+tlv": {
            "source": "iana"
        },
        "application/vnd.oma.pal+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.poc.detailed-progress-report+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.poc.final-report+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.poc.groups+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.poc.invocation-descriptor+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.poc.optimized-progress-report+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.push": {
            "source": "iana"
        },
        "application/vnd.oma.scidm.messages+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oma.xcap-directory+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.omads-email+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.omads-file+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.omads-folder+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.omaloc-supl-init": {
            "source": "iana"
        },
        "application/vnd.onepager": {
            "source": "iana"
        },
        "application/vnd.onepagertamp": {
            "source": "iana"
        },
        "application/vnd.onepagertamx": {
            "source": "iana"
        },
        "application/vnd.onepagertat": {
            "source": "iana"
        },
        "application/vnd.onepagertatp": {
            "source": "iana"
        },
        "application/vnd.onepagertatx": {
            "source": "iana"
        },
        "application/vnd.openblox.game+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "obgx"
            ]
        },
        "application/vnd.openblox.game-binary": {
            "source": "iana"
        },
        "application/vnd.openeye.oeb": {
            "source": "iana"
        },
        "application/vnd.openofficeorg.extension": {
            "source": "apache",
            "extensions": [
                "oxt"
            ]
        },
        "application/vnd.openstreetmap.data+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "osm"
            ]
        },
        "application/vnd.opentimestamps.ots": {
            "source": "iana"
        },
        "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawing+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "pptx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slide": {
            "source": "iana",
            "extensions": [
                "sldx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
            "source": "iana",
            "extensions": [
                "ppsx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.template": {
            "source": "iana",
            "extensions": [
                "potx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "xlsx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
            "source": "iana",
            "extensions": [
                "xltx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.theme+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.vmldrawing": {
            "source": "iana"
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "docx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
            "source": "iana",
            "extensions": [
                "dotx"
            ]
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-package.core-properties+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.openxmlformats-package.relationships+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oracle.resource+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.orange.indata": {
            "source": "iana"
        },
        "application/vnd.osa.netdeploy": {
            "source": "iana"
        },
        "application/vnd.osgeo.mapguide.package": {
            "source": "iana",
            "extensions": [
                "mgp"
            ]
        },
        "application/vnd.osgi.bundle": {
            "source": "iana"
        },
        "application/vnd.osgi.dp": {
            "source": "iana",
            "extensions": [
                "dp"
            ]
        },
        "application/vnd.osgi.subsystem": {
            "source": "iana",
            "extensions": [
                "esa"
            ]
        },
        "application/vnd.otps.ct-kip+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.oxli.countgraph": {
            "source": "iana"
        },
        "application/vnd.pagerduty+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.palm": {
            "source": "iana",
            "extensions": [
                "pdb",
                "pqa",
                "oprc"
            ]
        },
        "application/vnd.panoply": {
            "source": "iana"
        },
        "application/vnd.paos.xml": {
            "source": "iana"
        },
        "application/vnd.patentdive": {
            "source": "iana"
        },
        "application/vnd.patientecommsdoc": {
            "source": "iana"
        },
        "application/vnd.pawaafile": {
            "source": "iana",
            "extensions": [
                "paw"
            ]
        },
        "application/vnd.pcos": {
            "source": "iana"
        },
        "application/vnd.pg.format": {
            "source": "iana",
            "extensions": [
                "str"
            ]
        },
        "application/vnd.pg.osasli": {
            "source": "iana",
            "extensions": [
                "ei6"
            ]
        },
        "application/vnd.piaccess.application-licence": {
            "source": "iana"
        },
        "application/vnd.picsel": {
            "source": "iana",
            "extensions": [
                "efif"
            ]
        },
        "application/vnd.pmi.widget": {
            "source": "iana",
            "extensions": [
                "wg"
            ]
        },
        "application/vnd.poc.group-advertisement+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.pocketlearn": {
            "source": "iana",
            "extensions": [
                "plf"
            ]
        },
        "application/vnd.powerbuilder6": {
            "source": "iana",
            "extensions": [
                "pbd"
            ]
        },
        "application/vnd.powerbuilder6-s": {
            "source": "iana"
        },
        "application/vnd.powerbuilder7": {
            "source": "iana"
        },
        "application/vnd.powerbuilder7-s": {
            "source": "iana"
        },
        "application/vnd.powerbuilder75": {
            "source": "iana"
        },
        "application/vnd.powerbuilder75-s": {
            "source": "iana"
        },
        "application/vnd.preminet": {
            "source": "iana"
        },
        "application/vnd.previewsystems.box": {
            "source": "iana",
            "extensions": [
                "box"
            ]
        },
        "application/vnd.proteus.magazine": {
            "source": "iana",
            "extensions": [
                "mgz"
            ]
        },
        "application/vnd.psfs": {
            "source": "iana"
        },
        "application/vnd.publishare-delta-tree": {
            "source": "iana",
            "extensions": [
                "qps"
            ]
        },
        "application/vnd.pvi.ptid1": {
            "source": "iana",
            "extensions": [
                "ptid"
            ]
        },
        "application/vnd.pwg-multiplexed": {
            "source": "iana"
        },
        "application/vnd.pwg-xhtml-print+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.qualcomm.brew-app-res": {
            "source": "iana"
        },
        "application/vnd.quarantainenet": {
            "source": "iana"
        },
        "application/vnd.quark.quarkxpress": {
            "source": "iana",
            "extensions": [
                "qxd",
                "qxt",
                "qwd",
                "qwt",
                "qxl",
                "qxb"
            ]
        },
        "application/vnd.quobject-quoxdocument": {
            "source": "iana"
        },
        "application/vnd.radisys.moml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-audit+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-audit-conf+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-audit-conn+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-audit-dialog+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-audit-stream+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-conf+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-base+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-fax-detect+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-group+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-speech+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.radisys.msml-dialog-transform+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.rainstor.data": {
            "source": "iana"
        },
        "application/vnd.rapid": {
            "source": "iana"
        },
        "application/vnd.rar": {
            "source": "iana",
            "extensions": [
                "rar"
            ]
        },
        "application/vnd.realvnc.bed": {
            "source": "iana",
            "extensions": [
                "bed"
            ]
        },
        "application/vnd.recordare.musicxml": {
            "source": "iana",
            "extensions": [
                "mxl"
            ]
        },
        "application/vnd.recordare.musicxml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "musicxml"
            ]
        },
        "application/vnd.renlearn.rlprint": {
            "source": "iana"
        },
        "application/vnd.resilient.logic": {
            "source": "iana"
        },
        "application/vnd.restful+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.rig.cryptonote": {
            "source": "iana",
            "extensions": [
                "cryptonote"
            ]
        },
        "application/vnd.rim.cod": {
            "source": "apache",
            "extensions": [
                "cod"
            ]
        },
        "application/vnd.rn-realmedia": {
            "source": "apache",
            "extensions": [
                "rm"
            ]
        },
        "application/vnd.rn-realmedia-vbr": {
            "source": "apache",
            "extensions": [
                "rmvb"
            ]
        },
        "application/vnd.route66.link66+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "link66"
            ]
        },
        "application/vnd.rs-274x": {
            "source": "iana"
        },
        "application/vnd.ruckus.download": {
            "source": "iana"
        },
        "application/vnd.s3sms": {
            "source": "iana"
        },
        "application/vnd.sailingtracker.track": {
            "source": "iana",
            "extensions": [
                "st"
            ]
        },
        "application/vnd.sar": {
            "source": "iana"
        },
        "application/vnd.sbm.cid": {
            "source": "iana"
        },
        "application/vnd.sbm.mid2": {
            "source": "iana"
        },
        "application/vnd.scribus": {
            "source": "iana"
        },
        "application/vnd.sealed.3df": {
            "source": "iana"
        },
        "application/vnd.sealed.csf": {
            "source": "iana"
        },
        "application/vnd.sealed.doc": {
            "source": "iana"
        },
        "application/vnd.sealed.eml": {
            "source": "iana"
        },
        "application/vnd.sealed.mht": {
            "source": "iana"
        },
        "application/vnd.sealed.net": {
            "source": "iana"
        },
        "application/vnd.sealed.ppt": {
            "source": "iana"
        },
        "application/vnd.sealed.tiff": {
            "source": "iana"
        },
        "application/vnd.sealed.xls": {
            "source": "iana"
        },
        "application/vnd.sealedmedia.softseal.html": {
            "source": "iana"
        },
        "application/vnd.sealedmedia.softseal.pdf": {
            "source": "iana"
        },
        "application/vnd.seemail": {
            "source": "iana",
            "extensions": [
                "see"
            ]
        },
        "application/vnd.seis+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.sema": {
            "source": "iana",
            "extensions": [
                "sema"
            ]
        },
        "application/vnd.semd": {
            "source": "iana",
            "extensions": [
                "semd"
            ]
        },
        "application/vnd.semf": {
            "source": "iana",
            "extensions": [
                "semf"
            ]
        },
        "application/vnd.shade-save-file": {
            "source": "iana"
        },
        "application/vnd.shana.informed.formdata": {
            "source": "iana",
            "extensions": [
                "ifm"
            ]
        },
        "application/vnd.shana.informed.formtemplate": {
            "source": "iana",
            "extensions": [
                "itp"
            ]
        },
        "application/vnd.shana.informed.interchange": {
            "source": "iana",
            "extensions": [
                "iif"
            ]
        },
        "application/vnd.shana.informed.package": {
            "source": "iana",
            "extensions": [
                "ipk"
            ]
        },
        "application/vnd.shootproof+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.shopkick+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.shp": {
            "source": "iana"
        },
        "application/vnd.shx": {
            "source": "iana"
        },
        "application/vnd.sigrok.session": {
            "source": "iana"
        },
        "application/vnd.simtech-mindmapper": {
            "source": "iana",
            "extensions": [
                "twd",
                "twds"
            ]
        },
        "application/vnd.siren+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.smaf": {
            "source": "iana",
            "extensions": [
                "mmf"
            ]
        },
        "application/vnd.smart.notebook": {
            "source": "iana"
        },
        "application/vnd.smart.teacher": {
            "source": "iana",
            "extensions": [
                "teacher"
            ]
        },
        "application/vnd.snesdev-page-table": {
            "source": "iana"
        },
        "application/vnd.software602.filler.form+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "fo"
            ]
        },
        "application/vnd.software602.filler.form-xml-zip": {
            "source": "iana"
        },
        "application/vnd.solent.sdkm+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "sdkm",
                "sdkd"
            ]
        },
        "application/vnd.spotfire.dxp": {
            "source": "iana",
            "extensions": [
                "dxp"
            ]
        },
        "application/vnd.spotfire.sfs": {
            "source": "iana",
            "extensions": [
                "sfs"
            ]
        },
        "application/vnd.sqlite3": {
            "source": "iana"
        },
        "application/vnd.sss-cod": {
            "source": "iana"
        },
        "application/vnd.sss-dtf": {
            "source": "iana"
        },
        "application/vnd.sss-ntf": {
            "source": "iana"
        },
        "application/vnd.stardivision.calc": {
            "source": "apache",
            "extensions": [
                "sdc"
            ]
        },
        "application/vnd.stardivision.draw": {
            "source": "apache",
            "extensions": [
                "sda"
            ]
        },
        "application/vnd.stardivision.impress": {
            "source": "apache",
            "extensions": [
                "sdd"
            ]
        },
        "application/vnd.stardivision.math": {
            "source": "apache",
            "extensions": [
                "smf"
            ]
        },
        "application/vnd.stardivision.writer": {
            "source": "apache",
            "extensions": [
                "sdw",
                "vor"
            ]
        },
        "application/vnd.stardivision.writer-global": {
            "source": "apache",
            "extensions": [
                "sgl"
            ]
        },
        "application/vnd.stepmania.package": {
            "source": "iana",
            "extensions": [
                "smzip"
            ]
        },
        "application/vnd.stepmania.stepchart": {
            "source": "iana",
            "extensions": [
                "sm"
            ]
        },
        "application/vnd.street-stream": {
            "source": "iana"
        },
        "application/vnd.sun.wadl+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wadl"
            ]
        },
        "application/vnd.sun.xml.calc": {
            "source": "apache",
            "extensions": [
                "sxc"
            ]
        },
        "application/vnd.sun.xml.calc.template": {
            "source": "apache",
            "extensions": [
                "stc"
            ]
        },
        "application/vnd.sun.xml.draw": {
            "source": "apache",
            "extensions": [
                "sxd"
            ]
        },
        "application/vnd.sun.xml.draw.template": {
            "source": "apache",
            "extensions": [
                "std"
            ]
        },
        "application/vnd.sun.xml.impress": {
            "source": "apache",
            "extensions": [
                "sxi"
            ]
        },
        "application/vnd.sun.xml.impress.template": {
            "source": "apache",
            "extensions": [
                "sti"
            ]
        },
        "application/vnd.sun.xml.math": {
            "source": "apache",
            "extensions": [
                "sxm"
            ]
        },
        "application/vnd.sun.xml.writer": {
            "source": "apache",
            "extensions": [
                "sxw"
            ]
        },
        "application/vnd.sun.xml.writer.global": {
            "source": "apache",
            "extensions": [
                "sxg"
            ]
        },
        "application/vnd.sun.xml.writer.template": {
            "source": "apache",
            "extensions": [
                "stw"
            ]
        },
        "application/vnd.sus-calendar": {
            "source": "iana",
            "extensions": [
                "sus",
                "susp"
            ]
        },
        "application/vnd.svd": {
            "source": "iana",
            "extensions": [
                "svd"
            ]
        },
        "application/vnd.swiftview-ics": {
            "source": "iana"
        },
        "application/vnd.sycle+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.syft+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.symbian.install": {
            "source": "apache",
            "extensions": [
                "sis",
                "sisx"
            ]
        },
        "application/vnd.syncml+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "xsm"
            ]
        },
        "application/vnd.syncml.dm+wbxml": {
            "source": "iana",
            "charset": "UTF-8",
            "extensions": [
                "bdm"
            ]
        },
        "application/vnd.syncml.dm+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "xdm"
            ]
        },
        "application/vnd.syncml.dm.notification": {
            "source": "iana"
        },
        "application/vnd.syncml.dmddf+wbxml": {
            "source": "iana"
        },
        "application/vnd.syncml.dmddf+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "ddf"
            ]
        },
        "application/vnd.syncml.dmtnds+wbxml": {
            "source": "iana"
        },
        "application/vnd.syncml.dmtnds+xml": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true
        },
        "application/vnd.syncml.ds.notification": {
            "source": "iana"
        },
        "application/vnd.tableschema+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.tao.intent-module-archive": {
            "source": "iana",
            "extensions": [
                "tao"
            ]
        },
        "application/vnd.tcpdump.pcap": {
            "source": "iana",
            "extensions": [
                "pcap",
                "cap",
                "dmp"
            ]
        },
        "application/vnd.think-cell.ppttc+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.tmd.mediaflex.api+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.tml": {
            "source": "iana"
        },
        "application/vnd.tmobile-livetv": {
            "source": "iana",
            "extensions": [
                "tmo"
            ]
        },
        "application/vnd.tri.onesource": {
            "source": "iana"
        },
        "application/vnd.trid.tpt": {
            "source": "iana",
            "extensions": [
                "tpt"
            ]
        },
        "application/vnd.triscape.mxs": {
            "source": "iana",
            "extensions": [
                "mxs"
            ]
        },
        "application/vnd.trueapp": {
            "source": "iana",
            "extensions": [
                "tra"
            ]
        },
        "application/vnd.truedoc": {
            "source": "iana"
        },
        "application/vnd.ubisoft.webplayer": {
            "source": "iana"
        },
        "application/vnd.ufdl": {
            "source": "iana",
            "extensions": [
                "ufd",
                "ufdl"
            ]
        },
        "application/vnd.uiq.theme": {
            "source": "iana",
            "extensions": [
                "utz"
            ]
        },
        "application/vnd.umajin": {
            "source": "iana",
            "extensions": [
                "umj"
            ]
        },
        "application/vnd.unity": {
            "source": "iana",
            "extensions": [
                "unityweb"
            ]
        },
        "application/vnd.uoml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "uoml"
            ]
        },
        "application/vnd.uplanet.alert": {
            "source": "iana"
        },
        "application/vnd.uplanet.alert-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.bearer-choice": {
            "source": "iana"
        },
        "application/vnd.uplanet.bearer-choice-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.cacheop": {
            "source": "iana"
        },
        "application/vnd.uplanet.cacheop-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.channel": {
            "source": "iana"
        },
        "application/vnd.uplanet.channel-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.list": {
            "source": "iana"
        },
        "application/vnd.uplanet.list-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.listcmd": {
            "source": "iana"
        },
        "application/vnd.uplanet.listcmd-wbxml": {
            "source": "iana"
        },
        "application/vnd.uplanet.signal": {
            "source": "iana"
        },
        "application/vnd.uri-map": {
            "source": "iana"
        },
        "application/vnd.valve.source.material": {
            "source": "iana"
        },
        "application/vnd.vcx": {
            "source": "iana",
            "extensions": [
                "vcx"
            ]
        },
        "application/vnd.vd-study": {
            "source": "iana"
        },
        "application/vnd.vectorworks": {
            "source": "iana"
        },
        "application/vnd.vel+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.verimatrix.vcas": {
            "source": "iana"
        },
        "application/vnd.veritone.aion+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.veryant.thin": {
            "source": "iana"
        },
        "application/vnd.ves.encrypted": {
            "source": "iana"
        },
        "application/vnd.vidsoft.vidconference": {
            "source": "iana"
        },
        "application/vnd.visio": {
            "source": "iana",
            "extensions": [
                "vsd",
                "vst",
                "vss",
                "vsw"
            ]
        },
        "application/vnd.visionary": {
            "source": "iana",
            "extensions": [
                "vis"
            ]
        },
        "application/vnd.vividence.scriptfile": {
            "source": "iana"
        },
        "application/vnd.vsf": {
            "source": "iana",
            "extensions": [
                "vsf"
            ]
        },
        "application/vnd.wap.sic": {
            "source": "iana"
        },
        "application/vnd.wap.slc": {
            "source": "iana"
        },
        "application/vnd.wap.wbxml": {
            "source": "iana",
            "charset": "UTF-8",
            "extensions": [
                "wbxml"
            ]
        },
        "application/vnd.wap.wmlc": {
            "source": "iana",
            "extensions": [
                "wmlc"
            ]
        },
        "application/vnd.wap.wmlscriptc": {
            "source": "iana",
            "extensions": [
                "wmlsc"
            ]
        },
        "application/vnd.webturbo": {
            "source": "iana",
            "extensions": [
                "wtb"
            ]
        },
        "application/vnd.wfa.dpp": {
            "source": "iana"
        },
        "application/vnd.wfa.p2p": {
            "source": "iana"
        },
        "application/vnd.wfa.wsc": {
            "source": "iana"
        },
        "application/vnd.windows.devicepairing": {
            "source": "iana"
        },
        "application/vnd.wmc": {
            "source": "iana"
        },
        "application/vnd.wmf.bootstrap": {
            "source": "iana"
        },
        "application/vnd.wolfram.mathematica": {
            "source": "iana"
        },
        "application/vnd.wolfram.mathematica.package": {
            "source": "iana"
        },
        "application/vnd.wolfram.player": {
            "source": "iana",
            "extensions": [
                "nbp"
            ]
        },
        "application/vnd.wordperfect": {
            "source": "iana",
            "extensions": [
                "wpd"
            ]
        },
        "application/vnd.wqd": {
            "source": "iana",
            "extensions": [
                "wqd"
            ]
        },
        "application/vnd.wrq-hp3000-labelled": {
            "source": "iana"
        },
        "application/vnd.wt.stf": {
            "source": "iana",
            "extensions": [
                "stf"
            ]
        },
        "application/vnd.wv.csp+wbxml": {
            "source": "iana"
        },
        "application/vnd.wv.csp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.wv.ssp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.xacml+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.xara": {
            "source": "iana",
            "extensions": [
                "xar"
            ]
        },
        "application/vnd.xfdl": {
            "source": "iana",
            "extensions": [
                "xfdl"
            ]
        },
        "application/vnd.xfdl.webform": {
            "source": "iana"
        },
        "application/vnd.xmi+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/vnd.xmpie.cpkg": {
            "source": "iana"
        },
        "application/vnd.xmpie.dpkg": {
            "source": "iana"
        },
        "application/vnd.xmpie.plan": {
            "source": "iana"
        },
        "application/vnd.xmpie.ppkg": {
            "source": "iana"
        },
        "application/vnd.xmpie.xlim": {
            "source": "iana"
        },
        "application/vnd.yamaha.hv-dic": {
            "source": "iana",
            "extensions": [
                "hvd"
            ]
        },
        "application/vnd.yamaha.hv-script": {
            "source": "iana",
            "extensions": [
                "hvs"
            ]
        },
        "application/vnd.yamaha.hv-voice": {
            "source": "iana",
            "extensions": [
                "hvp"
            ]
        },
        "application/vnd.yamaha.openscoreformat": {
            "source": "iana",
            "extensions": [
                "osf"
            ]
        },
        "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "osfpvg"
            ]
        },
        "application/vnd.yamaha.remote-setup": {
            "source": "iana"
        },
        "application/vnd.yamaha.smaf-audio": {
            "source": "iana",
            "extensions": [
                "saf"
            ]
        },
        "application/vnd.yamaha.smaf-phrase": {
            "source": "iana",
            "extensions": [
                "spf"
            ]
        },
        "application/vnd.yamaha.through-ngn": {
            "source": "iana"
        },
        "application/vnd.yamaha.tunnel-udpencap": {
            "source": "iana"
        },
        "application/vnd.yaoweme": {
            "source": "iana"
        },
        "application/vnd.yellowriver-custom-menu": {
            "source": "iana",
            "extensions": [
                "cmp"
            ]
        },
        "application/vnd.youtube.yt": {
            "source": "iana"
        },
        "application/vnd.zul": {
            "source": "iana",
            "extensions": [
                "zir",
                "zirz"
            ]
        },
        "application/vnd.zzazz.deck+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "zaz"
            ]
        },
        "application/voicexml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "vxml"
            ]
        },
        "application/voucher-cms+json": {
            "source": "iana",
            "compressible": true
        },
        "application/vq-rtcpxr": {
            "source": "iana"
        },
        "application/wasm": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wasm"
            ]
        },
        "application/watcherinfo+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wif"
            ]
        },
        "application/webpush-options+json": {
            "source": "iana",
            "compressible": true
        },
        "application/whoispp-query": {
            "source": "iana"
        },
        "application/whoispp-response": {
            "source": "iana"
        },
        "application/widget": {
            "source": "iana",
            "extensions": [
                "wgt"
            ]
        },
        "application/winhlp": {
            "source": "apache",
            "extensions": [
                "hlp"
            ]
        },
        "application/wita": {
            "source": "iana"
        },
        "application/wordperfect5.1": {
            "source": "iana"
        },
        "application/wsdl+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wsdl"
            ]
        },
        "application/wspolicy+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "wspolicy"
            ]
        },
        "application/x-7z-compressed": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "7z"
            ]
        },
        "application/x-abiword": {
            "source": "apache",
            "extensions": [
                "abw"
            ]
        },
        "application/x-ace-compressed": {
            "source": "apache",
            "extensions": [
                "ace"
            ]
        },
        "application/x-amf": {
            "source": "apache"
        },
        "application/x-apple-diskimage": {
            "source": "apache",
            "extensions": [
                "dmg"
            ]
        },
        "application/x-arj": {
            "compressible": false,
            "extensions": [
                "arj"
            ]
        },
        "application/x-authorware-bin": {
            "source": "apache",
            "extensions": [
                "aab",
                "x32",
                "u32",
                "vox"
            ]
        },
        "application/x-authorware-map": {
            "source": "apache",
            "extensions": [
                "aam"
            ]
        },
        "application/x-authorware-seg": {
            "source": "apache",
            "extensions": [
                "aas"
            ]
        },
        "application/x-bcpio": {
            "source": "apache",
            "extensions": [
                "bcpio"
            ]
        },
        "application/x-bdoc": {
            "compressible": false,
            "extensions": [
                "bdoc"
            ]
        },
        "application/x-bittorrent": {
            "source": "apache",
            "extensions": [
                "torrent"
            ]
        },
        "application/x-blorb": {
            "source": "apache",
            "extensions": [
                "blb",
                "blorb"
            ]
        },
        "application/x-bzip": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "bz"
            ]
        },
        "application/x-bzip2": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "bz2",
                "boz"
            ]
        },
        "application/x-cbr": {
            "source": "apache",
            "extensions": [
                "cbr",
                "cba",
                "cbt",
                "cbz",
                "cb7"
            ]
        },
        "application/x-cdlink": {
            "source": "apache",
            "extensions": [
                "vcd"
            ]
        },
        "application/x-cfs-compressed": {
            "source": "apache",
            "extensions": [
                "cfs"
            ]
        },
        "application/x-chat": {
            "source": "apache",
            "extensions": [
                "chat"
            ]
        },
        "application/x-chess-pgn": {
            "source": "apache",
            "extensions": [
                "pgn"
            ]
        },
        "application/x-chrome-extension": {
            "extensions": [
                "crx"
            ]
        },
        "application/x-cocoa": {
            "source": "nginx",
            "extensions": [
                "cco"
            ]
        },
        "application/x-compress": {
            "source": "apache"
        },
        "application/x-conference": {
            "source": "apache",
            "extensions": [
                "nsc"
            ]
        },
        "application/x-cpio": {
            "source": "apache",
            "extensions": [
                "cpio"
            ]
        },
        "application/x-csh": {
            "source": "apache",
            "extensions": [
                "csh"
            ]
        },
        "application/x-deb": {
            "compressible": false
        },
        "application/x-debian-package": {
            "source": "apache",
            "extensions": [
                "deb",
                "udeb"
            ]
        },
        "application/x-dgc-compressed": {
            "source": "apache",
            "extensions": [
                "dgc"
            ]
        },
        "application/x-director": {
            "source": "apache",
            "extensions": [
                "dir",
                "dcr",
                "dxr",
                "cst",
                "cct",
                "cxt",
                "w3d",
                "fgd",
                "swa"
            ]
        },
        "application/x-doom": {
            "source": "apache",
            "extensions": [
                "wad"
            ]
        },
        "application/x-dtbncx+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "ncx"
            ]
        },
        "application/x-dtbook+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "dtb"
            ]
        },
        "application/x-dtbresource+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "res"
            ]
        },
        "application/x-dvi": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "dvi"
            ]
        },
        "application/x-envoy": {
            "source": "apache",
            "extensions": [
                "evy"
            ]
        },
        "application/x-eva": {
            "source": "apache",
            "extensions": [
                "eva"
            ]
        },
        "application/x-font-bdf": {
            "source": "apache",
            "extensions": [
                "bdf"
            ]
        },
        "application/x-font-dos": {
            "source": "apache"
        },
        "application/x-font-framemaker": {
            "source": "apache"
        },
        "application/x-font-ghostscript": {
            "source": "apache",
            "extensions": [
                "gsf"
            ]
        },
        "application/x-font-libgrx": {
            "source": "apache"
        },
        "application/x-font-linux-psf": {
            "source": "apache",
            "extensions": [
                "psf"
            ]
        },
        "application/x-font-pcf": {
            "source": "apache",
            "extensions": [
                "pcf"
            ]
        },
        "application/x-font-snf": {
            "source": "apache",
            "extensions": [
                "snf"
            ]
        },
        "application/x-font-speedo": {
            "source": "apache"
        },
        "application/x-font-sunos-news": {
            "source": "apache"
        },
        "application/x-font-type1": {
            "source": "apache",
            "extensions": [
                "pfa",
                "pfb",
                "pfm",
                "afm"
            ]
        },
        "application/x-font-vfont": {
            "source": "apache"
        },
        "application/x-freearc": {
            "source": "apache",
            "extensions": [
                "arc"
            ]
        },
        "application/x-futuresplash": {
            "source": "apache",
            "extensions": [
                "spl"
            ]
        },
        "application/x-gca-compressed": {
            "source": "apache",
            "extensions": [
                "gca"
            ]
        },
        "application/x-glulx": {
            "source": "apache",
            "extensions": [
                "ulx"
            ]
        },
        "application/x-gnumeric": {
            "source": "apache",
            "extensions": [
                "gnumeric"
            ]
        },
        "application/x-gramps-xml": {
            "source": "apache",
            "extensions": [
                "gramps"
            ]
        },
        "application/x-gtar": {
            "source": "apache",
            "extensions": [
                "gtar"
            ]
        },
        "application/x-gzip": {
            "source": "apache"
        },
        "application/x-hdf": {
            "source": "apache",
            "extensions": [
                "hdf"
            ]
        },
        "application/x-httpd-php": {
            "compressible": true,
            "extensions": [
                "php"
            ]
        },
        "application/x-install-instructions": {
            "source": "apache",
            "extensions": [
                "install"
            ]
        },
        "application/x-iso9660-image": {
            "source": "apache",
            "extensions": [
                "iso"
            ]
        },
        "application/x-iwork-keynote-sffkey": {
            "extensions": [
                "key"
            ]
        },
        "application/x-iwork-numbers-sffnumbers": {
            "extensions": [
                "numbers"
            ]
        },
        "application/x-iwork-pages-sffpages": {
            "extensions": [
                "pages"
            ]
        },
        "application/x-java-archive-diff": {
            "source": "nginx",
            "extensions": [
                "jardiff"
            ]
        },
        "application/x-java-jnlp-file": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "jnlp"
            ]
        },
        "application/x-javascript": {
            "compressible": true
        },
        "application/x-keepass2": {
            "extensions": [
                "kdbx"
            ]
        },
        "application/x-latex": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "latex"
            ]
        },
        "application/x-lua-bytecode": {
            "extensions": [
                "luac"
            ]
        },
        "application/x-lzh-compressed": {
            "source": "apache",
            "extensions": [
                "lzh",
                "lha"
            ]
        },
        "application/x-makeself": {
            "source": "nginx",
            "extensions": [
                "run"
            ]
        },
        "application/x-mie": {
            "source": "apache",
            "extensions": [
                "mie"
            ]
        },
        "application/x-mobipocket-ebook": {
            "source": "apache",
            "extensions": [
                "prc",
                "mobi"
            ]
        },
        "application/x-mpegurl": {
            "compressible": false
        },
        "application/x-ms-application": {
            "source": "apache",
            "extensions": [
                "application"
            ]
        },
        "application/x-ms-shortcut": {
            "source": "apache",
            "extensions": [
                "lnk"
            ]
        },
        "application/x-ms-wmd": {
            "source": "apache",
            "extensions": [
                "wmd"
            ]
        },
        "application/x-ms-wmz": {
            "source": "apache",
            "extensions": [
                "wmz"
            ]
        },
        "application/x-ms-xbap": {
            "source": "apache",
            "extensions": [
                "xbap"
            ]
        },
        "application/x-msaccess": {
            "source": "apache",
            "extensions": [
                "mdb"
            ]
        },
        "application/x-msbinder": {
            "source": "apache",
            "extensions": [
                "obd"
            ]
        },
        "application/x-mscardfile": {
            "source": "apache",
            "extensions": [
                "crd"
            ]
        },
        "application/x-msclip": {
            "source": "apache",
            "extensions": [
                "clp"
            ]
        },
        "application/x-msdos-program": {
            "extensions": [
                "exe"
            ]
        },
        "application/x-msdownload": {
            "source": "apache",
            "extensions": [
                "exe",
                "dll",
                "com",
                "bat",
                "msi"
            ]
        },
        "application/x-msmediaview": {
            "source": "apache",
            "extensions": [
                "mvb",
                "m13",
                "m14"
            ]
        },
        "application/x-msmetafile": {
            "source": "apache",
            "extensions": [
                "wmf",
                "wmz",
                "emf",
                "emz"
            ]
        },
        "application/x-msmoney": {
            "source": "apache",
            "extensions": [
                "mny"
            ]
        },
        "application/x-mspublisher": {
            "source": "apache",
            "extensions": [
                "pub"
            ]
        },
        "application/x-msschedule": {
            "source": "apache",
            "extensions": [
                "scd"
            ]
        },
        "application/x-msterminal": {
            "source": "apache",
            "extensions": [
                "trm"
            ]
        },
        "application/x-mswrite": {
            "source": "apache",
            "extensions": [
                "wri"
            ]
        },
        "application/x-netcdf": {
            "source": "apache",
            "extensions": [
                "nc",
                "cdf"
            ]
        },
        "application/x-ns-proxy-autoconfig": {
            "compressible": true,
            "extensions": [
                "pac"
            ]
        },
        "application/x-nzb": {
            "source": "apache",
            "extensions": [
                "nzb"
            ]
        },
        "application/x-perl": {
            "source": "nginx",
            "extensions": [
                "pl",
                "pm"
            ]
        },
        "application/x-pilot": {
            "source": "nginx",
            "extensions": [
                "prc",
                "pdb"
            ]
        },
        "application/x-pkcs12": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "p12",
                "pfx"
            ]
        },
        "application/x-pkcs7-certificates": {
            "source": "apache",
            "extensions": [
                "p7b",
                "spc"
            ]
        },
        "application/x-pkcs7-certreqresp": {
            "source": "apache",
            "extensions": [
                "p7r"
            ]
        },
        "application/x-pki-message": {
            "source": "iana"
        },
        "application/x-rar-compressed": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "rar"
            ]
        },
        "application/x-redhat-package-manager": {
            "source": "nginx",
            "extensions": [
                "rpm"
            ]
        },
        "application/x-research-info-systems": {
            "source": "apache",
            "extensions": [
                "ris"
            ]
        },
        "application/x-sea": {
            "source": "nginx",
            "extensions": [
                "sea"
            ]
        },
        "application/x-sh": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "sh"
            ]
        },
        "application/x-shar": {
            "source": "apache",
            "extensions": [
                "shar"
            ]
        },
        "application/x-shockwave-flash": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "swf"
            ]
        },
        "application/x-silverlight-app": {
            "source": "apache",
            "extensions": [
                "xap"
            ]
        },
        "application/x-sql": {
            "source": "apache",
            "extensions": [
                "sql"
            ]
        },
        "application/x-stuffit": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "sit"
            ]
        },
        "application/x-stuffitx": {
            "source": "apache",
            "extensions": [
                "sitx"
            ]
        },
        "application/x-subrip": {
            "source": "apache",
            "extensions": [
                "srt"
            ]
        },
        "application/x-sv4cpio": {
            "source": "apache",
            "extensions": [
                "sv4cpio"
            ]
        },
        "application/x-sv4crc": {
            "source": "apache",
            "extensions": [
                "sv4crc"
            ]
        },
        "application/x-t3vm-image": {
            "source": "apache",
            "extensions": [
                "t3"
            ]
        },
        "application/x-tads": {
            "source": "apache",
            "extensions": [
                "gam"
            ]
        },
        "application/x-tar": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "tar"
            ]
        },
        "application/x-tcl": {
            "source": "apache",
            "extensions": [
                "tcl",
                "tk"
            ]
        },
        "application/x-tex": {
            "source": "apache",
            "extensions": [
                "tex"
            ]
        },
        "application/x-tex-tfm": {
            "source": "apache",
            "extensions": [
                "tfm"
            ]
        },
        "application/x-texinfo": {
            "source": "apache",
            "extensions": [
                "texinfo",
                "texi"
            ]
        },
        "application/x-tgif": {
            "source": "apache",
            "extensions": [
                "obj"
            ]
        },
        "application/x-ustar": {
            "source": "apache",
            "extensions": [
                "ustar"
            ]
        },
        "application/x-virtualbox-hdd": {
            "compressible": true,
            "extensions": [
                "hdd"
            ]
        },
        "application/x-virtualbox-ova": {
            "compressible": true,
            "extensions": [
                "ova"
            ]
        },
        "application/x-virtualbox-ovf": {
            "compressible": true,
            "extensions": [
                "ovf"
            ]
        },
        "application/x-virtualbox-vbox": {
            "compressible": true,
            "extensions": [
                "vbox"
            ]
        },
        "application/x-virtualbox-vbox-extpack": {
            "compressible": false,
            "extensions": [
                "vbox-extpack"
            ]
        },
        "application/x-virtualbox-vdi": {
            "compressible": true,
            "extensions": [
                "vdi"
            ]
        },
        "application/x-virtualbox-vhd": {
            "compressible": true,
            "extensions": [
                "vhd"
            ]
        },
        "application/x-virtualbox-vmdk": {
            "compressible": true,
            "extensions": [
                "vmdk"
            ]
        },
        "application/x-wais-source": {
            "source": "apache",
            "extensions": [
                "src"
            ]
        },
        "application/x-web-app-manifest+json": {
            "compressible": true,
            "extensions": [
                "webapp"
            ]
        },
        "application/x-www-form-urlencoded": {
            "source": "iana",
            "compressible": true
        },
        "application/x-x509-ca-cert": {
            "source": "iana",
            "extensions": [
                "der",
                "crt",
                "pem"
            ]
        },
        "application/x-x509-ca-ra-cert": {
            "source": "iana"
        },
        "application/x-x509-next-ca-cert": {
            "source": "iana"
        },
        "application/x-xfig": {
            "source": "apache",
            "extensions": [
                "fig"
            ]
        },
        "application/x-xliff+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "xlf"
            ]
        },
        "application/x-xpinstall": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "xpi"
            ]
        },
        "application/x-xz": {
            "source": "apache",
            "extensions": [
                "xz"
            ]
        },
        "application/x-zmachine": {
            "source": "apache",
            "extensions": [
                "z1",
                "z2",
                "z3",
                "z4",
                "z5",
                "z6",
                "z7",
                "z8"
            ]
        },
        "application/x400-bp": {
            "source": "iana"
        },
        "application/xacml+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xaml+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "xaml"
            ]
        },
        "application/xcap-att+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xav"
            ]
        },
        "application/xcap-caps+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xca"
            ]
        },
        "application/xcap-diff+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xdf"
            ]
        },
        "application/xcap-el+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xel"
            ]
        },
        "application/xcap-error+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xcap-ns+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xns"
            ]
        },
        "application/xcon-conference-info+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xcon-conference-info-diff+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xenc+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xenc"
            ]
        },
        "application/xhtml+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xhtml",
                "xht"
            ]
        },
        "application/xhtml-voice+xml": {
            "source": "apache",
            "compressible": true
        },
        "application/xliff+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xlf"
            ]
        },
        "application/xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xml",
                "xsl",
                "xsd",
                "rng"
            ]
        },
        "application/xml-dtd": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "dtd"
            ]
        },
        "application/xml-external-parsed-entity": {
            "source": "iana"
        },
        "application/xml-patch+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xmpp+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/xop+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xop"
            ]
        },
        "application/xproc+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "xpl"
            ]
        },
        "application/xslt+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xsl",
                "xslt"
            ]
        },
        "application/xspf+xml": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "xspf"
            ]
        },
        "application/xv+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "mxml",
                "xhvml",
                "xvml",
                "xvm"
            ]
        },
        "application/yang": {
            "source": "iana",
            "extensions": [
                "yang"
            ]
        },
        "application/yang-data+json": {
            "source": "iana",
            "compressible": true
        },
        "application/yang-data+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/yang-patch+json": {
            "source": "iana",
            "compressible": true
        },
        "application/yang-patch+xml": {
            "source": "iana",
            "compressible": true
        },
        "application/yin+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "yin"
            ]
        },
        "application/zip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "zip"
            ]
        },
        "application/zlib": {
            "source": "iana"
        },
        "application/zstd": {
            "source": "iana"
        },
        "audio/1d-interleaved-parityfec": {
            "source": "iana"
        },
        "audio/32kadpcm": {
            "source": "iana"
        },
        "audio/3gpp": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "3gpp"
            ]
        },
        "audio/3gpp2": {
            "source": "iana"
        },
        "audio/aac": {
            "source": "iana"
        },
        "audio/ac3": {
            "source": "iana"
        },
        "audio/adpcm": {
            "source": "apache",
            "extensions": [
                "adp"
            ]
        },
        "audio/amr": {
            "source": "iana",
            "extensions": [
                "amr"
            ]
        },
        "audio/amr-wb": {
            "source": "iana"
        },
        "audio/amr-wb+": {
            "source": "iana"
        },
        "audio/aptx": {
            "source": "iana"
        },
        "audio/asc": {
            "source": "iana"
        },
        "audio/atrac-advanced-lossless": {
            "source": "iana"
        },
        "audio/atrac-x": {
            "source": "iana"
        },
        "audio/atrac3": {
            "source": "iana"
        },
        "audio/basic": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "au",
                "snd"
            ]
        },
        "audio/bv16": {
            "source": "iana"
        },
        "audio/bv32": {
            "source": "iana"
        },
        "audio/clearmode": {
            "source": "iana"
        },
        "audio/cn": {
            "source": "iana"
        },
        "audio/dat12": {
            "source": "iana"
        },
        "audio/dls": {
            "source": "iana"
        },
        "audio/dsr-es201108": {
            "source": "iana"
        },
        "audio/dsr-es202050": {
            "source": "iana"
        },
        "audio/dsr-es202211": {
            "source": "iana"
        },
        "audio/dsr-es202212": {
            "source": "iana"
        },
        "audio/dv": {
            "source": "iana"
        },
        "audio/dvi4": {
            "source": "iana"
        },
        "audio/eac3": {
            "source": "iana"
        },
        "audio/encaprtp": {
            "source": "iana"
        },
        "audio/evrc": {
            "source": "iana"
        },
        "audio/evrc-qcp": {
            "source": "iana"
        },
        "audio/evrc0": {
            "source": "iana"
        },
        "audio/evrc1": {
            "source": "iana"
        },
        "audio/evrcb": {
            "source": "iana"
        },
        "audio/evrcb0": {
            "source": "iana"
        },
        "audio/evrcb1": {
            "source": "iana"
        },
        "audio/evrcnw": {
            "source": "iana"
        },
        "audio/evrcnw0": {
            "source": "iana"
        },
        "audio/evrcnw1": {
            "source": "iana"
        },
        "audio/evrcwb": {
            "source": "iana"
        },
        "audio/evrcwb0": {
            "source": "iana"
        },
        "audio/evrcwb1": {
            "source": "iana"
        },
        "audio/evs": {
            "source": "iana"
        },
        "audio/flexfec": {
            "source": "iana"
        },
        "audio/fwdred": {
            "source": "iana"
        },
        "audio/g711-0": {
            "source": "iana"
        },
        "audio/g719": {
            "source": "iana"
        },
        "audio/g722": {
            "source": "iana"
        },
        "audio/g7221": {
            "source": "iana"
        },
        "audio/g723": {
            "source": "iana"
        },
        "audio/g726-16": {
            "source": "iana"
        },
        "audio/g726-24": {
            "source": "iana"
        },
        "audio/g726-32": {
            "source": "iana"
        },
        "audio/g726-40": {
            "source": "iana"
        },
        "audio/g728": {
            "source": "iana"
        },
        "audio/g729": {
            "source": "iana"
        },
        "audio/g7291": {
            "source": "iana"
        },
        "audio/g729d": {
            "source": "iana"
        },
        "audio/g729e": {
            "source": "iana"
        },
        "audio/gsm": {
            "source": "iana"
        },
        "audio/gsm-efr": {
            "source": "iana"
        },
        "audio/gsm-hr-08": {
            "source": "iana"
        },
        "audio/ilbc": {
            "source": "iana"
        },
        "audio/ip-mr_v2.5": {
            "source": "iana"
        },
        "audio/isac": {
            "source": "apache"
        },
        "audio/l16": {
            "source": "iana"
        },
        "audio/l20": {
            "source": "iana"
        },
        "audio/l24": {
            "source": "iana",
            "compressible": false
        },
        "audio/l8": {
            "source": "iana"
        },
        "audio/lpc": {
            "source": "iana"
        },
        "audio/melp": {
            "source": "iana"
        },
        "audio/melp1200": {
            "source": "iana"
        },
        "audio/melp2400": {
            "source": "iana"
        },
        "audio/melp600": {
            "source": "iana"
        },
        "audio/mhas": {
            "source": "iana"
        },
        "audio/midi": {
            "source": "apache",
            "extensions": [
                "mid",
                "midi",
                "kar",
                "rmi"
            ]
        },
        "audio/mobile-xmf": {
            "source": "iana",
            "extensions": [
                "mxmf"
            ]
        },
        "audio/mp3": {
            "compressible": false,
            "extensions": [
                "mp3"
            ]
        },
        "audio/mp4": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "m4a",
                "mp4a"
            ]
        },
        "audio/mp4a-latm": {
            "source": "iana"
        },
        "audio/mpa": {
            "source": "iana"
        },
        "audio/mpa-robust": {
            "source": "iana"
        },
        "audio/mpeg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "mpga",
                "mp2",
                "mp2a",
                "mp3",
                "m2a",
                "m3a"
            ]
        },
        "audio/mpeg4-generic": {
            "source": "iana"
        },
        "audio/musepack": {
            "source": "apache"
        },
        "audio/ogg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "oga",
                "ogg",
                "spx",
                "opus"
            ]
        },
        "audio/opus": {
            "source": "iana"
        },
        "audio/parityfec": {
            "source": "iana"
        },
        "audio/pcma": {
            "source": "iana"
        },
        "audio/pcma-wb": {
            "source": "iana"
        },
        "audio/pcmu": {
            "source": "iana"
        },
        "audio/pcmu-wb": {
            "source": "iana"
        },
        "audio/prs.sid": {
            "source": "iana"
        },
        "audio/qcelp": {
            "source": "iana"
        },
        "audio/raptorfec": {
            "source": "iana"
        },
        "audio/red": {
            "source": "iana"
        },
        "audio/rtp-enc-aescm128": {
            "source": "iana"
        },
        "audio/rtp-midi": {
            "source": "iana"
        },
        "audio/rtploopback": {
            "source": "iana"
        },
        "audio/rtx": {
            "source": "iana"
        },
        "audio/s3m": {
            "source": "apache",
            "extensions": [
                "s3m"
            ]
        },
        "audio/scip": {
            "source": "iana"
        },
        "audio/silk": {
            "source": "apache",
            "extensions": [
                "sil"
            ]
        },
        "audio/smv": {
            "source": "iana"
        },
        "audio/smv-qcp": {
            "source": "iana"
        },
        "audio/smv0": {
            "source": "iana"
        },
        "audio/sofa": {
            "source": "iana"
        },
        "audio/sp-midi": {
            "source": "iana"
        },
        "audio/speex": {
            "source": "iana"
        },
        "audio/t140c": {
            "source": "iana"
        },
        "audio/t38": {
            "source": "iana"
        },
        "audio/telephone-event": {
            "source": "iana"
        },
        "audio/tetra_acelp": {
            "source": "iana"
        },
        "audio/tetra_acelp_bb": {
            "source": "iana"
        },
        "audio/tone": {
            "source": "iana"
        },
        "audio/tsvcis": {
            "source": "iana"
        },
        "audio/uemclip": {
            "source": "iana"
        },
        "audio/ulpfec": {
            "source": "iana"
        },
        "audio/usac": {
            "source": "iana"
        },
        "audio/vdvi": {
            "source": "iana"
        },
        "audio/vmr-wb": {
            "source": "iana"
        },
        "audio/vnd.3gpp.iufp": {
            "source": "iana"
        },
        "audio/vnd.4sb": {
            "source": "iana"
        },
        "audio/vnd.audiokoz": {
            "source": "iana"
        },
        "audio/vnd.celp": {
            "source": "iana"
        },
        "audio/vnd.cisco.nse": {
            "source": "iana"
        },
        "audio/vnd.cmles.radio-events": {
            "source": "iana"
        },
        "audio/vnd.cns.anp1": {
            "source": "iana"
        },
        "audio/vnd.cns.inf1": {
            "source": "iana"
        },
        "audio/vnd.dece.audio": {
            "source": "iana",
            "extensions": [
                "uva",
                "uvva"
            ]
        },
        "audio/vnd.digital-winds": {
            "source": "iana",
            "extensions": [
                "eol"
            ]
        },
        "audio/vnd.dlna.adts": {
            "source": "iana"
        },
        "audio/vnd.dolby.heaac.1": {
            "source": "iana"
        },
        "audio/vnd.dolby.heaac.2": {
            "source": "iana"
        },
        "audio/vnd.dolby.mlp": {
            "source": "iana"
        },
        "audio/vnd.dolby.mps": {
            "source": "iana"
        },
        "audio/vnd.dolby.pl2": {
            "source": "iana"
        },
        "audio/vnd.dolby.pl2x": {
            "source": "iana"
        },
        "audio/vnd.dolby.pl2z": {
            "source": "iana"
        },
        "audio/vnd.dolby.pulse.1": {
            "source": "iana"
        },
        "audio/vnd.dra": {
            "source": "iana",
            "extensions": [
                "dra"
            ]
        },
        "audio/vnd.dts": {
            "source": "iana",
            "extensions": [
                "dts"
            ]
        },
        "audio/vnd.dts.hd": {
            "source": "iana",
            "extensions": [
                "dtshd"
            ]
        },
        "audio/vnd.dts.uhd": {
            "source": "iana"
        },
        "audio/vnd.dvb.file": {
            "source": "iana"
        },
        "audio/vnd.everad.plj": {
            "source": "iana"
        },
        "audio/vnd.hns.audio": {
            "source": "iana"
        },
        "audio/vnd.lucent.voice": {
            "source": "iana",
            "extensions": [
                "lvp"
            ]
        },
        "audio/vnd.ms-playready.media.pya": {
            "source": "iana",
            "extensions": [
                "pya"
            ]
        },
        "audio/vnd.nokia.mobile-xmf": {
            "source": "iana"
        },
        "audio/vnd.nortel.vbk": {
            "source": "iana"
        },
        "audio/vnd.nuera.ecelp4800": {
            "source": "iana",
            "extensions": [
                "ecelp4800"
            ]
        },
        "audio/vnd.nuera.ecelp7470": {
            "source": "iana",
            "extensions": [
                "ecelp7470"
            ]
        },
        "audio/vnd.nuera.ecelp9600": {
            "source": "iana",
            "extensions": [
                "ecelp9600"
            ]
        },
        "audio/vnd.octel.sbc": {
            "source": "iana"
        },
        "audio/vnd.presonus.multitrack": {
            "source": "iana"
        },
        "audio/vnd.qcelp": {
            "source": "iana"
        },
        "audio/vnd.rhetorex.32kadpcm": {
            "source": "iana"
        },
        "audio/vnd.rip": {
            "source": "iana",
            "extensions": [
                "rip"
            ]
        },
        "audio/vnd.rn-realaudio": {
            "compressible": false
        },
        "audio/vnd.sealedmedia.softseal.mpeg": {
            "source": "iana"
        },
        "audio/vnd.vmx.cvsd": {
            "source": "iana"
        },
        "audio/vnd.wave": {
            "compressible": false
        },
        "audio/vorbis": {
            "source": "iana",
            "compressible": false
        },
        "audio/vorbis-config": {
            "source": "iana"
        },
        "audio/wav": {
            "compressible": false,
            "extensions": [
                "wav"
            ]
        },
        "audio/wave": {
            "compressible": false,
            "extensions": [
                "wav"
            ]
        },
        "audio/webm": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "weba"
            ]
        },
        "audio/x-aac": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "aac"
            ]
        },
        "audio/x-aiff": {
            "source": "apache",
            "extensions": [
                "aif",
                "aiff",
                "aifc"
            ]
        },
        "audio/x-caf": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "caf"
            ]
        },
        "audio/x-flac": {
            "source": "apache",
            "extensions": [
                "flac"
            ]
        },
        "audio/x-m4a": {
            "source": "nginx",
            "extensions": [
                "m4a"
            ]
        },
        "audio/x-matroska": {
            "source": "apache",
            "extensions": [
                "mka"
            ]
        },
        "audio/x-mpegurl": {
            "source": "apache",
            "extensions": [
                "m3u"
            ]
        },
        "audio/x-ms-wax": {
            "source": "apache",
            "extensions": [
                "wax"
            ]
        },
        "audio/x-ms-wma": {
            "source": "apache",
            "extensions": [
                "wma"
            ]
        },
        "audio/x-pn-realaudio": {
            "source": "apache",
            "extensions": [
                "ram",
                "ra"
            ]
        },
        "audio/x-pn-realaudio-plugin": {
            "source": "apache",
            "extensions": [
                "rmp"
            ]
        },
        "audio/x-realaudio": {
            "source": "nginx",
            "extensions": [
                "ra"
            ]
        },
        "audio/x-tta": {
            "source": "apache"
        },
        "audio/x-wav": {
            "source": "apache",
            "extensions": [
                "wav"
            ]
        },
        "audio/xm": {
            "source": "apache",
            "extensions": [
                "xm"
            ]
        },
        "chemical/x-cdx": {
            "source": "apache",
            "extensions": [
                "cdx"
            ]
        },
        "chemical/x-cif": {
            "source": "apache",
            "extensions": [
                "cif"
            ]
        },
        "chemical/x-cmdf": {
            "source": "apache",
            "extensions": [
                "cmdf"
            ]
        },
        "chemical/x-cml": {
            "source": "apache",
            "extensions": [
                "cml"
            ]
        },
        "chemical/x-csml": {
            "source": "apache",
            "extensions": [
                "csml"
            ]
        },
        "chemical/x-pdb": {
            "source": "apache"
        },
        "chemical/x-xyz": {
            "source": "apache",
            "extensions": [
                "xyz"
            ]
        },
        "font/collection": {
            "source": "iana",
            "extensions": [
                "ttc"
            ]
        },
        "font/otf": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "otf"
            ]
        },
        "font/sfnt": {
            "source": "iana"
        },
        "font/ttf": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ttf"
            ]
        },
        "font/woff": {
            "source": "iana",
            "extensions": [
                "woff"
            ]
        },
        "font/woff2": {
            "source": "iana",
            "extensions": [
                "woff2"
            ]
        },
        "image/aces": {
            "source": "iana",
            "extensions": [
                "exr"
            ]
        },
        "image/apng": {
            "compressible": false,
            "extensions": [
                "apng"
            ]
        },
        "image/avci": {
            "source": "iana",
            "extensions": [
                "avci"
            ]
        },
        "image/avcs": {
            "source": "iana",
            "extensions": [
                "avcs"
            ]
        },
        "image/avif": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "avif"
            ]
        },
        "image/bmp": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "bmp"
            ]
        },
        "image/cgm": {
            "source": "iana",
            "extensions": [
                "cgm"
            ]
        },
        "image/dicom-rle": {
            "source": "iana",
            "extensions": [
                "drle"
            ]
        },
        "image/emf": {
            "source": "iana",
            "extensions": [
                "emf"
            ]
        },
        "image/fits": {
            "source": "iana",
            "extensions": [
                "fits"
            ]
        },
        "image/g3fax": {
            "source": "iana",
            "extensions": [
                "g3"
            ]
        },
        "image/gif": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "gif"
            ]
        },
        "image/heic": {
            "source": "iana",
            "extensions": [
                "heic"
            ]
        },
        "image/heic-sequence": {
            "source": "iana",
            "extensions": [
                "heics"
            ]
        },
        "image/heif": {
            "source": "iana",
            "extensions": [
                "heif"
            ]
        },
        "image/heif-sequence": {
            "source": "iana",
            "extensions": [
                "heifs"
            ]
        },
        "image/hej2k": {
            "source": "iana",
            "extensions": [
                "hej2"
            ]
        },
        "image/hsj2": {
            "source": "iana",
            "extensions": [
                "hsj2"
            ]
        },
        "image/ief": {
            "source": "iana",
            "extensions": [
                "ief"
            ]
        },
        "image/jls": {
            "source": "iana",
            "extensions": [
                "jls"
            ]
        },
        "image/jp2": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "jp2",
                "jpg2"
            ]
        },
        "image/jpeg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "jpeg",
                "jpg",
                "jpe"
            ]
        },
        "image/jph": {
            "source": "iana",
            "extensions": [
                "jph"
            ]
        },
        "image/jphc": {
            "source": "iana",
            "extensions": [
                "jhc"
            ]
        },
        "image/jpm": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "jpm"
            ]
        },
        "image/jpx": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "jpx",
                "jpf"
            ]
        },
        "image/jxr": {
            "source": "iana",
            "extensions": [
                "jxr"
            ]
        },
        "image/jxra": {
            "source": "iana",
            "extensions": [
                "jxra"
            ]
        },
        "image/jxrs": {
            "source": "iana",
            "extensions": [
                "jxrs"
            ]
        },
        "image/jxs": {
            "source": "iana",
            "extensions": [
                "jxs"
            ]
        },
        "image/jxsc": {
            "source": "iana",
            "extensions": [
                "jxsc"
            ]
        },
        "image/jxsi": {
            "source": "iana",
            "extensions": [
                "jxsi"
            ]
        },
        "image/jxss": {
            "source": "iana",
            "extensions": [
                "jxss"
            ]
        },
        "image/ktx": {
            "source": "iana",
            "extensions": [
                "ktx"
            ]
        },
        "image/ktx2": {
            "source": "iana",
            "extensions": [
                "ktx2"
            ]
        },
        "image/naplps": {
            "source": "iana"
        },
        "image/pjpeg": {
            "compressible": false
        },
        "image/png": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "png"
            ]
        },
        "image/prs.btif": {
            "source": "iana",
            "extensions": [
                "btif"
            ]
        },
        "image/prs.pti": {
            "source": "iana",
            "extensions": [
                "pti"
            ]
        },
        "image/pwg-raster": {
            "source": "iana"
        },
        "image/sgi": {
            "source": "apache",
            "extensions": [
                "sgi"
            ]
        },
        "image/svg+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "svg",
                "svgz"
            ]
        },
        "image/t38": {
            "source": "iana",
            "extensions": [
                "t38"
            ]
        },
        "image/tiff": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "tif",
                "tiff"
            ]
        },
        "image/tiff-fx": {
            "source": "iana",
            "extensions": [
                "tfx"
            ]
        },
        "image/vnd.adobe.photoshop": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "psd"
            ]
        },
        "image/vnd.airzip.accelerator.azv": {
            "source": "iana",
            "extensions": [
                "azv"
            ]
        },
        "image/vnd.cns.inf2": {
            "source": "iana"
        },
        "image/vnd.dece.graphic": {
            "source": "iana",
            "extensions": [
                "uvi",
                "uvvi",
                "uvg",
                "uvvg"
            ]
        },
        "image/vnd.djvu": {
            "source": "iana",
            "extensions": [
                "djvu",
                "djv"
            ]
        },
        "image/vnd.dvb.subtitle": {
            "source": "iana",
            "extensions": [
                "sub"
            ]
        },
        "image/vnd.dwg": {
            "source": "iana",
            "extensions": [
                "dwg"
            ]
        },
        "image/vnd.dxf": {
            "source": "iana",
            "extensions": [
                "dxf"
            ]
        },
        "image/vnd.fastbidsheet": {
            "source": "iana",
            "extensions": [
                "fbs"
            ]
        },
        "image/vnd.fpx": {
            "source": "iana",
            "extensions": [
                "fpx"
            ]
        },
        "image/vnd.fst": {
            "source": "iana",
            "extensions": [
                "fst"
            ]
        },
        "image/vnd.fujixerox.edmics-mmr": {
            "source": "iana",
            "extensions": [
                "mmr"
            ]
        },
        "image/vnd.fujixerox.edmics-rlc": {
            "source": "iana",
            "extensions": [
                "rlc"
            ]
        },
        "image/vnd.globalgraphics.pgb": {
            "source": "iana"
        },
        "image/vnd.microsoft.icon": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "ico"
            ]
        },
        "image/vnd.mix": {
            "source": "iana"
        },
        "image/vnd.mozilla.apng": {
            "source": "iana"
        },
        "image/vnd.ms-dds": {
            "compressible": true,
            "extensions": [
                "dds"
            ]
        },
        "image/vnd.ms-modi": {
            "source": "iana",
            "extensions": [
                "mdi"
            ]
        },
        "image/vnd.ms-photo": {
            "source": "apache",
            "extensions": [
                "wdp"
            ]
        },
        "image/vnd.net-fpx": {
            "source": "iana",
            "extensions": [
                "npx"
            ]
        },
        "image/vnd.pco.b16": {
            "source": "iana",
            "extensions": [
                "b16"
            ]
        },
        "image/vnd.radiance": {
            "source": "iana"
        },
        "image/vnd.sealed.png": {
            "source": "iana"
        },
        "image/vnd.sealedmedia.softseal.gif": {
            "source": "iana"
        },
        "image/vnd.sealedmedia.softseal.jpg": {
            "source": "iana"
        },
        "image/vnd.svf": {
            "source": "iana"
        },
        "image/vnd.tencent.tap": {
            "source": "iana",
            "extensions": [
                "tap"
            ]
        },
        "image/vnd.valve.source.texture": {
            "source": "iana",
            "extensions": [
                "vtf"
            ]
        },
        "image/vnd.wap.wbmp": {
            "source": "iana",
            "extensions": [
                "wbmp"
            ]
        },
        "image/vnd.xiff": {
            "source": "iana",
            "extensions": [
                "xif"
            ]
        },
        "image/vnd.zbrush.pcx": {
            "source": "iana",
            "extensions": [
                "pcx"
            ]
        },
        "image/webp": {
            "source": "apache",
            "extensions": [
                "webp"
            ]
        },
        "image/wmf": {
            "source": "iana",
            "extensions": [
                "wmf"
            ]
        },
        "image/x-3ds": {
            "source": "apache",
            "extensions": [
                "3ds"
            ]
        },
        "image/x-cmu-raster": {
            "source": "apache",
            "extensions": [
                "ras"
            ]
        },
        "image/x-cmx": {
            "source": "apache",
            "extensions": [
                "cmx"
            ]
        },
        "image/x-freehand": {
            "source": "apache",
            "extensions": [
                "fh",
                "fhc",
                "fh4",
                "fh5",
                "fh7"
            ]
        },
        "image/x-icon": {
            "source": "apache",
            "compressible": true,
            "extensions": [
                "ico"
            ]
        },
        "image/x-jng": {
            "source": "nginx",
            "extensions": [
                "jng"
            ]
        },
        "image/x-mrsid-image": {
            "source": "apache",
            "extensions": [
                "sid"
            ]
        },
        "image/x-ms-bmp": {
            "source": "nginx",
            "compressible": true,
            "extensions": [
                "bmp"
            ]
        },
        "image/x-pcx": {
            "source": "apache",
            "extensions": [
                "pcx"
            ]
        },
        "image/x-pict": {
            "source": "apache",
            "extensions": [
                "pic",
                "pct"
            ]
        },
        "image/x-portable-anymap": {
            "source": "apache",
            "extensions": [
                "pnm"
            ]
        },
        "image/x-portable-bitmap": {
            "source": "apache",
            "extensions": [
                "pbm"
            ]
        },
        "image/x-portable-graymap": {
            "source": "apache",
            "extensions": [
                "pgm"
            ]
        },
        "image/x-portable-pixmap": {
            "source": "apache",
            "extensions": [
                "ppm"
            ]
        },
        "image/x-rgb": {
            "source": "apache",
            "extensions": [
                "rgb"
            ]
        },
        "image/x-tga": {
            "source": "apache",
            "extensions": [
                "tga"
            ]
        },
        "image/x-xbitmap": {
            "source": "apache",
            "extensions": [
                "xbm"
            ]
        },
        "image/x-xcf": {
            "compressible": false
        },
        "image/x-xpixmap": {
            "source": "apache",
            "extensions": [
                "xpm"
            ]
        },
        "image/x-xwindowdump": {
            "source": "apache",
            "extensions": [
                "xwd"
            ]
        },
        "message/cpim": {
            "source": "iana"
        },
        "message/delivery-status": {
            "source": "iana"
        },
        "message/disposition-notification": {
            "source": "iana",
            "extensions": [
                "disposition-notification"
            ]
        },
        "message/external-body": {
            "source": "iana"
        },
        "message/feedback-report": {
            "source": "iana"
        },
        "message/global": {
            "source": "iana",
            "extensions": [
                "u8msg"
            ]
        },
        "message/global-delivery-status": {
            "source": "iana",
            "extensions": [
                "u8dsn"
            ]
        },
        "message/global-disposition-notification": {
            "source": "iana",
            "extensions": [
                "u8mdn"
            ]
        },
        "message/global-headers": {
            "source": "iana",
            "extensions": [
                "u8hdr"
            ]
        },
        "message/http": {
            "source": "iana",
            "compressible": false
        },
        "message/imdn+xml": {
            "source": "iana",
            "compressible": true
        },
        "message/news": {
            "source": "iana"
        },
        "message/partial": {
            "source": "iana",
            "compressible": false
        },
        "message/rfc822": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "eml",
                "mime"
            ]
        },
        "message/s-http": {
            "source": "iana"
        },
        "message/sip": {
            "source": "iana"
        },
        "message/sipfrag": {
            "source": "iana"
        },
        "message/tracking-status": {
            "source": "iana"
        },
        "message/vnd.si.simp": {
            "source": "iana"
        },
        "message/vnd.wfa.wsc": {
            "source": "iana",
            "extensions": [
                "wsc"
            ]
        },
        "model/3mf": {
            "source": "iana",
            "extensions": [
                "3mf"
            ]
        },
        "model/e57": {
            "source": "iana"
        },
        "model/gltf+json": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "gltf"
            ]
        },
        "model/gltf-binary": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "glb"
            ]
        },
        "model/iges": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "igs",
                "iges"
            ]
        },
        "model/mesh": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "msh",
                "mesh",
                "silo"
            ]
        },
        "model/mtl": {
            "source": "iana",
            "extensions": [
                "mtl"
            ]
        },
        "model/obj": {
            "source": "iana",
            "extensions": [
                "obj"
            ]
        },
        "model/step": {
            "source": "iana"
        },
        "model/step+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "stpx"
            ]
        },
        "model/step+zip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "stpz"
            ]
        },
        "model/step-xml+zip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "stpxz"
            ]
        },
        "model/stl": {
            "source": "iana",
            "extensions": [
                "stl"
            ]
        },
        "model/vnd.collada+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "dae"
            ]
        },
        "model/vnd.dwf": {
            "source": "iana",
            "extensions": [
                "dwf"
            ]
        },
        "model/vnd.flatland.3dml": {
            "source": "iana"
        },
        "model/vnd.gdl": {
            "source": "iana",
            "extensions": [
                "gdl"
            ]
        },
        "model/vnd.gs-gdl": {
            "source": "apache"
        },
        "model/vnd.gs.gdl": {
            "source": "iana"
        },
        "model/vnd.gtw": {
            "source": "iana",
            "extensions": [
                "gtw"
            ]
        },
        "model/vnd.moml+xml": {
            "source": "iana",
            "compressible": true
        },
        "model/vnd.mts": {
            "source": "iana",
            "extensions": [
                "mts"
            ]
        },
        "model/vnd.opengex": {
            "source": "iana",
            "extensions": [
                "ogex"
            ]
        },
        "model/vnd.parasolid.transmit.binary": {
            "source": "iana",
            "extensions": [
                "x_b"
            ]
        },
        "model/vnd.parasolid.transmit.text": {
            "source": "iana",
            "extensions": [
                "x_t"
            ]
        },
        "model/vnd.pytha.pyox": {
            "source": "iana"
        },
        "model/vnd.rosette.annotated-data-model": {
            "source": "iana"
        },
        "model/vnd.sap.vds": {
            "source": "iana",
            "extensions": [
                "vds"
            ]
        },
        "model/vnd.usdz+zip": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "usdz"
            ]
        },
        "model/vnd.valve.source.compiled-map": {
            "source": "iana",
            "extensions": [
                "bsp"
            ]
        },
        "model/vnd.vtu": {
            "source": "iana",
            "extensions": [
                "vtu"
            ]
        },
        "model/vrml": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "wrl",
                "vrml"
            ]
        },
        "model/x3d+binary": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "x3db",
                "x3dbz"
            ]
        },
        "model/x3d+fastinfoset": {
            "source": "iana",
            "extensions": [
                "x3db"
            ]
        },
        "model/x3d+vrml": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "x3dv",
                "x3dvz"
            ]
        },
        "model/x3d+xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "x3d",
                "x3dz"
            ]
        },
        "model/x3d-vrml": {
            "source": "iana",
            "extensions": [
                "x3dv"
            ]
        },
        "multipart/alternative": {
            "source": "iana",
            "compressible": false
        },
        "multipart/appledouble": {
            "source": "iana"
        },
        "multipart/byteranges": {
            "source": "iana"
        },
        "multipart/digest": {
            "source": "iana"
        },
        "multipart/encrypted": {
            "source": "iana",
            "compressible": false
        },
        "multipart/form-data": {
            "source": "iana",
            "compressible": false
        },
        "multipart/header-set": {
            "source": "iana"
        },
        "multipart/mixed": {
            "source": "iana"
        },
        "multipart/multilingual": {
            "source": "iana"
        },
        "multipart/parallel": {
            "source": "iana"
        },
        "multipart/related": {
            "source": "iana",
            "compressible": false
        },
        "multipart/report": {
            "source": "iana"
        },
        "multipart/signed": {
            "source": "iana",
            "compressible": false
        },
        "multipart/vnd.bint.med-plus": {
            "source": "iana"
        },
        "multipart/voice-message": {
            "source": "iana"
        },
        "multipart/x-mixed-replace": {
            "source": "iana"
        },
        "text/1d-interleaved-parityfec": {
            "source": "iana"
        },
        "text/cache-manifest": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "appcache",
                "manifest"
            ]
        },
        "text/calendar": {
            "source": "iana",
            "extensions": [
                "ics",
                "ifb"
            ]
        },
        "text/calender": {
            "compressible": true
        },
        "text/cmd": {
            "compressible": true
        },
        "text/coffeescript": {
            "extensions": [
                "coffee",
                "litcoffee"
            ]
        },
        "text/cql": {
            "source": "iana"
        },
        "text/cql-expression": {
            "source": "iana"
        },
        "text/cql-identifier": {
            "source": "iana"
        },
        "text/css": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "css"
            ]
        },
        "text/csv": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "csv"
            ]
        },
        "text/csv-schema": {
            "source": "iana"
        },
        "text/directory": {
            "source": "iana"
        },
        "text/dns": {
            "source": "iana"
        },
        "text/ecmascript": {
            "source": "iana"
        },
        "text/encaprtp": {
            "source": "iana"
        },
        "text/enriched": {
            "source": "iana"
        },
        "text/fhirpath": {
            "source": "iana"
        },
        "text/flexfec": {
            "source": "iana"
        },
        "text/fwdred": {
            "source": "iana"
        },
        "text/gff3": {
            "source": "iana"
        },
        "text/grammar-ref-list": {
            "source": "iana"
        },
        "text/html": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "html",
                "htm",
                "shtml"
            ]
        },
        "text/jade": {
            "extensions": [
                "jade"
            ]
        },
        "text/javascript": {
            "source": "iana",
            "compressible": true
        },
        "text/jcr-cnd": {
            "source": "iana"
        },
        "text/jsx": {
            "compressible": true,
            "extensions": [
                "jsx"
            ]
        },
        "text/less": {
            "compressible": true,
            "extensions": [
                "less"
            ]
        },
        "text/markdown": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "markdown",
                "md"
            ]
        },
        "text/mathml": {
            "source": "nginx",
            "extensions": [
                "mml"
            ]
        },
        "text/mdx": {
            "compressible": true,
            "extensions": [
                "mdx"
            ]
        },
        "text/mizar": {
            "source": "iana"
        },
        "text/n3": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "n3"
            ]
        },
        "text/parameters": {
            "source": "iana",
            "charset": "UTF-8"
        },
        "text/parityfec": {
            "source": "iana"
        },
        "text/plain": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "txt",
                "text",
                "conf",
                "def",
                "list",
                "log",
                "in",
                "ini"
            ]
        },
        "text/provenance-notation": {
            "source": "iana",
            "charset": "UTF-8"
        },
        "text/prs.fallenstein.rst": {
            "source": "iana"
        },
        "text/prs.lines.tag": {
            "source": "iana",
            "extensions": [
                "dsc"
            ]
        },
        "text/prs.prop.logic": {
            "source": "iana"
        },
        "text/raptorfec": {
            "source": "iana"
        },
        "text/red": {
            "source": "iana"
        },
        "text/rfc822-headers": {
            "source": "iana"
        },
        "text/richtext": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rtx"
            ]
        },
        "text/rtf": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "rtf"
            ]
        },
        "text/rtp-enc-aescm128": {
            "source": "iana"
        },
        "text/rtploopback": {
            "source": "iana"
        },
        "text/rtx": {
            "source": "iana"
        },
        "text/sgml": {
            "source": "iana",
            "extensions": [
                "sgml",
                "sgm"
            ]
        },
        "text/shaclc": {
            "source": "iana"
        },
        "text/shex": {
            "source": "iana",
            "extensions": [
                "shex"
            ]
        },
        "text/slim": {
            "extensions": [
                "slim",
                "slm"
            ]
        },
        "text/spdx": {
            "source": "iana",
            "extensions": [
                "spdx"
            ]
        },
        "text/strings": {
            "source": "iana"
        },
        "text/stylus": {
            "extensions": [
                "stylus",
                "styl"
            ]
        },
        "text/t140": {
            "source": "iana"
        },
        "text/tab-separated-values": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "tsv"
            ]
        },
        "text/troff": {
            "source": "iana",
            "extensions": [
                "t",
                "tr",
                "roff",
                "man",
                "me",
                "ms"
            ]
        },
        "text/turtle": {
            "source": "iana",
            "charset": "UTF-8",
            "extensions": [
                "ttl"
            ]
        },
        "text/ulpfec": {
            "source": "iana"
        },
        "text/uri-list": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "uri",
                "uris",
                "urls"
            ]
        },
        "text/vcard": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "vcard"
            ]
        },
        "text/vnd.a": {
            "source": "iana"
        },
        "text/vnd.abc": {
            "source": "iana"
        },
        "text/vnd.ascii-art": {
            "source": "iana"
        },
        "text/vnd.curl": {
            "source": "iana",
            "extensions": [
                "curl"
            ]
        },
        "text/vnd.curl.dcurl": {
            "source": "apache",
            "extensions": [
                "dcurl"
            ]
        },
        "text/vnd.curl.mcurl": {
            "source": "apache",
            "extensions": [
                "mcurl"
            ]
        },
        "text/vnd.curl.scurl": {
            "source": "apache",
            "extensions": [
                "scurl"
            ]
        },
        "text/vnd.debian.copyright": {
            "source": "iana",
            "charset": "UTF-8"
        },
        "text/vnd.dmclientscript": {
            "source": "iana"
        },
        "text/vnd.dvb.subtitle": {
            "source": "iana",
            "extensions": [
                "sub"
            ]
        },
        "text/vnd.esmertec.theme-descriptor": {
            "source": "iana",
            "charset": "UTF-8"
        },
        "text/vnd.familysearch.gedcom": {
            "source": "iana",
            "extensions": [
                "ged"
            ]
        },
        "text/vnd.ficlab.flt": {
            "source": "iana"
        },
        "text/vnd.fly": {
            "source": "iana",
            "extensions": [
                "fly"
            ]
        },
        "text/vnd.fmi.flexstor": {
            "source": "iana",
            "extensions": [
                "flx"
            ]
        },
        "text/vnd.gml": {
            "source": "iana"
        },
        "text/vnd.graphviz": {
            "source": "iana",
            "extensions": [
                "gv"
            ]
        },
        "text/vnd.hans": {
            "source": "iana"
        },
        "text/vnd.hgl": {
            "source": "iana"
        },
        "text/vnd.in3d.3dml": {
            "source": "iana",
            "extensions": [
                "3dml"
            ]
        },
        "text/vnd.in3d.spot": {
            "source": "iana",
            "extensions": [
                "spot"
            ]
        },
        "text/vnd.iptc.newsml": {
            "source": "iana"
        },
        "text/vnd.iptc.nitf": {
            "source": "iana"
        },
        "text/vnd.latex-z": {
            "source": "iana"
        },
        "text/vnd.motorola.reflex": {
            "source": "iana"
        },
        "text/vnd.ms-mediapackage": {
            "source": "iana"
        },
        "text/vnd.net2phone.commcenter.command": {
            "source": "iana"
        },
        "text/vnd.radisys.msml-basic-layout": {
            "source": "iana"
        },
        "text/vnd.senx.warpscript": {
            "source": "iana"
        },
        "text/vnd.si.uricatalogue": {
            "source": "iana"
        },
        "text/vnd.sosi": {
            "source": "iana"
        },
        "text/vnd.sun.j2me.app-descriptor": {
            "source": "iana",
            "charset": "UTF-8",
            "extensions": [
                "jad"
            ]
        },
        "text/vnd.trolltech.linguist": {
            "source": "iana",
            "charset": "UTF-8"
        },
        "text/vnd.wap.si": {
            "source": "iana"
        },
        "text/vnd.wap.sl": {
            "source": "iana"
        },
        "text/vnd.wap.wml": {
            "source": "iana",
            "extensions": [
                "wml"
            ]
        },
        "text/vnd.wap.wmlscript": {
            "source": "iana",
            "extensions": [
                "wmls"
            ]
        },
        "text/vtt": {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": [
                "vtt"
            ]
        },
        "text/x-asm": {
            "source": "apache",
            "extensions": [
                "s",
                "asm"
            ]
        },
        "text/x-c": {
            "source": "apache",
            "extensions": [
                "c",
                "cc",
                "cxx",
                "cpp",
                "h",
                "hh",
                "dic"
            ]
        },
        "text/x-component": {
            "source": "nginx",
            "extensions": [
                "htc"
            ]
        },
        "text/x-fortran": {
            "source": "apache",
            "extensions": [
                "f",
                "for",
                "f77",
                "f90"
            ]
        },
        "text/x-gwt-rpc": {
            "compressible": true
        },
        "text/x-handlebars-template": {
            "extensions": [
                "hbs"
            ]
        },
        "text/x-java-source": {
            "source": "apache",
            "extensions": [
                "java"
            ]
        },
        "text/x-jquery-tmpl": {
            "compressible": true
        },
        "text/x-lua": {
            "extensions": [
                "lua"
            ]
        },
        "text/x-markdown": {
            "compressible": true,
            "extensions": [
                "mkd"
            ]
        },
        "text/x-nfo": {
            "source": "apache",
            "extensions": [
                "nfo"
            ]
        },
        "text/x-opml": {
            "source": "apache",
            "extensions": [
                "opml"
            ]
        },
        "text/x-org": {
            "compressible": true,
            "extensions": [
                "org"
            ]
        },
        "text/x-pascal": {
            "source": "apache",
            "extensions": [
                "p",
                "pas"
            ]
        },
        "text/x-processing": {
            "compressible": true,
            "extensions": [
                "pde"
            ]
        },
        "text/x-sass": {
            "extensions": [
                "sass"
            ]
        },
        "text/x-scss": {
            "extensions": [
                "scss"
            ]
        },
        "text/x-setext": {
            "source": "apache",
            "extensions": [
                "etx"
            ]
        },
        "text/x-sfv": {
            "source": "apache",
            "extensions": [
                "sfv"
            ]
        },
        "text/x-suse-ymp": {
            "compressible": true,
            "extensions": [
                "ymp"
            ]
        },
        "text/x-uuencode": {
            "source": "apache",
            "extensions": [
                "uu"
            ]
        },
        "text/x-vcalendar": {
            "source": "apache",
            "extensions": [
                "vcs"
            ]
        },
        "text/x-vcard": {
            "source": "apache",
            "extensions": [
                "vcf"
            ]
        },
        "text/xml": {
            "source": "iana",
            "compressible": true,
            "extensions": [
                "xml"
            ]
        },
        "text/xml-external-parsed-entity": {
            "source": "iana"
        },
        "text/yaml": {
            "compressible": true,
            "extensions": [
                "yaml",
                "yml"
            ]
        },
        "video/1d-interleaved-parityfec": {
            "source": "iana"
        },
        "video/3gpp": {
            "source": "iana",
            "extensions": [
                "3gp",
                "3gpp"
            ]
        },
        "video/3gpp-tt": {
            "source": "iana"
        },
        "video/3gpp2": {
            "source": "iana",
            "extensions": [
                "3g2"
            ]
        },
        "video/av1": {
            "source": "iana"
        },
        "video/bmpeg": {
            "source": "iana"
        },
        "video/bt656": {
            "source": "iana"
        },
        "video/celb": {
            "source": "iana"
        },
        "video/dv": {
            "source": "iana"
        },
        "video/encaprtp": {
            "source": "iana"
        },
        "video/ffv1": {
            "source": "iana"
        },
        "video/flexfec": {
            "source": "iana"
        },
        "video/h261": {
            "source": "iana",
            "extensions": [
                "h261"
            ]
        },
        "video/h263": {
            "source": "iana",
            "extensions": [
                "h263"
            ]
        },
        "video/h263-1998": {
            "source": "iana"
        },
        "video/h263-2000": {
            "source": "iana"
        },
        "video/h264": {
            "source": "iana",
            "extensions": [
                "h264"
            ]
        },
        "video/h264-rcdo": {
            "source": "iana"
        },
        "video/h264-svc": {
            "source": "iana"
        },
        "video/h265": {
            "source": "iana"
        },
        "video/iso.segment": {
            "source": "iana",
            "extensions": [
                "m4s"
            ]
        },
        "video/jpeg": {
            "source": "iana",
            "extensions": [
                "jpgv"
            ]
        },
        "video/jpeg2000": {
            "source": "iana"
        },
        "video/jpm": {
            "source": "apache",
            "extensions": [
                "jpm",
                "jpgm"
            ]
        },
        "video/jxsv": {
            "source": "iana"
        },
        "video/mj2": {
            "source": "iana",
            "extensions": [
                "mj2",
                "mjp2"
            ]
        },
        "video/mp1s": {
            "source": "iana"
        },
        "video/mp2p": {
            "source": "iana"
        },
        "video/mp2t": {
            "source": "iana",
            "extensions": [
                "ts"
            ]
        },
        "video/mp4": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "mp4",
                "mp4v",
                "mpg4"
            ]
        },
        "video/mp4v-es": {
            "source": "iana"
        },
        "video/mpeg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "mpeg",
                "mpg",
                "mpe",
                "m1v",
                "m2v"
            ]
        },
        "video/mpeg4-generic": {
            "source": "iana"
        },
        "video/mpv": {
            "source": "iana"
        },
        "video/nv": {
            "source": "iana"
        },
        "video/ogg": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "ogv"
            ]
        },
        "video/parityfec": {
            "source": "iana"
        },
        "video/pointer": {
            "source": "iana"
        },
        "video/quicktime": {
            "source": "iana",
            "compressible": false,
            "extensions": [
                "qt",
                "mov"
            ]
        },
        "video/raptorfec": {
            "source": "iana"
        },
        "video/raw": {
            "source": "iana"
        },
        "video/rtp-enc-aescm128": {
            "source": "iana"
        },
        "video/rtploopback": {
            "source": "iana"
        },
        "video/rtx": {
            "source": "iana"
        },
        "video/scip": {
            "source": "iana"
        },
        "video/smpte291": {
            "source": "iana"
        },
        "video/smpte292m": {
            "source": "iana"
        },
        "video/ulpfec": {
            "source": "iana"
        },
        "video/vc1": {
            "source": "iana"
        },
        "video/vc2": {
            "source": "iana"
        },
        "video/vnd.cctv": {
            "source": "iana"
        },
        "video/vnd.dece.hd": {
            "source": "iana",
            "extensions": [
                "uvh",
                "uvvh"
            ]
        },
        "video/vnd.dece.mobile": {
            "source": "iana",
            "extensions": [
                "uvm",
                "uvvm"
            ]
        },
        "video/vnd.dece.mp4": {
            "source": "iana"
        },
        "video/vnd.dece.pd": {
            "source": "iana",
            "extensions": [
                "uvp",
                "uvvp"
            ]
        },
        "video/vnd.dece.sd": {
            "source": "iana",
            "extensions": [
                "uvs",
                "uvvs"
            ]
        },
        "video/vnd.dece.video": {
            "source": "iana",
            "extensions": [
                "uvv",
                "uvvv"
            ]
        },
        "video/vnd.directv.mpeg": {
            "source": "iana"
        },
        "video/vnd.directv.mpeg-tts": {
            "source": "iana"
        },
        "video/vnd.dlna.mpeg-tts": {
            "source": "iana"
        },
        "video/vnd.dvb.file": {
            "source": "iana",
            "extensions": [
                "dvb"
            ]
        },
        "video/vnd.fvt": {
            "source": "iana",
            "extensions": [
                "fvt"
            ]
        },
        "video/vnd.hns.video": {
            "source": "iana"
        },
        "video/vnd.iptvforum.1dparityfec-1010": {
            "source": "iana"
        },
        "video/vnd.iptvforum.1dparityfec-2005": {
            "source": "iana"
        },
        "video/vnd.iptvforum.2dparityfec-1010": {
            "source": "iana"
        },
        "video/vnd.iptvforum.2dparityfec-2005": {
            "source": "iana"
        },
        "video/vnd.iptvforum.ttsavc": {
            "source": "iana"
        },
        "video/vnd.iptvforum.ttsmpeg2": {
            "source": "iana"
        },
        "video/vnd.motorola.video": {
            "source": "iana"
        },
        "video/vnd.motorola.videop": {
            "source": "iana"
        },
        "video/vnd.mpegurl": {
            "source": "iana",
            "extensions": [
                "mxu",
                "m4u"
            ]
        },
        "video/vnd.ms-playready.media.pyv": {
            "source": "iana",
            "extensions": [
                "pyv"
            ]
        },
        "video/vnd.nokia.interleaved-multimedia": {
            "source": "iana"
        },
        "video/vnd.nokia.mp4vr": {
            "source": "iana"
        },
        "video/vnd.nokia.videovoip": {
            "source": "iana"
        },
        "video/vnd.objectvideo": {
            "source": "iana"
        },
        "video/vnd.radgamettools.bink": {
            "source": "iana"
        },
        "video/vnd.radgamettools.smacker": {
            "source": "iana"
        },
        "video/vnd.sealed.mpeg1": {
            "source": "iana"
        },
        "video/vnd.sealed.mpeg4": {
            "source": "iana"
        },
        "video/vnd.sealed.swf": {
            "source": "iana"
        },
        "video/vnd.sealedmedia.softseal.mov": {
            "source": "iana"
        },
        "video/vnd.uvvu.mp4": {
            "source": "iana",
            "extensions": [
                "uvu",
                "uvvu"
            ]
        },
        "video/vnd.vivo": {
            "source": "iana",
            "extensions": [
                "viv"
            ]
        },
        "video/vnd.youtube.yt": {
            "source": "iana"
        },
        "video/vp8": {
            "source": "iana"
        },
        "video/vp9": {
            "source": "iana"
        },
        "video/webm": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "webm"
            ]
        },
        "video/x-f4v": {
            "source": "apache",
            "extensions": [
                "f4v"
            ]
        },
        "video/x-fli": {
            "source": "apache",
            "extensions": [
                "fli"
            ]
        },
        "video/x-flv": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "flv"
            ]
        },
        "video/x-m4v": {
            "source": "apache",
            "extensions": [
                "m4v"
            ]
        },
        "video/x-matroska": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "mkv",
                "mk3d",
                "mks"
            ]
        },
        "video/x-mng": {
            "source": "apache",
            "extensions": [
                "mng"
            ]
        },
        "video/x-ms-asf": {
            "source": "apache",
            "extensions": [
                "asf",
                "asx"
            ]
        },
        "video/x-ms-vob": {
            "source": "apache",
            "extensions": [
                "vob"
            ]
        },
        "video/x-ms-wm": {
            "source": "apache",
            "extensions": [
                "wm"
            ]
        },
        "video/x-ms-wmv": {
            "source": "apache",
            "compressible": false,
            "extensions": [
                "wmv"
            ]
        },
        "video/x-ms-wmx": {
            "source": "apache",
            "extensions": [
                "wmx"
            ]
        },
        "video/x-ms-wvx": {
            "source": "apache",
            "extensions": [
                "wvx"
            ]
        },
        "video/x-msvideo": {
            "source": "apache",
            "extensions": [
                "avi"
            ]
        },
        "video/x-sgi-movie": {
            "source": "apache",
            "extensions": [
                "movie"
            ]
        },
        "video/x-smv": {
            "source": "apache",
            "extensions": [
                "smv"
            ]
        },
        "x-conference/x-cooltalk": {
            "source": "apache",
            "extensions": [
                "ice"
            ]
        },
        "x-shader/x-fragment": {
            "compressible": true
        },
        "x-shader/x-vertex": {
            "compressible": true
        }
    };
}
,
"709cce5f":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const fill = farmRequire("154d2100", true);
    const utils = farmRequire("1553b537", true);
    const compile = (ast, options = {})=>{
        const walk = (node, parent = {})=>{
            const invalidBlock = utils.isInvalidBrace(parent);
            const invalidNode = node.invalid === true && options.escapeInvalid === true;
            const invalid = invalidBlock === true || invalidNode === true;
            const prefix = options.escapeInvalid === true ? '\\' : '';
            let output = '';
            if (node.isOpen === true) {
                return prefix + node.value;
            }
            if (node.isClose === true) {
                console.log('node.isClose', prefix, node.value);
                return prefix + node.value;
            }
            if (node.type === 'open') {
                return invalid ? prefix + node.value : '(';
            }
            if (node.type === 'close') {
                return invalid ? prefix + node.value : ')';
            }
            if (node.type === 'comma') {
                return node.prev.type === 'comma' ? '' : invalid ? node.value : '|';
            }
            if (node.value) {
                return node.value;
            }
            if (node.nodes && node.ranges > 0) {
                const args = utils.reduce(node.nodes);
                const range = fill(...args, {
                    ...options,
                    wrap: false,
                    toRegex: true,
                    strictZeros: true
                });
                if (range.length !== 0) {
                    return args.length > 1 && range.length > 1 ? `(${range})` : range;
                }
            }
            if (node.nodes) {
                for (const child of node.nodes){
                    output += walk(child, node);
                }
            }
            return output;
        };
        return walk(ast);
    };
    module.exports = compile;
}
,
"7603caaf":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const path = farmRequire('path', true);
    const scan = farmRequire("0129a2e3", true);
    const parse = farmRequire("2d8459f3", true);
    const utils = farmRequire("90ccf097", true);
    const constants = farmRequire("ee06a2f9", true);
    const isObject = (val)=>val && typeof val === 'object' && !Array.isArray(val);
    const picomatch = (glob, options, returnState = false)=>{
        if (Array.isArray(glob)) {
            const fns = glob.map((input)=>picomatch(input, options, returnState));
            const arrayMatcher = (str)=>{
                for (const isMatch of fns){
                    const state = isMatch(str);
                    if (state) return state;
                }
                return false;
            };
            return arrayMatcher;
        }
        const isState = isObject(glob) && glob.tokens && glob.input;
        if (glob === '' || typeof glob !== 'string' && !isState) {
            throw new TypeError('Expected pattern to be a non-empty string');
        }
        const opts = options || {};
        const posix = utils.isWindows(options);
        const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
        const state = regex.state;
        delete regex.state;
        let isIgnored = ()=>false;
        if (opts.ignore) {
            const ignoreOpts = {
                ...options,
                ignore: null,
                onMatch: null,
                onResult: null
            };
            isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
        }
        const matcher = (input, returnObject = false)=>{
            const { isMatch, match, output } = picomatch.test(input, regex, options, {
                glob,
                posix
            });
            const result = {
                glob,
                state,
                regex,
                posix,
                input,
                output,
                match,
                isMatch
            };
            if (typeof opts.onResult === 'function') {
                opts.onResult(result);
            }
            if (isMatch === false) {
                result.isMatch = false;
                return returnObject ? result : false;
            }
            if (isIgnored(input)) {
                if (typeof opts.onIgnore === 'function') {
                    opts.onIgnore(result);
                }
                result.isMatch = false;
                return returnObject ? result : false;
            }
            if (typeof opts.onMatch === 'function') {
                opts.onMatch(result);
            }
            return returnObject ? result : true;
        };
        if (returnState) {
            matcher.state = state;
        }
        return matcher;
    };
    picomatch.test = (input, regex, options, { glob, posix } = {})=>{
        if (typeof input !== 'string') {
            throw new TypeError('Expected input to be a string');
        }
        if (input === '') {
            return {
                isMatch: false,
                output: ''
            };
        }
        const opts = options || {};
        const format = opts.format || (posix ? utils.toPosixSlashes : null);
        let match = input === glob;
        let output = match && format ? format(input) : input;
        if (match === false) {
            output = format ? format(input) : input;
            match = output === glob;
        }
        if (match === false || opts.capture === true) {
            if (opts.matchBase === true || opts.basename === true) {
                match = picomatch.matchBase(input, regex, options, posix);
            } else {
                match = regex.exec(output);
            }
        }
        return {
            isMatch: Boolean(match),
            match,
            output
        };
    };
    picomatch.matchBase = (input, glob, options, posix = utils.isWindows(options))=>{
        const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
        return regex.test(path.basename(input));
    };
    picomatch.isMatch = (str, patterns, options)=>picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options)=>{
        if (Array.isArray(pattern)) return pattern.map((p)=>picomatch.parse(p, options));
        return parse(pattern, {
            ...options,
            fastpaths: false
        });
    };
    picomatch.scan = (input, options)=>scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false)=>{
        if (returnOutput === true) {
            return state.output;
        }
        const opts = options || {};
        const prepend = opts.contains ? '' : '^';
        const append = opts.contains ? '' : '$';
        let source = `${prepend}(?:${state.output})${append}`;
        if (state && state.negated === true) {
            source = `^(?!${source}).*$`;
        }
        const regex = picomatch.toRegex(source, options);
        if (returnState === true) {
            regex.state = state;
        }
        return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false)=>{
        if (!input || typeof input !== 'string') {
            throw new TypeError('Expected a non-empty string');
        }
        let parsed = {
            negated: false,
            fastpaths: true
        };
        if (options.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
            parsed.output = parse.fastpaths(input, options);
        }
        if (!parsed.output) {
            parsed = parse(input, options);
        }
        return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options)=>{
        try {
            const opts = options || {};
            return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
        } catch (err) {
            if (options && options.debug === true) throw err;
            return /$^/;
        }
    };
    picomatch.constants = constants;
    module.exports = picomatch;
}
,
"7f1fd8a0":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const util = farmRequire('util', true);
    const braces = farmRequire("9316a752", true);
    const picomatch = farmRequire("d3b84617", true);
    const utils = farmRequire("90ccf097", true);
    const isEmptyString = (val)=>val === '' || val === './';
    const micromatch = (list, patterns, options)=>{
        patterns = [].concat(patterns);
        list = [].concat(list);
        let omit = new Set();
        let keep = new Set();
        let items = new Set();
        let negatives = 0;
        let onResult = (state)=>{
            items.add(state.output);
            if (options && options.onResult) {
                options.onResult(state);
            }
        };
        for(let i = 0; i < patterns.length; i++){
            let isMatch = picomatch(String(patterns[i]), {
                ...options,
                onResult
            }, true);
            let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
            if (negated) negatives++;
            for (let item of list){
                let matched = isMatch(item, true);
                let match = negated ? !matched.isMatch : matched.isMatch;
                if (!match) continue;
                if (negated) {
                    omit.add(matched.output);
                } else {
                    omit.delete(matched.output);
                    keep.add(matched.output);
                }
            }
        }
        let result = negatives === patterns.length ? [
            ...items
        ] : [
            ...keep
        ];
        let matches = result.filter((item)=>!omit.has(item));
        if (options && matches.length === 0) {
            if (options.failglob === true) {
                throw new Error(`No matches found for "${patterns.join(', ')}"`);
            }
            if (options.nonull === true || options.nullglob === true) {
                return options.unescape ? patterns.map((p)=>p.replace(/\\/g, '')) : patterns;
            }
        }
        return matches;
    };
    micromatch.match = micromatch;
    micromatch.matcher = (pattern, options)=>picomatch(pattern, options);
    micromatch.isMatch = (str, patterns, options)=>picomatch(patterns, options)(str);
    micromatch.any = micromatch.isMatch;
    micromatch.not = (list, patterns, options = {})=>{
        patterns = [].concat(patterns).map(String);
        let result = new Set();
        let items = [];
        let onResult = (state)=>{
            if (options.onResult) options.onResult(state);
            items.push(state.output);
        };
        let matches = new Set(micromatch(list, patterns, {
            ...options,
            onResult
        }));
        for (let item of items){
            if (!matches.has(item)) {
                result.add(item);
            }
        }
        return [
            ...result
        ];
    };
    micromatch.contains = (str, pattern, options)=>{
        if (typeof str !== 'string') {
            throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
        }
        if (Array.isArray(pattern)) {
            return pattern.some((p)=>micromatch.contains(str, p, options));
        }
        if (typeof pattern === 'string') {
            if (isEmptyString(str) || isEmptyString(pattern)) {
                return false;
            }
            if (str.includes(pattern) || str.startsWith('./') && str.slice(2).includes(pattern)) {
                return true;
            }
        }
        return micromatch.isMatch(str, pattern, {
            ...options,
            contains: true
        });
    };
    micromatch.matchKeys = (obj, patterns, options)=>{
        if (!utils.isObject(obj)) {
            throw new TypeError('Expected the first argument to be an object');
        }
        let keys = micromatch(Object.keys(obj), patterns, options);
        let res = {};
        for (let key of keys)res[key] = obj[key];
        return res;
    };
    micromatch.some = (list, patterns, options)=>{
        let items = [].concat(list);
        for (let pattern of [].concat(patterns)){
            let isMatch = picomatch(String(pattern), options);
            if (items.some((item)=>isMatch(item))) {
                return true;
            }
        }
        return false;
    };
    micromatch.every = (list, patterns, options)=>{
        let items = [].concat(list);
        for (let pattern of [].concat(patterns)){
            let isMatch = picomatch(String(pattern), options);
            if (!items.every((item)=>isMatch(item))) {
                return false;
            }
        }
        return true;
    };
    micromatch.all = (str, patterns, options)=>{
        if (typeof str !== 'string') {
            throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
        }
        return [].concat(patterns).every((p)=>picomatch(p, options)(str));
    };
    micromatch.capture = (glob, input, options)=>{
        let posix = utils.isWindows(options);
        let regex = picomatch.makeRe(String(glob), {
            ...options,
            capture: true
        });
        let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);
        if (match) {
            return match.slice(1).map((v)=>v === void 0 ? '' : v);
        }
    };
    micromatch.makeRe = (...args)=>picomatch.makeRe(...args);
    micromatch.scan = (...args)=>picomatch.scan(...args);
    micromatch.parse = (patterns, options)=>{
        let res = [];
        for (let pattern of [].concat(patterns || [])){
            for (let str of braces(String(pattern), options)){
                res.push(picomatch.parse(str, options));
            }
        }
        return res;
    };
    micromatch.braces = (pattern, options)=>{
        if (typeof pattern !== 'string') throw new TypeError('Expected a string');
        if (options && options.nobrace === true || !/\{.*\}/.test(pattern)) {
            return [
                pattern
            ];
        }
        return braces(pattern, options);
    };
    micromatch.braceExpand = (pattern, options)=>{
        if (typeof pattern !== 'string') throw new TypeError('Expected a string');
        return micromatch.braces(pattern, {
            ...options,
            expand: true
        });
    };
    module.exports = micromatch;
}
,
"90ccf097":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const path = farmRequire('path', true);
    const win32 = process.platform === 'win32';
    const { REGEX_BACKSLASH, REGEX_REMOVE_BACKSLASH, REGEX_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_GLOBAL } = farmRequire("ee06a2f9", true);
    exports.isObject = (val)=>val !== null && typeof val === 'object' && !Array.isArray(val);
    exports.hasRegexChars = (str)=>REGEX_SPECIAL_CHARS.test(str);
    exports.isRegexChar = (str)=>str.length === 1 && exports.hasRegexChars(str);
    exports.escapeRegex = (str)=>str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');
    exports.toPosixSlashes = (str)=>str.replace(REGEX_BACKSLASH, '/');
    exports.removeBackslashes = (str)=>{
        return str.replace(REGEX_REMOVE_BACKSLASH, (match)=>{
            return match === '\\' ? '' : match;
        });
    };
    exports.supportsLookbehinds = ()=>{
        const segs = process.version.slice(1).split('.').map(Number);
        if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
            return true;
        }
        return false;
    };
    exports.isWindows = (options)=>{
        if (options && typeof options.windows === 'boolean') {
            return options.windows;
        }
        return win32 === true || path.sep === '\\';
    };
    exports.escapeLast = (input, char, lastIdx)=>{
        const idx = input.lastIndexOf(char, lastIdx);
        if (idx === -1) return input;
        if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
        return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports.removePrefix = (input, state = {})=>{
        let output = input;
        if (output.startsWith('./')) {
            output = output.slice(2);
            state.prefix = './';
        }
        return output;
    };
    exports.wrapOutput = (input, state = {}, options = {})=>{
        const prepend = options.contains ? '' : '^';
        const append = options.contains ? '' : '$';
        let output = `${prepend}(?:${input})${append}`;
        if (state.negated === true) {
            output = `(?:^(?!${output}).*$)`;
        }
        return output;
    };
}
,
"9316a752":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const stringify = farmRequire("cb2ae164", true);
    const compile = farmRequire("709cce5f", true);
    const expand = farmRequire("3b94ec0c", true);
    const parse = farmRequire("4341f5bc", true);
    const braces = (input, options = {})=>{
        let output = [];
        if (Array.isArray(input)) {
            for (const pattern of input){
                const result = braces.create(pattern, options);
                if (Array.isArray(result)) {
                    output.push(...result);
                } else {
                    output.push(result);
                }
            }
        } else {
            output = [].concat(braces.create(input, options));
        }
        if (options && options.expand === true && options.nodupes === true) {
            output = [
                ...new Set(output)
            ];
        }
        return output;
    };
    braces.parse = (input, options = {})=>parse(input, options);
    braces.stringify = (input, options = {})=>{
        if (typeof input === 'string') {
            return stringify(braces.parse(input, options), options);
        }
        return stringify(input, options);
    };
    braces.compile = (input, options = {})=>{
        if (typeof input === 'string') {
            input = braces.parse(input, options);
        }
        return compile(input, options);
    };
    braces.expand = (input, options = {})=>{
        if (typeof input === 'string') {
            input = braces.parse(input, options);
        }
        let result = expand(input, options);
        if (options.noempty === true) {
            result = result.filter(Boolean);
        }
        if (options.nodupes === true) {
            result = [
                ...new Set(result)
            ];
        }
        return result;
    };
    braces.create = (input, options = {})=>{
        if (input === '' || input.length < 3) {
            return [
                input
            ];
        }
        return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
    };
    module.exports = braces;
}
,
"953dfae2":function  (module, exports, farmRequire, farmDynamicRequire) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function() {
            return farmSingleFilePlugin;
        }
    });
    const _interop_require_default = farmRequire("@swc/helpers/_/_interop_require_default");
    const _micromatch = _interop_require_default._(farmRequire("7f1fd8a0"));
    const _path = _interop_require_default._(farmRequire("path"));
    const _mimetypes = _interop_require_default._(farmRequire("9d4e3580"));
    const defaultOptions = {
        inlinePattern: [],
        deleteInlinedFiles: true
    };
    function escapeClosingScriptTag(str) {
        return str.replace(/<\/script/gi, "<\\/script");
    }
    function replaceScript(html, scriptFilename, scriptCode) {
        const reScript = new RegExp(`<script([^>]*?) src=["']?[/]*${scriptFilename}["']? ([^>]*)></script>`);
        const preloadMarker = /"?__VITE_PRELOAD__"?/g;
        const newCode = scriptCode.replace(preloadMarker, "void 0");
        const escapedCode = escapeClosingScriptTag(newCode);
        const inlined = html.replace(reScript, (_, beforeSrc, afterSrc)=>`<script${beforeSrc} ${afterSrc}>${escapedCode}</script>`);
        return inlined;
    }
    function replaceCss(html, scriptFilename, scriptCode) {
        const reStyle = new RegExp(`<link([^>]*?) href=/${scriptFilename}>`);
        const legacyCharSetDeclaration = /@charset "UTF-8";/;
        const inlined = html.replace(reStyle, (_, beforeSrc, afterSrc)=>`<style${beforeSrc}>${scriptCode}</style>`);
        return inlined;
    }
    async function replaceMedia(html, resourcesMap, basePath) {
        const mediaRegex = /<(img|audio|video)([^>]*?)(src|poster)=["']([^"']+)["']([^>]*)>/gi;
        let processedHtml = await Promise.all(html.split(mediaRegex).map(async (part, i)=>{
            if (i % 6 === 0) return part;
            if (i % 6 === 4) {
                const filePath = _path.default.join(basePath, part);
                try {
                    const resource = resourcesMap[filePath];
                    if (resource) {
                        const mimeType = _mimetypes.default.lookup(filePath) || "application/octet-stream";
                        const base64 = Buffer.from(resource.bytes).toString("base64");
                        return `data:${mimeType};base64,${base64}`;
                    } else {
                        console.warn(`Resource not found: ${filePath}`);
                        return part;
                    }
                } catch (error) {
                    console.error(`Error processing media file: ${filePath}`, error);
                    return part;
                }
            }
            return part;
        })).then((parts)=>parts.join(""));
        const variableAssignmentRegex = /\b(let|const|var)\s+(\w+)\s*=\s*["'](\/.+?)["']/g;
        processedHtml = processedHtml.replace(variableAssignmentRegex, (match, keyword, varName, url)=>{
            const filePath = url.slice(1);
            const resource = resourcesMap[filePath];
            if (resource) {
                const mimeType = _mimetypes.default.lookup(filePath) || "application/octet-stream";
                const base64 = Buffer.from(resource.bytes).toString("base64");
                return `${keyword} ${varName}="data:${mimeType};base64,${base64}"`;
            }
            return match;
        });
        return processedHtml;
    }
    const isJsFile = /\.[mc]?js$/;
    const isCssFile = /\.css$/;
    function farmSingleFilePlugin(options) {
        const mergedOptions = {
            ...defaultOptions,
            ...options
        };
        return {
            name: "farm-plugin-singlefile",
            finalizeResources: {
                async executor (params) {
                    const { resourcesMap } = params;
                    const htmlResource = Object.values(resourcesMap).find((r)=>r.resourceType === "html");
                    if (htmlResource) {
                        let htmlContent = Buffer.from(htmlResource.bytes).toString("utf-8");
                        const bundlesToDelete = [];
                        for (const [filename, resource] of Object.entries(resourcesMap)){
                            if (mergedOptions.inlinePattern && mergedOptions.inlinePattern.length && !_micromatch.default.isMatch(filename, mergedOptions.inlinePattern)) {
                                console.debug(`NOTE: asset not inlined: ${filename}`);
                                continue;
                            }
                            if (resource.resourceType === "js" && isJsFile.test(filename)) {
                                const content = Buffer.from(resource.bytes).toString("utf-8");
                                htmlContent = replaceScript(htmlContent, filename, content);
                                bundlesToDelete.push(filename);
                            } else if (resource.resourceType === "css" && isCssFile.test(filename)) {
                                const content = Buffer.from(resource.bytes).toString("utf-8");
                                htmlContent = replaceCss(htmlContent, filename, content);
                                bundlesToDelete.push(filename);
                            }
                        }
                        const basePath = _path.default.dirname(htmlResource.name);
                        htmlContent = await replaceMedia(htmlContent, resourcesMap, basePath);
                        htmlResource.bytes = [
                            ...Buffer.from(htmlContent, "utf-8")
                        ];
                        if (mergedOptions.deleteInlinedFiles !== false) {
                            for (const name of bundlesToDelete){
                                delete resourcesMap[name];
                            }
                        }
                        return {
                            [htmlResource.name]: htmlResource
                        };
                    }
                    return resourcesMap;
                }
            }
        };
    }
}
,
"98628c15":/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */ function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    module.exports = function(num) {
        if (typeof num === 'number') {
            return num - num === 0;
        }
        if (typeof num === 'string' && num.trim() !== '') {
            return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
        }
        return false;
    };
}
,
"9d4e3580":/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */ function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    var db = farmRequire("cfb511bf", true);
    var extname = farmRequire('path', true).extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports.charset = charset;
    exports.charsets = {
        lookup: charset
    };
    exports.contentType = contentType;
    exports.extension = extension;
    exports.extensions = Object.create(null);
    exports.lookup = lookup;
    exports.types = Object.create(null);
    populateMaps(exports.extensions, exports.types);
    function charset(type) {
        if (!type || typeof type !== 'string') {
            return false;
        }
        var match = EXTRACT_TYPE_REGEXP.exec(type);
        var mime = match && db[match[1].toLowerCase()];
        if (mime && mime.charset) {
            return mime.charset;
        }
        if (match && TEXT_TYPE_REGEXP.test(match[1])) {
            return 'UTF-8';
        }
        return false;
    }
    function contentType(str) {
        if (!str || typeof str !== 'string') {
            return false;
        }
        var mime = str.indexOf('/') === -1 ? exports.lookup(str) : str;
        if (!mime) {
            return false;
        }
        if (mime.indexOf('charset') === -1) {
            var charset = exports.charset(mime);
            if (charset) mime += '; charset=' + charset.toLowerCase();
        }
        return mime;
    }
    function extension(type) {
        if (!type || typeof type !== 'string') {
            return false;
        }
        var match = EXTRACT_TYPE_REGEXP.exec(type);
        var exts = match && exports.extensions[match[1].toLowerCase()];
        if (!exts || !exts.length) {
            return false;
        }
        return exts[0];
    }
    function lookup(path) {
        if (!path || typeof path !== 'string') {
            return false;
        }
        var extension = extname('x.' + path).toLowerCase().substr(1);
        if (!extension) {
            return false;
        }
        return exports.types[extension] || false;
    }
    function populateMaps(extensions, types) {
        var preference = [
            'nginx',
            'apache',
            undefined,
            'iana'
        ];
        Object.keys(db).forEach(function forEachMimeType(type) {
            var mime = db[type];
            var exts = mime.extensions;
            if (!exts || !exts.length) {
                return;
            }
            extensions[type] = exts;
            for(var i = 0; i < exts.length; i++){
                var extension = exts[i];
                if (types[extension]) {
                    var from = preference.indexOf(db[types[extension]].source);
                    var to = preference.indexOf(mime.source);
                    if (types[extension] !== 'application/octet-stream' && (from > to || from === to && types[extension].substr(0, 12) === 'application/')) {
                        continue;
                    }
                }
                types[extension] = type;
            }
        });
    }
}
,
"cb2ae164":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const utils = farmRequire("1553b537", true);
    module.exports = (ast, options = {})=>{
        const stringify = (node, parent = {})=>{
            const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
            const invalidNode = node.invalid === true && options.escapeInvalid === true;
            let output = '';
            if (node.value) {
                if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
                    return '\\' + node.value;
                }
                return node.value;
            }
            if (node.value) {
                return node.value;
            }
            if (node.nodes) {
                for (const child of node.nodes){
                    output += stringify(child);
                }
            }
            return output;
        };
        return stringify(ast);
    };
}
,
"cfb511bf":/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */ function  (module, exports, farmRequire, farmDynamicRequire) {
    module.exports = farmRequire("5e10cad5", true);
}
,
"d3b84617":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    module.exports = farmRequire("7603caaf", true);
}
,
"ee06a2f9":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    const path = farmRequire('path', true);
    const WIN_SLASH = '\\\\/';
    const WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    const DOT_LITERAL = '\\.';
    const PLUS_LITERAL = '\\+';
    const QMARK_LITERAL = '\\?';
    const SLASH_LITERAL = '\\/';
    const ONE_CHAR = '(?=.)';
    const QMARK = '[^/]';
    const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    const NO_DOT = `(?!${DOT_LITERAL})`;
    const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    const STAR = `${QMARK}*?`;
    const POSIX_CHARS = {
        DOT_LITERAL,
        PLUS_LITERAL,
        QMARK_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        QMARK,
        END_ANCHOR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
    };
    const WINDOWS_CHARS = {
        ...POSIX_CHARS,
        SLASH_LITERAL: `[${WIN_SLASH}]`,
        QMARK: WIN_NO_SLASH,
        STAR: `${WIN_NO_SLASH}*?`,
        DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
        NO_DOT: `(?!${DOT_LITERAL})`,
        NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
        NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
        NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
        QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
        START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
        END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    const POSIX_REGEX_SOURCE = {
        alnum: 'a-zA-Z0-9',
        alpha: 'a-zA-Z',
        ascii: '\\x00-\\x7F',
        blank: ' \\t',
        cntrl: '\\x00-\\x1F\\x7F',
        digit: '0-9',
        graph: '\\x21-\\x7E',
        lower: 'a-z',
        print: '\\x20-\\x7E ',
        punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
        space: ' \\t\\r\\n\\v\\f',
        upper: 'A-Z',
        word: 'A-Za-z0-9_',
        xdigit: 'A-Fa-f0-9'
    };
    module.exports = {
        MAX_LENGTH: 1024 * 64,
        POSIX_REGEX_SOURCE,
        REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
        REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
        REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
        REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
        REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
        REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
        REPLACEMENTS: {
            '***': '*',
            '**/**': '**',
            '**/**/**': '**'
        },
        CHAR_0: 48,
        CHAR_9: 57,
        CHAR_UPPERCASE_A: 65,
        CHAR_LOWERCASE_A: 97,
        CHAR_UPPERCASE_Z: 90,
        CHAR_LOWERCASE_Z: 122,
        CHAR_LEFT_PARENTHESES: 40,
        CHAR_RIGHT_PARENTHESES: 41,
        CHAR_ASTERISK: 42,
        CHAR_AMPERSAND: 38,
        CHAR_AT: 64,
        CHAR_BACKWARD_SLASH: 92,
        CHAR_CARRIAGE_RETURN: 13,
        CHAR_CIRCUMFLEX_ACCENT: 94,
        CHAR_COLON: 58,
        CHAR_COMMA: 44,
        CHAR_DOT: 46,
        CHAR_DOUBLE_QUOTE: 34,
        CHAR_EQUAL: 61,
        CHAR_EXCLAMATION_MARK: 33,
        CHAR_FORM_FEED: 12,
        CHAR_FORWARD_SLASH: 47,
        CHAR_GRAVE_ACCENT: 96,
        CHAR_HASH: 35,
        CHAR_HYPHEN_MINUS: 45,
        CHAR_LEFT_ANGLE_BRACKET: 60,
        CHAR_LEFT_CURLY_BRACE: 123,
        CHAR_LEFT_SQUARE_BRACKET: 91,
        CHAR_LINE_FEED: 10,
        CHAR_NO_BREAK_SPACE: 160,
        CHAR_PERCENT: 37,
        CHAR_PLUS: 43,
        CHAR_QUESTION_MARK: 63,
        CHAR_RIGHT_ANGLE_BRACKET: 62,
        CHAR_RIGHT_CURLY_BRACE: 125,
        CHAR_RIGHT_SQUARE_BRACKET: 93,
        CHAR_SEMICOLON: 59,
        CHAR_SINGLE_QUOTE: 39,
        CHAR_SPACE: 32,
        CHAR_TAB: 9,
        CHAR_UNDERSCORE: 95,
        CHAR_VERTICAL_LINE: 124,
        CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
        SEP: path.sep,
        extglobChars (chars) {
            return {
                '!': {
                    type: 'negate',
                    open: '(?:(?!(?:',
                    close: `))${chars.STAR})`
                },
                '?': {
                    type: 'qmark',
                    open: '(?:',
                    close: ')?'
                },
                '+': {
                    type: 'plus',
                    open: '(?:',
                    close: ')+'
                },
                '*': {
                    type: 'star',
                    open: '(?:',
                    close: ')*'
                },
                '@': {
                    type: 'at',
                    open: '(?:',
                    close: ')'
                }
            };
        },
        globChars (win32) {
            return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
        }
    };
}
,
"f6cc3d3d":function  (module, exports, farmRequire, farmDynamicRequire) {
    'use strict';
    module.exports = {
        MAX_LENGTH: 10000,
        CHAR_0: '0',
        CHAR_9: '9',
        CHAR_UPPERCASE_A: 'A',
        CHAR_LOWERCASE_A: 'a',
        CHAR_UPPERCASE_Z: 'Z',
        CHAR_LOWERCASE_Z: 'z',
        CHAR_LEFT_PARENTHESES: '(',
        CHAR_RIGHT_PARENTHESES: ')',
        CHAR_ASTERISK: '*',
        CHAR_AMPERSAND: '&',
        CHAR_AT: '@',
        CHAR_BACKSLASH: '\\',
        CHAR_BACKTICK: '`',
        CHAR_CARRIAGE_RETURN: '\r',
        CHAR_CIRCUMFLEX_ACCENT: '^',
        CHAR_COLON: ':',
        CHAR_COMMA: ',',
        CHAR_DOLLAR: '$',
        CHAR_DOT: '.',
        CHAR_DOUBLE_QUOTE: '"',
        CHAR_EQUAL: '=',
        CHAR_EXCLAMATION_MARK: '!',
        CHAR_FORM_FEED: '\f',
        CHAR_FORWARD_SLASH: '/',
        CHAR_HASH: '#',
        CHAR_HYPHEN_MINUS: '-',
        CHAR_LEFT_ANGLE_BRACKET: '<',
        CHAR_LEFT_CURLY_BRACE: '{',
        CHAR_LEFT_SQUARE_BRACKET: '[',
        CHAR_LINE_FEED: '\n',
        CHAR_NO_BREAK_SPACE: '\u00A0',
        CHAR_PERCENT: '%',
        CHAR_PLUS: '+',
        CHAR_QUESTION_MARK: '?',
        CHAR_RIGHT_ANGLE_BRACKET: '>',
        CHAR_RIGHT_CURLY_BRACE: '}',
        CHAR_RIGHT_SQUARE_BRACKET: ']',
        CHAR_SEMICOLON: ';',
        CHAR_SINGLE_QUOTE: '\'',
        CHAR_SPACE: ' ',
        CHAR_TAB: '\t',
        CHAR_UNDERSCORE: '_',
        CHAR_VERTICAL_LINE: '|',
        CHAR_ZERO_WIDTH_NOBREAK_SPACE: '\uFEFF'
    };
}
,});(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__.setInitialLoadedResources([]);(globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__.setDynamicModuleResourcesMap({  });var farmModuleSystem = (globalThis || window || global)['5b4b38a5164bbcd577766aad3135d55f'].__farm_module_system__;farmModuleSystem.bootstrap();var entry = farmModuleSystem.require("953dfae2");module.exports = entry.default || entry;