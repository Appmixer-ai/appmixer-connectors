var sl = Object.defineProperty;
var al = (e, t, n) => t in e ? sl(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Pu = (e, t, n) => al(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Ro(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const _e = {}, Hn = [], Cn = () => {
}, cl = () => !1, hr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), No = (e) => e.startsWith("onUpdate:"), Ze = Object.assign, Ns = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ll = Object.prototype.hasOwnProperty, me = (e, t) => ll.call(e, t), oe = Array.isArray, Un = (e) => pr(e) === "[object Map]", Os = (e) => pr(e) === "[object Set]", we = (e) => typeof e == "function", Pe = (e) => typeof e == "string", Qt = (e) => typeof e == "symbol", Le = (e) => e !== null && typeof e == "object", Ls = (e) => (Le(e) || we(e)) && we(e.then) && we(e.catch), Bs = Object.prototype.toString, pr = (e) => Bs.call(e), dl = (e) => pr(e).slice(8, -1), br = (e) => pr(e) === "[object Object]", Oo = (e) => Pe(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, au = /* @__PURE__ */ Ro(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), gr = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, fl = /-(\w)/g, rt = gr(
  (e) => e.replace(fl, (t, n) => n ? n.toUpperCase() : "")
), hl = /\B([A-Z])/g, dt = gr(
  (e) => e.replace(hl, "-$1").toLowerCase()
), mr = gr((e) => e.charAt(0).toUpperCase() + e.slice(1)), Gr = gr(
  (e) => e ? `on${mr(e)}` : ""
), lt = (e, t) => !Object.is(e, t), Ku = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Ps = (e, t, n, u = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: u,
    value: n
  });
}, po = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, bo = (e) => {
  const t = Pe(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Ai;
const _r = () => Ai || (Ai = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Lo(e) {
  if (oe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const u = e[n], r = Pe(u) ? ml(u) : Lo(u);
      if (r)
        for (const o in r)
          t[o] = r[o];
    }
    return t;
  } else if (Pe(e) || Le(e))
    return e;
}
const pl = /;(?![^(]*\))/g, bl = /:([^]+)/, gl = /\/\*[^]*?\*\//g;
function ml(e) {
  const t = {};
  return e.replace(gl, "").split(pl).forEach((n) => {
    if (n) {
      const u = n.split(bl);
      u.length > 1 && (t[u[0].trim()] = u[1].trim());
    }
  }), t;
}
function en(e) {
  let t = "";
  if (Pe(e))
    t = e;
  else if (oe(e))
    for (let n = 0; n < e.length; n++) {
      const u = en(e[n]);
      u && (t += u + " ");
    }
  else if (Le(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const _l = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", xl = /* @__PURE__ */ Ro(_l);
function $s(e) {
  return !!e || e === "";
}
const zs = (e) => !!(e && e.__v_isRef === !0), at = (e) => Pe(e) ? e : e == null ? "" : oe(e) || Le(e) && (e.toString === Bs || !we(e.toString)) ? zs(e) ? at(e.value) : JSON.stringify(e, js, 2) : String(e), js = (e, t) => zs(t) ? js(e, t.value) : Un(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [u, r], o) => (n[Vr(u, o) + " =>"] = r, n),
    {}
  )
} : Os(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Vr(n))
} : Qt(t) ? Vr(t) : Le(t) && !oe(t) && !br(t) ? String(t) : t, Vr = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Qt(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let tt;
class Hs {
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = tt, !t && tt && (this.index = (tt.scopes || (tt.scopes = [])).push(
      this
    ) - 1);
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = tt;
      try {
        return tt = this, t();
      } finally {
        tt = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = tt, tt = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (tt = this.prevScope, this.prevScope = void 0);
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, u;
      for (n = 0, u = this.effects.length; n < u; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, u = this.cleanups.length; n < u; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, u = this.scopes.length; n < u; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Us(e) {
  return new Hs(e);
}
function qs() {
  return tt;
}
function yl(e, t = !1) {
  tt && tt.cleanups.push(e);
}
let Ce;
const Kr = /* @__PURE__ */ new WeakSet();
class Gs {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, tt && tt.active && tt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Kr.has(this) && (Kr.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Ks(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Si(this), Zs(this);
    const t = Ce, n = Dt;
    Ce = this, Dt = !0;
    try {
      return this.fn();
    } finally {
      Ws(this), Ce = t, Dt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        $o(t);
      this.deps = this.depsTail = void 0, Si(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Kr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    go(this) && this.run();
  }
  get dirty() {
    return go(this);
  }
}
let Vs = 0, cu, lu;
function Ks(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = lu, lu = e;
    return;
  }
  e.next = cu, cu = e;
}
function Bo() {
  Vs++;
}
function Po() {
  if (--Vs > 0)
    return;
  if (lu) {
    let t = lu;
    for (lu = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; cu; ) {
    let t = cu;
    for (cu = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (u) {
          e || (e = u);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function Zs(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Ws(e) {
  let t, n = e.depsTail, u = n;
  for (; u; ) {
    const r = u.prevDep;
    u.version === -1 ? (u === n && (n = r), $o(u), wl(u)) : t = u, u.dep.activeLink = u.prevActiveLink, u.prevActiveLink = void 0, u = r;
  }
  e.deps = t, e.depsTail = n;
}
function go(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Js(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Js(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === bu) || (e.globalVersion = bu, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !go(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = Ce, u = Dt;
  Ce = e, Dt = !0;
  try {
    Zs(e);
    const r = e.fn(e._value);
    (t.version === 0 || lt(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    Ce = n, Dt = u, Ws(e), e.flags &= -3;
  }
}
function $o(e, t = !1) {
  const { dep: n, prevSub: u, nextSub: r } = e;
  if (u && (u.nextSub = r, e.prevSub = void 0), r && (r.prevSub = u, e.nextSub = void 0), n.subs === e && (n.subs = u, !u && n.computed)) {
    n.computed.flags &= -5;
    for (let o = n.computed.deps; o; o = o.nextDep)
      $o(o, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function wl(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Dt = !0;
const Ys = [];
function hn() {
  Ys.push(Dt), Dt = !1;
}
function pn() {
  const e = Ys.pop();
  Dt = e === void 0 ? !0 : e;
}
function Si(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = Ce;
    Ce = void 0;
    try {
      t();
    } finally {
      Ce = n;
    }
  }
}
let bu = 0;
class vl {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class xr {
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0;
  }
  track(t) {
    if (!Ce || !Dt || Ce === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== Ce)
      n = this.activeLink = new vl(Ce, this), Ce.deps ? (n.prevDep = Ce.depsTail, Ce.depsTail.nextDep = n, Ce.depsTail = n) : Ce.deps = Ce.depsTail = n, Xs(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const u = n.nextDep;
      u.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = u), n.prevDep = Ce.depsTail, n.nextDep = void 0, Ce.depsTail.nextDep = n, Ce.depsTail = n, Ce.deps === n && (Ce.deps = u);
    }
    return n;
  }
  trigger(t) {
    this.version++, bu++, this.notify(t);
  }
  notify(t) {
    Bo();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Po();
    }
  }
}
function Xs(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let u = t.deps; u; u = u.nextDep)
        Xs(u);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Xu = /* @__PURE__ */ new WeakMap(), An = Symbol(
  ""
), mo = Symbol(
  ""
), gu = Symbol(
  ""
);
function nt(e, t, n) {
  if (Dt && Ce) {
    let u = Xu.get(e);
    u || Xu.set(e, u = /* @__PURE__ */ new Map());
    let r = u.get(n);
    r || (u.set(n, r = new xr()), r.map = u, r.key = n), r.track();
  }
}
function Zt(e, t, n, u, r, o) {
  const i = Xu.get(e);
  if (!i) {
    bu++;
    return;
  }
  const s = (a) => {
    a && a.trigger();
  };
  if (Bo(), t === "clear")
    i.forEach(s);
  else {
    const a = oe(e), c = a && Oo(n);
    if (a && n === "length") {
      const l = Number(u);
      i.forEach((d, h) => {
        (h === "length" || h === gu || !Qt(h) && h >= l) && s(d);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && s(i.get(n)), c && s(i.get(gu)), t) {
        case "add":
          a ? c && s(i.get("length")) : (s(i.get(An)), Un(e) && s(i.get(mo)));
          break;
        case "delete":
          a || (s(i.get(An)), Un(e) && s(i.get(mo)));
          break;
        case "set":
          Un(e) && s(i.get(An));
          break;
      }
  }
  Po();
}
function kl(e, t) {
  const n = Xu.get(e);
  return n && n.get(t);
}
function Rn(e) {
  const t = pe(e);
  return t === e ? t : (nt(t, "iterate", gu), vt(e) ? t : t.map(Ke));
}
function yr(e) {
  return nt(e = pe(e), "iterate", gu), e;
}
const El = {
  __proto__: null,
  [Symbol.iterator]() {
    return Zr(this, Symbol.iterator, Ke);
  },
  concat(...e) {
    return Rn(this).concat(
      ...e.map((t) => oe(t) ? Rn(t) : t)
    );
  },
  entries() {
    return Zr(this, "entries", (e) => (e[1] = Ke(e[1]), e));
  },
  every(e, t) {
    return Vt(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Vt(this, "filter", e, t, (n) => n.map(Ke), arguments);
  },
  find(e, t) {
    return Vt(this, "find", e, t, Ke, arguments);
  },
  findIndex(e, t) {
    return Vt(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Vt(this, "findLast", e, t, Ke, arguments);
  },
  findLastIndex(e, t) {
    return Vt(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Vt(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Wr(this, "includes", e);
  },
  indexOf(...e) {
    return Wr(this, "indexOf", e);
  },
  join(e) {
    return Rn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return Wr(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Vt(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ru(this, "pop");
  },
  push(...e) {
    return ru(this, "push", e);
  },
  reduce(e, ...t) {
    return Di(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Di(this, "reduceRight", e, t);
  },
  shift() {
    return ru(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Vt(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ru(this, "splice", e);
  },
  toReversed() {
    return Rn(this).toReversed();
  },
  toSorted(e) {
    return Rn(this).toSorted(e);
  },
  toSpliced(...e) {
    return Rn(this).toSpliced(...e);
  },
  unshift(...e) {
    return ru(this, "unshift", e);
  },
  values() {
    return Zr(this, "values", Ke);
  }
};
function Zr(e, t, n) {
  const u = yr(e), r = u[t]();
  return u !== e && !vt(e) && (r._next = r.next, r.next = () => {
    const o = r._next();
    return o.value && (o.value = n(o.value)), o;
  }), r;
}
const Cl = Array.prototype;
function Vt(e, t, n, u, r, o) {
  const i = yr(e), s = i !== e && !vt(e), a = i[t];
  if (a !== Cl[t]) {
    const d = a.apply(e, o);
    return s ? Ke(d) : d;
  }
  let c = n;
  i !== e && (s ? c = function(d, h) {
    return n.call(this, Ke(d), h, e);
  } : n.length > 2 && (c = function(d, h) {
    return n.call(this, d, h, e);
  }));
  const l = a.call(i, c, u);
  return s && r ? r(l) : l;
}
function Di(e, t, n, u) {
  const r = yr(e);
  let o = n;
  return r !== e && (vt(e) ? n.length > 3 && (o = function(i, s, a) {
    return n.call(this, i, s, a, e);
  }) : o = function(i, s, a) {
    return n.call(this, i, Ke(s), a, e);
  }), r[t](o, ...u);
}
function Wr(e, t, n) {
  const u = pe(e);
  nt(u, "iterate", gu);
  const r = u[t](...n);
  return (r === -1 || r === !1) && Uo(n[0]) ? (n[0] = pe(n[0]), u[t](...n)) : r;
}
function ru(e, t, n = []) {
  hn(), Bo();
  const u = pe(e)[t].apply(e, n);
  return Po(), pn(), u;
}
const Al = /* @__PURE__ */ Ro("__proto__,__v_isRef,__isVue"), Qs = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Qt)
);
function Sl(e) {
  Qt(e) || (e = String(e));
  const t = pe(this);
  return nt(t, "has", e), t.hasOwnProperty(e);
}
class ea {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, u) {
    if (n === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, o = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return o;
    if (n === "__v_raw")
      return u === (r ? o ? Bl : ra : o ? ua : na).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(u) ? t : void 0;
    const i = oe(t);
    if (!r) {
      let a;
      if (i && (a = El[n]))
        return a;
      if (n === "hasOwnProperty")
        return Sl;
    }
    const s = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      Re(t) ? t : u
    );
    return (Qt(n) ? Qs.has(n) : Al(n)) || (r || nt(t, "get", n), o) ? s : Re(s) ? i && Oo(n) ? s : s.value : Le(s) ? r ? oa(s) : jo(s) : s;
  }
}
class ta extends ea {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, u, r) {
    let o = t[n];
    if (!this._isShallow) {
      const a = bn(o);
      if (!vt(u) && !bn(u) && (o = pe(o), u = pe(u)), !oe(t) && Re(o) && !Re(u))
        return a ? !1 : (o.value = u, !0);
    }
    const i = oe(t) && Oo(n) ? Number(n) < t.length : me(t, n), s = Reflect.set(
      t,
      n,
      u,
      Re(t) ? t : r
    );
    return t === pe(r) && (i ? lt(u, o) && Zt(t, "set", n, u) : Zt(t, "add", n, u)), s;
  }
  deleteProperty(t, n) {
    const u = me(t, n);
    t[n];
    const r = Reflect.deleteProperty(t, n);
    return r && u && Zt(t, "delete", n, void 0), r;
  }
  has(t, n) {
    const u = Reflect.has(t, n);
    return (!Qt(n) || !Qs.has(n)) && nt(t, "has", n), u;
  }
  ownKeys(t) {
    return nt(
      t,
      "iterate",
      oe(t) ? "length" : An
    ), Reflect.ownKeys(t);
  }
}
class Dl extends ea {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const Tl = /* @__PURE__ */ new ta(), Ml = /* @__PURE__ */ new Dl(), Fl = /* @__PURE__ */ new ta(!0);
const _o = (e) => e, $u = (e) => Reflect.getPrototypeOf(e);
function Il(e, t, n) {
  return function(...u) {
    const r = this.__v_raw, o = pe(r), i = Un(o), s = e === "entries" || e === Symbol.iterator && i, a = e === "keys" && i, c = r[e](...u), l = n ? _o : t ? Qu : Ke;
    return !t && nt(
      o,
      "iterate",
      a ? mo : An
    ), {
      // iterator protocol
      next() {
        const { value: d, done: h } = c.next();
        return h ? { value: d, done: h } : {
          value: s ? [l(d[0]), l(d[1])] : l(d),
          done: h
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function zu(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Rl(e, t) {
  const n = {
    get(r) {
      const o = this.__v_raw, i = pe(o), s = pe(r);
      e || (lt(r, s) && nt(i, "get", r), nt(i, "get", s));
      const { has: a } = $u(i), c = t ? _o : e ? Qu : Ke;
      if (a.call(i, r))
        return c(o.get(r));
      if (a.call(i, s))
        return c(o.get(s));
      o !== i && o.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && nt(pe(r), "iterate", An), Reflect.get(r, "size", r);
    },
    has(r) {
      const o = this.__v_raw, i = pe(o), s = pe(r);
      return e || (lt(r, s) && nt(i, "has", r), nt(i, "has", s)), r === s ? o.has(r) : o.has(r) || o.has(s);
    },
    forEach(r, o) {
      const i = this, s = i.__v_raw, a = pe(s), c = t ? _o : e ? Qu : Ke;
      return !e && nt(a, "iterate", An), s.forEach((l, d) => r.call(o, c(l), c(d), i));
    }
  };
  return Ze(
    n,
    e ? {
      add: zu("add"),
      set: zu("set"),
      delete: zu("delete"),
      clear: zu("clear")
    } : {
      add(r) {
        !t && !vt(r) && !bn(r) && (r = pe(r));
        const o = pe(this);
        return $u(o).has.call(o, r) || (o.add(r), Zt(o, "add", r, r)), this;
      },
      set(r, o) {
        !t && !vt(o) && !bn(o) && (o = pe(o));
        const i = pe(this), { has: s, get: a } = $u(i);
        let c = s.call(i, r);
        c || (r = pe(r), c = s.call(i, r));
        const l = a.call(i, r);
        return i.set(r, o), c ? lt(o, l) && Zt(i, "set", r, o) : Zt(i, "add", r, o), this;
      },
      delete(r) {
        const o = pe(this), { has: i, get: s } = $u(o);
        let a = i.call(o, r);
        a || (r = pe(r), a = i.call(o, r)), s && s.call(o, r);
        const c = o.delete(r);
        return a && Zt(o, "delete", r, void 0), c;
      },
      clear() {
        const r = pe(this), o = r.size !== 0, i = r.clear();
        return o && Zt(
          r,
          "clear",
          void 0,
          void 0
        ), i;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    n[r] = Il(r, e, t);
  }), n;
}
function zo(e, t) {
  const n = Rl(e, t);
  return (u, r, o) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? u : Reflect.get(
    me(n, r) && r in u ? n : u,
    r,
    o
  );
}
const Nl = {
  get: /* @__PURE__ */ zo(!1, !1)
}, Ol = {
  get: /* @__PURE__ */ zo(!1, !0)
}, Ll = {
  get: /* @__PURE__ */ zo(!0, !1)
};
const na = /* @__PURE__ */ new WeakMap(), ua = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), Bl = /* @__PURE__ */ new WeakMap();
function Pl(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function $l(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Pl(dl(e));
}
function jo(e) {
  return bn(e) ? e : Ho(
    e,
    !1,
    Tl,
    Nl,
    na
  );
}
function zl(e) {
  return Ho(
    e,
    !1,
    Fl,
    Ol,
    ua
  );
}
function oa(e) {
  return Ho(
    e,
    !0,
    Ml,
    Ll,
    ra
  );
}
function Ho(e, t, n, u, r) {
  if (!Le(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const o = $l(e);
  if (o === 0)
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const s = new Proxy(
    e,
    o === 2 ? u : n
  );
  return r.set(e, s), s;
}
function Jt(e) {
  return bn(e) ? Jt(e.__v_raw) : !!(e && e.__v_isReactive);
}
function bn(e) {
  return !!(e && e.__v_isReadonly);
}
function vt(e) {
  return !!(e && e.__v_isShallow);
}
function Uo(e) {
  return e ? !!e.__v_raw : !1;
}
function pe(e) {
  const t = e && e.__v_raw;
  return t ? pe(t) : e;
}
function ht(e) {
  return !me(e, "__v_skip") && Object.isExtensible(e) && Ps(e, "__v_skip", !0), e;
}
const Ke = (e) => Le(e) ? jo(e) : e, Qu = (e) => Le(e) ? oa(e) : e;
function Re(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ve(e) {
  return jl(e, !1);
}
function jl(e, t) {
  return Re(e) ? e : new Hl(e, t);
}
class Hl {
  constructor(t, n) {
    this.dep = new xr(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : pe(t), this._value = n ? t : Ke(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, u = this.__v_isShallow || vt(t) || bn(t);
    t = u ? t : pe(t), lt(t, n) && (this._rawValue = t, this._value = u ? t : Ke(t), this.dep.trigger());
  }
}
function G(e) {
  return Re(e) ? e.value : e;
}
const Ul = {
  get: (e, t, n) => t === "__v_raw" ? e : G(Reflect.get(e, t, n)),
  set: (e, t, n, u) => {
    const r = e[t];
    return Re(r) && !Re(n) ? (r.value = n, !0) : Reflect.set(e, t, n, u);
  }
};
function ia(e) {
  return Jt(e) ? e : new Proxy(e, Ul);
}
class ql {
  constructor(t) {
    this.__v_isRef = !0, this._value = void 0;
    const n = this.dep = new xr(), { get: u, set: r } = t(n.track.bind(n), n.trigger.bind(n));
    this._get = u, this._set = r;
  }
  get value() {
    return this._value = this._get();
  }
  set value(t) {
    this._set(t);
  }
}
function Gl(e) {
  return new ql(e);
}
function Vl(e) {
  const t = oe(e) ? new Array(e.length) : {};
  for (const n in e)
    t[n] = aa(e, n);
  return t;
}
class Kl {
  constructor(t, n, u) {
    this._object = t, this._key = n, this._defaultValue = u, this.__v_isRef = !0, this._value = void 0;
  }
  get value() {
    const t = this._object[this._key];
    return this._value = t === void 0 ? this._defaultValue : t;
  }
  set value(t) {
    this._object[this._key] = t;
  }
  get dep() {
    return kl(pe(this._object), this._key);
  }
}
class Zl {
  constructor(t) {
    this._getter = t, this.__v_isRef = !0, this.__v_isReadonly = !0, this._value = void 0;
  }
  get value() {
    return this._value = this._getter();
  }
}
function sa(e, t, n) {
  return Re(e) ? e : we(e) ? new Zl(e) : Le(e) && arguments.length > 1 ? aa(e, t, n) : ve(e);
}
function aa(e, t, n) {
  const u = e[t];
  return Re(u) ? u : new Kl(e, t, n);
}
class Wl {
  constructor(t, n, u) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new xr(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = bu - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = u;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    Ce !== this)
      return Ks(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return Js(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function Jl(e, t, n = !1) {
  let u, r;
  return we(e) ? u = e : (u = e.get, r = e.set), new Wl(u, r, n);
}
const ju = {}, er = /* @__PURE__ */ new WeakMap();
let En;
function Yl(e, t = !1, n = En) {
  if (n) {
    let u = er.get(n);
    u || er.set(n, u = []), u.push(e);
  }
}
function Xl(e, t, n = _e) {
  const { immediate: u, deep: r, once: o, scheduler: i, augmentJob: s, call: a } = n, c = (v) => r ? v : vt(v) || r === !1 || r === 0 ? Wt(v, 1) : Wt(v);
  let l, d, h, f, p = !1, _ = !1;
  if (Re(e) ? (d = () => e.value, p = vt(e)) : Jt(e) ? (d = () => c(e), p = !0) : oe(e) ? (_ = !0, p = e.some((v) => Jt(v) || vt(v)), d = () => e.map((v) => {
    if (Re(v))
      return v.value;
    if (Jt(v))
      return c(v);
    if (we(v))
      return a ? a(v, 2) : v();
  })) : we(e) ? t ? d = a ? () => a(e, 2) : e : d = () => {
    if (h) {
      hn();
      try {
        h();
      } finally {
        pn();
      }
    }
    const v = En;
    En = l;
    try {
      return a ? a(e, 3, [f]) : e(f);
    } finally {
      En = v;
    }
  } : d = Cn, t && r) {
    const v = d, x = r === !0 ? 1 / 0 : r;
    d = () => Wt(v(), x);
  }
  const O = qs(), P = () => {
    l.stop(), O && O.active && Ns(O.effects, l);
  };
  if (o && t) {
    const v = t;
    t = (...x) => {
      v(...x), P();
    };
  }
  let A = _ ? new Array(e.length).fill(ju) : ju;
  const T = (v) => {
    if (!(!(l.flags & 1) || !l.dirty && !v))
      if (t) {
        const x = l.run();
        if (r || p || (_ ? x.some((L, ne) => lt(L, A[ne])) : lt(x, A))) {
          h && h();
          const L = En;
          En = l;
          try {
            const ne = [
              x,
              // pass undefined as the old value when it's changed for the first time
              A === ju ? void 0 : _ && A[0] === ju ? [] : A,
              f
            ];
            a ? a(t, 3, ne) : (
              // @ts-expect-error
              t(...ne)
            ), A = x;
          } finally {
            En = L;
          }
        }
      } else
        l.run();
  };
  return s && s(T), l = new Gs(d), l.scheduler = i ? () => i(T, !1) : T, f = (v) => Yl(v, !1, l), h = l.onStop = () => {
    const v = er.get(l);
    if (v) {
      if (a)
        a(v, 4);
      else
        for (const x of v) x();
      er.delete(l);
    }
  }, t ? u ? T(!0) : A = l.run() : i ? i(T.bind(null, !0), !0) : l.run(), P.pause = l.pause.bind(l), P.resume = l.resume.bind(l), P.stop = P, P;
}
function Wt(e, t = 1 / 0, n) {
  if (t <= 0 || !Le(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, Re(e))
    Wt(e.value, t, n);
  else if (oe(e))
    for (let u = 0; u < e.length; u++)
      Wt(e[u], t, n);
  else if (Os(e) || Un(e))
    e.forEach((u) => {
      Wt(u, t, n);
    });
  else if (br(e)) {
    for (const u in e)
      Wt(e[u], t, n);
    for (const u of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, u) && Wt(e[u], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Cu(e, t, n, u) {
  try {
    return u ? e(...u) : e();
  } catch (r) {
    wr(r, t, n);
  }
}
function zt(e, t, n, u) {
  if (we(e)) {
    const r = Cu(e, t, n, u);
    return r && Ls(r) && r.catch((o) => {
      wr(o, t, n);
    }), r;
  }
  if (oe(e)) {
    const r = [];
    for (let o = 0; o < e.length; o++)
      r.push(zt(e[o], t, n, u));
    return r;
  }
}
function wr(e, t, n, u = !0) {
  const r = t ? t.vnode : null, { errorHandler: o, throwUnhandledErrorInProduction: i } = t && t.appContext.config || _e;
  if (t) {
    let s = t.parent;
    const a = t.proxy, c = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; s; ) {
      const l = s.ec;
      if (l) {
        for (let d = 0; d < l.length; d++)
          if (l[d](e, a, c) === !1)
            return;
      }
      s = s.parent;
    }
    if (o) {
      hn(), Cu(o, null, 10, [
        e,
        a,
        c
      ]), pn();
      return;
    }
  }
  Ql(e, n, r, u, i);
}
function Ql(e, t, n, u = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const st = [];
let Lt = -1;
const qn = [];
let sn = null, Bn = 0;
const ca = /* @__PURE__ */ Promise.resolve();
let tr = null;
function Xt(e) {
  const t = tr || ca;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function e0(e) {
  let t = Lt + 1, n = st.length;
  for (; t < n; ) {
    const u = t + n >>> 1, r = st[u], o = mu(r);
    o < e || o === e && r.flags & 2 ? t = u + 1 : n = u;
  }
  return t;
}
function qo(e) {
  if (!(e.flags & 1)) {
    const t = mu(e), n = st[st.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= mu(n) ? st.push(e) : st.splice(e0(t), 0, e), e.flags |= 1, la();
  }
}
function la() {
  tr || (tr = ca.then(fa));
}
function t0(e) {
  oe(e) ? qn.push(...e) : sn && e.id === -1 ? sn.splice(Bn + 1, 0, e) : e.flags & 1 || (qn.push(e), e.flags |= 1), la();
}
function Ti(e, t, n = Lt + 1) {
  for (; n < st.length; n++) {
    const u = st[n];
    if (u && u.flags & 2) {
      if (e && u.id !== e.uid)
        continue;
      st.splice(n, 1), n--, u.flags & 4 && (u.flags &= -2), u(), u.flags & 4 || (u.flags &= -2);
    }
  }
}
function da(e) {
  if (qn.length) {
    const t = [...new Set(qn)].sort(
      (n, u) => mu(n) - mu(u)
    );
    if (qn.length = 0, sn) {
      sn.push(...t);
      return;
    }
    for (sn = t, Bn = 0; Bn < sn.length; Bn++) {
      const n = sn[Bn];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    sn = null, Bn = 0;
  }
}
const mu = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function fa(e) {
  try {
    for (Lt = 0; Lt < st.length; Lt++) {
      const t = st[Lt];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Cu(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Lt < st.length; Lt++) {
      const t = st[Lt];
      t && (t.flags &= -2);
    }
    Lt = -1, st.length = 0, da(), tr = null, (st.length || qn.length) && fa();
  }
}
let je = null, ha = null;
function nr(e) {
  const t = je;
  return je = e, ha = e && e.type.__scopeId || null, t;
}
function ct(e, t = je, n) {
  if (!t || e._n)
    return e;
  const u = (...r) => {
    u._d && Bi(-1);
    const o = nr(t);
    let i;
    try {
      i = e(...r);
    } finally {
      nr(o), u._d && Bi(1);
    }
    return i;
  };
  return u._n = !0, u._c = !0, u._d = !0, u;
}
function n0(e, t) {
  if (je === null)
    return e;
  const n = Cr(je), u = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [o, i, s, a = _e] = t[r];
    o && (we(o) && (o = {
      mounted: o,
      updated: o
    }), o.deep && Wt(i), u.push({
      dir: o,
      instance: n,
      value: i,
      oldValue: void 0,
      arg: s,
      modifiers: a
    }));
  }
  return e;
}
function yn(e, t, n, u) {
  const r = e.dirs, o = t && t.dirs;
  for (let i = 0; i < r.length; i++) {
    const s = r[i];
    o && (s.oldValue = o[i].value);
    let a = s.dir[u];
    a && (hn(), zt(a, n, 8, [
      e.el,
      s,
      e,
      t
    ]), pn());
  }
}
const u0 = Symbol("_vte"), r0 = (e) => e.__isTeleport, Nn = Symbol("_leaveCb"), Hu = Symbol("_enterCb");
function o0() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  return Tn(() => {
    e.isMounted = !0;
  }), Go(() => {
    e.isUnmounting = !0;
  }), e;
}
const wt = [Function, Array], i0 = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: wt,
  onEnter: wt,
  onAfterEnter: wt,
  onEnterCancelled: wt,
  // leave
  onBeforeLeave: wt,
  onLeave: wt,
  onAfterLeave: wt,
  onLeaveCancelled: wt,
  // appear
  onBeforeAppear: wt,
  onAppear: wt,
  onAfterAppear: wt,
  onAppearCancelled: wt
};
function s0(e, t) {
  const { leavingVNodes: n } = e;
  let u = n.get(t.type);
  return u || (u = /* @__PURE__ */ Object.create(null), n.set(t.type, u)), u;
}
function xo(e, t, n, u, r) {
  const {
    appear: o,
    mode: i,
    persisted: s = !1,
    onBeforeEnter: a,
    onEnter: c,
    onAfterEnter: l,
    onEnterCancelled: d,
    onBeforeLeave: h,
    onLeave: f,
    onAfterLeave: p,
    onLeaveCancelled: _,
    onBeforeAppear: O,
    onAppear: P,
    onAfterAppear: A,
    onAppearCancelled: T
  } = t, v = String(e.key), x = s0(n, e), L = (F, te) => {
    F && zt(
      F,
      u,
      9,
      te
    );
  }, ne = (F, te) => {
    const I = te[1];
    L(F, te), oe(F) ? F.every((k) => k.length <= 1) && I() : F.length <= 1 && I();
  }, q = {
    mode: i,
    persisted: s,
    beforeEnter(F) {
      let te = a;
      if (!n.isMounted)
        if (o)
          te = O || a;
        else
          return;
      F[Nn] && F[Nn](
        !0
        /* cancelled */
      );
      const I = x[v];
      I && Pn(e, I) && I.el[Nn] && I.el[Nn](), L(te, [F]);
    },
    enter(F) {
      let te = c, I = l, k = d;
      if (!n.isMounted)
        if (o)
          te = P || c, I = A || l, k = T || d;
        else
          return;
      let J = !1;
      const he = F[Hu] = (Te) => {
        J || (J = !0, Te ? L(k, [F]) : L(I, [F]), q.delayedLeave && q.delayedLeave(), F[Hu] = void 0);
      };
      te ? ne(te, [F, he]) : he();
    },
    leave(F, te) {
      const I = String(e.key);
      if (F[Hu] && F[Hu](
        !0
        /* cancelled */
      ), n.isUnmounting)
        return te();
      L(h, [F]);
      let k = !1;
      const J = F[Nn] = (he) => {
        k || (k = !0, te(), he ? L(_, [F]) : L(p, [F]), F[Nn] = void 0, x[I] === e && delete x[I]);
      };
      x[I] = e, f ? ne(f, [F, J]) : J();
    },
    clone(F) {
      return xo(
        F,
        t,
        n,
        u
      );
    }
  };
  return q;
}
function _u(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, _u(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
function pa(e, t = !1, n) {
  let u = [], r = 0;
  for (let o = 0; o < e.length; o++) {
    let i = e[o];
    const s = n == null ? i.key : String(n) + String(i.key != null ? i.key : o);
    i.type === Fe ? (i.patchFlag & 128 && r++, u = u.concat(
      pa(i.children, t, s)
    )) : (t || i.type !== jt) && u.push(s != null ? Dn(i, { key: s }) : i);
  }
  if (r > 1)
    for (let o = 0; o < u.length; o++)
      u[o].patchFlag = -2;
  return u;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Se(e, t) {
  return we(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Ze({ name: e.name }, t, { setup: e })
  ) : e;
}
function a0(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function ur(e, t, n, u, r = !1) {
  if (oe(e)) {
    e.forEach(
      (p, _) => ur(
        p,
        t && (oe(t) ? t[_] : t),
        n,
        u,
        r
      )
    );
    return;
  }
  if (Gn(u) && !r) {
    u.shapeFlag & 512 && u.type.__asyncResolved && u.component.subTree.component && ur(e, t, n, u.component.subTree);
    return;
  }
  const o = u.shapeFlag & 4 ? Cr(u.component) : u.el, i = r ? null : o, { i: s, r: a } = e, c = t && t.r, l = s.refs === _e ? s.refs = {} : s.refs, d = s.setupState, h = pe(d), f = d === _e ? () => !1 : (p) => me(h, p);
  if (c != null && c !== a && (Pe(c) ? (l[c] = null, f(c) && (d[c] = null)) : Re(c) && (c.value = null)), we(a))
    Cu(a, s, 12, [i, l]);
  else {
    const p = Pe(a), _ = Re(a);
    if (p || _) {
      const O = () => {
        if (e.f) {
          const P = p ? f(a) ? d[a] : l[a] : a.value;
          r ? oe(P) && Ns(P, o) : oe(P) ? P.includes(o) || P.push(o) : p ? (l[a] = [o], f(a) && (d[a] = l[a])) : (a.value = [o], e.k && (l[e.k] = a.value));
        } else p ? (l[a] = i, f(a) && (d[a] = i)) : _ && (a.value = i, e.k && (l[e.k] = i));
      };
      i ? (O.id = -1, bt(O, n)) : O();
    }
  }
}
_r().requestIdleCallback;
_r().cancelIdleCallback;
const Gn = (e) => !!e.type.__asyncLoader, c0 = (e) => e.type.__isKeepAlive;
function l0(e, t, n = ut, u = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), o = t.__weh || (t.__weh = (...i) => {
      hn();
      const s = Xo(n), a = zt(t, n, e, i);
      return s(), pn(), a;
    });
    return u ? r.unshift(o) : r.push(o), o;
  }
}
const vr = (e) => (t, n = ut) => {
  (!yu || e === "sp") && l0(e, (...u) => t(...u), n);
}, Tn = vr("m"), d0 = vr("u"), Go = vr(
  "bum"
), f0 = vr("um"), h0 = "components", ba = Symbol.for("v-ndc");
function p0(e) {
  return Pe(e) ? b0(h0, e, !1) || e : e || ba;
}
function b0(e, t, n = !0, u = !1) {
  const r = je || ut;
  if (r) {
    const o = r.type;
    {
      const s = Y0(
        o,
        !1
      );
      if (s && (s === t || s === rt(t) || s === mr(rt(t))))
        return o;
    }
    const i = (
      // local registration
      // check instance[type] first which is resolved for options API
      Mi(r[e] || o[e], t) || // global registration
      Mi(r.appContext[e], t)
    );
    return !i && u ? o : i;
  }
}
function Mi(e, t) {
  return e && (e[t] || e[rt(t)] || e[mr(rt(t))]);
}
function Mn(e, t, n, u) {
  let r;
  const o = n, i = oe(e);
  if (i || Pe(e)) {
    const s = i && Jt(e);
    let a = !1, c = !1;
    s && (a = !vt(e), c = bn(e), e = yr(e)), r = new Array(e.length);
    for (let l = 0, d = e.length; l < d; l++)
      r[l] = t(
        a ? c ? Qu(Ke(e[l])) : Ke(e[l]) : e[l],
        l,
        void 0,
        o
      );
  } else if (typeof e == "number") {
    r = new Array(e);
    for (let s = 0; s < e; s++)
      r[s] = t(s + 1, s, void 0, o);
  } else if (Le(e))
    if (e[Symbol.iterator])
      r = Array.from(
        e,
        (s, a) => t(s, a, void 0, o)
      );
    else {
      const s = Object.keys(e);
      r = new Array(s.length);
      for (let a = 0, c = s.length; a < c; a++) {
        const l = s[a];
        r[a] = t(e[l], l, a, o);
      }
    }
  else
    r = [];
  return r;
}
function rr(e, t, n = {}, u, r) {
  if (je.ce || je.parent && Gn(je.parent) && je.parent.ce)
    return t !== "default" && (n.name = t), N(), We(
      Fe,
      null,
      [ee("slot", n, u)],
      64
    );
  let o = e[t];
  o && o._c && (o._d = !1), N();
  const i = o && ga(o(n)), s = n.key || // slot content array of a dynamic conditional slot may have a branch
  // key attached in the `createSlots` helper, respect that
  i && i.key, a = We(
    Fe,
    {
      key: (s && !Qt(s) ? s : `_${t}`) + // #7256 force differentiate fallback content from actual content
      ""
    },
    i || [],
    i && e._ === 1 ? 64 : -2
  );
  return a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]), o && o._c && (o._d = !0), a;
}
function ga(e) {
  return e.some((t) => Wo(t) ? !(t.type === jt || t.type === Fe && !ga(t.children)) : !0) ? e : null;
}
const yo = (e) => e ? Oa(e) ? Cr(e) : yo(e.parent) : null, du = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Ze(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => yo(e.parent),
    $root: (e) => yo(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => e.type,
    $forceUpdate: (e) => e.f || (e.f = () => {
      qo(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Xt.bind(e.proxy)),
    $watch: (e) => Cn
  })
), Jr = (e, t) => e !== _e && !e.__isScriptSetup && me(e, t), g0 = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: u, data: r, props: o, accessCache: i, type: s, appContext: a } = e;
    let c;
    if (t[0] !== "$") {
      const f = i[t];
      if (f !== void 0)
        switch (f) {
          case 1:
            return u[t];
          case 2:
            return r[t];
          case 4:
            return n[t];
          case 3:
            return o[t];
        }
      else {
        if (Jr(u, t))
          return i[t] = 1, u[t];
        if (r !== _e && me(r, t))
          return i[t] = 2, r[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (c = e.propsOptions[0]) && me(c, t)
        )
          return i[t] = 3, o[t];
        if (n !== _e && me(n, t))
          return i[t] = 4, n[t];
        i[t] = 0;
      }
    }
    const l = du[t];
    let d, h;
    if (l)
      return t === "$attrs" && nt(e.attrs, "get", ""), l(e);
    if (
      // css module (injected by vue-loader)
      (d = s.__cssModules) && (d = d[t])
    )
      return d;
    if (n !== _e && me(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      h = a.config.globalProperties, me(h, t)
    )
      return h[t];
  },
  set({ _: e }, t, n) {
    const { data: u, setupState: r, ctx: o } = e;
    return Jr(r, t) ? (r[t] = n, !0) : u !== _e && me(u, t) ? (u[t] = n, !0) : me(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (o[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: u, appContext: r, propsOptions: o }
  }, i) {
    let s;
    return !!n[i] || e !== _e && me(e, i) || Jr(t, i) || (s = o[0]) && me(s, i) || me(u, i) || me(du, i) || me(r.config.globalProperties, i);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : me(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Fi(e) {
  return oe(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
function Ii(e, t) {
  return !e || !t ? e || t : oe(e) && oe(t) ? e.concat(t) : Ze({}, Fi(e), Fi(t));
}
function ma() {
  return {
    app: null,
    config: {
      isNativeTag: cl,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let m0 = 0;
function _0(e, t) {
  return function(u, r = null) {
    we(u) || (u = Ze({}, u)), r != null && !Le(r) && (r = null);
    const o = ma(), i = /* @__PURE__ */ new WeakSet(), s = [];
    let a = !1;
    const c = o.app = {
      _uid: m0++,
      _component: u,
      _props: r,
      _container: null,
      _context: o,
      _instance: null,
      version: Q0,
      get config() {
        return o.config;
      },
      set config(l) {
      },
      use(l, ...d) {
        return i.has(l) || (l && we(l.install) ? (i.add(l), l.install(c, ...d)) : we(l) && (i.add(l), l(c, ...d))), c;
      },
      mixin(l) {
        return c;
      },
      component(l, d) {
        return d ? (o.components[l] = d, c) : o.components[l];
      },
      directive(l, d) {
        return d ? (o.directives[l] = d, c) : o.directives[l];
      },
      mount(l, d, h) {
        if (!a) {
          const f = c._ceVNode || ee(u, r);
          return f.appContext = o, h === !0 ? h = "svg" : h === !1 && (h = void 0), e(f, l, h), a = !0, c._container = l, l.__vue_app__ = c, Cr(f.component);
        }
      },
      onUnmount(l) {
        s.push(l);
      },
      unmount() {
        a && (zt(
          s,
          c._instance,
          16
        ), e(null, c._container), delete c._container.__vue_app__);
      },
      provide(l, d) {
        return o.provides[l] = d, c;
      },
      runWithContext(l) {
        const d = Sn;
        Sn = c;
        try {
          return l();
        } finally {
          Sn = d;
        }
      }
    };
    return c;
  };
}
let Sn = null;
function _a(e, t) {
  if (ut) {
    let n = ut.provides;
    const u = ut.parent && ut.parent.provides;
    u === n && (n = ut.provides = Object.create(u)), n[e] = t;
  }
}
function Vo(e, t, n = !1) {
  const u = ut || je;
  if (u || Sn) {
    const r = Sn ? Sn._context.provides : u ? u.parent == null ? u.vnode.appContext && u.vnode.appContext.provides : u.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && we(t) ? t.call(u && u.proxy) : t;
  }
}
function x0() {
  return !!(ut || je || Sn);
}
const xa = {}, ya = () => Object.create(xa), wa = (e) => Object.getPrototypeOf(e) === xa;
function y0(e, t, n, u = !1) {
  const r = {}, o = ya();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), va(e, t, r, o);
  for (const i in e.propsOptions[0])
    i in r || (r[i] = void 0);
  n ? e.props = u ? r : zl(r) : e.type.props ? e.props = r : e.props = o, e.attrs = o;
}
function w0(e, t, n, u) {
  const {
    props: r,
    attrs: o,
    vnode: { patchFlag: i }
  } = e, s = pe(r), [a] = e.propsOptions;
  let c = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (u || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const l = e.vnode.dynamicProps;
      for (let d = 0; d < l.length; d++) {
        let h = l[d];
        if (kr(e.emitsOptions, h))
          continue;
        const f = t[h];
        if (a)
          if (me(o, h))
            f !== o[h] && (o[h] = f, c = !0);
          else {
            const p = rt(h);
            r[p] = wo(
              a,
              s,
              p,
              f,
              e,
              !1
            );
          }
        else
          f !== o[h] && (o[h] = f, c = !0);
      }
    }
  } else {
    va(e, t, r, o) && (c = !0);
    let l;
    for (const d in s)
      (!t || // for camelCase
      !me(t, d) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((l = dt(d)) === d || !me(t, l))) && (a ? n && // for camelCase
      (n[d] !== void 0 || // for kebab-case
      n[l] !== void 0) && (r[d] = wo(
        a,
        s,
        d,
        void 0,
        e,
        !0
      )) : delete r[d]);
    if (o !== s)
      for (const d in o)
        (!t || !me(t, d)) && (delete o[d], c = !0);
  }
  c && Zt(e.attrs, "set", "");
}
function va(e, t, n, u) {
  const [r, o] = e.propsOptions;
  let i = !1, s;
  if (t)
    for (let a in t) {
      if (au(a))
        continue;
      const c = t[a];
      let l;
      r && me(r, l = rt(a)) ? !o || !o.includes(l) ? n[l] = c : (s || (s = {}))[l] = c : kr(e.emitsOptions, a) || (!(a in u) || c !== u[a]) && (u[a] = c, i = !0);
    }
  if (o) {
    const a = pe(n), c = s || _e;
    for (let l = 0; l < o.length; l++) {
      const d = o[l];
      n[d] = wo(
        r,
        a,
        d,
        c[d],
        e,
        !me(c, d)
      );
    }
  }
  return i;
}
function wo(e, t, n, u, r, o) {
  const i = e[n];
  if (i != null) {
    const s = me(i, "default");
    if (s && u === void 0) {
      const a = i.default;
      if (i.type !== Function && !i.skipFactory && we(a)) {
        const { propsDefaults: c } = r;
        if (n in c)
          u = c[n];
        else {
          const l = Xo(r);
          u = c[n] = a.call(
            null,
            t
          ), l();
        }
      } else
        u = a;
      r.ce && r.ce._setProp(n, u);
    }
    i[
      0
      /* shouldCast */
    ] && (o && !s ? u = !1 : i[
      1
      /* shouldCastTrue */
    ] && (u === "" || u === dt(n)) && (u = !0));
  }
  return u;
}
function v0(e, t, n = !1) {
  const u = t.propsCache, r = u.get(e);
  if (r)
    return r;
  const o = e.props, i = {}, s = [];
  if (!o)
    return Le(e) && u.set(e, Hn), Hn;
  if (oe(o))
    for (let c = 0; c < o.length; c++) {
      const l = rt(o[c]);
      Ri(l) && (i[l] = _e);
    }
  else if (o)
    for (const c in o) {
      const l = rt(c);
      if (Ri(l)) {
        const d = o[c], h = i[l] = oe(d) || we(d) ? { type: d } : Ze({}, d), f = h.type;
        let p = !1, _ = !0;
        if (oe(f))
          for (let O = 0; O < f.length; ++O) {
            const P = f[O], A = we(P) && P.name;
            if (A === "Boolean") {
              p = !0;
              break;
            } else A === "String" && (_ = !1);
          }
        else
          p = we(f) && f.name === "Boolean";
        h[
          0
          /* shouldCast */
        ] = p, h[
          1
          /* shouldCastTrue */
        ] = _, (p || me(h, "default")) && s.push(l);
      }
    }
  const a = [i, s];
  return Le(e) && u.set(e, a), a;
}
function Ri(e) {
  return e[0] !== "$" && !au(e);
}
const Ko = (e) => e[0] === "_" || e === "$stable", Zo = (e) => oe(e) ? e.map(Bt) : [Bt(e)], k0 = (e, t, n) => {
  if (t._n)
    return t;
  const u = ct((...r) => Zo(t(...r)), n);
  return u._c = !1, u;
}, ka = (e, t, n) => {
  const u = e._ctx;
  for (const r in e) {
    if (Ko(r)) continue;
    const o = e[r];
    if (we(o))
      t[r] = k0(r, o, u);
    else if (o != null) {
      const i = Zo(o);
      t[r] = () => i;
    }
  }
}, Ea = (e, t) => {
  const n = Zo(t);
  e.slots.default = () => n;
}, Ca = (e, t, n) => {
  for (const u in t)
    (n || !Ko(u)) && (e[u] = t[u]);
}, E0 = (e, t, n) => {
  const u = e.slots = ya();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (Ca(u, t, n), n && Ps(u, "_", r, !0)) : ka(t, u);
  } else t && Ea(e, t);
}, C0 = (e, t, n) => {
  const { vnode: u, slots: r } = e;
  let o = !0, i = _e;
  if (u.shapeFlag & 32) {
    const s = t._;
    s ? n && s === 1 ? o = !1 : Ca(r, t, n) : (o = !t.$stable, ka(t, r)), i = t;
  } else t && (Ea(e, t), i = { default: 1 });
  if (o)
    for (const s in r)
      !Ko(s) && i[s] == null && delete r[s];
}, bt = z0;
function A0(e) {
  return S0(e);
}
function S0(e, t) {
  const n = _r();
  n.__VUE__ = !0;
  const {
    insert: u,
    remove: r,
    patchProp: o,
    createElement: i,
    createText: s,
    createComment: a,
    setText: c,
    setElementText: l,
    parentNode: d,
    nextSibling: h,
    setScopeId: f = Cn,
    insertStaticContent: p
  } = e, _ = (b, m, y, S = null, E = null, C = null, z = void 0, B = null, R = !!m.dynamicChildren) => {
    if (b === m)
      return;
    b && !Pn(b, m) && (S = Fn(b), He(b, E, C, !0), b = null), m.patchFlag === -2 && (R = !1, m.dynamicChildren = null);
    const { type: D, ref: X, shapeFlag: j } = m;
    switch (D) {
      case Er:
        O(b, m, y, S);
        break;
      case jt:
        P(b, m, y, S);
        break;
      case Zu:
        b == null && A(m, y, S, z);
        break;
      case Fe:
        k(
          b,
          m,
          y,
          S,
          E,
          C,
          z,
          B,
          R
        );
        break;
      default:
        j & 1 ? x(
          b,
          m,
          y,
          S,
          E,
          C,
          z,
          B,
          R
        ) : j & 6 ? J(
          b,
          m,
          y,
          S,
          E,
          C,
          z,
          B,
          R
        ) : (j & 64 || j & 128) && D.process(
          b,
          m,
          y,
          S,
          E,
          C,
          z,
          B,
          R,
          Ft
        );
    }
    X != null && E && ur(X, b && b.ref, C, m || b, !m);
  }, O = (b, m, y, S) => {
    if (b == null)
      u(
        m.el = s(m.children),
        y,
        S
      );
    else {
      const E = m.el = b.el;
      m.children !== b.children && c(E, m.children);
    }
  }, P = (b, m, y, S) => {
    b == null ? u(
      m.el = a(m.children || ""),
      y,
      S
    ) : m.el = b.el;
  }, A = (b, m, y, S) => {
    [b.el, b.anchor] = p(
      b.children,
      m,
      y,
      S,
      b.el,
      b.anchor
    );
  }, T = ({ el: b, anchor: m }, y, S) => {
    let E;
    for (; b && b !== m; )
      E = h(b), u(b, y, S), b = E;
    u(m, y, S);
  }, v = ({ el: b, anchor: m }) => {
    let y;
    for (; b && b !== m; )
      y = h(b), r(b), b = y;
    r(m);
  }, x = (b, m, y, S, E, C, z, B, R) => {
    m.type === "svg" ? z = "svg" : m.type === "math" && (z = "mathml"), b == null ? L(
      m,
      y,
      S,
      E,
      C,
      z,
      B,
      R
    ) : F(
      b,
      m,
      E,
      C,
      z,
      B,
      R
    );
  }, L = (b, m, y, S, E, C, z, B) => {
    let R, D;
    const { props: X, shapeFlag: j, transition: Z, dirs: ue } = b;
    if (R = b.el = i(
      b.type,
      C,
      X && X.is,
      X
    ), j & 8 ? l(R, b.children) : j & 16 && q(
      b.children,
      R,
      null,
      S,
      E,
      Yr(b, C),
      z,
      B
    ), ue && yn(b, null, S, "created"), ne(R, b, b.scopeId, z, S), X) {
      for (const ge in X)
        ge !== "value" && !au(ge) && o(R, ge, null, X[ge], C, S);
      "value" in X && o(R, "value", null, X.value, C), (D = X.onVnodeBeforeMount) && Nt(D, S, b);
    }
    ue && yn(b, null, S, "beforeMount");
    const ce = D0(E, Z);
    ce && Z.beforeEnter(R), u(R, m, y), ((D = X && X.onVnodeMounted) || ce || ue) && bt(() => {
      D && Nt(D, S, b), ce && Z.enter(R), ue && yn(b, null, S, "mounted");
    }, E);
  }, ne = (b, m, y, S, E) => {
    if (y && f(b, y), S)
      for (let C = 0; C < S.length; C++)
        f(b, S[C]);
    if (E) {
      let C = E.subTree;
      if (m === C || Ma(C.type) && (C.ssContent === m || C.ssFallback === m)) {
        const z = E.vnode;
        ne(
          b,
          z,
          z.scopeId,
          z.slotScopeIds,
          E.parent
        );
      }
    }
  }, q = (b, m, y, S, E, C, z, B, R = 0) => {
    for (let D = R; D < b.length; D++) {
      const X = b[D] = B ? an(b[D]) : Bt(b[D]);
      _(
        null,
        X,
        m,
        y,
        S,
        E,
        C,
        z,
        B
      );
    }
  }, F = (b, m, y, S, E, C, z) => {
    const B = m.el = b.el;
    let { patchFlag: R, dynamicChildren: D, dirs: X } = m;
    R |= b.patchFlag & 16;
    const j = b.props || _e, Z = m.props || _e;
    let ue;
    if (y && wn(y, !1), (ue = Z.onVnodeBeforeUpdate) && Nt(ue, y, m, b), X && yn(m, b, y, "beforeUpdate"), y && wn(y, !0), (j.innerHTML && Z.innerHTML == null || j.textContent && Z.textContent == null) && l(B, ""), D ? te(
      b.dynamicChildren,
      D,
      B,
      y,
      S,
      Yr(m, E),
      C
    ) : z || ie(
      b,
      m,
      B,
      null,
      y,
      S,
      Yr(m, E),
      C,
      !1
    ), R > 0) {
      if (R & 16)
        I(B, j, Z, y, E);
      else if (R & 2 && j.class !== Z.class && o(B, "class", null, Z.class, E), R & 4 && o(B, "style", j.style, Z.style, E), R & 8) {
        const ce = m.dynamicProps;
        for (let ge = 0; ge < ce.length; ge++) {
          const be = ce[ge], ot = j[be], Qe = Z[be];
          (Qe !== ot || be === "value") && o(B, be, ot, Qe, E, y);
        }
      }
      R & 1 && b.children !== m.children && l(B, m.children);
    } else !z && D == null && I(B, j, Z, y, E);
    ((ue = Z.onVnodeUpdated) || X) && bt(() => {
      ue && Nt(ue, y, m, b), X && yn(m, b, y, "updated");
    }, S);
  }, te = (b, m, y, S, E, C, z) => {
    for (let B = 0; B < m.length; B++) {
      const R = b[B], D = m[B], X = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        R.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (R.type === Fe || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Pn(R, D) || // - In the case of a component, it could contain anything.
        R.shapeFlag & 70) ? d(R.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          y
        )
      );
      _(
        R,
        D,
        X,
        null,
        S,
        E,
        C,
        z,
        !0
      );
    }
  }, I = (b, m, y, S, E) => {
    if (m !== y) {
      if (m !== _e)
        for (const C in m)
          !au(C) && !(C in y) && o(
            b,
            C,
            m[C],
            null,
            E,
            S
          );
      for (const C in y) {
        if (au(C)) continue;
        const z = y[C], B = m[C];
        z !== B && C !== "value" && o(b, C, B, z, E, S);
      }
      "value" in y && o(b, "value", m.value, y.value, E);
    }
  }, k = (b, m, y, S, E, C, z, B, R) => {
    const D = m.el = b ? b.el : s(""), X = m.anchor = b ? b.anchor : s("");
    let { patchFlag: j, dynamicChildren: Z, slotScopeIds: ue } = m;
    ue && (B = B ? B.concat(ue) : ue), b == null ? (u(D, y, S), u(X, y, S), q(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      m.children || [],
      y,
      X,
      E,
      C,
      z,
      B,
      R
    )) : j > 0 && j & 64 && Z && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    b.dynamicChildren ? (te(
      b.dynamicChildren,
      Z,
      y,
      E,
      C,
      z,
      B
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (m.key != null || E && m === E.subTree) && Aa(
      b,
      m,
      !0
      /* shallow */
    )) : ie(
      b,
      m,
      y,
      X,
      E,
      C,
      z,
      B,
      R
    );
  }, J = (b, m, y, S, E, C, z, B, R) => {
    m.slotScopeIds = B, b == null ? m.shapeFlag & 512 ? E.ctx.activate(
      m,
      y,
      S,
      z,
      R
    ) : he(
      m,
      y,
      S,
      E,
      C,
      z,
      R
    ) : Te(b, m, R);
  }, he = (b, m, y, S, E, C, z) => {
    const B = b.component = V0(
      b,
      S,
      E
    );
    if (c0(b) && (B.ctx.renderer = Ft), K0(B, !1, z), B.asyncDep) {
      if (E && E.registerDep(B, Me, z), !b.el) {
        const R = B.subTree = ee(jt);
        P(null, R, m, y);
      }
    } else
      Me(
        B,
        b,
        m,
        y,
        E,
        C,
        z
      );
  }, Te = (b, m, y) => {
    const S = m.component = b.component;
    if (P0(b, m, y))
      if (S.asyncDep && !S.asyncResolved) {
        xe(S, m, y);
        return;
      } else
        S.next = m, S.update();
    else
      m.el = b.el, S.vnode = m;
  }, Me = (b, m, y, S, E, C, z) => {
    const B = () => {
      if (b.isMounted) {
        let { next: j, bu: Z, u: ue, parent: ce, vnode: ge } = b;
        {
          const xt = Sa(b);
          if (xt) {
            j && (j.el = ge.el, xe(b, j, z)), xt.asyncDep.then(() => {
              b.isUnmounted || B();
            });
            return;
          }
        }
        let be = j, ot;
        wn(b, !1), j ? (j.el = ge.el, xe(b, j, z)) : j = ge, Z && Ku(Z), (ot = j.props && j.props.onVnodeBeforeUpdate) && Nt(ot, ce, j, ge), wn(b, !0);
        const Qe = Oi(b), _t = b.subTree;
        b.subTree = Qe, _(
          _t,
          Qe,
          // parent may have changed if it's in a teleport
          d(_t.el),
          // anchor may have changed if it's in a fragment
          Fn(_t),
          b,
          E,
          C
        ), j.el = Qe.el, be === null && $0(b, Qe.el), ue && bt(ue, E), (ot = j.props && j.props.onVnodeUpdated) && bt(
          () => Nt(ot, ce, j, ge),
          E
        );
      } else {
        let j;
        const { el: Z, props: ue } = m, { bm: ce, m: ge, parent: be, root: ot, type: Qe } = b, _t = Gn(m);
        wn(b, !1), ce && Ku(ce), !_t && (j = ue && ue.onVnodeBeforeMount) && Nt(j, be, m), wn(b, !0);
        {
          ot.ce && ot.ce._injectChildStyle(Qe);
          const xt = b.subTree = Oi(b);
          _(
            null,
            xt,
            y,
            S,
            b,
            E,
            C
          ), m.el = xt.el;
        }
        if (ge && bt(ge, E), !_t && (j = ue && ue.onVnodeMounted)) {
          const xt = m;
          bt(
            () => Nt(j, be, xt),
            E
          );
        }
        (m.shapeFlag & 256 || be && Gn(be.vnode) && be.vnode.shapeFlag & 256) && b.a && bt(b.a, E), b.isMounted = !0, m = y = S = null;
      }
    };
    b.scope.on();
    const R = b.effect = new Gs(B);
    b.scope.off();
    const D = b.update = R.run.bind(R), X = b.job = R.runIfDirty.bind(R);
    X.i = b, X.id = b.uid, R.scheduler = () => qo(X), wn(b, !0), D();
  }, xe = (b, m, y) => {
    m.component = b;
    const S = b.vnode.props;
    b.vnode = m, b.next = null, w0(b, m.props, S, y), C0(b, m.children, y), hn(), Ti(b), pn();
  }, ie = (b, m, y, S, E, C, z, B, R = !1) => {
    const D = b && b.children, X = b ? b.shapeFlag : 0, j = m.children, { patchFlag: Z, shapeFlag: ue } = m;
    if (Z > 0) {
      if (Z & 128) {
        Ye(
          D,
          j,
          y,
          S,
          E,
          C,
          z,
          B,
          R
        );
        return;
      } else if (Z & 256) {
        $e(
          D,
          j,
          y,
          S,
          E,
          C,
          z,
          B,
          R
        );
        return;
      }
    }
    ue & 8 ? (X & 16 && mn(D, E, C), j !== D && l(y, j)) : X & 16 ? ue & 16 ? Ye(
      D,
      j,
      y,
      S,
      E,
      C,
      z,
      B,
      R
    ) : mn(D, E, C, !0) : (X & 8 && l(y, ""), ue & 16 && q(
      j,
      y,
      S,
      E,
      C,
      z,
      B,
      R
    ));
  }, $e = (b, m, y, S, E, C, z, B, R) => {
    b = b || Hn, m = m || Hn;
    const D = b.length, X = m.length, j = Math.min(D, X);
    let Z;
    for (Z = 0; Z < j; Z++) {
      const ue = m[Z] = R ? an(m[Z]) : Bt(m[Z]);
      _(
        b[Z],
        ue,
        y,
        null,
        E,
        C,
        z,
        B,
        R
      );
    }
    D > X ? mn(
      b,
      E,
      C,
      !0,
      !1,
      j
    ) : q(
      m,
      y,
      S,
      E,
      C,
      z,
      B,
      R,
      j
    );
  }, Ye = (b, m, y, S, E, C, z, B, R) => {
    let D = 0;
    const X = m.length;
    let j = b.length - 1, Z = X - 1;
    for (; D <= j && D <= Z; ) {
      const ue = b[D], ce = m[D] = R ? an(m[D]) : Bt(m[D]);
      if (Pn(ue, ce))
        _(
          ue,
          ce,
          y,
          null,
          E,
          C,
          z,
          B,
          R
        );
      else
        break;
      D++;
    }
    for (; D <= j && D <= Z; ) {
      const ue = b[j], ce = m[Z] = R ? an(m[Z]) : Bt(m[Z]);
      if (Pn(ue, ce))
        _(
          ue,
          ce,
          y,
          null,
          E,
          C,
          z,
          B,
          R
        );
      else
        break;
      j--, Z--;
    }
    if (D > j) {
      if (D <= Z) {
        const ue = Z + 1, ce = ue < X ? m[ue].el : S;
        for (; D <= Z; )
          _(
            null,
            m[D] = R ? an(m[D]) : Bt(m[D]),
            y,
            ce,
            E,
            C,
            z,
            B,
            R
          ), D++;
      }
    } else if (D > Z)
      for (; D <= j; )
        He(b[D], E, C, !0), D++;
    else {
      const ue = D, ce = D, ge = /* @__PURE__ */ new Map();
      for (D = ce; D <= Z; D++) {
        const it = m[D] = R ? an(m[D]) : Bt(m[D]);
        it.key != null && ge.set(it.key, D);
      }
      let be, ot = 0;
      const Qe = Z - ce + 1;
      let _t = !1, xt = 0;
      const _n = new Array(Qe);
      for (D = 0; D < Qe; D++) _n[D] = 0;
      for (D = ue; D <= j; D++) {
        const it = b[D];
        if (ot >= Qe) {
          He(it, E, C, !0);
          continue;
        }
        let yt;
        if (it.key != null)
          yt = ge.get(it.key);
        else
          for (be = ce; be <= Z; be++)
            if (_n[be - ce] === 0 && Pn(it, m[be])) {
              yt = be;
              break;
            }
        yt === void 0 ? He(it, E, C, !0) : (_n[yt - ce] = D + 1, yt >= xt ? xt = yt : _t = !0, _(
          it,
          m[yt],
          y,
          null,
          E,
          C,
          z,
          B,
          R
        ), ot++);
      }
      const nu = _t ? T0(_n) : Hn;
      for (be = nu.length - 1, D = Qe - 1; D >= 0; D--) {
        const it = ce + D, yt = m[it], Iu = it + 1 < X ? m[it + 1].el : S;
        _n[D] === 0 ? _(
          null,
          yt,
          y,
          Iu,
          E,
          C,
          z,
          B,
          R
        ) : _t && (be < 0 || D !== nu[be] ? Xe(yt, y, Iu, 2) : be--);
      }
    }
  }, Xe = (b, m, y, S, E = null) => {
    const { el: C, type: z, transition: B, children: R, shapeFlag: D } = b;
    if (D & 6) {
      Xe(b.component.subTree, m, y, S);
      return;
    }
    if (D & 128) {
      b.suspense.move(m, y, S);
      return;
    }
    if (D & 64) {
      z.move(b, m, y, Ft);
      return;
    }
    if (z === Fe) {
      u(C, m, y);
      for (let j = 0; j < R.length; j++)
        Xe(R[j], m, y, S);
      u(b.anchor, m, y);
      return;
    }
    if (z === Zu) {
      T(b, m, y);
      return;
    }
    if (S !== 2 && D & 1 && B)
      if (S === 0)
        B.beforeEnter(C), u(C, m, y), bt(() => B.enter(C), E);
      else {
        const { leave: j, delayLeave: Z, afterLeave: ue } = B, ce = () => {
          b.ctx.isUnmounted ? r(C) : u(C, m, y);
        }, ge = () => {
          j(C, () => {
            ce(), ue && ue();
          });
        };
        Z ? Z(C, ce, ge) : ge();
      }
    else
      u(C, m, y);
  }, He = (b, m, y, S = !1, E = !1) => {
    const {
      type: C,
      props: z,
      ref: B,
      children: R,
      dynamicChildren: D,
      shapeFlag: X,
      patchFlag: j,
      dirs: Z,
      cacheIndex: ue
    } = b;
    if (j === -2 && (E = !1), B != null && (hn(), ur(B, null, y, b, !0), pn()), ue != null && (m.renderCache[ue] = void 0), X & 256) {
      m.ctx.deactivate(b);
      return;
    }
    const ce = X & 1 && Z, ge = !Gn(b);
    let be;
    if (ge && (be = z && z.onVnodeBeforeUnmount) && Nt(be, m, b), X & 6)
      Lr(b.component, y, S);
    else {
      if (X & 128) {
        b.suspense.unmount(y, S);
        return;
      }
      ce && yn(b, null, m, "beforeUnmount"), X & 64 ? b.type.remove(
        b,
        m,
        y,
        Ft,
        S
      ) : D && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !D.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (C !== Fe || j > 0 && j & 64) ? mn(
        D,
        m,
        y,
        !1,
        !0
      ) : (C === Fe && j & 384 || !E && X & 16) && mn(R, m, y), S && Mt(b);
    }
    (ge && (be = z && z.onVnodeUnmounted) || ce) && bt(() => {
      be && Nt(be, m, b), ce && yn(b, null, m, "unmounted");
    }, y);
  }, Mt = (b) => {
    const { type: m, el: y, anchor: S, transition: E } = b;
    if (m === Fe) {
      Or(y, S);
      return;
    }
    if (m === Zu) {
      v(b);
      return;
    }
    const C = () => {
      r(y), E && !E.persisted && E.afterLeave && E.afterLeave();
    };
    if (b.shapeFlag & 1 && E && !E.persisted) {
      const { leave: z, delayLeave: B } = E, R = () => z(y, C);
      B ? B(b.el, C, R) : R();
    } else
      C();
  }, Or = (b, m) => {
    let y;
    for (; b !== m; )
      y = h(b), r(b), b = y;
    r(m);
  }, Lr = (b, m, y) => {
    const {
      bum: S,
      scope: E,
      job: C,
      subTree: z,
      um: B,
      m: R,
      a: D,
      parent: X,
      slots: { __: j }
    } = b;
    Ni(R), Ni(D), S && Ku(S), X && oe(j) && j.forEach((Z) => {
      X.renderCache[Z] = void 0;
    }), E.stop(), C && (C.flags |= 8, He(z, b, m, y)), B && bt(B, m), bt(() => {
      b.isUnmounted = !0;
    }, m), m && m.pendingBranch && !m.isUnmounted && b.asyncDep && !b.asyncResolved && b.suspenseId === m.pendingId && (m.deps--, m.deps === 0 && m.resolve());
  }, mn = (b, m, y, S = !1, E = !1, C = 0) => {
    for (let z = C; z < b.length; z++)
      He(b[z], m, y, S, E);
  }, Fn = (b) => {
    if (b.shapeFlag & 6)
      return Fn(b.component.subTree);
    if (b.shapeFlag & 128)
      return b.suspense.next();
    const m = h(b.anchor || b.el), y = m && m[u0];
    return y ? h(y) : m;
  };
  let tu = !1;
  const Br = (b, m, y) => {
    b == null ? m._vnode && He(m._vnode, null, null, !0) : _(
      m._vnode || null,
      b,
      m,
      null,
      null,
      null,
      y
    ), m._vnode = b, tu || (tu = !0, Ti(), da(), tu = !1);
  }, Ft = {
    p: _,
    um: He,
    m: Xe,
    r: Mt,
    mt: he,
    mc: q,
    pc: ie,
    pbc: te,
    n: Fn,
    o: e
  };
  return {
    render: Br,
    hydrate: void 0,
    createApp: _0(Br)
  };
}
function Yr({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function wn({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function D0(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Aa(e, t, n = !1) {
  const u = e.children, r = t.children;
  if (oe(u) && oe(r))
    for (let o = 0; o < u.length; o++) {
      const i = u[o];
      let s = r[o];
      s.shapeFlag & 1 && !s.dynamicChildren && ((s.patchFlag <= 0 || s.patchFlag === 32) && (s = r[o] = an(r[o]), s.el = i.el), !n && s.patchFlag !== -2 && Aa(i, s)), s.type === Er && (s.el = i.el), s.type === jt && !s.el && (s.el = i.el);
    }
}
function T0(e) {
  const t = e.slice(), n = [0];
  let u, r, o, i, s;
  const a = e.length;
  for (u = 0; u < a; u++) {
    const c = e[u];
    if (c !== 0) {
      if (r = n[n.length - 1], e[r] < c) {
        t[u] = r, n.push(u);
        continue;
      }
      for (o = 0, i = n.length - 1; o < i; )
        s = o + i >> 1, e[n[s]] < c ? o = s + 1 : i = s;
      c < e[n[o]] && (o > 0 && (t[u] = n[o - 1]), n[o] = u);
    }
  }
  for (o = n.length, i = n[o - 1]; o-- > 0; )
    n[o] = i, i = t[i];
  return n;
}
function Sa(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Sa(t);
}
function Ni(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const M0 = Symbol.for("v-scx"), F0 = () => Vo(M0);
function I0(e, t) {
  return Da(
    e,
    null,
    { flush: "sync" }
  );
}
function kt(e, t, n) {
  return Da(e, t, n);
}
function Da(e, t, n = _e) {
  const { immediate: u, deep: r, flush: o, once: i } = n, s = Ze({}, n), a = t && u || !t && o !== "post";
  let c;
  if (yu) {
    if (o === "sync") {
      const f = F0();
      c = f.__watcherHandles || (f.__watcherHandles = []);
    } else if (!a) {
      const f = () => {
      };
      return f.stop = Cn, f.resume = Cn, f.pause = Cn, f;
    }
  }
  const l = ut;
  s.call = (f, p, _) => zt(f, l, p, _);
  let d = !1;
  o === "post" ? s.scheduler = (f) => {
    bt(f, l && l.suspense);
  } : o !== "sync" && (d = !0, s.scheduler = (f, p) => {
    p ? f() : qo(f);
  }), s.augmentJob = (f) => {
    t && (f.flags |= 4), d && (f.flags |= 2, l && (f.id = l.uid, f.i = l));
  };
  const h = Xl(e, t, s);
  return yu && (c ? c.push(h) : a && h()), h;
}
function R0(e, t, n = _e) {
  const u = Na(), r = rt(t), o = dt(t), i = Ta(e, r), s = Gl((a, c) => {
    let l, d = _e, h;
    return I0(() => {
      const f = e[r];
      lt(l, f) && (l = f, c());
    }), {
      get() {
        return a(), n.get ? n.get(l) : l;
      },
      set(f) {
        const p = n.set ? n.set(f) : f;
        if (!lt(p, l) && !(d !== _e && lt(f, d)))
          return;
        const _ = u.vnode.props;
        _ && // check if parent has passed v-model
        (t in _ || r in _ || o in _) && (`onUpdate:${t}` in _ || `onUpdate:${r}` in _ || `onUpdate:${o}` in _) || (l = f, c()), u.emit(`update:${t}`, p), lt(f, p) && lt(f, d) && !lt(p, h) && c(), d = f, h = p;
      }
    };
  });
  return s[Symbol.iterator] = () => {
    let a = 0;
    return {
      next() {
        return a < 2 ? { value: a++ ? i || _e : s, done: !1 } : { done: !0 };
      }
    };
  }, s;
}
const Ta = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${rt(t)}Modifiers`] || e[`${dt(t)}Modifiers`];
function N0(e, t, ...n) {
  if (e.isUnmounted) return;
  const u = e.vnode.props || _e;
  let r = n;
  const o = t.startsWith("update:"), i = o && Ta(u, t.slice(7));
  i && (i.trim && (r = n.map((l) => Pe(l) ? l.trim() : l)), i.number && (r = n.map(po)));
  let s, a = u[s = Gr(t)] || // also try camelCase event handler (#2249)
  u[s = Gr(rt(t))];
  !a && o && (a = u[s = Gr(dt(t))]), a && zt(
    a,
    e,
    6,
    r
  );
  const c = u[s + "Once"];
  if (c) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[s])
      return;
    e.emitted[s] = !0, zt(
      c,
      e,
      6,
      r
    );
  }
}
function O0(e, t, n = !1) {
  const u = t.emitsCache, r = u.get(e);
  if (r !== void 0)
    return r;
  const o = e.emits;
  let i = {};
  return o ? (oe(o) ? o.forEach((s) => i[s] = null) : Ze(i, o), Le(e) && u.set(e, i), i) : (Le(e) && u.set(e, null), null);
}
function kr(e, t) {
  return !e || !hr(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), me(e, t[0].toLowerCase() + t.slice(1)) || me(e, dt(t)) || me(e, t));
}
function Oi(e) {
  const {
    type: t,
    vnode: n,
    proxy: u,
    withProxy: r,
    propsOptions: [o],
    slots: i,
    attrs: s,
    emit: a,
    render: c,
    renderCache: l,
    props: d,
    data: h,
    setupState: f,
    ctx: p,
    inheritAttrs: _
  } = e, O = nr(e);
  let P, A;
  try {
    if (n.shapeFlag & 4) {
      const v = r || u, x = v;
      P = Bt(
        c.call(
          x,
          v,
          l,
          d,
          f,
          h,
          p
        )
      ), A = s;
    } else {
      const v = t;
      P = Bt(
        v.length > 1 ? v(
          d,
          { attrs: s, slots: i, emit: a }
        ) : v(
          d,
          null
        )
      ), A = t.props ? s : L0(s);
    }
  } catch (v) {
    fu.length = 0, wr(v, e, 1), P = ee(jt);
  }
  let T = P;
  if (A && _ !== !1) {
    const v = Object.keys(A), { shapeFlag: x } = T;
    v.length && x & 7 && (o && v.some(No) && (A = B0(
      A,
      o
    )), T = Dn(T, A, !1, !0));
  }
  return n.dirs && (T = Dn(T, null, !1, !0), T.dirs = T.dirs ? T.dirs.concat(n.dirs) : n.dirs), n.transition && _u(T, n.transition), P = T, nr(O), P;
}
const L0 = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || hr(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, B0 = (e, t) => {
  const n = {};
  for (const u in e)
    (!No(u) || !(u.slice(9) in t)) && (n[u] = e[u]);
  return n;
};
function P0(e, t, n) {
  const { props: u, children: r, component: o } = e, { props: i, children: s, patchFlag: a } = t, c = o.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && a >= 0) {
    if (a & 1024)
      return !0;
    if (a & 16)
      return u ? Li(u, i, c) : !!i;
    if (a & 8) {
      const l = t.dynamicProps;
      for (let d = 0; d < l.length; d++) {
        const h = l[d];
        if (i[h] !== u[h] && !kr(c, h))
          return !0;
      }
    }
  } else
    return (r || s) && (!s || !s.$stable) ? !0 : u === i ? !1 : u ? i ? Li(u, i, c) : !0 : !!i;
  return !1;
}
function Li(e, t, n) {
  const u = Object.keys(t);
  if (u.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < u.length; r++) {
    const o = u[r];
    if (t[o] !== e[o] && !kr(n, o))
      return !0;
  }
  return !1;
}
function $0({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const u = t.subTree;
    if (u.suspense && u.suspense.activeBranch === e && (u.el = e.el), u === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const Ma = (e) => e.__isSuspense;
function z0(e, t) {
  t && t.pendingBranch ? oe(e) ? t.effects.push(...e) : t.effects.push(e) : t0(e);
}
const Fe = Symbol.for("v-fgt"), Er = Symbol.for("v-txt"), jt = Symbol.for("v-cmt"), Zu = Symbol.for("v-stc"), fu = [];
let gt = null;
function N(e = !1) {
  fu.push(gt = e ? null : []);
}
function j0() {
  fu.pop(), gt = fu[fu.length - 1] || null;
}
let xu = 1;
function Bi(e, t = !1) {
  xu += e, e < 0 && gt && t && (gt.hasOnce = !0);
}
function Fa(e) {
  return e.dynamicChildren = xu > 0 ? gt || Hn : null, j0(), xu > 0 && gt && gt.push(e), e;
}
function K(e, t, n, u, r, o) {
  return Fa(
    U(
      e,
      t,
      n,
      u,
      r,
      o,
      !0
    )
  );
}
function We(e, t, n, u, r) {
  return Fa(
    ee(
      e,
      t,
      n,
      u,
      r,
      !0
    )
  );
}
function Wo(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Pn(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Ia = ({ key: e }) => e ?? null, Wu = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? Pe(e) || Re(e) || we(e) ? { i: je, r: e, k: t, f: !!n } : e : null);
function U(e, t = null, n = null, u = 0, r = null, o = e === Fe ? 0 : 1, i = !1, s = !1) {
  const a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Ia(t),
    ref: t && Wu(t),
    scopeId: ha,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: o,
    patchFlag: u,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: je
  };
  return s ? (Yo(a, n), o & 128 && e.normalize(a)) : n && (a.shapeFlag |= Pe(n) ? 8 : 16), xu > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  gt && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (a.patchFlag > 0 || o & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  a.patchFlag !== 32 && gt.push(a), a;
}
const ee = H0;
function H0(e, t = null, n = null, u = 0, r = null, o = !1) {
  if ((!e || e === ba) && (e = jt), Wo(e)) {
    const s = Dn(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && Yo(s, n), xu > 0 && !o && gt && (s.shapeFlag & 6 ? gt[gt.indexOf(e)] = s : gt.push(s)), s.patchFlag = -2, s;
  }
  if (X0(e) && (e = e.__vccOpts), t) {
    t = U0(t);
    let { class: s, style: a } = t;
    s && !Pe(s) && (t.class = en(s)), Le(a) && (Uo(a) && !oe(a) && (a = Ze({}, a)), t.style = Lo(a));
  }
  const i = Pe(e) ? 1 : Ma(e) ? 128 : r0(e) ? 64 : Le(e) ? 4 : we(e) ? 2 : 0;
  return U(
    e,
    t,
    n,
    u,
    r,
    i,
    o,
    !0
  );
}
function U0(e) {
  return e ? Uo(e) || wa(e) ? Ze({}, e) : e : null;
}
function Dn(e, t, n = !1, u = !1) {
  const { props: r, ref: o, patchFlag: i, children: s, transition: a } = e, c = t ? Ra(r || {}, t) : r, l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: c,
    key: c && Ia(c),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && o ? oe(o) ? o.concat(Wu(t)) : [o, Wu(t)] : Wu(t)
    ) : o,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: s,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== Fe ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: a,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Dn(e.ssContent),
    ssFallback: e.ssFallback && Dn(e.ssFallback),
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return a && u && _u(
    l,
    a.clone(l)
  ), l;
}
function Xn(e = " ", t = 0) {
  return ee(Er, null, e, t);
}
function Jo(e, t) {
  const n = ee(Zu, null, e);
  return n.staticCount = t, n;
}
function Ie(e = "", t = !1) {
  return t ? (N(), We(jt, null, e)) : ee(jt, null, e);
}
function Bt(e) {
  return e == null || typeof e == "boolean" ? ee(jt) : oe(e) ? ee(
    Fe,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Wo(e) ? an(e) : ee(Er, null, String(e));
}
function an(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Dn(e);
}
function Yo(e, t) {
  let n = 0;
  const { shapeFlag: u } = e;
  if (t == null)
    t = null;
  else if (oe(t))
    n = 16;
  else if (typeof t == "object")
    if (u & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), Yo(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !wa(t) ? t._ctx = je : r === 3 && je && (je.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else we(t) ? (t = { default: t, _ctx: je }, n = 32) : (t = String(t), u & 64 ? (n = 16, t = [Xn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Ra(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const u = e[n];
    for (const r in u)
      if (r === "class")
        t.class !== u.class && (t.class = en([t.class, u.class]));
      else if (r === "style")
        t.style = Lo([t.style, u.style]);
      else if (hr(r)) {
        const o = t[r], i = u[r];
        i && o !== i && !(oe(o) && o.includes(i)) && (t[r] = o ? [].concat(o, i) : i);
      } else r !== "" && (t[r] = u[r]);
  }
  return t;
}
function Nt(e, t, n, u = null) {
  zt(e, t, 7, [
    n,
    u
  ]);
}
const q0 = ma();
let G0 = 0;
function V0(e, t, n) {
  const u = e.type, r = (t ? t.appContext : e.appContext) || q0, o = {
    uid: G0++,
    vnode: e,
    type: u,
    parent: t,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Hs(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(r.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: v0(u, r),
    emitsOptions: O0(u, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: _e,
    // inheritAttrs
    inheritAttrs: u.inheritAttrs,
    // state
    ctx: _e,
    data: _e,
    props: _e,
    attrs: _e,
    slots: _e,
    refs: _e,
    setupState: _e,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return o.ctx = { _: o }, o.root = t ? t.root : o, o.emit = N0.bind(null, o), e.ce && e.ce(o), o;
}
let ut = null;
const Na = () => ut || je;
let or, vo;
{
  const e = _r(), t = (n, u) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(u), (o) => {
      r.length > 1 ? r.forEach((i) => i(o)) : r[0](o);
    };
  };
  or = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ut = n
  ), vo = t(
    "__VUE_SSR_SETTERS__",
    (n) => yu = n
  );
}
const Xo = (e) => {
  const t = ut;
  return or(e), e.scope.on(), () => {
    e.scope.off(), or(t);
  };
}, Pi = () => {
  ut && ut.scope.off(), or(null);
};
function Oa(e) {
  return e.vnode.shapeFlag & 4;
}
let yu = !1;
function K0(e, t = !1, n = !1) {
  t && vo(t);
  const { props: u, children: r } = e.vnode, o = Oa(e);
  y0(e, u, o, t), E0(e, r, n || t);
  const i = o ? Z0(e, t) : void 0;
  return t && vo(!1), i;
}
function Z0(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, g0);
  const { setup: u } = n;
  if (u) {
    hn();
    const r = e.setupContext = u.length > 1 ? J0(e) : null, o = Xo(e), i = Cu(
      u,
      e,
      0,
      [
        e.props,
        r
      ]
    ), s = Ls(i);
    if (pn(), o(), (s || e.sp) && !Gn(e) && a0(e), s) {
      if (i.then(Pi, Pi), t)
        return i.then((a) => {
          $i(e, a);
        }).catch((a) => {
          wr(a, e, 0);
        });
      e.asyncDep = i;
    } else
      $i(e, i);
  } else
    La(e);
}
function $i(e, t, n) {
  we(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Le(t) && (e.setupState = ia(t)), La(e);
}
function La(e, t, n) {
  const u = e.type;
  e.render || (e.render = u.render || Cn);
}
const W0 = {
  get(e, t) {
    return nt(e, "get", ""), e[t];
  }
};
function J0(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, W0),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Cr(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(ia(ht(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in du)
        return du[n](e);
    },
    has(t, n) {
      return n in t || n in du;
    }
  })) : e.proxy;
}
function Y0(e, t = !0) {
  return we(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function X0(e) {
  return we(e) && "__vccOpts" in e;
}
const le = (e, t) => Jl(e, t, yu), Q0 = "3.5.14";
/**
* @vue/runtime-dom v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ko;
const zi = typeof window < "u" && window.trustedTypes;
if (zi)
  try {
    ko = /* @__PURE__ */ zi.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Ba = ko ? (e) => ko.createHTML(e) : (e) => e, ed = "http://www.w3.org/2000/svg", td = "http://www.w3.org/1998/Math/MathML", Kt = typeof document < "u" ? document : null, ji = Kt && /* @__PURE__ */ Kt.createElement("template"), nd = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, u) => {
    const r = t === "svg" ? Kt.createElementNS(ed, e) : t === "mathml" ? Kt.createElementNS(td, e) : n ? Kt.createElement(e, { is: n }) : Kt.createElement(e);
    return e === "select" && u && u.multiple != null && r.setAttribute("multiple", u.multiple), r;
  },
  createText: (e) => Kt.createTextNode(e),
  createComment: (e) => Kt.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Kt.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, u, r, o) {
    const i = n ? n.previousSibling : t.lastChild;
    if (r && (r === o || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), n), !(r === o || !(r = r.nextSibling)); )
        ;
    else {
      ji.innerHTML = Ba(
        u === "svg" ? `<svg>${e}</svg>` : u === "mathml" ? `<math>${e}</math>` : e
      );
      const s = ji.content;
      if (u === "svg" || u === "mathml") {
        const a = s.firstChild;
        for (; a.firstChild; )
          s.appendChild(a.firstChild);
        s.removeChild(a);
      }
      t.insertBefore(s, n);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, un = "transition", ou = "animation", Zn = Symbol("_vtc"), Pa = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: !0
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String
}, ud = /* @__PURE__ */ Ze(
  {},
  i0,
  Pa
), vn = (e, t = []) => {
  oe(e) ? e.forEach((n) => n(...t)) : e && e(...t);
}, Hi = (e) => e ? oe(e) ? e.some((t) => t.length > 1) : e.length > 1 : !1;
function rd(e) {
  const t = {};
  for (const k in e)
    k in Pa || (t[k] = e[k]);
  if (e.css === !1)
    return t;
  const {
    name: n = "v",
    type: u,
    duration: r,
    enterFromClass: o = `${n}-enter-from`,
    enterActiveClass: i = `${n}-enter-active`,
    enterToClass: s = `${n}-enter-to`,
    appearFromClass: a = o,
    appearActiveClass: c = i,
    appearToClass: l = s,
    leaveFromClass: d = `${n}-leave-from`,
    leaveActiveClass: h = `${n}-leave-active`,
    leaveToClass: f = `${n}-leave-to`
  } = e, p = od(r), _ = p && p[0], O = p && p[1], {
    onBeforeEnter: P,
    onEnter: A,
    onEnterCancelled: T,
    onLeave: v,
    onLeaveCancelled: x,
    onBeforeAppear: L = P,
    onAppear: ne = A,
    onAppearCancelled: q = T
  } = t, F = (k, J, he, Te) => {
    k._enterCancelled = Te, rn(k, J ? l : s), rn(k, J ? c : i), he && he();
  }, te = (k, J) => {
    k._isLeaving = !1, rn(k, d), rn(k, f), rn(k, h), J && J();
  }, I = (k) => (J, he) => {
    const Te = k ? ne : A, Me = () => F(J, k, he);
    vn(Te, [J, Me]), Ui(() => {
      rn(J, k ? a : o), Ot(J, k ? l : s), Hi(Te) || qi(J, u, _, Me);
    });
  };
  return Ze(t, {
    onBeforeEnter(k) {
      vn(P, [k]), Ot(k, o), Ot(k, i);
    },
    onBeforeAppear(k) {
      vn(L, [k]), Ot(k, a), Ot(k, c);
    },
    onEnter: I(!1),
    onAppear: I(!0),
    onLeave(k, J) {
      k._isLeaving = !0;
      const he = () => te(k, J);
      Ot(k, d), k._enterCancelled ? (Ot(k, h), Eo()) : (Eo(), Ot(k, h)), Ui(() => {
        k._isLeaving && (rn(k, d), Ot(k, f), Hi(v) || qi(k, u, O, he));
      }), vn(v, [k, he]);
    },
    onEnterCancelled(k) {
      F(k, !1, void 0, !0), vn(T, [k]);
    },
    onAppearCancelled(k) {
      F(k, !0, void 0, !0), vn(q, [k]);
    },
    onLeaveCancelled(k) {
      te(k), vn(x, [k]);
    }
  });
}
function od(e) {
  if (e == null)
    return null;
  if (Le(e))
    return [Xr(e.enter), Xr(e.leave)];
  {
    const t = Xr(e);
    return [t, t];
  }
}
function Xr(e) {
  return bo(e);
}
function Ot(e, t) {
  t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e[Zn] || (e[Zn] = /* @__PURE__ */ new Set())).add(t);
}
function rn(e, t) {
  t.split(/\s+/).forEach((u) => u && e.classList.remove(u));
  const n = e[Zn];
  n && (n.delete(t), n.size || (e[Zn] = void 0));
}
function Ui(e) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e);
  });
}
let id = 0;
function qi(e, t, n, u) {
  const r = e._endId = ++id, o = () => {
    r === e._endId && u();
  };
  if (n != null)
    return setTimeout(o, n);
  const { type: i, timeout: s, propCount: a } = $a(e, t);
  if (!i)
    return u();
  const c = i + "end";
  let l = 0;
  const d = () => {
    e.removeEventListener(c, h), o();
  }, h = (f) => {
    f.target === e && ++l >= a && d();
  };
  setTimeout(() => {
    l < a && d();
  }, s + 1), e.addEventListener(c, h);
}
function $a(e, t) {
  const n = window.getComputedStyle(e), u = (p) => (n[p] || "").split(", "), r = u(`${un}Delay`), o = u(`${un}Duration`), i = Gi(r, o), s = u(`${ou}Delay`), a = u(`${ou}Duration`), c = Gi(s, a);
  let l = null, d = 0, h = 0;
  t === un ? i > 0 && (l = un, d = i, h = o.length) : t === ou ? c > 0 && (l = ou, d = c, h = a.length) : (d = Math.max(i, c), l = d > 0 ? i > c ? un : ou : null, h = l ? l === un ? o.length : a.length : 0);
  const f = l === un && /\b(transform|all)(,|$)/.test(
    u(`${un}Property`).toString()
  );
  return {
    type: l,
    timeout: d,
    propCount: h,
    hasTransform: f
  };
}
function Gi(e, t) {
  for (; e.length < t.length; )
    e = e.concat(e);
  return Math.max(...t.map((n, u) => Vi(n) + Vi(e[u])));
}
function Vi(e) {
  return e === "auto" ? 0 : Number(e.slice(0, -1).replace(",", ".")) * 1e3;
}
function Eo() {
  return document.body.offsetHeight;
}
function sd(e, t, n) {
  const u = e[Zn];
  u && (t = (t ? [t, ...u] : [...u]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Ki = Symbol("_vod"), ad = Symbol("_vsh"), cd = Symbol(""), ld = /(^|;)\s*display\s*:/;
function dd(e, t, n) {
  const u = e.style, r = Pe(n);
  let o = !1;
  if (n && !r) {
    if (t)
      if (Pe(t))
        for (const i of t.split(";")) {
          const s = i.slice(0, i.indexOf(":")).trim();
          n[s] == null && Ju(u, s, "");
        }
      else
        for (const i in t)
          n[i] == null && Ju(u, i, "");
    for (const i in n)
      i === "display" && (o = !0), Ju(u, i, n[i]);
  } else if (r) {
    if (t !== n) {
      const i = u[cd];
      i && (n += ";" + i), u.cssText = n, o = ld.test(n);
    }
  } else t && e.removeAttribute("style");
  Ki in e && (e[Ki] = o ? u.display : "", e[ad] && (u.display = "none"));
}
const Zi = /\s*!important$/;
function Ju(e, t, n) {
  if (oe(n))
    n.forEach((u) => Ju(e, t, u));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const u = fd(e, t);
    Zi.test(n) ? e.setProperty(
      dt(u),
      n.replace(Zi, ""),
      "important"
    ) : e[u] = n;
  }
}
const Wi = ["Webkit", "Moz", "ms"], Qr = {};
function fd(e, t) {
  const n = Qr[t];
  if (n)
    return n;
  let u = rt(t);
  if (u !== "filter" && u in e)
    return Qr[t] = u;
  u = mr(u);
  for (let r = 0; r < Wi.length; r++) {
    const o = Wi[r] + u;
    if (o in e)
      return Qr[t] = o;
  }
  return t;
}
const Ji = "http://www.w3.org/1999/xlink";
function Yi(e, t, n, u, r, o = xl(t)) {
  u && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ji, t.slice(6, t.length)) : e.setAttributeNS(Ji, t, n) : n == null || o && !$s(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    o ? "" : Qt(n) ? String(n) : n
  );
}
function Xi(e, t, n, u, r) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Ba(n) : n);
    return;
  }
  const o = e.tagName;
  if (t === "value" && o !== "PROGRESS" && // custom elements may use _value internally
  !o.includes("-")) {
    const s = o === "OPTION" ? e.getAttribute("value") || "" : e.value, a = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (s !== a || !("_value" in e)) && (e.value = a), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const s = typeof e[t];
    s === "boolean" ? n = $s(n) : n == null && s === "string" ? (n = "", i = !0) : s === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  i && e.removeAttribute(r || t);
}
function $n(e, t, n, u) {
  e.addEventListener(t, n, u);
}
function hd(e, t, n, u) {
  e.removeEventListener(t, n, u);
}
const Qi = Symbol("_vei");
function pd(e, t, n, u, r = null) {
  const o = e[Qi] || (e[Qi] = {}), i = o[t];
  if (u && i)
    i.value = u;
  else {
    const [s, a] = bd(t);
    if (u) {
      const c = o[t] = _d(
        u,
        r
      );
      $n(e, s, c, a);
    } else i && (hd(e, s, i, a), o[t] = void 0);
  }
}
const es = /(?:Once|Passive|Capture)$/;
function bd(e) {
  let t;
  if (es.test(e)) {
    t = {};
    let u;
    for (; u = e.match(es); )
      e = e.slice(0, e.length - u[0].length), t[u[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : dt(e.slice(2)), t];
}
let eo = 0;
const gd = /* @__PURE__ */ Promise.resolve(), md = () => eo || (gd.then(() => eo = 0), eo = Date.now());
function _d(e, t) {
  const n = (u) => {
    if (!u._vts)
      u._vts = Date.now();
    else if (u._vts <= n.attached)
      return;
    zt(
      xd(u, n.value),
      t,
      5,
      [u]
    );
  };
  return n.value = e, n.attached = md(), n;
}
function xd(e, t) {
  if (oe(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (u) => (r) => !r._stopped && u && u(r)
    );
  } else
    return t;
}
const ts = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, yd = (e, t, n, u, r, o) => {
  const i = r === "svg";
  t === "class" ? sd(e, u, i) : t === "style" ? dd(e, n, u) : hr(t) ? No(t) || pd(e, t, n, u, o) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : wd(e, t, u, i)) ? (Xi(e, t, u), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Yi(e, t, u, i, o, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !Pe(u)) ? Xi(e, rt(t), u, o, t) : (t === "true-value" ? e._trueValue = u : t === "false-value" && (e._falseValue = u), Yi(e, t, u, i));
};
function wd(e, t, n, u) {
  if (u)
    return !!(t === "innerHTML" || t === "textContent" || t in e && ts(t) && we(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return ts(t) && Pe(n) ? !1 : t in e;
}
const ns = {};
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function za(e, t, n) {
  const u = /* @__PURE__ */ Se(e, t);
  br(u) && Ze(u, t);
  class r extends Qo {
    constructor(i) {
      super(u, i, n);
    }
  }
  return r.def = u, r;
}
const vd = typeof HTMLElement < "u" ? HTMLElement : class {
};
class Qo extends vd {
  constructor(t, n = {}, u = ss) {
    super(), this._def = t, this._props = n, this._createApp = u, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._ob = null, this.shadowRoot && u !== ss ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow({ mode: "open" }), this._root = this.shadowRoot) : this._root = this, this._def.__asyncLoader || this._resolveProps(this._def);
  }
  connectedCallback() {
    if (!this.isConnected) return;
    this.shadowRoot || this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && (t.parentNode || t.host); )
      if (t instanceof Qo) {
        this._parent = t;
        break;
      }
    this._instance || (this._resolved ? (this._setParent(), this._update()) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
      this._pendingResolve = void 0, this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && (this._instance.parent = t._instance, this._instance.provides = t._instance.provides);
  }
  disconnectedCallback() {
    this._connected = !1, Xt(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null);
    });
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let u = 0; u < this.attributes.length; u++)
      this._setAttr(this.attributes[u].name);
    this._ob = new MutationObserver((u) => {
      for (const r of u)
        this._setAttr(r.attributeName);
    }), this._ob.observe(this, { attributes: !0 });
    const t = (u, r = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: o, styles: i } = u;
      let s;
      if (o && !oe(o))
        for (const a in o) {
          const c = o[a];
          (c === Number || c && c.type === Number) && (a in this._props && (this._props[a] = bo(this._props[a])), (s || (s = /* @__PURE__ */ Object.create(null)))[rt(a)] = !0);
        }
      this._numberProps = s, r && this._resolveProps(u), this.shadowRoot && this._applyStyles(i), this._mount(u);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then(
      (u) => t(this._def = u, !0)
    ) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const u in n)
        me(this, u) || Object.defineProperty(this, u, {
          // unwrap ref to be consistent with public instance behavior
          get: () => G(n[u])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, u = oe(n) ? n : Object.keys(n || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && u.includes(r) && this._setProp(r, this[r]);
    for (const r of u.map(rt))
      Object.defineProperty(this, r, {
        get() {
          return this._getProp(r);
        },
        set(o) {
          this._setProp(r, o, !0, !0);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let u = n ? this.getAttribute(t) : ns;
    const r = rt(t);
    n && this._numberProps && this._numberProps[r] && (u = bo(u)), this._setProp(r, u, !1, !0);
  }
  /**
   * @internal
   */
  _getProp(t) {
    return this._props[t];
  }
  /**
   * @internal
   */
  _setProp(t, n, u = !0, r = !1) {
    if (n !== this._props[t] && (n === ns ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), r && this._instance && this._update(), u)) {
      const o = this._ob;
      o && o.disconnect(), n === !0 ? this.setAttribute(dt(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(dt(t), n + "") : n || this.removeAttribute(dt(t)), o && o.observe(this, { attributes: !0 });
    }
  }
  _update() {
    Bd(this._createVNode(), this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = ee(this._def, Ze(t, this._props));
    return this._instance || (n.ce = (u) => {
      this._instance = u, u.ce = this, u.isCE = !0;
      const r = (o, i) => {
        this.dispatchEvent(
          new CustomEvent(
            o,
            br(i[0]) ? Ze({ detail: i }, i[0]) : { detail: i }
          )
        );
      };
      u.emit = (o, ...i) => {
        r(o, i), dt(o) !== o && r(dt(o), i);
      }, this._setParent();
    }), n;
  }
  _applyStyles(t, n) {
    if (!t) return;
    if (n) {
      if (n === this._def || this._styleChildren.has(n))
        return;
      this._styleChildren.add(n);
    }
    const u = this._nonce;
    for (let r = t.length - 1; r >= 0; r--) {
      const o = document.createElement("style");
      u && o.setAttribute("nonce", u), o.textContent = t[r], this.shadowRoot.prepend(o);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let n;
    for (; n = this.firstChild; ) {
      const u = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (t[u] || (t[u] = [])).push(n), this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = (this._teleportTarget || this).querySelectorAll("slot"), n = this._instance.type.__scopeId;
    for (let u = 0; u < t.length; u++) {
      const r = t[u], o = r.getAttribute("name") || "default", i = this._slots[o], s = r.parentNode;
      if (i)
        for (const a of i) {
          if (n && a.nodeType === 1) {
            const c = n + "-s", l = document.createTreeWalker(a, 1);
            a.setAttribute(c, "");
            let d;
            for (; d = l.nextNode(); )
              d.setAttribute(c, "");
          }
          s.insertBefore(a, r);
        }
      else
        for (; r.firstChild; ) s.insertBefore(r.firstChild, r);
      s.removeChild(r);
    }
  }
  /**
   * @internal
   */
  _injectChildStyle(t) {
    this._applyStyles(t.styles, t);
  }
  /**
   * @internal
   */
  _removeChildStyle(t) {
  }
}
const ja = /* @__PURE__ */ new WeakMap(), Ha = /* @__PURE__ */ new WeakMap(), ir = Symbol("_moveCb"), us = Symbol("_enterCb"), kd = (e) => (delete e.props.mode, e), Ed = /* @__PURE__ */ kd({
  name: "TransitionGroup",
  props: /* @__PURE__ */ Ze({}, ud, {
    tag: String,
    moveClass: String
  }),
  setup(e, { slots: t }) {
    const n = Na(), u = o0();
    let r, o;
    return d0(() => {
      if (!r.length)
        return;
      const i = e.moveClass || `${e.name || "v"}-move`;
      if (!Td(
        r[0].el,
        n.vnode.el,
        i
      )) {
        r = [];
        return;
      }
      r.forEach(Ad), r.forEach(Sd);
      const s = r.filter(Dd);
      Eo(), s.forEach((a) => {
        const c = a.el, l = c.style;
        Ot(c, i), l.transform = l.webkitTransform = l.transitionDuration = "";
        const d = c[ir] = (h) => {
          h && h.target !== c || (!h || /transform$/.test(h.propertyName)) && (c.removeEventListener("transitionend", d), c[ir] = null, rn(c, i));
        };
        c.addEventListener("transitionend", d);
      }), r = [];
    }), () => {
      const i = pe(e), s = rd(i);
      let a = i.tag || Fe;
      if (r = [], o)
        for (let c = 0; c < o.length; c++) {
          const l = o[c];
          l.el && l.el instanceof Element && (r.push(l), _u(
            l,
            xo(
              l,
              s,
              u,
              n
            )
          ), ja.set(
            l,
            l.el.getBoundingClientRect()
          ));
        }
      o = t.default ? pa(t.default()) : [];
      for (let c = 0; c < o.length; c++) {
        const l = o[c];
        l.key != null && _u(
          l,
          xo(l, s, u, n)
        );
      }
      return ee(a, null, o);
    };
  }
}), Cd = Ed;
function Ad(e) {
  const t = e.el;
  t[ir] && t[ir](), t[us] && t[us]();
}
function Sd(e) {
  Ha.set(e, e.el.getBoundingClientRect());
}
function Dd(e) {
  const t = ja.get(e), n = Ha.get(e), u = t.left - n.left, r = t.top - n.top;
  if (u || r) {
    const o = e.el.style;
    return o.transform = o.webkitTransform = `translate(${u}px,${r}px)`, o.transitionDuration = "0s", e;
  }
}
function Td(e, t, n) {
  const u = e.cloneNode(), r = e[Zn];
  r && r.forEach((s) => {
    s.split(/\s+/).forEach((a) => a && u.classList.remove(a));
  }), n.split(/\s+/).forEach((s) => s && u.classList.add(s)), u.style.display = "none";
  const o = t.nodeType === 1 ? t : t.parentNode;
  o.appendChild(u);
  const { hasTransform: i } = $a(u);
  return o.removeChild(u), i;
}
const rs = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return oe(t) ? (n) => Ku(t, n) : t;
};
function Md(e) {
  e.target.composing = !0;
}
function os(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const to = Symbol("_assign"), Fd = {
  created(e, { modifiers: { lazy: t, trim: n, number: u } }, r) {
    e[to] = rs(r);
    const o = u || r.props && r.props.type === "number";
    $n(e, t ? "change" : "input", (i) => {
      if (i.target.composing) return;
      let s = e.value;
      n && (s = s.trim()), o && (s = po(s)), e[to](s);
    }), n && $n(e, "change", () => {
      e.value = e.value.trim();
    }), t || ($n(e, "compositionstart", Md), $n(e, "compositionend", os), $n(e, "change", os));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: u, trim: r, number: o } }, i) {
    if (e[to] = rs(i), e.composing) return;
    const s = (o || e.type === "number") && !/^0\d/.test(e.value) ? po(e.value) : e.value, a = t ?? "";
    s !== a && (document.activeElement === e && e.type !== "range" && (u && t === n || r && e.value.trim() === a) || (e.value = a));
  }
}, Id = ["ctrl", "shift", "alt", "meta"], Rd = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => Id.some((n) => e[`${n}Key`] && !t.includes(n))
}, Ar = (e, t) => {
  const n = e._withMods || (e._withMods = {}), u = t.join(".");
  return n[u] || (n[u] = (r, ...o) => {
    for (let i = 0; i < t.length; i++) {
      const s = Rd[t[i]];
      if (s && s(r, t)) return;
    }
    return e(r, ...o);
  });
}, Nd = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Od = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), u = t.join(".");
  return n[u] || (n[u] = (r) => {
    if (!("key" in r))
      return;
    const o = dt(r.key);
    if (t.some(
      (i) => i === o || Nd[i] === o
    ))
      return e(r);
  });
}, Ld = /* @__PURE__ */ Ze({ patchProp: yd }, nd);
let is;
function Ua() {
  return is || (is = A0(Ld));
}
const Bd = (...e) => {
  Ua().render(...e);
}, ss = (...e) => {
  const t = Ua().createApp(...e), { mount: n } = t;
  return t.mount = (u) => {
    const r = $d(u);
    if (!r) return;
    const o = t._component;
    !we(o) && !o.render && !o.template && (o.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const i = n(r, !1, Pd(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), i;
  }, t;
};
function Pd(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function $d(e) {
  return Pe(e) ? document.querySelector(e) : e;
}
/*!
 * pinia v3.0.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let qa;
const Au = (e) => qa = e, Ga = (
  /* istanbul ignore next */
  Symbol()
);
function Co(e) {
  return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var hu;
(function(e) {
  e.direct = "direct", e.patchObject = "patch object", e.patchFunction = "patch function";
})(hu || (hu = {}));
function zd() {
  const e = Us(!0), t = e.run(() => ve({}));
  let n = [], u = [];
  const r = ht({
    install(o) {
      Au(r), r._a = o, o.provide(Ga, r), o.config.globalProperties.$pinia = r, u.forEach((i) => n.push(i)), u = [];
    },
    use(o) {
      return this._a ? n.push(o) : u.push(o), this;
    },
    _p: n,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: e,
    _s: /* @__PURE__ */ new Map(),
    state: t
  });
  return r;
}
const Va = () => {
};
function as(e, t, n, u = Va) {
  e.push(t);
  const r = () => {
    const o = e.indexOf(t);
    o > -1 && (e.splice(o, 1), u());
  };
  return !n && qs() && yl(r), r;
}
function On(e, ...t) {
  e.slice().forEach((n) => {
    n(...t);
  });
}
const jd = (e) => e(), cs = Symbol(), no = Symbol();
function Ao(e, t) {
  e instanceof Map && t instanceof Map ? t.forEach((n, u) => e.set(u, n)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
  for (const n in t) {
    if (!t.hasOwnProperty(n))
      continue;
    const u = t[n], r = e[n];
    Co(r) && Co(u) && e.hasOwnProperty(n) && !Re(u) && !Jt(u) ? e[n] = Ao(r, u) : e[n] = u;
  }
  return e;
}
const Hd = (
  /* istanbul ignore next */
  Symbol()
);
function Ud(e) {
  return !Co(e) || !Object.prototype.hasOwnProperty.call(e, Hd);
}
const { assign: on } = Object;
function qd(e) {
  return !!(Re(e) && e.effect);
}
function Gd(e, t, n, u) {
  const { state: r, actions: o, getters: i } = t, s = n.state.value[e];
  let a;
  function c() {
    s || (n.state.value[e] = r ? r() : {});
    const l = Vl(n.state.value[e]);
    return on(l, o, Object.keys(i || {}).reduce((d, h) => (d[h] = ht(le(() => {
      Au(n);
      const f = n._s.get(e);
      return i[h].call(f, f);
    })), d), {}));
  }
  return a = Ka(e, c, t, n, u, !0), a;
}
function Ka(e, t, n = {}, u, r, o) {
  let i;
  const s = on({ actions: {} }, n), a = { deep: !0 };
  let c, l, d = [], h = [], f;
  const p = u.state.value[e];
  !o && !p && (u.state.value[e] = {}), ve({});
  let _;
  function O(q) {
    let F;
    c = l = !1, typeof q == "function" ? (q(u.state.value[e]), F = {
      type: hu.patchFunction,
      storeId: e,
      events: f
    }) : (Ao(u.state.value[e], q), F = {
      type: hu.patchObject,
      payload: q,
      storeId: e,
      events: f
    });
    const te = _ = Symbol();
    Xt().then(() => {
      _ === te && (c = !0);
    }), l = !0, On(d, F, u.state.value[e]);
  }
  const P = o ? function() {
    const { state: F } = n, te = F ? F() : {};
    this.$patch((I) => {
      on(I, te);
    });
  } : (
    /* istanbul ignore next */
    Va
  );
  function A() {
    i.stop(), d = [], h = [], u._s.delete(e);
  }
  const T = (q, F = "") => {
    if (cs in q)
      return q[no] = F, q;
    const te = function() {
      Au(u);
      const I = Array.from(arguments), k = [], J = [];
      function he(xe) {
        k.push(xe);
      }
      function Te(xe) {
        J.push(xe);
      }
      On(h, {
        args: I,
        name: te[no],
        store: x,
        after: he,
        onError: Te
      });
      let Me;
      try {
        Me = q.apply(this && this.$id === e ? this : x, I);
      } catch (xe) {
        throw On(J, xe), xe;
      }
      return Me instanceof Promise ? Me.then((xe) => (On(k, xe), xe)).catch((xe) => (On(J, xe), Promise.reject(xe))) : (On(k, Me), Me);
    };
    return te[cs] = !0, te[no] = F, te;
  }, v = {
    _p: u,
    // _s: scope,
    $id: e,
    $onAction: as.bind(null, h),
    $patch: O,
    $reset: P,
    $subscribe(q, F = {}) {
      const te = as(d, q, F.detached, () => I()), I = i.run(() => kt(() => u.state.value[e], (k) => {
        (F.flush === "sync" ? l : c) && q({
          storeId: e,
          type: hu.direct,
          events: f
        }, k);
      }, on({}, a, F)));
      return te;
    },
    $dispose: A
  }, x = jo(v);
  u._s.set(e, x);
  const ne = (u._a && u._a.runWithContext || jd)(() => u._e.run(() => (i = Us()).run(() => t({ action: T }))));
  for (const q in ne) {
    const F = ne[q];
    if (Re(F) && !qd(F) || Jt(F))
      o || (p && Ud(F) && (Re(F) ? F.value = p[q] : Ao(F, p[q])), u.state.value[e][q] = F);
    else if (typeof F == "function") {
      const te = T(F, q);
      ne[q] = te, s.actions[q] = F;
    }
  }
  return on(x, ne), on(pe(x), ne), Object.defineProperty(x, "$state", {
    get: () => u.state.value[e],
    set: (q) => {
      O((F) => {
        on(F, q);
      });
    }
  }), u._p.forEach((q) => {
    on(x, i.run(() => q({
      store: x,
      app: u._a,
      pinia: u,
      options: s
    })));
  }), p && o && n.hydrate && n.hydrate(x.$state, p), c = !0, l = !0, x;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function ei(e, t, n) {
  let u;
  const r = typeof t == "function";
  u = r ? n : t;
  function o(i, s) {
    const a = x0();
    return i = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    i || (a ? Vo(Ga, null) : null), i && Au(i), i = qa, i._s.has(e) || (r ? Ka(e, t, u, i) : Gd(e, u, i)), i._s.get(e);
  }
  return o.$id = e, o;
}
function Et(e) {
  const t = pe(e), n = {};
  for (const u in t) {
    const r = t[u];
    r.effect ? n[u] = // ...
    le({
      get: () => e[u],
      set(o) {
        e[u] = o;
      }
    }) : (Re(r) || Jt(r)) && (n[u] = // ---
    sa(e, u));
  }
  return n;
}
const Za = zd();
Au(Za);
function Vd(e) {
  e.use(Za);
}
function Wa(e) {
  Vd(e);
}
const fn = {
  LIGHT: "light",
  DARK: "dark"
}, ti = "appmixer-chat-theme";
function Ja(e) {
  return Object.values(fn).includes(e);
}
function Kd() {
  const e = localStorage.getItem(ti);
  return e && Ja(e) ? e : null;
}
const Qn = {
  DIALOG: "dialog",
  FULLSCREEN: "fullscreen"
}, Ya = /* @__PURE__ */ ei("widgetConfig", () => {
  const e = ve(Kd() ?? fn.LIGHT), t = ve(Qn.FULLSCREEN), n = ve(null);
  function u(s) {
    e.value = s;
  }
  function r(s) {
    t.value = s;
  }
  function o(s) {
    n.value = s;
  }
  function i() {
    n.value = null;
  }
  return kt(e, (s) => {
    localStorage.setItem(ti, s);
  }), {
    theme: e,
    widgetMode: t,
    jwt: n,
    setTheme: u,
    setWidgetMode: r,
    setJwt: o,
    clearJwt: i
  };
});
function Xa(e) {
  const t = Ya(), n = le(() => t.theme);
  kt(n, () => {
    var i;
    (i = e.value) == null || i.setAttribute("data-theme", n.value);
  }, { immediate: !0 });
  const r = (i) => {
    i.key === ti && i.newValue && Ja(i.newValue) && t.setTheme(i.newValue);
  };
  Tn(() => {
    window.addEventListener("storage", r);
  }), Go(() => {
    window.removeEventListener("storage", r);
  });
  function o() {
    const i = n.value === fn.LIGHT ? fn.DARK : fn.LIGHT;
    t.setTheme(i);
  }
  return {
    themeMode: n,
    toggle: o
  };
}
const St = {
  AGENT: "agent",
  USER: "user"
}, Wn = {
  IDLE: "idle"
};
Wn.IDLE + "";
const Sr = {
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right"
}, Zd = {
  viewBox: "0 0 18 18",
  width: "1.2em",
  height: "1.2em"
}, Wd = { fill: "none" }, Jd = ["clip-path"], Yd = ["id"];
function Xd(e, t) {
  return N(), K("svg", Zd, [
    U("g", Wd, [
      U("g", {
        "clip-path": "url(#" + e.idMap.clip0_4058_1987 + ")"
      }, t[0] || (t[0] = [
        Jo('<path d="M9 4.5V1.5H6" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 13.5L15 16.5V6C15 5.60218 14.842 5.22064 14.5607 4.93934C14.2794 4.65804 13.8978 4.5 13.5 4.5H4.5C4.10218 4.5 3.72064 4.65804 3.43934 4.93934C3.15804 5.22064 3 5.60218 3 6V12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H12Z" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.5 9H15" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.25 8.25V9.75" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.75 8.25V9.75" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 9H1.5" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path>', 6)
      ]), 8, Jd),
      U("defs", null, [
        U("clipPath", {
          id: e.idMap.clip0_4058_1987
        }, t[1] || (t[1] = [
          U("rect", {
            width: "18",
            height: "18",
            fill: "white",
            transform: "matrix(-1 0 0 1 18 0)"
          }, null, -1)
        ]), 8, Yd)
      ])
    ])
  ]);
}
const ni = ht({ name: "icons-chatbot-avatar", render: Xd, setup() {
  return { idMap: { clip0_4058_1987: "uicons-" + Math.random().toString(36).substr(2, 10) } };
} }), Qd = ["data-widget-position", "aria-label", "data-theme"], ef = /* @__PURE__ */ Se({
  name: "AmChatLauncher",
  inheritAttrs: !1,
  __name: "ChatLauncher.ce",
  emits: ["open"],
  setup(e, { emit: t }) {
    const n = t, u = le(() => i.value === fn.LIGHT ? "Go to dark mode" : "Go to light mode");
    function r() {
      n("open");
    }
    const o = ve(null), { themeMode: i, toggle: s } = Xa(o);
    return _a("theme", { themeMode: i, toggle: s }), (a, c) => (N(), K("button", {
      ref_key: "widgetLauncher",
      ref: o,
      class: "am-chat-launcher",
      "data-widget-position": G(Sr).BOTTOM_RIGHT,
      "aria-label": u.value,
      "data-theme": G(i),
      onClick: r
    }, [
      ee(G(ni), { class: "am-chat-launcher__icon" })
    ], 8, Qd));
  }
}), tf = ".am-chat-launcher{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--text-side-header: hsl(227, 6%, 53%);--text-side: hsl(232, 16%, 27%);--text-side-active: hsl(232, 16%, 27%);--text-side-bg-active: hsl(210, 6%, 86%);--text-thread: hsl(232, 16%, 27%);--bg-thread: hsl(0, 0%, 98%);--bg-side: hsl(240, 14%, 97%);--border-side: hsl(240, 3%, 88%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 100%, 70%);--color-secondary-btn: hsl(232, 16%, 27%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(240, 6%, 87%);--bg-input-panel: hsl(0, 0%, 100%);--text-input-panel: hsl(233, 7%, 47%);--text-header: hsl(230, 29%, 17%);--border-header: hsl(240, 3%, 88%);--color-chat-avatar-icon: hsl(231, 12%, 34%);--bg-chat-avatar-icon: hsl(210, 6%, 94%);--border-chat-avatar-icon: hsl(228, 6%, 83%);--color-message: hsl(232, 16%, 27%);--bg-message-user: hsl(240, 4%, 88%);--border-input: hsl(240, 6%, 90%);--color-tertiary-btn: hsl(233, 7%, 47%);--bg-tertiary-btn: hsl(0, 0%, 98%);--border-tertiary-btn: hsl(240, 3%, 88%);--bg-tertiary-hover-btn: hsl(0, 0%, 96%);--bg-tertiary-active-btn: hsl(0, 0%, 94%);--border-tertiary-hover-btn: hsl(240, 3%, 80%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 93.3%);--skeleton-highlight: hsla(0, 0%, 100%, .6);--bg-table-header: hsl(210, 6%, 94%);--code-bg: hsl(0, 0%, 93.3%);--code-color: hsl(0, 0%, 20%);position:fixed;right:1.75rem;bottom:1.75rem;display:flex;justify-content:center;align-items:center;width:3rem;height:3rem;border:none;border-radius:50%;background-color:var(--bg-launcher-btn);box-shadow:0 4px 12px #0003;color:var(--color-launcher-btn);transition:background-color .2s ease;cursor:pointer}.am-chat-launcher[data-theme=dark]{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--text-side-header: hsl(0, 0%, 63%);--text-side: hsl(0, 0%, 90%);--text-side-active: hsl(0, 0%, 90%);--text-side-bg-active: hsl(0, 0%, 14%);--text-thread: hsl(0, 0%, 90%);--bg-thread: hsl(0, 0%, 18%);--bg-side: hsl(240, 4%, 17%);--border-side: hsl(0, 0%, 30%);--color-secondary-btn: hsl(0, 0%, 90%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(0, 0%, 26%);--bg-primary-btn: hsl(223, 100%, 70%);--bg-primary-btn-hover: hsl(223, 92%, 56%);--bg-input-panel: hsl(0, 0%, 16%);--text-input-panel: hsl(0, 0%, 70%);--text-header: hsl(0, 0%, 100%);--border-header: hsl(0, 0%, 30%);--color-chat-avatar-icon: hsl(0, 0%, 76%);--bg-chat-avatar-icon: hsl(0, 0%, 23%);--border-chat-avatar-icon: hsl(0, 0%, 33%);--color-message: hsl(0, 0%, 90%);--bg-message-user: hsl(0, 0%, 14%);--border-input: hsl(0, 0%, 21%);--color-tertiary-btn: hsl(0, 0%, 70%);--bg-tertiary-btn: hsl(0, 0%, 18%);--border-tertiary-btn: hsl(0, 0%, 30%);--bg-tertiary-hover-btn: hsl(0, 0%, 16%);--bg-tertiary-active-btn: hsl(0, 0%, 14%);--border-tertiary-hover-btn: hsl(0, 0%, 20%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 16.5%);--skeleton-highlight: hsla(0, 0%, 100%, .1);--bg-table-header: hsl(0, 0%, 23%);--code-bg: hsl(0, 0%, 26.5%);--code-color: hsl(0, 0%, 90%)}.am-chat-launcher:hover{background-color:var(--bg-launcher-btn-hover)}.am-chat-launcher__icon{width:1.5rem;height:1.5rem}.am-chat-launcher[data-widget-position=bottom-left]{right:auto;left:1.75rem}", De = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [u, r] of t)
    n[u] = r;
  return n;
}, nf = /* @__PURE__ */ De(ef, [["styles", [tf]]]), ui = /* @__PURE__ */ za(nf), uf = ui.prototype.connectedCallback;
ui.prototype.connectedCallback = function(...e) {
  uf.apply(this, ...e);
  const t = this._instance.appContext.app;
  t && Wa(t);
};
customElements.get("am-chat-launcher") || customElements.define("am-chat-launcher", ui);
let So = {
  apiBaseUrl: "https://api.qa.appmixer.com",
  endpoint: "",
  themeMode: fn.LIGHT,
  widgetMode: Qn.FULLSCREEN,
  widgetPosition: Sr.BOTTOM_RIGHT,
  jwt: void 0
};
function Yt() {
  return So;
}
function rf(e) {
  So = { ...So, ...e };
}
class iu extends Error {
  constructor(n, u, r, o) {
    super(n);
    Pu(this, "detailMessage");
    Pu(this, "statusCode");
    Pu(this, "errorMessage");
    this.name = "ApiError", this.detailMessage = r, this.statusCode = u, this.errorMessage = o, Object.setPrototypeOf(this, new.target.prototype);
  }
}
const Vn = {
  SESSION_ID: "session_id",
  CHAT_TOKEN_URL_PARAM: "chat_token",
  CHAT_TOKEN: "appmixer-chat-token",
  X_CHAT_TOKEN: "x-appmixer-chat-token"
};
function of() {
  const e = af();
  return e ? { [Vn.X_CHAT_TOKEN]: e } : {};
}
function sf(e, t) {
  const u = (Yt().endpoint || "").replace(/\?.*$/, "").replace(/\/+$/, ""), r = new URL(e.replace(/^\/+/, ""), u);
  return t && Object.entries(t).forEach(([o, i]) => {
    r.searchParams.append(o, i);
  }), r.toString();
}
function af() {
  if (Yt().widgetMode !== Qn.DIALOG) {
    const r = new URLSearchParams(window.location.search).get(Vn.CHAT_TOKEN_URL_PARAM);
    if (r)
      return r;
  }
  const t = Yt().endpoint ?? "";
  try {
    const r = new URL(t, window.location.origin).searchParams.get(Vn.CHAT_TOKEN_URL_PARAM);
    if (r)
      return r;
  } catch {
    console.warn("Not a valid endpoint for URL parsing:", t);
  }
  const n = Yt().jwt;
  return n || sessionStorage.getItem(Vn.CHAT_TOKEN) || null;
}
function cf(e, t) {
  return typeof e == "string" ? {
    path: e,
    opts: {}
  } : {
    path: "",
    opts: e ?? {}
  };
}
async function Su(e, t) {
  const { path: n, opts: u } = cf(e), { method: r = "GET", params: o, body: i } = u || {};
  Yt().apiBaseUrl;
  let s = sf(n, o);
  const a = {
    "Content-Type": "application/json",
    ...of()
  }, c = await fetch(s, {
    method: r,
    headers: a,
    body: i != null ? JSON.stringify(i) : void 0
  });
  if (!c.ok) {
    const l = await c.text(), d = JSON.parse(l);
    throw new iu(
      d.message,
      d.statusCode,
      `API: ${r}: ${s} failed: ${c.status} | ${c.statusText}`,
      d.error
    );
  }
  return await c.json();
}
const lf = (e) => Su({
  method: "POST",
  params: {
    action: "ensure-session",
    session_id: e
  }
}), df = (e) => Su({
  method: "GET",
  params: {
    action: "load-thread",
    thread_id: e
  }
}), ff = (e, t, n, u) => Su({
  method: "POST",
  params: {
    action: "send-message",
    session_id: e
  },
  body: {
    threadId: t,
    id: n,
    content: u
  }
}), hf = (e, t) => Su({
  method: "POST",
  params: {
    action: "delete-thread",
    session_id: e
  },
  body: {
    threadId: t
  }
}), pf = (e, t, n) => Su({
  method: "POST",
  params: {
    action: "add-thread"
  },
  body: {
    sessionId: e,
    agentId: t,
    theme: n
  }
});
function Do(e) {
  return {
    ...e
    //isEditing: false,
    //formattedTime: new Date(msg.timestamp).toLocaleTimeString(),
  };
}
function bf(e) {
  return {
    ...e
  };
}
function Qa(e) {
  const n = (Array.isArray(e.messages) ? e.messages : []).map(Do);
  return {
    ...e,
    messages: n
  };
}
function gf(e) {
  const n = (Array.isArray(e.threads) ? e.threads : []).map(Qa), r = (Array.isArray(e.agents) ? e.agents : []).map(bf);
  return {
    ...e,
    threads: n,
    agents: r
  };
}
const pu = "appmixer-chat-active-thread-ids", Yu = "appmixer-chat-sessions";
function Du() {
  return location.origin + location.pathname;
}
function uo() {
  const e = ri()[Du()];
  return e !== null ? e : void 0;
}
function ri() {
  const e = sessionStorage.getItem(pu);
  if (!e)
    return {};
  try {
    return JSON.parse(e);
  } catch (t) {
    return console.error(
      `getActiveThreadIds: Failed to parse sessionStorage key "${pu}"`,
      t
    ), sessionStorage.removeItem(pu), {};
  }
}
function mf(e) {
  const t = Du(), n = ri();
  e ? n[t] = e : delete n[t], sessionStorage.setItem(pu, JSON.stringify(n));
}
function _f() {
  const e = Du(), t = ri();
  delete t[e], sessionStorage.setItem(pu, JSON.stringify(t));
}
function xf() {
  return ec()[Du()] || null;
}
function ec() {
  const e = sessionStorage.getItem(Yu);
  if (!e)
    return {};
  try {
    return JSON.parse(e);
  } catch (t) {
    return console.error(`getSessions: Failed to parse sessionStorage key "${Yu}"`, t), sessionStorage.removeItem(Yu), {};
  }
}
function yf(e) {
  const t = Du(), n = ec();
  e ? n[t] = e : delete n[t], sessionStorage.setItem(Yu, JSON.stringify(n));
}
function wf() {
  if (Yt().widgetMode !== Qn.DIALOG) {
    const u = new URLSearchParams(window.location.search).get(Vn.SESSION_ID);
    if (u)
      return u;
  }
  const t = Yt().endpoint ?? "";
  try {
    const u = new URL(t, window.location.origin).searchParams.get(Vn.SESSION_ID);
    if (u)
      return u;
  } catch {
    console.warn("Not a valid endpoint for URL parsing:", t);
  }
  return xf();
}
function vf() {
  return {
    init: async () => {
      const t = await lf(wf() || ""), n = gf(t);
      return yf(t.id), n;
    }
  };
}
function tc(e) {
  function t(a, c, l) {
    const d = n(a, c, l), h = [...e.value[a] ?? []], f = h.findIndex((p) => p.correlationId === l);
    if (f !== -1) {
      const p = {
        id: d.id,
        content: d.content,
        role: St.AGENT,
        componentId: d.componentId,
        flowId: d.flowId,
        threadId: a,
        userId: d.userId,
        createdAt: d.createdAt,
        correlationId: l
      };
      h.splice(f, 1, p);
    } else
      h.push(d);
    o(a, h);
  }
  function n(a, c, l) {
    return {
      ...c,
      threadId: a,
      role: St.AGENT,
      correlationId: l
    };
  }
  function u(a, c, l) {
    const d = {
      id: c,
      content: l,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      role: St.USER,
      componentId: "",
      flowId: "",
      threadId: a,
      userId: ""
    };
    return r(a, d), d;
  }
  function r(a, c) {
    const l = e.value[a] || [];
    o(a, [...l, c]);
  }
  function o(a, c) {
    e.value = {
      ...e.value,
      [a]: c
    };
  }
  function i(a, c, l) {
    const d = e.value[a] || [];
    if (d.findIndex((_) => _.correlationId === c) === -1) {
      const _ = {
        id: c,
        content: "",
        role: St.AGENT,
        componentId: "",
        flowId: "",
        threadId: a,
        userId: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        correlationId: c
      };
      e.value = {
        ...e.value,
        [a]: [...d, _]
      };
    }
    const f = [...e.value[a] || []], p = f.find((_) => _.correlationId === c);
    p.content += l, e.value = {
      ...e.value,
      [a]: f
    };
  }
  function s(a, c, l) {
    const d = e.value[a] || [], h = d.findIndex((f) => f.id === c);
    if (h !== -1) {
      const f = [...d];
      f.splice(h, 1, l), o(a, f);
    }
  }
  return {
    appendDeltaToThread: i,
    appendToThread: r,
    setThreadMessages: o,
    addPlaceholderToThread: u,
    addFinalAgentToThread: t,
    replacePlaceholder: s
  };
}
function kf(e, t) {
  const { addFinalAgentToThread: n, appendDeltaToThread: u } = tc(e), { setStatus: r, stop: o } = t;
  function i(d) {
    return (h) => {
      h.role === St.AGENT && (n(d, h, h.correlationId ?? ""), r(d, Wn.IDLE));
    };
  }
  function s(d) {
    return (h) => {
      u(d, h.correlationId, h.content);
    };
  }
  function a(d) {
    return (h) => {
      const f = (h.content ?? "").replace(/\.{1,3}$/, "");
      r(d, f);
    };
  }
  function c(d, h, f) {
    return (p) => {
      console.error(`Error in thread ${h}:`, p), o(h), setTimeout(() => {
        f(d, h);
      }, 3e3);
    };
  }
  function l(d) {
    return () => {
      console.log(`Thread ${d} streaming done.`);
    };
  }
  return {
    makeMessageHandler: i,
    makeProgressHandler: a,
    makeDeltaHandler: s,
    makeErrorHandler: c,
    makeDoneHandler: l
  };
}
function Ef() {
  return {
    load: async (r) => {
      const o = await df(r), i = o.messages || [];
      return i.forEach((s) => {
        s.role === St.AGENT && (s.author = o.agentId);
      }), i.map(Do);
    },
    send: async (r, o, i) => {
      if (i.role !== St.USER)
        throw new Error("Only user messages can be sent");
      const s = await ff(r, o, i.id, i.content);
      return s ? Do(s) : null;
    },
    remove: async (r, o) => {
      await hf(r, o);
    },
    create: async (r, o, i) => {
      const s = i.substring(0, 32), a = await pf(r, o, s);
      return Qa(a);
    }
  };
}
const Cf = {
  CHAT_EVENTS: "/plugins/appmixer/utils/chat/events"
}, ro = {
  MESSAGE: "message",
  PROGRESS: "progress",
  DELTA: "delta"
};
function Af(e, t) {
  const n = `${Yt().apiBaseUrl}${Cf.CHAT_EVENTS}/${e}`, u = new EventSource(n);
  return u.onmessage = (r) => {
    const o = JSON.parse(r.data);
    o.type === ro.MESSAGE ? t.onMessage(o.data) : o.type === ro.PROGRESS ? t.onProgress(o.data) : o.type === ro.DELTA && t.onDelta(o.data);
  }, u.onerror = (r) => {
    var o;
    (o = t.onError) == null || o.call(t, r), u.close();
  }, u.addEventListener("done", () => {
    var r;
    (r = t.onDone) == null || r.call(t), u.close();
  }), u;
}
function Sf(e) {
  const t = `chat-widget-sync-${e}`, n = new BroadcastChannel(t), u = crypto.randomUUID(), r = /* @__PURE__ */ new Set(), o = (c) => {
    const l = c.data;
    l.sessionId === e && l.tabId !== u && r.forEach((d) => d(l));
  };
  n.addEventListener("message", o);
  function i(c) {
    n.postMessage({ type: "delete-thread", threadId: c, sessionId: e, tabId: u });
  }
  function s(c) {
    return r.add(c), () => {
      r.delete(c);
    };
  }
  function a() {
    n.removeEventListener("message", o), n.close(), r.clear();
  }
  return {
    notifyDeleteThread: i,
    subscribe: s,
    close: a
  };
}
function ls() {
  const e = performance.getEntriesByType("navigation");
  return e.length > 0 ? e[0].type === "reload" : !1;
}
const Je = /* @__PURE__ */ ei("chat", () => {
  const e = ve(null), t = ve(uo() ?? void 0), n = ve({}), u = ve({}), r = ve(!1), o = ve({}), i = ve([]), s = le(() => {
    var x;
    return ((x = e.value) == null ? void 0 : x.threads) ?? [];
  }), a = le(() => {
    var x;
    return Object.fromEntries(((x = e.value) == null ? void 0 : x.threads.map((L) => [L.id, L])) ?? []);
  }), c = le(() => t.value ? a.value[t.value] ?? null : null), l = le(() => {
    const x = t.value;
    return !!x && Array.isArray(n.value[x]) && n.value[x].length > 0;
  }), d = le(
    () => t.value ? n.value[t.value] ?? [] : []
  ), h = le(() => {
    var x;
    return t.value && ((x = o.value[t.value]) != null && x.status) ? o.value[t.value].status : Wn.IDLE;
  });
  let f = null, p = () => {
  };
  kt(
    e,
    (x) => {
      f && (f.close(), f = null), x && x.id && (f = Sf(x.id), p = f.notifyDeleteThread);
    },
    { immediate: !0 }
  );
  function _(x) {
    return f ? f.subscribe((L) => {
      L.type === "delete-thread" && x(L);
    }) : () => {
    };
  }
  function O(x) {
    if (!e.value) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    delete n.value[x], delete o.value[x], delete u.value[x];
    const L = e.value.threads.findIndex((ne) => ne.id === x);
    if (L === -1) {
      console.error(`Thread with ID ${x} not found in session`);
      return;
    }
    e.value.threads.splice(L, 1), t.value === x && A();
  }
  function P(x = void 0) {
  }
  function A() {
    e.value && (t.value = void 0);
  }
  function T() {
    if (t.value = void 0, ls()) {
      const x = uo();
      t.value = x || void 0;
    }
  }
  function v() {
    let x;
    if (ls()) {
      const L = uo();
      L && a.value[L] && (x = L);
    }
    t.value = x;
  }
  return kt(t, (x) => {
    x ? mf(x) : _f();
  }), {
    session: e,
    messages: n,
    threads: s,
    streams: o,
    threadState: u,
    hasMessages: l,
    activeThread: c,
    activeThreadId: t,
    isLoadingSession: r,
    activeMessages: d,
    threadById: a,
    activeStreamStatus: h,
    errors: i,
    clearThread: O,
    seedDemo: P,
    resetActiveChat: A,
    setInitActiveThread: T,
    initActiveThread: v,
    subscribeToDeleteThread: _,
    notifyDeleteThread: (x) => p(x)
  };
});
function Df() {
  const e = Je(), { streams: t } = Et(e);
  return { start: (i, s) => {
    if (t.value[i])
      return;
    const a = Af(i, {
      onMessage: s.onMessage,
      onProgress: s.onProgress,
      onDelta: s.onDelta,
      onError: s.onError,
      onDone: s.onDone
    });
    t.value = {
      ...t.value,
      [i]: {
        es: a,
        status: Wn.IDLE
        // Initial status when streaming starts
      }
    };
  }, stop: (i) => {
    const s = t.value[i];
    if (!s)
      return;
    s.es.close();
    const a = { ...t.value };
    delete a[i], t.value = a;
  }, statusOf: (i) => le(() => {
    var s;
    return ((s = t.value[i]) == null ? void 0 : s.status) ?? Wn.IDLE;
  }), setStatus: (i, s) => {
    t.value[i] && (t.value[i].status = s);
  } };
}
const Tf = {
  viewBox: "0 0 20 20",
  width: "1.2em",
  height: "1.2em"
}, Mf = { fill: "none" }, Ff = ["clip-path"], If = ["id"];
function Rf(e, t) {
  return N(), K("svg", Tf, [
    U("g", Mf, [
      U("g", {
        "clip-path": "url(#" + e.idMap.clip0_5795_24317 + ")"
      }, t[0] || (t[0] = [
        Jo('<path d="M1.66699 1.66669L18.3337 18.3334" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 16.6667H10.0083" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.08301 13.6908C7.86188 12.9274 8.90904 12.4998 9.99967 12.4998C11.0903 12.4998 12.1375 12.9274 12.9163 13.6908" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4.16699 10.7158C5.34868 9.55744 6.8485 8.77707 8.47533 8.47418" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.8336 10.7158C15.3319 10.2239 14.7699 9.79751 14.1611 9.44666" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1.66699 7.35002C2.69749 6.42842 3.87373 5.68415 5.14783 5.14752" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.3334 7.34997C17.0624 6.21315 15.5721 5.34842 13.9544 4.80899C12.3367 4.26957 10.6257 4.06684 8.92676 4.2133" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>', 7)
      ]), 8, Ff),
      U("defs", null, [
        U("clipPath", {
          id: e.idMap.clip0_5795_24317
        }, t[1] || (t[1] = [
          U("rect", {
            width: "20",
            height: "20",
            fill: "white"
          }, null, -1)
        ]), 8, If)
      ])
    ])
  ]);
}
const su = ht({ name: "icons-not-connection", render: Rf, setup() {
  return { idMap: { clip0_5795_24317: "uicons-" + Math.random().toString(36).substr(2, 10) } };
} });
let Nf = (e = 21) => crypto.getRandomValues(new Uint8Array(e)).reduce((t, n) => (n &= 63, n < 36 ? t += n.toString(36) : n < 62 ? t += (n - 26).toString(36).toUpperCase() : n > 62 ? t += "-" : t += "_", t), "");
function nc() {
  const e = Je();
  function t() {
    return e.errors.length > 0;
  }
  function n() {
    e.errors = [];
  }
  function u(o) {
    e.errors.push(o);
  }
  function r(o, i, s, a, c, l) {
    const d = {
      id: Nf(12),
      title: o,
      message: i,
      errorMsg: l ? `ERROR [${l.statusCode}]: ${l.message}` : void 0,
      actionLabel: s,
      icon: a,
      onRetry: c,
      visible: !0
    };
    u(d);
  }
  return {
    clearErrors: n,
    addErrorItemObj: u,
    addError: r,
    hasErrors: t
  };
}
const Of = "temp-";
function sr() {
  const e = Je(), { notifyDeleteThread: t } = e, { messages: n } = Et(e), { setThreadMessages: u, addPlaceholderToThread: r } = tc(n), { init: o } = vf(), { load: i, send: s, remove: a, create: c } = Ef(), { clearErrors: l, addError: d } = nc();
  function h(I) {
    e.threadState[I] || (e.threadState[I] = {
      isLoadingMessages: !1,
      isStreaming: !1,
      isSending: !1
    });
  }
  function f(I, k, J) {
    h(I), e.threadState = {
      ...e.threadState,
      [I]: {
        ...e.threadState[I],
        [k]: J
      }
    };
  }
  async function p() {
    e.isLoadingSession = !0;
    try {
      e.session = await o(), e.initActiveThread();
    } catch (I) {
      I instanceof iu ? (d(
        "Connection Error",
        "Connection to the server failed. Please check your internet connection or try again later.",
        "Try Again",
        su,
        _,
        I
      ), console.error(`Failed to load session: ${I.detailMessage}`)) : console.error("An unexpected error occurred while loading the session:", I);
    } finally {
      e.isLoadingSession = !1;
    }
  }
  async function _() {
    l(), await p(), e.activeThreadId && await P(e.activeThreadId);
  }
  kt(
    () => e.activeThreadId,
    async (I) => {
      await Xt(), I && e.session && F(e.session.id, I);
    },
    { immediate: !0 }
  );
  async function O(I) {
    if (!e.session) {
      console.warn("Session model is not set, cannot set active thread");
      return;
    }
    if (e.activeThreadId === I)
      return;
    if (!e.threadById[I]) {
      console.warn(`Cannot set active thread: Thread with ID ${I} not found`);
      return;
    }
    e.activeThreadId = I, F(e.session.id, I);
  }
  async function P(I) {
    if (!e.session) {
      console.error("Session model is not set, cannot load messages");
      return;
    }
    f(I, "isLoadingMessages", !0);
    try {
      e.messages[I] = await i(I) || [];
      const k = e.threadById[I];
      if (!k) {
        console.error(`Thread with ID ${I} not found in session`);
        return;
      }
      k.messages = e.messages[I];
    } catch (k) {
      k instanceof iu ? (d(
        "Connection Error",
        "Connection to the server failed. Please check your internet connection or try again later.",
        "Try Again",
        su,
        _,
        k
      ), console.error(`Error loading messages for thread ${I}: ${k.detailMessage}`)) : console.error("An unexpected error occurred while loading messages:", k);
    } finally {
      f(I, "isLoadingMessages", !1);
    }
  }
  async function A(I) {
    var k;
    if (!e.session) {
      console.error("Session model is not set, cannot add message");
      return;
    }
    try {
      if (!e.activeThreadId) {
        const xe = (k = e.session.agents[0]) == null ? void 0 : k.id, ie = await c(e.session.id, xe, I);
        if (!ie || !ie.id)
          throw new Error("Failed to create new thread");
        f(ie.id, "isSending", !0), e.session.threads.unshift(ie), O(ie.id), e.messages[ie.id] = [];
      }
      const J = e.activeThreadId || "";
      f(J, "isSending", !0);
      const he = `${Of}${Date.now()}`, Te = r(J, he, I), Me = await s(e.session.id, J, { ...Te });
      if (Me) {
        const xe = e.messages[J] || [], ie = xe.findIndex(($e) => $e.id === he);
        ie !== -1 && (xe.splice(ie, 1, Me), u(J, xe));
      } else
        e.messages[J] = (e.messages[J] || []).filter(
          (xe) => xe.id !== he
        ), console.error("Failed to save message: addMessageApi returned null");
    } catch (J) {
      J instanceof iu ? (d(
        "Connection Error",
        "Connection to the server failed. Please check your internet connection or try again later.",
        "Try Again",
        su,
        _,
        J
      ), console.error(`Error creating thread or adding message: ${J.detailMessage}`)) : console.error("An unexpected error occurred while sending message:", J);
    }
  }
  function T(I) {
    if (!e.session) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    try {
      t(I), a(e.session.id, I), v(I);
    } catch (k) {
      k instanceof iu ? (d(
        "Connection Error",
        "Connection to the server failed. Please check your internet connection or try again later.",
        "Try Again",
        su,
        _,
        k
      ), console.error(`Error deleting thread ${I}: ${k.detailMessage}`)) : console.error("An unexpected error occurred while deleting thread:", k);
    }
  }
  function v(I) {
    if (!e.session) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    te(I), e.clearThread(I);
  }
  const x = Df(), { start: L, stop: ne } = x, q = kf(Et(e).messages, x);
  function F(I, k) {
    L(k, {
      onMessage: (J) => {
        q.makeMessageHandler(k)(J), J.role === St.AGENT && (f(k, "isStreaming", !1), f(k, "isSending", !1));
      },
      onProgress: (J) => {
        q.makeProgressHandler(k)(J);
      },
      onDelta: (J) => {
        q.makeDeltaHandler(k)(J);
      },
      onError: (J) => {
        q.makeErrorHandler(I, k, F)(J), f(k, "isStreaming", !1), f(k, "isSending", !1);
      },
      onDone: () => {
        q.makeDoneHandler(k)(), f(k, "isStreaming", !1), f(k, "isSending", !1);
      }
    });
  }
  function te(I) {
    ne(I);
  }
  return {
    loadSession: p,
    setActiveThread: O,
    loadMessages: P,
    sendMessage: A,
    deleteThread: T,
    deleteThreadFromStore: v,
    startStreaming: F,
    stopStreaming: te,
    initChatSession: _
  };
}
const Dr = /* @__PURE__ */ ei("sidebarStore", () => {
  const e = ve(!1), t = () => {
    e.value = !e.value;
  }, n = () => {
    e.value = !1;
  }, u = () => {
    e.value = !0;
  }, r = le(() => e.value), o = le(() => t);
  return {
    isOpen: r,
    toggle: o,
    close: n,
    open: u
  };
});
function ds(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function Lf(e) {
  const t = String(e.getDate()).padStart(2, "0"), n = String(e.getMonth() + 1).padStart(2, "0"), u = e.getFullYear();
  return `${t}.${n}.${u}`;
}
function Bf(e, t) {
  const n = ds(e).getTime() - ds(t).getTime(), u = Math.round(n / (1e3 * 60 * 60 * 24));
  return u === 0 ? { key: "groups.today" } : u === -1 ? { key: "groups.yesterday" } : { label: Lf(e) };
}
function Pf(e) {
  return le(() => {
    const n = [...Array.isArray(e) ? e : e.value].sort(
      (o, i) => new Date(i.createdAt ?? 0).getTime() - new Date(o.createdAt ?? 0).getTime()
    ), u = /* @__PURE__ */ new Date(), r = /* @__PURE__ */ new Map();
    for (const o of n) {
      const i = new Date(o.createdAt ?? 0), { key: s, label: a } = Bf(i, u), c = s ?? a;
      r.has(c) || r.set(c, { key: s, label: a, items: [] }), r.get(c).items.push(o);
    }
    return Array.from(r.values());
  });
}
const $f = ["type", "disabled"], zf = {
  key: 0,
  class: "am-chat-widget-btn__icon"
}, jf = {
  key: 1,
  class: "am-chat-widget-btn__label"
}, Hf = /* @__PURE__ */ Se({
  __name: "BaseButton.ce",
  props: {
    style: { default: "primary", type: String },
    type: { default: "button", type: String },
    full: { type: Boolean },
    iconOnly: { type: Boolean },
    small: { type: Boolean },
    active: { type: Boolean },
    isSending: { type: Boolean },
    hiddenForDesktop: { type: Boolean }
  },
  setup(e) {
    const t = e, n = le(() => t.full ?? !1), u = le(() => t.iconOnly ?? !1), r = le(() => t.small ?? !1), o = le(() => t.active ?? !1), i = le(() => t.isSending ?? !1);
    return (s, a) => (N(), K("button", Ra({
      class: [
        "am-chat-widget-btn",
        `am-chat-widget-btn--${s.style}`,
        { "am-chat-widget-btn--active": o.value },
        {
          "am-chat-widget-btn--full": n.value,
          "am-chat-widget-btn--icon-only": u.value,
          "am-chat-widget-btn--small": r.value
        },
        { "am-chat-widget-btn--desktop-hidden": s.hiddenForDesktop }
      ]
    }, s.$attrs, {
      type: t.type,
      disabled: s.style === "disabled" || i.value
    }), [
      s.$slots.icon ? (N(), K("span", zf, [
        rr(s.$slots, "icon")
      ])) : Ie("", !0),
      s.$slots.default ? (N(), K("span", jf, [
        rr(s.$slots, "default")
      ])) : Ie("", !0)
    ], 16, $f));
  }
}), Uf = '@charset "UTF-8";.am-chat-widget-btn{position:relative;display:inline-flex;justify-content:center;align-items:center;padding:.4375rem 1rem;border:none;border-radius:.1875rem;background-color:var(--bg-primary-btn);line-height:1;text-decoration:none;color:var(--color-primary-btn);transition:background-color .15s;cursor:pointer;gap:.5rem;-webkit-tap-highlight-color:transparent;overflow:visible}.am-chat-widget-btn:hover,.am-chat-widget-btn:focus-visible{background-color:var(--bg-primary-btn-hover)}.am-chat-widget-btn__icon{display:inline-flex;font-size:1.1875rem}.am-chat-widget-btn__label{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.am-chat-widget-btn--full{display:flex;width:100%}.am-chat-widget-btn--icon-only{width:auto;padding:.4375rem 1rem;gap:0}.am-chat-widget-btn--icon-only.am-chat-widget-btn--small{padding:.4375rem;aspect-ratio:1/1}.am-chat-widget-btn--icon-only.am-chat-widget-btn--small>.am-chat-widget-btn__icon{font-size:.6875rem}.am-chat-widget-btn--primary{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;background-color:var(--bg-primary-btn);color:var(--color-primary-btn)}.am-chat-widget-btn--primary:hover,.am-chat-widget-btn--primary:focus-visible{background-color:var(--bg-primary-btn-hover)}.am-chat-widget-btn--primary:disabled{background-color:var(--bg-disabled-btn);color:var(--color-disabled-btn);cursor:default}.am-chat-widget-btn--secondary{border:.0625rem solid var(--border-secondary-btn);background-color:var(--bg-secondary-btn);color:var(--color-secondary-btn)}.am-chat-widget-btn--secondary:hover,.am-chat-widget-btn--secondary:focus-visible{background-color:var(--text-side-bg-active)}.am-chat-widget-btn--tertiary{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;border:.0625rem solid var(--border-tertiary-btn);background-color:var(--bg-tertiary-btn);box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;color:var(--color-tertiary-btn)}.am-chat-widget-btn--tertiary:hover,.am-chat-widget-btn--tertiary:focus-visible{border-color:var(--border-tertiary-hover-btn);background-color:var(--bg-tertiary-hover-btn)}.am-chat-widget-btn--tertiary:active{background-color:var(--bg-tertiary-active-btn)}.am-chat-widget-btn--danger{border:.0625rem solid var(--bg-error-msg-btn);background-color:var(--bg-error-msg-btn);color:var(--color-primary-btn)}.am-chat-widget-btn--danger:hover,.am-chat-widget-btn--danger:focus-visible{background-color:var(--bg-error-msg-btn-hover)}.am-chat-widget-btn--link{font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:120%;letter-spacing:0;justify-content:left;padding:.625rem .75rem;border:none;border-radius:.25rem;background:transparent;text-decoration:none;color:var(--text-side)}.am-chat-widget-btn--link.am-chat-widget-btn--active{background-color:var(--text-side-bg-active);color:var(--text-side-active)}.am-chat-widget-btn--link:hover,.am-chat-widget-btn--link:focus-visible{background-color:var(--text-side-bg-active)}.am-chat-widget-btn--desktop-hidden{display:inline-flex}@container chat-widget (min-width: 768px){.am-chat-widget-btn--desktop-hidden{display:none}}', Ht = /* @__PURE__ */ De(Hf, [["styles", [Uf]]]), qf = {
  viewBox: "0 0 16 16",
  width: "1.2em",
  height: "1.2em"
};
function Gf(e, t) {
  return N(), K("svg", qf, t[0] || (t[0] = [
    U("g", {
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }, [
      U("line", {
        x1: "12",
        y1: "4",
        x2: "4",
        y2: "12"
      }),
      U("line", {
        x1: "4",
        y1: "4",
        x2: "12",
        y2: "12"
      })
    ], -1)
  ]));
}
const uc = ht({ name: "icons-cross", render: Gf }), Vf = { class: "am-chat-widget__item" }, Kf = /* @__PURE__ */ Se({
  __name: "ChatListItem.ce",
  props: {
    label: { type: String },
    active: { type: Boolean },
    threadId: { type: String }
  },
  setup(e) {
    const t = Je(), n = Dr(), { activeThreadId: u } = Et(t), { deleteThread: r, setActiveThread: o, loadMessages: i } = sr(), s = e, a = le(() => s.active ?? !1);
    async function c() {
      n.close();
      {
        if (o(s.threadId), !u.value)
          return;
        await i(u.value);
      }
    }
    return (l, d) => (N(), K("li", Vf, [
      ee(Ht, {
        style: "link",
        full: !0,
        active: a.value,
        "aria-label": `Link to thread: ${l.label}`,
        onClick: c
      }, {
        default: ct(() => [
          Xn(at(l.label), 1)
        ]),
        _: 1
      }, 8, ["active", "aria-label"]),
      ee(Ht, {
        style: "link",
        active: a.value,
        "aria-label": `Delete thread: ${l.label}`,
        onClick: d[0] || (d[0] = Ar((h) => G(r)(s.threadId), ["stop"]))
      }, {
        default: ct(() => [
          ee(G(uc), {
            "aria-label": "Icon delete thread",
            width: "10px",
            height: "10px"
          })
        ]),
        _: 1
      }, 8, ["active", "aria-label"])
    ]));
  }
}), Zf = ".am-chat-widget__item{display:flex;align-items:center;width:100%;margin:.25rem 0;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0}.am-chat-widget__item>:nth-child(1){flex:1;width:auto;min-width:0}.am-chat-widget__item>:nth-child(2){display:none}.am-chat-widget__item:hover{border-radius:.25rem;background-color:var(--text-side-bg-active)}.am-chat-widget__item:hover>:nth-child(2){display:flex}", Wf = /* @__PURE__ */ De(Kf, [["styles", [Zf]]]), Jf = { class: "am-chat-widget__group" }, Yf = { class: "am-chat-widget__list" }, Xf = /* @__PURE__ */ Se({
  __name: "ChatGroup.ce",
  props: {
    group: { type: Object }
  },
  setup(e) {
    const t = Je(), { activeThreadId: n } = Et(t), u = e, r = le(() => u.group.key ? u.group.key === "groups.today" ? "Today" : "Yesterday" : u.group.label || "");
    return (o, i) => (N(), K("div", Jf, [
      U("h3", null, at(r.value), 1),
      U("ul", Yf, [
        (N(!0), K(Fe, null, Mn(o.group.items, (s) => (N(), We(Wf, {
          key: s.id,
          label: s.theme,
          active: s.id === G(n),
          "thread-id": s.id
        }, null, 8, ["label", "active", "thread-id"]))), 128))
      ])
    ]));
  }
}), Qf = ".am-chat-widget__group h3{margin:0 0 .5rem;padding:.5rem .625rem 0;font-size:.8125rem;font-weight:500;color:var(--text-side-header)}.am-chat-widget__list{margin:0;padding:0;list-style:none}", eh = /* @__PURE__ */ De(Xf, [["styles", [Qf]]]), th = /* @__PURE__ */ Se({
  __name: "SkeletonItem.ce",
  props: {
    variant: { type: String }
  },
  setup(e) {
    return (t, n) => (N(), K("div", {
      class: en(["skeleton-item", `skeleton-item--${t.variant}`])
    }, null, 2));
  }
}), nh = "@keyframes shimmer-0f9dbc6e{0%{background-position:-200px 0}to{background-position:200px 0}}.skeleton-item[data-v-0f9dbc6e]{background:var(--skeleton-bg);background-image:linear-gradient(90deg,transparent,var(--skeleton-highlight),transparent);background-size:12.5rem 100%;background-repeat:no-repeat;animation:shimmer-0f9dbc6e 1.5s infinite}.skeleton-item--avatar[data-v-0f9dbc6e]{width:2.5rem;height:2.5rem;border-radius:50%}.skeleton-item--text[data-v-0f9dbc6e]{width:100%;height:.75rem;margin-bottom:.5rem;border-radius:.25rem}.skeleton-item--text[data-v-0f9dbc6e]:last-child{margin-bottom:0}.skeleton-item--bubble[data-v-0f9dbc6e]{width:80%;height:4rem;margin-bottom:.75rem;border-radius:.75rem}.skeleton-item--bubble[data-v-0f9dbc6e]:last-child{margin-bottom:0}", jn = /* @__PURE__ */ De(th, [["styles", [nh]], ["__scopeId", "data-v-0f9dbc6e"]]), uh = { class: "skeleton-list" }, rh = { class: "skeleton-list__item-text" }, oh = /* @__PURE__ */ Se({
  __name: "SkeletonList.ce",
  props: {
    count: { type: Number }
  },
  setup(e) {
    const n = e.count ?? 5;
    return (u, r) => (N(), K("div", uh, [
      (N(!0), K(Fe, null, Mn(G(n), (o) => (N(), K("div", {
        key: o,
        class: "skeleton-list__item"
      }, [
        U("div", rh, [
          ee(jn, { variant: "text" }),
          ee(jn, {
            variant: "text",
            class: "skeleton-list__item-text--short"
          })
        ])
      ]))), 128))
    ]));
  }
}), ih = ".skeleton-list[data-v-42c2f815]{display:flex;flex-direction:column;gap:1rem;padding:1rem .625rem}.skeleton-list__item[data-v-42c2f815]{display:flex;align-items:center;gap:.75rem}.skeleton-list__item-text[data-v-42c2f815]{display:flex;flex-direction:column;flex:1}.skeleton-list__item-text .skeleton-list__item-text--short[data-v-42c2f815]{width:60%}", sh = /* @__PURE__ */ De(oh, [["styles", [ih]], ["__scopeId", "data-v-42c2f815"]]), ah = {
  key: 1,
  class: "am-chat-widget__group-container"
}, ch = /* @__PURE__ */ Se({
  __name: "ChatList.ce",
  setup(e) {
    const t = Je(), { isLoadingSession: n, threads: u } = Et(t), r = Pf(u);
    return (o, i) => G(n) ? (N(), We(sh, {
      key: 0,
      count: 3
    })) : G(n) ? Ie("", !0) : (N(), K("div", ah, [
      (N(!0), K(Fe, null, Mn(G(r), (s) => (N(), We(eh, {
        key: s.label || s.key,
        group: s
      }, null, 8, ["group"]))), 128))
    ]));
  }
}), lh = ".am-chat-widget__group-container{display:flex;flex-direction:column;flex:1 1 0;box-sizing:border-box;width:100%;min-height:0;padding:0;gap:.5rem;overflow-y:auto}", dh = /* @__PURE__ */ De(ch, [["styles", [lh]]]), fh = {
  viewBox: "0 0 18 20",
  width: "1.08em",
  height: "1.2em"
};
function hh(e, t) {
  return N(), K("svg", fh, t[0] || (t[0] = [
    U("g", { fill: "none" }, [
      U("path", {
        d: "M15.375 12.375C15.375 12.7949 15.2257 13.1977 14.9601 13.4946C14.6944 13.7915 14.3341 13.9583 13.9583 13.9583H5.45833L2.625 17.125V4.45833C2.625 4.03841 2.77426 3.63568 3.03993 3.33875C3.30561 3.04181 3.66594 2.875 4.04167 2.875H13.9583C14.3341 2.875 14.6944 3.04181 14.9601 3.33875C15.2257 3.63568 15.375 4.03841 15.375 4.45833V12.375Z",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      U("path", {
        d: "M9 6.04167V10.7917",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      U("path", {
        d: "M6.875 8.41667H11.125",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const ph = ht({ name: "icons-new-chat", render: hh }), bh = { class: "am-chat-widget__sidebar" }, gh = /* @__PURE__ */ Se({
  __name: "ChatSidebar.ce",
  setup(e) {
    const t = Je(), n = Dr();
    function u() {
      t.resetActiveChat(), n.close();
    }
    return (r, o) => (N(), K("aside", bh, [
      ee(Ht, {
        style: "primary",
        full: "",
        "aria-label": "Start a new chat",
        onClick: u
      }, {
        icon: ct(() => [
          ee(G(ph), { "aria-label": "Icon a new chat" })
        ]),
        default: ct(() => [
          o[0] || (o[0] = Xn("New Chat "))
        ]),
        _: 1,
        __: [0]
      }),
      ee(dh)
    ]));
  }
}), mh = ".am-chat-widget__sidebar{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100cqb;padding-inline:.75rem;padding-block:2rem;gap:2rem}", _h = /* @__PURE__ */ De(gh, [["styles", [mh]]]);
function Tr(e) {
  const t = Je(), n = le(() => {
    const i = e.value;
    return i ? t.threadState[i] : null;
  }), u = le(() => {
    var i;
    return !!((i = n.value) != null && i.isLoadingMessages);
  }), r = le(() => {
    var i;
    return !!((i = n.value) != null && i.isSending);
  }), o = le(() => {
    var i;
    return !!((i = n.value) != null && i.isStreaming);
  });
  return {
    isLoadingMessages: u,
    isSending: r,
    isStreaming: o
  };
}
function xh(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var oo, fs;
function yh() {
  if (fs) return oo;
  fs = 1;
  function e(g) {
    return g instanceof Map ? g.clear = g.delete = g.set = function() {
      throw new Error("map is read-only");
    } : g instanceof Set && (g.add = g.clear = g.delete = function() {
      throw new Error("set is read-only");
    }), Object.freeze(g), Object.getOwnPropertyNames(g).forEach((w) => {
      const $ = g[w], se = typeof $;
      (se === "object" || se === "function") && !Object.isFrozen($) && e($);
    }), g;
  }
  class t {
    /**
     * @param {CompiledMode} mode
     */
    constructor(w) {
      w.data === void 0 && (w.data = {}), this.data = w.data, this.isMatchIgnored = !1;
    }
    ignoreMatch() {
      this.isMatchIgnored = !0;
    }
  }
  function n(g) {
    return g.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }
  function u(g, ...w) {
    const $ = /* @__PURE__ */ Object.create(null);
    for (const se in g)
      $[se] = g[se];
    return w.forEach(function(se) {
      for (const Ne in se)
        $[Ne] = se[Ne];
    }), /** @type {T} */
    $;
  }
  const r = "</span>", o = (g) => !!g.scope, i = (g, { prefix: w }) => {
    if (g.startsWith("language:"))
      return g.replace("language:", "language-");
    if (g.includes(".")) {
      const $ = g.split(".");
      return [
        `${w}${$.shift()}`,
        ...$.map((se, Ne) => `${se}${"_".repeat(Ne + 1)}`)
      ].join(" ");
    }
    return `${w}${g}`;
  };
  class s {
    /**
     * Creates a new HTMLRenderer
     *
     * @param {Tree} parseTree - the parse tree (must support `walk` API)
     * @param {{classPrefix: string}} options
     */
    constructor(w, $) {
      this.buffer = "", this.classPrefix = $.classPrefix, w.walk(this);
    }
    /**
     * Adds texts to the output stream
     *
     * @param {string} text */
    addText(w) {
      this.buffer += n(w);
    }
    /**
     * Adds a node open to the output stream (if needed)
     *
     * @param {Node} node */
    openNode(w) {
      if (!o(w)) return;
      const $ = i(
        w.scope,
        { prefix: this.classPrefix }
      );
      this.span($);
    }
    /**
     * Adds a node close to the output stream (if needed)
     *
     * @param {Node} node */
    closeNode(w) {
      o(w) && (this.buffer += r);
    }
    /**
     * returns the accumulated buffer
    */
    value() {
      return this.buffer;
    }
    // helpers
    /**
     * Builds a span element
     *
     * @param {string} className */
    span(w) {
      this.buffer += `<span class="${w}">`;
    }
  }
  const a = (g = {}) => {
    const w = { children: [] };
    return Object.assign(w, g), w;
  };
  class c {
    constructor() {
      this.rootNode = a(), this.stack = [this.rootNode];
    }
    get top() {
      return this.stack[this.stack.length - 1];
    }
    get root() {
      return this.rootNode;
    }
    /** @param {Node} node */
    add(w) {
      this.top.children.push(w);
    }
    /** @param {string} scope */
    openNode(w) {
      const $ = a({ scope: w });
      this.add($), this.stack.push($);
    }
    closeNode() {
      if (this.stack.length > 1)
        return this.stack.pop();
    }
    closeAllNodes() {
      for (; this.closeNode(); ) ;
    }
    toJSON() {
      return JSON.stringify(this.rootNode, null, 4);
    }
    /**
     * @typedef { import("./html_renderer").Renderer } Renderer
     * @param {Renderer} builder
     */
    walk(w) {
      return this.constructor._walk(w, this.rootNode);
    }
    /**
     * @param {Renderer} builder
     * @param {Node} node
     */
    static _walk(w, $) {
      return typeof $ == "string" ? w.addText($) : $.children && (w.openNode($), $.children.forEach((se) => this._walk(w, se)), w.closeNode($)), w;
    }
    /**
     * @param {Node} node
     */
    static _collapse(w) {
      typeof w != "string" && w.children && (w.children.every(($) => typeof $ == "string") ? w.children = [w.children.join("")] : w.children.forEach(($) => {
        c._collapse($);
      }));
    }
  }
  class l extends c {
    /**
     * @param {*} options
     */
    constructor(w) {
      super(), this.options = w;
    }
    /**
     * @param {string} text
     */
    addText(w) {
      w !== "" && this.add(w);
    }
    /** @param {string} scope */
    startScope(w) {
      this.openNode(w);
    }
    endScope() {
      this.closeNode();
    }
    /**
     * @param {Emitter & {root: DataNode}} emitter
     * @param {string} name
     */
    __addSublanguage(w, $) {
      const se = w.root;
      $ && (se.scope = `language:${$}`), this.add(se);
    }
    toHTML() {
      return new s(this, this.options).value();
    }
    finalize() {
      return this.closeAllNodes(), !0;
    }
  }
  function d(g) {
    return g ? typeof g == "string" ? g : g.source : null;
  }
  function h(g) {
    return _("(?=", g, ")");
  }
  function f(g) {
    return _("(?:", g, ")*");
  }
  function p(g) {
    return _("(?:", g, ")?");
  }
  function _(...g) {
    return g.map(($) => d($)).join("");
  }
  function O(g) {
    const w = g[g.length - 1];
    return typeof w == "object" && w.constructor === Object ? (g.splice(g.length - 1, 1), w) : {};
  }
  function P(...g) {
    return "(" + (O(g).capture ? "" : "?:") + g.map((se) => d(se)).join("|") + ")";
  }
  function A(g) {
    return new RegExp(g.toString() + "|").exec("").length - 1;
  }
  function T(g, w) {
    const $ = g && g.exec(w);
    return $ && $.index === 0;
  }
  const v = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
  function x(g, { joinWith: w }) {
    let $ = 0;
    return g.map((se) => {
      $ += 1;
      const Ne = $;
      let Oe = d(se), W = "";
      for (; Oe.length > 0; ) {
        const V = v.exec(Oe);
        if (!V) {
          W += Oe;
          break;
        }
        W += Oe.substring(0, V.index), Oe = Oe.substring(V.index + V[0].length), V[0][0] === "\\" && V[1] ? W += "\\" + String(Number(V[1]) + Ne) : (W += V[0], V[0] === "(" && $++);
      }
      return W;
    }).map((se) => `(${se})`).join(w);
  }
  const L = /\b\B/, ne = "[a-zA-Z]\\w*", q = "[a-zA-Z_]\\w*", F = "\\b\\d+(\\.\\d+)?", te = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", I = "\\b(0b[01]+)", k = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", J = (g = {}) => {
    const w = /^#![ ]*\//;
    return g.binary && (g.begin = _(
      w,
      /.*\b/,
      g.binary,
      /\b.*/
    )), u({
      scope: "meta",
      begin: w,
      end: /$/,
      relevance: 0,
      /** @type {ModeCallback} */
      "on:begin": ($, se) => {
        $.index !== 0 && se.ignoreMatch();
      }
    }, g);
  }, he = {
    begin: "\\\\[\\s\\S]",
    relevance: 0
  }, Te = {
    scope: "string",
    begin: "'",
    end: "'",
    illegal: "\\n",
    contains: [he]
  }, Me = {
    scope: "string",
    begin: '"',
    end: '"',
    illegal: "\\n",
    contains: [he]
  }, xe = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  }, ie = function(g, w, $ = {}) {
    const se = u(
      {
        scope: "comment",
        begin: g,
        end: w,
        contains: []
      },
      $
    );
    se.contains.push({
      scope: "doctag",
      // hack to avoid the space from being included. the space is necessary to
      // match here to prevent the plain text rule below from gobbling up doctags
      begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
      end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
      excludeBegin: !0,
      relevance: 0
    });
    const Ne = P(
      // list of common 1 and 2 letter words in English
      "I",
      "a",
      "is",
      "so",
      "us",
      "to",
      "at",
      "if",
      "in",
      "it",
      "on",
      // note: this is not an exhaustive list of contractions, just popular ones
      /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
      // contractions - can't we'd they're let's, etc
      /[A-Za-z]+[-][a-z]+/,
      // `no-way`, etc.
      /[A-Za-z][a-z]{2,}/
      // allow capitalized words at beginning of sentences
    );
    return se.contains.push(
      {
        // TODO: how to include ", (, ) without breaking grammars that use these for
        // comment delimiters?
        // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
        // ---
        // this tries to find sequences of 3 english words in a row (without any
        // "programming" type syntax) this gives us a strong signal that we've
        // TRULY found a comment - vs perhaps scanning with the wrong language.
        // It's possible to find something that LOOKS like the start of the
        // comment - but then if there is no readable text - good chance it is a
        // false match and not a comment.
        //
        // for a visual example please see:
        // https://github.com/highlightjs/highlight.js/issues/2827
        begin: _(
          /[ ]+/,
          // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
          "(",
          Ne,
          /[.]?[:]?([.][ ]|[ ])/,
          "){3}"
        )
        // look for 3 words in a row
      }
    ), se;
  }, $e = ie("//", "$"), Ye = ie("/\\*", "\\*/"), Xe = ie("#", "$"), He = {
    scope: "number",
    begin: F,
    relevance: 0
  }, Mt = {
    scope: "number",
    begin: te,
    relevance: 0
  }, Or = {
    scope: "number",
    begin: I,
    relevance: 0
  }, Lr = {
    scope: "regexp",
    begin: /\/(?=[^/\n]*\/)/,
    end: /\/[gimuy]*/,
    contains: [
      he,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [he]
      }
    ]
  }, mn = {
    scope: "title",
    begin: ne,
    relevance: 0
  }, Fn = {
    scope: "title",
    begin: q,
    relevance: 0
  }, tu = {
    // excludes method names from keyword processing
    begin: "\\.\\s*" + q,
    relevance: 0
  };
  var Ft = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    APOS_STRING_MODE: Te,
    BACKSLASH_ESCAPE: he,
    BINARY_NUMBER_MODE: Or,
    BINARY_NUMBER_RE: I,
    COMMENT: ie,
    C_BLOCK_COMMENT_MODE: Ye,
    C_LINE_COMMENT_MODE: $e,
    C_NUMBER_MODE: Mt,
    C_NUMBER_RE: te,
    END_SAME_AS_BEGIN: function(g) {
      return Object.assign(
        g,
        {
          /** @type {ModeCallback} */
          "on:begin": (w, $) => {
            $.data._beginMatch = w[1];
          },
          /** @type {ModeCallback} */
          "on:end": (w, $) => {
            $.data._beginMatch !== w[1] && $.ignoreMatch();
          }
        }
      );
    },
    HASH_COMMENT_MODE: Xe,
    IDENT_RE: ne,
    MATCH_NOTHING_RE: L,
    METHOD_GUARD: tu,
    NUMBER_MODE: He,
    NUMBER_RE: F,
    PHRASAL_WORDS_MODE: xe,
    QUOTE_STRING_MODE: Me,
    REGEXP_MODE: Lr,
    RE_STARTERS_RE: k,
    SHEBANG: J,
    TITLE_MODE: mn,
    UNDERSCORE_IDENT_RE: q,
    UNDERSCORE_TITLE_MODE: Fn
  });
  function pi(g, w) {
    g.input[g.index - 1] === "." && w.ignoreMatch();
  }
  function b(g, w) {
    g.className !== void 0 && (g.scope = g.className, delete g.className);
  }
  function m(g, w) {
    w && g.beginKeywords && (g.begin = "\\b(" + g.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", g.__beforeBegin = pi, g.keywords = g.keywords || g.beginKeywords, delete g.beginKeywords, g.relevance === void 0 && (g.relevance = 0));
  }
  function y(g, w) {
    Array.isArray(g.illegal) && (g.illegal = P(...g.illegal));
  }
  function S(g, w) {
    if (g.match) {
      if (g.begin || g.end) throw new Error("begin & end are not supported with match");
      g.begin = g.match, delete g.match;
    }
  }
  function E(g, w) {
    g.relevance === void 0 && (g.relevance = 1);
  }
  const C = (g, w) => {
    if (!g.beforeMatch) return;
    if (g.starts) throw new Error("beforeMatch cannot be used with starts");
    const $ = Object.assign({}, g);
    Object.keys(g).forEach((se) => {
      delete g[se];
    }), g.keywords = $.keywords, g.begin = _($.beforeMatch, h($.begin)), g.starts = {
      relevance: 0,
      contains: [
        Object.assign($, { endsParent: !0 })
      ]
    }, g.relevance = 0, delete $.beforeMatch;
  }, z = [
    "of",
    "and",
    "for",
    "in",
    "not",
    "or",
    "if",
    "then",
    "parent",
    // common variable name
    "list",
    // common variable name
    "value"
    // common variable name
  ], B = "keyword";
  function R(g, w, $ = B) {
    const se = /* @__PURE__ */ Object.create(null);
    return typeof g == "string" ? Ne($, g.split(" ")) : Array.isArray(g) ? Ne($, g) : Object.keys(g).forEach(function(Oe) {
      Object.assign(
        se,
        R(g[Oe], w, Oe)
      );
    }), se;
    function Ne(Oe, W) {
      w && (W = W.map((V) => V.toLowerCase())), W.forEach(function(V) {
        const re = V.split("|");
        se[re[0]] = [Oe, D(re[0], re[1])];
      });
    }
  }
  function D(g, w) {
    return w ? Number(w) : X(g) ? 0 : 1;
  }
  function X(g) {
    return z.includes(g.toLowerCase());
  }
  const j = {}, Z = (g) => {
    console.error(g);
  }, ue = (g, ...w) => {
    console.log(`WARN: ${g}`, ...w);
  }, ce = (g, w) => {
    j[`${g}/${w}`] || (console.log(`Deprecated as of ${g}. ${w}`), j[`${g}/${w}`] = !0);
  }, ge = new Error();
  function be(g, w, { key: $ }) {
    let se = 0;
    const Ne = g[$], Oe = {}, W = {};
    for (let V = 1; V <= w.length; V++)
      W[V + se] = Ne[V], Oe[V + se] = !0, se += A(w[V - 1]);
    g[$] = W, g[$]._emit = Oe, g[$]._multi = !0;
  }
  function ot(g) {
    if (Array.isArray(g.begin)) {
      if (g.skip || g.excludeBegin || g.returnBegin)
        throw Z("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), ge;
      if (typeof g.beginScope != "object" || g.beginScope === null)
        throw Z("beginScope must be object"), ge;
      be(g, g.begin, { key: "beginScope" }), g.begin = x(g.begin, { joinWith: "" });
    }
  }
  function Qe(g) {
    if (Array.isArray(g.end)) {
      if (g.skip || g.excludeEnd || g.returnEnd)
        throw Z("skip, excludeEnd, returnEnd not compatible with endScope: {}"), ge;
      if (typeof g.endScope != "object" || g.endScope === null)
        throw Z("endScope must be object"), ge;
      be(g, g.end, { key: "endScope" }), g.end = x(g.end, { joinWith: "" });
    }
  }
  function _t(g) {
    g.scope && typeof g.scope == "object" && g.scope !== null && (g.beginScope = g.scope, delete g.scope);
  }
  function xt(g) {
    _t(g), typeof g.beginScope == "string" && (g.beginScope = { _wrap: g.beginScope }), typeof g.endScope == "string" && (g.endScope = { _wrap: g.endScope }), ot(g), Qe(g);
  }
  function _n(g) {
    function w(W, V) {
      return new RegExp(
        d(W),
        "m" + (g.case_insensitive ? "i" : "") + (g.unicodeRegex ? "u" : "") + (V ? "g" : "")
      );
    }
    class $ {
      constructor() {
        this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
      }
      // @ts-ignore
      addRule(V, re) {
        re.position = this.position++, this.matchIndexes[this.matchAt] = re, this.regexes.push([re, V]), this.matchAt += A(V) + 1;
      }
      compile() {
        this.regexes.length === 0 && (this.exec = () => null);
        const V = this.regexes.map((re) => re[1]);
        this.matcherRe = w(x(V, { joinWith: "|" }), !0), this.lastIndex = 0;
      }
      /** @param {string} s */
      exec(V) {
        this.matcherRe.lastIndex = this.lastIndex;
        const re = this.matcherRe.exec(V);
        if (!re)
          return null;
        const Ue = re.findIndex((uu, $r) => $r > 0 && uu !== void 0), Be = this.matchIndexes[Ue];
        return re.splice(0, Ue), Object.assign(re, Be);
      }
    }
    class se {
      constructor() {
        this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
      }
      // @ts-ignore
      getMatcher(V) {
        if (this.multiRegexes[V]) return this.multiRegexes[V];
        const re = new $();
        return this.rules.slice(V).forEach(([Ue, Be]) => re.addRule(Ue, Be)), re.compile(), this.multiRegexes[V] = re, re;
      }
      resumingScanAtSamePosition() {
        return this.regexIndex !== 0;
      }
      considerAll() {
        this.regexIndex = 0;
      }
      // @ts-ignore
      addRule(V, re) {
        this.rules.push([V, re]), re.type === "begin" && this.count++;
      }
      /** @param {string} s */
      exec(V) {
        const re = this.getMatcher(this.regexIndex);
        re.lastIndex = this.lastIndex;
        let Ue = re.exec(V);
        if (this.resumingScanAtSamePosition() && !(Ue && Ue.index === this.lastIndex)) {
          const Be = this.getMatcher(0);
          Be.lastIndex = this.lastIndex + 1, Ue = Be.exec(V);
        }
        return Ue && (this.regexIndex += Ue.position + 1, this.regexIndex === this.count && this.considerAll()), Ue;
      }
    }
    function Ne(W) {
      const V = new se();
      return W.contains.forEach((re) => V.addRule(re.begin, { rule: re, type: "begin" })), W.terminatorEnd && V.addRule(W.terminatorEnd, { type: "end" }), W.illegal && V.addRule(W.illegal, { type: "illegal" }), V;
    }
    function Oe(W, V) {
      const re = (
        /** @type CompiledMode */
        W
      );
      if (W.isCompiled) return re;
      [
        b,
        // do this early so compiler extensions generally don't have to worry about
        // the distinction between match/begin
        S,
        xt,
        C
      ].forEach((Be) => Be(W, V)), g.compilerExtensions.forEach((Be) => Be(W, V)), W.__beforeBegin = null, [
        m,
        // do this later so compiler extensions that come earlier have access to the
        // raw array if they wanted to perhaps manipulate it, etc.
        y,
        // default to 1 relevance if not specified
        E
      ].forEach((Be) => Be(W, V)), W.isCompiled = !0;
      let Ue = null;
      return typeof W.keywords == "object" && W.keywords.$pattern && (W.keywords = Object.assign({}, W.keywords), Ue = W.keywords.$pattern, delete W.keywords.$pattern), Ue = Ue || /\w+/, W.keywords && (W.keywords = R(W.keywords, g.case_insensitive)), re.keywordPatternRe = w(Ue, !0), V && (W.begin || (W.begin = /\B|\b/), re.beginRe = w(re.begin), !W.end && !W.endsWithParent && (W.end = /\B|\b/), W.end && (re.endRe = w(re.end)), re.terminatorEnd = d(re.end) || "", W.endsWithParent && V.terminatorEnd && (re.terminatorEnd += (W.end ? "|" : "") + V.terminatorEnd)), W.illegal && (re.illegalRe = w(
        /** @type {RegExp | string} */
        W.illegal
      )), W.contains || (W.contains = []), W.contains = [].concat(...W.contains.map(function(Be) {
        return it(Be === "self" ? W : Be);
      })), W.contains.forEach(function(Be) {
        Oe(
          /** @type Mode */
          Be,
          re
        );
      }), W.starts && Oe(W.starts, V), re.matcher = Ne(re), re;
    }
    if (g.compilerExtensions || (g.compilerExtensions = []), g.contains && g.contains.includes("self"))
      throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
    return g.classNameAliases = u(g.classNameAliases || {}), Oe(
      /** @type Mode */
      g
    );
  }
  function nu(g) {
    return g ? g.endsWithParent || nu(g.starts) : !1;
  }
  function it(g) {
    return g.variants && !g.cachedVariants && (g.cachedVariants = g.variants.map(function(w) {
      return u(g, { variants: null }, w);
    })), g.cachedVariants ? g.cachedVariants : nu(g) ? u(g, { starts: g.starts ? u(g.starts) : null }) : Object.isFrozen(g) ? u(g) : g;
  }
  var yt = "11.11.1";
  class Iu extends Error {
    constructor(w, $) {
      super(w), this.name = "HTMLInjectionError", this.html = $;
    }
  }
  const Pr = n, bi = u, gi = Symbol("nomatch"), Hc = 7, mi = function(g) {
    const w = /* @__PURE__ */ Object.create(null), $ = /* @__PURE__ */ Object.create(null), se = [];
    let Ne = !0;
    const Oe = "Could not find the language '{}', did you forget to load/include a language module?", W = { disableAutodetect: !0, name: "Plain text", contains: [] };
    let V = {
      ignoreUnescapedHTML: !1,
      throwUnescapedHTML: !1,
      noHighlightRe: /^(no-?highlight)$/i,
      languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
      classPrefix: "hljs-",
      cssSelector: "pre code",
      languages: null,
      // beta configuration options, subject to change, welcome to discuss
      // https://github.com/highlightjs/highlight.js/issues/1086
      __emitter: l
    };
    function re(M) {
      return V.noHighlightRe.test(M);
    }
    function Ue(M) {
      let Q = M.className + " ";
      Q += M.parentNode ? M.parentNode.className : "";
      const fe = V.languageDetectRe.exec(Q);
      if (fe) {
        const ke = tn(fe[1]);
        return ke || (ue(Oe.replace("{}", fe[1])), ue("Falling back to no-highlight mode for this block.", M)), ke ? fe[1] : "no-highlight";
      }
      return Q.split(/\s+/).find((ke) => re(ke) || tn(ke));
    }
    function Be(M, Q, fe) {
      let ke = "", ze = "";
      typeof Q == "object" ? (ke = M, fe = Q.ignoreIllegals, ze = Q.language) : (ce("10.7.0", "highlight(lang, code, ...args) has been deprecated."), ce("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), ze = M, ke = Q), fe === void 0 && (fe = !0);
      const At = {
        code: ke,
        language: ze
      };
      Nu("before:highlight", At);
      const nn = At.result ? At.result : uu(At.language, At.code, fe);
      return nn.code = At.code, Nu("after:highlight", nn), nn;
    }
    function uu(M, Q, fe, ke) {
      const ze = /* @__PURE__ */ Object.create(null);
      function At(H, Y) {
        return H.keywords[Y];
      }
      function nn() {
        if (!ae.keywords) {
          Ve.addText(Ee);
          return;
        }
        let H = 0;
        ae.keywordPatternRe.lastIndex = 0;
        let Y = ae.keywordPatternRe.exec(Ee), de = "";
        for (; Y; ) {
          de += Ee.substring(H, Y.index);
          const ye = Rt.case_insensitive ? Y[0].toLowerCase() : Y[0], et = At(ae, ye);
          if (et) {
            const [Gt, ol] = et;
            if (Ve.addText(de), de = "", ze[ye] = (ze[ye] || 0) + 1, ze[ye] <= Hc && (Bu += ol), Gt.startsWith("_"))
              de += Y[0];
            else {
              const il = Rt.classNameAliases[Gt] || Gt;
              It(Y[0], il);
            }
          } else
            de += Y[0];
          H = ae.keywordPatternRe.lastIndex, Y = ae.keywordPatternRe.exec(Ee);
        }
        de += Ee.substring(H), Ve.addText(de);
      }
      function Ou() {
        if (Ee === "") return;
        let H = null;
        if (typeof ae.subLanguage == "string") {
          if (!w[ae.subLanguage]) {
            Ve.addText(Ee);
            return;
          }
          H = uu(ae.subLanguage, Ee, !0, Ci[ae.subLanguage]), Ci[ae.subLanguage] = /** @type {CompiledMode} */
          H._top;
        } else
          H = zr(Ee, ae.subLanguage.length ? ae.subLanguage : null);
        ae.relevance > 0 && (Bu += H.relevance), Ve.__addSublanguage(H._emitter, H.language);
      }
      function pt() {
        ae.subLanguage != null ? Ou() : nn(), Ee = "";
      }
      function It(H, Y) {
        H !== "" && (Ve.startScope(Y), Ve.addText(H), Ve.endScope());
      }
      function wi(H, Y) {
        let de = 1;
        const ye = Y.length - 1;
        for (; de <= ye; ) {
          if (!H._emit[de]) {
            de++;
            continue;
          }
          const et = Rt.classNameAliases[H[de]] || H[de], Gt = Y[de];
          et ? It(Gt, et) : (Ee = Gt, nn(), Ee = ""), de++;
        }
      }
      function vi(H, Y) {
        return H.scope && typeof H.scope == "string" && Ve.openNode(Rt.classNameAliases[H.scope] || H.scope), H.beginScope && (H.beginScope._wrap ? (It(Ee, Rt.classNameAliases[H.beginScope._wrap] || H.beginScope._wrap), Ee = "") : H.beginScope._multi && (wi(H.beginScope, Y), Ee = "")), ae = Object.create(H, { parent: { value: ae } }), ae;
      }
      function ki(H, Y, de) {
        let ye = T(H.endRe, de);
        if (ye) {
          if (H["on:end"]) {
            const et = new t(H);
            H["on:end"](Y, et), et.isMatchIgnored && (ye = !1);
          }
          if (ye) {
            for (; H.endsParent && H.parent; )
              H = H.parent;
            return H;
          }
        }
        if (H.endsWithParent)
          return ki(H.parent, Y, de);
      }
      function el(H) {
        return ae.matcher.regexIndex === 0 ? (Ee += H[0], 1) : (qr = !0, 0);
      }
      function tl(H) {
        const Y = H[0], de = H.rule, ye = new t(de), et = [de.__beforeBegin, de["on:begin"]];
        for (const Gt of et)
          if (Gt && (Gt(H, ye), ye.isMatchIgnored))
            return el(Y);
        return de.skip ? Ee += Y : (de.excludeBegin && (Ee += Y), pt(), !de.returnBegin && !de.excludeBegin && (Ee = Y)), vi(de, H), de.returnBegin ? 0 : Y.length;
      }
      function nl(H) {
        const Y = H[0], de = Q.substring(H.index), ye = ki(ae, H, de);
        if (!ye)
          return gi;
        const et = ae;
        ae.endScope && ae.endScope._wrap ? (pt(), It(Y, ae.endScope._wrap)) : ae.endScope && ae.endScope._multi ? (pt(), wi(ae.endScope, H)) : et.skip ? Ee += Y : (et.returnEnd || et.excludeEnd || (Ee += Y), pt(), et.excludeEnd && (Ee = Y));
        do
          ae.scope && Ve.closeNode(), !ae.skip && !ae.subLanguage && (Bu += ae.relevance), ae = ae.parent;
        while (ae !== ye.parent);
        return ye.starts && vi(ye.starts, H), et.returnEnd ? 0 : Y.length;
      }
      function ul() {
        const H = [];
        for (let Y = ae; Y !== Rt; Y = Y.parent)
          Y.scope && H.unshift(Y.scope);
        H.forEach((Y) => Ve.openNode(Y));
      }
      let Lu = {};
      function Ei(H, Y) {
        const de = Y && Y[0];
        if (Ee += H, de == null)
          return pt(), 0;
        if (Lu.type === "begin" && Y.type === "end" && Lu.index === Y.index && de === "") {
          if (Ee += Q.slice(Y.index, Y.index + 1), !Ne) {
            const ye = new Error(`0 width match regex (${M})`);
            throw ye.languageName = M, ye.badRule = Lu.rule, ye;
          }
          return 1;
        }
        if (Lu = Y, Y.type === "begin")
          return tl(Y);
        if (Y.type === "illegal" && !fe) {
          const ye = new Error('Illegal lexeme "' + de + '" for mode "' + (ae.scope || "<unnamed>") + '"');
          throw ye.mode = ae, ye;
        } else if (Y.type === "end") {
          const ye = nl(Y);
          if (ye !== gi)
            return ye;
        }
        if (Y.type === "illegal" && de === "")
          return Ee += `
`, 1;
        if (Ur > 1e5 && Ur > Y.index * 3)
          throw new Error("potential infinite loop, way more iterations than matches");
        return Ee += de, de.length;
      }
      const Rt = tn(M);
      if (!Rt)
        throw Z(Oe.replace("{}", M)), new Error('Unknown language: "' + M + '"');
      const rl = _n(Rt);
      let Hr = "", ae = ke || rl;
      const Ci = {}, Ve = new V.__emitter(V);
      ul();
      let Ee = "", Bu = 0, xn = 0, Ur = 0, qr = !1;
      try {
        if (Rt.__emitTokens)
          Rt.__emitTokens(Q, Ve);
        else {
          for (ae.matcher.considerAll(); ; ) {
            Ur++, qr ? qr = !1 : ae.matcher.considerAll(), ae.matcher.lastIndex = xn;
            const H = ae.matcher.exec(Q);
            if (!H) break;
            const Y = Q.substring(xn, H.index), de = Ei(Y, H);
            xn = H.index + de;
          }
          Ei(Q.substring(xn));
        }
        return Ve.finalize(), Hr = Ve.toHTML(), {
          language: M,
          value: Hr,
          relevance: Bu,
          illegal: !1,
          _emitter: Ve,
          _top: ae
        };
      } catch (H) {
        if (H.message && H.message.includes("Illegal"))
          return {
            language: M,
            value: Pr(Q),
            illegal: !0,
            relevance: 0,
            _illegalBy: {
              message: H.message,
              index: xn,
              context: Q.slice(xn - 100, xn + 100),
              mode: H.mode,
              resultSoFar: Hr
            },
            _emitter: Ve
          };
        if (Ne)
          return {
            language: M,
            value: Pr(Q),
            illegal: !1,
            relevance: 0,
            errorRaised: H,
            _emitter: Ve,
            _top: ae
          };
        throw H;
      }
    }
    function $r(M) {
      const Q = {
        value: Pr(M),
        illegal: !1,
        relevance: 0,
        _top: W,
        _emitter: new V.__emitter(V)
      };
      return Q._emitter.addText(M), Q;
    }
    function zr(M, Q) {
      Q = Q || V.languages || Object.keys(w);
      const fe = $r(M), ke = Q.filter(tn).filter(yi).map(
        (pt) => uu(pt, M, !1)
      );
      ke.unshift(fe);
      const ze = ke.sort((pt, It) => {
        if (pt.relevance !== It.relevance) return It.relevance - pt.relevance;
        if (pt.language && It.language) {
          if (tn(pt.language).supersetOf === It.language)
            return 1;
          if (tn(It.language).supersetOf === pt.language)
            return -1;
        }
        return 0;
      }), [At, nn] = ze, Ou = At;
      return Ou.secondBest = nn, Ou;
    }
    function Uc(M, Q, fe) {
      const ke = Q && $[Q] || fe;
      M.classList.add("hljs"), M.classList.add(`language-${ke}`);
    }
    function jr(M) {
      let Q = null;
      const fe = Ue(M);
      if (re(fe)) return;
      if (Nu(
        "before:highlightElement",
        { el: M, language: fe }
      ), M.dataset.highlighted) {
        console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", M);
        return;
      }
      if (M.children.length > 0 && (V.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(M)), V.throwUnescapedHTML))
        throw new Iu(
          "One of your code blocks includes unescaped HTML.",
          M.innerHTML
        );
      Q = M;
      const ke = Q.textContent, ze = fe ? Be(ke, { language: fe, ignoreIllegals: !0 }) : zr(ke);
      M.innerHTML = ze.value, M.dataset.highlighted = "yes", Uc(M, fe, ze.language), M.result = {
        language: ze.language,
        // TODO: remove with version 11.0
        re: ze.relevance,
        relevance: ze.relevance
      }, ze.secondBest && (M.secondBest = {
        language: ze.secondBest.language,
        relevance: ze.secondBest.relevance
      }), Nu("after:highlightElement", { el: M, result: ze, text: ke });
    }
    function qc(M) {
      V = bi(V, M);
    }
    const Gc = () => {
      Ru(), ce("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
    };
    function Vc() {
      Ru(), ce("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
    }
    let _i = !1;
    function Ru() {
      function M() {
        Ru();
      }
      if (document.readyState === "loading") {
        _i || window.addEventListener("DOMContentLoaded", M, !1), _i = !0;
        return;
      }
      document.querySelectorAll(V.cssSelector).forEach(jr);
    }
    function Kc(M, Q) {
      let fe = null;
      try {
        fe = Q(g);
      } catch (ke) {
        if (Z("Language definition for '{}' could not be registered.".replace("{}", M)), Ne)
          Z(ke);
        else
          throw ke;
        fe = W;
      }
      fe.name || (fe.name = M), w[M] = fe, fe.rawDefinition = Q.bind(null, g), fe.aliases && xi(fe.aliases, { languageName: M });
    }
    function Zc(M) {
      delete w[M];
      for (const Q of Object.keys($))
        $[Q] === M && delete $[Q];
    }
    function Wc() {
      return Object.keys(w);
    }
    function tn(M) {
      return M = (M || "").toLowerCase(), w[M] || w[$[M]];
    }
    function xi(M, { languageName: Q }) {
      typeof M == "string" && (M = [M]), M.forEach((fe) => {
        $[fe.toLowerCase()] = Q;
      });
    }
    function yi(M) {
      const Q = tn(M);
      return Q && !Q.disableAutodetect;
    }
    function Jc(M) {
      M["before:highlightBlock"] && !M["before:highlightElement"] && (M["before:highlightElement"] = (Q) => {
        M["before:highlightBlock"](
          Object.assign({ block: Q.el }, Q)
        );
      }), M["after:highlightBlock"] && !M["after:highlightElement"] && (M["after:highlightElement"] = (Q) => {
        M["after:highlightBlock"](
          Object.assign({ block: Q.el }, Q)
        );
      });
    }
    function Yc(M) {
      Jc(M), se.push(M);
    }
    function Xc(M) {
      const Q = se.indexOf(M);
      Q !== -1 && se.splice(Q, 1);
    }
    function Nu(M, Q) {
      const fe = M;
      se.forEach(function(ke) {
        ke[fe] && ke[fe](Q);
      });
    }
    function Qc(M) {
      return ce("10.7.0", "highlightBlock will be removed entirely in v12.0"), ce("10.7.0", "Please use highlightElement now."), jr(M);
    }
    Object.assign(g, {
      highlight: Be,
      highlightAuto: zr,
      highlightAll: Ru,
      highlightElement: jr,
      // TODO: Remove with v12 API
      highlightBlock: Qc,
      configure: qc,
      initHighlighting: Gc,
      initHighlightingOnLoad: Vc,
      registerLanguage: Kc,
      unregisterLanguage: Zc,
      listLanguages: Wc,
      getLanguage: tn,
      registerAliases: xi,
      autoDetection: yi,
      inherit: bi,
      addPlugin: Yc,
      removePlugin: Xc
    }), g.debugMode = function() {
      Ne = !1;
    }, g.safeMode = function() {
      Ne = !0;
    }, g.versionString = yt, g.regex = {
      concat: _,
      lookahead: h,
      either: P,
      optional: p,
      anyNumberOfTimes: f
    };
    for (const M in Ft)
      typeof Ft[M] == "object" && e(Ft[M]);
    return Object.assign(g, Ft), g;
  }, In = mi({});
  return In.newInstance = () => mi({}), oo = In, In.HighlightJS = In, In.default = In, oo;
}
var wh = /* @__PURE__ */ yh();
const kn = /* @__PURE__ */ xh(wh), hs = {};
function vh(e) {
  let t = hs[e];
  if (t)
    return t;
  t = hs[e] = [];
  for (let n = 0; n < 128; n++) {
    const u = String.fromCharCode(n);
    t.push(u);
  }
  for (let n = 0; n < e.length; n++) {
    const u = e.charCodeAt(n);
    t[u] = "%" + ("0" + u.toString(16).toUpperCase()).slice(-2);
  }
  return t;
}
function Jn(e, t) {
  typeof t != "string" && (t = Jn.defaultChars);
  const n = vh(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(u) {
    let r = "";
    for (let o = 0, i = u.length; o < i; o += 3) {
      const s = parseInt(u.slice(o + 1, o + 3), 16);
      if (s < 128) {
        r += n[s];
        continue;
      }
      if ((s & 224) === 192 && o + 3 < i) {
        const a = parseInt(u.slice(o + 4, o + 6), 16);
        if ((a & 192) === 128) {
          const c = s << 6 & 1984 | a & 63;
          c < 128 ? r += "��" : r += String.fromCharCode(c), o += 3;
          continue;
        }
      }
      if ((s & 240) === 224 && o + 6 < i) {
        const a = parseInt(u.slice(o + 4, o + 6), 16), c = parseInt(u.slice(o + 7, o + 9), 16);
        if ((a & 192) === 128 && (c & 192) === 128) {
          const l = s << 12 & 61440 | a << 6 & 4032 | c & 63;
          l < 2048 || l >= 55296 && l <= 57343 ? r += "���" : r += String.fromCharCode(l), o += 6;
          continue;
        }
      }
      if ((s & 248) === 240 && o + 9 < i) {
        const a = parseInt(u.slice(o + 4, o + 6), 16), c = parseInt(u.slice(o + 7, o + 9), 16), l = parseInt(u.slice(o + 10, o + 12), 16);
        if ((a & 192) === 128 && (c & 192) === 128 && (l & 192) === 128) {
          let d = s << 18 & 1835008 | a << 12 & 258048 | c << 6 & 4032 | l & 63;
          d < 65536 || d > 1114111 ? r += "����" : (d -= 65536, r += String.fromCharCode(55296 + (d >> 10), 56320 + (d & 1023))), o += 9;
          continue;
        }
      }
      r += "�";
    }
    return r;
  });
}
Jn.defaultChars = ";/?:@&=+$,#";
Jn.componentChars = "";
const ps = {};
function kh(e) {
  let t = ps[e];
  if (t)
    return t;
  t = ps[e] = [];
  for (let n = 0; n < 128; n++) {
    const u = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(u) ? t.push(u) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++)
    t[e.charCodeAt(n)] = e[n];
  return t;
}
function Tu(e, t, n) {
  typeof t != "string" && (n = t, t = Tu.defaultChars), typeof n > "u" && (n = !0);
  const u = kh(t);
  let r = "";
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e.charCodeAt(o);
    if (n && s === 37 && o + 2 < i && /^[0-9a-f]{2}$/i.test(e.slice(o + 1, o + 3))) {
      r += e.slice(o, o + 3), o += 2;
      continue;
    }
    if (s < 128) {
      r += u[s];
      continue;
    }
    if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && o + 1 < i) {
        const a = e.charCodeAt(o + 1);
        if (a >= 56320 && a <= 57343) {
          r += encodeURIComponent(e[o] + e[o + 1]), o++;
          continue;
        }
      }
      r += "%EF%BF%BD";
      continue;
    }
    r += encodeURIComponent(e[o]);
  }
  return r;
}
Tu.defaultChars = ";/?:@&=+$,-_.!~*'()#";
Tu.componentChars = "-_.!~*'()";
function oi(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function ar() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const Eh = /^([a-z0-9.+-]+:)/i, Ch = /:[0-9]*$/, Ah = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, Sh = ["<", ">", '"', "`", " ", "\r", `
`, "	"], Dh = ["{", "}", "|", "\\", "^", "`"].concat(Sh), Th = ["'"].concat(Dh), bs = ["%", "/", "?", ";", "#"].concat(Th), gs = ["/", "?", "#"], Mh = 255, ms = /^[+a-z0-9A-Z_-]{0,63}$/, Fh = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, _s = {
  javascript: !0,
  "javascript:": !0
}, xs = {
  http: !0,
  https: !0,
  ftp: !0,
  gopher: !0,
  file: !0,
  "http:": !0,
  "https:": !0,
  "ftp:": !0,
  "gopher:": !0,
  "file:": !0
};
function ii(e, t) {
  if (e && e instanceof ar) return e;
  const n = new ar();
  return n.parse(e, t), n;
}
ar.prototype.parse = function(e, t) {
  let n, u, r, o = e;
  if (o = o.trim(), !t && e.split("#").length === 1) {
    const c = Ah.exec(o);
    if (c)
      return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let i = Eh.exec(o);
  if (i && (i = i[0], n = i.toLowerCase(), this.protocol = i, o = o.substr(i.length)), (t || i || o.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = o.substr(0, 2) === "//", r && !(i && _s[i]) && (o = o.substr(2), this.slashes = !0)), !_s[i] && (r || i && !xs[i])) {
    let c = -1;
    for (let p = 0; p < gs.length; p++)
      u = o.indexOf(gs[p]), u !== -1 && (c === -1 || u < c) && (c = u);
    let l, d;
    c === -1 ? d = o.lastIndexOf("@") : d = o.lastIndexOf("@", c), d !== -1 && (l = o.slice(0, d), o = o.slice(d + 1), this.auth = l), c = -1;
    for (let p = 0; p < bs.length; p++)
      u = o.indexOf(bs[p]), u !== -1 && (c === -1 || u < c) && (c = u);
    c === -1 && (c = o.length), o[c - 1] === ":" && c--;
    const h = o.slice(0, c);
    o = o.slice(c), this.parseHost(h), this.hostname = this.hostname || "";
    const f = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!f) {
      const p = this.hostname.split(/\./);
      for (let _ = 0, O = p.length; _ < O; _++) {
        const P = p[_];
        if (P && !P.match(ms)) {
          let A = "";
          for (let T = 0, v = P.length; T < v; T++)
            P.charCodeAt(T) > 127 ? A += "x" : A += P[T];
          if (!A.match(ms)) {
            const T = p.slice(0, _), v = p.slice(_ + 1), x = P.match(Fh);
            x && (T.push(x[1]), v.unshift(x[2])), v.length && (o = v.join(".") + o), this.hostname = T.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Mh && (this.hostname = ""), f && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const s = o.indexOf("#");
  s !== -1 && (this.hash = o.substr(s), o = o.slice(0, s));
  const a = o.indexOf("?");
  return a !== -1 && (this.search = o.substr(a), o = o.slice(0, a)), o && (this.pathname = o), xs[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
ar.prototype.parseHost = function(e) {
  let t = Ch.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
const Ih = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: Jn,
  encode: Tu,
  format: oi,
  parse: ii
}, Symbol.toStringTag, { value: "Module" })), rc = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, oc = /[\0-\x1F\x7F-\x9F]/, Rh = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, si = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, ic = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, sc = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Nh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: rc,
  Cc: oc,
  Cf: Rh,
  P: si,
  S: ic,
  Z: sc
}, Symbol.toStringTag, { value: "Module" })), Oh = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((e) => e.charCodeAt(0))
), Lh = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((e) => e.charCodeAt(0))
);
var io;
const Bh = /* @__PURE__ */ new Map([
  [0, 65533],
  // C1 Unicode control character reference replacements
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]), Ph = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (io = String.fromCodePoint) !== null && io !== void 0 ? io : function(e) {
    let t = "";
    return e > 65535 && (e -= 65536, t += String.fromCharCode(e >>> 10 & 1023 | 55296), e = 56320 | e & 1023), t += String.fromCharCode(e), t;
  }
);
function $h(e) {
  var t;
  return e >= 55296 && e <= 57343 || e > 1114111 ? 65533 : (t = Bh.get(e)) !== null && t !== void 0 ? t : e;
}
var Ge;
(function(e) {
  e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_F = 102] = "LOWER_F", e[e.LOWER_X = 120] = "LOWER_X", e[e.LOWER_Z = 122] = "LOWER_Z", e[e.UPPER_A = 65] = "UPPER_A", e[e.UPPER_F = 70] = "UPPER_F", e[e.UPPER_Z = 90] = "UPPER_Z";
})(Ge || (Ge = {}));
const zh = 32;
var dn;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE";
})(dn || (dn = {}));
function To(e) {
  return e >= Ge.ZERO && e <= Ge.NINE;
}
function jh(e) {
  return e >= Ge.UPPER_A && e <= Ge.UPPER_F || e >= Ge.LOWER_A && e <= Ge.LOWER_F;
}
function Hh(e) {
  return e >= Ge.UPPER_A && e <= Ge.UPPER_Z || e >= Ge.LOWER_A && e <= Ge.LOWER_Z || To(e);
}
function Uh(e) {
  return e === Ge.EQUALS || Hh(e);
}
var qe;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(qe || (qe = {}));
var ln;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(ln || (ln = {}));
class qh {
  constructor(t, n, u) {
    this.decodeTree = t, this.emitCodePoint = n, this.errors = u, this.state = qe.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = ln.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(t) {
    this.decodeMode = t, this.state = qe.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   *
   * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
   * entity is incomplete, and resume when the next string is written.
   *
   * @param string The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(t, n) {
    switch (this.state) {
      case qe.EntityStart:
        return t.charCodeAt(n) === Ge.NUM ? (this.state = qe.NumericStart, this.consumed += 1, this.stateNumericStart(t, n + 1)) : (this.state = qe.NamedEntity, this.stateNamedEntity(t, n));
      case qe.NumericStart:
        return this.stateNumericStart(t, n);
      case qe.NumericDecimal:
        return this.stateNumericDecimal(t, n);
      case qe.NumericHex:
        return this.stateNumericHex(t, n);
      case qe.NamedEntity:
        return this.stateNamedEntity(t, n);
    }
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(t, n) {
    return n >= t.length ? -1 : (t.charCodeAt(n) | zh) === Ge.LOWER_X ? (this.state = qe.NumericHex, this.consumed += 1, this.stateNumericHex(t, n + 1)) : (this.state = qe.NumericDecimal, this.stateNumericDecimal(t, n));
  }
  addToNumericResult(t, n, u, r) {
    if (n !== u) {
      const o = u - n;
      this.result = this.result * Math.pow(r, o) + parseInt(t.substr(n, o), r), this.consumed += o;
    }
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexademical character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(t, n) {
    const u = n;
    for (; n < t.length; ) {
      const r = t.charCodeAt(n);
      if (To(r) || jh(r))
        n += 1;
      else
        return this.addToNumericResult(t, u, n, 16), this.emitNumericEntity(r, 3);
    }
    return this.addToNumericResult(t, u, n, 16), -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(t, n) {
    const u = n;
    for (; n < t.length; ) {
      const r = t.charCodeAt(n);
      if (To(r))
        n += 1;
      else
        return this.addToNumericResult(t, u, n, 10), this.emitNumericEntity(r, 2);
    }
    return this.addToNumericResult(t, u, n, 10), -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexademical character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   *
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(t, n) {
    var u;
    if (this.consumed <= n)
      return (u = this.errors) === null || u === void 0 || u.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (t === Ge.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === ln.Strict)
      return 0;
    return this.emitCodePoint($h(this.result), this.consumed), this.errors && (t !== Ge.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
  }
  /**
   * Parses a named entity.
   *
   * Equivalent to the `Named character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNamedEntity(t, n) {
    const { decodeTree: u } = this;
    let r = u[this.treeIndex], o = (r & dn.VALUE_LENGTH) >> 14;
    for (; n < t.length; n++, this.excess++) {
      const i = t.charCodeAt(n);
      if (this.treeIndex = Gh(u, r, this.treeIndex + Math.max(1, o), i), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === ln.Attribute && // We shouldn't have consumed any characters after the entity,
        (o === 0 || // And there should be no invalid characters.
        Uh(i)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (r = u[this.treeIndex], o = (r & dn.VALUE_LENGTH) >> 14, o !== 0) {
        if (i === Ge.SEMI)
          return this.emitNamedEntityData(this.treeIndex, o, this.consumed + this.excess);
        this.decodeMode !== ln.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
      }
    }
    return -1;
  }
  /**
   * Emit a named entity that was not terminated with a semicolon.
   *
   * @returns The number of characters consumed.
   */
  emitNotTerminatedNamedEntity() {
    var t;
    const { result: n, decodeTree: u } = this, r = (u[n] & dn.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(n, r, this.consumed), (t = this.errors) === null || t === void 0 || t.missingSemicolonAfterCharacterReference(), this.consumed;
  }
  /**
   * Emit a named entity.
   *
   * @param result The index of the entity in the decode tree.
   * @param valueLength The number of bytes in the entity.
   * @param consumed The number of characters consumed.
   *
   * @returns The number of characters consumed.
   */
  emitNamedEntityData(t, n, u) {
    const { decodeTree: r } = this;
    return this.emitCodePoint(n === 1 ? r[t] & ~dn.VALUE_LENGTH : r[t + 1], u), n === 3 && this.emitCodePoint(r[t + 2], u), u;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   *
   * @returns The number of characters consumed.
   */
  end() {
    var t;
    switch (this.state) {
      case qe.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== ln.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      // Otherwise, emit a numeric entity if we have one.
      case qe.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case qe.NumericHex:
        return this.emitNumericEntity(0, 3);
      case qe.NumericStart:
        return (t = this.errors) === null || t === void 0 || t.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case qe.EntityStart:
        return 0;
    }
  }
}
function ac(e) {
  let t = "";
  const n = new qh(e, (u) => t += Ph(u));
  return function(r, o) {
    let i = 0, s = 0;
    for (; (s = r.indexOf("&", s)) >= 0; ) {
      t += r.slice(i, s), n.startEntity(o);
      const c = n.write(
        r,
        // Skip the "&"
        s + 1
      );
      if (c < 0) {
        i = s + n.end();
        break;
      }
      i = s + c, s = c === 0 ? i + 1 : i;
    }
    const a = t + r.slice(i);
    return t = "", a;
  };
}
function Gh(e, t, n, u) {
  const r = (t & dn.BRANCH_LENGTH) >> 7, o = t & dn.JUMP_TABLE;
  if (r === 0)
    return o !== 0 && u === o ? n : -1;
  if (o) {
    const a = u - o;
    return a < 0 || a >= r ? -1 : e[n + a] - 1;
  }
  let i = n, s = i + r - 1;
  for (; i <= s; ) {
    const a = i + s >>> 1, c = e[a];
    if (c < u)
      i = a + 1;
    else if (c > u)
      s = a - 1;
    else
      return e[a + r];
  }
  return -1;
}
const Vh = ac(Oh);
ac(Lh);
function cc(e, t = ln.Legacy) {
  return Vh(e, t);
}
function Kh(e) {
  return Object.prototype.toString.call(e);
}
function ai(e) {
  return Kh(e) === "[object String]";
}
const Zh = Object.prototype.hasOwnProperty;
function Wh(e, t) {
  return Zh.call(e, t);
}
function Mr(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be object");
      Object.keys(n).forEach(function(u) {
        e[u] = n[u];
      });
    }
  }), e;
}
function lc(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function ci(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) === 65535 || (e & 65535) === 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function cr(e) {
  if (e > 65535) {
    e -= 65536;
    const t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
const dc = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, Jh = /&([a-z#][a-z0-9]{1,31});/gi, Yh = new RegExp(dc.source + "|" + Jh.source, "gi"), Xh = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function Qh(e, t) {
  if (t.charCodeAt(0) === 35 && Xh.test(t)) {
    const u = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return ci(u) ? cr(u) : e;
  }
  const n = cc(e);
  return n !== e ? n : e;
}
function e1(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(dc, "$1");
}
function Yn(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(Yh, function(t, n, u) {
    return n || Qh(t, u);
  });
}
const t1 = /[&<>"]/, n1 = /[&<>"]/g, u1 = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function r1(e) {
  return u1[e];
}
function gn(e) {
  return t1.test(e) ? e.replace(n1, r1) : e;
}
const o1 = /[.?*+^$[\]\\(){}|-]/g;
function i1(e) {
  return e.replace(o1, "\\$&");
}
function Ae(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function wu(e) {
  if (e >= 8192 && e <= 8202)
    return !0;
  switch (e) {
    case 9:
    // \t
    case 10:
    // \n
    case 11:
    // \v
    case 12:
    // \f
    case 13:
    // \r
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function vu(e) {
  return si.test(e) || ic.test(e);
}
function ku(e) {
  switch (e) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function Fr(e) {
  return e = e.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (e = e.replace(/ẞ/g, "ß")), e.toLowerCase().toUpperCase();
}
const s1 = { mdurl: Ih, ucmicro: Nh }, a1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: lc,
  assign: Mr,
  escapeHtml: gn,
  escapeRE: i1,
  fromCodePoint: cr,
  has: Wh,
  isMdAsciiPunct: ku,
  isPunctChar: vu,
  isSpace: Ae,
  isString: ai,
  isValidEntityCode: ci,
  isWhiteSpace: wu,
  lib: s1,
  normalizeReference: Fr,
  unescapeAll: Yn,
  unescapeMd: e1
}, Symbol.toStringTag, { value: "Module" }));
function c1(e, t, n) {
  let u, r, o, i;
  const s = e.posMax, a = e.pos;
  for (e.pos = t + 1, u = 1; e.pos < s; ) {
    if (o = e.src.charCodeAt(e.pos), o === 93 && (u--, u === 0)) {
      r = !0;
      break;
    }
    if (i = e.pos, e.md.inline.skipToken(e), o === 91) {
      if (i === e.pos - 1)
        u++;
      else if (n)
        return e.pos = a, -1;
    }
  }
  let c = -1;
  return r && (c = e.pos), e.pos = a, c;
}
function l1(e, t, n) {
  let u, r = t;
  const o = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(r) === 60) {
    for (r++; r < n; ) {
      if (u = e.charCodeAt(r), u === 10 || u === 60)
        return o;
      if (u === 62)
        return o.pos = r + 1, o.str = Yn(e.slice(t + 1, r)), o.ok = !0, o;
      if (u === 92 && r + 1 < n) {
        r += 2;
        continue;
      }
      r++;
    }
    return o;
  }
  let i = 0;
  for (; r < n && (u = e.charCodeAt(r), !(u === 32 || u < 32 || u === 127)); ) {
    if (u === 92 && r + 1 < n) {
      if (e.charCodeAt(r + 1) === 32)
        break;
      r += 2;
      continue;
    }
    if (u === 40 && (i++, i > 32))
      return o;
    if (u === 41) {
      if (i === 0)
        break;
      i--;
    }
    r++;
  }
  return t === r || i !== 0 || (o.str = Yn(e.slice(t, r)), o.pos = r, o.ok = !0), o;
}
function d1(e, t, n, u) {
  let r, o = t;
  const i = {
    // if `true`, this is a valid link title
    ok: !1,
    // if `true`, this link can be continued on the next line
    can_continue: !1,
    // if `ok`, it's the position of the first character after the closing marker
    pos: 0,
    // if `ok`, it's the unescaped title
    str: "",
    // expected closing marker character code
    marker: 0
  };
  if (u)
    i.str = u.str, i.marker = u.marker;
  else {
    if (o >= n)
      return i;
    let s = e.charCodeAt(o);
    if (s !== 34 && s !== 39 && s !== 40)
      return i;
    t++, o++, s === 40 && (s = 41), i.marker = s;
  }
  for (; o < n; ) {
    if (r = e.charCodeAt(o), r === i.marker)
      return i.pos = o + 1, i.str += Yn(e.slice(t, o)), i.ok = !0, i;
    if (r === 40 && i.marker === 41)
      return i;
    r === 92 && o + 1 < n && o++, o++;
  }
  return i.can_continue = !0, i.str += Yn(e.slice(t, o)), i;
}
const f1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: l1,
  parseLinkLabel: c1,
  parseLinkTitle: d1
}, Symbol.toStringTag, { value: "Module" })), Ut = {};
Ut.code_inline = function(e, t, n, u, r) {
  const o = e[t];
  return "<code" + r.renderAttrs(o) + ">" + gn(o.content) + "</code>";
};
Ut.code_block = function(e, t, n, u, r) {
  const o = e[t];
  return "<pre" + r.renderAttrs(o) + "><code>" + gn(e[t].content) + `</code></pre>
`;
};
Ut.fence = function(e, t, n, u, r) {
  const o = e[t], i = o.info ? Yn(o.info).trim() : "";
  let s = "", a = "";
  if (i) {
    const l = i.split(/(\s+)/g);
    s = l[0], a = l.slice(2).join("");
  }
  let c;
  if (n.highlight ? c = n.highlight(o.content, s, a) || gn(o.content) : c = gn(o.content), c.indexOf("<pre") === 0)
    return c + `
`;
  if (i) {
    const l = o.attrIndex("class"), d = o.attrs ? o.attrs.slice() : [];
    l < 0 ? d.push(["class", n.langPrefix + s]) : (d[l] = d[l].slice(), d[l][1] += " " + n.langPrefix + s);
    const h = {
      attrs: d
    };
    return `<pre><code${r.renderAttrs(h)}>${c}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(o)}>${c}</code></pre>
`;
};
Ut.image = function(e, t, n, u, r) {
  const o = e[t];
  return o.attrs[o.attrIndex("alt")][1] = r.renderInlineAsText(o.children, n, u), r.renderToken(e, t, n);
};
Ut.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
};
Ut.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
Ut.text = function(e, t) {
  return gn(e[t].content);
};
Ut.html_block = function(e, t) {
  return e[t].content;
};
Ut.html_inline = function(e, t) {
  return e[t].content;
};
function eu() {
  this.rules = Mr({}, Ut);
}
eu.prototype.renderAttrs = function(t) {
  let n, u, r;
  if (!t.attrs)
    return "";
  for (r = "", n = 0, u = t.attrs.length; n < u; n++)
    r += " " + gn(t.attrs[n][0]) + '="' + gn(t.attrs[n][1]) + '"';
  return r;
};
eu.prototype.renderToken = function(t, n, u) {
  const r = t[n];
  let o = "";
  if (r.hidden)
    return "";
  r.block && r.nesting !== -1 && n && t[n - 1].hidden && (o += `
`), o += (r.nesting === -1 ? "</" : "<") + r.tag, o += this.renderAttrs(r), r.nesting === 0 && u.xhtmlOut && (o += " /");
  let i = !1;
  if (r.block && (i = !0, r.nesting === 1 && n + 1 < t.length)) {
    const s = t[n + 1];
    (s.type === "inline" || s.hidden || s.nesting === -1 && s.tag === r.tag) && (i = !1);
  }
  return o += i ? `>
` : ">", o;
};
eu.prototype.renderInline = function(e, t, n) {
  let u = "";
  const r = this.rules;
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e[o].type;
    typeof r[s] < "u" ? u += r[s](e, o, t, n, this) : u += this.renderToken(e, o, t);
  }
  return u;
};
eu.prototype.renderInlineAsText = function(e, t, n) {
  let u = "";
  for (let r = 0, o = e.length; r < o; r++)
    switch (e[r].type) {
      case "text":
        u += e[r].content;
        break;
      case "image":
        u += this.renderInlineAsText(e[r].children, t, n);
        break;
      case "html_inline":
      case "html_block":
        u += e[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        u += `
`;
        break;
    }
  return u;
};
eu.prototype.render = function(e, t, n) {
  let u = "";
  const r = this.rules;
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e[o].type;
    s === "inline" ? u += this.renderInline(e[o].children, t, n) : typeof r[s] < "u" ? u += r[s](e, o, t, n, this) : u += this.renderToken(e, o, t, n);
  }
  return u;
};
function ft() {
  this.__rules__ = [], this.__cache__ = null;
}
ft.prototype.__find__ = function(e) {
  for (let t = 0; t < this.__rules__.length; t++)
    if (this.__rules__[t].name === e)
      return t;
  return -1;
};
ft.prototype.__compile__ = function() {
  const e = this, t = [""];
  e.__rules__.forEach(function(n) {
    n.enabled && n.alt.forEach(function(u) {
      t.indexOf(u) < 0 && t.push(u);
    });
  }), e.__cache__ = {}, t.forEach(function(n) {
    e.__cache__[n] = [], e.__rules__.forEach(function(u) {
      u.enabled && (n && u.alt.indexOf(n) < 0 || e.__cache__[n].push(u.fn));
    });
  });
};
ft.prototype.at = function(e, t, n) {
  const u = this.__find__(e), r = n || {};
  if (u === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__[u].fn = t, this.__rules__[u].alt = r.alt || [], this.__cache__ = null;
};
ft.prototype.before = function(e, t, n, u) {
  const r = this.__find__(e), o = u || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(r, 0, {
    name: t,
    enabled: !0,
    fn: n,
    alt: o.alt || []
  }), this.__cache__ = null;
};
ft.prototype.after = function(e, t, n, u) {
  const r = this.__find__(e), o = u || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(r + 1, 0, {
    name: t,
    enabled: !0,
    fn: n,
    alt: o.alt || []
  }), this.__cache__ = null;
};
ft.prototype.push = function(e, t, n) {
  const u = n || {};
  this.__rules__.push({
    name: e,
    enabled: !0,
    fn: t,
    alt: u.alt || []
  }), this.__cache__ = null;
};
ft.prototype.enable = function(e, t) {
  Array.isArray(e) || (e = [e]);
  const n = [];
  return e.forEach(function(u) {
    const r = this.__find__(u);
    if (r < 0) {
      if (t)
        return;
      throw new Error("Rules manager: invalid rule name " + u);
    }
    this.__rules__[r].enabled = !0, n.push(u);
  }, this), this.__cache__ = null, n;
};
ft.prototype.enableOnly = function(e, t) {
  Array.isArray(e) || (e = [e]), this.__rules__.forEach(function(n) {
    n.enabled = !1;
  }), this.enable(e, t);
};
ft.prototype.disable = function(e, t) {
  Array.isArray(e) || (e = [e]);
  const n = [];
  return e.forEach(function(u) {
    const r = this.__find__(u);
    if (r < 0) {
      if (t)
        return;
      throw new Error("Rules manager: invalid rule name " + u);
    }
    this.__rules__[r].enabled = !1, n.push(u);
  }, this), this.__cache__ = null, n;
};
ft.prototype.getRules = function(e) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[e] || [];
};
function Tt(e, t, n) {
  this.type = e, this.tag = t, this.attrs = null, this.map = null, this.nesting = n, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
Tt.prototype.attrIndex = function(t) {
  if (!this.attrs)
    return -1;
  const n = this.attrs;
  for (let u = 0, r = n.length; u < r; u++)
    if (n[u][0] === t)
      return u;
  return -1;
};
Tt.prototype.attrPush = function(t) {
  this.attrs ? this.attrs.push(t) : this.attrs = [t];
};
Tt.prototype.attrSet = function(t, n) {
  const u = this.attrIndex(t), r = [t, n];
  u < 0 ? this.attrPush(r) : this.attrs[u] = r;
};
Tt.prototype.attrGet = function(t) {
  const n = this.attrIndex(t);
  let u = null;
  return n >= 0 && (u = this.attrs[n][1]), u;
};
Tt.prototype.attrJoin = function(t, n) {
  const u = this.attrIndex(t);
  u < 0 ? this.attrPush([t, n]) : this.attrs[u][1] = this.attrs[u][1] + " " + n;
};
function fc(e, t, n) {
  this.src = e, this.env = n, this.tokens = [], this.inlineMode = !1, this.md = t;
}
fc.prototype.Token = Tt;
const h1 = /\r\n?|\n/g, p1 = /\0/g;
function b1(e) {
  let t;
  t = e.src.replace(h1, `
`), t = t.replace(p1, "�"), e.src = t;
}
function g1(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function m1(e) {
  const t = e.tokens;
  for (let n = 0, u = t.length; n < u; n++) {
    const r = t[n];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function _1(e) {
  return /^<a[>\s]/i.test(e);
}
function x1(e) {
  return /^<\/a\s*>/i.test(e);
}
function y1(e) {
  const t = e.tokens;
  if (e.md.options.linkify)
    for (let n = 0, u = t.length; n < u; n++) {
      if (t[n].type !== "inline" || !e.md.linkify.pretest(t[n].content))
        continue;
      let r = t[n].children, o = 0;
      for (let i = r.length - 1; i >= 0; i--) {
        const s = r[i];
        if (s.type === "link_close") {
          for (i--; r[i].level !== s.level && r[i].type !== "link_open"; )
            i--;
          continue;
        }
        if (s.type === "html_inline" && (_1(s.content) && o > 0 && o--, x1(s.content) && o++), !(o > 0) && s.type === "text" && e.md.linkify.test(s.content)) {
          const a = s.content;
          let c = e.md.linkify.match(a);
          const l = [];
          let d = s.level, h = 0;
          c.length > 0 && c[0].index === 0 && i > 0 && r[i - 1].type === "text_special" && (c = c.slice(1));
          for (let f = 0; f < c.length; f++) {
            const p = c[f].url, _ = e.md.normalizeLink(p);
            if (!e.md.validateLink(_))
              continue;
            let O = c[f].text;
            c[f].schema ? c[f].schema === "mailto:" && !/^mailto:/i.test(O) ? O = e.md.normalizeLinkText("mailto:" + O).replace(/^mailto:/, "") : O = e.md.normalizeLinkText(O) : O = e.md.normalizeLinkText("http://" + O).replace(/^http:\/\//, "");
            const P = c[f].index;
            if (P > h) {
              const x = new e.Token("text", "", 0);
              x.content = a.slice(h, P), x.level = d, l.push(x);
            }
            const A = new e.Token("link_open", "a", 1);
            A.attrs = [["href", _]], A.level = d++, A.markup = "linkify", A.info = "auto", l.push(A);
            const T = new e.Token("text", "", 0);
            T.content = O, T.level = d, l.push(T);
            const v = new e.Token("link_close", "a", -1);
            v.level = --d, v.markup = "linkify", v.info = "auto", l.push(v), h = c[f].lastIndex;
          }
          if (h < a.length) {
            const f = new e.Token("text", "", 0);
            f.content = a.slice(h), f.level = d, l.push(f);
          }
          t[n].children = r = lc(r, i, l);
        }
      }
    }
}
const hc = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, w1 = /\((c|tm|r)\)/i, v1 = /\((c|tm|r)\)/ig, k1 = {
  c: "©",
  r: "®",
  tm: "™"
};
function E1(e, t) {
  return k1[t.toLowerCase()];
}
function C1(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    const u = e[n];
    u.type === "text" && !t && (u.content = u.content.replace(v1, E1)), u.type === "link_open" && u.info === "auto" && t--, u.type === "link_close" && u.info === "auto" && t++;
  }
}
function A1(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    const u = e[n];
    u.type === "text" && !t && hc.test(u.content) && (u.content = u.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), u.type === "link_open" && u.info === "auto" && t--, u.type === "link_close" && u.info === "auto" && t++;
  }
}
function S1(e) {
  let t;
  if (e.md.options.typographer)
    for (t = e.tokens.length - 1; t >= 0; t--)
      e.tokens[t].type === "inline" && (w1.test(e.tokens[t].content) && C1(e.tokens[t].children), hc.test(e.tokens[t].content) && A1(e.tokens[t].children));
}
const D1 = /['"]/, ys = /['"]/g, ws = "’";
function Uu(e, t, n) {
  return e.slice(0, t) + n + e.slice(t + 1);
}
function T1(e, t) {
  let n;
  const u = [];
  for (let r = 0; r < e.length; r++) {
    const o = e[r], i = e[r].level;
    for (n = u.length - 1; n >= 0 && !(u[n].level <= i); n--)
      ;
    if (u.length = n + 1, o.type !== "text")
      continue;
    let s = o.content, a = 0, c = s.length;
    e:
      for (; a < c; ) {
        ys.lastIndex = a;
        const l = ys.exec(s);
        if (!l)
          break;
        let d = !0, h = !0;
        a = l.index + 1;
        const f = l[0] === "'";
        let p = 32;
        if (l.index - 1 >= 0)
          p = s.charCodeAt(l.index - 1);
        else
          for (n = r - 1; n >= 0 && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n--)
            if (e[n].content) {
              p = e[n].content.charCodeAt(e[n].content.length - 1);
              break;
            }
        let _ = 32;
        if (a < c)
          _ = s.charCodeAt(a);
        else
          for (n = r + 1; n < e.length && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n++)
            if (e[n].content) {
              _ = e[n].content.charCodeAt(0);
              break;
            }
        const O = ku(p) || vu(String.fromCharCode(p)), P = ku(_) || vu(String.fromCharCode(_)), A = wu(p), T = wu(_);
        if (T ? d = !1 : P && (A || O || (d = !1)), A ? h = !1 : O && (T || P || (h = !1)), _ === 34 && l[0] === '"' && p >= 48 && p <= 57 && (h = d = !1), d && h && (d = O, h = P), !d && !h) {
          f && (o.content = Uu(o.content, l.index, ws));
          continue;
        }
        if (h)
          for (n = u.length - 1; n >= 0; n--) {
            let v = u[n];
            if (u[n].level < i)
              break;
            if (v.single === f && u[n].level === i) {
              v = u[n];
              let x, L;
              f ? (x = t.md.options.quotes[2], L = t.md.options.quotes[3]) : (x = t.md.options.quotes[0], L = t.md.options.quotes[1]), o.content = Uu(o.content, l.index, L), e[v.token].content = Uu(
                e[v.token].content,
                v.pos,
                x
              ), a += L.length - 1, v.token === r && (a += x.length - 1), s = o.content, c = s.length, u.length = n;
              continue e;
            }
          }
        d ? u.push({
          token: r,
          pos: l.index,
          single: f,
          level: i
        }) : h && f && (o.content = Uu(o.content, l.index, ws));
      }
  }
}
function M1(e) {
  if (e.md.options.typographer)
    for (let t = e.tokens.length - 1; t >= 0; t--)
      e.tokens[t].type !== "inline" || !D1.test(e.tokens[t].content) || T1(e.tokens[t].children, e);
}
function F1(e) {
  let t, n;
  const u = e.tokens, r = u.length;
  for (let o = 0; o < r; o++) {
    if (u[o].type !== "inline") continue;
    const i = u[o].children, s = i.length;
    for (t = 0; t < s; t++)
      i[t].type === "text_special" && (i[t].type = "text");
    for (t = n = 0; t < s; t++)
      i[t].type === "text" && t + 1 < s && i[t + 1].type === "text" ? i[t + 1].content = i[t].content + i[t + 1].content : (t !== n && (i[n] = i[t]), n++);
    t !== n && (i.length = n);
  }
}
const so = [
  ["normalize", b1],
  ["block", g1],
  ["inline", m1],
  ["linkify", y1],
  ["replacements", S1],
  ["smartquotes", M1],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", F1]
];
function li() {
  this.ruler = new ft();
  for (let e = 0; e < so.length; e++)
    this.ruler.push(so[e][0], so[e][1]);
}
li.prototype.process = function(e) {
  const t = this.ruler.getRules("");
  for (let n = 0, u = t.length; n < u; n++)
    t[n](e);
};
li.prototype.State = fc;
function qt(e, t, n, u) {
  this.src = e, this.md = t, this.env = n, this.tokens = u, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const r = this.src;
  for (let o = 0, i = 0, s = 0, a = 0, c = r.length, l = !1; i < c; i++) {
    const d = r.charCodeAt(i);
    if (!l)
      if (Ae(d)) {
        s++, d === 9 ? a += 4 - a % 4 : a++;
        continue;
      } else
        l = !0;
    (d === 10 || i === c - 1) && (d !== 10 && i++, this.bMarks.push(o), this.eMarks.push(i), this.tShift.push(s), this.sCount.push(a), this.bsCount.push(0), l = !1, s = 0, a = 0, o = i + 1);
  }
  this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
qt.prototype.push = function(e, t, n) {
  const u = new Tt(e, t, n);
  return u.block = !0, n < 0 && this.level--, u.level = this.level, n > 0 && this.level++, this.tokens.push(u), u;
};
qt.prototype.isEmpty = function(t) {
  return this.bMarks[t] + this.tShift[t] >= this.eMarks[t];
};
qt.prototype.skipEmptyLines = function(t) {
  for (let n = this.lineMax; t < n && !(this.bMarks[t] + this.tShift[t] < this.eMarks[t]); t++)
    ;
  return t;
};
qt.prototype.skipSpaces = function(t) {
  for (let n = this.src.length; t < n; t++) {
    const u = this.src.charCodeAt(t);
    if (!Ae(u))
      break;
  }
  return t;
};
qt.prototype.skipSpacesBack = function(t, n) {
  if (t <= n)
    return t;
  for (; t > n; )
    if (!Ae(this.src.charCodeAt(--t)))
      return t + 1;
  return t;
};
qt.prototype.skipChars = function(t, n) {
  for (let u = this.src.length; t < u && this.src.charCodeAt(t) === n; t++)
    ;
  return t;
};
qt.prototype.skipCharsBack = function(t, n, u) {
  if (t <= u)
    return t;
  for (; t > u; )
    if (n !== this.src.charCodeAt(--t))
      return t + 1;
  return t;
};
qt.prototype.getLines = function(t, n, u, r) {
  if (t >= n)
    return "";
  const o = new Array(n - t);
  for (let i = 0, s = t; s < n; s++, i++) {
    let a = 0;
    const c = this.bMarks[s];
    let l = c, d;
    for (s + 1 < n || r ? d = this.eMarks[s] + 1 : d = this.eMarks[s]; l < d && a < u; ) {
      const h = this.src.charCodeAt(l);
      if (Ae(h))
        h === 9 ? a += 4 - (a + this.bsCount[s]) % 4 : a++;
      else if (l - c < this.tShift[s])
        a++;
      else
        break;
      l++;
    }
    a > u ? o[i] = new Array(a - u + 1).join(" ") + this.src.slice(l, d) : o[i] = this.src.slice(l, d);
  }
  return o.join("");
};
qt.prototype.Token = Tt;
const I1 = 65536;
function ao(e, t) {
  const n = e.bMarks[t] + e.tShift[t], u = e.eMarks[t];
  return e.src.slice(n, u);
}
function vs(e) {
  const t = [], n = e.length;
  let u = 0, r = e.charCodeAt(u), o = !1, i = 0, s = "";
  for (; u < n; )
    r === 124 && (o ? (s += e.substring(i, u - 1), i = u) : (t.push(s + e.substring(i, u)), s = "", i = u + 1)), o = r === 92, u++, r = e.charCodeAt(u);
  return t.push(s + e.substring(i)), t;
}
function R1(e, t, n, u) {
  if (t + 2 > n)
    return !1;
  let r = t + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4)
    return !1;
  let o = e.bMarks[r] + e.tShift[r];
  if (o >= e.eMarks[r])
    return !1;
  const i = e.src.charCodeAt(o++);
  if (i !== 124 && i !== 45 && i !== 58 || o >= e.eMarks[r])
    return !1;
  const s = e.src.charCodeAt(o++);
  if (s !== 124 && s !== 45 && s !== 58 && !Ae(s) || i === 45 && Ae(s))
    return !1;
  for (; o < e.eMarks[r]; ) {
    const v = e.src.charCodeAt(o);
    if (v !== 124 && v !== 45 && v !== 58 && !Ae(v))
      return !1;
    o++;
  }
  let a = ao(e, t + 1), c = a.split("|");
  const l = [];
  for (let v = 0; v < c.length; v++) {
    const x = c[v].trim();
    if (!x) {
      if (v === 0 || v === c.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(x))
      return !1;
    x.charCodeAt(x.length - 1) === 58 ? l.push(x.charCodeAt(0) === 58 ? "center" : "right") : x.charCodeAt(0) === 58 ? l.push("left") : l.push("");
  }
  if (a = ao(e, t).trim(), a.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4)
    return !1;
  c = vs(a), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  const d = c.length;
  if (d === 0 || d !== l.length)
    return !1;
  if (u)
    return !0;
  const h = e.parentType;
  e.parentType = "table";
  const f = e.md.block.ruler.getRules("blockquote"), p = e.push("table_open", "table", 1), _ = [t, 0];
  p.map = _;
  const O = e.push("thead_open", "thead", 1);
  O.map = [t, t + 1];
  const P = e.push("tr_open", "tr", 1);
  P.map = [t, t + 1];
  for (let v = 0; v < c.length; v++) {
    const x = e.push("th_open", "th", 1);
    l[v] && (x.attrs = [["style", "text-align:" + l[v]]]);
    const L = e.push("inline", "", 0);
    L.content = c[v].trim(), L.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let A, T = 0;
  for (r = t + 2; r < n && !(e.sCount[r] < e.blkIndent); r++) {
    let v = !1;
    for (let L = 0, ne = f.length; L < ne; L++)
      if (f[L](e, r, n, !0)) {
        v = !0;
        break;
      }
    if (v || (a = ao(e, r).trim(), !a) || e.sCount[r] - e.blkIndent >= 4 || (c = vs(a), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), T += d - c.length, T > I1))
      break;
    if (r === t + 2) {
      const L = e.push("tbody_open", "tbody", 1);
      L.map = A = [t + 2, 0];
    }
    const x = e.push("tr_open", "tr", 1);
    x.map = [r, r + 1];
    for (let L = 0; L < d; L++) {
      const ne = e.push("td_open", "td", 1);
      l[L] && (ne.attrs = [["style", "text-align:" + l[L]]]);
      const q = e.push("inline", "", 0);
      q.content = c[L] ? c[L].trim() : "", q.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return A && (e.push("tbody_close", "tbody", -1), A[1] = r), e.push("table_close", "table", -1), _[1] = r, e.parentType = h, e.line = r, !0;
}
function N1(e, t, n) {
  if (e.sCount[t] - e.blkIndent < 4)
    return !1;
  let u = t + 1, r = u;
  for (; u < n; ) {
    if (e.isEmpty(u)) {
      u++;
      continue;
    }
    if (e.sCount[u] - e.blkIndent >= 4) {
      u++, r = u;
      continue;
    }
    break;
  }
  e.line = r;
  const o = e.push("code_block", "code", 0);
  return o.content = e.getLines(t, r, 4 + e.blkIndent, !1) + `
`, o.map = [t, e.line], !0;
}
function O1(e, t, n, u) {
  let r = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || r + 3 > o)
    return !1;
  const i = e.src.charCodeAt(r);
  if (i !== 126 && i !== 96)
    return !1;
  let s = r;
  r = e.skipChars(r, i);
  let a = r - s;
  if (a < 3)
    return !1;
  const c = e.src.slice(s, r), l = e.src.slice(r, o);
  if (i === 96 && l.indexOf(String.fromCharCode(i)) >= 0)
    return !1;
  if (u)
    return !0;
  let d = t, h = !1;
  for (; d++, !(d >= n || (r = s = e.bMarks[d] + e.tShift[d], o = e.eMarks[d], r < o && e.sCount[d] < e.blkIndent)); )
    if (e.src.charCodeAt(r) === i && !(e.sCount[d] - e.blkIndent >= 4) && (r = e.skipChars(r, i), !(r - s < a) && (r = e.skipSpaces(r), !(r < o)))) {
      h = !0;
      break;
    }
  a = e.sCount[t], e.line = d + (h ? 1 : 0);
  const f = e.push("fence", "code", 0);
  return f.info = l, f.content = e.getLines(t + 1, d, a, !0), f.markup = c, f.map = [t, e.line], !0;
}
function L1(e, t, n, u) {
  let r = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  const i = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 62)
    return !1;
  if (u)
    return !0;
  const s = [], a = [], c = [], l = [], d = e.md.block.ruler.getRules("blockquote"), h = e.parentType;
  e.parentType = "blockquote";
  let f = !1, p;
  for (p = t; p < n; p++) {
    const T = e.sCount[p] < e.blkIndent;
    if (r = e.bMarks[p] + e.tShift[p], o = e.eMarks[p], r >= o)
      break;
    if (e.src.charCodeAt(r++) === 62 && !T) {
      let x = e.sCount[p] + 1, L, ne;
      e.src.charCodeAt(r) === 32 ? (r++, x++, ne = !1, L = !0) : e.src.charCodeAt(r) === 9 ? (L = !0, (e.bsCount[p] + x) % 4 === 3 ? (r++, x++, ne = !1) : ne = !0) : L = !1;
      let q = x;
      for (s.push(e.bMarks[p]), e.bMarks[p] = r; r < o; ) {
        const F = e.src.charCodeAt(r);
        if (Ae(F))
          F === 9 ? q += 4 - (q + e.bsCount[p] + (ne ? 1 : 0)) % 4 : q++;
        else
          break;
        r++;
      }
      f = r >= o, a.push(e.bsCount[p]), e.bsCount[p] = e.sCount[p] + 1 + (L ? 1 : 0), c.push(e.sCount[p]), e.sCount[p] = q - x, l.push(e.tShift[p]), e.tShift[p] = r - e.bMarks[p];
      continue;
    }
    if (f)
      break;
    let v = !1;
    for (let x = 0, L = d.length; x < L; x++)
      if (d[x](e, p, n, !0)) {
        v = !0;
        break;
      }
    if (v) {
      e.lineMax = p, e.blkIndent !== 0 && (s.push(e.bMarks[p]), a.push(e.bsCount[p]), l.push(e.tShift[p]), c.push(e.sCount[p]), e.sCount[p] -= e.blkIndent);
      break;
    }
    s.push(e.bMarks[p]), a.push(e.bsCount[p]), l.push(e.tShift[p]), c.push(e.sCount[p]), e.sCount[p] = -1;
  }
  const _ = e.blkIndent;
  e.blkIndent = 0;
  const O = e.push("blockquote_open", "blockquote", 1);
  O.markup = ">";
  const P = [t, 0];
  O.map = P, e.md.block.tokenize(e, t, p);
  const A = e.push("blockquote_close", "blockquote", -1);
  A.markup = ">", e.lineMax = i, e.parentType = h, P[1] = e.line;
  for (let T = 0; T < l.length; T++)
    e.bMarks[T + t] = s[T], e.tShift[T + t] = l[T], e.sCount[T + t] = c[T], e.bsCount[T + t] = a[T];
  return e.blkIndent = _, !0;
}
function B1(e, t, n, u) {
  const r = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  let o = e.bMarks[t] + e.tShift[t];
  const i = e.src.charCodeAt(o++);
  if (i !== 42 && i !== 45 && i !== 95)
    return !1;
  let s = 1;
  for (; o < r; ) {
    const c = e.src.charCodeAt(o++);
    if (c !== i && !Ae(c))
      return !1;
    c === i && s++;
  }
  if (s < 3)
    return !1;
  if (u)
    return !0;
  e.line = t + 1;
  const a = e.push("hr", "hr", 0);
  return a.map = [t, e.line], a.markup = Array(s + 1).join(String.fromCharCode(i)), !0;
}
function ks(e, t) {
  const n = e.eMarks[t];
  let u = e.bMarks[t] + e.tShift[t];
  const r = e.src.charCodeAt(u++);
  if (r !== 42 && r !== 45 && r !== 43)
    return -1;
  if (u < n) {
    const o = e.src.charCodeAt(u);
    if (!Ae(o))
      return -1;
  }
  return u;
}
function Es(e, t) {
  const n = e.bMarks[t] + e.tShift[t], u = e.eMarks[t];
  let r = n;
  if (r + 1 >= u)
    return -1;
  let o = e.src.charCodeAt(r++);
  if (o < 48 || o > 57)
    return -1;
  for (; ; ) {
    if (r >= u)
      return -1;
    if (o = e.src.charCodeAt(r++), o >= 48 && o <= 57) {
      if (r - n >= 10)
        return -1;
      continue;
    }
    if (o === 41 || o === 46)
      break;
    return -1;
  }
  return r < u && (o = e.src.charCodeAt(r), !Ae(o)) ? -1 : r;
}
function P1(e, t) {
  const n = e.level + 2;
  for (let u = t + 2, r = e.tokens.length - 2; u < r; u++)
    e.tokens[u].level === n && e.tokens[u].type === "paragraph_open" && (e.tokens[u + 2].hidden = !0, e.tokens[u].hidden = !0, u += 2);
}
function $1(e, t, n, u) {
  let r, o, i, s, a = t, c = !0;
  if (e.sCount[a] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[a] - e.listIndent >= 4 && e.sCount[a] < e.blkIndent)
    return !1;
  let l = !1;
  u && e.parentType === "paragraph" && e.sCount[a] >= e.blkIndent && (l = !0);
  let d, h, f;
  if ((f = Es(e, a)) >= 0) {
    if (d = !0, i = e.bMarks[a] + e.tShift[a], h = Number(e.src.slice(i, f - 1)), l && h !== 1) return !1;
  } else if ((f = ks(e, a)) >= 0)
    d = !1;
  else
    return !1;
  if (l && e.skipSpaces(f) >= e.eMarks[a])
    return !1;
  if (u)
    return !0;
  const p = e.src.charCodeAt(f - 1), _ = e.tokens.length;
  d ? (s = e.push("ordered_list_open", "ol", 1), h !== 1 && (s.attrs = [["start", h]])) : s = e.push("bullet_list_open", "ul", 1);
  const O = [a, 0];
  s.map = O, s.markup = String.fromCharCode(p);
  let P = !1;
  const A = e.md.block.ruler.getRules("list"), T = e.parentType;
  for (e.parentType = "list"; a < n; ) {
    o = f, r = e.eMarks[a];
    const v = e.sCount[a] + f - (e.bMarks[a] + e.tShift[a]);
    let x = v;
    for (; o < r; ) {
      const Te = e.src.charCodeAt(o);
      if (Te === 9)
        x += 4 - (x + e.bsCount[a]) % 4;
      else if (Te === 32)
        x++;
      else
        break;
      o++;
    }
    const L = o;
    let ne;
    L >= r ? ne = 1 : ne = x - v, ne > 4 && (ne = 1);
    const q = v + ne;
    s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(p);
    const F = [a, 0];
    s.map = F, d && (s.info = e.src.slice(i, f - 1));
    const te = e.tight, I = e.tShift[a], k = e.sCount[a], J = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = q, e.tight = !0, e.tShift[a] = L - e.bMarks[a], e.sCount[a] = x, L >= r && e.isEmpty(a + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, a, n, !0), (!e.tight || P) && (c = !1), P = e.line - a > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = J, e.tShift[a] = I, e.sCount[a] = k, e.tight = te, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(p), a = e.line, F[1] = a, a >= n || e.sCount[a] < e.blkIndent || e.sCount[a] - e.blkIndent >= 4)
      break;
    let he = !1;
    for (let Te = 0, Me = A.length; Te < Me; Te++)
      if (A[Te](e, a, n, !0)) {
        he = !0;
        break;
      }
    if (he)
      break;
    if (d) {
      if (f = Es(e, a), f < 0)
        break;
      i = e.bMarks[a] + e.tShift[a];
    } else if (f = ks(e, a), f < 0)
      break;
    if (p !== e.src.charCodeAt(f - 1))
      break;
  }
  return d ? s = e.push("ordered_list_close", "ol", -1) : s = e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(p), O[1] = a, e.line = a, e.parentType = T, c && P1(e, _), !0;
}
function z1(e, t, n, u) {
  let r = e.bMarks[t] + e.tShift[t], o = e.eMarks[t], i = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 91)
    return !1;
  function s(A) {
    const T = e.lineMax;
    if (A >= T || e.isEmpty(A))
      return null;
    let v = !1;
    if (e.sCount[A] - e.blkIndent > 3 && (v = !0), e.sCount[A] < 0 && (v = !0), !v) {
      const ne = e.md.block.ruler.getRules("reference"), q = e.parentType;
      e.parentType = "reference";
      let F = !1;
      for (let te = 0, I = ne.length; te < I; te++)
        if (ne[te](e, A, T, !0)) {
          F = !0;
          break;
        }
      if (e.parentType = q, F)
        return null;
    }
    const x = e.bMarks[A] + e.tShift[A], L = e.eMarks[A];
    return e.src.slice(x, L + 1);
  }
  let a = e.src.slice(r, o + 1);
  o = a.length;
  let c = -1;
  for (r = 1; r < o; r++) {
    const A = a.charCodeAt(r);
    if (A === 91)
      return !1;
    if (A === 93) {
      c = r;
      break;
    } else if (A === 10) {
      const T = s(i);
      T !== null && (a += T, o = a.length, i++);
    } else if (A === 92 && (r++, r < o && a.charCodeAt(r) === 10)) {
      const T = s(i);
      T !== null && (a += T, o = a.length, i++);
    }
  }
  if (c < 0 || a.charCodeAt(c + 1) !== 58)
    return !1;
  for (r = c + 2; r < o; r++) {
    const A = a.charCodeAt(r);
    if (A === 10) {
      const T = s(i);
      T !== null && (a += T, o = a.length, i++);
    } else if (!Ae(A)) break;
  }
  const l = e.md.helpers.parseLinkDestination(a, r, o);
  if (!l.ok)
    return !1;
  const d = e.md.normalizeLink(l.str);
  if (!e.md.validateLink(d))
    return !1;
  r = l.pos;
  const h = r, f = i, p = r;
  for (; r < o; r++) {
    const A = a.charCodeAt(r);
    if (A === 10) {
      const T = s(i);
      T !== null && (a += T, o = a.length, i++);
    } else if (!Ae(A)) break;
  }
  let _ = e.md.helpers.parseLinkTitle(a, r, o);
  for (; _.can_continue; ) {
    const A = s(i);
    if (A === null) break;
    a += A, r = o, o = a.length, i++, _ = e.md.helpers.parseLinkTitle(a, r, o, _);
  }
  let O;
  for (r < o && p !== r && _.ok ? (O = _.str, r = _.pos) : (O = "", r = h, i = f); r < o; ) {
    const A = a.charCodeAt(r);
    if (!Ae(A))
      break;
    r++;
  }
  if (r < o && a.charCodeAt(r) !== 10 && O)
    for (O = "", r = h, i = f; r < o; ) {
      const A = a.charCodeAt(r);
      if (!Ae(A))
        break;
      r++;
    }
  if (r < o && a.charCodeAt(r) !== 10)
    return !1;
  const P = Fr(a.slice(1, c));
  return P ? (u || (typeof e.env.references > "u" && (e.env.references = {}), typeof e.env.references[P] > "u" && (e.env.references[P] = { title: O, href: d }), e.line = i), !0) : !1;
}
const j1 = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
], H1 = "[a-zA-Z_:][a-zA-Z0-9:._-]*", U1 = "[^\"'=<>`\\x00-\\x20]+", q1 = "'[^']*'", G1 = '"[^"]*"', V1 = "(?:" + U1 + "|" + q1 + "|" + G1 + ")", K1 = "(?:\\s+" + H1 + "(?:\\s*=\\s*" + V1 + ")?)", pc = "<[A-Za-z][A-Za-z0-9\\-]*" + K1 + "*\\s*\\/?>", bc = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", Z1 = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", W1 = "<[?][\\s\\S]*?[?]>", J1 = "<![A-Za-z][^>]*>", Y1 = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", X1 = new RegExp("^(?:" + pc + "|" + bc + "|" + Z1 + "|" + W1 + "|" + J1 + "|" + Y1 + ")"), Q1 = new RegExp("^(?:" + pc + "|" + bc + ")"), Ln = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + j1.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(Q1.source + "\\s*$"), /^$/, !1]
];
function ep(e, t, n, u) {
  let r = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60)
    return !1;
  let i = e.src.slice(r, o), s = 0;
  for (; s < Ln.length && !Ln[s][0].test(i); s++)
    ;
  if (s === Ln.length)
    return !1;
  if (u)
    return Ln[s][2];
  let a = t + 1;
  if (!Ln[s][1].test(i)) {
    for (; a < n && !(e.sCount[a] < e.blkIndent); a++)
      if (r = e.bMarks[a] + e.tShift[a], o = e.eMarks[a], i = e.src.slice(r, o), Ln[s][1].test(i)) {
        i.length !== 0 && a++;
        break;
      }
  }
  e.line = a;
  const c = e.push("html_block", "", 0);
  return c.map = [t, a], c.content = e.getLines(t, a, e.blkIndent, !0), !0;
}
function tp(e, t, n, u) {
  let r = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  let i = e.src.charCodeAt(r);
  if (i !== 35 || r >= o)
    return !1;
  let s = 1;
  for (i = e.src.charCodeAt(++r); i === 35 && r < o && s <= 6; )
    s++, i = e.src.charCodeAt(++r);
  if (s > 6 || r < o && !Ae(i))
    return !1;
  if (u)
    return !0;
  o = e.skipSpacesBack(o, r);
  const a = e.skipCharsBack(o, 35, r);
  a > r && Ae(e.src.charCodeAt(a - 1)) && (o = a), e.line = t + 1;
  const c = e.push("heading_open", "h" + String(s), 1);
  c.markup = "########".slice(0, s), c.map = [t, e.line];
  const l = e.push("inline", "", 0);
  l.content = e.src.slice(r, o).trim(), l.map = [t, e.line], l.children = [];
  const d = e.push("heading_close", "h" + String(s), -1);
  return d.markup = "########".slice(0, s), !0;
}
function np(e, t, n) {
  const u = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  const r = e.parentType;
  e.parentType = "paragraph";
  let o = 0, i, s = t + 1;
  for (; s < n && !e.isEmpty(s); s++) {
    if (e.sCount[s] - e.blkIndent > 3)
      continue;
    if (e.sCount[s] >= e.blkIndent) {
      let f = e.bMarks[s] + e.tShift[s];
      const p = e.eMarks[s];
      if (f < p && (i = e.src.charCodeAt(f), (i === 45 || i === 61) && (f = e.skipChars(f, i), f = e.skipSpaces(f), f >= p))) {
        o = i === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[s] < 0)
      continue;
    let h = !1;
    for (let f = 0, p = u.length; f < p; f++)
      if (u[f](e, s, n, !0)) {
        h = !0;
        break;
      }
    if (h)
      break;
  }
  if (!o)
    return !1;
  const a = e.getLines(t, s, e.blkIndent, !1).trim();
  e.line = s + 1;
  const c = e.push("heading_open", "h" + String(o), 1);
  c.markup = String.fromCharCode(i), c.map = [t, e.line];
  const l = e.push("inline", "", 0);
  l.content = a, l.map = [t, e.line - 1], l.children = [];
  const d = e.push("heading_close", "h" + String(o), -1);
  return d.markup = String.fromCharCode(i), e.parentType = r, !0;
}
function up(e, t, n) {
  const u = e.md.block.ruler.getRules("paragraph"), r = e.parentType;
  let o = t + 1;
  for (e.parentType = "paragraph"; o < n && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3 || e.sCount[o] < 0)
      continue;
    let c = !1;
    for (let l = 0, d = u.length; l < d; l++)
      if (u[l](e, o, n, !0)) {
        c = !0;
        break;
      }
    if (c)
      break;
  }
  const i = e.getLines(t, o, e.blkIndent, !1).trim();
  e.line = o;
  const s = e.push("paragraph_open", "p", 1);
  s.map = [t, e.line];
  const a = e.push("inline", "", 0);
  return a.content = i, a.map = [t, e.line], a.children = [], e.push("paragraph_close", "p", -1), e.parentType = r, !0;
}
const qu = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", R1, ["paragraph", "reference"]],
  ["code", N1],
  ["fence", O1, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", L1, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", B1, ["paragraph", "reference", "blockquote", "list"]],
  ["list", $1, ["paragraph", "reference", "blockquote"]],
  ["reference", z1],
  ["html_block", ep, ["paragraph", "reference", "blockquote"]],
  ["heading", tp, ["paragraph", "reference", "blockquote"]],
  ["lheading", np],
  ["paragraph", up]
];
function Ir() {
  this.ruler = new ft();
  for (let e = 0; e < qu.length; e++)
    this.ruler.push(qu[e][0], qu[e][1], { alt: (qu[e][2] || []).slice() });
}
Ir.prototype.tokenize = function(e, t, n) {
  const u = this.ruler.getRules(""), r = u.length, o = e.md.options.maxNesting;
  let i = t, s = !1;
  for (; i < n && (e.line = i = e.skipEmptyLines(i), !(i >= n || e.sCount[i] < e.blkIndent)); ) {
    if (e.level >= o) {
      e.line = n;
      break;
    }
    const a = e.line;
    let c = !1;
    for (let l = 0; l < r; l++)
      if (c = u[l](e, i, n, !1), c) {
        if (a >= e.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!c) throw new Error("none of the block rules matched");
    e.tight = !s, e.isEmpty(e.line - 1) && (s = !0), i = e.line, i < n && e.isEmpty(i) && (s = !0, i++, e.line = i);
  }
};
Ir.prototype.parse = function(e, t, n, u) {
  if (!e)
    return;
  const r = new this.State(e, t, n, u);
  this.tokenize(r, r.line, r.lineMax);
};
Ir.prototype.State = qt;
function Mu(e, t, n, u) {
  this.src = e, this.env = n, this.md = t, this.tokens = u, this.tokens_meta = Array(u.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
Mu.prototype.pushPending = function() {
  const e = new Tt("text", "", 0);
  return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
};
Mu.prototype.push = function(e, t, n) {
  this.pending && this.pushPending();
  const u = new Tt(e, t, n);
  let r = null;
  return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), u.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(u), this.tokens_meta.push(r), u;
};
Mu.prototype.scanDelims = function(e, t) {
  const n = this.posMax, u = this.src.charCodeAt(e), r = e > 0 ? this.src.charCodeAt(e - 1) : 32;
  let o = e;
  for (; o < n && this.src.charCodeAt(o) === u; )
    o++;
  const i = o - e, s = o < n ? this.src.charCodeAt(o) : 32, a = ku(r) || vu(String.fromCharCode(r)), c = ku(s) || vu(String.fromCharCode(s)), l = wu(r), d = wu(s), h = !d && (!c || l || a), f = !l && (!a || d || c);
  return { can_open: h && (t || !f || a), can_close: f && (t || !h || c), length: i };
};
Mu.prototype.Token = Tt;
function rp(e) {
  switch (e) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function op(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !rp(e.src.charCodeAt(n)); )
    n++;
  return n === e.pos ? !1 : (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
const ip = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function sp(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  const n = e.pos, u = e.posMax;
  if (n + 3 > u || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  const r = e.pending.match(ip);
  if (!r) return !1;
  const o = r[1], i = e.md.linkify.matchAtStart(e.src.slice(n - o.length));
  if (!i) return !1;
  let s = i.url;
  if (s.length <= o.length) return !1;
  s = s.replace(/\*+$/, "");
  const a = e.md.normalizeLink(s);
  if (!e.md.validateLink(a)) return !1;
  if (!t) {
    e.pending = e.pending.slice(0, -o.length);
    const c = e.push("link_open", "a", 1);
    c.attrs = [["href", a]], c.markup = "linkify", c.info = "auto";
    const l = e.push("text", "", 0);
    l.content = e.md.normalizeLinkText(s);
    const d = e.push("link_close", "a", -1);
    d.markup = "linkify", d.info = "auto";
  }
  return e.pos += s.length - o.length, !0;
}
function ap(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 10)
    return !1;
  const u = e.pending.length - 1, r = e.posMax;
  if (!t)
    if (u >= 0 && e.pending.charCodeAt(u) === 32)
      if (u >= 1 && e.pending.charCodeAt(u - 1) === 32) {
        let o = u - 1;
        for (; o >= 1 && e.pending.charCodeAt(o - 1) === 32; ) o--;
        e.pending = e.pending.slice(0, o), e.push("hardbreak", "br", 0);
      } else
        e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
    else
      e.push("softbreak", "br", 0);
  for (n++; n < r && Ae(e.src.charCodeAt(n)); )
    n++;
  return e.pos = n, !0;
}
const di = [];
for (let e = 0; e < 256; e++)
  di.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  di[e.charCodeAt(0)] = 1;
});
function cp(e, t) {
  let n = e.pos;
  const u = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= u)) return !1;
  let r = e.src.charCodeAt(n);
  if (r === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < u && (r = e.src.charCodeAt(n), !!Ae(r)); )
      n++;
    return e.pos = n, !0;
  }
  let o = e.src[n];
  if (r >= 55296 && r <= 56319 && n + 1 < u) {
    const s = e.src.charCodeAt(n + 1);
    s >= 56320 && s <= 57343 && (o += e.src[n + 1], n++);
  }
  const i = "\\" + o;
  if (!t) {
    const s = e.push("text_special", "", 0);
    r < 256 && di[r] !== 0 ? s.content = o : s.content = i, s.markup = i, s.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function lp(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 96)
    return !1;
  const r = n;
  n++;
  const o = e.posMax;
  for (; n < o && e.src.charCodeAt(n) === 96; )
    n++;
  const i = e.src.slice(r, n), s = i.length;
  if (e.backticksScanned && (e.backticks[s] || 0) <= r)
    return t || (e.pending += i), e.pos += s, !0;
  let a = n, c;
  for (; (c = e.src.indexOf("`", a)) !== -1; ) {
    for (a = c + 1; a < o && e.src.charCodeAt(a) === 96; )
      a++;
    const l = a - c;
    if (l === s) {
      if (!t) {
        const d = e.push("code_inline", "code", 0);
        d.markup = i, d.content = e.src.slice(n, c).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return e.pos = a, !0;
    }
    e.backticks[l] = c;
  }
  return e.backticksScanned = !0, t || (e.pending += i), e.pos += s, !0;
}
function dp(e, t) {
  const n = e.pos, u = e.src.charCodeAt(n);
  if (t || u !== 126)
    return !1;
  const r = e.scanDelims(e.pos, !0);
  let o = r.length;
  const i = String.fromCharCode(u);
  if (o < 2)
    return !1;
  let s;
  o % 2 && (s = e.push("text", "", 0), s.content = i, o--);
  for (let a = 0; a < o; a += 2)
    s = e.push("text", "", 0), s.content = i + i, e.delimiters.push({
      marker: u,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: e.tokens.length - 1,
      end: -1,
      open: r.can_open,
      close: r.can_close
    });
  return e.pos += r.length, !0;
}
function Cs(e, t) {
  let n;
  const u = [], r = t.length;
  for (let o = 0; o < r; o++) {
    const i = t[o];
    if (i.marker !== 126 || i.end === -1)
      continue;
    const s = t[i.end];
    n = e.tokens[i.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[s.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[s.token - 1].type === "text" && e.tokens[s.token - 1].content === "~" && u.push(s.token - 1);
  }
  for (; u.length; ) {
    const o = u.pop();
    let i = o + 1;
    for (; i < e.tokens.length && e.tokens[i].type === "s_close"; )
      i++;
    i--, o !== i && (n = e.tokens[i], e.tokens[i] = e.tokens[o], e.tokens[o] = n);
  }
}
function fp(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  Cs(e, e.delimiters);
  for (let u = 0; u < n; u++)
    t[u] && t[u].delimiters && Cs(e, t[u].delimiters);
}
const gc = {
  tokenize: dp,
  postProcess: fp
};
function hp(e, t) {
  const n = e.pos, u = e.src.charCodeAt(n);
  if (t || u !== 95 && u !== 42)
    return !1;
  const r = e.scanDelims(e.pos, u === 42);
  for (let o = 0; o < r.length; o++) {
    const i = e.push("text", "", 0);
    i.content = String.fromCharCode(u), e.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: u,
      // Total length of these series of delimiters.
      //
      length: r.length,
      // A position of the token this delimiter corresponds to.
      //
      token: e.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: r.can_open,
      close: r.can_close
    });
  }
  return e.pos += r.length, !0;
}
function As(e, t) {
  const n = t.length;
  for (let u = n - 1; u >= 0; u--) {
    const r = t[u];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1)
      continue;
    const o = t[r.end], i = u > 0 && t[u - 1].end === r.end + 1 && // check that first two markers match and adjacent
    t[u - 1].marker === r.marker && t[u - 1].token === r.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    t[r.end + 1].token === o.token + 1, s = String.fromCharCode(r.marker), a = e.tokens[r.token];
    a.type = i ? "strong_open" : "em_open", a.tag = i ? "strong" : "em", a.nesting = 1, a.markup = i ? s + s : s, a.content = "";
    const c = e.tokens[o.token];
    c.type = i ? "strong_close" : "em_close", c.tag = i ? "strong" : "em", c.nesting = -1, c.markup = i ? s + s : s, c.content = "", i && (e.tokens[t[u - 1].token].content = "", e.tokens[t[r.end + 1].token].content = "", u--);
  }
}
function pp(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  As(e, e.delimiters);
  for (let u = 0; u < n; u++)
    t[u] && t[u].delimiters && As(e, t[u].delimiters);
}
const mc = {
  tokenize: hp,
  postProcess: pp
};
function bp(e, t) {
  let n, u, r, o, i = "", s = "", a = e.pos, c = !0;
  if (e.src.charCodeAt(e.pos) !== 91)
    return !1;
  const l = e.pos, d = e.posMax, h = e.pos + 1, f = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (f < 0)
    return !1;
  let p = f + 1;
  if (p < d && e.src.charCodeAt(p) === 40) {
    for (c = !1, p++; p < d && (n = e.src.charCodeAt(p), !(!Ae(n) && n !== 10)); p++)
      ;
    if (p >= d)
      return !1;
    if (a = p, r = e.md.helpers.parseLinkDestination(e.src, p, e.posMax), r.ok) {
      for (i = e.md.normalizeLink(r.str), e.md.validateLink(i) ? p = r.pos : i = "", a = p; p < d && (n = e.src.charCodeAt(p), !(!Ae(n) && n !== 10)); p++)
        ;
      if (r = e.md.helpers.parseLinkTitle(e.src, p, e.posMax), p < d && a !== p && r.ok)
        for (s = r.str, p = r.pos; p < d && (n = e.src.charCodeAt(p), !(!Ae(n) && n !== 10)); p++)
          ;
    }
    (p >= d || e.src.charCodeAt(p) !== 41) && (c = !0), p++;
  }
  if (c) {
    if (typeof e.env.references > "u")
      return !1;
    if (p < d && e.src.charCodeAt(p) === 91 ? (a = p + 1, p = e.md.helpers.parseLinkLabel(e, p), p >= 0 ? u = e.src.slice(a, p++) : p = f + 1) : p = f + 1, u || (u = e.src.slice(h, f)), o = e.env.references[Fr(u)], !o)
      return e.pos = l, !1;
    i = o.href, s = o.title;
  }
  if (!t) {
    e.pos = h, e.posMax = f;
    const _ = e.push("link_open", "a", 1), O = [["href", i]];
    _.attrs = O, s && O.push(["title", s]), e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = p, e.posMax = d, !0;
}
function gp(e, t) {
  let n, u, r, o, i, s, a, c, l = "";
  const d = e.pos, h = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91)
    return !1;
  const f = e.pos + 2, p = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (p < 0)
    return !1;
  if (o = p + 1, o < h && e.src.charCodeAt(o) === 40) {
    for (o++; o < h && (n = e.src.charCodeAt(o), !(!Ae(n) && n !== 10)); o++)
      ;
    if (o >= h)
      return !1;
    for (c = o, s = e.md.helpers.parseLinkDestination(e.src, o, e.posMax), s.ok && (l = e.md.normalizeLink(s.str), e.md.validateLink(l) ? o = s.pos : l = ""), c = o; o < h && (n = e.src.charCodeAt(o), !(!Ae(n) && n !== 10)); o++)
      ;
    if (s = e.md.helpers.parseLinkTitle(e.src, o, e.posMax), o < h && c !== o && s.ok)
      for (a = s.str, o = s.pos; o < h && (n = e.src.charCodeAt(o), !(!Ae(n) && n !== 10)); o++)
        ;
    else
      a = "";
    if (o >= h || e.src.charCodeAt(o) !== 41)
      return e.pos = d, !1;
    o++;
  } else {
    if (typeof e.env.references > "u")
      return !1;
    if (o < h && e.src.charCodeAt(o) === 91 ? (c = o + 1, o = e.md.helpers.parseLinkLabel(e, o), o >= 0 ? r = e.src.slice(c, o++) : o = p + 1) : o = p + 1, r || (r = e.src.slice(f, p)), i = e.env.references[Fr(r)], !i)
      return e.pos = d, !1;
    l = i.href, a = i.title;
  }
  if (!t) {
    u = e.src.slice(f, p);
    const _ = [];
    e.md.inline.parse(
      u,
      e.md,
      e.env,
      _
    );
    const O = e.push("image", "img", 0), P = [["src", l], ["alt", ""]];
    O.attrs = P, O.children = _, O.content = u, a && P.push(["title", a]);
  }
  return e.pos = o, e.posMax = h, !0;
}
const mp = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, _p = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function xp(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 60)
    return !1;
  const u = e.pos, r = e.posMax;
  for (; ; ) {
    if (++n >= r) return !1;
    const i = e.src.charCodeAt(n);
    if (i === 60) return !1;
    if (i === 62) break;
  }
  const o = e.src.slice(u + 1, n);
  if (_p.test(o)) {
    const i = e.md.normalizeLink(o);
    if (!e.md.validateLink(i))
      return !1;
    if (!t) {
      const s = e.push("link_open", "a", 1);
      s.attrs = [["href", i]], s.markup = "autolink", s.info = "auto";
      const a = e.push("text", "", 0);
      a.content = e.md.normalizeLinkText(o);
      const c = e.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return e.pos += o.length + 2, !0;
  }
  if (mp.test(o)) {
    const i = e.md.normalizeLink("mailto:" + o);
    if (!e.md.validateLink(i))
      return !1;
    if (!t) {
      const s = e.push("link_open", "a", 1);
      s.attrs = [["href", i]], s.markup = "autolink", s.info = "auto";
      const a = e.push("text", "", 0);
      a.content = e.md.normalizeLinkText(o);
      const c = e.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return e.pos += o.length + 2, !0;
  }
  return !1;
}
function yp(e) {
  return /^<a[>\s]/i.test(e);
}
function wp(e) {
  return /^<\/a\s*>/i.test(e);
}
function vp(e) {
  const t = e | 32;
  return t >= 97 && t <= 122;
}
function kp(e, t) {
  if (!e.md.options.html)
    return !1;
  const n = e.posMax, u = e.pos;
  if (e.src.charCodeAt(u) !== 60 || u + 2 >= n)
    return !1;
  const r = e.src.charCodeAt(u + 1);
  if (r !== 33 && r !== 63 && r !== 47 && !vp(r))
    return !1;
  const o = e.src.slice(u).match(X1);
  if (!o)
    return !1;
  if (!t) {
    const i = e.push("html_inline", "", 0);
    i.content = o[0], yp(i.content) && e.linkLevel++, wp(i.content) && e.linkLevel--;
  }
  return e.pos += o[0].length, !0;
}
const Ep = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Cp = /^&([a-z][a-z0-9]{1,31});/i;
function Ap(e, t) {
  const n = e.pos, u = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= u) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    const o = e.src.slice(n).match(Ep);
    if (o) {
      if (!t) {
        const i = o[1][0].toLowerCase() === "x" ? parseInt(o[1].slice(1), 16) : parseInt(o[1], 10), s = e.push("text_special", "", 0);
        s.content = ci(i) ? cr(i) : cr(65533), s.markup = o[0], s.info = "entity";
      }
      return e.pos += o[0].length, !0;
    }
  } else {
    const o = e.src.slice(n).match(Cp);
    if (o) {
      const i = cc(o[0]);
      if (i !== o[0]) {
        if (!t) {
          const s = e.push("text_special", "", 0);
          s.content = i, s.markup = o[0], s.info = "entity";
        }
        return e.pos += o[0].length, !0;
      }
    }
  }
  return !1;
}
function Ss(e) {
  const t = {}, n = e.length;
  if (!n) return;
  let u = 0, r = -2;
  const o = [];
  for (let i = 0; i < n; i++) {
    const s = e[i];
    if (o.push(0), (e[u].marker !== s.marker || r !== s.token - 1) && (u = i), r = s.token, s.length = s.length || 0, !s.close) continue;
    t.hasOwnProperty(s.marker) || (t[s.marker] = [-1, -1, -1, -1, -1, -1]);
    const a = t[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let c = u - o[u] - 1, l = c;
    for (; c > a; c -= o[c] + 1) {
      const d = e[c];
      if (d.marker === s.marker && d.open && d.end < 0) {
        let h = !1;
        if ((d.close || s.open) && (d.length + s.length) % 3 === 0 && (d.length % 3 !== 0 || s.length % 3 !== 0) && (h = !0), !h) {
          const f = c > 0 && !e[c - 1].open ? o[c - 1] + 1 : 0;
          o[i] = i - c + f, o[c] = f, s.open = !1, d.end = i, d.close = !1, l = -1, r = -2;
          break;
        }
      }
    }
    l !== -1 && (t[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = l);
  }
}
function Sp(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  Ss(e.delimiters);
  for (let u = 0; u < n; u++)
    t[u] && t[u].delimiters && Ss(t[u].delimiters);
}
function Dp(e) {
  let t, n, u = 0;
  const r = e.tokens, o = e.tokens.length;
  for (t = n = 0; t < o; t++)
    r[t].nesting < 0 && u--, r[t].level = u, r[t].nesting > 0 && u++, r[t].type === "text" && t + 1 < o && r[t + 1].type === "text" ? r[t + 1].content = r[t].content + r[t + 1].content : (t !== n && (r[n] = r[t]), n++);
  t !== n && (r.length = n);
}
const co = [
  ["text", op],
  ["linkify", sp],
  ["newline", ap],
  ["escape", cp],
  ["backticks", lp],
  ["strikethrough", gc.tokenize],
  ["emphasis", mc.tokenize],
  ["link", bp],
  ["image", gp],
  ["autolink", xp],
  ["html_inline", kp],
  ["entity", Ap]
], lo = [
  ["balance_pairs", Sp],
  ["strikethrough", gc.postProcess],
  ["emphasis", mc.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", Dp]
];
function Fu() {
  this.ruler = new ft();
  for (let e = 0; e < co.length; e++)
    this.ruler.push(co[e][0], co[e][1]);
  this.ruler2 = new ft();
  for (let e = 0; e < lo.length; e++)
    this.ruler2.push(lo[e][0], lo[e][1]);
}
Fu.prototype.skipToken = function(e) {
  const t = e.pos, n = this.ruler.getRules(""), u = n.length, r = e.md.options.maxNesting, o = e.cache;
  if (typeof o[t] < "u") {
    e.pos = o[t];
    return;
  }
  let i = !1;
  if (e.level < r) {
    for (let s = 0; s < u; s++)
      if (e.level++, i = n[s](e, !0), e.level--, i) {
        if (t >= e.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    e.pos = e.posMax;
  i || e.pos++, o[t] = e.pos;
};
Fu.prototype.tokenize = function(e) {
  const t = this.ruler.getRules(""), n = t.length, u = e.posMax, r = e.md.options.maxNesting;
  for (; e.pos < u; ) {
    const o = e.pos;
    let i = !1;
    if (e.level < r) {
      for (let s = 0; s < n; s++)
        if (i = t[s](e, !1), i) {
          if (o >= e.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (i) {
      if (e.pos >= u)
        break;
      continue;
    }
    e.pending += e.src[e.pos++];
  }
  e.pending && e.pushPending();
};
Fu.prototype.parse = function(e, t, n, u) {
  const r = new this.State(e, t, n, u);
  this.tokenize(r);
  const o = this.ruler2.getRules(""), i = o.length;
  for (let s = 0; s < i; s++)
    o[s](r);
};
Fu.prototype.State = Mu;
function Tp(e) {
  const t = {};
  e = e || {}, t.src_Any = rc.source, t.src_Cc = oc.source, t.src_Z = sc.source, t.src_P = si.source, t.src_ZPCc = [t.src_Z, t.src_P, t.src_Cc].join("|"), t.src_ZCc = [t.src_Z, t.src_Cc].join("|");
  const n = "[><｜]";
  return t.src_pseudo_letter = "(?:(?!" + n + "|" + t.src_ZPCc + ")" + t.src_Any + ")", t.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", t.src_auth = "(?:(?:(?!" + t.src_ZCc + "|[@/\\[\\]()]).)+@)?", t.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", t.src_host_terminator = "(?=$|" + n + "|" + t.src_ZPCc + ")(?!" + (e["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + t.src_ZPCc + "))", t.src_path = "(?:[/?#](?:(?!" + t.src_ZCc + "|" + n + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + t.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + t.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + t.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + t.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + t.src_ZCc + "|[']).)+\\'|\\'(?=" + t.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + t.src_ZCc + "|[.]|$)|" + (e["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + t.src_ZCc + "|$)|;(?!" + t.src_ZCc + "|$)|\\!+(?!" + t.src_ZCc + "|[!]|$)|\\?(?!" + t.src_ZCc + "|[?]|$))+|\\/)?", t.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', t.src_xn = "xn--[a-z0-9\\-]{1,59}", t.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + t.src_xn + "|" + t.src_pseudo_letter + "{1,63})", t.src_domain = "(?:" + t.src_xn + "|(?:" + t.src_pseudo_letter + ")|(?:" + t.src_pseudo_letter + "(?:-|" + t.src_pseudo_letter + "){0,61}" + t.src_pseudo_letter + "))", t.src_host = "(?:(?:(?:(?:" + t.src_domain + ")\\.)*" + t.src_domain + "))", t.tpl_host_fuzzy = "(?:" + t.src_ip4 + "|(?:(?:(?:" + t.src_domain + ")\\.)+(?:%TLDS%)))", t.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + t.src_domain + ")\\.)+(?:%TLDS%))", t.src_host_strict = t.src_host + t.src_host_terminator, t.tpl_host_fuzzy_strict = t.tpl_host_fuzzy + t.src_host_terminator, t.src_host_port_strict = t.src_host + t.src_port + t.src_host_terminator, t.tpl_host_port_fuzzy_strict = t.tpl_host_fuzzy + t.src_port + t.src_host_terminator, t.tpl_host_port_no_ip_fuzzy_strict = t.tpl_host_no_ip_fuzzy + t.src_port + t.src_host_terminator, t.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + t.src_ZPCc + "|>|$))", t.tpl_email_fuzzy = "(^|" + n + '|"|\\(|' + t.src_ZCc + ")(" + t.src_email_name + "@" + t.tpl_host_fuzzy_strict + ")", t.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + t.src_ZPCc + "))((?![$+<=>^`|｜])" + t.tpl_host_port_fuzzy_strict + t.src_path + ")", t.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + t.src_ZPCc + "))((?![$+<=>^`|｜])" + t.tpl_host_port_no_ip_fuzzy_strict + t.src_path + ")", t;
}
function Mo(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    n && Object.keys(n).forEach(function(u) {
      e[u] = n[u];
    });
  }), e;
}
function Rr(e) {
  return Object.prototype.toString.call(e);
}
function Mp(e) {
  return Rr(e) === "[object String]";
}
function Fp(e) {
  return Rr(e) === "[object Object]";
}
function Ip(e) {
  return Rr(e) === "[object RegExp]";
}
function Ds(e) {
  return Rr(e) === "[object Function]";
}
function Rp(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const _c = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function Np(e) {
  return Object.keys(e || {}).reduce(function(t, n) {
    return t || _c.hasOwnProperty(n);
  }, !1);
}
const Op = {
  "http:": {
    validate: function(e, t, n) {
      const u = e.slice(t);
      return n.re.http || (n.re.http = new RegExp(
        "^\\/\\/" + n.re.src_auth + n.re.src_host_port_strict + n.re.src_path,
        "i"
      )), n.re.http.test(u) ? u.match(n.re.http)[0].length : 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(e, t, n) {
      const u = e.slice(t);
      return n.re.no_http || (n.re.no_http = new RegExp(
        "^" + n.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        "(?:localhost|(?:(?:" + n.re.src_domain + ")\\.)+" + n.re.src_domain_root + ")" + n.re.src_port + n.re.src_host_terminator + n.re.src_path,
        "i"
      )), n.re.no_http.test(u) ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : u.match(n.re.no_http)[0].length : 0;
    }
  },
  "mailto:": {
    validate: function(e, t, n) {
      const u = e.slice(t);
      return n.re.mailto || (n.re.mailto = new RegExp(
        "^" + n.re.src_email_name + "@" + n.re.src_host_strict,
        "i"
      )), n.re.mailto.test(u) ? u.match(n.re.mailto)[0].length : 0;
    }
  }
}, Lp = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", Bp = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function Pp(e) {
  e.__index__ = -1, e.__text_cache__ = "";
}
function $p(e) {
  return function(t, n) {
    const u = t.slice(n);
    return e.test(u) ? u.match(e)[0].length : 0;
  };
}
function Ts() {
  return function(e, t) {
    t.normalize(e);
  };
}
function lr(e) {
  const t = e.re = Tp(e.__opts__), n = e.__tlds__.slice();
  e.onCompile(), e.__tlds_replaced__ || n.push(Lp), n.push(t.src_xn), t.src_tlds = n.join("|");
  function u(s) {
    return s.replace("%TLDS%", t.src_tlds);
  }
  t.email_fuzzy = RegExp(u(t.tpl_email_fuzzy), "i"), t.link_fuzzy = RegExp(u(t.tpl_link_fuzzy), "i"), t.link_no_ip_fuzzy = RegExp(u(t.tpl_link_no_ip_fuzzy), "i"), t.host_fuzzy_test = RegExp(u(t.tpl_host_fuzzy_test), "i");
  const r = [];
  e.__compiled__ = {};
  function o(s, a) {
    throw new Error('(LinkifyIt) Invalid schema "' + s + '": ' + a);
  }
  Object.keys(e.__schemas__).forEach(function(s) {
    const a = e.__schemas__[s];
    if (a === null)
      return;
    const c = { validate: null, link: null };
    if (e.__compiled__[s] = c, Fp(a)) {
      Ip(a.validate) ? c.validate = $p(a.validate) : Ds(a.validate) ? c.validate = a.validate : o(s, a), Ds(a.normalize) ? c.normalize = a.normalize : a.normalize ? o(s, a) : c.normalize = Ts();
      return;
    }
    if (Mp(a)) {
      r.push(s);
      return;
    }
    o(s, a);
  }), r.forEach(function(s) {
    e.__compiled__[e.__schemas__[s]] && (e.__compiled__[s].validate = e.__compiled__[e.__schemas__[s]].validate, e.__compiled__[s].normalize = e.__compiled__[e.__schemas__[s]].normalize);
  }), e.__compiled__[""] = { validate: null, normalize: Ts() };
  const i = Object.keys(e.__compiled__).filter(function(s) {
    return s.length > 0 && e.__compiled__[s];
  }).map(Rp).join("|");
  e.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + t.src_ZPCc + "))(" + i + ")", "i"), e.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + t.src_ZPCc + "))(" + i + ")", "ig"), e.re.schema_at_start = RegExp("^" + e.re.schema_search.source, "i"), e.re.pretest = RegExp(
    "(" + e.re.schema_test.source + ")|(" + e.re.host_fuzzy_test.source + ")|@",
    "i"
  ), Pp(e);
}
function zp(e, t) {
  const n = e.__index__, u = e.__last_index__, r = e.__text_cache__.slice(n, u);
  this.schema = e.__schema__.toLowerCase(), this.index = n + t, this.lastIndex = u + t, this.raw = r, this.text = r, this.url = r;
}
function Fo(e, t) {
  const n = new zp(e, t);
  return e.__compiled__[n.schema].normalize(n, e), n;
}
function mt(e, t) {
  if (!(this instanceof mt))
    return new mt(e, t);
  t || Np(e) && (t = e, e = {}), this.__opts__ = Mo({}, _c, t), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = Mo({}, Op, e), this.__compiled__ = {}, this.__tlds__ = Bp, this.__tlds_replaced__ = !1, this.re = {}, lr(this);
}
mt.prototype.add = function(t, n) {
  return this.__schemas__[t] = n, lr(this), this;
};
mt.prototype.set = function(t) {
  return this.__opts__ = Mo(this.__opts__, t), this;
};
mt.prototype.test = function(t) {
  if (this.__text_cache__ = t, this.__index__ = -1, !t.length)
    return !1;
  let n, u, r, o, i, s, a, c, l;
  if (this.re.schema_test.test(t)) {
    for (a = this.re.schema_search, a.lastIndex = 0; (n = a.exec(t)) !== null; )
      if (o = this.testSchemaAt(t, n[2], a.lastIndex), o) {
        this.__schema__ = n[2], this.__index__ = n.index + n[1].length, this.__last_index__ = n.index + n[0].length + o;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (c = t.search(this.re.host_fuzzy_test), c >= 0 && (this.__index__ < 0 || c < this.__index__) && (u = t.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (i = u.index + u[1].length, (this.__index__ < 0 || i < this.__index__) && (this.__schema__ = "", this.__index__ = i, this.__last_index__ = u.index + u[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (l = t.indexOf("@"), l >= 0 && (r = t.match(this.re.email_fuzzy)) !== null && (i = r.index + r[1].length, s = r.index + r[0].length, (this.__index__ < 0 || i < this.__index__ || i === this.__index__ && s > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = i, this.__last_index__ = s))), this.__index__ >= 0;
};
mt.prototype.pretest = function(t) {
  return this.re.pretest.test(t);
};
mt.prototype.testSchemaAt = function(t, n, u) {
  return this.__compiled__[n.toLowerCase()] ? this.__compiled__[n.toLowerCase()].validate(t, u, this) : 0;
};
mt.prototype.match = function(t) {
  const n = [];
  let u = 0;
  this.__index__ >= 0 && this.__text_cache__ === t && (n.push(Fo(this, u)), u = this.__last_index__);
  let r = u ? t.slice(u) : t;
  for (; this.test(r); )
    n.push(Fo(this, u)), r = r.slice(this.__last_index__), u += this.__last_index__;
  return n.length ? n : null;
};
mt.prototype.matchAtStart = function(t) {
  if (this.__text_cache__ = t, this.__index__ = -1, !t.length) return null;
  const n = this.re.schema_at_start.exec(t);
  if (!n) return null;
  const u = this.testSchemaAt(t, n[2], n[0].length);
  return u ? (this.__schema__ = n[2], this.__index__ = n.index + n[1].length, this.__last_index__ = n.index + n[0].length + u, Fo(this, 0)) : null;
};
mt.prototype.tlds = function(t, n) {
  return t = Array.isArray(t) ? t : [t], n ? (this.__tlds__ = this.__tlds__.concat(t).sort().filter(function(u, r, o) {
    return u !== o[r - 1];
  }).reverse(), lr(this), this) : (this.__tlds__ = t.slice(), this.__tlds_replaced__ = !0, lr(this), this);
};
mt.prototype.normalize = function(t) {
  t.schema || (t.url = "http://" + t.url), t.schema === "mailto:" && !/^mailto:/i.test(t.url) && (t.url = "mailto:" + t.url);
};
mt.prototype.onCompile = function() {
};
const Kn = 2147483647, Pt = 36, fi = 1, Eu = 26, jp = 38, Hp = 700, xc = 72, yc = 128, wc = "-", Up = /^xn--/, qp = /[^\0-\x7F]/, Gp = /[\x2E\u3002\uFF0E\uFF61]/g, Vp = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, fo = Pt - fi, $t = Math.floor, ho = String.fromCharCode;
function cn(e) {
  throw new RangeError(Vp[e]);
}
function Kp(e, t) {
  const n = [];
  let u = e.length;
  for (; u--; )
    n[u] = t(e[u]);
  return n;
}
function vc(e, t) {
  const n = e.split("@");
  let u = "";
  n.length > 1 && (u = n[0] + "@", e = n[1]), e = e.replace(Gp, ".");
  const r = e.split("."), o = Kp(r, t).join(".");
  return u + o;
}
function kc(e) {
  const t = [];
  let n = 0;
  const u = e.length;
  for (; n < u; ) {
    const r = e.charCodeAt(n++);
    if (r >= 55296 && r <= 56319 && n < u) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((r & 1023) << 10) + (o & 1023) + 65536) : (t.push(r), n--);
    } else
      t.push(r);
  }
  return t;
}
const Zp = (e) => String.fromCodePoint(...e), Wp = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : Pt;
}, Ms = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, Ec = function(e, t, n) {
  let u = 0;
  for (e = n ? $t(e / Hp) : e >> 1, e += $t(e / t); e > fo * Eu >> 1; u += Pt)
    e = $t(e / fo);
  return $t(u + (fo + 1) * e / (e + jp));
}, Cc = function(e) {
  const t = [], n = e.length;
  let u = 0, r = yc, o = xc, i = e.lastIndexOf(wc);
  i < 0 && (i = 0);
  for (let s = 0; s < i; ++s)
    e.charCodeAt(s) >= 128 && cn("not-basic"), t.push(e.charCodeAt(s));
  for (let s = i > 0 ? i + 1 : 0; s < n; ) {
    const a = u;
    for (let l = 1, d = Pt; ; d += Pt) {
      s >= n && cn("invalid-input");
      const h = Wp(e.charCodeAt(s++));
      h >= Pt && cn("invalid-input"), h > $t((Kn - u) / l) && cn("overflow"), u += h * l;
      const f = d <= o ? fi : d >= o + Eu ? Eu : d - o;
      if (h < f)
        break;
      const p = Pt - f;
      l > $t(Kn / p) && cn("overflow"), l *= p;
    }
    const c = t.length + 1;
    o = Ec(u - a, c, a == 0), $t(u / c) > Kn - r && cn("overflow"), r += $t(u / c), u %= c, t.splice(u++, 0, r);
  }
  return String.fromCodePoint(...t);
}, Ac = function(e) {
  const t = [];
  e = kc(e);
  const n = e.length;
  let u = yc, r = 0, o = xc;
  for (const a of e)
    a < 128 && t.push(ho(a));
  const i = t.length;
  let s = i;
  for (i && t.push(wc); s < n; ) {
    let a = Kn;
    for (const l of e)
      l >= u && l < a && (a = l);
    const c = s + 1;
    a - u > $t((Kn - r) / c) && cn("overflow"), r += (a - u) * c, u = a;
    for (const l of e)
      if (l < u && ++r > Kn && cn("overflow"), l === u) {
        let d = r;
        for (let h = Pt; ; h += Pt) {
          const f = h <= o ? fi : h >= o + Eu ? Eu : h - o;
          if (d < f)
            break;
          const p = d - f, _ = Pt - f;
          t.push(
            ho(Ms(f + p % _, 0))
          ), d = $t(p / _);
        }
        t.push(ho(Ms(d, 0))), o = Ec(r, c, s === i), r = 0, ++s;
      }
    ++r, ++u;
  }
  return t.join("");
}, Jp = function(e) {
  return vc(e, function(t) {
    return Up.test(t) ? Cc(t.slice(4).toLowerCase()) : t;
  });
}, Yp = function(e) {
  return vc(e, function(t) {
    return qp.test(t) ? "xn--" + Ac(t) : t;
  });
}, Sc = {
  /**
   * A string representing the current Punycode.js version number.
   * @memberOf punycode
   * @type String
   */
  version: "2.3.1",
  /**
   * An object of methods to convert from JavaScript's internal character
   * representation (UCS-2) to Unicode code points, and back.
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode
   * @type Object
   */
  ucs2: {
    decode: kc,
    encode: Zp
  },
  decode: Cc,
  encode: Ac,
  toASCII: Yp,
  toUnicode: Jp
}, Xp = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 100
  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
}, Qp = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "text"
      ],
      rules2: [
        "balance_pairs",
        "fragments_join"
      ]
    }
  }
}, eb = {
  options: {
    // Enable HTML tags in source
    html: !0,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !0,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "autolink",
        "backticks",
        "emphasis",
        "entity",
        "escape",
        "html_inline",
        "image",
        "link",
        "newline",
        "text"
      ],
      rules2: [
        "balance_pairs",
        "emphasis",
        "fragments_join"
      ]
    }
  }
}, tb = {
  default: Xp,
  zero: Qp,
  commonmark: eb
}, nb = /^(vbscript|javascript|file|data):/, ub = /^data:image\/(gif|png|jpeg|webp);/;
function rb(e) {
  const t = e.trim().toLowerCase();
  return nb.test(t) ? ub.test(t) : !0;
}
const Dc = ["http:", "https:", "mailto:"];
function ob(e) {
  const t = ii(e, !0);
  if (t.hostname && (!t.protocol || Dc.indexOf(t.protocol) >= 0))
    try {
      t.hostname = Sc.toASCII(t.hostname);
    } catch {
    }
  return Tu(oi(t));
}
function ib(e) {
  const t = ii(e, !0);
  if (t.hostname && (!t.protocol || Dc.indexOf(t.protocol) >= 0))
    try {
      t.hostname = Sc.toUnicode(t.hostname);
    } catch {
    }
  return Jn(oi(t), Jn.defaultChars + "%");
}
function Ct(e, t) {
  if (!(this instanceof Ct))
    return new Ct(e, t);
  t || ai(e) || (t = e || {}, e = "default"), this.inline = new Fu(), this.block = new Ir(), this.core = new li(), this.renderer = new eu(), this.linkify = new mt(), this.validateLink = rb, this.normalizeLink = ob, this.normalizeLinkText = ib, this.utils = a1, this.helpers = Mr({}, f1), this.options = {}, this.configure(e), t && this.set(t);
}
Ct.prototype.set = function(e) {
  return Mr(this.options, e), this;
};
Ct.prototype.configure = function(e) {
  const t = this;
  if (ai(e)) {
    const n = e;
    if (e = tb[n], !e)
      throw new Error('Wrong `markdown-it` preset "' + n + '", check name');
  }
  if (!e)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return e.options && t.set(e.options), e.components && Object.keys(e.components).forEach(function(n) {
    e.components[n].rules && t[n].ruler.enableOnly(e.components[n].rules), e.components[n].rules2 && t[n].ruler2.enableOnly(e.components[n].rules2);
  }), this;
};
Ct.prototype.enable = function(e, t) {
  let n = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(r) {
    n = n.concat(this[r].ruler.enable(e, !0));
  }, this), n = n.concat(this.inline.ruler2.enable(e, !0));
  const u = e.filter(function(r) {
    return n.indexOf(r) < 0;
  });
  if (u.length && !t)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + u);
  return this;
};
Ct.prototype.disable = function(e, t) {
  let n = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(r) {
    n = n.concat(this[r].ruler.disable(e, !0));
  }, this), n = n.concat(this.inline.ruler2.disable(e, !0));
  const u = e.filter(function(r) {
    return n.indexOf(r) < 0;
  });
  if (u.length && !t)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + u);
  return this;
};
Ct.prototype.use = function(e) {
  const t = [this].concat(Array.prototype.slice.call(arguments, 1));
  return e.apply(e, t), this;
};
Ct.prototype.parse = function(e, t) {
  if (typeof e != "string")
    throw new Error("Input data should be a String");
  const n = new this.core.State(e, this, t);
  return this.core.process(n), n.tokens;
};
Ct.prototype.render = function(e, t) {
  return t = t || {}, this.renderer.render(this.parse(e, t), this.options, t);
};
Ct.prototype.parseInline = function(e, t) {
  const n = new this.core.State(e, this, t);
  return n.inlineMode = !0, this.core.process(n), n.tokens;
};
Ct.prototype.renderInline = function(e, t) {
  return t = t || {}, this.renderer.render(this.parseInline(e, t), this.options, t);
};
function sb(e) {
  const t = e.renderer.rules.link_open || ((n, u, r, o, i) => i.renderToken(n, u, r));
  e.renderer.rules.link_open = (n, u, r, o, i) => {
    const s = n[u], a = s.attrIndex("target");
    a < 0 ? s.attrPush(["target", "_blank"]) : s.attrs && (s.attrs[a][1] = "_blank");
    const c = s.attrIndex("rel");
    return c < 0 ? s.attrPush(["rel", "noopener noreferrer"]) : s.attrs && (s.attrs[c][1] = "noopener noreferrer"), t(n, u, r, o, i);
  };
}
const ab = (e) => ({
  IMPORTANT: {
    scope: "meta",
    begin: "!important"
  },
  BLOCK_COMMENT: e.C_BLOCK_COMMENT_MODE,
  HEXCOLOR: {
    scope: "number",
    begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
  },
  FUNCTION_DISPATCH: {
    className: "built_in",
    begin: /[\w-]+(?=\()/
  },
  ATTRIBUTE_SELECTOR_MODE: {
    scope: "selector-attr",
    begin: /\[/,
    end: /\]/,
    illegal: "$",
    contains: [
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ]
  },
  CSS_NUMBER_MODE: {
    scope: "number",
    begin: e.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
    relevance: 0
  },
  CSS_VARIABLE: {
    className: "attr",
    begin: /--[A-Za-z_][A-Za-z0-9_-]*/
  }
}), cb = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "blockquote",
  "body",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "p",
  "picture",
  "q",
  "quote",
  "samp",
  "section",
  "select",
  "source",
  "span",
  "strong",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "ul",
  "var",
  "video"
], lb = [
  "defs",
  "g",
  "marker",
  "mask",
  "pattern",
  "svg",
  "switch",
  "symbol",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feFlood",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMorphology",
  "feOffset",
  "feSpecularLighting",
  "feTile",
  "feTurbulence",
  "linearGradient",
  "radialGradient",
  "stop",
  "circle",
  "ellipse",
  "image",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "use",
  "textPath",
  "tspan",
  "foreignObject",
  "clipPath"
], db = [
  ...cb,
  ...lb
], fb = [
  "any-hover",
  "any-pointer",
  "aspect-ratio",
  "color",
  "color-gamut",
  "color-index",
  "device-aspect-ratio",
  "device-height",
  "device-width",
  "display-mode",
  "forced-colors",
  "grid",
  "height",
  "hover",
  "inverted-colors",
  "monochrome",
  "orientation",
  "overflow-block",
  "overflow-inline",
  "pointer",
  "prefers-color-scheme",
  "prefers-contrast",
  "prefers-reduced-motion",
  "prefers-reduced-transparency",
  "resolution",
  "scan",
  "scripting",
  "update",
  "width",
  // TODO: find a better solution?
  "min-width",
  "max-width",
  "min-height",
  "max-height"
].sort().reverse(), hb = [
  "active",
  "any-link",
  "blank",
  "checked",
  "current",
  "default",
  "defined",
  "dir",
  // dir()
  "disabled",
  "drop",
  "empty",
  "enabled",
  "first",
  "first-child",
  "first-of-type",
  "fullscreen",
  "future",
  "focus",
  "focus-visible",
  "focus-within",
  "has",
  // has()
  "host",
  // host or host()
  "host-context",
  // host-context()
  "hover",
  "indeterminate",
  "in-range",
  "invalid",
  "is",
  // is()
  "lang",
  // lang()
  "last-child",
  "last-of-type",
  "left",
  "link",
  "local-link",
  "not",
  // not()
  "nth-child",
  // nth-child()
  "nth-col",
  // nth-col()
  "nth-last-child",
  // nth-last-child()
  "nth-last-col",
  // nth-last-col()
  "nth-last-of-type",
  //nth-last-of-type()
  "nth-of-type",
  //nth-of-type()
  "only-child",
  "only-of-type",
  "optional",
  "out-of-range",
  "past",
  "placeholder-shown",
  "read-only",
  "read-write",
  "required",
  "right",
  "root",
  "scope",
  "target",
  "target-within",
  "user-invalid",
  "valid",
  "visited",
  "where"
  // where()
].sort().reverse(), pb = [
  "after",
  "backdrop",
  "before",
  "cue",
  "cue-region",
  "first-letter",
  "first-line",
  "grammar-error",
  "marker",
  "part",
  "placeholder",
  "selection",
  "slotted",
  "spelling-error"
].sort().reverse(), bb = [
  "accent-color",
  "align-content",
  "align-items",
  "align-self",
  "alignment-baseline",
  "all",
  "anchor-name",
  "animation",
  "animation-composition",
  "animation-delay",
  "animation-direction",
  "animation-duration",
  "animation-fill-mode",
  "animation-iteration-count",
  "animation-name",
  "animation-play-state",
  "animation-range",
  "animation-range-end",
  "animation-range-start",
  "animation-timeline",
  "animation-timing-function",
  "appearance",
  "aspect-ratio",
  "backdrop-filter",
  "backface-visibility",
  "background",
  "background-attachment",
  "background-blend-mode",
  "background-clip",
  "background-color",
  "background-image",
  "background-origin",
  "background-position",
  "background-position-x",
  "background-position-y",
  "background-repeat",
  "background-size",
  "baseline-shift",
  "block-size",
  "border",
  "border-block",
  "border-block-color",
  "border-block-end",
  "border-block-end-color",
  "border-block-end-style",
  "border-block-end-width",
  "border-block-start",
  "border-block-start-color",
  "border-block-start-style",
  "border-block-start-width",
  "border-block-style",
  "border-block-width",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-end-end-radius",
  "border-end-start-radius",
  "border-image",
  "border-image-outset",
  "border-image-repeat",
  "border-image-slice",
  "border-image-source",
  "border-image-width",
  "border-inline",
  "border-inline-color",
  "border-inline-end",
  "border-inline-end-color",
  "border-inline-end-style",
  "border-inline-end-width",
  "border-inline-start",
  "border-inline-start-color",
  "border-inline-start-style",
  "border-inline-start-width",
  "border-inline-style",
  "border-inline-width",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-start-end-radius",
  "border-start-start-radius",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-style",
  "border-top-width",
  "border-width",
  "bottom",
  "box-align",
  "box-decoration-break",
  "box-direction",
  "box-flex",
  "box-flex-group",
  "box-lines",
  "box-ordinal-group",
  "box-orient",
  "box-pack",
  "box-shadow",
  "box-sizing",
  "break-after",
  "break-before",
  "break-inside",
  "caption-side",
  "caret-color",
  "clear",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "color-scheme",
  "column-count",
  "column-fill",
  "column-gap",
  "column-rule",
  "column-rule-color",
  "column-rule-style",
  "column-rule-width",
  "column-span",
  "column-width",
  "columns",
  "contain",
  "contain-intrinsic-block-size",
  "contain-intrinsic-height",
  "contain-intrinsic-inline-size",
  "contain-intrinsic-size",
  "contain-intrinsic-width",
  "container",
  "container-name",
  "container-type",
  "content",
  "content-visibility",
  "counter-increment",
  "counter-reset",
  "counter-set",
  "cue",
  "cue-after",
  "cue-before",
  "cursor",
  "cx",
  "cy",
  "direction",
  "display",
  "dominant-baseline",
  "empty-cells",
  "enable-background",
  "field-sizing",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-flow",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "float",
  "flood-color",
  "flood-opacity",
  "flow",
  "font",
  "font-display",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-language-override",
  "font-optical-sizing",
  "font-palette",
  "font-size",
  "font-size-adjust",
  "font-smooth",
  "font-smoothing",
  "font-stretch",
  "font-style",
  "font-synthesis",
  "font-synthesis-position",
  "font-synthesis-small-caps",
  "font-synthesis-style",
  "font-synthesis-weight",
  "font-variant",
  "font-variant-alternates",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-emoji",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-variant-position",
  "font-variation-settings",
  "font-weight",
  "forced-color-adjust",
  "gap",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "grid",
  "grid-area",
  "grid-auto-columns",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-column",
  "grid-column-end",
  "grid-column-start",
  "grid-gap",
  "grid-row",
  "grid-row-end",
  "grid-row-start",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "hanging-punctuation",
  "height",
  "hyphenate-character",
  "hyphenate-limit-chars",
  "hyphens",
  "icon",
  "image-orientation",
  "image-rendering",
  "image-resolution",
  "ime-mode",
  "initial-letter",
  "initial-letter-align",
  "inline-size",
  "inset",
  "inset-area",
  "inset-block",
  "inset-block-end",
  "inset-block-start",
  "inset-inline",
  "inset-inline-end",
  "inset-inline-start",
  "isolation",
  "justify-content",
  "justify-items",
  "justify-self",
  "kerning",
  "left",
  "letter-spacing",
  "lighting-color",
  "line-break",
  "line-height",
  "line-height-step",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "margin",
  "margin-block",
  "margin-block-end",
  "margin-block-start",
  "margin-bottom",
  "margin-inline",
  "margin-inline-end",
  "margin-inline-start",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-trim",
  "marker",
  "marker-end",
  "marker-mid",
  "marker-start",
  "marks",
  "mask",
  "mask-border",
  "mask-border-mode",
  "mask-border-outset",
  "mask-border-repeat",
  "mask-border-slice",
  "mask-border-source",
  "mask-border-width",
  "mask-clip",
  "mask-composite",
  "mask-image",
  "mask-mode",
  "mask-origin",
  "mask-position",
  "mask-repeat",
  "mask-size",
  "mask-type",
  "masonry-auto-flow",
  "math-depth",
  "math-shift",
  "math-style",
  "max-block-size",
  "max-height",
  "max-inline-size",
  "max-width",
  "min-block-size",
  "min-height",
  "min-inline-size",
  "min-width",
  "mix-blend-mode",
  "nav-down",
  "nav-index",
  "nav-left",
  "nav-right",
  "nav-up",
  "none",
  "normal",
  "object-fit",
  "object-position",
  "offset",
  "offset-anchor",
  "offset-distance",
  "offset-path",
  "offset-position",
  "offset-rotate",
  "opacity",
  "order",
  "orphans",
  "outline",
  "outline-color",
  "outline-offset",
  "outline-style",
  "outline-width",
  "overflow",
  "overflow-anchor",
  "overflow-block",
  "overflow-clip-margin",
  "overflow-inline",
  "overflow-wrap",
  "overflow-x",
  "overflow-y",
  "overlay",
  "overscroll-behavior",
  "overscroll-behavior-block",
  "overscroll-behavior-inline",
  "overscroll-behavior-x",
  "overscroll-behavior-y",
  "padding",
  "padding-block",
  "padding-block-end",
  "padding-block-start",
  "padding-bottom",
  "padding-inline",
  "padding-inline-end",
  "padding-inline-start",
  "padding-left",
  "padding-right",
  "padding-top",
  "page",
  "page-break-after",
  "page-break-before",
  "page-break-inside",
  "paint-order",
  "pause",
  "pause-after",
  "pause-before",
  "perspective",
  "perspective-origin",
  "place-content",
  "place-items",
  "place-self",
  "pointer-events",
  "position",
  "position-anchor",
  "position-visibility",
  "print-color-adjust",
  "quotes",
  "r",
  "resize",
  "rest",
  "rest-after",
  "rest-before",
  "right",
  "rotate",
  "row-gap",
  "ruby-align",
  "ruby-position",
  "scale",
  "scroll-behavior",
  "scroll-margin",
  "scroll-margin-block",
  "scroll-margin-block-end",
  "scroll-margin-block-start",
  "scroll-margin-bottom",
  "scroll-margin-inline",
  "scroll-margin-inline-end",
  "scroll-margin-inline-start",
  "scroll-margin-left",
  "scroll-margin-right",
  "scroll-margin-top",
  "scroll-padding",
  "scroll-padding-block",
  "scroll-padding-block-end",
  "scroll-padding-block-start",
  "scroll-padding-bottom",
  "scroll-padding-inline",
  "scroll-padding-inline-end",
  "scroll-padding-inline-start",
  "scroll-padding-left",
  "scroll-padding-right",
  "scroll-padding-top",
  "scroll-snap-align",
  "scroll-snap-stop",
  "scroll-snap-type",
  "scroll-timeline",
  "scroll-timeline-axis",
  "scroll-timeline-name",
  "scrollbar-color",
  "scrollbar-gutter",
  "scrollbar-width",
  "shape-image-threshold",
  "shape-margin",
  "shape-outside",
  "shape-rendering",
  "speak",
  "speak-as",
  "src",
  // @font-face
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "tab-size",
  "table-layout",
  "text-align",
  "text-align-all",
  "text-align-last",
  "text-anchor",
  "text-combine-upright",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-skip",
  "text-decoration-skip-ink",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-emphasis",
  "text-emphasis-color",
  "text-emphasis-position",
  "text-emphasis-style",
  "text-indent",
  "text-justify",
  "text-orientation",
  "text-overflow",
  "text-rendering",
  "text-shadow",
  "text-size-adjust",
  "text-transform",
  "text-underline-offset",
  "text-underline-position",
  "text-wrap",
  "text-wrap-mode",
  "text-wrap-style",
  "timeline-scope",
  "top",
  "touch-action",
  "transform",
  "transform-box",
  "transform-origin",
  "transform-style",
  "transition",
  "transition-behavior",
  "transition-delay",
  "transition-duration",
  "transition-property",
  "transition-timing-function",
  "translate",
  "unicode-bidi",
  "user-modify",
  "user-select",
  "vector-effect",
  "vertical-align",
  "view-timeline",
  "view-timeline-axis",
  "view-timeline-inset",
  "view-timeline-name",
  "view-transition-name",
  "visibility",
  "voice-balance",
  "voice-duration",
  "voice-family",
  "voice-pitch",
  "voice-range",
  "voice-rate",
  "voice-stress",
  "voice-volume",
  "white-space",
  "white-space-collapse",
  "widows",
  "width",
  "will-change",
  "word-break",
  "word-spacing",
  "word-wrap",
  "writing-mode",
  "x",
  "y",
  "z-index",
  "zoom"
].sort().reverse();
function gb(e) {
  const t = e.regex, n = ab(e), u = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, r = "and or not only", o = /@-?\w[\w]*(-\w+)*/, i = "[a-zA-Z-][a-zA-Z0-9_-]*", s = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE
  ];
  return {
    name: "CSS",
    case_insensitive: !0,
    illegal: /[=|'\$]/,
    keywords: { keyframePosition: "from to" },
    classNameAliases: {
      // for visual continuity with `tag {}` and because we
      // don't have a great class for this?
      keyframePosition: "selector-tag"
    },
    contains: [
      n.BLOCK_COMMENT,
      u,
      // to recognize keyframe 40% etc which are outside the scope of our
      // attribute value mode
      n.CSS_NUMBER_MODE,
      {
        className: "selector-id",
        begin: /#[A-Za-z0-9_-]+/,
        relevance: 0
      },
      {
        className: "selector-class",
        begin: "\\." + i,
        relevance: 0
      },
      n.ATTRIBUTE_SELECTOR_MODE,
      {
        className: "selector-pseudo",
        variants: [
          { begin: ":(" + hb.join("|") + ")" },
          { begin: ":(:)?(" + pb.join("|") + ")" }
        ]
      },
      // we may actually need this (12/2020)
      // { // pseudo-selector params
      //   begin: /\(/,
      //   end: /\)/,
      //   contains: [ hljs.CSS_NUMBER_MODE ]
      // },
      n.CSS_VARIABLE,
      {
        className: "attribute",
        begin: "\\b(" + bb.join("|") + ")\\b"
      },
      // attribute values
      {
        begin: /:/,
        end: /[;}{]/,
        contains: [
          n.BLOCK_COMMENT,
          n.HEXCOLOR,
          n.IMPORTANT,
          n.CSS_NUMBER_MODE,
          ...s,
          // needed to highlight these as strings and to avoid issues with
          // illegal characters that might be inside urls that would tigger the
          // languages illegal stack
          {
            begin: /(url|data-uri)\(/,
            end: /\)/,
            relevance: 0,
            // from keywords
            keywords: { built_in: "url data-uri" },
            contains: [
              ...s,
              {
                className: "string",
                // any character other than `)` as in `url()` will be the start
                // of a string, which ends with `)` (from the parent mode)
                begin: /[^)]/,
                endsWithParent: !0,
                excludeEnd: !0
              }
            ]
          },
          n.FUNCTION_DISPATCH
        ]
      },
      {
        begin: t.lookahead(/@/),
        end: "[{;]",
        relevance: 0,
        illegal: /:/,
        // break on Less variables @var: ...
        contains: [
          {
            className: "keyword",
            begin: o
          },
          {
            begin: /\s/,
            endsWithParent: !0,
            excludeEnd: !0,
            relevance: 0,
            keywords: {
              $pattern: /[a-z-]+/,
              keyword: r,
              attribute: fb.join(" ")
            },
            contains: [
              {
                begin: /[a-z-]+(?=:)/,
                className: "attribute"
              },
              ...s,
              n.CSS_NUMBER_MODE
            ]
          }
        ]
      },
      {
        className: "selector-tag",
        begin: "\\b(" + db.join("|") + ")\\b"
      }
    ]
  };
}
var zn = "[0-9](_*[0-9])*", Gu = `\\.(${zn})`, Vu = "[0-9a-fA-F](_*[0-9a-fA-F])*", Fs = {
  className: "number",
  variants: [
    // DecimalFloatingPointLiteral
    // including ExponentPart
    { begin: `(\\b(${zn})((${Gu})|\\.)?|(${Gu}))[eE][+-]?(${zn})[fFdD]?\\b` },
    // excluding ExponentPart
    { begin: `\\b(${zn})((${Gu})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
    { begin: `(${Gu})[fFdD]?\\b` },
    { begin: `\\b(${zn})[fFdD]\\b` },
    // HexadecimalFloatingPointLiteral
    { begin: `\\b0[xX]((${Vu})\\.?|(${Vu})?\\.(${Vu}))[pP][+-]?(${zn})[fFdD]?\\b` },
    // DecimalIntegerLiteral
    { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
    // HexIntegerLiteral
    { begin: `\\b0[xX](${Vu})[lL]?\\b` },
    // OctalIntegerLiteral
    { begin: "\\b0(_*[0-7])*[lL]?\\b" },
    // BinaryIntegerLiteral
    { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
  ],
  relevance: 0
};
function Tc(e, t, n) {
  return n === -1 ? "" : e.replace(t, (u) => Tc(e, t, n - 1));
}
function mb(e) {
  const t = e.regex, n = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*", u = n + Tc("(?:<" + n + "~~~(?:\\s*,\\s*" + n + "~~~)*>)?", /~~~/g, 2), a = {
    keyword: [
      "synchronized",
      "abstract",
      "private",
      "var",
      "static",
      "if",
      "const ",
      "for",
      "while",
      "strictfp",
      "finally",
      "protected",
      "import",
      "native",
      "final",
      "void",
      "enum",
      "else",
      "break",
      "transient",
      "catch",
      "instanceof",
      "volatile",
      "case",
      "assert",
      "package",
      "default",
      "public",
      "try",
      "switch",
      "continue",
      "throws",
      "protected",
      "public",
      "private",
      "module",
      "requires",
      "exports",
      "do",
      "sealed",
      "yield",
      "permits",
      "goto",
      "when"
    ],
    literal: [
      "false",
      "true",
      "null"
    ],
    type: [
      "char",
      "boolean",
      "long",
      "float",
      "int",
      "byte",
      "short",
      "double"
    ],
    built_in: [
      "super",
      "this"
    ]
  }, c = {
    className: "meta",
    begin: "@" + n,
    contains: [
      {
        begin: /\(/,
        end: /\)/,
        contains: ["self"]
        // allow nested () inside our annotation
      }
    ]
  }, l = {
    className: "params",
    begin: /\(/,
    end: /\)/,
    keywords: a,
    relevance: 0,
    contains: [e.C_BLOCK_COMMENT_MODE],
    endsParent: !0
  };
  return {
    name: "Java",
    aliases: ["jsp"],
    keywords: a,
    illegal: /<\/|#/,
    contains: [
      e.COMMENT(
        "/\\*\\*",
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              // eat up @'s in emails to prevent them to be recognized as doctags
              begin: /\w+@/,
              relevance: 0
            },
            {
              className: "doctag",
              begin: "@[A-Za-z]+"
            }
          ]
        }
      ),
      // relevance boost
      {
        begin: /import java\.[a-z]+\./,
        keywords: "import",
        relevance: 2
      },
      e.C_LINE_COMMENT_MODE,
      e.C_BLOCK_COMMENT_MODE,
      {
        begin: /"""/,
        end: /"""/,
        className: "string",
        contains: [e.BACKSLASH_ESCAPE]
      },
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      {
        match: [
          /\b(?:class|interface|enum|extends|implements|new)/,
          /\s+/,
          n
        ],
        className: {
          1: "keyword",
          3: "title.class"
        }
      },
      {
        // Exceptions for hyphenated keywords
        match: /non-sealed/,
        scope: "keyword"
      },
      {
        begin: [
          t.concat(/(?!else)/, n),
          /\s+/,
          n,
          /\s+/,
          /=(?!=)/
        ],
        className: {
          1: "type",
          3: "variable",
          5: "operator"
        }
      },
      {
        begin: [
          /record/,
          /\s+/,
          n
        ],
        className: {
          1: "keyword",
          3: "title.class"
        },
        contains: [
          l,
          e.C_LINE_COMMENT_MODE,
          e.C_BLOCK_COMMENT_MODE
        ]
      },
      {
        // Expression keywords prevent 'keyword Name(...)' from being
        // recognized as a function definition
        beginKeywords: "new throw return else",
        relevance: 0
      },
      {
        begin: [
          "(?:" + u + "\\s+)",
          e.UNDERSCORE_IDENT_RE,
          /\s*(?=\()/
        ],
        className: { 2: "title.function" },
        keywords: a,
        contains: [
          {
            className: "params",
            begin: /\(/,
            end: /\)/,
            keywords: a,
            relevance: 0,
            contains: [
              c,
              e.APOS_STRING_MODE,
              e.QUOTE_STRING_MODE,
              Fs,
              e.C_BLOCK_COMMENT_MODE
            ]
          },
          e.C_LINE_COMMENT_MODE,
          e.C_BLOCK_COMMENT_MODE
        ]
      },
      Fs,
      c
    ]
  };
}
const Is = "[A-Za-z$_][0-9A-Za-z$_]*", _b = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], xb = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Mc = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], Fc = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Ic = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], yb = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], wb = [].concat(
  Ic,
  Mc,
  Fc
);
function vb(e) {
  const t = e.regex, n = (ie, { after: $e }) => {
    const Ye = "</" + ie[0].slice(1);
    return ie.input.indexOf(Ye, $e) !== -1;
  }, u = Is, r = {
    begin: "<>",
    end: "</>"
  }, o = /<[A-Za-z0-9\\._:-]+\s*\/>/, i = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (ie, $e) => {
      const Ye = ie[0].length + ie.index, Xe = ie.input[Ye];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        Xe === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        Xe === ","
      ) {
        $e.ignoreMatch();
        return;
      }
      Xe === ">" && (n(ie, { after: Ye }) || $e.ignoreMatch());
      let He;
      const Mt = ie.input.substring(Ye);
      if (He = Mt.match(/^\s*=/)) {
        $e.ignoreMatch();
        return;
      }
      if ((He = Mt.match(/^\s+extends\s+/)) && He.index === 0) {
        $e.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: Is,
    keyword: _b,
    literal: xb,
    built_in: wb,
    "variable.language": yb
  }, a = "[0-9](_?[0-9])*", c = `\\.(${a})`, l = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", d = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${l})((${c})|\\.)?|(${c}))[eE][+-]?(${a})\\b` },
      { begin: `\\b(${l})\\b((${c})\\b|\\.)?|(${c})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, h = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: s,
    contains: []
    // defined later
  }, f = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "xml"
    }
  }, p = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "css"
    }
  }, _ = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "graphql"
    }
  }, O = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      h
    ]
  }, A = {
    className: "comment",
    variants: [
      e.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: u + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      e.C_BLOCK_COMMENT_MODE,
      e.C_LINE_COMMENT_MODE
    ]
  }, T = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    p,
    _,
    O,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  h.contains = T.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(T)
  });
  const v = [].concat(A, h.contains), x = v.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(v)
    }
  ]), L = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: s,
    contains: x
  }, ne = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          u,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(u, "(", t.concat(/\./, u), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          u
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, q = {
    relevance: 0,
    match: t.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...Mc,
        ...Fc
      ]
    }
  }, F = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, te = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          u,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [L],
    illegal: /%/
  }, I = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function k(ie) {
    return t.concat("(?!", ie.join("|"), ")");
  }
  const J = {
    match: t.concat(
      /\b/,
      k([
        ...Ic,
        "super",
        "import"
      ].map((ie) => `${ie}\\s*\\(`)),
      u,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, he = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(u, /(?![0-9A-Za-z$_(])/)
    )),
    end: u,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, Te = {
    match: [
      /get|set/,
      /\s+/,
      u,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      L
    ]
  }, Me = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", xe = {
    match: [
      /const|var|let/,
      /\s+/,
      u,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(Me)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      L
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: s,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: x, CLASS_REFERENCE: q },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      F,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      p,
      _,
      O,
      A,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      q,
      {
        scope: "attr",
        match: u + t.lookahead(":"),
        relevance: 0
      },
      xe,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          A,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Me,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: e.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: s,
                    contains: x
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: r.begin, end: r.end },
              { match: o },
              {
                begin: i.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": i.isTrulyOpeningTag,
                end: i.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: i.begin,
                end: i.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      te,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + e.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          L,
          e.inherit(e.TITLE_MODE, { begin: u, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      he,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + u,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [L]
      },
      J,
      I,
      ne,
      Te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function kb(e) {
  const t = e.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), u = [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "case",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "match",
    "nonlocal|10",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield"
  ], s = {
    $pattern: /[A-Za-z]\w+|__\w+__/,
    keyword: u,
    built_in: [
      "__import__",
      "abs",
      "all",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ],
    literal: [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ],
    type: [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ]
  }, a = {
    className: "meta",
    begin: /^(>>>|\.\.\.) /
  }, c = {
    className: "subst",
    begin: /\{/,
    end: /\}/,
    keywords: s,
    illegal: /#/
  }, l = {
    begin: /\{\{/,
    relevance: 0
  }, d = {
    className: "string",
    contains: [e.BACKSLASH_ESCAPE],
    variants: [
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          a
        ],
        relevance: 10
      },
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          a
        ],
        relevance: 10
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          a,
          l,
          c
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          a,
          l,
          c
        ]
      },
      {
        begin: /([uU]|[rR])'/,
        end: /'/,
        relevance: 10
      },
      {
        begin: /([uU]|[rR])"/,
        end: /"/,
        relevance: 10
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])'/,
        end: /'/
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])"/,
        end: /"/
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'/,
        end: /'/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l,
          c
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"/,
        end: /"/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l,
          c
        ]
      },
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ]
  }, h = "[0-9](_?[0-9])*", f = `(\\b(${h}))?\\.(${h})|\\b(${h})\\.`, p = `\\b|${u.join("|")}`, _ = {
    className: "number",
    relevance: 0,
    variants: [
      // exponentfloat, pointfloat
      // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
      // optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      // Note: no leading \b because floats can start with a decimal point
      // and we don't want to mishandle e.g. `fn(.5)`,
      // no trailing \b for pointfloat because it can end with a decimal point
      // and we don't want to mishandle e.g. `0..hex()`; this should be safe
      // because both MUST contain a decimal point and so cannot be confused with
      // the interior part of an identifier
      {
        begin: `(\\b(${h})|(${f}))[eE][+-]?(${h})[jJ]?(?=${p})`
      },
      {
        begin: `(${f})[jJ]?`
      },
      // decinteger, bininteger, octinteger, hexinteger
      // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
      // optionally "long" in Python 2
      // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
      // decinteger is optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${p})`
      },
      {
        begin: `\\b0[bB](_?[01])+[lL]?(?=${p})`
      },
      {
        begin: `\\b0[oO](_?[0-7])+[lL]?(?=${p})`
      },
      {
        begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${p})`
      },
      // imagnumber (digitpart-based)
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b(${h})[jJ](?=${p})`
      }
    ]
  }, O = {
    className: "comment",
    begin: t.lookahead(/# type:/),
    end: /$/,
    keywords: s,
    contains: [
      {
        // prevent keywords from coloring `type`
        begin: /# type:/
      },
      // comment within a datatype comment includes no keywords
      {
        begin: /#/,
        end: /\b\B/,
        endsWithParent: !0
      }
    ]
  }, P = {
    className: "params",
    variants: [
      // Exclude params in functions without params
      {
        className: "",
        begin: /\(\s*\)/,
        skip: !0
      },
      {
        begin: /\(/,
        end: /\)/,
        excludeBegin: !0,
        excludeEnd: !0,
        keywords: s,
        contains: [
          "self",
          a,
          _,
          d,
          e.HASH_COMMENT_MODE
        ]
      }
    ]
  };
  return c.contains = [
    d,
    _,
    a
  ], {
    name: "Python",
    aliases: [
      "py",
      "gyp",
      "ipython"
    ],
    unicodeRegex: !0,
    keywords: s,
    illegal: /(<\/|\?)|=>/,
    contains: [
      a,
      _,
      {
        // very common convention
        scope: "variable.language",
        match: /\bself\b/
      },
      {
        // eat "if" prior to string so that it won't accidentally be
        // labeled as an f-string
        beginKeywords: "if",
        relevance: 0
      },
      { match: /\bor\b/, scope: "keyword" },
      d,
      O,
      e.HASH_COMMENT_MODE,
      {
        match: [
          /\bdef/,
          /\s+/,
          n
        ],
        scope: {
          1: "keyword",
          3: "title.function"
        },
        contains: [P]
      },
      {
        variants: [
          {
            match: [
              /\bclass/,
              /\s+/,
              n,
              /\s*/,
              /\(\s*/,
              n,
              /\s*\)/
            ]
          },
          {
            match: [
              /\bclass/,
              /\s+/,
              n
            ]
          }
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          6: "title.class.inherited"
        }
      },
      {
        className: "meta",
        begin: /^[\t ]*@/,
        end: /(?=#)|$/,
        contains: [
          _,
          P,
          d
        ]
      }
    ]
  };
}
const dr = "[A-Za-z$_][0-9A-Za-z$_]*", Rc = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], Nc = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Oc = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], Lc = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Bc = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], Pc = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], $c = [].concat(
  Bc,
  Oc,
  Lc
);
function Eb(e) {
  const t = e.regex, n = (ie, { after: $e }) => {
    const Ye = "</" + ie[0].slice(1);
    return ie.input.indexOf(Ye, $e) !== -1;
  }, u = dr, r = {
    begin: "<>",
    end: "</>"
  }, o = /<[A-Za-z0-9\\._:-]+\s*\/>/, i = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (ie, $e) => {
      const Ye = ie[0].length + ie.index, Xe = ie.input[Ye];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        Xe === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        Xe === ","
      ) {
        $e.ignoreMatch();
        return;
      }
      Xe === ">" && (n(ie, { after: Ye }) || $e.ignoreMatch());
      let He;
      const Mt = ie.input.substring(Ye);
      if (He = Mt.match(/^\s*=/)) {
        $e.ignoreMatch();
        return;
      }
      if ((He = Mt.match(/^\s+extends\s+/)) && He.index === 0) {
        $e.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: dr,
    keyword: Rc,
    literal: Nc,
    built_in: $c,
    "variable.language": Pc
  }, a = "[0-9](_?[0-9])*", c = `\\.(${a})`, l = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", d = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${l})((${c})|\\.)?|(${c}))[eE][+-]?(${a})\\b` },
      { begin: `\\b(${l})\\b((${c})\\b|\\.)?|(${c})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, h = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: s,
    contains: []
    // defined later
  }, f = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "xml"
    }
  }, p = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "css"
    }
  }, _ = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        h
      ],
      subLanguage: "graphql"
    }
  }, O = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      h
    ]
  }, A = {
    className: "comment",
    variants: [
      e.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: u + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      e.C_BLOCK_COMMENT_MODE,
      e.C_LINE_COMMENT_MODE
    ]
  }, T = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    p,
    _,
    O,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  h.contains = T.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(T)
  });
  const v = [].concat(A, h.contains), x = v.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(v)
    }
  ]), L = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: s,
    contains: x
  }, ne = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          u,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(u, "(", t.concat(/\./, u), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          u
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, q = {
    relevance: 0,
    match: t.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...Oc,
        ...Lc
      ]
    }
  }, F = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, te = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          u,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [L],
    illegal: /%/
  }, I = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function k(ie) {
    return t.concat("(?!", ie.join("|"), ")");
  }
  const J = {
    match: t.concat(
      /\b/,
      k([
        ...Bc,
        "super",
        "import"
      ].map((ie) => `${ie}\\s*\\(`)),
      u,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, he = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(u, /(?![0-9A-Za-z$_(])/)
    )),
    end: u,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, Te = {
    match: [
      /get|set/,
      /\s+/,
      u,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      L
    ]
  }, Me = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", xe = {
    match: [
      /const|var|let/,
      /\s+/,
      u,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(Me)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      L
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: s,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: x, CLASS_REFERENCE: q },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      F,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      p,
      _,
      O,
      A,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      q,
      {
        scope: "attr",
        match: u + t.lookahead(":"),
        relevance: 0
      },
      xe,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          A,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Me,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: e.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: s,
                    contains: x
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: r.begin, end: r.end },
              { match: o },
              {
                begin: i.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": i.isTrulyOpeningTag,
                end: i.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: i.begin,
                end: i.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      te,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + e.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          L,
          e.inherit(e.TITLE_MODE, { begin: u, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      he,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + u,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [L]
      },
      J,
      I,
      ne,
      Te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function Cb(e) {
  const t = e.regex, n = Eb(e), u = dr, r = [
    "any",
    "void",
    "number",
    "boolean",
    "string",
    "object",
    "never",
    "symbol",
    "bigint",
    "unknown"
  ], o = {
    begin: [
      /namespace/,
      /\s+/,
      e.IDENT_RE
    ],
    beginScope: {
      1: "keyword",
      3: "title.class"
    }
  }, i = {
    beginKeywords: "interface",
    end: /\{/,
    excludeEnd: !0,
    keywords: {
      keyword: "interface extends",
      built_in: r
    },
    contains: [n.exports.CLASS_REFERENCE]
  }, s = {
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use strict['"]/
  }, a = [
    "type",
    // "namespace",
    "interface",
    "public",
    "private",
    "protected",
    "implements",
    "declare",
    "abstract",
    "readonly",
    "enum",
    "override",
    "satisfies"
  ], c = {
    $pattern: dr,
    keyword: Rc.concat(a),
    literal: Nc,
    built_in: $c.concat(r),
    "variable.language": Pc
  }, l = {
    className: "meta",
    begin: "@" + u
  }, d = (_, O, P) => {
    const A = _.contains.findIndex((T) => T.label === O);
    if (A === -1)
      throw new Error("can not find mode to replace");
    _.contains.splice(A, 1, P);
  };
  Object.assign(n.keywords, c), n.exports.PARAMS_CONTAINS.push(l);
  const h = n.contains.find((_) => _.scope === "attr"), f = Object.assign(
    {},
    h,
    { match: t.concat(u, t.lookahead(/\s*\?:/)) }
  );
  n.exports.PARAMS_CONTAINS.push([
    n.exports.CLASS_REFERENCE,
    // class reference for highlighting the params types
    h,
    // highlight the params key
    f
    // Added for optional property assignment highlighting
  ]), n.contains = n.contains.concat([
    l,
    o,
    i,
    f
    // Added for optional property assignment highlighting
  ]), d(n, "shebang", e.SHEBANG()), d(n, "use_strict", s);
  const p = n.contains.find((_) => _.label === "func.def");
  return p.relevance = 0, Object.assign(n, {
    name: "TypeScript",
    aliases: [
      "ts",
      "tsx",
      "mts",
      "cts"
    ]
  }), n;
}
const Ab = ["innerHTML"], Sb = /* @__PURE__ */ Se({
  __name: "MarkdownRenderer.ce",
  props: {
    source: { type: String }
  },
  setup(e) {
    kn.registerLanguage("javascript", vb), kn.registerLanguage("python", kb), kn.registerLanguage("css", gb), kn.registerLanguage("java", mb), kn.registerLanguage("typescript", Cb);
    const t = e, n = new Ct({
      html: !0,
      linkify: !0,
      typographer: !0,
      highlight: (r, o) => {
        if (o && kn.getLanguage(o))
          try {
            return `<pre><code class="hljs ${o}">` + kn.highlight(r, { language: o }).value + "</code></pre>";
          } catch {
          }
        return `<pre><code>${n.utils.escapeHtml(r)}</code></pre>`;
      }
    });
    sb(n);
    const u = le(() => n.render(t.source));
    return (r, o) => (N(), K("div", {
      class: "markdown-content",
      innerHTML: u.value
    }, null, 8, Ab));
  }
}), Db = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!
  Theme: GitHub
  Description: Light theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-light
  Current colors taken from GitHub's CSS
*/.hljs{color:#24292e;background:#fff}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id{color:#005cc5}.hljs-regexp,.hljs-string,.hljs-meta .hljs-string{color:#032f62}.hljs-built_in,.hljs-symbol{color:#e36209}.hljs-comment,.hljs-code,.hljs-formula{color:#6a737d}.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo{color:#22863a}.hljs-subst{color:#24292e}.hljs-section{color:#005cc5;font-weight:700}.hljs-bullet{color:#735c0f}.hljs-emphasis{color:#24292e;font-style:italic}.hljs-strong{color:#24292e;font-weight:700}.hljs-addition{color:#22863a;background-color:#f0fff4}.hljs-deletion{color:#b31d28;background-color:#ffeef0}`, Tb = ".markdown-content>*:first-child{margin-block-start:0}.markdown-content>*:last-child{margin-block-end:0}.markdown-content h1,.markdown-content h2,.markdown-content h3,.markdown-content h4,.markdown-content h5,.markdown-content h6{margin-top:1.5rem;margin-bottom:1rem}.markdown-content p{margin-bottom:1rem;line-height:1.6}.markdown-content pre{padding:1rem;border-radius:.5rem;overflow-x:auto}.markdown-content code{padding:.2rem .4rem;border-radius:.3rem;background:var(--code-bg);color:var(--code-color)}.markdown-content a{text-decoration:none;color:#3490dc}.markdown-content a:hover{text-decoration:underline}.markdown-content img{max-width:100%;height:auto}.markdown-content table{display:block;width:100%;margin-bottom:1rem;border-collapse:collapse;overflow-x:auto;white-space:wrap}.markdown-content table th,.markdown-content table td{padding:.75rem;border:1px solid #ddd;text-align:left}.markdown-content table th{background-color:var(--bg-table-header)}", zc = /* @__PURE__ */ De(Sb, [["styles", [Db, Tb]]]);
function Mb(e) {
  try {
    return new URL(e), !0;
  } catch {
    return !1;
  }
}
function Fb(e) {
  return /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(e);
}
function Ib(e) {
  const t = le(() => Mb(e.value)), n = le(() => t.value && Fb(e.value));
  return { isUrl: t, isImg: n };
}
function Nr() {
  const e = Je(), t = le(() => {
    var f;
    return ((f = e.session) == null ? void 0 : f.agents) ?? [];
  }), n = le(() => Object.fromEntries(t.value.map((f) => [f.id, f])));
  function u(f) {
    return f ? n.value[f] ?? null : null;
  }
  function r(f) {
    const p = f ? e.threadById[f] : null;
    return p ? u(p.agentId) : null;
  }
  const o = le(() => r(e.activeThreadId) ?? t.value[0] ?? null), i = le(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.name) ?? "";
  }), s = le(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.avatar) ?? "";
  }), { isImg: a } = Ib(s), c = le(() => {
    var f;
    return a.value ? (f = o.value) == null ? void 0 : f.avatar : "";
  }), l = le(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.intro) ?? "What's on your mind today?";
  }), d = le(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.description) ?? "";
  }), h = le(
    () => {
      var f;
      return ((f = o.value) == null ? void 0 : f.promptPlaceholder) ?? "Ask me anything...";
    }
  );
  return {
    agents: t,
    agentById: n,
    getAgentById: u,
    getAgentByThreadId: r,
    activeAgent: o,
    activeAgentName: i,
    activeAgentAvatar: c,
    activeAgentIntro: l,
    activeAgentDescription: d,
    activeAgentPromptPlaceholder: h
  };
}
const Rb = {
  key: 0,
  class: "am-chat-widget__message-avatar"
}, Nb = ["src"], Ob = {
  key: 1,
  class: "am-chat-widget__message-content"
}, Lb = {
  key: 2,
  class: "am-chat-widget__message-content"
}, Bb = /* @__PURE__ */ Se({
  __name: "ChatMessage.ce",
  props: {
    content: { type: String },
    role: { type: null }
  },
  setup(e) {
    const { activeAgentAvatar: t } = Nr();
    return (n, u) => (N(), K("div", {
      class: en(["am-chat-widget__message", `am-chat-widget__message--${n.role}`])
    }, [
      n.role === G(St).AGENT ? (N(), K("div", Rb, [
        G(t) ? (N(), K("img", {
          key: 0,
          class: "am-chat-widget__message-avatar-image",
          "aria-label": "New Chat",
          src: G(t)
        }, null, 8, Nb)) : (N(), We(G(ni), {
          key: 1,
          class: "am-chat-widget__message-avatar-icon",
          "aria-label": "New Chat",
          "stroke-width": 1
        }))
      ])) : Ie("", !0),
      n.role === G(St).AGENT ? (N(), K("div", Ob, [
        ee(zc, { source: n.content }, null, 8, ["source"])
      ])) : (N(), K("div", Lb, at(n.content), 1))
    ], 2));
  }
}), Pb = ".am-chat-widget__message{display:flex;flex-direction:row;margin:0;border-radius:.3125rem}.am-chat-widget__message-content{font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:.16px;display:inline-block;padding:.9375rem;border-radius:.3125rem;word-wrap:break-word;overflow-wrap:anywhere}.am-chat-widget__message--user{justify-content:flex-end;margin-left:17.5%}.am-chat-widget__message--user .am-chat-widget__message-content{max-width:100%;background-color:var(--bg-message-user)}.am-chat-widget__message--agent{justify-content:flex-start;margin-right:17.5%;background-color:transparent}.am-chat-widget__message--agent .am-chat-widget__message-content{max-width:100%}.am-chat-widget__message-avatar{padding-block:.625rem}.am-chat-widget__message-avatar-icon{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon)}.am-chat-widget__message-avatar-image{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon);box-sizing:border-box;width:2rem;height:2rem;padding:0}", $b = /* @__PURE__ */ De(Bb, [["styles", [Pb]]]), zb = {
  ref: "innerList",
  class: "am-chat-widget-message-list"
}, jb = /* @__PURE__ */ Se({
  __name: "ChatMessageList.ce",
  props: {
    messages: { type: Array }
  },
  setup(e) {
    return (t, n) => (N(), K("div", zb, [
      (N(!0), K(Fe, null, Mn(t.messages, (u) => (N(), We($b, {
        key: u.id,
        role: u.role,
        content: u.content
      }, null, 8, ["role", "content"]))), 128))
    ], 512));
  }
}), Hb = ".am-chat-widget-message-list{display:flex;flex-direction:column;box-sizing:border-box;width:100%;padding-top:1.5rem;padding-bottom:1.5rem;gap:1.5rem}", Ub = /* @__PURE__ */ De(jb, [["styles", [Hb]]]), qb = { class: "skeleton-conversation" }, Gb = /* @__PURE__ */ Se({
  __name: "SkeletonConversation.ce",
  props: {
    count: { type: Number }
  },
  setup(e) {
    const n = e.count ?? 8;
    return (u, r) => (N(), K("div", qb, [
      (N(!0), K(Fe, null, Mn(G(n), (o) => (N(), K("div", {
        key: o,
        class: en(["skeleton-bubble-wrapper", o % 2 === 1 ? "from-user" : "from-agent"])
      }, [
        o % 2 === 0 ? (N(), K(Fe, { key: 0 }, [
          ee(jn, { variant: "avatar" }),
          ee(jn, { variant: "bubble" })
        ], 64)) : (N(), K(Fe, { key: 1 }, [
          ee(jn, { variant: "bubble" }),
          ee(jn, { variant: "avatar" })
        ], 64))
      ], 2))), 128))
    ]));
  }
}), Vb = ".skeleton-conversation[data-v-ff3fb651]{display:flex;flex-direction:column;gap:1.5rem}.skeleton-bubble-wrapper[data-v-ff3fb651]{display:flex;align-items:top}.skeleton-bubble-wrapper .skeleton-item--bubble[data-v-ff3fb651]{margin-bottom:0}.skeleton-bubble-wrapper.from-agent[data-v-ff3fb651]{justify-content:flex-start}.skeleton-bubble-wrapper.from-agent .skeleton-item--avatar[data-v-ff3fb651]{margin-right:.5rem}.skeleton-bubble-wrapper.from-agent .skeleton-item--bubble[data-v-ff3fb651]{width:70%}.skeleton-bubble-wrapper.from-user[data-v-ff3fb651]{justify-content:flex-end}.skeleton-bubble-wrapper.from-user .skeleton-item--avatar[data-v-ff3fb651]{margin-left:.5rem}.skeleton-bubble-wrapper.from-user .skeleton-item--bubble[data-v-ff3fb651]{width:50%}", Kb = /* @__PURE__ */ De(Gb, [["styles", [Vb]], ["__scopeId", "data-v-ff3fb651"]]);
function Zb(e, t, n, u, r = 0) {
  const o = (a) => {
    n.value = a, s(r);
  };
  kt(
    e,
    async (a) => {
      await Xt();
      const c = a[a.length - 1];
      (c == null ? void 0 : c.role) === St.USER ? o(!0) : o(!1);
    },
    {
      deep: !0,
      immediate: !0,
      flush: "post"
    }
  );
  const i = async () => {
    n.value = !0, await Xt(), s(r);
  };
  function s(a = 0) {
    const c = t.value;
    if (!c)
      return;
    const l = Math.max(c.scrollHeight + a, 0);
    c.scrollTop = l, u == null || u();
  }
  return {
    scrollToBottom: i
  };
}
const Wb = {
  viewBox: "0 0 17 19",
  width: "1.08em",
  height: "1.2em"
};
function Jb(e, t) {
  return N(), K("svg", Wb, t[0] || (t[0] = [
    U("g", { fill: "none" }, [
      U("path", {
        d: "M13.45874 9.50039 L8.50041 15.04205 L3.54210 9.50039",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      U("path", {
        d: "M8.5 3.95870 V15.04205",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const Yb = ht({ name: "icons-arrow-scroll-bottom", render: Jb }), Xb = {
  key: 0,
  class: "am-chat-widget__content"
}, Qb = { class: "am-chat-widget__content-inner" }, eg = {
  key: 0,
  class: "am-chat-widget__content-scroll-to-bottom"
}, tg = /* @__PURE__ */ Se({
  __name: "ChatContent.ce",
  setup(e) {
    const t = Je(), { activeMessages: n, activeThreadId: u, isLoadingSession: r, hasMessages: o } = Et(t), { isLoadingMessages: i } = Tr(u), s = ve(null), a = ve(!0), c = ve(!1);
    function l() {
      a.value = !0;
    }
    const { scrollToBottom: d } = Zb(
      n,
      s,
      c,
      l,
      650
    );
    function h() {
      const f = s.value;
      if (!f)
        return;
      const { scrollTop: p, scrollHeight: _, clientHeight: O } = f;
      a.value = p + O >= _ - 1;
    }
    return Tn(() => {
      const f = s.value;
      if (!f)
        return;
      const { scrollTop: p, scrollHeight: _, clientHeight: O } = f;
      a.value = p + O >= _ - 1;
    }), kt(
      u,
      async (f, p) => {
        f && f !== p && (await Xt(), d());
      },
      { immediate: !0 }
    ), (f, p) => G(o) || !G(o) && (G(i) || G(r)) ? (N(), K("div", Xb, [
      U("div", {
        ref_key: "scrollContainer",
        ref: s,
        class: en([
          "am-chat-widget__content-wrapper",
          { "am-chat-widget__content-wrapper--smooth": c.value }
        ]),
        onScroll: h
      }, [
        U("div", Qb, [
          G(r) || G(i) ? (N(), We(Kb, {
            key: 0,
            count: 4
          })) : G(i) && G(r) ? Ie("", !0) : (N(), We(Ub, {
            key: 1,
            "scroll-container": s.value,
            messages: G(n)
          }, null, 8, ["scroll-container", "messages"]))
        ])
      ], 34),
      a.value ? Ie("", !0) : (N(), K("div", eg, [
        ee(Ht, {
          style: "tertiary",
          "icon-only": "",
          small: "",
          "aria-label": "Scroll to bottom of chat",
          onClick: G(d)
        }, {
          icon: ct(() => [
            ee(G(Yb), { "aria-label": "Scroll to bottom icon" })
          ]),
          _: 1
        }, 8, ["onClick"])
      ]))
    ])) : Ie("", !0);
  }
}), ng = ".am-chat-widget__content{position:relative;display:flex;flex:1;width:100%;min-height:0}.am-chat-widget__content-wrapper{display:flex;flex:1 1 auto;justify-content:center;min-height:0;padding-inline:1.5rem;padding-block:1.5rem;overflow:hidden auto;scroll-behavior:auto;scroll-padding-top:1.5rem;scroll-padding-bottom:1.5rem}.am-chat-widget__content-wrapper--smooth{scroll-behavior:smooth}.am-chat-widget__content-inner{display:flex;flex-direction:column;flex-shrink:0;box-sizing:border-box;width:100%;max-width:39.375rem}@container chat-widget (min-width: 1290px){.am-chat-widget__content-inner{max-width:48rem}}.am-chat-widget__content-scroll-to-bottom{position:absolute;bottom:.625rem;left:50%;z-index:1000;transform:translate(-50%)}", ug = /* @__PURE__ */ De(tg, [["styles", [ng]]]), rg = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function og(e, t) {
  return N(), K("svg", rg, t[0] || (t[0] = [
    Xn(";;;"),
    U("g", { fill: "none" }, [
      U("path", {
        d: "M3 6H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      }),
      U("path", {
        d: "M3 12H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      }),
      U("path", {
        d: "M3 18H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      })
    ], -1)
  ]));
}
const ig = ht({ name: "icons-hamburger", render: og }), sg = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function ag(e, t) {
  return N(), K("svg", sg, t[0] || (t[0] = [
    U("g", { fill: "none" }, [
      U("path", {
        d: "M20.354 15.354A9 9 0 118.646 3.646 7 7 0 0020.354 15.354z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const cg = ht({ name: "icons-moon", render: ag }), lg = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function dg(e, t) {
  return N(), K("svg", lg, t[0] || (t[0] = [
    Jo('<g fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"></circle><line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="4.93" y1="19.07" x2="7.05" y2="16.95" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="16.95" y1="7.05" x2="19.07" y2="4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></g>', 1)
  ]));
}
const fg = ht({ name: "icons-sun", render: dg }), hg = { class: "am-chat-widget__header" }, pg = { class: "am-chat-widget__header-left" }, bg = { class: "am-chat-widget__header-title" }, gg = {
  key: 0,
  class: "am-chat-widget__error-status-icon"
}, mg = { style: { display: "inline-block" } }, _g = { class: "am-chat-widget__header-toolbar" }, xg = /* @__PURE__ */ Se({
  __name: "ChatHeader.ce",
  setup(e) {
    const { activeAgentName: t } = Nr(), n = Dr(), { hasErrors: u } = nc(), r = () => {
      n.toggle();
    }, o = Vo("theme");
    if (!o)
      throw new Error("Theme context not provided");
    const { mode: i, toggle: s } = o;
    return (a, c) => (N(), K("div", hg, [
      U("div", pg, [
        ee(Ht, {
          style: "link",
          "icon-only": "",
          "aria-label": "'Open Sidebar Menu'",
          "hidden-for-desktop": "",
          onClick: r
        }, {
          default: ct(() => [
            ee(G(ig), { "aria-label": "'Open Sidebar Menu Icon'" })
          ]),
          _: 1
        })
      ]),
      U("div", bg, [
        G(u)() ? (N(), K("div", gg, [
          ee(G(su))
        ])) : Ie("", !0),
        U("div", mg, at(G(t)), 1)
      ]),
      U("div", _g, [
        ee(Ht, {
          style: "link",
          "aria-label": "Change Chat Color Theme",
          onClick: G(s)
        }, {
          default: ct(() => [
            G(i) === G(fn).DARK ? (N(), We(G(fg), {
              key: 0,
              "aria-label": "'Light mode icon'"
            })) : (N(), We(G(cg), {
              key: 1,
              "aria-label": "'Dark mode icon'"
            }))
          ]),
          _: 1
        }, 8, ["onClick"])
      ])
    ]));
  }
}), yg = ".am-chat-widget__header{display:grid;align-items:center;grid-template-columns:1fr 1fr 1fr;box-sizing:border-box;width:100%;padding:.625rem;color:var(--text-header);border-bottom:.0625rem solid var(--border-header);font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:.16px}.am-chat-widget__header>:nth-child(1){justify-self:start;display:block}.am-chat-widget__header>:nth-child(2){justify-self:center;display:flex;align-items:center}.am-chat-widget__header>:nth-child(3){justify-self:end;display:block}@container chat-widget (min-width: 768px){.am-chat-widget__header{grid-template-columns:1fr 1fr}.am-chat-widget__header>:nth-child(1){display:none}.am-chat-widget__header>:nth-child(2){justify-self:start}.am-chat-widget__header>:nth-child(3){justify-self:end}}.am-chat-widget__error-status-icon{display:inline-block;width:1.2em;height:1.2em;padding:.5rem .625rem;animation:blink 2s ease-in-out infinite}@keyframes blink{0%,to{opacity:1}50%{opacity:0}}", wg = /* @__PURE__ */ De(xg, [["styles", [yg]]]), vg = ["aria-label"], kg = {
  key: 0,
  class: "am-chat-widget__message-avatar"
}, Eg = {
  key: 1,
  class: "am-chat-widget__message-content"
}, Cg = { class: "ellipsis" }, Ag = /* @__PURE__ */ Se({
  __name: "ChatProgressStatus.ce",
  props: {
    isModeImpact: { type: Boolean }
  },
  setup(e) {
    const t = Je(), { activeStreamStatus: n } = Et(t), u = ve("");
    let r;
    return kt(
      () => n.value,
      (o) => {
        o || (u.value = "");
      },
      { immediate: !0 }
    ), Tn(() => {
      let o = 0;
      r = window.setInterval(() => {
        if (!n) {
          u.value = "";
          return;
        }
        o = (o + 1) % 4, u.value = ".".repeat(o);
      }, 500);
    }), Go(() => {
      r && clearInterval(r);
    }), (o, i) => G(n) && G(n) !== G(Wn).IDLE ? (N(), K("div", {
      key: 0,
      class: en([
        "amc-chat-widget__progress-status",
        { "amc-chat-widget__progress-status--impact": o.isModeImpact }
      ]),
      "aria-label": G(n),
      role: "status",
      "aria-live": "polite",
      "aria-busy": "true",
      "aria-atomic": "true"
    }, [
      i[0] || (i[0] = U("div", { class: "status" }, null, -1)),
      !o.isModeImpact && G(n) ? (N(), K("div", kg, [
        ee(G(ni), {
          class: "am-chat-widget__message-avatar-icon",
          "aria-label": "Chatbot Avatar",
          "stroke-width": 1
        })
      ])) : Ie("", !0),
      G(n) ? (N(), K("div", Eg, [
        Xn(at(G(n)), 1),
        U("span", Cg, at(u.value), 1)
      ])) : Ie("", !0)
    ], 10, vg)) : Ie("", !0);
  }
}), Sg = '.am-chat-widget__message-content{max-width:100%;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:.16px;display:inline-block;padding:.9375rem;border-radius:.3125rem;word-wrap:break-word;overflow-wrap:anywhere}.amc-chat-widget__progress-status{display:flex;align-items:center;overflow:hidden;justify-content:flex-start;margin-right:17.5%;background-color:transparent}.amc-chat-widget__progress-status--impact>.am-chat-widget__message-content{padding:.375rem 0 0 .75rem}.amc-chat-widget__progress-status--impact .am-chat-widget__message-content:before{display:inline-block;width:.625rem;height:.625rem;margin-right:1ch;border-radius:10%;background-color:currentcolor;animation:fade-in-out 1s infinite ease-in-out;content:""}.amc-chat-widget__progress-status .am-chat-widget__message-content{display:inline-flex;align-items:center;color:currentcolor}.am-chat-widget__message-avatar{padding-block:.625rem}.am-chat-widget__message-avatar-icon{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon)}@keyframes fade-in-out{0%{opacity:0}50%{opacity:1}to{opacity:0}}.ellipsis{display:inline-block;width:2ch;text-align:left;animation:fade-in-out 1s infinite}', Dg = /* @__PURE__ */ De(Ag, [["styles", [Sg]]]);
function jc(e) {
  const t = document.createElement("div");
  return t.innerHTML = e, t.textContent || t.innerText || "";
}
function Tg(e, t, n) {
  function u() {
    if (!t.value)
      return;
    const o = t.value.innerHTML || "";
    e.value = n.value ? jc(o) : o.trim();
  }
  function r(o) {
    t.value && (o ? t.value.innerHTML !== o && (t.value.innerHTML = o) : t.value.innerHTML = "");
  }
  return kt(e, (o) => {
    r(o);
  }), Tn(() => {
    t.value && e.value && (t.value.innerHTML = e.value);
  }), {
    updateFromEditor: u
  };
}
const Mg = { class: "am-chat-widget__composer" }, Fg = ["data-placeholder", "onKeydown"], Ig = /* @__PURE__ */ Se({
  __name: "ChatTextComposer.ce",
  props: /* @__PURE__ */ Ii({
    strippedHtml: { type: Boolean, default: !1 },
    placeholder: { default: "Ask anything...", type: String }
  }, {
    modelValue: { default: "" },
    modelModifiers: {}
  }),
  emits: /* @__PURE__ */ Ii(["submit"], ["update:modelValue"]),
  setup(e, { emit: t }) {
    const n = e, u = Je(), { activeThreadId: r } = Et(u), o = R0(e, "modelValue"), i = ve(null), { updateFromEditor: s } = Tg(o, i, sa(n, "strippedHtml")), a = t;
    function c() {
      var f;
      const d = ((f = i.value) == null ? void 0 : f.innerHTML) || "", h = n.strippedHtml ? jc(d) : d.trim();
      h && a("submit", { value: h });
    }
    const l = async () => {
      var d;
      await Xt(), (d = i.value) == null || d.focus();
    };
    return kt(
      r,
      async (d, h) => {
        (!d || d && d !== h) && (await Xt(), l());
      },
      { immediate: !0 }
    ), Tn(() => {
      l();
    }), (d, h) => (N(), K("div", Mg, [
      U("div", {
        ref_key: "editor",
        ref: i,
        class: "am-chat-widget__composer-editor",
        contenteditable: "true",
        "data-placeholder": d.placeholder,
        role: "textbox",
        "aria-multiline": "true",
        onInput: h[0] || (h[0] = //@ts-ignore
        (...f) => G(s) && G(s)(...f)),
        onKeydown: Od(Ar(c, ["exact", "prevent"]), ["enter"])
      }, null, 40, Fg),
      n0(U("textarea", {
        "onUpdate:modelValue": h[1] || (h[1] = (f) => o.value = f),
        hidden: "",
        name: "message"
      }, null, 512), [
        [Fd, o.value]
      ])
    ]));
  }
}), Rg = ".am-chat-widget__composer{position:relative;max-height:25dvh;overflow:auto;font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-editor{min-height:.625rem;padding:.3125rem 0;outline:none;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45;color:var(--text-input-panel);font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-editor:empty:before{color:var(--text-input-panel);pointer-events:none;content:attr(data-placeholder);font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-textarea{display:none}", Ng = /* @__PURE__ */ De(Ig, [["styles", [Rg]]]), Og = ".am-chat-widget__composer-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem}", Lg = {}, Bg = { class: "am-chat-widget__composer-bar" }, Pg = { class: "am-chat-widget__composer-bar-left" }, $g = { class: "am-chat-widget__composer-bar-right" };
function zg(e, t) {
  return N(), K("div", Bg, [
    U("div", Pg, [
      rr(e.$slots, "left")
    ]),
    U("div", $g, [
      rr(e.$slots, "right")
    ])
  ]);
}
const jg = /* @__PURE__ */ De(Lg, [["render", zg], ["styles", [Og]]]), Hg = {
  viewBox: "0 0 17 19",
  width: "1.08em",
  height: "1.2em"
};
function Ug(e, t) {
  return N(), K("svg", Hg, t[0] || (t[0] = [
    U("g", { fill: "none" }, [
      U("path", {
        d: "M3.54126 9.49961L8.49959 3.95795L13.4579 9.49961",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      U("path", {
        d: "M8.5 15.0413V3.95795",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const qg = ht({ name: "icons-arrow-send", render: Ug }), Gg = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function Vg(e, t) {
  return N(), K("svg", Gg, t[0] || (t[0] = [
    U("path", {
      fill: "currentColor",
      d: "M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
    }, null, -1)
  ]));
}
const Kg = ht({ name: "icons-file", render: Vg }), Zg = { class: "attachment-item" }, Wg = { class: "icon-wrapper" }, Jg = { class: "info" }, Yg = { class: "custom-tooltip-wrapper" }, Xg = { class: "name" }, Qg = { class: "type" }, e2 = ["value"], t2 = /* @__PURE__ */ Se({
  __name: "BaseAttachment.ce",
  props: {
    attachment: { type: Object },
    maxNameLength: { type: Number },
    showProgress: { type: Boolean }
  },
  emits: ["remove"],
  setup(e) {
    const t = e;
    function n(r) {
      const o = t.maxNameLength ?? 20;
      if (r.length <= o)
        return r;
      const i = r.lastIndexOf(".");
      return i < 0 || r.length - i > o ? r.slice(0, o) + "..." : `${r.slice(0, o)}...`;
    }
    function u(r) {
      const o = r.lastIndexOf(".");
      return o >= 0 ? r.slice(o + 1).toUpperCase() : "FILE";
    }
    return (r, o) => (N(), K("li", Zg, [
      U("div", Wg, [
        ee(G(Kg), {
          "aria-label": "Icon file attachment",
          class: "file-icon"
        })
      ]),
      U("div", Jg, [
        U("span", Yg, [
          U("span", Xg, at(n(r.attachment.file.name)), 1)
        ]),
        U("span", Qg, at(u(r.attachment.file.name)), 1),
        r.showProgress ? (N(), K("progress", {
          key: 0,
          class: "progress",
          value: r.attachment.progress,
          max: "100"
        }, null, 8, e2)) : Ie("", !0)
      ]),
      ee(Ht, {
        style: "link",
        class: "btn-delete",
        "aria-label": `Delete attachment: ${r.attachment.file.name}`,
        onClick: o[0] || (o[0] = (i) => r.$emit("remove", r.attachment.id))
      }, {
        default: ct(() => [
          ee(G(uc), {
            "aria-label": "Icon delete attachment",
            width: "16px",
            height: "16px"
          })
        ]),
        _: 1
      }, 8, ["aria-label"])
    ]));
  }
}), n2 = ".attachment-item{display:flex;flex:0 0 auto;align-items:center;max-width:200px;padding:.5em;border:1px solid #e0e0e0;border-radius:.5625rem;background:#fff;transition:background .2s,transform .2s}.attachment-item:hover{background:var(--text-side-bg-active);transform:translateY(-1px)}.attachment-item .icon-wrapper{display:flex;justify-content:center;align-items:center;width:32px;height:32px;margin-right:.5em;border-radius:8px;background:var(--bg-primary-btn-hover)}.attachment-item .icon-wrapper .file-icon{width:20px;height:20px;color:var(--color-primary-btn)}.attachment-item .info{display:flex;flex-direction:column;overflow:visible;flex:1}.attachment-item .info .name{font-size:.9em;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default}.attachment-item .info .custom-tooltip-wrapper{position:relative;display:inline-block;cursor:default}.attachment-item .info .custom-tooltip-wrapper .name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.attachment-item .info .type{margin-top:2px;font-size:.75em;color:#666;cursor:default}.attachment-item .info .progress{width:100%;height:6px;margin-top:.5em;border:none}.attachment-item .info .progress::-webkit-progress-bar{border-radius:12px;background-color:#e0e0e0}.attachment-item .info .progress::-webkit-progress-value{border-radius:12px}.attachment-item .btn-delete{margin-left:.5em;padding:0;border:none;background:none;font-size:1.2em;color:#777;transition:color .2s;cursor:pointer}", u2 = /* @__PURE__ */ De(t2, [["styles", [n2]]]), r2 = { class: "attachment-container" }, o2 = { class: "attachment-info-bar" }, i2 = { class: "attachment-list-wrapper" }, s2 = { class: "attachment-list" }, a2 = /* @__PURE__ */ Se({
  __name: "AttachmentList.ce",
  props: {
    attachments: { type: Array },
    showProgress: { type: Boolean },
    maxNameLength: { type: Number }
  },
  emits: ["remove"],
  setup(e, { emit: t }) {
    const n = ve(""), u = e, r = t;
    function o(i) {
      n.value = "", r("remove", i);
    }
    return (i, s) => (N(), K("div", r2, [
      U("div", o2, at(n.value), 1),
      U("div", i2, [
        U("ul", s2, [
          (N(!0), K(Fe, null, Mn(i.attachments, (a) => (N(), We(u2, {
            key: a.file.name + a.id,
            class: "attachment-item",
            attachment: a,
            "show-progress": u.showProgress,
            "max-name-length": u.maxNameLength,
            onRemove: (c) => o(a.id),
            onMouseenter: (c) => n.value = a.file.name,
            onMouseleave: s[0] || (s[0] = (c) => n.value = "")
          }, null, 8, ["attachment", "show-progress", "max-name-length", "onRemove", "onMouseenter"]))), 128))
        ])
      ])
    ]));
  }
}), c2 = ".attachment-list-wrapper{overflow-x:auto;padding:.1rem 0 0}.attachment-list{display:flex;flex-wrap:nowrap;margin:0;margin-bottom:.7rem;padding:0;gap:.75em;list-style:none}.attachment-info-bar{height:1rem;padding:0 0 .4rem;font-size:.85em;line-height:1rem;text-align:center;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}", l2 = /* @__PURE__ */ De(a2, [["styles", [c2]]]), d2 = {
  viewBox: "0 0 14 14",
  width: "1.2em",
  height: "1.2em"
};
function f2(e, t) {
  return N(), K("svg", d2, t[0] || (t[0] = [
    U("g", { fill: "none" }, [
      U("path", {
        d: "M7.72003 11.8135L12.2502 7.17487",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      U("path", {
        d: "M9.33308 3.50007L4.42491 8.50857C4.2062 8.72735 4.08333 9.02405 4.08333 9.3334C4.08333 9.64276 4.2062 9.93946 4.42491 10.1582C4.6437 10.377 4.94039 10.4998 5.24975 10.4998C5.55911 10.4998 5.8558 10.377 6.07458 10.1582L10.9827 5.14974C11.4202 4.71217 11.6659 4.11879 11.6659 3.50007C11.6659 2.88135 11.4202 2.28797 10.9827 1.8504C10.5452 1.41297 9.9518 1.16724 9.33308 1.16724C8.71436 1.16724 8.12098 1.41297 7.68341 1.8504L2.77466 6.85832C2.11823 7.51475 1.74945 8.40507 1.74945 9.3334C1.74945 10.2617 2.11823 11.1521 2.77466 11.8085C3.4311 12.4649 4.32141 12.8337 5.24975 12.8337C6.17808 12.8337 7.0684 12.4649 7.72483 11.8085",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const h2 = ht({ name: "icons-clip", render: f2 }), p2 = /* @__PURE__ */ Se({
  __name: "AttachmentUploader.ce",
  emits: ["addFiles"],
  setup(e, { emit: t }) {
    const n = t, u = ve();
    function r() {
      var i;
      (i = u.value) == null || i.click();
    }
    function o(i) {
      const s = i.target.files;
      s && (n("addFiles", Array.from(s)), i.target.value = "");
    }
    return (i, s) => (N(), K(Fe, null, [
      ee(Ht, {
        style: "secondary",
        "icon-only": "",
        small: "",
        "aria-label": "Attach file",
        onClick: r
      }, {
        icon: ct(() => [
          ee(G(h2), { "aria-label": "Attach file icon" })
        ]),
        _: 1
      }),
      U("input", {
        ref_key: "fileInput",
        ref: u,
        type: "file",
        multiple: "",
        hidden: "",
        onChange: o
      }, null, 544)
    ], 64));
  }
}), b2 = "", g2 = /* @__PURE__ */ De(p2, [["styles", [b2]]]), m2 = { class: "am-chat-widget__input" }, _2 = { class: "am-chat-widget__input-inner" }, x2 = /* @__PURE__ */ Se({
  __name: "ChatInputForm.ce",
  setup(e) {
    const t = ve([
      {
        id: "1",
        url: "https://placehold.co/100",
        name: "image1.png",
        file: new File([""], "image1sdjfsdfsdfsd-fs-df-sdf-sdfs-fs-dfsdfsdfsf-.png"),
        progress: 0
      },
      {
        id: "2",
        url: "https://placehold.co/100",
        name: "image2.jpg",
        file: new File([""], "image2.jpg"),
        progress: 30
      },
      {
        id: "3",
        url: "https://placehold.co/100",
        name: "image2.jpg",
        file: new File([""], "image2.jpg"),
        progress: 0
      },
      {
        id: "4",
        url: "https://placehold.co/100",
        name: "image3.gif",
        file: new File([""], "image3.gif"),
        progress: 0
      },
      {
        id: "5",
        url: "https://placehold.co/100",
        name: "image2.jpg",
        file: new File([""], "image2.jpg"),
        progress: 0
      }
    ]), { activeAgentPromptPlaceholder: n } = Nr(), u = Je(), { activeThreadId: r } = Et(u), { isSending: o } = Tr(r), { sendMessage: i } = sr(), s = ve(""), a = ve(!1);
    function c(p) {
      p.trim() && (i(p), s.value = "");
    }
    function l(p) {
      o.value || c(p.value);
    }
    function d(p) {
      var _;
      o.value || ((_ = p == null ? void 0 : p.preventDefault) == null || _.call(p), c(s.value));
    }
    function h(p) {
      p.forEach(
        (_) => t.value.push({
          file: _,
          progress: 0,
          id: "",
          url: "",
          name: ""
        })
      );
    }
    function f(p) {
      t.value = t.value.filter((_) => _.id !== p);
    }
    return kt(r, (p, _) => {
      p !== _ && (s.value = "");
    }), (p, _) => (N(), K("div", m2, [
      U("div", _2, [
        ee(Dg, { "is-mode-impact": !0 }),
        U("form", {
          class: "am-chat-widget__form",
          onSubmit: Ar(d, ["prevent"])
        }, [
          a.value && t.value.length ? (N(), We(l2, {
            key: 0,
            attachments: t.value,
            "max-name-length": 10,
            "show-progress": !0,
            onRemove: f
          }, null, 8, ["attachments"])) : Ie("", !0),
          ee(Ng, {
            modelValue: s.value,
            "onUpdate:modelValue": _[0] || (_[0] = (O) => s.value = O),
            placeholder: G(n),
            "stripped-html": !0,
            onSubmit: l
          }, null, 8, ["modelValue", "placeholder"]),
          ee(jg, null, {
            left: ct(() => [
              a.value ? (N(), We(g2, {
                key: 0,
                onAddFiles: h
              })) : Ie("", !0)
            ]),
            right: ct(() => [
              ee(Ht, {
                style: "primary",
                type: "submit",
                "icon-only": "",
                "is-sending": G(o),
                "aria-label": "Send message",
                onClick: d
              }, {
                icon: ct(() => [
                  ee(G(qg), { "aria-label": "Send message icon" })
                ]),
                _: 1
              }, 8, ["is-sending"])
            ]),
            _: 1
          })
        ], 32)
      ])
    ]));
  }
}), y2 = ".am-chat-widget__input{display:flex;flex:0 0 auto;justify-content:center;grid-row:5;box-sizing:border-box;width:100%;padding-bottom:.625rem;justify-self:center;padding-inline:.625rem}@container chat-widget (min-width: 768px){.am-chat-widget__input{padding-bottom:1.5rem}}.am-chat-widget__input-inner{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;width:100%;max-width:39.375rem;padding:0;gap:.375rem}@container chat-widget (min-width: 1290px){.am-chat-widget__input-inner{max-width:48rem}}.am-chat-widget__form{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;width:100%;max-width:39.375rem;padding:.75rem;border:.0625rem solid var(--border-input);border-radius:.5625rem;background-color:var(--bg-input-panel);box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;color:var(--text-input-panel);gap:.75rem}@container chat-widget (min-width: 1290px){.am-chat-widget__form{max-width:48rem}}", w2 = /* @__PURE__ */ De(x2, [["styles", [y2]]]), v2 = {
  key: 0,
  class: "am-chat-widget-state-prompt",
  "aria-hidden": "true"
}, k2 = { class: "am-chat-widget-state-prompt__header" }, E2 = {
  key: 0,
  class: "am-chat-widget-state-prompt__body"
}, C2 = /* @__PURE__ */ Se({
  __name: "ChatStatePrompt.ce",
  setup(e) {
    const t = Je(), { activeThreadId: n, isLoadingSession: u, hasMessages: r, errors: o } = Et(t), { isLoadingMessages: i } = Tr(n), { activeAgentIntro: s, activeAgentDescription: a } = Nr();
    return (c, l) => !G(r) && !(G(i) || G(u) || G(o).length) ? (N(), K("div", v2, [
      U("div", k2, at(G(s)), 1),
      G(a) ? (N(), K("div", E2, [
        ee(zc, { source: G(a) }, null, 8, ["source"])
      ])) : Ie("", !0)
    ])) : Ie("", !0);
  }
}), A2 = ".am-chat-widget-state-prompt{flex:0 0 auto;text-align:center;color:var(--text-thread);font-family:IBM Plex Sans,sans-serif;font-size:1.5rem;font-weight:400;line-height:150%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget-state-prompt{display:flex;flex-direction:column;flex:0 0 auto;justify-content:center;align-items:center;grid-row:3;width:100%;padding-bottom:.625rem;justify-self:center;padding-inline:.9375rem}@container chat-widget (min-width: 768px){[data-thread-state=empty] .am-chat-widget-state-prompt{padding-bottom:1.25rem}}[data-thread-state=empty] .am-chat-widget-state-prompt__header{width:100%;max-width:39.375rem}@container chat-widget (min-width: 1290px){[data-thread-state=empty] .am-chat-widget-state-prompt__header{max-width:48rem}}[data-thread-state=empty] .am-chat-widget-state-prompt__header:not(:last-child){margin-bottom:1rem}[data-thread-state=empty] .am-chat-widget-state-prompt__body{width:100%;max-width:39.375rem;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget-state-prompt__body p{margin:0;line-height:150%}[data-thread-state=empty] .am-chat-widget-state-prompt__body ul,[data-thread-state=empty] .am-chat-widget-state-prompt__body ol,[data-thread-state=empty] .am-chat-widget-state-prompt__body ul li,[data-thread-state=empty] .am-chat-widget-state-prompt__body ol li{text-align:left}@container chat-widget (min-width: 1290px){[data-thread-state=empty] .am-chat-widget-state-prompt__body{max-width:48rem}}", S2 = /* @__PURE__ */ De(C2, [["styles", [A2]]]), D2 = {
  key: 0,
  class: "am-chat-widget__error-msg",
  role: "alert",
  "aria-live": "assertive"
}, T2 = {
  key: 0,
  class: "am-chat-widget__error-msg-icon"
}, M2 = ["src"], F2 = { class: "am-chat-widget__error-msg-content" }, I2 = {
  key: 0,
  class: "am-chat-widget__error-msg-content-title"
}, R2 = { class: "am-chat-widget__error-msg-content-message" }, N2 = {
  key: 1,
  class: "am-chat-widget__error-msg-content-error"
}, O2 = { class: "am-chat-widget__error-msg-action" }, L2 = /* @__PURE__ */ Se({
  __name: "ChatErrorMessage.ce",
  props: {
    icon: { type: [String, Object] },
    title: { type: String },
    message: { type: String },
    errorMsg: { type: String },
    actionLabel: { type: String },
    visible: { type: Boolean }
  },
  emits: ["action"],
  setup(e, { emit: t }) {
    const n = e, u = t;
    function r(s) {
      return typeof s == "object" && !("src" in s);
    }
    function o() {
      u("action");
    }
    const i = n.visible ?? !0;
    return (s, a) => G(i) ? (N(), K("div", D2, [
      s.icon ? (N(), K("div", T2, [
        r(s.icon) ? (N(), We(p0(s.icon), { key: 0 })) : Ie("", !0),
        typeof s.icon == "string" ? (N(), K("img", {
          key: 1,
          src: s.icon
        }, null, 8, M2)) : Ie("", !0)
      ])) : Ie("", !0),
      U("div", F2, [
        s.title ? (N(), K("h3", I2, at(s.title), 1)) : Ie("", !0),
        U("p", R2, at(s.message), 1),
        s.errorMsg ? (N(), K("p", N2, at(s.errorMsg), 1)) : Ie("", !0)
      ]),
      U("div", O2, [
        ee(Ht, {
          style: "danger",
          full: "",
          "aria-label": "Error action button",
          onClick: o
        }, {
          default: ct(() => [
            Xn(at(s.actionLabel), 1)
          ]),
          _: 1
        })
      ])
    ])) : Ie("", !0);
  }
}), B2 = ".am-chat-widget__error-msg{display:flex;align-items:center;box-sizing:border-box;width:85%;max-width:535px;margin:0 auto;padding:.625rem 1rem 1.25rem;border:.0625rem solid var(--border-error-msg);border-radius:.5625rem;background-color:var(--bg-error-msg);box-shadow:0 .125rem .25rem #3d36444d,0 .125rem .375rem .0625rem #3c40441f}@container chat-widget (min-width: 1290px){.am-chat-widget__error-msg{max-width:652px}}.am-chat-widget__error-msg-icon{flex:0 0 auto;margin-right:.75rem;padding:1.25rem .5rem;color:var(--color-error-msg-icon)}.am-chat-widget__error-msg-icon img,.am-chat-widget__error-msg-icon svg{width:1.5rem;height:1.5rem}.am-chat-widget__error-msg-content{flex:1 1 auto;text-align:left}.am-chat-widget__error-msg-content-title{margin:0;margin-bottom:.625rem;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:500;line-height:100%;letter-spacing:0;color:var(--color-error-msg-title)}.am-chat-widget__error-msg-content-message{margin:0;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0;color:var(--color-error-msg-text)}.am-chat-widget__error-msg-content-error{margin:.5rem 0 0;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0;color:var(--color-error-msg-text)}.am-chat-widget__error-msg-action{flex:0 0 auto;margin-left:1.5rem}", P2 = /* @__PURE__ */ De(L2, [["styles", [B2]]]), $2 = { class: "am-chat-widget__error-container" }, z2 = /* @__PURE__ */ Se({
  __name: "ChatErrorContainer.ce",
  setup(e) {
    const t = Je(), n = le(() => t.errors ?? []), u = ve(null);
    async function r(o) {
      u.value = o.id;
      try {
        o.onRetry && await o.onRetry();
      } catch (i) {
        console.error("Error during retry calling (Error Container):", i);
      } finally {
        u.value = null;
      }
    }
    return (o, i) => (N(), K("div", $2, [
      ee(Cd, {
        name: "fade",
        tag: "div",
        class: "am-chat-widget__error-container-wrapper",
        "enter-active-class": "fade-enter-active",
        "leave-active-class": "fade-leave-active"
      }, {
        default: ct(() => [
          (N(!0), K(Fe, null, Mn(n.value, (s) => (N(), We(P2, {
            key: s.id,
            title: s.title,
            message: s.message,
            "error-msg": s.errorMsg,
            "action-label": s.actionLabel,
            visible: s.visible,
            icon: s.icon,
            onAction: (a) => r(s)
          }, null, 8, ["title", "message", "error-msg", "action-label", "visible", "icon", "onAction"]))), 128))
        ]),
        _: 1
      })
    ]));
  }
}), j2 = ".am-chat-widget__error-container{position:relative;flex:0 0 auto;text-align:center;color:var(--text-thread);font-family:IBM Plex Sans,sans-serif;font-size:1.5rem;font-weight:400;line-height:100%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget__error-container{display:flex;flex-direction:column;flex:0 0 auto;justify-content:center;align-items:center;grid-row:4;width:100%;padding-bottom:.625rem;justify-self:center}@container chat-widget (min-width: 768px){[data-thread-state=empty] .am-chat-widget__error-container{padding-bottom:1.25rem}}.am-chat-widget__error-container-wrapper{position:absolute;top:-1.25rem;z-index:1000;display:flex;flex-direction:column;align-items:center;width:100%;transform:translateY(-100%);gap:.75rem}.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}", H2 = /* @__PURE__ */ De(z2, [["styles", [j2]]]), U2 = ["data-thread-state"], q2 = /* @__PURE__ */ Se({
  __name: "ChatThread.ce",
  setup(e) {
    const t = Je(), { activeThreadId: n, isLoadingSession: u, hasMessages: r } = Et(t), { isLoadingMessages: o } = Tr(n), i = le(() => u.value || o.value || r.value ? "has-messages" : "empty");
    return (s, a) => (N(), K("div", {
      class: "am-chat-widget__thread",
      "data-thread-state": i.value
    }, [
      ee(wg),
      ee(S2),
      ee(ug),
      ee(H2),
      ee(w2)
    ], 8, U2));
  }
}), G2 = ".am-chat-widget__thread{position:relative;display:flex;flex-direction:column;height:100vh;background-color:var(--bg-thread);color:var(--text-thread);overflow:hidden}.am-chat-widget__thread[data-thread-state=has-messages]{display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch}.am-chat-widget__thread[data-thread-state=empty]{display:grid;grid-template-columns:1fr;grid-template-rows:auto 1fr auto auto auto 1fr;row-gap:0}", V2 = /* @__PURE__ */ De(q2, [["styles", [G2]]]), K2 = ["data-theme", "data-widget-mode", "data-widget-position"], Z2 = { class: "am-chat-widget__thread-wrapper" }, W2 = /* @__PURE__ */ Se({
  name: "AmChatWidget",
  inheritAttrs: !1,
  customElement: !0,
  __name: "ChatWidget.ce",
  setup(e) {
    const t = Dr(), n = le(() => t.isOpen), u = () => {
      t.close();
    }, r = Ya(), o = Yt();
    r.setTheme(o.themeMode), r.setWidgetMode(o.widgetMode), r.setJwt(o.jwt ?? "");
    const i = ve(null), { themeMode: s, toggle: a } = Xa(i);
    _a("theme", { mode: s, toggle: a });
    const c = Je(), { initChatSession: l } = sr();
    let d = () => {
    };
    return Tn(async () => {
      r.widgetMode === Qn.DIALOG && t.close(), l(), d = c.subscribeToDeleteThread((h) => {
        sr().deleteThreadFromStore(h.threadId);
      });
    }), f0(() => {
      d();
    }), (h, f) => (N(), K("div", {
      ref_key: "widgetRoot",
      ref: i,
      class: "am-chat-widget",
      "data-theme": G(s),
      "data-widget-mode": G(r).widgetMode,
      "data-visible": !0,
      "data-widget-position": G(o).widgetPosition,
      role: "region",
      "aria-label": "Chat widget"
    }, [
      U("div", {
        class: en([
          "am-chat-widget__sidebar-wrapper",
          { "am-chat-widget__sidebar-wrapper--open": n.value }
        ]),
        onClick: Ar(u, ["self"])
      }, [
        ee(_h)
      ], 2),
      n.value ? (N(), K("div", {
        key: 0,
        class: "am-chat-widget__overlay",
        onClick: u
      })) : Ie("", !0),
      U("div", Z2, [
        ee(V2)
      ])
    ], 8, K2));
  }
}), J2 = ".am-chat-widget{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--text-side-header: hsl(227, 6%, 53%);--text-side: hsl(232, 16%, 27%);--text-side-active: hsl(232, 16%, 27%);--text-side-bg-active: hsl(210, 6%, 86%);--text-thread: hsl(232, 16%, 27%);--bg-thread: hsl(0, 0%, 98%);--bg-side: hsl(240, 14%, 97%);--border-side: hsl(240, 3%, 88%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 100%, 70%);--color-secondary-btn: hsl(232, 16%, 27%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(240, 6%, 87%);--bg-input-panel: hsl(0, 0%, 100%);--text-input-panel: hsl(233, 7%, 47%);--text-header: hsl(230, 29%, 17%);--border-header: hsl(240, 3%, 88%);--color-chat-avatar-icon: hsl(231, 12%, 34%);--bg-chat-avatar-icon: hsl(210, 6%, 94%);--border-chat-avatar-icon: hsl(228, 6%, 83%);--color-message: hsl(232, 16%, 27%);--bg-message-user: hsl(240, 4%, 88%);--border-input: hsl(240, 6%, 90%);--color-tertiary-btn: hsl(233, 7%, 47%);--bg-tertiary-btn: hsl(0, 0%, 98%);--border-tertiary-btn: hsl(240, 3%, 88%);--bg-tertiary-hover-btn: hsl(0, 0%, 96%);--bg-tertiary-active-btn: hsl(0, 0%, 94%);--border-tertiary-hover-btn: hsl(240, 3%, 80%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 93.3%);--skeleton-highlight: hsla(0, 0%, 100%, .6);--bg-table-header: hsl(210, 6%, 94%);--code-bg: hsl(0, 0%, 93.3%);--code-color: hsl(0, 0%, 20%);font-family:IBM Plex Sans,sans-serif;font-size:1rem;font-weight:500;line-height:100%;letter-spacing:0;display:flex;overflow:hidden;background-color:var(--bg-thread);container-type:inline-size;container-name:chat-widget}.am-chat-widget[data-visible=false]{transition:opacity .3s ease;opacity:0;pointer-events:none}.am-chat-widget[data-visible=true]{opacity:1;pointer-events:auto}.am-chat-widget[data-theme=dark]{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--text-side-header: hsl(0, 0%, 63%);--text-side: hsl(0, 0%, 90%);--text-side-active: hsl(0, 0%, 90%);--text-side-bg-active: hsl(0, 0%, 14%);--text-thread: hsl(0, 0%, 90%);--bg-thread: hsl(0, 0%, 18%);--bg-side: hsl(240, 4%, 17%);--border-side: hsl(0, 0%, 30%);--color-secondary-btn: hsl(0, 0%, 90%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(0, 0%, 26%);--bg-primary-btn: hsl(223, 100%, 70%);--bg-primary-btn-hover: hsl(223, 92%, 56%);--bg-input-panel: hsl(0, 0%, 16%);--text-input-panel: hsl(0, 0%, 70%);--text-header: hsl(0, 0%, 100%);--border-header: hsl(0, 0%, 30%);--color-chat-avatar-icon: hsl(0, 0%, 76%);--bg-chat-avatar-icon: hsl(0, 0%, 23%);--border-chat-avatar-icon: hsl(0, 0%, 33%);--color-message: hsl(0, 0%, 90%);--bg-message-user: hsl(0, 0%, 14%);--border-input: hsl(0, 0%, 21%);--color-tertiary-btn: hsl(0, 0%, 70%);--bg-tertiary-btn: hsl(0, 0%, 18%);--border-tertiary-btn: hsl(0, 0%, 30%);--bg-tertiary-hover-btn: hsl(0, 0%, 16%);--bg-tertiary-active-btn: hsl(0, 0%, 14%);--border-tertiary-hover-btn: hsl(0, 0%, 20%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 16.5%);--skeleton-highlight: hsla(0, 0%, 100%, .1);--bg-table-header: hsl(0, 0%, 23%);--code-bg: hsl(0, 0%, 26.5%);--code-color: hsl(0, 0%, 90%)}.am-chat-widget__sidebar-wrapper{position:fixed;top:0;bottom:0;left:0;z-index:1500;width:75%;max-width:280px;background:var(--bg-side);color:var(--text-side);transition:transform .3s ease-in-out;transform:translate(-100%);border-right:.0625rem solid var(--border-side);overflow-y:hidden}.am-chat-widget__sidebar-wrapper--open{transform:translate(0)}@container chat-widget (min-width: 768px){.am-chat-widget__sidebar-wrapper{position:relative;display:flex;width:16.25rem;transform:translate(0)}.am-chat-widget__sidebar-wrapper--open{transform:translate(0)}}.am-chat-widget__thread-wrapper{display:flex;flex-direction:column;flex:1 0 100%;background-color:var(--bg-thread);color:var(--text-thread);overflow:hidden;transition:flex-basis .3s ease-in-out}@container chat-widget (min-width: 768px){.am-chat-widget__thread-wrapper{flex:1 0 calc(100% - 16.25rem);transition:flex-basis .3s ease-in-out}}.am-chat-widget__overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1100;background-color:#0006}.am-chat-widget[data-widget-mode=dialog]{position:fixed;right:1.75rem;bottom:5.5rem;width:min(100% - 2rem,557px);height:calc(100vh - 160px);height:min(100% - 100px,557px);border-radius:12px;box-shadow:0 4px 20px #0003;container-type:size}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__overlay{position:absolute;z-index:1100;border-radius:inherit;background-color:#0006;top:0;right:0;bottom:0;left:0}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__sidebar-wrapper{position:absolute;top:0;bottom:0;left:0;width:75%;max-width:280px;background:var(--bg-side);color:var(--text-side);border-right:.0625rem solid var(--border-side);transition:transform .3s ease-in-out;transform:translate(-100%)}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__sidebar-wrapper--open{transform:translate(0)}.am-chat-widget[data-widget-mode=dialog][data-widget-position=bottom-left]{right:auto;left:1.75rem}", Y2 = /* @__PURE__ */ De(W2, [["styles", [J2]]]), hi = /* @__PURE__ */ za(Y2), X2 = hi.prototype.connectedCallback;
hi.prototype.connectedCallback = async function(...e) {
  var n;
  X2.apply(this, ...e);
  const t = (n = this._instance) == null ? void 0 : n.appContext.app;
  t && Wa(t);
};
customElements.get("am-chat-widget") || customElements.define("am-chat-widget", hi);
let Io = !1, fr = null;
async function Rs() {
  Io || (fr = document.createElement("am-chat-widget"), document.body.appendChild(fr), Io = !0);
}
function Q2() {
  const e = document.currentScript;
  return {
    mode: (e == null ? void 0 : e.dataset.widgetMode) || "dialog",
    theme: (e == null ? void 0 : e.dataset.theme) || "light",
    jwt: (e == null ? void 0 : e.dataset.jwt) || void 0,
    widgetPosition: (e == null ? void 0 : e.dataset.widgetPosition) || Sr.BOTTOM_RIGHT,
    endpoint: (e == null ? void 0 : e.dataset.endpoint) || "",
    baseUrl: (e == null ? void 0 : e.dataset.baseUrl) || ""
  };
}
async function em(e) {
  const t = { ...Q2(), ...e };
  if (rf({
    widgetMode: t.mode,
    themeMode: t.theme,
    widgetPosition: t.widgetPosition,
    jwt: t.jwt,
    endpoint: t.endpoint,
    apiBaseUrl: t.baseUrl
  }), t.mode === Qn.DIALOG) {
    const n = document.createElement("am-chat-launcher");
    document.body.appendChild(n), n.shadowRoot.querySelector(".am-chat-launcher").setAttribute("data-widget-position", t.widgetPosition ?? Sr.BOTTOM_RIGHT), n.addEventListener("open", async () => {
      if (!Io)
        await Rs(), fr.shadowRoot.querySelector("div.am-chat-widget").setAttribute("data-visible", "true");
      else {
        const i = fr.shadowRoot.querySelector("div.am-chat-widget");
        tm(i);
      }
    });
    return;
  }
  await Rs();
}
function tm(e) {
  const t = e.getAttribute("data-visible") === "true";
  e.setAttribute("data-visible", String(!t));
}
typeof window < "u" && (window.initLauncher = em);
export {
  em as initLauncher
};
