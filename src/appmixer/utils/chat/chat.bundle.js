var kl = Object.defineProperty;
var El = (e, t, n) => t in e ? kl(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Hr = (e, t, n) => El(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Po(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const xe = {}, qn = [], An = () => {
}, Cl = () => !1, _u = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), $o = (e) => e.startsWith("onUpdate:"), Xe = Object.assign, Hs = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Al = Object.prototype.hasOwnProperty, _e = (e, t) => Al.call(e, t), ie = Array.isArray, Gn = (e) => xu(e) === "[object Map]", js = (e) => xu(e) === "[object Set]", we = (e) => typeof e == "function", ze = (e) => typeof e == "string", en = (e) => typeof e == "symbol", Pe = (e) => e !== null && typeof e == "object", qs = (e) => (Pe(e) || we(e)) && we(e.then) && we(e.catch), Gs = Object.prototype.toString, xu = (e) => Gs.call(e), Sl = (e) => xu(e).slice(8, -1), yu = (e) => xu(e) === "[object Object]", zo = (e) => ze(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, lr = /* @__PURE__ */ Po(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), vu = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, Dl = /-(\w)/g, ot = vu(
  (e) => e.replace(Dl, (t, n) => n ? n.toUpperCase() : "")
), Tl = /\B([A-Z])/g, dt = vu(
  (e) => e.replace(Tl, "-$1").toLowerCase()
), wu = vu((e) => e.charAt(0).toUpperCase() + e.slice(1)), Zu = vu(
  (e) => e ? `on${wu(e)}` : ""
), lt = (e, t) => !Object.is(e, t), Xr = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Vs = (e, t, n, r = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: r,
    value: n
  });
}, _o = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, xo = (e) => {
  const t = ze(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Ri;
const ku = () => Ri || (Ri = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Uo(e) {
  if (ie(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const r = e[n], u = ze(r) ? Il(r) : Uo(r);
      if (u)
        for (const o in u)
          t[o] = u[o];
    }
    return t;
  } else if (ze(e) || Pe(e))
    return e;
}
const Ml = /;(?![^(]*\))/g, Fl = /:([^]+)/, Rl = /\/\*[^]*?\*\//g;
function Il(e) {
  const t = {};
  return e.replace(Rl, "").split(Ml).forEach((n) => {
    if (n) {
      const r = n.split(Fl);
      r.length > 1 && (t[r[0].trim()] = r[1].trim());
    }
  }), t;
}
function Ft(e) {
  let t = "";
  if (ze(e))
    t = e;
  else if (ie(e))
    for (let n = 0; n < e.length; n++) {
      const r = Ft(e[n]);
      r && (t += r + " ");
    }
  else if (Pe(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Nl = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Ol = /* @__PURE__ */ Po(Nl);
function Ks(e) {
  return !!e || e === "";
}
const Ws = (e) => !!(e && e.__v_isRef === !0), ct = (e) => ze(e) ? e : e == null ? "" : ie(e) || Pe(e) && (e.toString === Gs || !we(e.toString)) ? Ws(e) ? ct(e.value) : JSON.stringify(e, Zs, 2) : String(e), Zs = (e, t) => Ws(t) ? Zs(e, t.value) : Gn(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [r, u], o) => (n[Ju(r, o) + " =>"] = u, n),
    {}
  )
} : js(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Ju(n))
} : en(t) ? Ju(t) : Pe(t) && !ie(t) && !yu(t) ? String(t) : t, Ju = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    en(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let nt;
class Js {
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = nt, !t && nt && (this.index = (nt.scopes || (nt.scopes = [])).push(
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
      const n = nt;
      try {
        return nt = this, t();
      } finally {
        nt = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = nt, nt = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (nt = this.prevScope, this.prevScope = void 0);
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, r;
      for (n = 0, r = this.effects.length; n < r; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, r = this.cleanups.length; n < r; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, r = this.scopes.length; n < r; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const u = this.parent.scopes.pop();
        u && u !== this && (this.parent.scopes[this.index] = u, u.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Ys(e) {
  return new Js(e);
}
function Xs() {
  return nt;
}
function Ll(e, t = !1) {
  nt && nt.cleanups.push(e);
}
let Me;
const Yu = /* @__PURE__ */ new WeakSet();
class Qs {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, nt && nt.active && nt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Yu.has(this) && (Yu.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || ta(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Ii(this), na(this);
    const t = Me, n = Tt;
    Me = this, Tt = !0;
    try {
      return this.fn();
    } finally {
      ra(this), Me = t, Tt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        qo(t);
      this.deps = this.depsTail = void 0, Ii(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Yu.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    yo(this) && this.run();
  }
  get dirty() {
    return yo(this);
  }
}
let ea = 0, dr, fr;
function ta(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = fr, fr = e;
    return;
  }
  e.next = dr, dr = e;
}
function Ho() {
  ea++;
}
function jo() {
  if (--ea > 0)
    return;
  if (fr) {
    let t = fr;
    for (fr = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; dr; ) {
    let t = dr;
    for (dr = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (r) {
          e || (e = r);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function na(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function ra(e) {
  let t, n = e.depsTail, r = n;
  for (; r; ) {
    const u = r.prevDep;
    r.version === -1 ? (r === n && (n = u), qo(r), Bl(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = u;
  }
  e.deps = t, e.depsTail = n;
}
function yo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (ua(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function ua(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === mr) || (e.globalVersion = mr, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !yo(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = Me, r = Tt;
  Me = e, Tt = !0;
  try {
    na(e);
    const u = e.fn(e._value);
    (t.version === 0 || lt(u, e._value)) && (e.flags |= 128, e._value = u, t.version++);
  } catch (u) {
    throw t.version++, u;
  } finally {
    Me = n, Tt = r, ra(e), e.flags &= -3;
  }
}
function qo(e, t = !1) {
  const { dep: n, prevSub: r, nextSub: u } = e;
  if (r && (r.nextSub = u, e.prevSub = void 0), u && (u.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
    n.computed.flags &= -5;
    for (let o = n.computed.deps; o; o = o.nextDep)
      qo(o, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Bl(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Tt = !0;
const oa = [];
function pn() {
  oa.push(Tt), Tt = !1;
}
function gn() {
  const e = oa.pop();
  Tt = e === void 0 ? !0 : e;
}
function Ii(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = Me;
    Me = void 0;
    try {
      t();
    } finally {
      Me = n;
    }
  }
}
let mr = 0;
class Pl {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Eu {
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0;
  }
  track(t) {
    if (!Me || !Tt || Me === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== Me)
      n = this.activeLink = new Pl(Me, this), Me.deps ? (n.prevDep = Me.depsTail, Me.depsTail.nextDep = n, Me.depsTail = n) : Me.deps = Me.depsTail = n, ia(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const r = n.nextDep;
      r.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = r), n.prevDep = Me.depsTail, n.nextDep = void 0, Me.depsTail.nextDep = n, Me.depsTail = n, Me.deps === n && (Me.deps = r);
    }
    return n;
  }
  trigger(t) {
    this.version++, mr++, this.notify(t);
  }
  notify(t) {
    Ho();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      jo();
    }
  }
}
function ia(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let r = t.deps; r; r = r.nextDep)
        ia(r);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const ru = /* @__PURE__ */ new WeakMap(), Sn = Symbol(
  ""
), vo = Symbol(
  ""
), _r = Symbol(
  ""
);
function rt(e, t, n) {
  if (Tt && Me) {
    let r = ru.get(e);
    r || ru.set(e, r = /* @__PURE__ */ new Map());
    let u = r.get(n);
    u || (r.set(n, u = new Eu()), u.map = r, u.key = n), u.track();
  }
}
function Zt(e, t, n, r, u, o) {
  const i = ru.get(e);
  if (!i) {
    mr++;
    return;
  }
  const s = (a) => {
    a && a.trigger();
  };
  if (Ho(), t === "clear")
    i.forEach(s);
  else {
    const a = ie(e), c = a && zo(n);
    if (a && n === "length") {
      const l = Number(r);
      i.forEach((d, h) => {
        (h === "length" || h === _r || !en(h) && h >= l) && s(d);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && s(i.get(n)), c && s(i.get(_r)), t) {
        case "add":
          a ? c && s(i.get("length")) : (s(i.get(Sn)), Gn(e) && s(i.get(vo)));
          break;
        case "delete":
          a || (s(i.get(Sn)), Gn(e) && s(i.get(vo)));
          break;
        case "set":
          Gn(e) && s(i.get(Sn));
          break;
      }
  }
  jo();
}
function $l(e, t) {
  const n = ru.get(e);
  return n && n.get(t);
}
function Nn(e) {
  const t = ge(e);
  return t === e ? t : (rt(t, "iterate", _r), Et(e) ? t : t.map(Je));
}
function Cu(e) {
  return rt(e = ge(e), "iterate", _r), e;
}
const zl = {
  __proto__: null,
  [Symbol.iterator]() {
    return Xu(this, Symbol.iterator, Je);
  },
  concat(...e) {
    return Nn(this).concat(
      ...e.map((t) => ie(t) ? Nn(t) : t)
    );
  },
  entries() {
    return Xu(this, "entries", (e) => (e[1] = Je(e[1]), e));
  },
  every(e, t) {
    return Kt(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Kt(this, "filter", e, t, (n) => n.map(Je), arguments);
  },
  find(e, t) {
    return Kt(this, "find", e, t, Je, arguments);
  },
  findIndex(e, t) {
    return Kt(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Kt(this, "findLast", e, t, Je, arguments);
  },
  findLastIndex(e, t) {
    return Kt(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Kt(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Qu(this, "includes", e);
  },
  indexOf(...e) {
    return Qu(this, "indexOf", e);
  },
  join(e) {
    return Nn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return Qu(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Kt(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ir(this, "pop");
  },
  push(...e) {
    return ir(this, "push", e);
  },
  reduce(e, ...t) {
    return Ni(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Ni(this, "reduceRight", e, t);
  },
  shift() {
    return ir(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Kt(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ir(this, "splice", e);
  },
  toReversed() {
    return Nn(this).toReversed();
  },
  toSorted(e) {
    return Nn(this).toSorted(e);
  },
  toSpliced(...e) {
    return Nn(this).toSpliced(...e);
  },
  unshift(...e) {
    return ir(this, "unshift", e);
  },
  values() {
    return Xu(this, "values", Je);
  }
};
function Xu(e, t, n) {
  const r = Cu(e), u = r[t]();
  return r !== e && !Et(e) && (u._next = u.next, u.next = () => {
    const o = u._next();
    return o.value && (o.value = n(o.value)), o;
  }), u;
}
const Ul = Array.prototype;
function Kt(e, t, n, r, u, o) {
  const i = Cu(e), s = i !== e && !Et(e), a = i[t];
  if (a !== Ul[t]) {
    const d = a.apply(e, o);
    return s ? Je(d) : d;
  }
  let c = n;
  i !== e && (s ? c = function(d, h) {
    return n.call(this, Je(d), h, e);
  } : n.length > 2 && (c = function(d, h) {
    return n.call(this, d, h, e);
  }));
  const l = a.call(i, c, r);
  return s && u ? u(l) : l;
}
function Ni(e, t, n, r) {
  const u = Cu(e);
  let o = n;
  return u !== e && (Et(e) ? n.length > 3 && (o = function(i, s, a) {
    return n.call(this, i, s, a, e);
  }) : o = function(i, s, a) {
    return n.call(this, i, Je(s), a, e);
  }), u[t](o, ...r);
}
function Qu(e, t, n) {
  const r = ge(e);
  rt(r, "iterate", _r);
  const u = r[t](...n);
  return (u === -1 || u === !1) && Wo(n[0]) ? (n[0] = ge(n[0]), r[t](...n)) : u;
}
function ir(e, t, n = []) {
  pn(), Ho();
  const r = ge(e)[t].apply(e, n);
  return jo(), gn(), r;
}
const Hl = /* @__PURE__ */ Po("__proto__,__v_isRef,__isVue"), sa = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(en)
);
function jl(e) {
  en(e) || (e = String(e));
  const t = ge(this);
  return rt(t, "has", e), t.hasOwnProperty(e);
}
class aa {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, r) {
    if (n === "__v_skip") return t.__v_skip;
    const u = this._isReadonly, o = this._isShallow;
    if (n === "__v_isReactive")
      return !u;
    if (n === "__v_isReadonly")
      return u;
    if (n === "__v_isShallow")
      return o;
    if (n === "__v_raw")
      return r === (u ? o ? Ql : fa : o ? da : la).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(r) ? t : void 0;
    const i = ie(t);
    if (!u) {
      let a;
      if (i && (a = zl[n]))
        return a;
      if (n === "hasOwnProperty")
        return jl;
    }
    const s = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      Oe(t) ? t : r
    );
    return (en(n) ? sa.has(n) : Hl(n)) || (u || rt(t, "get", n), o) ? s : Oe(s) ? i && zo(n) ? s : s.value : Pe(s) ? u ? ha(s) : Vo(s) : s;
  }
}
class ca extends aa {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, r, u) {
    let o = t[n];
    if (!this._isShallow) {
      const a = bn(o);
      if (!Et(r) && !bn(r) && (o = ge(o), r = ge(r)), !ie(t) && Oe(o) && !Oe(r))
        return a ? !1 : (o.value = r, !0);
    }
    const i = ie(t) && zo(n) ? Number(n) < t.length : _e(t, n), s = Reflect.set(
      t,
      n,
      r,
      Oe(t) ? t : u
    );
    return t === ge(u) && (i ? lt(r, o) && Zt(t, "set", n, r) : Zt(t, "add", n, r)), s;
  }
  deleteProperty(t, n) {
    const r = _e(t, n);
    t[n];
    const u = Reflect.deleteProperty(t, n);
    return u && r && Zt(t, "delete", n, void 0), u;
  }
  has(t, n) {
    const r = Reflect.has(t, n);
    return (!en(n) || !sa.has(n)) && rt(t, "has", n), r;
  }
  ownKeys(t) {
    return rt(
      t,
      "iterate",
      ie(t) ? "length" : Sn
    ), Reflect.ownKeys(t);
  }
}
class ql extends aa {
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
const Gl = /* @__PURE__ */ new ca(), Vl = /* @__PURE__ */ new ql(), Kl = /* @__PURE__ */ new ca(!0);
const wo = (e) => e, jr = (e) => Reflect.getPrototypeOf(e);
function Wl(e, t, n) {
  return function(...r) {
    const u = this.__v_raw, o = ge(u), i = Gn(o), s = e === "entries" || e === Symbol.iterator && i, a = e === "keys" && i, c = u[e](...r), l = n ? wo : t ? uu : Je;
    return !t && rt(
      o,
      "iterate",
      a ? vo : Sn
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
function qr(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Zl(e, t) {
  const n = {
    get(u) {
      const o = this.__v_raw, i = ge(o), s = ge(u);
      e || (lt(u, s) && rt(i, "get", u), rt(i, "get", s));
      const { has: a } = jr(i), c = t ? wo : e ? uu : Je;
      if (a.call(i, u))
        return c(o.get(u));
      if (a.call(i, s))
        return c(o.get(s));
      o !== i && o.get(u);
    },
    get size() {
      const u = this.__v_raw;
      return !e && rt(ge(u), "iterate", Sn), Reflect.get(u, "size", u);
    },
    has(u) {
      const o = this.__v_raw, i = ge(o), s = ge(u);
      return e || (lt(u, s) && rt(i, "has", u), rt(i, "has", s)), u === s ? o.has(u) : o.has(u) || o.has(s);
    },
    forEach(u, o) {
      const i = this, s = i.__v_raw, a = ge(s), c = t ? wo : e ? uu : Je;
      return !e && rt(a, "iterate", Sn), s.forEach((l, d) => u.call(o, c(l), c(d), i));
    }
  };
  return Xe(
    n,
    e ? {
      add: qr("add"),
      set: qr("set"),
      delete: qr("delete"),
      clear: qr("clear")
    } : {
      add(u) {
        !t && !Et(u) && !bn(u) && (u = ge(u));
        const o = ge(this);
        return jr(o).has.call(o, u) || (o.add(u), Zt(o, "add", u, u)), this;
      },
      set(u, o) {
        !t && !Et(o) && !bn(o) && (o = ge(o));
        const i = ge(this), { has: s, get: a } = jr(i);
        let c = s.call(i, u);
        c || (u = ge(u), c = s.call(i, u));
        const l = a.call(i, u);
        return i.set(u, o), c ? lt(o, l) && Zt(i, "set", u, o) : Zt(i, "add", u, o), this;
      },
      delete(u) {
        const o = ge(this), { has: i, get: s } = jr(o);
        let a = i.call(o, u);
        a || (u = ge(u), a = i.call(o, u)), s && s.call(o, u);
        const c = o.delete(u);
        return a && Zt(o, "delete", u, void 0), c;
      },
      clear() {
        const u = ge(this), o = u.size !== 0, i = u.clear();
        return o && Zt(
          u,
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
  ].forEach((u) => {
    n[u] = Wl(u, e, t);
  }), n;
}
function Go(e, t) {
  const n = Zl(e, t);
  return (r, u, o) => u === "__v_isReactive" ? !e : u === "__v_isReadonly" ? e : u === "__v_raw" ? r : Reflect.get(
    _e(n, u) && u in r ? n : r,
    u,
    o
  );
}
const Jl = {
  get: /* @__PURE__ */ Go(!1, !1)
}, Yl = {
  get: /* @__PURE__ */ Go(!1, !0)
}, Xl = {
  get: /* @__PURE__ */ Go(!0, !1)
};
const la = /* @__PURE__ */ new WeakMap(), da = /* @__PURE__ */ new WeakMap(), fa = /* @__PURE__ */ new WeakMap(), Ql = /* @__PURE__ */ new WeakMap();
function e0(e) {
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
function t0(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : e0(Sl(e));
}
function Vo(e) {
  return bn(e) ? e : Ko(
    e,
    !1,
    Gl,
    Jl,
    la
  );
}
function n0(e) {
  return Ko(
    e,
    !1,
    Kl,
    Yl,
    da
  );
}
function ha(e) {
  return Ko(
    e,
    !0,
    Vl,
    Xl,
    fa
  );
}
function Ko(e, t, n, r, u) {
  if (!Pe(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const o = t0(e);
  if (o === 0)
    return e;
  const i = u.get(e);
  if (i)
    return i;
  const s = new Proxy(
    e,
    o === 2 ? r : n
  );
  return u.set(e, s), s;
}
function Xt(e) {
  return bn(e) ? Xt(e.__v_raw) : !!(e && e.__v_isReactive);
}
function bn(e) {
  return !!(e && e.__v_isReadonly);
}
function Et(e) {
  return !!(e && e.__v_isShallow);
}
function Wo(e) {
  return e ? !!e.__v_raw : !1;
}
function ge(e) {
  const t = e && e.__v_raw;
  return t ? ge(t) : e;
}
function ht(e) {
  return !_e(e, "__v_skip") && Object.isExtensible(e) && Vs(e, "__v_skip", !0), e;
}
const Je = (e) => Pe(e) ? Vo(e) : e, uu = (e) => Pe(e) ? ha(e) : e;
function Oe(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ye(e) {
  return r0(e, !1);
}
function r0(e, t) {
  return Oe(e) ? e : new u0(e, t);
}
class u0 {
  constructor(t, n) {
    this.dep = new Eu(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : ge(t), this._value = n ? t : Je(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, r = this.__v_isShallow || Et(t) || bn(t);
    t = r ? t : ge(t), lt(t, n) && (this._rawValue = t, this._value = r ? t : Je(t), this.dep.trigger());
  }
}
function q(e) {
  return Oe(e) ? e.value : e;
}
const o0 = {
  get: (e, t, n) => t === "__v_raw" ? e : q(Reflect.get(e, t, n)),
  set: (e, t, n, r) => {
    const u = e[t];
    return Oe(u) && !Oe(n) ? (u.value = n, !0) : Reflect.set(e, t, n, r);
  }
};
function pa(e) {
  return Xt(e) ? e : new Proxy(e, o0);
}
class i0 {
  constructor(t) {
    this.__v_isRef = !0, this._value = void 0;
    const n = this.dep = new Eu(), { get: r, set: u } = t(n.track.bind(n), n.trigger.bind(n));
    this._get = r, this._set = u;
  }
  get value() {
    return this._value = this._get();
  }
  set value(t) {
    this._set(t);
  }
}
function s0(e) {
  return new i0(e);
}
function a0(e) {
  const t = ie(e) ? new Array(e.length) : {};
  for (const n in e)
    t[n] = ba(e, n);
  return t;
}
class c0 {
  constructor(t, n, r) {
    this._object = t, this._key = n, this._defaultValue = r, this.__v_isRef = !0, this._value = void 0;
  }
  get value() {
    const t = this._object[this._key];
    return this._value = t === void 0 ? this._defaultValue : t;
  }
  set value(t) {
    this._object[this._key] = t;
  }
  get dep() {
    return $l(ge(this._object), this._key);
  }
}
class l0 {
  constructor(t) {
    this._getter = t, this.__v_isRef = !0, this.__v_isReadonly = !0, this._value = void 0;
  }
  get value() {
    return this._value = this._getter();
  }
}
function ga(e, t, n) {
  return Oe(e) ? e : we(e) ? new l0(e) : Pe(e) && arguments.length > 1 ? ba(e, t, n) : ye(e);
}
function ba(e, t, n) {
  const r = e[t];
  return Oe(r) ? r : new c0(e, t, n);
}
class d0 {
  constructor(t, n, r) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Eu(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = mr - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = r;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    Me !== this)
      return ta(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return ua(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function f0(e, t, n = !1) {
  let r, u;
  return we(e) ? r = e : (r = e.get, u = e.set), new d0(r, u, n);
}
const Gr = {}, ou = /* @__PURE__ */ new WeakMap();
let Cn;
function h0(e, t = !1, n = Cn) {
  if (n) {
    let r = ou.get(n);
    r || ou.set(n, r = []), r.push(e);
  }
}
function p0(e, t, n = xe) {
  const { immediate: r, deep: u, once: o, scheduler: i, augmentJob: s, call: a } = n, c = (E) => u ? E : Et(E) || u === !1 || u === 0 ? Jt(E, 1) : Jt(E);
  let l, d, h, f, p = !1, _ = !1;
  if (Oe(e) ? (d = () => e.value, p = Et(e)) : Xt(e) ? (d = () => c(e), p = !0) : ie(e) ? (_ = !0, p = e.some((E) => Xt(E) || Et(E)), d = () => e.map((E) => {
    if (Oe(E))
      return E.value;
    if (Xt(E))
      return c(E);
    if (we(E))
      return a ? a(E, 2) : E();
  })) : we(e) ? t ? d = a ? () => a(e, 2) : e : d = () => {
    if (h) {
      pn();
      try {
        h();
      } finally {
        gn();
      }
    }
    const E = Cn;
    Cn = l;
    try {
      return a ? a(e, 3, [f]) : e(f);
    } finally {
      Cn = E;
    }
  } : d = An, t && u) {
    const E = d, x = u === !0 ? 1 / 0 : u;
    d = () => Jt(E(), x);
  }
  const M = Xs(), A = () => {
    l.stop(), M && M.active && Hs(M.effects, l);
  };
  if (o && t) {
    const E = t;
    t = (...x) => {
      E(...x), A();
    };
  }
  let k = _ ? new Array(e.length).fill(Gr) : Gr;
  const F = (E) => {
    if (!(!(l.flags & 1) || !l.dirty && !E))
      if (t) {
        const x = l.run();
        if (u || p || (_ ? x.some((L, te) => lt(L, k[te])) : lt(x, k))) {
          h && h();
          const L = Cn;
          Cn = l;
          try {
            const te = [
              x,
              // pass undefined as the old value when it's changed for the first time
              k === Gr ? void 0 : _ && k[0] === Gr ? [] : k,
              f
            ];
            a ? a(t, 3, te) : (
              // @ts-expect-error
              t(...te)
            ), k = x;
          } finally {
            Cn = L;
          }
        }
      } else
        l.run();
  };
  return s && s(F), l = new Qs(d), l.scheduler = i ? () => i(F, !1) : F, f = (E) => h0(E, !1, l), h = l.onStop = () => {
    const E = ou.get(l);
    if (E) {
      if (a)
        a(E, 4);
      else
        for (const x of E) x();
      ou.delete(l);
    }
  }, t ? r ? F(!0) : k = l.run() : i ? i(F.bind(null, !0), !0) : l.run(), A.pause = l.pause.bind(l), A.resume = l.resume.bind(l), A.stop = A, A;
}
function Jt(e, t = 1 / 0, n) {
  if (t <= 0 || !Pe(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, Oe(e))
    Jt(e.value, t, n);
  else if (ie(e))
    for (let r = 0; r < e.length; r++)
      Jt(e[r], t, n);
  else if (js(e) || Gn(e))
    e.forEach((r) => {
      Jt(r, t, n);
    });
  else if (yu(e)) {
    for (const r in e)
      Jt(e[r], t, n);
    for (const r of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, r) && Jt(e[r], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Dr(e, t, n, r) {
  try {
    return r ? e(...r) : e();
  } catch (u) {
    Au(u, t, n);
  }
}
function Ht(e, t, n, r) {
  if (we(e)) {
    const u = Dr(e, t, n, r);
    return u && qs(u) && u.catch((o) => {
      Au(o, t, n);
    }), u;
  }
  if (ie(e)) {
    const u = [];
    for (let o = 0; o < e.length; o++)
      u.push(Ht(e[o], t, n, r));
    return u;
  }
}
function Au(e, t, n, r = !0) {
  const u = t ? t.vnode : null, { errorHandler: o, throwUnhandledErrorInProduction: i } = t && t.appContext.config || xe;
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
      pn(), Dr(o, null, 10, [
        e,
        a,
        c
      ]), gn();
      return;
    }
  }
  g0(e, n, u, r, i);
}
function g0(e, t, n, r = !0, u = !1) {
  if (u)
    throw e;
  console.error(e);
}
const at = [];
let Pt = -1;
const Vn = [];
let an = null, Pn = 0;
const ma = /* @__PURE__ */ Promise.resolve();
let iu = null;
function Qt(e) {
  const t = iu || ma;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function b0(e) {
  let t = Pt + 1, n = at.length;
  for (; t < n; ) {
    const r = t + n >>> 1, u = at[r], o = xr(u);
    o < e || o === e && u.flags & 2 ? t = r + 1 : n = r;
  }
  return t;
}
function Zo(e) {
  if (!(e.flags & 1)) {
    const t = xr(e), n = at[at.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= xr(n) ? at.push(e) : at.splice(b0(t), 0, e), e.flags |= 1, _a();
  }
}
function _a() {
  iu || (iu = ma.then(ya));
}
function m0(e) {
  ie(e) ? Vn.push(...e) : an && e.id === -1 ? an.splice(Pn + 1, 0, e) : e.flags & 1 || (Vn.push(e), e.flags |= 1), _a();
}
function Oi(e, t, n = Pt + 1) {
  for (; n < at.length; n++) {
    const r = at[n];
    if (r && r.flags & 2) {
      if (e && r.id !== e.uid)
        continue;
      at.splice(n, 1), n--, r.flags & 4 && (r.flags &= -2), r(), r.flags & 4 || (r.flags &= -2);
    }
  }
}
function xa(e) {
  if (Vn.length) {
    const t = [...new Set(Vn)].sort(
      (n, r) => xr(n) - xr(r)
    );
    if (Vn.length = 0, an) {
      an.push(...t);
      return;
    }
    for (an = t, Pn = 0; Pn < an.length; Pn++) {
      const n = an[Pn];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    an = null, Pn = 0;
  }
}
const xr = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function ya(e) {
  try {
    for (Pt = 0; Pt < at.length; Pt++) {
      const t = at[Pt];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Dr(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Pt < at.length; Pt++) {
      const t = at[Pt];
      t && (t.flags &= -2);
    }
    Pt = -1, at.length = 0, xa(), iu = null, (at.length || Vn.length) && ya();
  }
}
let Ge = null, va = null;
function su(e) {
  const t = Ge;
  return Ge = e, va = e && e.type.__scopeId || null, t;
}
function Ye(e, t = Ge, n) {
  if (!t || e._n)
    return e;
  const r = (...u) => {
    r._d && ji(-1);
    const o = su(t);
    let i;
    try {
      i = e(...u);
    } finally {
      su(o), r._d && ji(1);
    }
    return i;
  };
  return r._n = !0, r._c = !0, r._d = !0, r;
}
function _0(e, t) {
  if (Ge === null)
    return e;
  const n = Mu(Ge), r = e.dirs || (e.dirs = []);
  for (let u = 0; u < t.length; u++) {
    let [o, i, s, a = xe] = t[u];
    o && (we(o) && (o = {
      mounted: o,
      updated: o
    }), o.deep && Jt(i), r.push({
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
function vn(e, t, n, r) {
  const u = e.dirs, o = t && t.dirs;
  for (let i = 0; i < u.length; i++) {
    const s = u[i];
    o && (s.oldValue = o[i].value);
    let a = s.dir[r];
    a && (pn(), Ht(a, n, 8, [
      e.el,
      s,
      e,
      t
    ]), gn());
  }
}
const x0 = Symbol("_vte"), y0 = (e) => e.__isTeleport, On = Symbol("_leaveCb"), Vr = Symbol("_enterCb");
function v0() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  return Fn(() => {
    e.isMounted = !0;
  }), Jo(() => {
    e.isUnmounting = !0;
  }), e;
}
const kt = [Function, Array], w0 = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: kt,
  onEnter: kt,
  onAfterEnter: kt,
  onEnterCancelled: kt,
  // leave
  onBeforeLeave: kt,
  onLeave: kt,
  onAfterLeave: kt,
  onLeaveCancelled: kt,
  // appear
  onBeforeAppear: kt,
  onAppear: kt,
  onAfterAppear: kt,
  onAppearCancelled: kt
};
function k0(e, t) {
  const { leavingVNodes: n } = e;
  let r = n.get(t.type);
  return r || (r = /* @__PURE__ */ Object.create(null), n.set(t.type, r)), r;
}
function ko(e, t, n, r, u) {
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
    onBeforeAppear: M,
    onAppear: A,
    onAfterAppear: k,
    onAppearCancelled: F
  } = t, E = String(e.key), x = k0(n, e), L = (N, ee) => {
    N && Ht(
      N,
      r,
      9,
      ee
    );
  }, te = (N, ee) => {
    const ce = ee[1];
    L(N, ee), ie(N) ? N.every((v) => v.length <= 1) && ce() : N.length <= 1 && ce();
  }, K = {
    mode: i,
    persisted: s,
    beforeEnter(N) {
      let ee = a;
      if (!n.isMounted)
        if (o)
          ee = M || a;
        else
          return;
      N[On] && N[On](
        !0
        /* cancelled */
      );
      const ce = x[E];
      ce && $n(e, ce) && ce.el[On] && ce.el[On](), L(ee, [N]);
    },
    enter(N) {
      let ee = c, ce = l, v = d;
      if (!n.isMounted)
        if (o)
          ee = A || c, ce = k || l, v = F || d;
        else
          return;
      let j = !1;
      const oe = N[Vr] = (he) => {
        j || (j = !0, he ? L(v, [N]) : L(ce, [N]), K.delayedLeave && K.delayedLeave(), N[Vr] = void 0);
      };
      ee ? te(ee, [N, oe]) : oe();
    },
    leave(N, ee) {
      const ce = String(e.key);
      if (N[Vr] && N[Vr](
        !0
        /* cancelled */
      ), n.isUnmounting)
        return ee();
      L(h, [N]);
      let v = !1;
      const j = N[On] = (oe) => {
        v || (v = !0, ee(), oe ? L(_, [N]) : L(p, [N]), N[On] = void 0, x[ce] === e && delete x[ce]);
      };
      x[ce] = e, f ? te(f, [N, j]) : j();
    },
    clone(N) {
      return ko(
        N,
        t,
        n,
        r
      );
    }
  };
  return K;
}
function yr(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, yr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
function wa(e, t = !1, n) {
  let r = [], u = 0;
  for (let o = 0; o < e.length; o++) {
    let i = e[o];
    const s = n == null ? i.key : String(n) + String(i.key != null ? i.key : o);
    i.type === Fe ? (i.patchFlag & 128 && u++, r = r.concat(
      wa(i.children, t, s)
    )) : (t || i.type !== jt) && r.push(s != null ? Mn(i, { key: s }) : i);
  }
  if (u > 1)
    for (let o = 0; o < r.length; o++)
      r[o].patchFlag = -2;
  return r;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Ce(e, t) {
  return we(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Xe({ name: e.name }, t, { setup: e })
  ) : e;
}
function E0(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function au(e, t, n, r, u = !1) {
  if (ie(e)) {
    e.forEach(
      (p, _) => au(
        p,
        t && (ie(t) ? t[_] : t),
        n,
        r,
        u
      )
    );
    return;
  }
  if (Kn(r) && !u) {
    r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && au(e, t, n, r.component.subTree);
    return;
  }
  const o = r.shapeFlag & 4 ? Mu(r.component) : r.el, i = u ? null : o, { i: s, r: a } = e, c = t && t.r, l = s.refs === xe ? s.refs = {} : s.refs, d = s.setupState, h = ge(d), f = d === xe ? () => !1 : (p) => _e(h, p);
  if (c != null && c !== a && (ze(c) ? (l[c] = null, f(c) && (d[c] = null)) : Oe(c) && (c.value = null)), we(a))
    Dr(a, s, 12, [i, l]);
  else {
    const p = ze(a), _ = Oe(a);
    if (p || _) {
      const M = () => {
        if (e.f) {
          const A = p ? f(a) ? d[a] : l[a] : a.value;
          u ? ie(A) && Hs(A, o) : ie(A) ? A.includes(o) || A.push(o) : p ? (l[a] = [o], f(a) && (d[a] = l[a])) : (a.value = [o], e.k && (l[e.k] = a.value));
        } else p ? (l[a] = i, f(a) && (d[a] = i)) : _ && (a.value = i, e.k && (l[e.k] = i));
      };
      i ? (M.id = -1, gt(M, n)) : M();
    }
  }
}
ku().requestIdleCallback;
ku().cancelIdleCallback;
const Kn = (e) => !!e.type.__asyncLoader, C0 = (e) => e.type.__isKeepAlive;
function A0(e, t, n = ut, r = !1) {
  if (n) {
    const u = n[e] || (n[e] = []), o = t.__weh || (t.__weh = (...i) => {
      pn();
      const s = ri(n), a = Ht(t, n, e, i);
      return s(), gn(), a;
    });
    return r ? u.unshift(o) : u.push(o), o;
  }
}
const Su = (e) => (t, n = ut) => {
  (!wr || e === "sp") && A0(e, (...r) => t(...r), n);
}, Fn = Su("m"), S0 = Su("u"), Jo = Su(
  "bum"
), D0 = Su("um"), T0 = "components", ka = Symbol.for("v-ndc");
function M0(e) {
  return ze(e) ? F0(T0, e, !1) || e : e || ka;
}
function F0(e, t, n = !0, r = !1) {
  const u = Ge || ut;
  if (u) {
    const o = u.type;
    {
      const s = hd(
        o,
        !1
      );
      if (s && (s === t || s === ot(t) || s === wu(ot(t))))
        return o;
    }
    const i = (
      // local registration
      // check instance[type] first which is resolved for options API
      Li(u[e] || o[e], t) || // global registration
      Li(u.appContext[e], t)
    );
    return !i && r ? o : i;
  }
}
function Li(e, t) {
  return e && (e[t] || e[ot(t)] || e[wu(ot(t))]);
}
function tn(e, t, n, r) {
  let u;
  const o = n, i = ie(e);
  if (i || ze(e)) {
    const s = i && Xt(e);
    let a = !1, c = !1;
    s && (a = !Et(e), c = bn(e), e = Cu(e)), u = new Array(e.length);
    for (let l = 0, d = e.length; l < d; l++)
      u[l] = t(
        a ? c ? uu(Je(e[l])) : Je(e[l]) : e[l],
        l,
        void 0,
        o
      );
  } else if (typeof e == "number") {
    u = new Array(e);
    for (let s = 0; s < e; s++)
      u[s] = t(s + 1, s, void 0, o);
  } else if (Pe(e))
    if (e[Symbol.iterator])
      u = Array.from(
        e,
        (s, a) => t(s, a, void 0, o)
      );
    else {
      const s = Object.keys(e);
      u = new Array(s.length);
      for (let a = 0, c = s.length; a < c; a++) {
        const l = s[a];
        u[a] = t(e[l], l, a, o);
      }
    }
  else
    u = [];
  return u;
}
function cu(e, t, n = {}, r, u) {
  if (Ge.ce || Ge.parent && Kn(Ge.parent) && Ge.parent.ce)
    return t !== "default" && (n.name = t), R(), Ue(
      Fe,
      null,
      [Y("slot", n, r)],
      64
    );
  let o = e[t];
  o && o._c && (o._d = !1), R();
  const i = o && Ea(o(n)), s = n.key || // slot content array of a dynamic conditional slot may have a branch
  // key attached in the `createSlots` helper, respect that
  i && i.key, a = Ue(
    Fe,
    {
      key: (s && !en(s) ? s : `_${t}`) + // #7256 force differentiate fallback content from actual content
      ""
    },
    i || [],
    i && e._ === 1 ? 64 : -2
  );
  return a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]), o && o._c && (o._d = !0), a;
}
function Ea(e) {
  return e.some((t) => ei(t) ? !(t.type === jt || t.type === Fe && !Ea(t.children)) : !0) ? e : null;
}
const Eo = (e) => e ? ja(e) ? Mu(e) : Eo(e.parent) : null, hr = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Xe(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Eo(e.parent),
    $root: (e) => Eo(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => e.type,
    $forceUpdate: (e) => e.f || (e.f = () => {
      Zo(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Qt.bind(e.proxy)),
    $watch: (e) => An
  })
), eo = (e, t) => e !== xe && !e.__isScriptSetup && _e(e, t), R0 = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: r, data: u, props: o, accessCache: i, type: s, appContext: a } = e;
    let c;
    if (t[0] !== "$") {
      const f = i[t];
      if (f !== void 0)
        switch (f) {
          case 1:
            return r[t];
          case 2:
            return u[t];
          case 4:
            return n[t];
          case 3:
            return o[t];
        }
      else {
        if (eo(r, t))
          return i[t] = 1, r[t];
        if (u !== xe && _e(u, t))
          return i[t] = 2, u[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (c = e.propsOptions[0]) && _e(c, t)
        )
          return i[t] = 3, o[t];
        if (n !== xe && _e(n, t))
          return i[t] = 4, n[t];
        i[t] = 0;
      }
    }
    const l = hr[t];
    let d, h;
    if (l)
      return t === "$attrs" && rt(e.attrs, "get", ""), l(e);
    if (
      // css module (injected by vue-loader)
      (d = s.__cssModules) && (d = d[t])
    )
      return d;
    if (n !== xe && _e(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      h = a.config.globalProperties, _e(h, t)
    )
      return h[t];
  },
  set({ _: e }, t, n) {
    const { data: r, setupState: u, ctx: o } = e;
    return eo(u, t) ? (u[t] = n, !0) : r !== xe && _e(r, t) ? (r[t] = n, !0) : _e(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (o[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: u, propsOptions: o }
  }, i) {
    let s;
    return !!n[i] || e !== xe && _e(e, i) || eo(t, i) || (s = o[0]) && _e(s, i) || _e(r, i) || _e(hr, i) || _e(u.config.globalProperties, i);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : _e(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Bi(e) {
  return ie(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
function Pi(e, t) {
  return !e || !t ? e || t : ie(e) && ie(t) ? e.concat(t) : Xe({}, Bi(e), Bi(t));
}
function Ca() {
  return {
    app: null,
    config: {
      isNativeTag: Cl,
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
let I0 = 0;
function N0(e, t) {
  return function(r, u = null) {
    we(r) || (r = Xe({}, r)), u != null && !Pe(u) && (u = null);
    const o = Ca(), i = /* @__PURE__ */ new WeakSet(), s = [];
    let a = !1;
    const c = o.app = {
      _uid: I0++,
      _component: r,
      _props: u,
      _container: null,
      _context: o,
      _instance: null,
      version: gd,
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
          const f = c._ceVNode || Y(r, u);
          return f.appContext = o, h === !0 ? h = "svg" : h === !1 && (h = void 0), e(f, l, h), a = !0, c._container = l, l.__vue_app__ = c, Mu(f.component);
        }
      },
      onUnmount(l) {
        s.push(l);
      },
      unmount() {
        a && (Ht(
          s,
          c._instance,
          16
        ), e(null, c._container), delete c._container.__vue_app__);
      },
      provide(l, d) {
        return o.provides[l] = d, c;
      },
      runWithContext(l) {
        const d = Dn;
        Dn = c;
        try {
          return l();
        } finally {
          Dn = d;
        }
      }
    };
    return c;
  };
}
let Dn = null;
function Aa(e, t) {
  if (ut) {
    let n = ut.provides;
    const r = ut.parent && ut.parent.provides;
    r === n && (n = ut.provides = Object.create(r)), n[e] = t;
  }
}
function Yo(e, t, n = !1) {
  const r = ut || Ge;
  if (r || Dn) {
    const u = Dn ? Dn._context.provides : r ? r.parent == null ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
    if (u && e in u)
      return u[e];
    if (arguments.length > 1)
      return n && we(t) ? t.call(r && r.proxy) : t;
  }
}
function O0() {
  return !!(ut || Ge || Dn);
}
const Sa = {}, Da = () => Object.create(Sa), Ta = (e) => Object.getPrototypeOf(e) === Sa;
function L0(e, t, n, r = !1) {
  const u = {}, o = Da();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Ma(e, t, u, o);
  for (const i in e.propsOptions[0])
    i in u || (u[i] = void 0);
  n ? e.props = r ? u : n0(u) : e.type.props ? e.props = u : e.props = o, e.attrs = o;
}
function B0(e, t, n, r) {
  const {
    props: u,
    attrs: o,
    vnode: { patchFlag: i }
  } = e, s = ge(u), [a] = e.propsOptions;
  let c = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (r || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const l = e.vnode.dynamicProps;
      for (let d = 0; d < l.length; d++) {
        let h = l[d];
        if (Du(e.emitsOptions, h))
          continue;
        const f = t[h];
        if (a)
          if (_e(o, h))
            f !== o[h] && (o[h] = f, c = !0);
          else {
            const p = ot(h);
            u[p] = Co(
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
    Ma(e, t, u, o) && (c = !0);
    let l;
    for (const d in s)
      (!t || // for camelCase
      !_e(t, d) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((l = dt(d)) === d || !_e(t, l))) && (a ? n && // for camelCase
      (n[d] !== void 0 || // for kebab-case
      n[l] !== void 0) && (u[d] = Co(
        a,
        s,
        d,
        void 0,
        e,
        !0
      )) : delete u[d]);
    if (o !== s)
      for (const d in o)
        (!t || !_e(t, d)) && (delete o[d], c = !0);
  }
  c && Zt(e.attrs, "set", "");
}
function Ma(e, t, n, r) {
  const [u, o] = e.propsOptions;
  let i = !1, s;
  if (t)
    for (let a in t) {
      if (lr(a))
        continue;
      const c = t[a];
      let l;
      u && _e(u, l = ot(a)) ? !o || !o.includes(l) ? n[l] = c : (s || (s = {}))[l] = c : Du(e.emitsOptions, a) || (!(a in r) || c !== r[a]) && (r[a] = c, i = !0);
    }
  if (o) {
    const a = ge(n), c = s || xe;
    for (let l = 0; l < o.length; l++) {
      const d = o[l];
      n[d] = Co(
        u,
        a,
        d,
        c[d],
        e,
        !_e(c, d)
      );
    }
  }
  return i;
}
function Co(e, t, n, r, u, o) {
  const i = e[n];
  if (i != null) {
    const s = _e(i, "default");
    if (s && r === void 0) {
      const a = i.default;
      if (i.type !== Function && !i.skipFactory && we(a)) {
        const { propsDefaults: c } = u;
        if (n in c)
          r = c[n];
        else {
          const l = ri(u);
          r = c[n] = a.call(
            null,
            t
          ), l();
        }
      } else
        r = a;
      u.ce && u.ce._setProp(n, r);
    }
    i[
      0
      /* shouldCast */
    ] && (o && !s ? r = !1 : i[
      1
      /* shouldCastTrue */
    ] && (r === "" || r === dt(n)) && (r = !0));
  }
  return r;
}
function P0(e, t, n = !1) {
  const r = t.propsCache, u = r.get(e);
  if (u)
    return u;
  const o = e.props, i = {}, s = [];
  if (!o)
    return Pe(e) && r.set(e, qn), qn;
  if (ie(o))
    for (let c = 0; c < o.length; c++) {
      const l = ot(o[c]);
      $i(l) && (i[l] = xe);
    }
  else if (o)
    for (const c in o) {
      const l = ot(c);
      if ($i(l)) {
        const d = o[c], h = i[l] = ie(d) || we(d) ? { type: d } : Xe({}, d), f = h.type;
        let p = !1, _ = !0;
        if (ie(f))
          for (let M = 0; M < f.length; ++M) {
            const A = f[M], k = we(A) && A.name;
            if (k === "Boolean") {
              p = !0;
              break;
            } else k === "String" && (_ = !1);
          }
        else
          p = we(f) && f.name === "Boolean";
        h[
          0
          /* shouldCast */
        ] = p, h[
          1
          /* shouldCastTrue */
        ] = _, (p || _e(h, "default")) && s.push(l);
      }
    }
  const a = [i, s];
  return Pe(e) && r.set(e, a), a;
}
function $i(e) {
  return e[0] !== "$" && !lr(e);
}
const Xo = (e) => e[0] === "_" || e === "$stable", Qo = (e) => ie(e) ? e.map($t) : [$t(e)], $0 = (e, t, n) => {
  if (t._n)
    return t;
  const r = Ye((...u) => Qo(t(...u)), n);
  return r._c = !1, r;
}, Fa = (e, t, n) => {
  const r = e._ctx;
  for (const u in e) {
    if (Xo(u)) continue;
    const o = e[u];
    if (we(o))
      t[u] = $0(u, o, r);
    else if (o != null) {
      const i = Qo(o);
      t[u] = () => i;
    }
  }
}, Ra = (e, t) => {
  const n = Qo(t);
  e.slots.default = () => n;
}, Ia = (e, t, n) => {
  for (const r in t)
    (n || !Xo(r)) && (e[r] = t[r]);
}, z0 = (e, t, n) => {
  const r = e.slots = Da();
  if (e.vnode.shapeFlag & 32) {
    const u = t._;
    u ? (Ia(r, t, n), n && Vs(r, "_", u, !0)) : Fa(t, r);
  } else t && Ra(e, t);
}, U0 = (e, t, n) => {
  const { vnode: r, slots: u } = e;
  let o = !0, i = xe;
  if (r.shapeFlag & 32) {
    const s = t._;
    s ? n && s === 1 ? o = !1 : Ia(u, t, n) : (o = !t.$stable, Fa(t, u)), i = t;
  } else t && (Ra(e, t), i = { default: 1 });
  if (o)
    for (const s in u)
      !Xo(s) && i[s] == null && delete u[s];
}, gt = nd;
function H0(e) {
  return j0(e);
}
function j0(e, t) {
  const n = ku();
  n.__VUE__ = !0;
  const {
    insert: r,
    remove: u,
    patchProp: o,
    createElement: i,
    createText: s,
    createComment: a,
    setText: c,
    setElementText: l,
    parentNode: d,
    nextSibling: h,
    setScopeId: f = An,
    insertStaticContent: p
  } = e, _ = (g, m, y, D = null, C = null, S = null, $ = void 0, B = null, O = !!m.dynamicChildren) => {
    if (g === m)
      return;
    g && !$n(g, m) && (D = Rn(g), Ee(g, C, S, !0), g = null), m.patchFlag === -2 && (O = !1, m.dynamicChildren = null);
    const { type: T, ref: X, shapeFlag: z } = m;
    switch (T) {
      case Tu:
        M(g, m, y, D);
        break;
      case jt:
        A(g, m, y, D);
        break;
      case Qr:
        g == null && k(m, y, D, $);
        break;
      case Fe:
        v(
          g,
          m,
          y,
          D,
          C,
          S,
          $,
          B,
          O
        );
        break;
      default:
        z & 1 ? x(
          g,
          m,
          y,
          D,
          C,
          S,
          $,
          B,
          O
        ) : z & 6 ? j(
          g,
          m,
          y,
          D,
          C,
          S,
          $,
          B,
          O
        ) : (z & 64 || z & 128) && T.process(
          g,
          m,
          y,
          D,
          C,
          S,
          $,
          B,
          O,
          It
        );
    }
    X != null && C && au(X, g && g.ref, S, m || g, !m);
  }, M = (g, m, y, D) => {
    if (g == null)
      r(
        m.el = s(m.children),
        y,
        D
      );
    else {
      const C = m.el = g.el;
      m.children !== g.children && c(C, m.children);
    }
  }, A = (g, m, y, D) => {
    g == null ? r(
      m.el = a(m.children || ""),
      y,
      D
    ) : m.el = g.el;
  }, k = (g, m, y, D) => {
    [g.el, g.anchor] = p(
      g.children,
      m,
      y,
      D,
      g.el,
      g.anchor
    );
  }, F = ({ el: g, anchor: m }, y, D) => {
    let C;
    for (; g && g !== m; )
      C = h(g), r(g, y, D), g = C;
    r(m, y, D);
  }, E = ({ el: g, anchor: m }) => {
    let y;
    for (; g && g !== m; )
      y = h(g), u(g), g = y;
    u(m);
  }, x = (g, m, y, D, C, S, $, B, O) => {
    m.type === "svg" ? $ = "svg" : m.type === "math" && ($ = "mathml"), g == null ? L(
      m,
      y,
      D,
      C,
      S,
      $,
      B,
      O
    ) : N(
      g,
      m,
      C,
      S,
      $,
      B,
      O
    );
  }, L = (g, m, y, D, C, S, $, B) => {
    let O, T;
    const { props: X, shapeFlag: z, transition: W, dirs: ne } = g;
    if (O = g.el = i(
      g.type,
      S,
      X && X.is,
      X
    ), z & 8 ? l(O, g.children) : z & 16 && K(
      g.children,
      O,
      null,
      D,
      C,
      to(g, S),
      $,
      B
    ), ne && vn(g, null, D, "created"), te(O, g, g.scopeId, $, D), X) {
      for (const me in X)
        me !== "value" && !lr(me) && o(O, me, null, X[me], S, D);
      "value" in X && o(O, "value", null, X.value, S), (T = X.onVnodeBeforeMount) && Lt(T, D, g);
    }
    ne && vn(g, null, D, "beforeMount");
    const le = q0(C, W);
    le && W.beforeEnter(O), r(O, m, y), ((T = X && X.onVnodeMounted) || le || ne) && gt(() => {
      T && Lt(T, D, g), le && W.enter(O), ne && vn(g, null, D, "mounted");
    }, C);
  }, te = (g, m, y, D, C) => {
    if (y && f(g, y), D)
      for (let S = 0; S < D.length; S++)
        f(g, D[S]);
    if (C) {
      let S = C.subTree;
      if (m === S || Pa(S.type) && (S.ssContent === m || S.ssFallback === m)) {
        const $ = C.vnode;
        te(
          g,
          $,
          $.scopeId,
          $.slotScopeIds,
          C.parent
        );
      }
    }
  }, K = (g, m, y, D, C, S, $, B, O = 0) => {
    for (let T = O; T < g.length; T++) {
      const X = g[T] = B ? cn(g[T]) : $t(g[T]);
      _(
        null,
        X,
        m,
        y,
        D,
        C,
        S,
        $,
        B
      );
    }
  }, N = (g, m, y, D, C, S, $) => {
    const B = m.el = g.el;
    let { patchFlag: O, dynamicChildren: T, dirs: X } = m;
    O |= g.patchFlag & 16;
    const z = g.props || xe, W = m.props || xe;
    let ne;
    if (y && wn(y, !1), (ne = W.onVnodeBeforeUpdate) && Lt(ne, y, m, g), X && vn(m, g, y, "beforeUpdate"), y && wn(y, !0), (z.innerHTML && W.innerHTML == null || z.textContent && W.textContent == null) && l(B, ""), T ? ee(
      g.dynamicChildren,
      T,
      B,
      y,
      D,
      to(m, C),
      S
    ) : $ || fe(
      g,
      m,
      B,
      null,
      y,
      D,
      to(m, C),
      S,
      !1
    ), O > 0) {
      if (O & 16)
        ce(B, z, W, y, C);
      else if (O & 2 && z.class !== W.class && o(B, "class", null, W.class, C), O & 4 && o(B, "style", z.style, W.style, C), O & 8) {
        const le = m.dynamicProps;
        for (let me = 0; me < le.length; me++) {
          const be = le[me], it = z[be], et = W[be];
          (et !== it || be === "value") && o(B, be, it, et, C, y);
        }
      }
      O & 1 && g.children !== m.children && l(B, m.children);
    } else !$ && T == null && ce(B, z, W, y, C);
    ((ne = W.onVnodeUpdated) || X) && gt(() => {
      ne && Lt(ne, y, m, g), X && vn(m, g, y, "updated");
    }, D);
  }, ee = (g, m, y, D, C, S, $) => {
    for (let B = 0; B < m.length; B++) {
      const O = g[B], T = m[B], X = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        O.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (O.type === Fe || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !$n(O, T) || // - In the case of a component, it could contain anything.
        O.shapeFlag & 70) ? d(O.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          y
        )
      );
      _(
        O,
        T,
        X,
        null,
        D,
        C,
        S,
        $,
        !0
      );
    }
  }, ce = (g, m, y, D, C) => {
    if (m !== y) {
      if (m !== xe)
        for (const S in m)
          !lr(S) && !(S in y) && o(
            g,
            S,
            m[S],
            null,
            C,
            D
          );
      for (const S in y) {
        if (lr(S)) continue;
        const $ = y[S], B = m[S];
        $ !== B && S !== "value" && o(g, S, B, $, C, D);
      }
      "value" in y && o(g, "value", m.value, y.value, C);
    }
  }, v = (g, m, y, D, C, S, $, B, O) => {
    const T = m.el = g ? g.el : s(""), X = m.anchor = g ? g.anchor : s("");
    let { patchFlag: z, dynamicChildren: W, slotScopeIds: ne } = m;
    ne && (B = B ? B.concat(ne) : ne), g == null ? (r(T, y, D), r(X, y, D), K(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      m.children || [],
      y,
      X,
      C,
      S,
      $,
      B,
      O
    )) : z > 0 && z & 64 && W && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    g.dynamicChildren ? (ee(
      g.dynamicChildren,
      W,
      y,
      C,
      S,
      $,
      B
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (m.key != null || C && m === C.subTree) && Na(
      g,
      m,
      !0
      /* shallow */
    )) : fe(
      g,
      m,
      y,
      X,
      C,
      S,
      $,
      B,
      O
    );
  }, j = (g, m, y, D, C, S, $, B, O) => {
    m.slotScopeIds = B, g == null ? m.shapeFlag & 512 ? C.ctx.activate(
      m,
      y,
      D,
      $,
      O
    ) : oe(
      m,
      y,
      D,
      C,
      S,
      $,
      O
    ) : he(g, m, O);
  }, oe = (g, m, y, D, C, S, $) => {
    const B = g.component = ad(
      g,
      D,
      C
    );
    if (C0(g) && (B.ctx.renderer = It), cd(B, !1, $), B.asyncDep) {
      if (C && C.registerDep(B, Ne, $), !g.el) {
        const O = B.subTree = Y(jt);
        A(null, O, m, y);
      }
    } else
      Ne(
        B,
        g,
        m,
        y,
        C,
        S,
        $
      );
  }, he = (g, m, y) => {
    const D = m.component = g.component;
    if (ed(g, m, y))
      if (D.asyncDep && !D.asyncResolved) {
        Ie(D, m, y);
        return;
      } else
        D.next = m, D.update();
    else
      m.el = g.el, D.vnode = m;
  }, Ne = (g, m, y, D, C, S, $) => {
    const B = () => {
      if (g.isMounted) {
        let { next: z, bu: W, u: ne, parent: le, vnode: me } = g;
        {
          const vt = Oa(g);
          if (vt) {
            z && (z.el = me.el, Ie(g, z, $)), vt.asyncDep.then(() => {
              g.isUnmounted || B();
            });
            return;
          }
        }
        let be = z, it;
        wn(g, !1), z ? (z.el = me.el, Ie(g, z, $)) : z = me, W && Xr(W), (it = z.props && z.props.onVnodeBeforeUpdate) && Lt(it, le, z, me), wn(g, !0);
        const et = Ui(g), yt = g.subTree;
        g.subTree = et, _(
          yt,
          et,
          // parent may have changed if it's in a teleport
          d(yt.el),
          // anchor may have changed if it's in a fragment
          Rn(yt),
          g,
          C,
          S
        ), z.el = et.el, be === null && td(g, et.el), ne && gt(ne, C), (it = z.props && z.props.onVnodeUpdated) && gt(
          () => Lt(it, le, z, me),
          C
        );
      } else {
        let z;
        const { el: W, props: ne } = m, { bm: le, m: me, parent: be, root: it, type: et } = g, yt = Kn(m);
        wn(g, !1), le && Xr(le), !yt && (z = ne && ne.onVnodeBeforeMount) && Lt(z, be, m), wn(g, !0);
        {
          it.ce && it.ce._injectChildStyle(et);
          const vt = g.subTree = Ui(g);
          _(
            null,
            vt,
            y,
            D,
            g,
            C,
            S
          ), m.el = vt.el;
        }
        if (me && gt(me, C), !yt && (z = ne && ne.onVnodeMounted)) {
          const vt = m;
          gt(
            () => Lt(z, be, vt),
            C
          );
        }
        (m.shapeFlag & 256 || be && Kn(be.vnode) && be.vnode.shapeFlag & 256) && g.a && gt(g.a, C), g.isMounted = !0, m = y = D = null;
      }
    };
    g.scope.on();
    const O = g.effect = new Qs(B);
    g.scope.off();
    const T = g.update = O.run.bind(O), X = g.job = O.runIfDirty.bind(O);
    X.i = g, X.id = g.uid, O.scheduler = () => Zo(X), wn(g, !0), T();
  }, Ie = (g, m, y) => {
    m.component = g;
    const D = g.vnode.props;
    g.vnode = m, g.next = null, B0(g, m.props, D, y), U0(g, m.children, y), pn(), Oi(g), gn();
  }, fe = (g, m, y, D, C, S, $, B, O = !1) => {
    const T = g && g.children, X = g ? g.shapeFlag : 0, z = m.children, { patchFlag: W, shapeFlag: ne } = m;
    if (W > 0) {
      if (W & 128) {
        je(
          T,
          z,
          y,
          D,
          C,
          S,
          $,
          B,
          O
        );
        return;
      } else if (W & 256) {
        He(
          T,
          z,
          y,
          D,
          C,
          S,
          $,
          B,
          O
        );
        return;
      }
    }
    ne & 8 ? (X & 16 && _n(T, C, S), z !== T && l(y, z)) : X & 16 ? ne & 16 ? je(
      T,
      z,
      y,
      D,
      C,
      S,
      $,
      B,
      O
    ) : _n(T, C, S, !0) : (X & 8 && l(y, ""), ne & 16 && K(
      z,
      y,
      D,
      C,
      S,
      $,
      B,
      O
    ));
  }, He = (g, m, y, D, C, S, $, B, O) => {
    g = g || qn, m = m || qn;
    const T = g.length, X = m.length, z = Math.min(T, X);
    let W;
    for (W = 0; W < z; W++) {
      const ne = m[W] = O ? cn(m[W]) : $t(m[W]);
      _(
        g[W],
        ne,
        y,
        null,
        C,
        S,
        $,
        B,
        O
      );
    }
    T > X ? _n(
      g,
      C,
      S,
      !0,
      !1,
      z
    ) : K(
      m,
      y,
      D,
      C,
      S,
      $,
      B,
      O,
      z
    );
  }, je = (g, m, y, D, C, S, $, B, O) => {
    let T = 0;
    const X = m.length;
    let z = g.length - 1, W = X - 1;
    for (; T <= z && T <= W; ) {
      const ne = g[T], le = m[T] = O ? cn(m[T]) : $t(m[T]);
      if ($n(ne, le))
        _(
          ne,
          le,
          y,
          null,
          C,
          S,
          $,
          B,
          O
        );
      else
        break;
      T++;
    }
    for (; T <= z && T <= W; ) {
      const ne = g[z], le = m[W] = O ? cn(m[W]) : $t(m[W]);
      if ($n(ne, le))
        _(
          ne,
          le,
          y,
          null,
          C,
          S,
          $,
          B,
          O
        );
      else
        break;
      z--, W--;
    }
    if (T > z) {
      if (T <= W) {
        const ne = W + 1, le = ne < X ? m[ne].el : D;
        for (; T <= W; )
          _(
            null,
            m[T] = O ? cn(m[T]) : $t(m[T]),
            y,
            le,
            C,
            S,
            $,
            B,
            O
          ), T++;
      }
    } else if (T > W)
      for (; T <= z; )
        Ee(g[T], C, S, !0), T++;
    else {
      const ne = T, le = T, me = /* @__PURE__ */ new Map();
      for (T = le; T <= W; T++) {
        const st = m[T] = O ? cn(m[T]) : $t(m[T]);
        st.key != null && me.set(st.key, T);
      }
      let be, it = 0;
      const et = W - le + 1;
      let yt = !1, vt = 0;
      const xn = new Array(et);
      for (T = 0; T < et; T++) xn[T] = 0;
      for (T = ne; T <= z; T++) {
        const st = g[T];
        if (it >= et) {
          Ee(st, C, S, !0);
          continue;
        }
        let wt;
        if (st.key != null)
          wt = me.get(st.key);
        else
          for (be = le; be <= W; be++)
            if (xn[be - le] === 0 && $n(st, m[be])) {
              wt = be;
              break;
            }
        wt === void 0 ? Ee(st, C, S, !0) : (xn[wt - le] = T + 1, wt >= vt ? vt = wt : yt = !0, _(
          st,
          m[wt],
          y,
          null,
          C,
          S,
          $,
          B,
          O
        ), it++);
      }
      const ur = yt ? G0(xn) : qn;
      for (be = ur.length - 1, T = et - 1; T >= 0; T--) {
        const st = le + T, wt = m[st], Lr = st + 1 < X ? m[st + 1].el : D;
        xn[T] === 0 ? _(
          null,
          wt,
          y,
          Lr,
          C,
          S,
          $,
          B,
          O
        ) : yt && (be < 0 || T !== ur[be] ? ke(wt, y, Lr, 2) : be--);
      }
    }
  }, ke = (g, m, y, D, C = null) => {
    const { el: S, type: $, transition: B, children: O, shapeFlag: T } = g;
    if (T & 6) {
      ke(g.component.subTree, m, y, D);
      return;
    }
    if (T & 128) {
      g.suspense.move(m, y, D);
      return;
    }
    if (T & 64) {
      $.move(g, m, y, It);
      return;
    }
    if ($ === Fe) {
      r(S, m, y);
      for (let z = 0; z < O.length; z++)
        ke(O[z], m, y, D);
      r(g.anchor, m, y);
      return;
    }
    if ($ === Qr) {
      F(g, m, y);
      return;
    }
    if (D !== 2 && T & 1 && B)
      if (D === 0)
        B.beforeEnter(S), r(S, m, y), gt(() => B.enter(S), C);
      else {
        const { leave: z, delayLeave: W, afterLeave: ne } = B, le = () => {
          g.ctx.isUnmounted ? u(S) : r(S, m, y);
        }, me = () => {
          z(S, () => {
            le(), ne && ne();
          });
        };
        W ? W(S, le, me) : me();
      }
    else
      r(S, m, y);
  }, Ee = (g, m, y, D = !1, C = !1) => {
    const {
      type: S,
      props: $,
      ref: B,
      children: O,
      dynamicChildren: T,
      shapeFlag: X,
      patchFlag: z,
      dirs: W,
      cacheIndex: ne
    } = g;
    if (z === -2 && (C = !1), B != null && (pn(), au(B, null, y, g, !0), gn()), ne != null && (m.renderCache[ne] = void 0), X & 256) {
      m.ctx.deactivate(g);
      return;
    }
    const le = X & 1 && W, me = !Kn(g);
    let be;
    if (me && (be = $ && $.onVnodeBeforeUnmount) && Lt(be, m, g), X & 6)
      zu(g.component, y, D);
    else {
      if (X & 128) {
        g.suspense.unmount(y, D);
        return;
      }
      le && vn(g, null, m, "beforeUnmount"), X & 64 ? g.type.remove(
        g,
        m,
        y,
        It,
        D
      ) : T && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !T.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (S !== Fe || z > 0 && z & 64) ? _n(
        T,
        m,
        y,
        !1,
        !0
      ) : (S === Fe && z & 384 || !C && X & 16) && _n(O, m, y), D && xt(g);
    }
    (me && (be = $ && $.onVnodeUnmounted) || le) && gt(() => {
      be && Lt(be, m, g), le && vn(g, null, m, "unmounted");
    }, y);
  }, xt = (g) => {
    const { type: m, el: y, anchor: D, transition: C } = g;
    if (m === Fe) {
      $u(y, D);
      return;
    }
    if (m === Qr) {
      E(g);
      return;
    }
    const S = () => {
      u(y), C && !C.persisted && C.afterLeave && C.afterLeave();
    };
    if (g.shapeFlag & 1 && C && !C.persisted) {
      const { leave: $, delayLeave: B } = C, O = () => $(y, S);
      B ? B(g.el, S, O) : O();
    } else
      S();
  }, $u = (g, m) => {
    let y;
    for (; g !== m; )
      y = h(g), u(g), g = y;
    u(m);
  }, zu = (g, m, y) => {
    const {
      bum: D,
      scope: C,
      job: S,
      subTree: $,
      um: B,
      m: O,
      a: T,
      parent: X,
      slots: { __: z }
    } = g;
    zi(O), zi(T), D && Xr(D), X && ie(z) && z.forEach((W) => {
      X.renderCache[W] = void 0;
    }), C.stop(), S && (S.flags |= 8, Ee($, g, m, y)), B && gt(B, m), gt(() => {
      g.isUnmounted = !0;
    }, m), m && m.pendingBranch && !m.isUnmounted && g.asyncDep && !g.asyncResolved && g.suspenseId === m.pendingId && (m.deps--, m.deps === 0 && m.resolve());
  }, _n = (g, m, y, D = !1, C = !1, S = 0) => {
    for (let $ = S; $ < g.length; $++)
      Ee(g[$], m, y, D, C);
  }, Rn = (g) => {
    if (g.shapeFlag & 6)
      return Rn(g.component.subTree);
    if (g.shapeFlag & 128)
      return g.suspense.next();
    const m = h(g.anchor || g.el), y = m && m[x0];
    return y ? h(y) : m;
  };
  let rr = !1;
  const Uu = (g, m, y) => {
    g == null ? m._vnode && Ee(m._vnode, null, null, !0) : _(
      m._vnode || null,
      g,
      m,
      null,
      null,
      null,
      y
    ), m._vnode = g, rr || (rr = !0, Oi(), xa(), rr = !1);
  }, It = {
    p: _,
    um: Ee,
    m: ke,
    r: xt,
    mt: oe,
    mc: K,
    pc: fe,
    pbc: ee,
    n: Rn,
    o: e
  };
  return {
    render: Uu,
    hydrate: void 0,
    createApp: N0(Uu)
  };
}
function to({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function wn({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function q0(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Na(e, t, n = !1) {
  const r = e.children, u = t.children;
  if (ie(r) && ie(u))
    for (let o = 0; o < r.length; o++) {
      const i = r[o];
      let s = u[o];
      s.shapeFlag & 1 && !s.dynamicChildren && ((s.patchFlag <= 0 || s.patchFlag === 32) && (s = u[o] = cn(u[o]), s.el = i.el), !n && s.patchFlag !== -2 && Na(i, s)), s.type === Tu && (s.el = i.el), s.type === jt && !s.el && (s.el = i.el);
    }
}
function G0(e) {
  const t = e.slice(), n = [0];
  let r, u, o, i, s;
  const a = e.length;
  for (r = 0; r < a; r++) {
    const c = e[r];
    if (c !== 0) {
      if (u = n[n.length - 1], e[u] < c) {
        t[r] = u, n.push(r);
        continue;
      }
      for (o = 0, i = n.length - 1; o < i; )
        s = o + i >> 1, e[n[s]] < c ? o = s + 1 : i = s;
      c < e[n[o]] && (o > 0 && (t[r] = n[o - 1]), n[o] = r);
    }
  }
  for (o = n.length, i = n[o - 1]; o-- > 0; )
    n[o] = i, i = t[i];
  return n;
}
function Oa(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Oa(t);
}
function zi(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const V0 = Symbol.for("v-scx"), K0 = () => Yo(V0);
function W0(e, t) {
  return La(
    e,
    null,
    { flush: "sync" }
  );
}
function Ct(e, t, n) {
  return La(e, t, n);
}
function La(e, t, n = xe) {
  const { immediate: r, deep: u, flush: o, once: i } = n, s = Xe({}, n), a = t && r || !t && o !== "post";
  let c;
  if (wr) {
    if (o === "sync") {
      const f = K0();
      c = f.__watcherHandles || (f.__watcherHandles = []);
    } else if (!a) {
      const f = () => {
      };
      return f.stop = An, f.resume = An, f.pause = An, f;
    }
  }
  const l = ut;
  s.call = (f, p, _) => Ht(f, l, p, _);
  let d = !1;
  o === "post" ? s.scheduler = (f) => {
    gt(f, l && l.suspense);
  } : o !== "sync" && (d = !0, s.scheduler = (f, p) => {
    p ? f() : Zo(f);
  }), s.augmentJob = (f) => {
    t && (f.flags |= 4), d && (f.flags |= 2, l && (f.id = l.uid, f.i = l));
  };
  const h = p0(e, t, s);
  return wr && (c ? c.push(h) : a && h()), h;
}
function Z0(e, t, n = xe) {
  const r = Ha(), u = ot(t), o = dt(t), i = Ba(e, u), s = s0((a, c) => {
    let l, d = xe, h;
    return W0(() => {
      const f = e[u];
      lt(l, f) && (l = f, c());
    }), {
      get() {
        return a(), n.get ? n.get(l) : l;
      },
      set(f) {
        const p = n.set ? n.set(f) : f;
        if (!lt(p, l) && !(d !== xe && lt(f, d)))
          return;
        const _ = r.vnode.props;
        _ && // check if parent has passed v-model
        (t in _ || u in _ || o in _) && (`onUpdate:${t}` in _ || `onUpdate:${u}` in _ || `onUpdate:${o}` in _) || (l = f, c()), r.emit(`update:${t}`, p), lt(f, p) && lt(f, d) && !lt(p, h) && c(), d = f, h = p;
      }
    };
  });
  return s[Symbol.iterator] = () => {
    let a = 0;
    return {
      next() {
        return a < 2 ? { value: a++ ? i || xe : s, done: !1 } : { done: !0 };
      }
    };
  }, s;
}
const Ba = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${ot(t)}Modifiers`] || e[`${dt(t)}Modifiers`];
function J0(e, t, ...n) {
  if (e.isUnmounted) return;
  const r = e.vnode.props || xe;
  let u = n;
  const o = t.startsWith("update:"), i = o && Ba(r, t.slice(7));
  i && (i.trim && (u = n.map((l) => ze(l) ? l.trim() : l)), i.number && (u = n.map(_o)));
  let s, a = r[s = Zu(t)] || // also try camelCase event handler (#2249)
  r[s = Zu(ot(t))];
  !a && o && (a = r[s = Zu(dt(t))]), a && Ht(
    a,
    e,
    6,
    u
  );
  const c = r[s + "Once"];
  if (c) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[s])
      return;
    e.emitted[s] = !0, Ht(
      c,
      e,
      6,
      u
    );
  }
}
function Y0(e, t, n = !1) {
  const r = t.emitsCache, u = r.get(e);
  if (u !== void 0)
    return u;
  const o = e.emits;
  let i = {};
  return o ? (ie(o) ? o.forEach((s) => i[s] = null) : Xe(i, o), Pe(e) && r.set(e, i), i) : (Pe(e) && r.set(e, null), null);
}
function Du(e, t) {
  return !e || !_u(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), _e(e, t[0].toLowerCase() + t.slice(1)) || _e(e, dt(t)) || _e(e, t));
}
function Ui(e) {
  const {
    type: t,
    vnode: n,
    proxy: r,
    withProxy: u,
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
  } = e, M = su(e);
  let A, k;
  try {
    if (n.shapeFlag & 4) {
      const E = u || r, x = E;
      A = $t(
        c.call(
          x,
          E,
          l,
          d,
          f,
          h,
          p
        )
      ), k = s;
    } else {
      const E = t;
      A = $t(
        E.length > 1 ? E(
          d,
          { attrs: s, slots: i, emit: a }
        ) : E(
          d,
          null
        )
      ), k = t.props ? s : X0(s);
    }
  } catch (E) {
    pr.length = 0, Au(E, e, 1), A = Y(jt);
  }
  let F = A;
  if (k && _ !== !1) {
    const E = Object.keys(k), { shapeFlag: x } = F;
    E.length && x & 7 && (o && E.some($o) && (k = Q0(
      k,
      o
    )), F = Mn(F, k, !1, !0));
  }
  return n.dirs && (F = Mn(F, null, !1, !0), F.dirs = F.dirs ? F.dirs.concat(n.dirs) : n.dirs), n.transition && yr(F, n.transition), A = F, su(M), A;
}
const X0 = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || _u(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Q0 = (e, t) => {
  const n = {};
  for (const r in e)
    (!$o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
  return n;
};
function ed(e, t, n) {
  const { props: r, children: u, component: o } = e, { props: i, children: s, patchFlag: a } = t, c = o.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && a >= 0) {
    if (a & 1024)
      return !0;
    if (a & 16)
      return r ? Hi(r, i, c) : !!i;
    if (a & 8) {
      const l = t.dynamicProps;
      for (let d = 0; d < l.length; d++) {
        const h = l[d];
        if (i[h] !== r[h] && !Du(c, h))
          return !0;
      }
    }
  } else
    return (u || s) && (!s || !s.$stable) ? !0 : r === i ? !1 : r ? i ? Hi(r, i, c) : !0 : !!i;
  return !1;
}
function Hi(e, t, n) {
  const r = Object.keys(t);
  if (r.length !== Object.keys(e).length)
    return !0;
  for (let u = 0; u < r.length; u++) {
    const o = r[u];
    if (t[o] !== e[o] && !Du(n, o))
      return !0;
  }
  return !1;
}
function td({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.el = e.el), r === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const Pa = (e) => e.__isSuspense;
function nd(e, t) {
  t && t.pendingBranch ? ie(e) ? t.effects.push(...e) : t.effects.push(e) : m0(e);
}
const Fe = Symbol.for("v-fgt"), Tu = Symbol.for("v-txt"), jt = Symbol.for("v-cmt"), Qr = Symbol.for("v-stc"), pr = [];
let bt = null;
function R(e = !1) {
  pr.push(bt = e ? null : []);
}
function rd() {
  pr.pop(), bt = pr[pr.length - 1] || null;
}
let vr = 1;
function ji(e, t = !1) {
  vr += e, e < 0 && bt && t && (bt.hasOnce = !0);
}
function $a(e) {
  return e.dynamicChildren = vr > 0 ? bt || qn : null, rd(), vr > 0 && bt && bt.push(e), e;
}
function H(e, t, n, r, u, o) {
  return $a(
    V(
      e,
      t,
      n,
      r,
      u,
      o,
      !0
    )
  );
}
function Ue(e, t, n, r, u) {
  return $a(
    Y(
      e,
      t,
      n,
      r,
      u,
      !0
    )
  );
}
function ei(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function $n(e, t) {
  return e.type === t.type && e.key === t.key;
}
const za = ({ key: e }) => e ?? null, eu = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ze(e) || Oe(e) || we(e) ? { i: Ge, r: e, k: t, f: !!n } : e : null);
function V(e, t = null, n = null, r = 0, u = null, o = e === Fe ? 0 : 1, i = !1, s = !1) {
  const a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && za(t),
    ref: t && eu(t),
    scopeId: va,
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
    patchFlag: r,
    dynamicProps: u,
    dynamicChildren: null,
    appContext: null,
    ctx: Ge
  };
  return s ? (ni(a, n), o & 128 && e.normalize(a)) : n && (a.shapeFlag |= ze(n) ? 8 : 16), vr > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  bt && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (a.patchFlag > 0 || o & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  a.patchFlag !== 32 && bt.push(a), a;
}
const Y = ud;
function ud(e, t = null, n = null, r = 0, u = null, o = !1) {
  if ((!e || e === ka) && (e = jt), ei(e)) {
    const s = Mn(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && ni(s, n), vr > 0 && !o && bt && (s.shapeFlag & 6 ? bt[bt.indexOf(e)] = s : bt.push(s)), s.patchFlag = -2, s;
  }
  if (pd(e) && (e = e.__vccOpts), t) {
    t = od(t);
    let { class: s, style: a } = t;
    s && !ze(s) && (t.class = Ft(s)), Pe(a) && (Wo(a) && !ie(a) && (a = Xe({}, a)), t.style = Uo(a));
  }
  const i = ze(e) ? 1 : Pa(e) ? 128 : y0(e) ? 64 : Pe(e) ? 4 : we(e) ? 2 : 0;
  return V(
    e,
    t,
    n,
    r,
    u,
    i,
    o,
    !0
  );
}
function od(e) {
  return e ? Wo(e) || Ta(e) ? Xe({}, e) : e : null;
}
function Mn(e, t, n = !1, r = !1) {
  const { props: u, ref: o, patchFlag: i, children: s, transition: a } = e, c = t ? Ua(u || {}, t) : u, l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: c,
    key: c && za(c),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && o ? ie(o) ? o.concat(eu(t)) : [o, eu(t)] : eu(t)
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
    ssContent: e.ssContent && Mn(e.ssContent),
    ssFallback: e.ssFallback && Mn(e.ssFallback),
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return a && r && yr(
    l,
    a.clone(l)
  ), l;
}
function Qn(e = " ", t = 0) {
  return Y(Tu, null, e, t);
}
function ti(e, t) {
  const n = Y(Qr, null, e);
  return n.staticCount = t, n;
}
function Se(e = "", t = !1) {
  return t ? (R(), Ue(jt, null, e)) : Y(jt, null, e);
}
function $t(e) {
  return e == null || typeof e == "boolean" ? Y(jt) : ie(e) ? Y(
    Fe,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : ei(e) ? cn(e) : Y(Tu, null, String(e));
}
function cn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Mn(e);
}
function ni(e, t) {
  let n = 0;
  const { shapeFlag: r } = e;
  if (t == null)
    t = null;
  else if (ie(t))
    n = 16;
  else if (typeof t == "object")
    if (r & 65) {
      const u = t.default;
      u && (u._c && (u._d = !1), ni(e, u()), u._c && (u._d = !0));
      return;
    } else {
      n = 32;
      const u = t._;
      !u && !Ta(t) ? t._ctx = Ge : u === 3 && Ge && (Ge.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else we(t) ? (t = { default: t, _ctx: Ge }, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Qn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Ua(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    for (const u in r)
      if (u === "class")
        t.class !== r.class && (t.class = Ft([t.class, r.class]));
      else if (u === "style")
        t.style = Uo([t.style, r.style]);
      else if (_u(u)) {
        const o = t[u], i = r[u];
        i && o !== i && !(ie(o) && o.includes(i)) && (t[u] = o ? [].concat(o, i) : i);
      } else u !== "" && (t[u] = r[u]);
  }
  return t;
}
function Lt(e, t, n, r = null) {
  Ht(e, t, 7, [
    n,
    r
  ]);
}
const id = Ca();
let sd = 0;
function ad(e, t, n) {
  const r = e.type, u = (t ? t.appContext : e.appContext) || id, o = {
    uid: sd++,
    vnode: e,
    type: r,
    parent: t,
    appContext: u,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Js(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(u.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: P0(r, u),
    emitsOptions: Y0(r, u),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: xe,
    // inheritAttrs
    inheritAttrs: r.inheritAttrs,
    // state
    ctx: xe,
    data: xe,
    props: xe,
    attrs: xe,
    slots: xe,
    refs: xe,
    setupState: xe,
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
  return o.ctx = { _: o }, o.root = t ? t.root : o, o.emit = J0.bind(null, o), e.ce && e.ce(o), o;
}
let ut = null;
const Ha = () => ut || Ge;
let lu, Ao;
{
  const e = ku(), t = (n, r) => {
    let u;
    return (u = e[n]) || (u = e[n] = []), u.push(r), (o) => {
      u.length > 1 ? u.forEach((i) => i(o)) : u[0](o);
    };
  };
  lu = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ut = n
  ), Ao = t(
    "__VUE_SSR_SETTERS__",
    (n) => wr = n
  );
}
const ri = (e) => {
  const t = ut;
  return lu(e), e.scope.on(), () => {
    e.scope.off(), lu(t);
  };
}, qi = () => {
  ut && ut.scope.off(), lu(null);
};
function ja(e) {
  return e.vnode.shapeFlag & 4;
}
let wr = !1;
function cd(e, t = !1, n = !1) {
  t && Ao(t);
  const { props: r, children: u } = e.vnode, o = ja(e);
  L0(e, r, o, t), z0(e, u, n || t);
  const i = o ? ld(e, t) : void 0;
  return t && Ao(!1), i;
}
function ld(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, R0);
  const { setup: r } = n;
  if (r) {
    pn();
    const u = e.setupContext = r.length > 1 ? fd(e) : null, o = ri(e), i = Dr(
      r,
      e,
      0,
      [
        e.props,
        u
      ]
    ), s = qs(i);
    if (gn(), o(), (s || e.sp) && !Kn(e) && E0(e), s) {
      if (i.then(qi, qi), t)
        return i.then((a) => {
          Gi(e, a);
        }).catch((a) => {
          Au(a, e, 0);
        });
      e.asyncDep = i;
    } else
      Gi(e, i);
  } else
    qa(e);
}
function Gi(e, t, n) {
  we(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Pe(t) && (e.setupState = pa(t)), qa(e);
}
function qa(e, t, n) {
  const r = e.type;
  e.render || (e.render = r.render || An);
}
const dd = {
  get(e, t) {
    return rt(e, "get", ""), e[t];
  }
};
function fd(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, dd),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Mu(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(pa(ht(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in hr)
        return hr[n](e);
    },
    has(t, n) {
      return n in t || n in hr;
    }
  })) : e.proxy;
}
function hd(e, t = !0) {
  return we(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function pd(e) {
  return we(e) && "__vccOpts" in e;
}
const re = (e, t) => f0(e, t, wr), gd = "3.5.14";
/**
* @vue/runtime-dom v3.5.14
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let So;
const Vi = typeof window < "u" && window.trustedTypes;
if (Vi)
  try {
    So = /* @__PURE__ */ Vi.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Ga = So ? (e) => So.createHTML(e) : (e) => e, bd = "http://www.w3.org/2000/svg", md = "http://www.w3.org/1998/Math/MathML", Wt = typeof document < "u" ? document : null, Ki = Wt && /* @__PURE__ */ Wt.createElement("template"), _d = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, r) => {
    const u = t === "svg" ? Wt.createElementNS(bd, e) : t === "mathml" ? Wt.createElementNS(md, e) : n ? Wt.createElement(e, { is: n }) : Wt.createElement(e);
    return e === "select" && r && r.multiple != null && u.setAttribute("multiple", r.multiple), u;
  },
  createText: (e) => Wt.createTextNode(e),
  createComment: (e) => Wt.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Wt.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, r, u, o) {
    const i = n ? n.previousSibling : t.lastChild;
    if (u && (u === o || u.nextSibling))
      for (; t.insertBefore(u.cloneNode(!0), n), !(u === o || !(u = u.nextSibling)); )
        ;
    else {
      Ki.innerHTML = Ga(
        r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e
      );
      const s = Ki.content;
      if (r === "svg" || r === "mathml") {
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
}, un = "transition", sr = "animation", Zn = Symbol("_vtc"), Va = {
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
}, xd = /* @__PURE__ */ Xe(
  {},
  w0,
  Va
), kn = (e, t = []) => {
  ie(e) ? e.forEach((n) => n(...t)) : e && e(...t);
}, Wi = (e) => e ? ie(e) ? e.some((t) => t.length > 1) : e.length > 1 : !1;
function yd(e) {
  const t = {};
  for (const v in e)
    v in Va || (t[v] = e[v]);
  if (e.css === !1)
    return t;
  const {
    name: n = "v",
    type: r,
    duration: u,
    enterFromClass: o = `${n}-enter-from`,
    enterActiveClass: i = `${n}-enter-active`,
    enterToClass: s = `${n}-enter-to`,
    appearFromClass: a = o,
    appearActiveClass: c = i,
    appearToClass: l = s,
    leaveFromClass: d = `${n}-leave-from`,
    leaveActiveClass: h = `${n}-leave-active`,
    leaveToClass: f = `${n}-leave-to`
  } = e, p = vd(u), _ = p && p[0], M = p && p[1], {
    onBeforeEnter: A,
    onEnter: k,
    onEnterCancelled: F,
    onLeave: E,
    onLeaveCancelled: x,
    onBeforeAppear: L = A,
    onAppear: te = k,
    onAppearCancelled: K = F
  } = t, N = (v, j, oe, he) => {
    v._enterCancelled = he, on(v, j ? l : s), on(v, j ? c : i), oe && oe();
  }, ee = (v, j) => {
    v._isLeaving = !1, on(v, d), on(v, f), on(v, h), j && j();
  }, ce = (v) => (j, oe) => {
    const he = v ? te : k, Ne = () => N(j, v, oe);
    kn(he, [j, Ne]), Zi(() => {
      on(j, v ? a : o), Bt(j, v ? l : s), Wi(he) || Ji(j, r, _, Ne);
    });
  };
  return Xe(t, {
    onBeforeEnter(v) {
      kn(A, [v]), Bt(v, o), Bt(v, i);
    },
    onBeforeAppear(v) {
      kn(L, [v]), Bt(v, a), Bt(v, c);
    },
    onEnter: ce(!1),
    onAppear: ce(!0),
    onLeave(v, j) {
      v._isLeaving = !0;
      const oe = () => ee(v, j);
      Bt(v, d), v._enterCancelled ? (Bt(v, h), Do()) : (Do(), Bt(v, h)), Zi(() => {
        v._isLeaving && (on(v, d), Bt(v, f), Wi(E) || Ji(v, r, M, oe));
      }), kn(E, [v, oe]);
    },
    onEnterCancelled(v) {
      N(v, !1, void 0, !0), kn(F, [v]);
    },
    onAppearCancelled(v) {
      N(v, !0, void 0, !0), kn(K, [v]);
    },
    onLeaveCancelled(v) {
      ee(v), kn(x, [v]);
    }
  });
}
function vd(e) {
  if (e == null)
    return null;
  if (Pe(e))
    return [no(e.enter), no(e.leave)];
  {
    const t = no(e);
    return [t, t];
  }
}
function no(e) {
  return xo(e);
}
function Bt(e, t) {
  t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e[Zn] || (e[Zn] = /* @__PURE__ */ new Set())).add(t);
}
function on(e, t) {
  t.split(/\s+/).forEach((r) => r && e.classList.remove(r));
  const n = e[Zn];
  n && (n.delete(t), n.size || (e[Zn] = void 0));
}
function Zi(e) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e);
  });
}
let wd = 0;
function Ji(e, t, n, r) {
  const u = e._endId = ++wd, o = () => {
    u === e._endId && r();
  };
  if (n != null)
    return setTimeout(o, n);
  const { type: i, timeout: s, propCount: a } = Ka(e, t);
  if (!i)
    return r();
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
function Ka(e, t) {
  const n = window.getComputedStyle(e), r = (p) => (n[p] || "").split(", "), u = r(`${un}Delay`), o = r(`${un}Duration`), i = Yi(u, o), s = r(`${sr}Delay`), a = r(`${sr}Duration`), c = Yi(s, a);
  let l = null, d = 0, h = 0;
  t === un ? i > 0 && (l = un, d = i, h = o.length) : t === sr ? c > 0 && (l = sr, d = c, h = a.length) : (d = Math.max(i, c), l = d > 0 ? i > c ? un : sr : null, h = l ? l === un ? o.length : a.length : 0);
  const f = l === un && /\b(transform|all)(,|$)/.test(
    r(`${un}Property`).toString()
  );
  return {
    type: l,
    timeout: d,
    propCount: h,
    hasTransform: f
  };
}
function Yi(e, t) {
  for (; e.length < t.length; )
    e = e.concat(e);
  return Math.max(...t.map((n, r) => Xi(n) + Xi(e[r])));
}
function Xi(e) {
  return e === "auto" ? 0 : Number(e.slice(0, -1).replace(",", ".")) * 1e3;
}
function Do() {
  return document.body.offsetHeight;
}
function kd(e, t, n) {
  const r = e[Zn];
  r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Qi = Symbol("_vod"), Ed = Symbol("_vsh"), Cd = Symbol(""), Ad = /(^|;)\s*display\s*:/;
function Sd(e, t, n) {
  const r = e.style, u = ze(n);
  let o = !1;
  if (n && !u) {
    if (t)
      if (ze(t))
        for (const i of t.split(";")) {
          const s = i.slice(0, i.indexOf(":")).trim();
          n[s] == null && tu(r, s, "");
        }
      else
        for (const i in t)
          n[i] == null && tu(r, i, "");
    for (const i in n)
      i === "display" && (o = !0), tu(r, i, n[i]);
  } else if (u) {
    if (t !== n) {
      const i = r[Cd];
      i && (n += ";" + i), r.cssText = n, o = Ad.test(n);
    }
  } else t && e.removeAttribute("style");
  Qi in e && (e[Qi] = o ? r.display : "", e[Ed] && (r.display = "none"));
}
const es = /\s*!important$/;
function tu(e, t, n) {
  if (ie(n))
    n.forEach((r) => tu(e, t, r));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const r = Dd(e, t);
    es.test(n) ? e.setProperty(
      dt(r),
      n.replace(es, ""),
      "important"
    ) : e[r] = n;
  }
}
const ts = ["Webkit", "Moz", "ms"], ro = {};
function Dd(e, t) {
  const n = ro[t];
  if (n)
    return n;
  let r = ot(t);
  if (r !== "filter" && r in e)
    return ro[t] = r;
  r = wu(r);
  for (let u = 0; u < ts.length; u++) {
    const o = ts[u] + r;
    if (o in e)
      return ro[t] = o;
  }
  return t;
}
const ns = "http://www.w3.org/1999/xlink";
function rs(e, t, n, r, u, o = Ol(t)) {
  r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ns, t.slice(6, t.length)) : e.setAttributeNS(ns, t, n) : n == null || o && !Ks(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    o ? "" : en(n) ? String(n) : n
  );
}
function us(e, t, n, r, u) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Ga(n) : n);
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
    s === "boolean" ? n = Ks(n) : n == null && s === "string" ? (n = "", i = !0) : s === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  i && e.removeAttribute(u || t);
}
function zn(e, t, n, r) {
  e.addEventListener(t, n, r);
}
function Td(e, t, n, r) {
  e.removeEventListener(t, n, r);
}
const os = Symbol("_vei");
function Md(e, t, n, r, u = null) {
  const o = e[os] || (e[os] = {}), i = o[t];
  if (r && i)
    i.value = r;
  else {
    const [s, a] = Fd(t);
    if (r) {
      const c = o[t] = Nd(
        r,
        u
      );
      zn(e, s, c, a);
    } else i && (Td(e, s, i, a), o[t] = void 0);
  }
}
const is = /(?:Once|Passive|Capture)$/;
function Fd(e) {
  let t;
  if (is.test(e)) {
    t = {};
    let r;
    for (; r = e.match(is); )
      e = e.slice(0, e.length - r[0].length), t[r[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : dt(e.slice(2)), t];
}
let uo = 0;
const Rd = /* @__PURE__ */ Promise.resolve(), Id = () => uo || (Rd.then(() => uo = 0), uo = Date.now());
function Nd(e, t) {
  const n = (r) => {
    if (!r._vts)
      r._vts = Date.now();
    else if (r._vts <= n.attached)
      return;
    Ht(
      Od(r, n.value),
      t,
      5,
      [r]
    );
  };
  return n.value = e, n.attached = Id(), n;
}
function Od(e, t) {
  if (ie(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (r) => (u) => !u._stopped && r && r(u)
    );
  } else
    return t;
}
const ss = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Ld = (e, t, n, r, u, o) => {
  const i = u === "svg";
  t === "class" ? kd(e, r, i) : t === "style" ? Sd(e, n, r) : _u(t) ? $o(t) || Md(e, t, n, r, o) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Bd(e, t, r, i)) ? (us(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && rs(e, t, r, i, o, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !ze(r)) ? us(e, ot(t), r, o, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), rs(e, t, r, i));
};
function Bd(e, t, n, r) {
  if (r)
    return !!(t === "innerHTML" || t === "textContent" || t in e && ss(t) && we(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const u = e.tagName;
    if (u === "IMG" || u === "VIDEO" || u === "CANVAS" || u === "SOURCE")
      return !1;
  }
  return ss(t) && ze(n) ? !1 : t in e;
}
const as = {};
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Wa(e, t, n) {
  const r = /* @__PURE__ */ Ce(e, t);
  yu(r) && Xe(r, t);
  class u extends ui {
    constructor(i) {
      super(r, i, n);
    }
  }
  return u.def = r, u;
}
const Pd = typeof HTMLElement < "u" ? HTMLElement : class {
};
class ui extends Pd {
  constructor(t, n = {}, r = hs) {
    super(), this._def = t, this._props = n, this._createApp = r, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._ob = null, this.shadowRoot && r !== hs ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow({ mode: "open" }), this._root = this.shadowRoot) : this._root = this, this._def.__asyncLoader || this._resolveProps(this._def);
  }
  connectedCallback() {
    if (!this.isConnected) return;
    this.shadowRoot || this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && (t.parentNode || t.host); )
      if (t instanceof ui) {
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
    this._connected = !1, Qt(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null);
    });
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let r = 0; r < this.attributes.length; r++)
      this._setAttr(this.attributes[r].name);
    this._ob = new MutationObserver((r) => {
      for (const u of r)
        this._setAttr(u.attributeName);
    }), this._ob.observe(this, { attributes: !0 });
    const t = (r, u = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: o, styles: i } = r;
      let s;
      if (o && !ie(o))
        for (const a in o) {
          const c = o[a];
          (c === Number || c && c.type === Number) && (a in this._props && (this._props[a] = xo(this._props[a])), (s || (s = /* @__PURE__ */ Object.create(null)))[ot(a)] = !0);
        }
      this._numberProps = s, u && this._resolveProps(r), this.shadowRoot && this._applyStyles(i), this._mount(r);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then(
      (r) => t(this._def = r, !0)
    ) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const r in n)
        _e(this, r) || Object.defineProperty(this, r, {
          // unwrap ref to be consistent with public instance behavior
          get: () => q(n[r])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, r = ie(n) ? n : Object.keys(n || {});
    for (const u of Object.keys(this))
      u[0] !== "_" && r.includes(u) && this._setProp(u, this[u]);
    for (const u of r.map(ot))
      Object.defineProperty(this, u, {
        get() {
          return this._getProp(u);
        },
        set(o) {
          this._setProp(u, o, !0, !0);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let r = n ? this.getAttribute(t) : as;
    const u = ot(t);
    n && this._numberProps && this._numberProps[u] && (r = xo(r)), this._setProp(u, r, !1, !0);
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
  _setProp(t, n, r = !0, u = !1) {
    if (n !== this._props[t] && (n === as ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), u && this._instance && this._update(), r)) {
      const o = this._ob;
      o && o.disconnect(), n === !0 ? this.setAttribute(dt(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(dt(t), n + "") : n || this.removeAttribute(dt(t)), o && o.observe(this, { attributes: !0 });
    }
  }
  _update() {
    Xd(this._createVNode(), this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = Y(this._def, Xe(t, this._props));
    return this._instance || (n.ce = (r) => {
      this._instance = r, r.ce = this, r.isCE = !0;
      const u = (o, i) => {
        this.dispatchEvent(
          new CustomEvent(
            o,
            yu(i[0]) ? Xe({ detail: i }, i[0]) : { detail: i }
          )
        );
      };
      r.emit = (o, ...i) => {
        u(o, i), dt(o) !== o && u(dt(o), i);
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
    const r = this._nonce;
    for (let u = t.length - 1; u >= 0; u--) {
      const o = document.createElement("style");
      r && o.setAttribute("nonce", r), o.textContent = t[u], this.shadowRoot.prepend(o);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let n;
    for (; n = this.firstChild; ) {
      const r = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (t[r] || (t[r] = [])).push(n), this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = (this._teleportTarget || this).querySelectorAll("slot"), n = this._instance.type.__scopeId;
    for (let r = 0; r < t.length; r++) {
      const u = t[r], o = u.getAttribute("name") || "default", i = this._slots[o], s = u.parentNode;
      if (i)
        for (const a of i) {
          if (n && a.nodeType === 1) {
            const c = n + "-s", l = document.createTreeWalker(a, 1);
            a.setAttribute(c, "");
            let d;
            for (; d = l.nextNode(); )
              d.setAttribute(c, "");
          }
          s.insertBefore(a, u);
        }
      else
        for (; u.firstChild; ) s.insertBefore(u.firstChild, u);
      s.removeChild(u);
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
const Za = /* @__PURE__ */ new WeakMap(), Ja = /* @__PURE__ */ new WeakMap(), du = Symbol("_moveCb"), cs = Symbol("_enterCb"), $d = (e) => (delete e.props.mode, e), zd = /* @__PURE__ */ $d({
  name: "TransitionGroup",
  props: /* @__PURE__ */ Xe({}, xd, {
    tag: String,
    moveClass: String
  }),
  setup(e, { slots: t }) {
    const n = Ha(), r = v0();
    let u, o;
    return S0(() => {
      if (!u.length)
        return;
      const i = e.moveClass || `${e.name || "v"}-move`;
      if (!qd(
        u[0].el,
        n.vnode.el,
        i
      )) {
        u = [];
        return;
      }
      u.forEach(Ud), u.forEach(Hd);
      const s = u.filter(jd);
      Do(), s.forEach((a) => {
        const c = a.el, l = c.style;
        Bt(c, i), l.transform = l.webkitTransform = l.transitionDuration = "";
        const d = c[du] = (h) => {
          h && h.target !== c || (!h || /transform$/.test(h.propertyName)) && (c.removeEventListener("transitionend", d), c[du] = null, on(c, i));
        };
        c.addEventListener("transitionend", d);
      }), u = [];
    }), () => {
      const i = ge(e), s = yd(i);
      let a = i.tag || Fe;
      if (u = [], o)
        for (let c = 0; c < o.length; c++) {
          const l = o[c];
          l.el && l.el instanceof Element && (u.push(l), yr(
            l,
            ko(
              l,
              s,
              r,
              n
            )
          ), Za.set(
            l,
            l.el.getBoundingClientRect()
          ));
        }
      o = t.default ? wa(t.default()) : [];
      for (let c = 0; c < o.length; c++) {
        const l = o[c];
        l.key != null && yr(
          l,
          ko(l, s, r, n)
        );
      }
      return Y(a, null, o);
    };
  }
}), Ya = zd;
function Ud(e) {
  const t = e.el;
  t[du] && t[du](), t[cs] && t[cs]();
}
function Hd(e) {
  Ja.set(e, e.el.getBoundingClientRect());
}
function jd(e) {
  const t = Za.get(e), n = Ja.get(e), r = t.left - n.left, u = t.top - n.top;
  if (r || u) {
    const o = e.el.style;
    return o.transform = o.webkitTransform = `translate(${r}px,${u}px)`, o.transitionDuration = "0s", e;
  }
}
function qd(e, t, n) {
  const r = e.cloneNode(), u = e[Zn];
  u && u.forEach((s) => {
    s.split(/\s+/).forEach((a) => a && r.classList.remove(a));
  }), n.split(/\s+/).forEach((s) => s && r.classList.add(s)), r.style.display = "none";
  const o = t.nodeType === 1 ? t : t.parentNode;
  o.appendChild(r);
  const { hasTransform: i } = Ka(r);
  return o.removeChild(r), i;
}
const ls = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return ie(t) ? (n) => Xr(t, n) : t;
};
function Gd(e) {
  e.target.composing = !0;
}
function ds(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const oo = Symbol("_assign"), Vd = {
  created(e, { modifiers: { lazy: t, trim: n, number: r } }, u) {
    e[oo] = ls(u);
    const o = r || u.props && u.props.type === "number";
    zn(e, t ? "change" : "input", (i) => {
      if (i.target.composing) return;
      let s = e.value;
      n && (s = s.trim()), o && (s = _o(s)), e[oo](s);
    }), n && zn(e, "change", () => {
      e.value = e.value.trim();
    }), t || (zn(e, "compositionstart", Gd), zn(e, "compositionend", ds), zn(e, "change", ds));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: u, number: o } }, i) {
    if (e[oo] = ls(i), e.composing) return;
    const s = (o || e.type === "number") && !/^0\d/.test(e.value) ? _o(e.value) : e.value, a = t ?? "";
    s !== a && (document.activeElement === e && e.type !== "range" && (r && t === n || u && e.value.trim() === a) || (e.value = a));
  }
}, Kd = ["ctrl", "shift", "alt", "meta"], Wd = {
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
  exact: (e, t) => Kd.some((n) => e[`${n}Key`] && !t.includes(n))
}, Tr = (e, t) => {
  const n = e._withMods || (e._withMods = {}), r = t.join(".");
  return n[r] || (n[r] = (u, ...o) => {
    for (let i = 0; i < t.length; i++) {
      const s = Wd[t[i]];
      if (s && s(u, t)) return;
    }
    return e(u, ...o);
  });
}, Zd = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Jd = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), r = t.join(".");
  return n[r] || (n[r] = (u) => {
    if (!("key" in u))
      return;
    const o = dt(u.key);
    if (t.some(
      (i) => i === o || Zd[i] === o
    ))
      return e(u);
  });
}, Yd = /* @__PURE__ */ Xe({ patchProp: Ld }, _d);
let fs;
function Xa() {
  return fs || (fs = H0(Yd));
}
const Xd = (...e) => {
  Xa().render(...e);
}, hs = (...e) => {
  const t = Xa().createApp(...e), { mount: n } = t;
  return t.mount = (r) => {
    const u = ef(r);
    if (!u) return;
    const o = t._component;
    !we(o) && !o.render && !o.template && (o.template = u.innerHTML), u.nodeType === 1 && (u.textContent = "");
    const i = n(u, !1, Qd(u));
    return u instanceof Element && (u.removeAttribute("v-cloak"), u.setAttribute("data-v-app", "")), i;
  }, t;
};
function Qd(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function ef(e) {
  return ze(e) ? document.querySelector(e) : e;
}
/*!
 * pinia v3.0.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let Qa;
const Mr = (e) => Qa = e, ec = (
  /* istanbul ignore next */
  Symbol()
);
function To(e) {
  return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var gr;
(function(e) {
  e.direct = "direct", e.patchObject = "patch object", e.patchFunction = "patch function";
})(gr || (gr = {}));
function tf() {
  const e = Ys(!0), t = e.run(() => ye({}));
  let n = [], r = [];
  const u = ht({
    install(o) {
      Mr(u), u._a = o, o.provide(ec, u), o.config.globalProperties.$pinia = u, r.forEach((i) => n.push(i)), r = [];
    },
    use(o) {
      return this._a ? n.push(o) : r.push(o), this;
    },
    _p: n,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: e,
    _s: /* @__PURE__ */ new Map(),
    state: t
  });
  return u;
}
const tc = () => {
};
function ps(e, t, n, r = tc) {
  e.push(t);
  const u = () => {
    const o = e.indexOf(t);
    o > -1 && (e.splice(o, 1), r());
  };
  return !n && Xs() && Ll(u), u;
}
function Ln(e, ...t) {
  e.slice().forEach((n) => {
    n(...t);
  });
}
const nf = (e) => e(), gs = Symbol(), io = Symbol();
function Mo(e, t) {
  e instanceof Map && t instanceof Map ? t.forEach((n, r) => e.set(r, n)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
  for (const n in t) {
    if (!t.hasOwnProperty(n))
      continue;
    const r = t[n], u = e[n];
    To(u) && To(r) && e.hasOwnProperty(n) && !Oe(r) && !Xt(r) ? e[n] = Mo(u, r) : e[n] = r;
  }
  return e;
}
const rf = (
  /* istanbul ignore next */
  Symbol()
);
function uf(e) {
  return !To(e) || !Object.prototype.hasOwnProperty.call(e, rf);
}
const { assign: sn } = Object;
function of(e) {
  return !!(Oe(e) && e.effect);
}
function sf(e, t, n, r) {
  const { state: u, actions: o, getters: i } = t, s = n.state.value[e];
  let a;
  function c() {
    s || (n.state.value[e] = u ? u() : {});
    const l = a0(n.state.value[e]);
    return sn(l, o, Object.keys(i || {}).reduce((d, h) => (d[h] = ht(re(() => {
      Mr(n);
      const f = n._s.get(e);
      return i[h].call(f, f);
    })), d), {}));
  }
  return a = nc(e, c, t, n, r, !0), a;
}
function nc(e, t, n = {}, r, u, o) {
  let i;
  const s = sn({ actions: {} }, n), a = { deep: !0 };
  let c, l, d = [], h = [], f;
  const p = r.state.value[e];
  !o && !p && (r.state.value[e] = {}), ye({});
  let _;
  function M(K) {
    let N;
    c = l = !1, typeof K == "function" ? (K(r.state.value[e]), N = {
      type: gr.patchFunction,
      storeId: e,
      events: f
    }) : (Mo(r.state.value[e], K), N = {
      type: gr.patchObject,
      payload: K,
      storeId: e,
      events: f
    });
    const ee = _ = Symbol();
    Qt().then(() => {
      _ === ee && (c = !0);
    }), l = !0, Ln(d, N, r.state.value[e]);
  }
  const A = o ? function() {
    const { state: N } = n, ee = N ? N() : {};
    this.$patch((ce) => {
      sn(ce, ee);
    });
  } : (
    /* istanbul ignore next */
    tc
  );
  function k() {
    i.stop(), d = [], h = [], r._s.delete(e);
  }
  const F = (K, N = "") => {
    if (gs in K)
      return K[io] = N, K;
    const ee = function() {
      Mr(r);
      const ce = Array.from(arguments), v = [], j = [];
      function oe(Ie) {
        v.push(Ie);
      }
      function he(Ie) {
        j.push(Ie);
      }
      Ln(h, {
        args: ce,
        name: ee[io],
        store: x,
        after: oe,
        onError: he
      });
      let Ne;
      try {
        Ne = K.apply(this && this.$id === e ? this : x, ce);
      } catch (Ie) {
        throw Ln(j, Ie), Ie;
      }
      return Ne instanceof Promise ? Ne.then((Ie) => (Ln(v, Ie), Ie)).catch((Ie) => (Ln(j, Ie), Promise.reject(Ie))) : (Ln(v, Ne), Ne);
    };
    return ee[gs] = !0, ee[io] = N, ee;
  }, E = {
    _p: r,
    // _s: scope,
    $id: e,
    $onAction: ps.bind(null, h),
    $patch: M,
    $reset: A,
    $subscribe(K, N = {}) {
      const ee = ps(d, K, N.detached, () => ce()), ce = i.run(() => Ct(() => r.state.value[e], (v) => {
        (N.flush === "sync" ? l : c) && K({
          storeId: e,
          type: gr.direct,
          events: f
        }, v);
      }, sn({}, a, N)));
      return ee;
    },
    $dispose: k
  }, x = Vo(E);
  r._s.set(e, x);
  const te = (r._a && r._a.runWithContext || nf)(() => r._e.run(() => (i = Ys()).run(() => t({ action: F }))));
  for (const K in te) {
    const N = te[K];
    if (Oe(N) && !of(N) || Xt(N))
      o || (p && uf(N) && (Oe(N) ? N.value = p[K] : Mo(N, p[K])), r.state.value[e][K] = N);
    else if (typeof N == "function") {
      const ee = F(N, K);
      te[K] = ee, s.actions[K] = N;
    }
  }
  return sn(x, te), sn(ge(x), te), Object.defineProperty(x, "$state", {
    get: () => r.state.value[e],
    set: (K) => {
      M((N) => {
        sn(N, K);
      });
    }
  }), r._p.forEach((K) => {
    sn(x, i.run(() => K({
      store: x,
      app: r._a,
      pinia: r,
      options: s
    })));
  }), p && o && n.hydrate && n.hydrate(x.$state, p), c = !0, l = !0, x;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function oi(e, t, n) {
  let r;
  const u = typeof t == "function";
  r = u ? n : t;
  function o(i, s) {
    const a = O0();
    return i = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    i || (a ? Yo(ec, null) : null), i && Mr(i), i = Qa, i._s.has(e) || (u ? nc(e, t, r, i) : sf(e, r, i)), i._s.get(e);
  }
  return o.$id = e, o;
}
function At(e) {
  const t = ge(e), n = {};
  for (const r in t) {
    const u = t[r];
    u.effect ? n[r] = // ...
    re({
      get: () => e[r],
      set(o) {
        e[r] = o;
      }
    }) : (Oe(u) || Xt(u)) && (n[r] = // ---
    ga(e, r));
  }
  return n;
}
const rc = tf();
Mr(rc);
function af(e) {
  e.use(rc);
}
function uc(e) {
  af(e);
}
const hn = {
  LIGHT: "light",
  DARK: "dark"
}, ii = "appmixer-chat-theme";
function oc(e) {
  return Object.values(hn).includes(e);
}
function cf() {
  const e = localStorage.getItem(ii);
  return e && oc(e) ? e : null;
}
const er = {
  DIALOG: "dialog",
  FULLSCREEN: "fullscreen"
}, ic = /* @__PURE__ */ oi("widgetConfig", () => {
  const e = ye(cf() ?? hn.LIGHT), t = ye(er.FULLSCREEN), n = ye(null), r = ye(0);
  function u(c) {
    e.value = c;
  }
  function o(c) {
    t.value = c;
  }
  function i(c) {
    n.value = c;
  }
  function s() {
    n.value = null;
  }
  function a(c) {
    r.value = c;
  }
  return Ct(e, (c) => {
    localStorage.setItem(ii, c);
  }), {
    theme: e,
    widgetMode: t,
    jwt: n,
    maxFileSize: r,
    setTheme: u,
    setWidgetMode: o,
    setJwt: i,
    clearJwt: s,
    setMaxFileSize: a
  };
});
function sc(e) {
  const t = ic(), n = re(() => t.theme);
  Ct(n, () => {
    var i;
    (i = e.value) == null || i.setAttribute("data-theme", n.value);
  }, { immediate: !0 });
  const u = (i) => {
    i.key === ii && i.newValue && oc(i.newValue) && t.setTheme(i.newValue);
  };
  Fn(() => {
    window.addEventListener("storage", u);
  }), Jo(() => {
    window.removeEventListener("storage", u);
  });
  function o() {
    const i = n.value === hn.LIGHT ? hn.DARK : hn.LIGHT;
    t.setTheme(i);
  }
  return {
    themeMode: n,
    toggle: o
  };
}
const mt = {
  AGENT: "agent",
  USER: "user"
}, Jn = {
  IDLE: "idle"
};
Jn.IDLE + "";
const Fu = {
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right"
}, lf = {
  viewBox: "0 0 18 18",
  width: "1.2em",
  height: "1.2em"
}, df = { fill: "none" }, ff = ["clip-path"], hf = ["id"];
function pf(e, t) {
  return R(), H("svg", lf, [
    V("g", df, [
      V("g", {
        "clip-path": "url(#" + e.idMap.clip0_4058_1987 + ")"
      }, t[0] || (t[0] = [
        ti('<path d="M9 4.5V1.5H6" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 13.5L15 16.5V6C15 5.60218 14.842 5.22064 14.5607 4.93934C14.2794 4.65804 13.8978 4.5 13.5 4.5H4.5C4.10218 4.5 3.72064 4.65804 3.43934 4.93934C3.15804 5.22064 3 5.60218 3 6V12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H12Z" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.5 9H15" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.25 8.25V9.75" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.75 8.25V9.75" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 9H1.5" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"></path>', 6)
      ]), 8, ff),
      V("defs", null, [
        V("clipPath", {
          id: e.idMap.clip0_4058_1987
        }, t[1] || (t[1] = [
          V("rect", {
            width: "18",
            height: "18",
            fill: "white",
            transform: "matrix(-1 0 0 1 18 0)"
          }, null, -1)
        ]), 8, hf)
      ])
    ])
  ]);
}
const si = ht({ name: "icons-chatbot-avatar", render: pf, setup() {
  return { idMap: { clip0_4058_1987: "uicons-" + Math.random().toString(36).substr(2, 10) } };
} }), gf = ["data-widget-position", "aria-label", "data-theme"], bf = /* @__PURE__ */ Ce({
  name: "AmChatLauncher",
  inheritAttrs: !1,
  __name: "ChatLauncher.ce",
  emits: ["open"],
  setup(e, { emit: t }) {
    const n = t, r = re(() => i.value === hn.LIGHT ? "Go to dark mode" : "Go to light mode");
    function u() {
      n("open");
    }
    const o = ye(null), { themeMode: i, toggle: s } = sc(o);
    return Aa("theme", { themeMode: i, toggle: s }), (a, c) => (R(), H("button", {
      ref_key: "widgetLauncher",
      ref: o,
      class: "am-chat-launcher",
      "data-widget-position": q(Fu).BOTTOM_RIGHT,
      "aria-label": r.value,
      "data-theme": q(i),
      onClick: u
    }, [
      Y(q(si), { class: "am-chat-launcher__icon" })
    ], 8, gf));
  }
}), mf = ".am-chat-launcher{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--flash-error-bg: hsl(5, 50%, 95%);--flash-error-border: hsl(3, 49%, 53%);--flash-info-bg: hsl(205, 60%, 95%);--flash-info-border: hsl(205, 55%, 55%);--flash-success-bg: hsl(125, 50%, 92%);--flash-success-border: hsl(125, 45%, 45%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 80%, 53%);--bg-primary-btn-disabled: hsl(223, 92%, 76%);--text-side-header: hsl(227, 6%, 53%);--text-side: hsl(232, 16%, 27%);--text-side-active: hsl(232, 16%, 27%);--text-side-bg-active: hsl(210, 6%, 86%);--text-thread: hsl(232, 16%, 27%);--bg-thread: hsl(0, 0%, 98%);--bg-side: hsl(240, 14%, 97%);--border-side: hsl(240, 3%, 88%);--color-secondary-btn: hsl(232, 16%, 27%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(240, 6%, 87%);--bg-input-panel: hsl(0, 0%, 100%);--text-input-panel: hsl(233, 7%, 47%);--text-header: hsl(230, 29%, 17%);--border-header: hsl(240, 3%, 88%);--color-chat-avatar-icon: hsl(231, 12%, 34%);--bg-chat-avatar-icon: hsl(210, 6%, 94%);--border-chat-avatar-icon: hsl(228, 6%, 83%);--color-message: hsl(232, 16%, 27%);--bg-message-user: hsl(210, 6%, 94%);--border-input: hsl(240, 5.9%, 90%);--border-input-hover: hsl(240, 6.1%, 87.1%);--color-tertiary-btn: hsl(233, 7%, 47%);--bg-tertiary-btn: hsl(0, 0%, 98%);--border-tertiary-btn: hsl(240, 3%, 88%);--bg-tertiary-hover-btn: hsl(0, 0%, 96%);--bg-tertiary-active-btn: hsl(0, 0%, 94%);--border-tertiary-hover-btn: hsl(240, 3%, 80%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 93.3%);--skeleton-highlight: hsla(0, 0%, 100%, .6);--bg-table-header: hsl(210, 6%, 94%);--code-bg: hsl(0, 0%, 93.3%);--code-color: hsl(0, 0%, 20%);position:fixed;right:1.75rem;bottom:1.75rem;display:flex;justify-content:center;align-items:center;width:3rem;height:3rem;border:none;border-radius:50%;background-color:var(--bg-launcher-btn);box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;color:var(--color-launcher-btn);transition:background-color .2s ease;cursor:pointer}.am-chat-launcher[data-theme=dark]{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--flash-error-bg: hsl(5, 50%, 95%);--flash-error-border: hsl(3, 49%, 53%);--flash-info-bg: hsl(205, 60%, 95%);--flash-info-border: hsl(205, 55%, 55%);--flash-success-bg: hsl(125, 50%, 92%);--flash-success-border: hsl(125, 45%, 45%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 80%, 53%);--bg-primary-btn-disabled: hsl(223, 92%, 76%);--text-side-header: hsl(0, 0%, 63%);--text-side: hsl(0, 0%, 90%);--text-side-active: hsl(0, 0%, 90%);--text-side-bg-active: hsl(0, 0%, 14%);--text-thread: hsl(0, 0%, 90%);--bg-thread: hsl(0, 0%, 18%);--bg-side: hsl(240, 4%, 17%);--border-side: hsl(0, 0%, 30%);--color-secondary-btn: hsl(0, 0%, 90%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(0, 0%, 26%);--bg-input-panel: hsl(0, 0%, 16%);--text-input-panel: hsl(0, 0%, 70%);--text-header: hsl(0, 0%, 100%);--border-header: hsl(0, 0%, 30%);--color-chat-avatar-icon: hsl(0, 0%, 76%);--bg-chat-avatar-icon: hsl(0, 0%, 23%);--border-chat-avatar-icon: hsl(0, 0%, 33%);--color-message: hsl(0, 0%, 90%);--bg-message-user: hsl(0, 0%, 23%);--border-input: hsl(0, 0%, 27%);--border-input-hover: hsl(0, 0%, 30%);--color-tertiary-btn: hsl(0, 0%, 70%);--bg-tertiary-btn: hsl(0, 0%, 18%);--border-tertiary-btn: hsl(0, 0%, 30%);--bg-tertiary-hover-btn: hsl(0, 0%, 16%);--bg-tertiary-active-btn: hsl(0, 0%, 14%);--border-tertiary-hover-btn: hsl(0, 0%, 20%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 16.5%);--skeleton-highlight: hsla(0, 0%, 100%, .1);--bg-table-header: hsl(0, 0%, 23%);--code-bg: hsl(0, 0%, 26.5%);--code-color: hsl(0, 0%, 90%)}.am-chat-launcher:hover{background-color:var(--bg-launcher-btn-hover)}.am-chat-launcher__icon{width:1.5rem;height:1.5rem}.am-chat-launcher[data-widget-position=bottom-left]{right:auto;left:1.75rem}", Ae = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [r, u] of t)
    n[r] = u;
  return n;
}, _f = /* @__PURE__ */ Ae(bf, [["styles", [mf]]]), ai = /* @__PURE__ */ Wa(_f), xf = ai.prototype.connectedCallback;
ai.prototype.connectedCallback = function(...e) {
  xf.apply(this, ...e);
  const t = this._instance.appContext.app;
  t && uc(t);
};
customElements.get("am-chat-launcher") || customElements.define("am-chat-launcher", ai);
const so = {
  MESSAGE: "message",
  PROGRESS: "progress",
  DELTA: "delta"
}, ac = {
  ERROR: "error",
  INFO: "info"
}, Hn = {
  NO_CONSTRAINTS: "no-constraints",
  // nothing is restricted -> actually OK, but we return info
  MIME_MATCH: "mime-match",
  // passed due to MIME (OK)
  NO_MATCH: "no-match",
  // did not pass, general case
  UNKNOWN_MIME: "unknown-mime"
  // did not pass, empty/unknown MIME without allowed */*
}, yf = /* @__PURE__ */ new Set([
  "application",
  "audio",
  "example",
  "font",
  "image",
  "message",
  "model",
  "multipart",
  "text",
  "video"
]), vf = /^[a-z0-9!#$&^_-]+\/(\*|[a-z0-9!#$&^_.+-]+)$/i, bs = (e) => {
  const t = /* @__PURE__ */ new Set();
  return e.filter((n) => t.has(n) ? !1 : (t.add(n), !0));
};
function wf(e, t) {
  const n = e.trim().toLowerCase(), r = t.trim().toLowerCase();
  if (r === "*/*")
    return !0;
  if (r.endsWith("/*")) {
    const u = r.slice(0, r.indexOf("/"));
    return n.startsWith(`${u}/`);
  }
  return n === r;
}
function kf(e) {
  const t = e.trim().toLowerCase();
  if (t === "*/*")
    return !0;
  if (!vf.test(t))
    return !1;
  const [n] = t.split("/");
  return yf.has(n);
}
function Ef(e) {
  if (!Array.isArray(e))
    return { mime: [], invalid: ["<non-array>"] };
  const t = [], n = [];
  for (const r of e) {
    if (typeof r != "string") {
      n.push(String(r));
      continue;
    }
    const u = r.trim().toLowerCase();
    if (!u) {
      n.push(r);
      continue;
    }
    u.includes("/") && kf(u) ? t.push(u) : n.push(r);
  }
  return {
    mime: bs(t),
    invalid: bs(n)
  };
}
function Cf(e, t) {
  const n = e.name, r = (e.type || "").toLowerCase(), u = !!(t != null && t.length);
  if (!u)
    return { ok: !0, reason: Hn.NO_CONSTRAINTS, details: { mime: r, fileName: n } };
  const o = u ? r ? t.find((i) => wf(r, i)) : t.includes("*/*") ? "*/*" : void 0 : void 0;
  return o ? {
    ok: !0,
    reason: Hn.MIME_MATCH,
    details: { mime: r, fileName: n, matchedMimePattern: o }
  } : {
    ok: !1,
    reason: r ? Hn.NO_MATCH : Hn.UNKNOWN_MIME,
    details: {
      mime: r,
      fileName: n,
      expectedMimePatterns: t
    }
  };
}
function ms(e) {
  if (e == null || isNaN(e))
    return "Unknown size";
  const t = ["B", "KB", "MB", "GB", "TB"];
  let n = e, r = 0;
  for (; n >= 1024 && r < t.length - 1; )
    n /= 1024, r++;
  return `${n.toFixed(1)} ${t[r]}`;
}
function Af(e) {
  const t = [];
  return e != null && e.length && t.push(...e), t.length ? t.join(",") : void 0;
}
function Sf(e) {
  if (e.ok)
    return null;
  const { reason: t } = e;
  switch (t) {
    case Hn.UNKNOWN_MIME:
      return "Unknown file type (MIME).";
    case Hn.NO_MATCH:
      return "File type not allowed.";
    default:
      return "File type not allowed.";
  }
}
async function Df(e) {
  return {
    data: await Mf(e),
    name: e.name,
    type: e.type
  };
}
function Tf(e) {
  return {
    id: e.name + crypto.randomUUID(),
    name: e.name,
    size: e.size
  };
}
function Mf(e) {
  return new Promise((t, n) => {
    const r = new FileReader();
    r.readAsDataURL(e), r.onload = () => {
      const o = r.result.split(",")[1];
      t(o);
    }, r.onerror = (u) => n(u);
  });
}
let Fo = {
  apiBaseUrl: "https://api.qa.appmixer.com",
  endpoint: "",
  themeMode: hn.LIGHT,
  widgetMode: er.FULLSCREEN,
  widgetPosition: Fu.BOTTOM_RIGHT,
  jwt: void 0,
  allowedMimePatterns: [],
  maxFileSize: 50 * 1024 * 1024
  // Default max file size is 50 MB
};
function Yt() {
  return Fo;
}
function Ff(e) {
  const t = { ...Fo, ...e };
  if (e.allowedMimePatterns !== void 0) {
    const { mime: n, invalid: r } = Ef(e.allowedMimePatterns);
    t.allowedMimePatterns = n, r.length && console.warn("Invalid MIME types found:", r);
  }
  Fo = t;
}
class ar extends Error {
  constructor(n, r, u, o) {
    super(n);
    Hr(this, "detailMessage");
    Hr(this, "statusCode");
    Hr(this, "errorMessage");
    this.name = "ApiError", this.detailMessage = u, this.statusCode = r, this.errorMessage = o, Object.setPrototypeOf(this, new.target.prototype);
  }
}
const Tn = {
  SESSION_ID: "session_id",
  CHAT_TOKEN_URL_PARAM: "chat_token",
  CHAT_TOKEN: "appmixer-chat-token",
  X_CHAT_TOKEN: "x-appmixer-chat-token"
}, tr = {
  GET: "GET",
  POST: "POST"
};
let Ro, cc = !1;
function lc() {
  const e = Yt();
  return {
    endpoint: e.endpoint ?? "",
    apiBaseUrl: e.apiBaseUrl ?? "",
    widgetMode: e.widgetMode,
    jwt: e.jwt ?? ""
  };
}
function Rf() {
  const e = zf();
  return e ? { [Tn.X_CHAT_TOKEN]: e } : {};
}
function If(e) {
  try {
    return new URL(e), !0;
  } catch {
    return !1;
  }
}
function Nf(e, t, n) {
  const r = (e || "").replace(/\?.*$/, "").replace(/\/+$/, ""), u = new URL(t.replace(/^\/+/, ""), r);
  if (n)
    for (const [o, i] of Object.entries(n))
      u.searchParams.append(o, String(i));
  return u.toString();
}
function Of(e, t) {
  return e;
}
function dc(e) {
  var t;
  return ((t = e.headers.get("Content-Type")) == null ? void 0 : t.toLowerCase()) || "";
}
function fc(e) {
  return e.includes("application/json");
}
function Lf(e) {
  return e.includes("text/html");
}
function Bf(e, t = {}) {
  const n = { ...t };
  let r;
  return e == null ? { headers: n, body: void 0 } : (jf(e) ? r = e : (n["Content-Type"] = "application/json", r = JSON.stringify(e)), { headers: n, body: r });
}
async function Pf(e, t, n) {
  const r = await e.text().catch(() => ""), u = dc(e);
  let o = "", i = r, s = e.status;
  if (fc(u))
    try {
      const a = JSON.parse(r);
      o = a.message || "Unknown error", s = typeof a.statusCode == "number" ? a.statusCode : s, i = typeof a.error == "string" ? a.error : r;
    } catch {
      o = "Failed to parse error response or invalid JSON response";
    }
  else Lf(u) || r.trim().startsWith("<") ? o = "Server returned an HTML error page" : o = r || e.statusText || "Request failed";
  throw s === 504 && (o = "Gateway Time-out: The server didn't respond in time."), new ar(
    o,
    s,
    `API: ${t}: ${n} failed: ${e.status} | ${e.statusText}`,
    i
  );
}
async function $f(e) {
  if (e.status === 204)
    return;
  const t = dc(e);
  return fc(t) ? await e.json() : await e.text();
}
function zf() {
  if (cc)
    return Ro;
  const { widgetMode: e, endpoint: t, jwt: n } = lc();
  if (e !== er.DIALOG) {
    const r = new URLSearchParams(window.location.search).get(Tn.CHAT_TOKEN_URL_PARAM);
    if (r)
      return Kr(r);
  }
  if (t)
    try {
      const u = (If(t) ? new URL(t) : new URL(t, window.location.origin)).searchParams.get(Tn.CHAT_TOKEN_URL_PARAM);
      if (u)
        return Kr(u);
    } catch {
      console.warn("Not a valid endpoint for URL parsing:", t);
    }
  return Kr(n || sessionStorage.getItem(Tn.CHAT_TOKEN));
}
function Kr(e) {
  return Ro = e, cc = !0, e && sessionStorage.setItem(Tn.CHAT_TOKEN, e), Ro;
}
function Uf(e, t) {
  if (!t)
    return { signal: e };
  const n = new AbortController(), r = setTimeout(() => {
    n.abort();
  }, t);
  e && e.addEventListener("abort", () => n.abort(), { once: !0 });
  const u = () => clearTimeout(r);
  return { signal: n.signal, clear: u };
}
async function Fr(e, t) {
  const n = (typeof e == "string" ? t : e) ?? {}, r = typeof e == "string" ? e : "", { endpoint: u } = lc(), o = n.method ?? tr.GET, i = Nf(u, r, n.params), s = Of(i), a = { ...Rf(), ...n.headers ?? {} }, { headers: c, body: l } = Bf(n.body, a), { signal: d, clear: h } = Uf(n.signal, n.timeoutMs), f = await fetch(s, {
    method: o,
    headers: c,
    body: l,
    signal: d
  }).finally(() => {
    h && h();
  });
  return f.ok ? $f(f) : Pf(f, o, s);
}
function Hf(e) {
  return typeof FormData < "u" && e instanceof FormData;
}
function jf(e) {
  const t = typeof ReadableStream < "u", n = typeof File < "u";
  return typeof e == "string" || typeof Blob < "u" && e instanceof Blob || typeof URLSearchParams < "u" && e instanceof URLSearchParams || Hf(e) || typeof ArrayBuffer < "u" && e instanceof ArrayBuffer || t && e instanceof ReadableStream || n && e instanceof File;
}
const qf = (e) => Fr({
  method: tr.POST,
  params: {
    action: "ensure-session",
    session_id: e
  }
}), Gf = (e) => Fr({
  method: tr.GET,
  params: {
    action: "load-thread",
    thread_id: e
  }
}), Vf = (e, t, n, r, u) => Fr({
  method: tr.POST,
  params: {
    action: "send-message",
    session_id: e
  },
  body: {
    threadId: t,
    id: n,
    content: r,
    files: u
  }
}), Kf = (e, t) => Fr({
  method: tr.POST,
  params: {
    action: "delete-thread",
    session_id: e
  },
  body: {
    threadId: t
  }
}), Wf = (e, t, n) => Fr({
  method: tr.POST,
  params: {
    action: "add-thread"
  },
  body: {
    sessionId: e,
    agentId: t,
    theme: n
  }
});
function Io(e) {
  return {
    ...e
    //isEditing: false,
    //formattedTime: new Date(msg.timestamp).toLocaleTimeString(),
  };
}
function Zf(e) {
  return {
    ...e
  };
}
function hc(e) {
  const n = (Array.isArray(e.messages) ? e.messages : []).map(Io);
  return {
    ...e,
    messages: n
  };
}
function Jf(e) {
  const n = (Array.isArray(e.threads) ? e.threads : []).map(hc), u = (Array.isArray(e.agents) ? e.agents : []).map(Zf);
  return {
    ...e,
    threads: n,
    agents: u
  };
}
const br = "appmixer-chat-active-thread-ids", nu = "appmixer-chat-sessions";
function Rr() {
  return location.origin + location.pathname;
}
function ao() {
  const e = ci()[Rr()];
  return e !== null ? e : void 0;
}
function ci() {
  const e = sessionStorage.getItem(br);
  if (!e)
    return {};
  try {
    return JSON.parse(e);
  } catch (t) {
    return console.error(
      `getActiveThreadIds: Failed to parse sessionStorage key "${br}"`,
      t
    ), sessionStorage.removeItem(br), {};
  }
}
function Yf(e) {
  const t = Rr(), n = ci();
  e ? n[t] = e : delete n[t], sessionStorage.setItem(br, JSON.stringify(n));
}
function Xf() {
  const e = Rr(), t = ci();
  delete t[e], sessionStorage.setItem(br, JSON.stringify(t));
}
function Qf() {
  return pc()[Rr()] || null;
}
function pc() {
  const e = sessionStorage.getItem(nu);
  if (!e)
    return {};
  try {
    return JSON.parse(e);
  } catch (t) {
    return console.error(`getSessions: Failed to parse sessionStorage key "${nu}"`, t), sessionStorage.removeItem(nu), {};
  }
}
function eh(e) {
  const t = Rr(), n = pc();
  e ? n[t] = e : delete n[t], sessionStorage.setItem(nu, JSON.stringify(n));
}
function th() {
  if (Yt().widgetMode !== er.DIALOG) {
    const r = new URLSearchParams(window.location.search).get(Tn.SESSION_ID);
    if (r)
      return r;
  }
  const t = Yt().endpoint ?? "";
  try {
    const r = new URL(t, window.location.origin).searchParams.get(Tn.SESSION_ID);
    if (r)
      return r;
  } catch {
    console.warn("Not a valid endpoint for URL parsing:", t);
  }
  return Qf();
}
function nh() {
  return {
    init: async () => {
      const t = await qf(th() || ""), n = Jf(t);
      return eh(t.id), n;
    }
  };
}
function gc(e) {
  function t(c, l, d) {
    const h = n(c, l, d), f = [...e.value[c] ?? []], p = f.findIndex((_) => _.correlationId === d);
    if (p !== -1) {
      const _ = {
        id: h.id,
        content: h.content,
        role: mt.AGENT,
        componentId: h.componentId,
        flowId: h.flowId,
        threadId: c,
        userId: h.userId,
        createdAt: h.createdAt,
        correlationId: d
      };
      f.splice(p, 1, _);
    } else
      f.push(h);
    o(c, f);
  }
  function n(c, l, d) {
    return {
      ...l,
      threadId: c,
      role: mt.AGENT,
      correlationId: d
    };
  }
  function r(c, l, d, h) {
    const f = {
      id: l,
      content: d,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      role: mt.USER,
      componentId: "",
      flowId: "",
      threadId: c,
      userId: "",
      files: h
    };
    return u(c, f), f;
  }
  function u(c, l) {
    const d = e.value[c] || [];
    o(c, [...d, l]);
  }
  function o(c, l) {
    e.value = {
      ...e.value,
      [c]: l
    };
  }
  function i(c, l, d) {
    const h = e.value[c] || [];
    if (h.findIndex((M) => M.correlationId === l) === -1) {
      const M = {
        id: l,
        content: "",
        role: mt.AGENT,
        componentId: "",
        flowId: "",
        threadId: c,
        userId: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        correlationId: l
      };
      e.value = {
        ...e.value,
        [c]: [...h, M]
      };
    }
    const p = [...e.value[c] || []], _ = p.find((M) => M.correlationId === l);
    _.content += d, e.value = {
      ...e.value,
      [c]: p
    };
  }
  function s(c, l, d) {
    const h = e.value[c] || [], f = h.findIndex((p) => p.id === l);
    if (f !== -1) {
      const p = [...h];
      p.splice(f, 1, d), o(c, p);
    }
  }
  function a(c, l) {
    return c ? c.substring(0, 32) : l && l.length > 0 && l[0].name ? l[0].name.substring(0, 32) : "New Thread";
  }
  return {
    appendDeltaToThread: i,
    appendToThread: u,
    setThreadMessages: o,
    addPlaceholderToThread: r,
    addFinalAgentToThread: t,
    replacePlaceholder: s,
    createThreadName: a
  };
}
function rh(e, t) {
  const { addFinalAgentToThread: n, appendDeltaToThread: r } = gc(e), { setStatus: u, stop: o } = t;
  function i(d) {
    return (h) => {
      h.role === mt.AGENT && (n(d, h, h.correlationId ?? ""), u(d, Jn.IDLE));
    };
  }
  function s(d) {
    return (h) => {
      r(d, h.correlationId, h.content);
    };
  }
  function a(d) {
    return (h) => {
      const f = (h.content ?? "").replace(/\.{1,3}$/, "");
      u(d, f);
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
function uh() {
  return {
    load: async (u) => {
      const o = await Gf(u), i = o.messages || [];
      return i.forEach((s) => {
        s.role === mt.AGENT && (s.author = o.agentId);
      }), i.map(Io);
    },
    send: async (u, o, i, s) => {
      if (i.role !== mt.USER)
        throw new Error("Only user messages can be sent");
      const a = await Vf(u, o, i.id, i.content, s);
      return a ? Io(a) : null;
    },
    remove: async (u, o) => {
      await Kf(u, o);
    },
    create: async (u, o, i) => {
      const s = await Wf(u, o, i);
      return hc(s);
    }
  };
}
const oh = {
  CHAT_EVENTS: "/plugins/appmixer/utils/chat/events"
};
function ih(e, t) {
  const n = `${Yt().apiBaseUrl}${oh.CHAT_EVENTS}/${e}`, r = new EventSource(n);
  return r.onmessage = (u) => {
    const o = JSON.parse(u.data);
    o.type === so.MESSAGE ? t.onMessage(o.data) : o.type === so.PROGRESS ? t.onProgress(o.data) : o.type === so.DELTA && t.onDelta(o.data);
  }, r.onerror = (u) => {
    var o;
    (o = t.onError) == null || o.call(t, u), r.close();
  }, r.addEventListener("done", () => {
    var u;
    (u = t.onDone) == null || u.call(t), r.close();
  }), r;
}
function sh(e) {
  const t = `chat-widget-sync-${e}`, n = new BroadcastChannel(t), r = crypto.randomUUID(), u = /* @__PURE__ */ new Set(), o = (c) => {
    const l = c.data;
    l.sessionId === e && l.tabId !== r && u.forEach((d) => d(l));
  };
  n.addEventListener("message", o);
  function i(c) {
    n.postMessage({ type: "delete-thread", threadId: c, sessionId: e, tabId: r });
  }
  function s(c) {
    return u.add(c), () => {
      u.delete(c);
    };
  }
  function a() {
    n.removeEventListener("message", o), n.close(), u.clear();
  }
  return {
    notifyDeleteThread: i,
    subscribe: s,
    close: a
  };
}
function _s() {
  const e = performance.getEntriesByType("navigation");
  return e.length > 0 ? e[0].type === "reload" : !1;
}
const Qe = /* @__PURE__ */ oi("chat", () => {
  const e = ye(null), t = ye(ao() ?? void 0), n = ye({}), r = ye({}), u = ye(!1), o = ye({}), i = ye([]), s = re(() => {
    var x;
    return ((x = e.value) == null ? void 0 : x.threads) ?? [];
  }), a = re(() => {
    var x;
    return Object.fromEntries(((x = e.value) == null ? void 0 : x.threads.map((L) => [L.id, L])) ?? []);
  }), c = re(() => t.value ? a.value[t.value] ?? null : null), l = re(() => {
    const x = t.value;
    return !!x && Array.isArray(n.value[x]) && n.value[x].length > 0;
  }), d = re(
    () => t.value ? n.value[t.value] ?? [] : []
  ), h = re(() => {
    var x;
    return t.value && ((x = o.value[t.value]) != null && x.status) ? o.value[t.value].status : Jn.IDLE;
  });
  let f = null, p = () => {
  };
  Ct(
    e,
    (x) => {
      f && (f.close(), f = null), x && x.id && (f = sh(x.id), p = f.notifyDeleteThread);
    },
    { immediate: !0 }
  );
  function _(x) {
    return f ? f.subscribe((L) => {
      L.type === "delete-thread" && x(L);
    }) : () => {
    };
  }
  function M(x) {
    if (!e.value) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    delete n.value[x], delete o.value[x], delete r.value[x];
    const L = e.value.threads.findIndex((te) => te.id === x);
    if (L === -1) {
      console.error(`Thread with ID ${x} not found in session`);
      return;
    }
    e.value.threads.splice(L, 1), t.value === x && k();
  }
  function A(x = void 0) {
  }
  function k() {
    e.value && (t.value = void 0);
  }
  function F() {
    if (t.value = void 0, _s()) {
      const x = ao();
      t.value = x || void 0;
    }
  }
  function E() {
    let x;
    if (_s()) {
      const L = ao();
      L && a.value[L] && (x = L);
    }
    t.value = x;
  }
  return Ct(t, (x) => {
    x ? Yf(x) : Xf();
  }), {
    session: e,
    messages: n,
    threads: s,
    streams: o,
    threadState: r,
    hasMessages: l,
    activeThread: c,
    activeThreadId: t,
    isLoadingSession: u,
    activeMessages: d,
    threadById: a,
    activeStreamStatus: h,
    errors: i,
    clearThread: M,
    seedDemo: A,
    resetActiveChat: k,
    setInitActiveThread: F,
    initActiveThread: E,
    subscribeToDeleteThread: _,
    notifyDeleteThread: (x) => p(x)
  };
});
function ah() {
  const e = Qe(), { streams: t } = At(e);
  return { start: (i, s) => {
    if (t.value[i])
      return;
    const a = ih(i, {
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
        status: Jn.IDLE
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
  }, statusOf: (i) => re(() => {
    var s;
    return ((s = t.value[i]) == null ? void 0 : s.status) ?? Jn.IDLE;
  }), setStatus: (i, s) => {
    t.value[i] && (t.value[i].status = s);
  } };
}
const ch = {
  viewBox: "0 0 20 20",
  width: "1.2em",
  height: "1.2em"
}, lh = { fill: "none" }, dh = ["clip-path"], fh = ["id"];
function hh(e, t) {
  return R(), H("svg", ch, [
    V("g", lh, [
      V("g", {
        "clip-path": "url(#" + e.idMap.clip0_5795_24317 + ")"
      }, t[0] || (t[0] = [
        ti('<path d="M1.66699 1.66669L18.3337 18.3334" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 16.6667H10.0083" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.08301 13.6908C7.86188 12.9274 8.90904 12.4998 9.99967 12.4998C11.0903 12.4998 12.1375 12.9274 12.9163 13.6908" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4.16699 10.7158C5.34868 9.55744 6.8485 8.77707 8.47533 8.47418" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.8336 10.7158C15.3319 10.2239 14.7699 9.79751 14.1611 9.44666" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1.66699 7.35002C2.69749 6.42842 3.87373 5.68415 5.14783 5.14752" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.3334 7.34997C17.0624 6.21315 15.5721 5.34842 13.9544 4.80899C12.3367 4.26957 10.6257 4.06684 8.92676 4.2133" stroke="currentColor" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>', 7)
      ]), 8, dh),
      V("defs", null, [
        V("clipPath", {
          id: e.idMap.clip0_5795_24317
        }, t[1] || (t[1] = [
          V("rect", {
            width: "20",
            height: "20",
            fill: "white"
          }, null, -1)
        ]), 8, fh)
      ])
    ])
  ]);
}
const cr = ht({ name: "icons-not-connection", render: hh, setup() {
  return { idMap: { clip0_5795_24317: "uicons-" + Math.random().toString(36).substr(2, 10) } };
} });
let ph = (e = 21) => crypto.getRandomValues(new Uint8Array(e)).reduce((t, n) => (n &= 63, n < 36 ? t += n.toString(36) : n < 62 ? t += (n - 26).toString(36).toUpperCase() : n > 62 ? t += "-" : t += "_", t), "");
function bc() {
  const e = Qe();
  function t() {
    return e.errors.length > 0;
  }
  function n() {
    e.errors = [];
  }
  function r(o) {
    e.errors.push(o);
  }
  function u(o, i, s, a, c, l) {
    const d = {
      id: ph(12),
      title: o,
      message: i,
      errorMsg: l ? `ERROR [${l.statusCode}]: ${l.message}` : void 0,
      actionLabel: s,
      icon: a,
      onRetry: c,
      visible: !0
    };
    r(d);
  }
  return {
    clearErrors: n,
    addErrorItemObj: r,
    addError: u,
    hasErrors: t
  };
}
const gh = "temp-";
function fu() {
  const e = Qe(), { notifyDeleteThread: t } = e, { messages: n } = At(e), { setThreadMessages: r, addPlaceholderToThread: u, createThreadName: o } = gc(n), { init: i } = nh(), { load: s, send: a, remove: c, create: l } = uh(), { clearErrors: d, addError: h } = bc();
  function f(v) {
    e.threadState[v] || (e.threadState[v] = {
      isLoadingMessages: !1,
      isStreaming: !1,
      isSending: !1
    });
  }
  function p(v, j, oe) {
    f(v), e.threadState = {
      ...e.threadState,
      [v]: {
        ...e.threadState[v],
        [j]: oe
      }
    };
  }
  async function _() {
    e.isLoadingSession = !0;
    try {
      e.session = await i(), e.initActiveThread();
    } catch (v) {
      v instanceof ar ? (h(
        "Connection Error",
        "Connection to the server failed. Please check your connection or try again later.",
        "Retry",
        cr,
        M,
        v
      ), console.error(`Failed to load session: ${v.detailMessage}`)) : console.error("An unexpected error occurred while loading the session:", v);
    } finally {
      e.isLoadingSession = !1;
    }
  }
  async function M() {
    d(), await _(), e.activeThreadId && await k(e.activeThreadId);
  }
  Ct(
    () => e.activeThreadId,
    async (v) => {
      await Qt(), v && e.session && ee(e.session.id, v);
    },
    { immediate: !0 }
  );
  async function A(v) {
    if (!e.session) {
      console.warn("Session model is not set, cannot set active thread");
      return;
    }
    if (e.activeThreadId === v)
      return;
    if (!e.threadById[v]) {
      console.warn(`Cannot set active thread: Thread with ID ${v} not found`);
      return;
    }
    e.activeThreadId = v, ee(e.session.id, v);
  }
  async function k(v) {
    if (!e.session) {
      console.error("Session model is not set, cannot load messages");
      return;
    }
    p(v, "isLoadingMessages", !0);
    try {
      e.messages[v] = await s(v) || [];
      const j = e.threadById[v];
      if (!j) {
        console.error(`Thread with ID ${v} not found in session`);
        return;
      }
      j.messages = e.messages[v];
    } catch (j) {
      j instanceof ar ? (h(
        "Connection Error",
        "Connection to the server failed. Please check your connection or try again later.",
        "Retry",
        cr,
        M,
        j
      ), console.error(`Error loading messages for thread ${v}: ${j.detailMessage}`)) : console.error("An unexpected error occurred while loading messages:", j);
    } finally {
      p(v, "isLoadingMessages", !1);
    }
  }
  async function F(v, j) {
    var oe;
    if (!e.session) {
      console.error("Session model is not set, cannot add message");
      return;
    }
    try {
      if (!e.activeThreadId) {
        const ke = (oe = e.session.agents[0]) == null ? void 0 : oe.id, Ee = await l(e.session.id, ke, o(v, null));
        if (!Ee || !Ee.id)
          throw new Error("Failed to create new thread");
        p(Ee.id, "isSending", !0), e.session.threads.unshift(Ee), A(Ee.id), e.messages[Ee.id] = [];
      }
      const he = e.activeThreadId || "";
      p(he, "isSending", !0);
      const Ne = j && j.length > 0 ? await Promise.all(j.map((ke) => Df(ke.file))) : void 0, Ie = j && j.length > 0 ? j.map((ke) => Tf(ke.file)) : void 0, fe = `${gh}${Date.now()}`, He = u(he, fe, v, Ie), je = await a(
        e.session.id,
        he,
        { ...He },
        Ne
      );
      if (je) {
        const ke = e.messages[he] || [], Ee = ke.findIndex((xt) => xt.id === fe);
        Ee !== -1 && (ke.splice(Ee, 1, je), r(he, ke));
      } else
        e.messages[he] = (e.messages[he] || []).filter(
          (ke) => ke.id !== fe
        ), console.error("Failed to save message: addMessageApi returned null");
    } catch (he) {
      he instanceof ar ? (h(
        "Connection Error",
        "Connection to the server failed. Please check your connection or try again later.",
        "Retry",
        cr,
        M,
        he
      ), console.error(`Error creating thread or adding message: ${he.detailMessage}`)) : console.error("An unexpected error occurred while sending message:", he);
    }
  }
  function E(v) {
    if (!e.session) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    try {
      t(v), c(e.session.id, v), x(v);
    } catch (j) {
      j instanceof ar ? (h(
        "Connection Error",
        "Connection to the server failed. Please check your connection or try again later.",
        "Retry",
        cr,
        M,
        j
      ), console.error(`Error deleting thread ${v}: ${j.detailMessage}`)) : console.error("An unexpected error occurred while deleting thread:", j);
    }
  }
  function x(v) {
    if (!e.session) {
      console.error("Session model is not set, cannot delete thread");
      return;
    }
    ce(v), e.clearThread(v);
  }
  const L = ah(), { start: te, stop: K } = L, N = rh(At(e).messages, L);
  function ee(v, j) {
    te(j, {
      onMessage: (oe) => {
        N.makeMessageHandler(j)(oe), oe.role === mt.AGENT && (p(j, "isStreaming", !1), p(j, "isSending", !1));
      },
      onProgress: (oe) => {
        N.makeProgressHandler(j)(oe);
      },
      onDelta: (oe) => {
        N.makeDeltaHandler(j)(oe);
      },
      onError: (oe) => {
        N.makeErrorHandler(v, j, ee)(oe), p(j, "isStreaming", !1), p(j, "isSending", !1);
      },
      onDone: () => {
        N.makeDoneHandler(j)(), p(j, "isStreaming", !1), p(j, "isSending", !1);
      }
    });
  }
  function ce(v) {
    K(v);
  }
  return {
    loadSession: _,
    setActiveThread: A,
    loadMessages: k,
    sendMessage: F,
    deleteThread: E,
    deleteThreadFromStore: x,
    startStreaming: ee,
    stopStreaming: ce,
    initChatSession: M
  };
}
const Ru = /* @__PURE__ */ oi("sidebarStore", () => {
  const e = ye(!1), t = () => {
    e.value = !e.value;
  }, n = () => {
    e.value = !1;
  }, r = () => {
    e.value = !0;
  }, u = re(() => e.value), o = re(() => t);
  return {
    isOpen: u,
    toggle: o,
    close: n,
    open: r
  };
});
function xs(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function bh(e) {
  const t = String(e.getDate()).padStart(2, "0"), n = String(e.getMonth() + 1).padStart(2, "0"), r = e.getFullYear();
  return `${t}.${n}.${r}`;
}
function mh(e, t) {
  const n = xs(e).getTime() - xs(t).getTime(), r = Math.round(n / (1e3 * 60 * 60 * 24));
  return r === 0 ? { key: "groups.today" } : r === -1 ? { key: "groups.yesterday" } : { label: bh(e) };
}
function _h(e) {
  return re(() => {
    const n = [...Array.isArray(e) ? e : e.value].sort(
      (o, i) => new Date(i.createdAt ?? 0).getTime() - new Date(o.createdAt ?? 0).getTime()
    ), r = /* @__PURE__ */ new Date(), u = /* @__PURE__ */ new Map();
    for (const o of n) {
      const i = new Date(o.createdAt ?? 0), { key: s, label: a } = mh(i, r), c = s ?? a;
      u.has(c) || u.set(c, { key: s, label: a, items: [] }), u.get(c).items.push(o);
    }
    return Array.from(u.values());
  });
}
const xh = ["type", "disabled"], yh = {
  key: 0,
  class: "am-chat-widget-btn__icon"
}, vh = {
  key: 1,
  class: "am-chat-widget-btn__label"
}, wh = /* @__PURE__ */ Ce({
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
    const t = e, n = re(() => t.full ?? !1), r = re(() => t.iconOnly ?? !1), u = re(() => t.small ?? !1), o = re(() => t.active ?? !1), i = re(() => t.isSending ?? !1);
    return (s, a) => (R(), H("button", Ua({
      class: [
        "am-chat-widget-btn",
        `am-chat-widget-btn--${s.style}`,
        { "am-chat-widget-btn--active": o.value },
        {
          "am-chat-widget-btn--full": n.value,
          "am-chat-widget-btn--icon-only": r.value,
          "am-chat-widget-btn--small": u.value
        },
        { "am-chat-widget-btn--desktop-hidden": s.hiddenForDesktop }
      ]
    }, s.$attrs, {
      type: t.type,
      disabled: s.style === "disabled" || i.value
    }), [
      s.$slots.icon ? (R(), H("span", yh, [
        cu(s.$slots, "icon")
      ])) : Se("", !0),
      s.$slots.default ? (R(), H("span", vh, [
        cu(s.$slots, "default")
      ])) : Se("", !0)
    ], 16, xh));
  }
}), kh = '@charset "UTF-8";.am-chat-widget-btn{position:relative;display:inline-flex;justify-content:center;align-items:center;padding:.4375rem 1rem;border:none;border-radius:.1875rem;background-color:var(--bg-primary-btn);line-height:1;text-decoration:none;color:var(--color-primary-btn);transition:background-color .15s;cursor:pointer;gap:.5rem;-webkit-tap-highlight-color:transparent;overflow:visible}.am-chat-widget-btn:hover,.am-chat-widget-btn:focus-visible{background-color:var(--bg-primary-btn-hover)}.am-chat-widget-btn__icon{display:inline-flex;font-size:1.1875rem}.am-chat-widget-btn__label{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.am-chat-widget-btn--full{display:flex;width:100%}.am-chat-widget-btn--icon-only{width:auto;padding:.4375rem 1rem;gap:0}.am-chat-widget-btn--icon-only.am-chat-widget-btn--small{width:1.625rem;padding:.3125rem;aspect-ratio:1/1}.am-chat-widget-btn--icon-only.am-chat-widget-btn--small>.am-chat-widget-btn__icon{font-size:.6875rem}.am-chat-widget-btn--primary{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;background-color:var(--bg-primary-btn);color:var(--color-primary-btn)}.am-chat-widget-btn--primary:hover,.am-chat-widget-btn--primary:focus-visible{background-color:var(--bg-primary-btn-hover)}.am-chat-widget-btn--primary:disabled{background-color:var(--bg-primary-btn-disabled);color:var(--color-primary-btn);cursor:default}.am-chat-widget-btn--secondary{border:.0625rem solid var(--border-secondary-btn);background-color:var(--bg-secondary-btn);color:var(--color-secondary-btn)}.am-chat-widget-btn--secondary:hover,.am-chat-widget-btn--secondary:focus-visible{background-color:var(--text-side-bg-active)}.am-chat-widget-btn--secondary:disabled{background-color:var(--bg-disabled-btn);color:var(--color-secondary-btn);opacity:.5;cursor:not-allowed}.am-chat-widget-btn--tertiary{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;border:.0625rem solid var(--border-tertiary-btn);background-color:var(--bg-tertiary-btn);box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;color:var(--color-tertiary-btn)}.am-chat-widget-btn--tertiary:hover,.am-chat-widget-btn--tertiary:focus-visible{border-color:var(--border-tertiary-hover-btn);background-color:var(--bg-tertiary-hover-btn)}.am-chat-widget-btn--tertiary:active{background-color:var(--bg-tertiary-active-btn)}.am-chat-widget-btn--danger{border:.0625rem solid var(--bg-error-msg-btn);background-color:var(--bg-error-msg-btn);color:var(--color-primary-btn)}.am-chat-widget-btn--danger:hover,.am-chat-widget-btn--danger:focus-visible{background-color:var(--bg-error-msg-btn-hover)}.am-chat-widget-btn--link{font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:120%;letter-spacing:0;justify-content:left;padding:.625rem .75rem;border:none;border-radius:.1875rem;background:transparent;text-decoration:none;color:var(--text-side)}.am-chat-widget-btn--link.am-chat-widget-btn--active{background-color:var(--text-side-bg-active);color:var(--text-side-active)}.am-chat-widget-btn--link:hover,.am-chat-widget-btn--link:focus-visible{background-color:var(--text-side-bg-active)}.am-chat-widget-btn--desktop-hidden{display:inline-flex}@container chat-widget (min-width: 768px){.am-chat-widget-btn--desktop-hidden{display:none}}[data-widget-mode=dialog] .am-chat-widget-btn--tertiary{box-shadow:none}', Mt = /* @__PURE__ */ Ae(wh, [["styles", [kh]]]), Eh = {
  viewBox: "0 0 16 16",
  width: "1.2em",
  height: "1.2em"
};
function Ch(e, t) {
  return R(), H("svg", Eh, t[0] || (t[0] = [
    V("g", {
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }, [
      V("line", {
        x1: "12",
        y1: "4",
        x2: "4",
        y2: "12"
      }),
      V("line", {
        x1: "4",
        y1: "4",
        x2: "12",
        y2: "12"
      })
    ], -1)
  ]));
}
const li = ht({ name: "icons-cross", render: Ch }), kr = ye({
  messages: []
});
let Ah = 1;
function Sh(e, t = ac.INFO, n = 5e3) {
  const r = { id: Ah++, text: e, type: t };
  kr.value.messages.unshift(r), setTimeout(() => {
    mc(r.id);
  }, n);
}
function mc(e) {
  const t = kr.value.messages.findIndex((n) => n.id === e);
  t !== -1 && kr.value.messages.splice(t, 1);
}
function _c() {
  kr.value.messages = [];
}
function Dh() {
  return {
    state: kr,
    clearFlashes: _c
  };
}
const Th = { class: "am-chat-widget__item" }, Mh = /* @__PURE__ */ Ce({
  __name: "ChatListItem.ce",
  props: {
    label: { type: String },
    active: { type: Boolean },
    threadId: { type: String }
  },
  setup(e) {
    const t = Qe(), n = Ru(), { activeThreadId: r } = At(t), { deleteThread: u, setActiveThread: o, loadMessages: i } = fu(), s = e, a = re(() => s.active ?? !1);
    async function c() {
      _c(), n.close();
      {
        if (o(s.threadId), !r.value)
          return;
        await i(r.value);
      }
    }
    return (l, d) => (R(), H("li", Th, [
      Y(Mt, {
        style: "link",
        full: !0,
        active: a.value,
        "aria-label": `Link to thread: ${l.label}`,
        onClick: c
      }, {
        default: Ye(() => [
          Qn(ct(l.label), 1)
        ]),
        _: 1
      }, 8, ["active", "aria-label"]),
      Y(Mt, {
        style: "link",
        active: a.value,
        "aria-label": `Delete thread: ${l.label}`,
        onClick: d[0] || (d[0] = Tr((h) => q(u)(s.threadId), ["stop"]))
      }, {
        default: Ye(() => [
          Y(q(li), { "aria-label": "Icon delete thread" })
        ]),
        _: 1
      }, 8, ["active", "aria-label"])
    ]));
  }
}), Fh = ".am-chat-widget__item{display:flex;align-items:center;width:100%;margin:.25rem 0;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0}.am-chat-widget__item>:nth-child(1){flex:1;width:auto;min-width:0}.am-chat-widget__item>:nth-child(2){display:none}.am-chat-widget__item:hover{border-radius:.1875rem;background-color:var(--text-side-bg-active)}.am-chat-widget__item:hover>:nth-child(2){display:flex}.am-chat-widget__item svg{width:.625rem;height:.625rem}", Rh = /* @__PURE__ */ Ae(Mh, [["styles", [Fh]]]), Ih = { class: "am-chat-widget__group" }, Nh = { class: "am-chat-widget__list" }, Oh = /* @__PURE__ */ Ce({
  __name: "ChatGroup.ce",
  props: {
    group: { type: Object }
  },
  setup(e) {
    const t = Qe(), { activeThreadId: n } = At(t), r = e, u = re(() => r.group.key ? r.group.key === "groups.today" ? "Today" : "Yesterday" : r.group.label || "");
    return (o, i) => (R(), H("div", Ih, [
      V("h3", null, ct(u.value), 1),
      V("ul", Nh, [
        (R(!0), H(Fe, null, tn(o.group.items, (s) => (R(), Ue(Rh, {
          key: s.id,
          label: s.theme,
          active: s.id === q(n),
          "thread-id": s.id
        }, null, 8, ["label", "active", "thread-id"]))), 128))
      ])
    ]));
  }
}), Lh = ".am-chat-widget__group h3{margin:0 0 .5rem;padding:.5rem .625rem 0;font-size:.8125rem;font-weight:500;color:var(--text-side-header)}.am-chat-widget__list{margin:0;padding:0;list-style:none}", Bh = /* @__PURE__ */ Ae(Oh, [["styles", [Lh]]]), Ph = /* @__PURE__ */ Ce({
  __name: "SkeletonItem.ce",
  props: {
    variant: { type: String }
  },
  setup(e) {
    const t = e, n = re(() => {
      const r = ["am-ui-skeleton-item"];
      return t.variant && (t.variant !== "text-short" ? r.push(`am-ui-skeleton-item--${t.variant}`) : (r.push("am-ui-skeleton-item--text"), r.push("am-ui-skeleton-item--text-short"))), r.join(" ");
    });
    return (r, u) => (R(), H("div", {
      class: Ft(n.value)
    }, null, 2));
  }
}), $h = "@keyframes shimmer{0%{background-position:-12.5rem 0}to{background-position:12.5rem 0}}.am-ui-skeleton-item{background:var(--skeleton-bg);background-image:linear-gradient(90deg,transparent,var(--skeleton-highlight),transparent);background-size:12.5rem 100%;background-repeat:no-repeat;animation:shimmer 1.5s infinite}.am-ui-skeleton-item--avatar{width:2.5rem;height:2.5rem;border-radius:50%}.am-ui-skeleton-item--text{width:100%;height:.75rem;margin-bottom:.5rem;border-radius:.1875rem}.am-ui-skeleton-item--text-short{width:60%}.am-ui-skeleton-item--text:last-child{margin-bottom:0}.am-ui-skeleton-item--bubble{width:80%;height:4rem;margin-bottom:.75rem;border-radius:.5625rem}.am-ui-skeleton-item--bubble:last-child{margin-bottom:0}", jn = /* @__PURE__ */ Ae(Ph, [["styles", [$h]]]), zh = { class: "am-ui-skeleton-list" }, Uh = { class: "am-ui-skeleton-list__lines" }, Hh = /* @__PURE__ */ Ce({
  __name: "SkeletonList.ce",
  props: {
    count: { type: Number }
  },
  setup(e) {
    const n = e.count ?? 5;
    return (r, u) => (R(), H("div", zh, [
      (R(!0), H(Fe, null, tn(q(n), (o) => (R(), H("div", {
        key: o,
        class: "am-ui-skeleton-list__entry"
      }, [
        V("div", Uh, [
          Y(jn, { variant: "text" }),
          Y(jn, { variant: "text-short" })
        ])
      ]))), 128))
    ]));
  }
}), jh = ".am-ui-skeleton-list{display:flex;flex-direction:column;gap:1rem;padding:1rem .625rem}.am-ui-skeleton-list__entry{display:flex;align-items:center;gap:.75rem}.am-ui-skeleton-list__lines{display:flex;flex-direction:column;flex:1}", qh = /* @__PURE__ */ Ae(Hh, [["styles", [jh]]]), Gh = {
  key: 1,
  class: "am-chat-widget__group-container"
}, Vh = /* @__PURE__ */ Ce({
  __name: "ChatList.ce",
  setup(e) {
    const t = Qe(), { isLoadingSession: n, threads: r } = At(t), u = _h(r);
    return (o, i) => q(n) ? (R(), Ue(qh, {
      key: 0,
      count: 3
    })) : q(n) ? Se("", !0) : (R(), H("div", Gh, [
      (R(!0), H(Fe, null, tn(q(u), (s) => (R(), Ue(Bh, {
        key: s.label || s.key,
        group: s
      }, null, 8, ["group"]))), 128))
    ]));
  }
}), Kh = ".am-chat-widget__group-container{display:flex;flex-direction:column;flex:1 1 0;box-sizing:border-box;width:100%;min-height:0;padding:0;gap:.5rem;overflow-y:auto}", Wh = /* @__PURE__ */ Ae(Vh, [["styles", [Kh]]]), Zh = {
  viewBox: "0 0 18 20",
  width: "1.08em",
  height: "1.2em"
};
function Jh(e, t) {
  return R(), H("svg", Zh, t[0] || (t[0] = [
    V("g", { fill: "none" }, [
      V("path", {
        d: "M15.375 12.375C15.375 12.7949 15.2257 13.1977 14.9601 13.4946C14.6944 13.7915 14.3341 13.9583 13.9583 13.9583H5.45833L2.625 17.125V4.45833C2.625 4.03841 2.77426 3.63568 3.03993 3.33875C3.30561 3.04181 3.66594 2.875 4.04167 2.875H13.9583C14.3341 2.875 14.6944 3.04181 14.9601 3.33875C15.2257 3.63568 15.375 4.03841 15.375 4.45833V12.375Z",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      V("path", {
        d: "M9 6.04167V10.7917",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      V("path", {
        d: "M6.875 8.41667H11.125",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const Yh = ht({ name: "icons-new-chat", render: Jh }), Xh = { class: "am-chat-widget__sidebar" }, Qh = /* @__PURE__ */ Ce({
  __name: "ChatSidebar.ce",
  setup(e) {
    const t = Qe(), n = Ru();
    function r() {
      t.resetActiveChat(), n.close();
    }
    return (u, o) => (R(), H("aside", Xh, [
      Y(Mt, {
        style: "primary",
        full: "",
        "aria-label": "Start a new chat",
        onClick: r
      }, {
        icon: Ye(() => [
          Y(q(Yh), { "aria-label": "Icon a new chat" })
        ]),
        default: Ye(() => [
          o[0] || (o[0] = Qn("New Chat "))
        ]),
        _: 1,
        __: [0]
      }),
      Y(Wh)
    ]));
  }
}), e1 = ".am-chat-widget__sidebar{font-family:IBM Plex Sans,sans-serif;font-size:.9375rem;font-weight:500;line-height:100%;letter-spacing:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100cqb;padding-inline:.75rem;padding-block:2rem;gap:2rem}", t1 = /* @__PURE__ */ Ae(Qh, [["styles", [e1]]]);
function Iu(e) {
  const t = Qe(), n = re(() => {
    const i = e.value;
    return i ? t.threadState[i] : null;
  }), r = re(() => {
    var i;
    return !!((i = n.value) != null && i.isLoadingMessages);
  }), u = re(() => {
    var i;
    return !!((i = n.value) != null && i.isSending);
  }), o = re(() => {
    var i;
    return !!((i = n.value) != null && i.isStreaming);
  });
  return {
    isLoadingMessages: r,
    isSending: u,
    isStreaming: o
  };
}
const n1 = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function r1(e, t) {
  return R(), H("svg", n1, t[0] || (t[0] = [
    V("path", {
      fill: "currentColor",
      d: "M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
    }, null, -1)
  ]));
}
const u1 = ht({ name: "icons-file", render: r1 }), o1 = { class: "am-ui-attachment__icon" }, i1 = { class: "am-ui-attachment__info" }, s1 = { class: "am-ui-attachment__name" }, a1 = { class: "am-ui-attachment__type" }, c1 = ["value"], l1 = /* @__PURE__ */ Ce({
  __name: "AttachmentView.ce",
  props: {
    id: { type: String },
    name: { type: String },
    progress: { type: Number },
    showProgress: { type: Boolean },
    removable: { type: Boolean }
  },
  emits: ["remove"],
  setup(e, { emit: t }) {
    const n = e, r = t;
    function u() {
      n.removable && r("remove", n.id || "");
    }
    function o(i) {
      const s = i.lastIndexOf(".");
      return s >= 0 ? i.slice(s + 1).toUpperCase() : "FILE";
    }
    return (i, s) => (R(), H("div", {
      class: Ft(["am-ui-attachment", ["am-ui-attachment", i.removable ? "am-ui-attachment--removable" : ""]])
    }, [
      V("div", o1, [
        Y(q(u1), { "aria-label": "Icon file attachment" })
      ]),
      V("div", i1, [
        V("span", s1, ct(i.name), 1),
        V("span", a1, ct(o(i.name)), 1),
        i.removable && i.showProgress ? (R(), H("progress", {
          key: 0,
          class: "am-ui-attachment__progress",
          value: i.progress,
          max: "100"
        }, null, 8, c1)) : Se("", !0)
      ]),
      i.removable ? (R(), Ue(Mt, {
        key: 0,
        style: "link",
        class: "am-ui-attachment__btn-remove",
        "aria-label": `Delete attachment: ${i.name}`,
        onClick: u
      }, {
        default: Ye(() => [
          Y(q(li), { "aria-label": "Icon delete attachment" })
        ]),
        _: 1
      }, 8, ["aria-label"])) : Se("", !0)
    ], 2));
  }
}), d1 = ".am-ui-attachment{display:flex;flex:0 0 auto;align-items:center;max-width:12.5rem;padding:.5rem;border:.0625rem solid var(--border-header);border-radius:.5625rem;background:transparent}.am-ui-attachment__icon{display:flex;justify-content:center;align-items:center;width:2rem;height:2rem;margin-right:.5rem;border-radius:.5625rem;background:var(--bg-primary-btn-hover)}.am-ui-attachment__icon svg{width:1.25rem;height:1.25rem;color:var(--color-primary-btn)}.am-ui-attachment__info{display:flex;flex-direction:column;flex:1;min-width:0;overflow:hidden}.am-ui-attachment__name{display:block;font-size:.9em;color:var(--text-header);cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.am-ui-attachment__type{margin-top:2px;font-size:.75em;color:var(--text-input-panel);cursor:default}.am-ui-attachment__progress{width:100%;height:.375rem;margin-top:.5em;border:none}.am-ui-attachment__progress::-webkit-progress-bar{border-radius:.5625rem;background-color:#e0e0e0}.am-ui-attachment__progress::-webkit-progress-value{border-radius:.5625rem}.am-ui-attachment__btn-remove{margin-left:.5em;padding:0;border:none;background:none;font-size:1.2em;color:#777;transition:color .2s;cursor:pointer}.am-ui-attachment__btn-remove svg{width:1rem;height:1rem}.am-ui-attachment--removable{transition:background .2s,transform .2s}.am-ui-attachment--removable:hover{background:var(--text-side-bg-active);transform:translateY(-1px)}", xc = /* @__PURE__ */ Ae(l1, [["styles", [d1]]]);
function f1(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var co, ys;
function h1() {
  if (ys) return co;
  ys = 1;
  function e(b) {
    return b instanceof Map ? b.clear = b.delete = b.set = function() {
      throw new Error("map is read-only");
    } : b instanceof Set && (b.add = b.clear = b.delete = function() {
      throw new Error("set is read-only");
    }), Object.freeze(b), Object.getOwnPropertyNames(b).forEach((w) => {
      const P = b[w], se = typeof P;
      (se === "object" || se === "function") && !Object.isFrozen(P) && e(P);
    }), b;
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
  function n(b) {
    return b.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }
  function r(b, ...w) {
    const P = /* @__PURE__ */ Object.create(null);
    for (const se in b)
      P[se] = b[se];
    return w.forEach(function(se) {
      for (const Le in se)
        P[Le] = se[Le];
    }), /** @type {T} */
    P;
  }
  const u = "</span>", o = (b) => !!b.scope, i = (b, { prefix: w }) => {
    if (b.startsWith("language:"))
      return b.replace("language:", "language-");
    if (b.includes(".")) {
      const P = b.split(".");
      return [
        `${w}${P.shift()}`,
        ...P.map((se, Le) => `${se}${"_".repeat(Le + 1)}`)
      ].join(" ");
    }
    return `${w}${b}`;
  };
  class s {
    /**
     * Creates a new HTMLRenderer
     *
     * @param {Tree} parseTree - the parse tree (must support `walk` API)
     * @param {{classPrefix: string}} options
     */
    constructor(w, P) {
      this.buffer = "", this.classPrefix = P.classPrefix, w.walk(this);
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
      const P = i(
        w.scope,
        { prefix: this.classPrefix }
      );
      this.span(P);
    }
    /**
     * Adds a node close to the output stream (if needed)
     *
     * @param {Node} node */
    closeNode(w) {
      o(w) && (this.buffer += u);
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
  const a = (b = {}) => {
    const w = { children: [] };
    return Object.assign(w, b), w;
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
      const P = a({ scope: w });
      this.add(P), this.stack.push(P);
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
    static _walk(w, P) {
      return typeof P == "string" ? w.addText(P) : P.children && (w.openNode(P), P.children.forEach((se) => this._walk(w, se)), w.closeNode(P)), w;
    }
    /**
     * @param {Node} node
     */
    static _collapse(w) {
      typeof w != "string" && w.children && (w.children.every((P) => typeof P == "string") ? w.children = [w.children.join("")] : w.children.forEach((P) => {
        c._collapse(P);
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
    __addSublanguage(w, P) {
      const se = w.root;
      P && (se.scope = `language:${P}`), this.add(se);
    }
    toHTML() {
      return new s(this, this.options).value();
    }
    finalize() {
      return this.closeAllNodes(), !0;
    }
  }
  function d(b) {
    return b ? typeof b == "string" ? b : b.source : null;
  }
  function h(b) {
    return _("(?=", b, ")");
  }
  function f(b) {
    return _("(?:", b, ")*");
  }
  function p(b) {
    return _("(?:", b, ")?");
  }
  function _(...b) {
    return b.map((P) => d(P)).join("");
  }
  function M(b) {
    const w = b[b.length - 1];
    return typeof w == "object" && w.constructor === Object ? (b.splice(b.length - 1, 1), w) : {};
  }
  function A(...b) {
    return "(" + (M(b).capture ? "" : "?:") + b.map((se) => d(se)).join("|") + ")";
  }
  function k(b) {
    return new RegExp(b.toString() + "|").exec("").length - 1;
  }
  function F(b, w) {
    const P = b && b.exec(w);
    return P && P.index === 0;
  }
  const E = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
  function x(b, { joinWith: w }) {
    let P = 0;
    return b.map((se) => {
      P += 1;
      const Le = P;
      let Be = d(se), Z = "";
      for (; Be.length > 0; ) {
        const G = E.exec(Be);
        if (!G) {
          Z += Be;
          break;
        }
        Z += Be.substring(0, G.index), Be = Be.substring(G.index + G[0].length), G[0][0] === "\\" && G[1] ? Z += "\\" + String(Number(G[1]) + Le) : (Z += G[0], G[0] === "(" && P++);
      }
      return Z;
    }).map((se) => `(${se})`).join(w);
  }
  const L = /\b\B/, te = "[a-zA-Z]\\w*", K = "[a-zA-Z_]\\w*", N = "\\b\\d+(\\.\\d+)?", ee = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", ce = "\\b(0b[01]+)", v = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", j = (b = {}) => {
    const w = /^#![ ]*\//;
    return b.binary && (b.begin = _(
      w,
      /.*\b/,
      b.binary,
      /\b.*/
    )), r({
      scope: "meta",
      begin: w,
      end: /$/,
      relevance: 0,
      /** @type {ModeCallback} */
      "on:begin": (P, se) => {
        P.index !== 0 && se.ignoreMatch();
      }
    }, b);
  }, oe = {
    begin: "\\\\[\\s\\S]",
    relevance: 0
  }, he = {
    scope: "string",
    begin: "'",
    end: "'",
    illegal: "\\n",
    contains: [oe]
  }, Ne = {
    scope: "string",
    begin: '"',
    end: '"',
    illegal: "\\n",
    contains: [oe]
  }, Ie = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  }, fe = function(b, w, P = {}) {
    const se = r(
      {
        scope: "comment",
        begin: b,
        end: w,
        contains: []
      },
      P
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
    const Le = A(
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
          Le,
          /[.]?[:]?([.][ ]|[ ])/,
          "){3}"
        )
        // look for 3 words in a row
      }
    ), se;
  }, He = fe("//", "$"), je = fe("/\\*", "\\*/"), ke = fe("#", "$"), Ee = {
    scope: "number",
    begin: N,
    relevance: 0
  }, xt = {
    scope: "number",
    begin: ee,
    relevance: 0
  }, $u = {
    scope: "number",
    begin: ce,
    relevance: 0
  }, zu = {
    scope: "regexp",
    begin: /\/(?=[^/\n]*\/)/,
    end: /\/[gimuy]*/,
    contains: [
      oe,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [oe]
      }
    ]
  }, _n = {
    scope: "title",
    begin: te,
    relevance: 0
  }, Rn = {
    scope: "title",
    begin: K,
    relevance: 0
  }, rr = {
    // excludes method names from keyword processing
    begin: "\\.\\s*" + K,
    relevance: 0
  };
  var It = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    APOS_STRING_MODE: he,
    BACKSLASH_ESCAPE: oe,
    BINARY_NUMBER_MODE: $u,
    BINARY_NUMBER_RE: ce,
    COMMENT: fe,
    C_BLOCK_COMMENT_MODE: je,
    C_LINE_COMMENT_MODE: He,
    C_NUMBER_MODE: xt,
    C_NUMBER_RE: ee,
    END_SAME_AS_BEGIN: function(b) {
      return Object.assign(
        b,
        {
          /** @type {ModeCallback} */
          "on:begin": (w, P) => {
            P.data._beginMatch = w[1];
          },
          /** @type {ModeCallback} */
          "on:end": (w, P) => {
            P.data._beginMatch !== w[1] && P.ignoreMatch();
          }
        }
      );
    },
    HASH_COMMENT_MODE: ke,
    IDENT_RE: te,
    MATCH_NOTHING_RE: L,
    METHOD_GUARD: rr,
    NUMBER_MODE: Ee,
    NUMBER_RE: N,
    PHRASAL_WORDS_MODE: Ie,
    QUOTE_STRING_MODE: Ne,
    REGEXP_MODE: zu,
    RE_STARTERS_RE: v,
    SHEBANG: j,
    TITLE_MODE: _n,
    UNDERSCORE_IDENT_RE: K,
    UNDERSCORE_TITLE_MODE: Rn
  });
  function yi(b, w) {
    b.input[b.index - 1] === "." && w.ignoreMatch();
  }
  function g(b, w) {
    b.className !== void 0 && (b.scope = b.className, delete b.className);
  }
  function m(b, w) {
    w && b.beginKeywords && (b.begin = "\\b(" + b.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", b.__beforeBegin = yi, b.keywords = b.keywords || b.beginKeywords, delete b.beginKeywords, b.relevance === void 0 && (b.relevance = 0));
  }
  function y(b, w) {
    Array.isArray(b.illegal) && (b.illegal = A(...b.illegal));
  }
  function D(b, w) {
    if (b.match) {
      if (b.begin || b.end) throw new Error("begin & end are not supported with match");
      b.begin = b.match, delete b.match;
    }
  }
  function C(b, w) {
    b.relevance === void 0 && (b.relevance = 1);
  }
  const S = (b, w) => {
    if (!b.beforeMatch) return;
    if (b.starts) throw new Error("beforeMatch cannot be used with starts");
    const P = Object.assign({}, b);
    Object.keys(b).forEach((se) => {
      delete b[se];
    }), b.keywords = P.keywords, b.begin = _(P.beforeMatch, h(P.begin)), b.starts = {
      relevance: 0,
      contains: [
        Object.assign(P, { endsParent: !0 })
      ]
    }, b.relevance = 0, delete P.beforeMatch;
  }, $ = [
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
  function O(b, w, P = B) {
    const se = /* @__PURE__ */ Object.create(null);
    return typeof b == "string" ? Le(P, b.split(" ")) : Array.isArray(b) ? Le(P, b) : Object.keys(b).forEach(function(Be) {
      Object.assign(
        se,
        O(b[Be], w, Be)
      );
    }), se;
    function Le(Be, Z) {
      w && (Z = Z.map((G) => G.toLowerCase())), Z.forEach(function(G) {
        const ue = G.split("|");
        se[ue[0]] = [Be, T(ue[0], ue[1])];
      });
    }
  }
  function T(b, w) {
    return w ? Number(w) : X(b) ? 0 : 1;
  }
  function X(b) {
    return $.includes(b.toLowerCase());
  }
  const z = {}, W = (b) => {
    console.error(b);
  }, ne = (b, ...w) => {
    console.log(`WARN: ${b}`, ...w);
  }, le = (b, w) => {
    z[`${b}/${w}`] || (console.log(`Deprecated as of ${b}. ${w}`), z[`${b}/${w}`] = !0);
  }, me = new Error();
  function be(b, w, { key: P }) {
    let se = 0;
    const Le = b[P], Be = {}, Z = {};
    for (let G = 1; G <= w.length; G++)
      Z[G + se] = Le[G], Be[G + se] = !0, se += k(w[G - 1]);
    b[P] = Z, b[P]._emit = Be, b[P]._multi = !0;
  }
  function it(b) {
    if (Array.isArray(b.begin)) {
      if (b.skip || b.excludeBegin || b.returnBegin)
        throw W("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), me;
      if (typeof b.beginScope != "object" || b.beginScope === null)
        throw W("beginScope must be object"), me;
      be(b, b.begin, { key: "beginScope" }), b.begin = x(b.begin, { joinWith: "" });
    }
  }
  function et(b) {
    if (Array.isArray(b.end)) {
      if (b.skip || b.excludeEnd || b.returnEnd)
        throw W("skip, excludeEnd, returnEnd not compatible with endScope: {}"), me;
      if (typeof b.endScope != "object" || b.endScope === null)
        throw W("endScope must be object"), me;
      be(b, b.end, { key: "endScope" }), b.end = x(b.end, { joinWith: "" });
    }
  }
  function yt(b) {
    b.scope && typeof b.scope == "object" && b.scope !== null && (b.beginScope = b.scope, delete b.scope);
  }
  function vt(b) {
    yt(b), typeof b.beginScope == "string" && (b.beginScope = { _wrap: b.beginScope }), typeof b.endScope == "string" && (b.endScope = { _wrap: b.endScope }), it(b), et(b);
  }
  function xn(b) {
    function w(Z, G) {
      return new RegExp(
        d(Z),
        "m" + (b.case_insensitive ? "i" : "") + (b.unicodeRegex ? "u" : "") + (G ? "g" : "")
      );
    }
    class P {
      constructor() {
        this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
      }
      // @ts-ignore
      addRule(G, ue) {
        ue.position = this.position++, this.matchIndexes[this.matchAt] = ue, this.regexes.push([ue, G]), this.matchAt += k(G) + 1;
      }
      compile() {
        this.regexes.length === 0 && (this.exec = () => null);
        const G = this.regexes.map((ue) => ue[1]);
        this.matcherRe = w(x(G, { joinWith: "|" }), !0), this.lastIndex = 0;
      }
      /** @param {string} s */
      exec(G) {
        this.matcherRe.lastIndex = this.lastIndex;
        const ue = this.matcherRe.exec(G);
        if (!ue)
          return null;
        const Ve = ue.findIndex((or, ju) => ju > 0 && or !== void 0), $e = this.matchIndexes[Ve];
        return ue.splice(0, Ve), Object.assign(ue, $e);
      }
    }
    class se {
      constructor() {
        this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
      }
      // @ts-ignore
      getMatcher(G) {
        if (this.multiRegexes[G]) return this.multiRegexes[G];
        const ue = new P();
        return this.rules.slice(G).forEach(([Ve, $e]) => ue.addRule(Ve, $e)), ue.compile(), this.multiRegexes[G] = ue, ue;
      }
      resumingScanAtSamePosition() {
        return this.regexIndex !== 0;
      }
      considerAll() {
        this.regexIndex = 0;
      }
      // @ts-ignore
      addRule(G, ue) {
        this.rules.push([G, ue]), ue.type === "begin" && this.count++;
      }
      /** @param {string} s */
      exec(G) {
        const ue = this.getMatcher(this.regexIndex);
        ue.lastIndex = this.lastIndex;
        let Ve = ue.exec(G);
        if (this.resumingScanAtSamePosition() && !(Ve && Ve.index === this.lastIndex)) {
          const $e = this.getMatcher(0);
          $e.lastIndex = this.lastIndex + 1, Ve = $e.exec(G);
        }
        return Ve && (this.regexIndex += Ve.position + 1, this.regexIndex === this.count && this.considerAll()), Ve;
      }
    }
    function Le(Z) {
      const G = new se();
      return Z.contains.forEach((ue) => G.addRule(ue.begin, { rule: ue, type: "begin" })), Z.terminatorEnd && G.addRule(Z.terminatorEnd, { type: "end" }), Z.illegal && G.addRule(Z.illegal, { type: "illegal" }), G;
    }
    function Be(Z, G) {
      const ue = (
        /** @type CompiledMode */
        Z
      );
      if (Z.isCompiled) return ue;
      [
        g,
        // do this early so compiler extensions generally don't have to worry about
        // the distinction between match/begin
        D,
        vt,
        S
      ].forEach(($e) => $e(Z, G)), b.compilerExtensions.forEach(($e) => $e(Z, G)), Z.__beforeBegin = null, [
        m,
        // do this later so compiler extensions that come earlier have access to the
        // raw array if they wanted to perhaps manipulate it, etc.
        y,
        // default to 1 relevance if not specified
        C
      ].forEach(($e) => $e(Z, G)), Z.isCompiled = !0;
      let Ve = null;
      return typeof Z.keywords == "object" && Z.keywords.$pattern && (Z.keywords = Object.assign({}, Z.keywords), Ve = Z.keywords.$pattern, delete Z.keywords.$pattern), Ve = Ve || /\w+/, Z.keywords && (Z.keywords = O(Z.keywords, b.case_insensitive)), ue.keywordPatternRe = w(Ve, !0), G && (Z.begin || (Z.begin = /\B|\b/), ue.beginRe = w(ue.begin), !Z.end && !Z.endsWithParent && (Z.end = /\B|\b/), Z.end && (ue.endRe = w(ue.end)), ue.terminatorEnd = d(ue.end) || "", Z.endsWithParent && G.terminatorEnd && (ue.terminatorEnd += (Z.end ? "|" : "") + G.terminatorEnd)), Z.illegal && (ue.illegalRe = w(
        /** @type {RegExp | string} */
        Z.illegal
      )), Z.contains || (Z.contains = []), Z.contains = [].concat(...Z.contains.map(function($e) {
        return st($e === "self" ? Z : $e);
      })), Z.contains.forEach(function($e) {
        Be(
          /** @type Mode */
          $e,
          ue
        );
      }), Z.starts && Be(Z.starts, G), ue.matcher = Le(ue), ue;
    }
    if (b.compilerExtensions || (b.compilerExtensions = []), b.contains && b.contains.includes("self"))
      throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
    return b.classNameAliases = r(b.classNameAliases || {}), Be(
      /** @type Mode */
      b
    );
  }
  function ur(b) {
    return b ? b.endsWithParent || ur(b.starts) : !1;
  }
  function st(b) {
    return b.variants && !b.cachedVariants && (b.cachedVariants = b.variants.map(function(w) {
      return r(b, { variants: null }, w);
    })), b.cachedVariants ? b.cachedVariants : ur(b) ? r(b, { starts: b.starts ? r(b.starts) : null }) : Object.isFrozen(b) ? r(b) : b;
  }
  var wt = "11.11.1";
  class Lr extends Error {
    constructor(w, P) {
      super(w), this.name = "HTMLInjectionError", this.html = P;
    }
  }
  const Hu = n, vi = r, wi = Symbol("nomatch"), ul = 7, ki = function(b) {
    const w = /* @__PURE__ */ Object.create(null), P = /* @__PURE__ */ Object.create(null), se = [];
    let Le = !0;
    const Be = "Could not find the language '{}', did you forget to load/include a language module?", Z = { disableAutodetect: !0, name: "Plain text", contains: [] };
    let G = {
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
    function ue(I) {
      return G.noHighlightRe.test(I);
    }
    function Ve(I) {
      let Q = I.className + " ";
      Q += I.parentNode ? I.parentNode.className : "";
      const pe = G.languageDetectRe.exec(Q);
      if (pe) {
        const De = nn(pe[1]);
        return De || (ne(Be.replace("{}", pe[1])), ne("Falling back to no-highlight mode for this block.", I)), De ? pe[1] : "no-highlight";
      }
      return Q.split(/\s+/).find((De) => ue(De) || nn(De));
    }
    function $e(I, Q, pe) {
      let De = "", qe = "";
      typeof Q == "object" ? (De = I, pe = Q.ignoreIllegals, qe = Q.language) : (le("10.7.0", "highlight(lang, code, ...args) has been deprecated."), le("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), qe = I, De = Q), pe === void 0 && (pe = !0);
      const Dt = {
        code: De,
        language: qe
      };
      Pr("before:highlight", Dt);
      const rn = Dt.result ? Dt.result : or(Dt.language, Dt.code, pe);
      return rn.code = Dt.code, Pr("after:highlight", rn), rn;
    }
    function or(I, Q, pe, De) {
      const qe = /* @__PURE__ */ Object.create(null);
      function Dt(U, J) {
        return U.keywords[J];
      }
      function rn() {
        if (!ae.keywords) {
          Ze.addText(Te);
          return;
        }
        let U = 0;
        ae.keywordPatternRe.lastIndex = 0;
        let J = ae.keywordPatternRe.exec(Te), de = "";
        for (; J; ) {
          de += Te.substring(U, J.index);
          const ve = Ot.case_insensitive ? J[0].toLowerCase() : J[0], tt = Dt(ae, ve);
          if (tt) {
            const [Vt, vl] = tt;
            if (Ze.addText(de), de = "", qe[ve] = (qe[ve] || 0) + 1, qe[ve] <= ul && (Ur += vl), Vt.startsWith("_"))
              de += J[0];
            else {
              const wl = Ot.classNameAliases[Vt] || Vt;
              Nt(J[0], wl);
            }
          } else
            de += J[0];
          U = ae.keywordPatternRe.lastIndex, J = ae.keywordPatternRe.exec(Te);
        }
        de += Te.substring(U), Ze.addText(de);
      }
      function $r() {
        if (Te === "") return;
        let U = null;
        if (typeof ae.subLanguage == "string") {
          if (!w[ae.subLanguage]) {
            Ze.addText(Te);
            return;
          }
          U = or(ae.subLanguage, Te, !0, Fi[ae.subLanguage]), Fi[ae.subLanguage] = /** @type {CompiledMode} */
          U._top;
        } else
          U = qu(Te, ae.subLanguage.length ? ae.subLanguage : null);
        ae.relevance > 0 && (Ur += U.relevance), Ze.__addSublanguage(U._emitter, U.language);
      }
      function pt() {
        ae.subLanguage != null ? $r() : rn(), Te = "";
      }
      function Nt(U, J) {
        U !== "" && (Ze.startScope(J), Ze.addText(U), Ze.endScope());
      }
      function Si(U, J) {
        let de = 1;
        const ve = J.length - 1;
        for (; de <= ve; ) {
          if (!U._emit[de]) {
            de++;
            continue;
          }
          const tt = Ot.classNameAliases[U[de]] || U[de], Vt = J[de];
          tt ? Nt(Vt, tt) : (Te = Vt, rn(), Te = ""), de++;
        }
      }
      function Di(U, J) {
        return U.scope && typeof U.scope == "string" && Ze.openNode(Ot.classNameAliases[U.scope] || U.scope), U.beginScope && (U.beginScope._wrap ? (Nt(Te, Ot.classNameAliases[U.beginScope._wrap] || U.beginScope._wrap), Te = "") : U.beginScope._multi && (Si(U.beginScope, J), Te = "")), ae = Object.create(U, { parent: { value: ae } }), ae;
      }
      function Ti(U, J, de) {
        let ve = F(U.endRe, de);
        if (ve) {
          if (U["on:end"]) {
            const tt = new t(U);
            U["on:end"](J, tt), tt.isMatchIgnored && (ve = !1);
          }
          if (ve) {
            for (; U.endsParent && U.parent; )
              U = U.parent;
            return U;
          }
        }
        if (U.endsWithParent)
          return Ti(U.parent, J, de);
      }
      function bl(U) {
        return ae.matcher.regexIndex === 0 ? (Te += U[0], 1) : (Wu = !0, 0);
      }
      function ml(U) {
        const J = U[0], de = U.rule, ve = new t(de), tt = [de.__beforeBegin, de["on:begin"]];
        for (const Vt of tt)
          if (Vt && (Vt(U, ve), ve.isMatchIgnored))
            return bl(J);
        return de.skip ? Te += J : (de.excludeBegin && (Te += J), pt(), !de.returnBegin && !de.excludeBegin && (Te = J)), Di(de, U), de.returnBegin ? 0 : J.length;
      }
      function _l(U) {
        const J = U[0], de = Q.substring(U.index), ve = Ti(ae, U, de);
        if (!ve)
          return wi;
        const tt = ae;
        ae.endScope && ae.endScope._wrap ? (pt(), Nt(J, ae.endScope._wrap)) : ae.endScope && ae.endScope._multi ? (pt(), Si(ae.endScope, U)) : tt.skip ? Te += J : (tt.returnEnd || tt.excludeEnd || (Te += J), pt(), tt.excludeEnd && (Te = J));
        do
          ae.scope && Ze.closeNode(), !ae.skip && !ae.subLanguage && (Ur += ae.relevance), ae = ae.parent;
        while (ae !== ve.parent);
        return ve.starts && Di(ve.starts, U), tt.returnEnd ? 0 : J.length;
      }
      function xl() {
        const U = [];
        for (let J = ae; J !== Ot; J = J.parent)
          J.scope && U.unshift(J.scope);
        U.forEach((J) => Ze.openNode(J));
      }
      let zr = {};
      function Mi(U, J) {
        const de = J && J[0];
        if (Te += U, de == null)
          return pt(), 0;
        if (zr.type === "begin" && J.type === "end" && zr.index === J.index && de === "") {
          if (Te += Q.slice(J.index, J.index + 1), !Le) {
            const ve = new Error(`0 width match regex (${I})`);
            throw ve.languageName = I, ve.badRule = zr.rule, ve;
          }
          return 1;
        }
        if (zr = J, J.type === "begin")
          return ml(J);
        if (J.type === "illegal" && !pe) {
          const ve = new Error('Illegal lexeme "' + de + '" for mode "' + (ae.scope || "<unnamed>") + '"');
          throw ve.mode = ae, ve;
        } else if (J.type === "end") {
          const ve = _l(J);
          if (ve !== wi)
            return ve;
        }
        if (J.type === "illegal" && de === "")
          return Te += `
`, 1;
        if (Ku > 1e5 && Ku > J.index * 3)
          throw new Error("potential infinite loop, way more iterations than matches");
        return Te += de, de.length;
      }
      const Ot = nn(I);
      if (!Ot)
        throw W(Be.replace("{}", I)), new Error('Unknown language: "' + I + '"');
      const yl = xn(Ot);
      let Vu = "", ae = De || yl;
      const Fi = {}, Ze = new G.__emitter(G);
      xl();
      let Te = "", Ur = 0, yn = 0, Ku = 0, Wu = !1;
      try {
        if (Ot.__emitTokens)
          Ot.__emitTokens(Q, Ze);
        else {
          for (ae.matcher.considerAll(); ; ) {
            Ku++, Wu ? Wu = !1 : ae.matcher.considerAll(), ae.matcher.lastIndex = yn;
            const U = ae.matcher.exec(Q);
            if (!U) break;
            const J = Q.substring(yn, U.index), de = Mi(J, U);
            yn = U.index + de;
          }
          Mi(Q.substring(yn));
        }
        return Ze.finalize(), Vu = Ze.toHTML(), {
          language: I,
          value: Vu,
          relevance: Ur,
          illegal: !1,
          _emitter: Ze,
          _top: ae
        };
      } catch (U) {
        if (U.message && U.message.includes("Illegal"))
          return {
            language: I,
            value: Hu(Q),
            illegal: !0,
            relevance: 0,
            _illegalBy: {
              message: U.message,
              index: yn,
              context: Q.slice(yn - 100, yn + 100),
              mode: U.mode,
              resultSoFar: Vu
            },
            _emitter: Ze
          };
        if (Le)
          return {
            language: I,
            value: Hu(Q),
            illegal: !1,
            relevance: 0,
            errorRaised: U,
            _emitter: Ze,
            _top: ae
          };
        throw U;
      }
    }
    function ju(I) {
      const Q = {
        value: Hu(I),
        illegal: !1,
        relevance: 0,
        _top: Z,
        _emitter: new G.__emitter(G)
      };
      return Q._emitter.addText(I), Q;
    }
    function qu(I, Q) {
      Q = Q || G.languages || Object.keys(w);
      const pe = ju(I), De = Q.filter(nn).filter(Ai).map(
        (pt) => or(pt, I, !1)
      );
      De.unshift(pe);
      const qe = De.sort((pt, Nt) => {
        if (pt.relevance !== Nt.relevance) return Nt.relevance - pt.relevance;
        if (pt.language && Nt.language) {
          if (nn(pt.language).supersetOf === Nt.language)
            return 1;
          if (nn(Nt.language).supersetOf === pt.language)
            return -1;
        }
        return 0;
      }), [Dt, rn] = qe, $r = Dt;
      return $r.secondBest = rn, $r;
    }
    function ol(I, Q, pe) {
      const De = Q && P[Q] || pe;
      I.classList.add("hljs"), I.classList.add(`language-${De}`);
    }
    function Gu(I) {
      let Q = null;
      const pe = Ve(I);
      if (ue(pe)) return;
      if (Pr(
        "before:highlightElement",
        { el: I, language: pe }
      ), I.dataset.highlighted) {
        console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", I);
        return;
      }
      if (I.children.length > 0 && (G.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(I)), G.throwUnescapedHTML))
        throw new Lr(
          "One of your code blocks includes unescaped HTML.",
          I.innerHTML
        );
      Q = I;
      const De = Q.textContent, qe = pe ? $e(De, { language: pe, ignoreIllegals: !0 }) : qu(De);
      I.innerHTML = qe.value, I.dataset.highlighted = "yes", ol(I, pe, qe.language), I.result = {
        language: qe.language,
        // TODO: remove with version 11.0
        re: qe.relevance,
        relevance: qe.relevance
      }, qe.secondBest && (I.secondBest = {
        language: qe.secondBest.language,
        relevance: qe.secondBest.relevance
      }), Pr("after:highlightElement", { el: I, result: qe, text: De });
    }
    function il(I) {
      G = vi(G, I);
    }
    const sl = () => {
      Br(), le("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
    };
    function al() {
      Br(), le("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
    }
    let Ei = !1;
    function Br() {
      function I() {
        Br();
      }
      if (document.readyState === "loading") {
        Ei || window.addEventListener("DOMContentLoaded", I, !1), Ei = !0;
        return;
      }
      document.querySelectorAll(G.cssSelector).forEach(Gu);
    }
    function cl(I, Q) {
      let pe = null;
      try {
        pe = Q(b);
      } catch (De) {
        if (W("Language definition for '{}' could not be registered.".replace("{}", I)), Le)
          W(De);
        else
          throw De;
        pe = Z;
      }
      pe.name || (pe.name = I), w[I] = pe, pe.rawDefinition = Q.bind(null, b), pe.aliases && Ci(pe.aliases, { languageName: I });
    }
    function ll(I) {
      delete w[I];
      for (const Q of Object.keys(P))
        P[Q] === I && delete P[Q];
    }
    function dl() {
      return Object.keys(w);
    }
    function nn(I) {
      return I = (I || "").toLowerCase(), w[I] || w[P[I]];
    }
    function Ci(I, { languageName: Q }) {
      typeof I == "string" && (I = [I]), I.forEach((pe) => {
        P[pe.toLowerCase()] = Q;
      });
    }
    function Ai(I) {
      const Q = nn(I);
      return Q && !Q.disableAutodetect;
    }
    function fl(I) {
      I["before:highlightBlock"] && !I["before:highlightElement"] && (I["before:highlightElement"] = (Q) => {
        I["before:highlightBlock"](
          Object.assign({ block: Q.el }, Q)
        );
      }), I["after:highlightBlock"] && !I["after:highlightElement"] && (I["after:highlightElement"] = (Q) => {
        I["after:highlightBlock"](
          Object.assign({ block: Q.el }, Q)
        );
      });
    }
    function hl(I) {
      fl(I), se.push(I);
    }
    function pl(I) {
      const Q = se.indexOf(I);
      Q !== -1 && se.splice(Q, 1);
    }
    function Pr(I, Q) {
      const pe = I;
      se.forEach(function(De) {
        De[pe] && De[pe](Q);
      });
    }
    function gl(I) {
      return le("10.7.0", "highlightBlock will be removed entirely in v12.0"), le("10.7.0", "Please use highlightElement now."), Gu(I);
    }
    Object.assign(b, {
      highlight: $e,
      highlightAuto: qu,
      highlightAll: Br,
      highlightElement: Gu,
      // TODO: Remove with v12 API
      highlightBlock: gl,
      configure: il,
      initHighlighting: sl,
      initHighlightingOnLoad: al,
      registerLanguage: cl,
      unregisterLanguage: ll,
      listLanguages: dl,
      getLanguage: nn,
      registerAliases: Ci,
      autoDetection: Ai,
      inherit: vi,
      addPlugin: hl,
      removePlugin: pl
    }), b.debugMode = function() {
      Le = !1;
    }, b.safeMode = function() {
      Le = !0;
    }, b.versionString = wt, b.regex = {
      concat: _,
      lookahead: h,
      either: A,
      optional: p,
      anyNumberOfTimes: f
    };
    for (const I in It)
      typeof It[I] == "object" && e(It[I]);
    return Object.assign(b, It), b;
  }, In = ki({});
  return In.newInstance = () => ki({}), co = In, In.HighlightJS = In, In.default = In, co;
}
var p1 = /* @__PURE__ */ h1();
const En = /* @__PURE__ */ f1(p1), vs = {};
function g1(e) {
  let t = vs[e];
  if (t)
    return t;
  t = vs[e] = [];
  for (let n = 0; n < 128; n++) {
    const r = String.fromCharCode(n);
    t.push(r);
  }
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    t[r] = "%" + ("0" + r.toString(16).toUpperCase()).slice(-2);
  }
  return t;
}
function Yn(e, t) {
  typeof t != "string" && (t = Yn.defaultChars);
  const n = g1(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(r) {
    let u = "";
    for (let o = 0, i = r.length; o < i; o += 3) {
      const s = parseInt(r.slice(o + 1, o + 3), 16);
      if (s < 128) {
        u += n[s];
        continue;
      }
      if ((s & 224) === 192 && o + 3 < i) {
        const a = parseInt(r.slice(o + 4, o + 6), 16);
        if ((a & 192) === 128) {
          const c = s << 6 & 1984 | a & 63;
          c < 128 ? u += "��" : u += String.fromCharCode(c), o += 3;
          continue;
        }
      }
      if ((s & 240) === 224 && o + 6 < i) {
        const a = parseInt(r.slice(o + 4, o + 6), 16), c = parseInt(r.slice(o + 7, o + 9), 16);
        if ((a & 192) === 128 && (c & 192) === 128) {
          const l = s << 12 & 61440 | a << 6 & 4032 | c & 63;
          l < 2048 || l >= 55296 && l <= 57343 ? u += "���" : u += String.fromCharCode(l), o += 6;
          continue;
        }
      }
      if ((s & 248) === 240 && o + 9 < i) {
        const a = parseInt(r.slice(o + 4, o + 6), 16), c = parseInt(r.slice(o + 7, o + 9), 16), l = parseInt(r.slice(o + 10, o + 12), 16);
        if ((a & 192) === 128 && (c & 192) === 128 && (l & 192) === 128) {
          let d = s << 18 & 1835008 | a << 12 & 258048 | c << 6 & 4032 | l & 63;
          d < 65536 || d > 1114111 ? u += "����" : (d -= 65536, u += String.fromCharCode(55296 + (d >> 10), 56320 + (d & 1023))), o += 9;
          continue;
        }
      }
      u += "�";
    }
    return u;
  });
}
Yn.defaultChars = ";/?:@&=+$,#";
Yn.componentChars = "";
const ws = {};
function b1(e) {
  let t = ws[e];
  if (t)
    return t;
  t = ws[e] = [];
  for (let n = 0; n < 128; n++) {
    const r = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(r) ? t.push(r) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++)
    t[e.charCodeAt(n)] = e[n];
  return t;
}
function Ir(e, t, n) {
  typeof t != "string" && (n = t, t = Ir.defaultChars), typeof n > "u" && (n = !0);
  const r = b1(t);
  let u = "";
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e.charCodeAt(o);
    if (n && s === 37 && o + 2 < i && /^[0-9a-f]{2}$/i.test(e.slice(o + 1, o + 3))) {
      u += e.slice(o, o + 3), o += 2;
      continue;
    }
    if (s < 128) {
      u += r[s];
      continue;
    }
    if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && o + 1 < i) {
        const a = e.charCodeAt(o + 1);
        if (a >= 56320 && a <= 57343) {
          u += encodeURIComponent(e[o] + e[o + 1]), o++;
          continue;
        }
      }
      u += "%EF%BF%BD";
      continue;
    }
    u += encodeURIComponent(e[o]);
  }
  return u;
}
Ir.defaultChars = ";/?:@&=+$,-_.!~*'()#";
Ir.componentChars = "-_.!~*'()";
function di(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function hu() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const m1 = /^([a-z0-9.+-]+:)/i, _1 = /:[0-9]*$/, x1 = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, y1 = ["<", ">", '"', "`", " ", "\r", `
`, "	"], v1 = ["{", "}", "|", "\\", "^", "`"].concat(y1), w1 = ["'"].concat(v1), ks = ["%", "/", "?", ";", "#"].concat(w1), Es = ["/", "?", "#"], k1 = 255, Cs = /^[+a-z0-9A-Z_-]{0,63}$/, E1 = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, As = {
  javascript: !0,
  "javascript:": !0
}, Ss = {
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
function fi(e, t) {
  if (e && e instanceof hu) return e;
  const n = new hu();
  return n.parse(e, t), n;
}
hu.prototype.parse = function(e, t) {
  let n, r, u, o = e;
  if (o = o.trim(), !t && e.split("#").length === 1) {
    const c = x1.exec(o);
    if (c)
      return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let i = m1.exec(o);
  if (i && (i = i[0], n = i.toLowerCase(), this.protocol = i, o = o.substr(i.length)), (t || i || o.match(/^\/\/[^@\/]+@[^@\/]+/)) && (u = o.substr(0, 2) === "//", u && !(i && As[i]) && (o = o.substr(2), this.slashes = !0)), !As[i] && (u || i && !Ss[i])) {
    let c = -1;
    for (let p = 0; p < Es.length; p++)
      r = o.indexOf(Es[p]), r !== -1 && (c === -1 || r < c) && (c = r);
    let l, d;
    c === -1 ? d = o.lastIndexOf("@") : d = o.lastIndexOf("@", c), d !== -1 && (l = o.slice(0, d), o = o.slice(d + 1), this.auth = l), c = -1;
    for (let p = 0; p < ks.length; p++)
      r = o.indexOf(ks[p]), r !== -1 && (c === -1 || r < c) && (c = r);
    c === -1 && (c = o.length), o[c - 1] === ":" && c--;
    const h = o.slice(0, c);
    o = o.slice(c), this.parseHost(h), this.hostname = this.hostname || "";
    const f = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!f) {
      const p = this.hostname.split(/\./);
      for (let _ = 0, M = p.length; _ < M; _++) {
        const A = p[_];
        if (A && !A.match(Cs)) {
          let k = "";
          for (let F = 0, E = A.length; F < E; F++)
            A.charCodeAt(F) > 127 ? k += "x" : k += A[F];
          if (!k.match(Cs)) {
            const F = p.slice(0, _), E = p.slice(_ + 1), x = A.match(E1);
            x && (F.push(x[1]), E.unshift(x[2])), E.length && (o = E.join(".") + o), this.hostname = F.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > k1 && (this.hostname = ""), f && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const s = o.indexOf("#");
  s !== -1 && (this.hash = o.substr(s), o = o.slice(0, s));
  const a = o.indexOf("?");
  return a !== -1 && (this.search = o.substr(a), o = o.slice(0, a)), o && (this.pathname = o), Ss[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
hu.prototype.parseHost = function(e) {
  let t = _1.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
const C1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: Yn,
  encode: Ir,
  format: di,
  parse: fi
}, Symbol.toStringTag, { value: "Module" })), yc = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, vc = /[\0-\x1F\x7F-\x9F]/, A1 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, hi = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, wc = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, kc = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, S1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: yc,
  Cc: vc,
  Cf: A1,
  P: hi,
  S: wc,
  Z: kc
}, Symbol.toStringTag, { value: "Module" })), D1 = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((e) => e.charCodeAt(0))
), T1 = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((e) => e.charCodeAt(0))
);
var lo;
const M1 = /* @__PURE__ */ new Map([
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
]), F1 = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (lo = String.fromCodePoint) !== null && lo !== void 0 ? lo : function(e) {
    let t = "";
    return e > 65535 && (e -= 65536, t += String.fromCharCode(e >>> 10 & 1023 | 55296), e = 56320 | e & 1023), t += String.fromCharCode(e), t;
  }
);
function R1(e) {
  var t;
  return e >= 55296 && e <= 57343 || e > 1114111 ? 65533 : (t = M1.get(e)) !== null && t !== void 0 ? t : e;
}
var We;
(function(e) {
  e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_F = 102] = "LOWER_F", e[e.LOWER_X = 120] = "LOWER_X", e[e.LOWER_Z = 122] = "LOWER_Z", e[e.UPPER_A = 65] = "UPPER_A", e[e.UPPER_F = 70] = "UPPER_F", e[e.UPPER_Z = 90] = "UPPER_Z";
})(We || (We = {}));
const I1 = 32;
var fn;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE";
})(fn || (fn = {}));
function No(e) {
  return e >= We.ZERO && e <= We.NINE;
}
function N1(e) {
  return e >= We.UPPER_A && e <= We.UPPER_F || e >= We.LOWER_A && e <= We.LOWER_F;
}
function O1(e) {
  return e >= We.UPPER_A && e <= We.UPPER_Z || e >= We.LOWER_A && e <= We.LOWER_Z || No(e);
}
function L1(e) {
  return e === We.EQUALS || O1(e);
}
var Ke;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(Ke || (Ke = {}));
var dn;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(dn || (dn = {}));
class B1 {
  constructor(t, n, r) {
    this.decodeTree = t, this.emitCodePoint = n, this.errors = r, this.state = Ke.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = dn.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(t) {
    this.decodeMode = t, this.state = Ke.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
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
      case Ke.EntityStart:
        return t.charCodeAt(n) === We.NUM ? (this.state = Ke.NumericStart, this.consumed += 1, this.stateNumericStart(t, n + 1)) : (this.state = Ke.NamedEntity, this.stateNamedEntity(t, n));
      case Ke.NumericStart:
        return this.stateNumericStart(t, n);
      case Ke.NumericDecimal:
        return this.stateNumericDecimal(t, n);
      case Ke.NumericHex:
        return this.stateNumericHex(t, n);
      case Ke.NamedEntity:
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
    return n >= t.length ? -1 : (t.charCodeAt(n) | I1) === We.LOWER_X ? (this.state = Ke.NumericHex, this.consumed += 1, this.stateNumericHex(t, n + 1)) : (this.state = Ke.NumericDecimal, this.stateNumericDecimal(t, n));
  }
  addToNumericResult(t, n, r, u) {
    if (n !== r) {
      const o = r - n;
      this.result = this.result * Math.pow(u, o) + parseInt(t.substr(n, o), u), this.consumed += o;
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
    const r = n;
    for (; n < t.length; ) {
      const u = t.charCodeAt(n);
      if (No(u) || N1(u))
        n += 1;
      else
        return this.addToNumericResult(t, r, n, 16), this.emitNumericEntity(u, 3);
    }
    return this.addToNumericResult(t, r, n, 16), -1;
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
    const r = n;
    for (; n < t.length; ) {
      const u = t.charCodeAt(n);
      if (No(u))
        n += 1;
      else
        return this.addToNumericResult(t, r, n, 10), this.emitNumericEntity(u, 2);
    }
    return this.addToNumericResult(t, r, n, 10), -1;
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
    var r;
    if (this.consumed <= n)
      return (r = this.errors) === null || r === void 0 || r.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (t === We.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === dn.Strict)
      return 0;
    return this.emitCodePoint(R1(this.result), this.consumed), this.errors && (t !== We.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
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
    const { decodeTree: r } = this;
    let u = r[this.treeIndex], o = (u & fn.VALUE_LENGTH) >> 14;
    for (; n < t.length; n++, this.excess++) {
      const i = t.charCodeAt(n);
      if (this.treeIndex = P1(r, u, this.treeIndex + Math.max(1, o), i), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === dn.Attribute && // We shouldn't have consumed any characters after the entity,
        (o === 0 || // And there should be no invalid characters.
        L1(i)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (u = r[this.treeIndex], o = (u & fn.VALUE_LENGTH) >> 14, o !== 0) {
        if (i === We.SEMI)
          return this.emitNamedEntityData(this.treeIndex, o, this.consumed + this.excess);
        this.decodeMode !== dn.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
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
    const { result: n, decodeTree: r } = this, u = (r[n] & fn.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(n, u, this.consumed), (t = this.errors) === null || t === void 0 || t.missingSemicolonAfterCharacterReference(), this.consumed;
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
  emitNamedEntityData(t, n, r) {
    const { decodeTree: u } = this;
    return this.emitCodePoint(n === 1 ? u[t] & ~fn.VALUE_LENGTH : u[t + 1], r), n === 3 && this.emitCodePoint(u[t + 2], r), r;
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
      case Ke.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== dn.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      // Otherwise, emit a numeric entity if we have one.
      case Ke.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case Ke.NumericHex:
        return this.emitNumericEntity(0, 3);
      case Ke.NumericStart:
        return (t = this.errors) === null || t === void 0 || t.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case Ke.EntityStart:
        return 0;
    }
  }
}
function Ec(e) {
  let t = "";
  const n = new B1(e, (r) => t += F1(r));
  return function(u, o) {
    let i = 0, s = 0;
    for (; (s = u.indexOf("&", s)) >= 0; ) {
      t += u.slice(i, s), n.startEntity(o);
      const c = n.write(
        u,
        // Skip the "&"
        s + 1
      );
      if (c < 0) {
        i = s + n.end();
        break;
      }
      i = s + c, s = c === 0 ? i + 1 : i;
    }
    const a = t + u.slice(i);
    return t = "", a;
  };
}
function P1(e, t, n, r) {
  const u = (t & fn.BRANCH_LENGTH) >> 7, o = t & fn.JUMP_TABLE;
  if (u === 0)
    return o !== 0 && r === o ? n : -1;
  if (o) {
    const a = r - o;
    return a < 0 || a >= u ? -1 : e[n + a] - 1;
  }
  let i = n, s = i + u - 1;
  for (; i <= s; ) {
    const a = i + s >>> 1, c = e[a];
    if (c < r)
      i = a + 1;
    else if (c > r)
      s = a - 1;
    else
      return e[a + u];
  }
  return -1;
}
const $1 = Ec(D1);
Ec(T1);
function Cc(e, t = dn.Legacy) {
  return $1(e, t);
}
function z1(e) {
  return Object.prototype.toString.call(e);
}
function pi(e) {
  return z1(e) === "[object String]";
}
const U1 = Object.prototype.hasOwnProperty;
function H1(e, t) {
  return U1.call(e, t);
}
function Nu(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be object");
      Object.keys(n).forEach(function(r) {
        e[r] = n[r];
      });
    }
  }), e;
}
function Ac(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function gi(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) === 65535 || (e & 65535) === 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function pu(e) {
  if (e > 65535) {
    e -= 65536;
    const t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
const Sc = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, j1 = /&([a-z#][a-z0-9]{1,31});/gi, q1 = new RegExp(Sc.source + "|" + j1.source, "gi"), G1 = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function V1(e, t) {
  if (t.charCodeAt(0) === 35 && G1.test(t)) {
    const r = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return gi(r) ? pu(r) : e;
  }
  const n = Cc(e);
  return n !== e ? n : e;
}
function K1(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(Sc, "$1");
}
function Xn(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(q1, function(t, n, r) {
    return n || V1(t, r);
  });
}
const W1 = /[&<>"]/, Z1 = /[&<>"]/g, J1 = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function Y1(e) {
  return J1[e];
}
function mn(e) {
  return W1.test(e) ? e.replace(Z1, Y1) : e;
}
const X1 = /[.?*+^$[\]\\(){}|-]/g;
function Q1(e) {
  return e.replace(X1, "\\$&");
}
function Re(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function Er(e) {
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
function Cr(e) {
  return hi.test(e) || wc.test(e);
}
function Ar(e) {
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
function Ou(e) {
  return e = e.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (e = e.replace(/ẞ/g, "ß")), e.toLowerCase().toUpperCase();
}
const ep = { mdurl: C1, ucmicro: S1 }, tp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: Ac,
  assign: Nu,
  escapeHtml: mn,
  escapeRE: Q1,
  fromCodePoint: pu,
  has: H1,
  isMdAsciiPunct: Ar,
  isPunctChar: Cr,
  isSpace: Re,
  isString: pi,
  isValidEntityCode: gi,
  isWhiteSpace: Er,
  lib: ep,
  normalizeReference: Ou,
  unescapeAll: Xn,
  unescapeMd: K1
}, Symbol.toStringTag, { value: "Module" }));
function np(e, t, n) {
  let r, u, o, i;
  const s = e.posMax, a = e.pos;
  for (e.pos = t + 1, r = 1; e.pos < s; ) {
    if (o = e.src.charCodeAt(e.pos), o === 93 && (r--, r === 0)) {
      u = !0;
      break;
    }
    if (i = e.pos, e.md.inline.skipToken(e), o === 91) {
      if (i === e.pos - 1)
        r++;
      else if (n)
        return e.pos = a, -1;
    }
  }
  let c = -1;
  return u && (c = e.pos), e.pos = a, c;
}
function rp(e, t, n) {
  let r, u = t;
  const o = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(u) === 60) {
    for (u++; u < n; ) {
      if (r = e.charCodeAt(u), r === 10 || r === 60)
        return o;
      if (r === 62)
        return o.pos = u + 1, o.str = Xn(e.slice(t + 1, u)), o.ok = !0, o;
      if (r === 92 && u + 1 < n) {
        u += 2;
        continue;
      }
      u++;
    }
    return o;
  }
  let i = 0;
  for (; u < n && (r = e.charCodeAt(u), !(r === 32 || r < 32 || r === 127)); ) {
    if (r === 92 && u + 1 < n) {
      if (e.charCodeAt(u + 1) === 32)
        break;
      u += 2;
      continue;
    }
    if (r === 40 && (i++, i > 32))
      return o;
    if (r === 41) {
      if (i === 0)
        break;
      i--;
    }
    u++;
  }
  return t === u || i !== 0 || (o.str = Xn(e.slice(t, u)), o.pos = u, o.ok = !0), o;
}
function up(e, t, n, r) {
  let u, o = t;
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
  if (r)
    i.str = r.str, i.marker = r.marker;
  else {
    if (o >= n)
      return i;
    let s = e.charCodeAt(o);
    if (s !== 34 && s !== 39 && s !== 40)
      return i;
    t++, o++, s === 40 && (s = 41), i.marker = s;
  }
  for (; o < n; ) {
    if (u = e.charCodeAt(o), u === i.marker)
      return i.pos = o + 1, i.str += Xn(e.slice(t, o)), i.ok = !0, i;
    if (u === 40 && i.marker === 41)
      return i;
    u === 92 && o + 1 < n && o++, o++;
  }
  return i.can_continue = !0, i.str += Xn(e.slice(t, o)), i;
}
const op = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: rp,
  parseLinkLabel: np,
  parseLinkTitle: up
}, Symbol.toStringTag, { value: "Module" })), qt = {};
qt.code_inline = function(e, t, n, r, u) {
  const o = e[t];
  return "<code" + u.renderAttrs(o) + ">" + mn(o.content) + "</code>";
};
qt.code_block = function(e, t, n, r, u) {
  const o = e[t];
  return "<pre" + u.renderAttrs(o) + "><code>" + mn(e[t].content) + `</code></pre>
`;
};
qt.fence = function(e, t, n, r, u) {
  const o = e[t], i = o.info ? Xn(o.info).trim() : "";
  let s = "", a = "";
  if (i) {
    const l = i.split(/(\s+)/g);
    s = l[0], a = l.slice(2).join("");
  }
  let c;
  if (n.highlight ? c = n.highlight(o.content, s, a) || mn(o.content) : c = mn(o.content), c.indexOf("<pre") === 0)
    return c + `
`;
  if (i) {
    const l = o.attrIndex("class"), d = o.attrs ? o.attrs.slice() : [];
    l < 0 ? d.push(["class", n.langPrefix + s]) : (d[l] = d[l].slice(), d[l][1] += " " + n.langPrefix + s);
    const h = {
      attrs: d
    };
    return `<pre><code${u.renderAttrs(h)}>${c}</code></pre>
`;
  }
  return `<pre><code${u.renderAttrs(o)}>${c}</code></pre>
`;
};
qt.image = function(e, t, n, r, u) {
  const o = e[t];
  return o.attrs[o.attrIndex("alt")][1] = u.renderInlineAsText(o.children, n, r), u.renderToken(e, t, n);
};
qt.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
};
qt.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
qt.text = function(e, t) {
  return mn(e[t].content);
};
qt.html_block = function(e, t) {
  return e[t].content;
};
qt.html_inline = function(e, t) {
  return e[t].content;
};
function nr() {
  this.rules = Nu({}, qt);
}
nr.prototype.renderAttrs = function(t) {
  let n, r, u;
  if (!t.attrs)
    return "";
  for (u = "", n = 0, r = t.attrs.length; n < r; n++)
    u += " " + mn(t.attrs[n][0]) + '="' + mn(t.attrs[n][1]) + '"';
  return u;
};
nr.prototype.renderToken = function(t, n, r) {
  const u = t[n];
  let o = "";
  if (u.hidden)
    return "";
  u.block && u.nesting !== -1 && n && t[n - 1].hidden && (o += `
`), o += (u.nesting === -1 ? "</" : "<") + u.tag, o += this.renderAttrs(u), u.nesting === 0 && r.xhtmlOut && (o += " /");
  let i = !1;
  if (u.block && (i = !0, u.nesting === 1 && n + 1 < t.length)) {
    const s = t[n + 1];
    (s.type === "inline" || s.hidden || s.nesting === -1 && s.tag === u.tag) && (i = !1);
  }
  return o += i ? `>
` : ">", o;
};
nr.prototype.renderInline = function(e, t, n) {
  let r = "";
  const u = this.rules;
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e[o].type;
    typeof u[s] < "u" ? r += u[s](e, o, t, n, this) : r += this.renderToken(e, o, t);
  }
  return r;
};
nr.prototype.renderInlineAsText = function(e, t, n) {
  let r = "";
  for (let u = 0, o = e.length; u < o; u++)
    switch (e[u].type) {
      case "text":
        r += e[u].content;
        break;
      case "image":
        r += this.renderInlineAsText(e[u].children, t, n);
        break;
      case "html_inline":
      case "html_block":
        r += e[u].content;
        break;
      case "softbreak":
      case "hardbreak":
        r += `
`;
        break;
    }
  return r;
};
nr.prototype.render = function(e, t, n) {
  let r = "";
  const u = this.rules;
  for (let o = 0, i = e.length; o < i; o++) {
    const s = e[o].type;
    s === "inline" ? r += this.renderInline(e[o].children, t, n) : typeof u[s] < "u" ? r += u[s](e, o, t, n, this) : r += this.renderToken(e, o, t, n);
  }
  return r;
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
    n.enabled && n.alt.forEach(function(r) {
      t.indexOf(r) < 0 && t.push(r);
    });
  }), e.__cache__ = {}, t.forEach(function(n) {
    e.__cache__[n] = [], e.__rules__.forEach(function(r) {
      r.enabled && (n && r.alt.indexOf(n) < 0 || e.__cache__[n].push(r.fn));
    });
  });
};
ft.prototype.at = function(e, t, n) {
  const r = this.__find__(e), u = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__[r].fn = t, this.__rules__[r].alt = u.alt || [], this.__cache__ = null;
};
ft.prototype.before = function(e, t, n, r) {
  const u = this.__find__(e), o = r || {};
  if (u === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(u, 0, {
    name: t,
    enabled: !0,
    fn: n,
    alt: o.alt || []
  }), this.__cache__ = null;
};
ft.prototype.after = function(e, t, n, r) {
  const u = this.__find__(e), o = r || {};
  if (u === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(u + 1, 0, {
    name: t,
    enabled: !0,
    fn: n,
    alt: o.alt || []
  }), this.__cache__ = null;
};
ft.prototype.push = function(e, t, n) {
  const r = n || {};
  this.__rules__.push({
    name: e,
    enabled: !0,
    fn: t,
    alt: r.alt || []
  }), this.__cache__ = null;
};
ft.prototype.enable = function(e, t) {
  Array.isArray(e) || (e = [e]);
  const n = [];
  return e.forEach(function(r) {
    const u = this.__find__(r);
    if (u < 0) {
      if (t)
        return;
      throw new Error("Rules manager: invalid rule name " + r);
    }
    this.__rules__[u].enabled = !0, n.push(r);
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
  return e.forEach(function(r) {
    const u = this.__find__(r);
    if (u < 0) {
      if (t)
        return;
      throw new Error("Rules manager: invalid rule name " + r);
    }
    this.__rules__[u].enabled = !1, n.push(r);
  }, this), this.__cache__ = null, n;
};
ft.prototype.getRules = function(e) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[e] || [];
};
function Rt(e, t, n) {
  this.type = e, this.tag = t, this.attrs = null, this.map = null, this.nesting = n, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
Rt.prototype.attrIndex = function(t) {
  if (!this.attrs)
    return -1;
  const n = this.attrs;
  for (let r = 0, u = n.length; r < u; r++)
    if (n[r][0] === t)
      return r;
  return -1;
};
Rt.prototype.attrPush = function(t) {
  this.attrs ? this.attrs.push(t) : this.attrs = [t];
};
Rt.prototype.attrSet = function(t, n) {
  const r = this.attrIndex(t), u = [t, n];
  r < 0 ? this.attrPush(u) : this.attrs[r] = u;
};
Rt.prototype.attrGet = function(t) {
  const n = this.attrIndex(t);
  let r = null;
  return n >= 0 && (r = this.attrs[n][1]), r;
};
Rt.prototype.attrJoin = function(t, n) {
  const r = this.attrIndex(t);
  r < 0 ? this.attrPush([t, n]) : this.attrs[r][1] = this.attrs[r][1] + " " + n;
};
function Dc(e, t, n) {
  this.src = e, this.env = n, this.tokens = [], this.inlineMode = !1, this.md = t;
}
Dc.prototype.Token = Rt;
const ip = /\r\n?|\n/g, sp = /\0/g;
function ap(e) {
  let t;
  t = e.src.replace(ip, `
`), t = t.replace(sp, "�"), e.src = t;
}
function cp(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function lp(e) {
  const t = e.tokens;
  for (let n = 0, r = t.length; n < r; n++) {
    const u = t[n];
    u.type === "inline" && e.md.inline.parse(u.content, e.md, e.env, u.children);
  }
}
function dp(e) {
  return /^<a[>\s]/i.test(e);
}
function fp(e) {
  return /^<\/a\s*>/i.test(e);
}
function hp(e) {
  const t = e.tokens;
  if (e.md.options.linkify)
    for (let n = 0, r = t.length; n < r; n++) {
      if (t[n].type !== "inline" || !e.md.linkify.pretest(t[n].content))
        continue;
      let u = t[n].children, o = 0;
      for (let i = u.length - 1; i >= 0; i--) {
        const s = u[i];
        if (s.type === "link_close") {
          for (i--; u[i].level !== s.level && u[i].type !== "link_open"; )
            i--;
          continue;
        }
        if (s.type === "html_inline" && (dp(s.content) && o > 0 && o--, fp(s.content) && o++), !(o > 0) && s.type === "text" && e.md.linkify.test(s.content)) {
          const a = s.content;
          let c = e.md.linkify.match(a);
          const l = [];
          let d = s.level, h = 0;
          c.length > 0 && c[0].index === 0 && i > 0 && u[i - 1].type === "text_special" && (c = c.slice(1));
          for (let f = 0; f < c.length; f++) {
            const p = c[f].url, _ = e.md.normalizeLink(p);
            if (!e.md.validateLink(_))
              continue;
            let M = c[f].text;
            c[f].schema ? c[f].schema === "mailto:" && !/^mailto:/i.test(M) ? M = e.md.normalizeLinkText("mailto:" + M).replace(/^mailto:/, "") : M = e.md.normalizeLinkText(M) : M = e.md.normalizeLinkText("http://" + M).replace(/^http:\/\//, "");
            const A = c[f].index;
            if (A > h) {
              const x = new e.Token("text", "", 0);
              x.content = a.slice(h, A), x.level = d, l.push(x);
            }
            const k = new e.Token("link_open", "a", 1);
            k.attrs = [["href", _]], k.level = d++, k.markup = "linkify", k.info = "auto", l.push(k);
            const F = new e.Token("text", "", 0);
            F.content = M, F.level = d, l.push(F);
            const E = new e.Token("link_close", "a", -1);
            E.level = --d, E.markup = "linkify", E.info = "auto", l.push(E), h = c[f].lastIndex;
          }
          if (h < a.length) {
            const f = new e.Token("text", "", 0);
            f.content = a.slice(h), f.level = d, l.push(f);
          }
          t[n].children = u = Ac(u, i, l);
        }
      }
    }
}
const Tc = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, pp = /\((c|tm|r)\)/i, gp = /\((c|tm|r)\)/ig, bp = {
  c: "©",
  r: "®",
  tm: "™"
};
function mp(e, t) {
  return bp[t.toLowerCase()];
}
function _p(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    const r = e[n];
    r.type === "text" && !t && (r.content = r.content.replace(gp, mp)), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function xp(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    const r = e[n];
    r.type === "text" && !t && Tc.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function yp(e) {
  let t;
  if (e.md.options.typographer)
    for (t = e.tokens.length - 1; t >= 0; t--)
      e.tokens[t].type === "inline" && (pp.test(e.tokens[t].content) && _p(e.tokens[t].children), Tc.test(e.tokens[t].content) && xp(e.tokens[t].children));
}
const vp = /['"]/, Ds = /['"]/g, Ts = "’";
function Wr(e, t, n) {
  return e.slice(0, t) + n + e.slice(t + 1);
}
function wp(e, t) {
  let n;
  const r = [];
  for (let u = 0; u < e.length; u++) {
    const o = e[u], i = e[u].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= i); n--)
      ;
    if (r.length = n + 1, o.type !== "text")
      continue;
    let s = o.content, a = 0, c = s.length;
    e:
      for (; a < c; ) {
        Ds.lastIndex = a;
        const l = Ds.exec(s);
        if (!l)
          break;
        let d = !0, h = !0;
        a = l.index + 1;
        const f = l[0] === "'";
        let p = 32;
        if (l.index - 1 >= 0)
          p = s.charCodeAt(l.index - 1);
        else
          for (n = u - 1; n >= 0 && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n--)
            if (e[n].content) {
              p = e[n].content.charCodeAt(e[n].content.length - 1);
              break;
            }
        let _ = 32;
        if (a < c)
          _ = s.charCodeAt(a);
        else
          for (n = u + 1; n < e.length && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n++)
            if (e[n].content) {
              _ = e[n].content.charCodeAt(0);
              break;
            }
        const M = Ar(p) || Cr(String.fromCharCode(p)), A = Ar(_) || Cr(String.fromCharCode(_)), k = Er(p), F = Er(_);
        if (F ? d = !1 : A && (k || M || (d = !1)), k ? h = !1 : M && (F || A || (h = !1)), _ === 34 && l[0] === '"' && p >= 48 && p <= 57 && (h = d = !1), d && h && (d = M, h = A), !d && !h) {
          f && (o.content = Wr(o.content, l.index, Ts));
          continue;
        }
        if (h)
          for (n = r.length - 1; n >= 0; n--) {
            let E = r[n];
            if (r[n].level < i)
              break;
            if (E.single === f && r[n].level === i) {
              E = r[n];
              let x, L;
              f ? (x = t.md.options.quotes[2], L = t.md.options.quotes[3]) : (x = t.md.options.quotes[0], L = t.md.options.quotes[1]), o.content = Wr(o.content, l.index, L), e[E.token].content = Wr(
                e[E.token].content,
                E.pos,
                x
              ), a += L.length - 1, E.token === u && (a += x.length - 1), s = o.content, c = s.length, r.length = n;
              continue e;
            }
          }
        d ? r.push({
          token: u,
          pos: l.index,
          single: f,
          level: i
        }) : h && f && (o.content = Wr(o.content, l.index, Ts));
      }
  }
}
function kp(e) {
  if (e.md.options.typographer)
    for (let t = e.tokens.length - 1; t >= 0; t--)
      e.tokens[t].type !== "inline" || !vp.test(e.tokens[t].content) || wp(e.tokens[t].children, e);
}
function Ep(e) {
  let t, n;
  const r = e.tokens, u = r.length;
  for (let o = 0; o < u; o++) {
    if (r[o].type !== "inline") continue;
    const i = r[o].children, s = i.length;
    for (t = 0; t < s; t++)
      i[t].type === "text_special" && (i[t].type = "text");
    for (t = n = 0; t < s; t++)
      i[t].type === "text" && t + 1 < s && i[t + 1].type === "text" ? i[t + 1].content = i[t].content + i[t + 1].content : (t !== n && (i[n] = i[t]), n++);
    t !== n && (i.length = n);
  }
}
const fo = [
  ["normalize", ap],
  ["block", cp],
  ["inline", lp],
  ["linkify", hp],
  ["replacements", yp],
  ["smartquotes", kp],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", Ep]
];
function bi() {
  this.ruler = new ft();
  for (let e = 0; e < fo.length; e++)
    this.ruler.push(fo[e][0], fo[e][1]);
}
bi.prototype.process = function(e) {
  const t = this.ruler.getRules("");
  for (let n = 0, r = t.length; n < r; n++)
    t[n](e);
};
bi.prototype.State = Dc;
function Gt(e, t, n, r) {
  this.src = e, this.md = t, this.env = n, this.tokens = r, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const u = this.src;
  for (let o = 0, i = 0, s = 0, a = 0, c = u.length, l = !1; i < c; i++) {
    const d = u.charCodeAt(i);
    if (!l)
      if (Re(d)) {
        s++, d === 9 ? a += 4 - a % 4 : a++;
        continue;
      } else
        l = !0;
    (d === 10 || i === c - 1) && (d !== 10 && i++, this.bMarks.push(o), this.eMarks.push(i), this.tShift.push(s), this.sCount.push(a), this.bsCount.push(0), l = !1, s = 0, a = 0, o = i + 1);
  }
  this.bMarks.push(u.length), this.eMarks.push(u.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
Gt.prototype.push = function(e, t, n) {
  const r = new Rt(e, t, n);
  return r.block = !0, n < 0 && this.level--, r.level = this.level, n > 0 && this.level++, this.tokens.push(r), r;
};
Gt.prototype.isEmpty = function(t) {
  return this.bMarks[t] + this.tShift[t] >= this.eMarks[t];
};
Gt.prototype.skipEmptyLines = function(t) {
  for (let n = this.lineMax; t < n && !(this.bMarks[t] + this.tShift[t] < this.eMarks[t]); t++)
    ;
  return t;
};
Gt.prototype.skipSpaces = function(t) {
  for (let n = this.src.length; t < n; t++) {
    const r = this.src.charCodeAt(t);
    if (!Re(r))
      break;
  }
  return t;
};
Gt.prototype.skipSpacesBack = function(t, n) {
  if (t <= n)
    return t;
  for (; t > n; )
    if (!Re(this.src.charCodeAt(--t)))
      return t + 1;
  return t;
};
Gt.prototype.skipChars = function(t, n) {
  for (let r = this.src.length; t < r && this.src.charCodeAt(t) === n; t++)
    ;
  return t;
};
Gt.prototype.skipCharsBack = function(t, n, r) {
  if (t <= r)
    return t;
  for (; t > r; )
    if (n !== this.src.charCodeAt(--t))
      return t + 1;
  return t;
};
Gt.prototype.getLines = function(t, n, r, u) {
  if (t >= n)
    return "";
  const o = new Array(n - t);
  for (let i = 0, s = t; s < n; s++, i++) {
    let a = 0;
    const c = this.bMarks[s];
    let l = c, d;
    for (s + 1 < n || u ? d = this.eMarks[s] + 1 : d = this.eMarks[s]; l < d && a < r; ) {
      const h = this.src.charCodeAt(l);
      if (Re(h))
        h === 9 ? a += 4 - (a + this.bsCount[s]) % 4 : a++;
      else if (l - c < this.tShift[s])
        a++;
      else
        break;
      l++;
    }
    a > r ? o[i] = new Array(a - r + 1).join(" ") + this.src.slice(l, d) : o[i] = this.src.slice(l, d);
  }
  return o.join("");
};
Gt.prototype.Token = Rt;
const Cp = 65536;
function ho(e, t) {
  const n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
  return e.src.slice(n, r);
}
function Ms(e) {
  const t = [], n = e.length;
  let r = 0, u = e.charCodeAt(r), o = !1, i = 0, s = "";
  for (; r < n; )
    u === 124 && (o ? (s += e.substring(i, r - 1), i = r) : (t.push(s + e.substring(i, r)), s = "", i = r + 1)), o = u === 92, r++, u = e.charCodeAt(r);
  return t.push(s + e.substring(i)), t;
}
function Ap(e, t, n, r) {
  if (t + 2 > n)
    return !1;
  let u = t + 1;
  if (e.sCount[u] < e.blkIndent || e.sCount[u] - e.blkIndent >= 4)
    return !1;
  let o = e.bMarks[u] + e.tShift[u];
  if (o >= e.eMarks[u])
    return !1;
  const i = e.src.charCodeAt(o++);
  if (i !== 124 && i !== 45 && i !== 58 || o >= e.eMarks[u])
    return !1;
  const s = e.src.charCodeAt(o++);
  if (s !== 124 && s !== 45 && s !== 58 && !Re(s) || i === 45 && Re(s))
    return !1;
  for (; o < e.eMarks[u]; ) {
    const E = e.src.charCodeAt(o);
    if (E !== 124 && E !== 45 && E !== 58 && !Re(E))
      return !1;
    o++;
  }
  let a = ho(e, t + 1), c = a.split("|");
  const l = [];
  for (let E = 0; E < c.length; E++) {
    const x = c[E].trim();
    if (!x) {
      if (E === 0 || E === c.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(x))
      return !1;
    x.charCodeAt(x.length - 1) === 58 ? l.push(x.charCodeAt(0) === 58 ? "center" : "right") : x.charCodeAt(0) === 58 ? l.push("left") : l.push("");
  }
  if (a = ho(e, t).trim(), a.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4)
    return !1;
  c = Ms(a), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  const d = c.length;
  if (d === 0 || d !== l.length)
    return !1;
  if (r)
    return !0;
  const h = e.parentType;
  e.parentType = "table";
  const f = e.md.block.ruler.getRules("blockquote"), p = e.push("table_open", "table", 1), _ = [t, 0];
  p.map = _;
  const M = e.push("thead_open", "thead", 1);
  M.map = [t, t + 1];
  const A = e.push("tr_open", "tr", 1);
  A.map = [t, t + 1];
  for (let E = 0; E < c.length; E++) {
    const x = e.push("th_open", "th", 1);
    l[E] && (x.attrs = [["style", "text-align:" + l[E]]]);
    const L = e.push("inline", "", 0);
    L.content = c[E].trim(), L.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let k, F = 0;
  for (u = t + 2; u < n && !(e.sCount[u] < e.blkIndent); u++) {
    let E = !1;
    for (let L = 0, te = f.length; L < te; L++)
      if (f[L](e, u, n, !0)) {
        E = !0;
        break;
      }
    if (E || (a = ho(e, u).trim(), !a) || e.sCount[u] - e.blkIndent >= 4 || (c = Ms(a), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), F += d - c.length, F > Cp))
      break;
    if (u === t + 2) {
      const L = e.push("tbody_open", "tbody", 1);
      L.map = k = [t + 2, 0];
    }
    const x = e.push("tr_open", "tr", 1);
    x.map = [u, u + 1];
    for (let L = 0; L < d; L++) {
      const te = e.push("td_open", "td", 1);
      l[L] && (te.attrs = [["style", "text-align:" + l[L]]]);
      const K = e.push("inline", "", 0);
      K.content = c[L] ? c[L].trim() : "", K.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return k && (e.push("tbody_close", "tbody", -1), k[1] = u), e.push("table_close", "table", -1), _[1] = u, e.parentType = h, e.line = u, !0;
}
function Sp(e, t, n) {
  if (e.sCount[t] - e.blkIndent < 4)
    return !1;
  let r = t + 1, u = r;
  for (; r < n; ) {
    if (e.isEmpty(r)) {
      r++;
      continue;
    }
    if (e.sCount[r] - e.blkIndent >= 4) {
      r++, u = r;
      continue;
    }
    break;
  }
  e.line = u;
  const o = e.push("code_block", "code", 0);
  return o.content = e.getLines(t, u, 4 + e.blkIndent, !1) + `
`, o.map = [t, e.line], !0;
}
function Dp(e, t, n, r) {
  let u = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || u + 3 > o)
    return !1;
  const i = e.src.charCodeAt(u);
  if (i !== 126 && i !== 96)
    return !1;
  let s = u;
  u = e.skipChars(u, i);
  let a = u - s;
  if (a < 3)
    return !1;
  const c = e.src.slice(s, u), l = e.src.slice(u, o);
  if (i === 96 && l.indexOf(String.fromCharCode(i)) >= 0)
    return !1;
  if (r)
    return !0;
  let d = t, h = !1;
  for (; d++, !(d >= n || (u = s = e.bMarks[d] + e.tShift[d], o = e.eMarks[d], u < o && e.sCount[d] < e.blkIndent)); )
    if (e.src.charCodeAt(u) === i && !(e.sCount[d] - e.blkIndent >= 4) && (u = e.skipChars(u, i), !(u - s < a) && (u = e.skipSpaces(u), !(u < o)))) {
      h = !0;
      break;
    }
  a = e.sCount[t], e.line = d + (h ? 1 : 0);
  const f = e.push("fence", "code", 0);
  return f.info = l, f.content = e.getLines(t + 1, d, a, !0), f.markup = c, f.map = [t, e.line], !0;
}
function Tp(e, t, n, r) {
  let u = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  const i = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(u) !== 62)
    return !1;
  if (r)
    return !0;
  const s = [], a = [], c = [], l = [], d = e.md.block.ruler.getRules("blockquote"), h = e.parentType;
  e.parentType = "blockquote";
  let f = !1, p;
  for (p = t; p < n; p++) {
    const F = e.sCount[p] < e.blkIndent;
    if (u = e.bMarks[p] + e.tShift[p], o = e.eMarks[p], u >= o)
      break;
    if (e.src.charCodeAt(u++) === 62 && !F) {
      let x = e.sCount[p] + 1, L, te;
      e.src.charCodeAt(u) === 32 ? (u++, x++, te = !1, L = !0) : e.src.charCodeAt(u) === 9 ? (L = !0, (e.bsCount[p] + x) % 4 === 3 ? (u++, x++, te = !1) : te = !0) : L = !1;
      let K = x;
      for (s.push(e.bMarks[p]), e.bMarks[p] = u; u < o; ) {
        const N = e.src.charCodeAt(u);
        if (Re(N))
          N === 9 ? K += 4 - (K + e.bsCount[p] + (te ? 1 : 0)) % 4 : K++;
        else
          break;
        u++;
      }
      f = u >= o, a.push(e.bsCount[p]), e.bsCount[p] = e.sCount[p] + 1 + (L ? 1 : 0), c.push(e.sCount[p]), e.sCount[p] = K - x, l.push(e.tShift[p]), e.tShift[p] = u - e.bMarks[p];
      continue;
    }
    if (f)
      break;
    let E = !1;
    for (let x = 0, L = d.length; x < L; x++)
      if (d[x](e, p, n, !0)) {
        E = !0;
        break;
      }
    if (E) {
      e.lineMax = p, e.blkIndent !== 0 && (s.push(e.bMarks[p]), a.push(e.bsCount[p]), l.push(e.tShift[p]), c.push(e.sCount[p]), e.sCount[p] -= e.blkIndent);
      break;
    }
    s.push(e.bMarks[p]), a.push(e.bsCount[p]), l.push(e.tShift[p]), c.push(e.sCount[p]), e.sCount[p] = -1;
  }
  const _ = e.blkIndent;
  e.blkIndent = 0;
  const M = e.push("blockquote_open", "blockquote", 1);
  M.markup = ">";
  const A = [t, 0];
  M.map = A, e.md.block.tokenize(e, t, p);
  const k = e.push("blockquote_close", "blockquote", -1);
  k.markup = ">", e.lineMax = i, e.parentType = h, A[1] = e.line;
  for (let F = 0; F < l.length; F++)
    e.bMarks[F + t] = s[F], e.tShift[F + t] = l[F], e.sCount[F + t] = c[F], e.bsCount[F + t] = a[F];
  return e.blkIndent = _, !0;
}
function Mp(e, t, n, r) {
  const u = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  let o = e.bMarks[t] + e.tShift[t];
  const i = e.src.charCodeAt(o++);
  if (i !== 42 && i !== 45 && i !== 95)
    return !1;
  let s = 1;
  for (; o < u; ) {
    const c = e.src.charCodeAt(o++);
    if (c !== i && !Re(c))
      return !1;
    c === i && s++;
  }
  if (s < 3)
    return !1;
  if (r)
    return !0;
  e.line = t + 1;
  const a = e.push("hr", "hr", 0);
  return a.map = [t, e.line], a.markup = Array(s + 1).join(String.fromCharCode(i)), !0;
}
function Fs(e, t) {
  const n = e.eMarks[t];
  let r = e.bMarks[t] + e.tShift[t];
  const u = e.src.charCodeAt(r++);
  if (u !== 42 && u !== 45 && u !== 43)
    return -1;
  if (r < n) {
    const o = e.src.charCodeAt(r);
    if (!Re(o))
      return -1;
  }
  return r;
}
function Rs(e, t) {
  const n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
  let u = n;
  if (u + 1 >= r)
    return -1;
  let o = e.src.charCodeAt(u++);
  if (o < 48 || o > 57)
    return -1;
  for (; ; ) {
    if (u >= r)
      return -1;
    if (o = e.src.charCodeAt(u++), o >= 48 && o <= 57) {
      if (u - n >= 10)
        return -1;
      continue;
    }
    if (o === 41 || o === 46)
      break;
    return -1;
  }
  return u < r && (o = e.src.charCodeAt(u), !Re(o)) ? -1 : u;
}
function Fp(e, t) {
  const n = e.level + 2;
  for (let r = t + 2, u = e.tokens.length - 2; r < u; r++)
    e.tokens[r].level === n && e.tokens[r].type === "paragraph_open" && (e.tokens[r + 2].hidden = !0, e.tokens[r].hidden = !0, r += 2);
}
function Rp(e, t, n, r) {
  let u, o, i, s, a = t, c = !0;
  if (e.sCount[a] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[a] - e.listIndent >= 4 && e.sCount[a] < e.blkIndent)
    return !1;
  let l = !1;
  r && e.parentType === "paragraph" && e.sCount[a] >= e.blkIndent && (l = !0);
  let d, h, f;
  if ((f = Rs(e, a)) >= 0) {
    if (d = !0, i = e.bMarks[a] + e.tShift[a], h = Number(e.src.slice(i, f - 1)), l && h !== 1) return !1;
  } else if ((f = Fs(e, a)) >= 0)
    d = !1;
  else
    return !1;
  if (l && e.skipSpaces(f) >= e.eMarks[a])
    return !1;
  if (r)
    return !0;
  const p = e.src.charCodeAt(f - 1), _ = e.tokens.length;
  d ? (s = e.push("ordered_list_open", "ol", 1), h !== 1 && (s.attrs = [["start", h]])) : s = e.push("bullet_list_open", "ul", 1);
  const M = [a, 0];
  s.map = M, s.markup = String.fromCharCode(p);
  let A = !1;
  const k = e.md.block.ruler.getRules("list"), F = e.parentType;
  for (e.parentType = "list"; a < n; ) {
    o = f, u = e.eMarks[a];
    const E = e.sCount[a] + f - (e.bMarks[a] + e.tShift[a]);
    let x = E;
    for (; o < u; ) {
      const he = e.src.charCodeAt(o);
      if (he === 9)
        x += 4 - (x + e.bsCount[a]) % 4;
      else if (he === 32)
        x++;
      else
        break;
      o++;
    }
    const L = o;
    let te;
    L >= u ? te = 1 : te = x - E, te > 4 && (te = 1);
    const K = E + te;
    s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(p);
    const N = [a, 0];
    s.map = N, d && (s.info = e.src.slice(i, f - 1));
    const ee = e.tight, ce = e.tShift[a], v = e.sCount[a], j = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = K, e.tight = !0, e.tShift[a] = L - e.bMarks[a], e.sCount[a] = x, L >= u && e.isEmpty(a + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, a, n, !0), (!e.tight || A) && (c = !1), A = e.line - a > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = j, e.tShift[a] = ce, e.sCount[a] = v, e.tight = ee, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(p), a = e.line, N[1] = a, a >= n || e.sCount[a] < e.blkIndent || e.sCount[a] - e.blkIndent >= 4)
      break;
    let oe = !1;
    for (let he = 0, Ne = k.length; he < Ne; he++)
      if (k[he](e, a, n, !0)) {
        oe = !0;
        break;
      }
    if (oe)
      break;
    if (d) {
      if (f = Rs(e, a), f < 0)
        break;
      i = e.bMarks[a] + e.tShift[a];
    } else if (f = Fs(e, a), f < 0)
      break;
    if (p !== e.src.charCodeAt(f - 1))
      break;
  }
  return d ? s = e.push("ordered_list_close", "ol", -1) : s = e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(p), M[1] = a, e.line = a, e.parentType = F, c && Fp(e, _), !0;
}
function Ip(e, t, n, r) {
  let u = e.bMarks[t] + e.tShift[t], o = e.eMarks[t], i = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(u) !== 91)
    return !1;
  function s(k) {
    const F = e.lineMax;
    if (k >= F || e.isEmpty(k))
      return null;
    let E = !1;
    if (e.sCount[k] - e.blkIndent > 3 && (E = !0), e.sCount[k] < 0 && (E = !0), !E) {
      const te = e.md.block.ruler.getRules("reference"), K = e.parentType;
      e.parentType = "reference";
      let N = !1;
      for (let ee = 0, ce = te.length; ee < ce; ee++)
        if (te[ee](e, k, F, !0)) {
          N = !0;
          break;
        }
      if (e.parentType = K, N)
        return null;
    }
    const x = e.bMarks[k] + e.tShift[k], L = e.eMarks[k];
    return e.src.slice(x, L + 1);
  }
  let a = e.src.slice(u, o + 1);
  o = a.length;
  let c = -1;
  for (u = 1; u < o; u++) {
    const k = a.charCodeAt(u);
    if (k === 91)
      return !1;
    if (k === 93) {
      c = u;
      break;
    } else if (k === 10) {
      const F = s(i);
      F !== null && (a += F, o = a.length, i++);
    } else if (k === 92 && (u++, u < o && a.charCodeAt(u) === 10)) {
      const F = s(i);
      F !== null && (a += F, o = a.length, i++);
    }
  }
  if (c < 0 || a.charCodeAt(c + 1) !== 58)
    return !1;
  for (u = c + 2; u < o; u++) {
    const k = a.charCodeAt(u);
    if (k === 10) {
      const F = s(i);
      F !== null && (a += F, o = a.length, i++);
    } else if (!Re(k)) break;
  }
  const l = e.md.helpers.parseLinkDestination(a, u, o);
  if (!l.ok)
    return !1;
  const d = e.md.normalizeLink(l.str);
  if (!e.md.validateLink(d))
    return !1;
  u = l.pos;
  const h = u, f = i, p = u;
  for (; u < o; u++) {
    const k = a.charCodeAt(u);
    if (k === 10) {
      const F = s(i);
      F !== null && (a += F, o = a.length, i++);
    } else if (!Re(k)) break;
  }
  let _ = e.md.helpers.parseLinkTitle(a, u, o);
  for (; _.can_continue; ) {
    const k = s(i);
    if (k === null) break;
    a += k, u = o, o = a.length, i++, _ = e.md.helpers.parseLinkTitle(a, u, o, _);
  }
  let M;
  for (u < o && p !== u && _.ok ? (M = _.str, u = _.pos) : (M = "", u = h, i = f); u < o; ) {
    const k = a.charCodeAt(u);
    if (!Re(k))
      break;
    u++;
  }
  if (u < o && a.charCodeAt(u) !== 10 && M)
    for (M = "", u = h, i = f; u < o; ) {
      const k = a.charCodeAt(u);
      if (!Re(k))
        break;
      u++;
    }
  if (u < o && a.charCodeAt(u) !== 10)
    return !1;
  const A = Ou(a.slice(1, c));
  return A ? (r || (typeof e.env.references > "u" && (e.env.references = {}), typeof e.env.references[A] > "u" && (e.env.references[A] = { title: M, href: d }), e.line = i), !0) : !1;
}
const Np = [
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
], Op = "[a-zA-Z_:][a-zA-Z0-9:._-]*", Lp = "[^\"'=<>`\\x00-\\x20]+", Bp = "'[^']*'", Pp = '"[^"]*"', $p = "(?:" + Lp + "|" + Bp + "|" + Pp + ")", zp = "(?:\\s+" + Op + "(?:\\s*=\\s*" + $p + ")?)", Mc = "<[A-Za-z][A-Za-z0-9\\-]*" + zp + "*\\s*\\/?>", Fc = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", Up = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", Hp = "<[?][\\s\\S]*?[?]>", jp = "<![A-Za-z][^>]*>", qp = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", Gp = new RegExp("^(?:" + Mc + "|" + Fc + "|" + Up + "|" + Hp + "|" + jp + "|" + qp + ")"), Vp = new RegExp("^(?:" + Mc + "|" + Fc + ")"), Bn = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + Np.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(Vp.source + "\\s*$"), /^$/, !1]
];
function Kp(e, t, n, r) {
  let u = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(u) !== 60)
    return !1;
  let i = e.src.slice(u, o), s = 0;
  for (; s < Bn.length && !Bn[s][0].test(i); s++)
    ;
  if (s === Bn.length)
    return !1;
  if (r)
    return Bn[s][2];
  let a = t + 1;
  if (!Bn[s][1].test(i)) {
    for (; a < n && !(e.sCount[a] < e.blkIndent); a++)
      if (u = e.bMarks[a] + e.tShift[a], o = e.eMarks[a], i = e.src.slice(u, o), Bn[s][1].test(i)) {
        i.length !== 0 && a++;
        break;
      }
  }
  e.line = a;
  const c = e.push("html_block", "", 0);
  return c.map = [t, a], c.content = e.getLines(t, a, e.blkIndent, !0), !0;
}
function Wp(e, t, n, r) {
  let u = e.bMarks[t] + e.tShift[t], o = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  let i = e.src.charCodeAt(u);
  if (i !== 35 || u >= o)
    return !1;
  let s = 1;
  for (i = e.src.charCodeAt(++u); i === 35 && u < o && s <= 6; )
    s++, i = e.src.charCodeAt(++u);
  if (s > 6 || u < o && !Re(i))
    return !1;
  if (r)
    return !0;
  o = e.skipSpacesBack(o, u);
  const a = e.skipCharsBack(o, 35, u);
  a > u && Re(e.src.charCodeAt(a - 1)) && (o = a), e.line = t + 1;
  const c = e.push("heading_open", "h" + String(s), 1);
  c.markup = "########".slice(0, s), c.map = [t, e.line];
  const l = e.push("inline", "", 0);
  l.content = e.src.slice(u, o).trim(), l.map = [t, e.line], l.children = [];
  const d = e.push("heading_close", "h" + String(s), -1);
  return d.markup = "########".slice(0, s), !0;
}
function Zp(e, t, n) {
  const r = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4)
    return !1;
  const u = e.parentType;
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
    for (let f = 0, p = r.length; f < p; f++)
      if (r[f](e, s, n, !0)) {
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
  return d.markup = String.fromCharCode(i), e.parentType = u, !0;
}
function Jp(e, t, n) {
  const r = e.md.block.ruler.getRules("paragraph"), u = e.parentType;
  let o = t + 1;
  for (e.parentType = "paragraph"; o < n && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3 || e.sCount[o] < 0)
      continue;
    let c = !1;
    for (let l = 0, d = r.length; l < d; l++)
      if (r[l](e, o, n, !0)) {
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
  return a.content = i, a.map = [t, e.line], a.children = [], e.push("paragraph_close", "p", -1), e.parentType = u, !0;
}
const Zr = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", Ap, ["paragraph", "reference"]],
  ["code", Sp],
  ["fence", Dp, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", Tp, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", Mp, ["paragraph", "reference", "blockquote", "list"]],
  ["list", Rp, ["paragraph", "reference", "blockquote"]],
  ["reference", Ip],
  ["html_block", Kp, ["paragraph", "reference", "blockquote"]],
  ["heading", Wp, ["paragraph", "reference", "blockquote"]],
  ["lheading", Zp],
  ["paragraph", Jp]
];
function Lu() {
  this.ruler = new ft();
  for (let e = 0; e < Zr.length; e++)
    this.ruler.push(Zr[e][0], Zr[e][1], { alt: (Zr[e][2] || []).slice() });
}
Lu.prototype.tokenize = function(e, t, n) {
  const r = this.ruler.getRules(""), u = r.length, o = e.md.options.maxNesting;
  let i = t, s = !1;
  for (; i < n && (e.line = i = e.skipEmptyLines(i), !(i >= n || e.sCount[i] < e.blkIndent)); ) {
    if (e.level >= o) {
      e.line = n;
      break;
    }
    const a = e.line;
    let c = !1;
    for (let l = 0; l < u; l++)
      if (c = r[l](e, i, n, !1), c) {
        if (a >= e.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!c) throw new Error("none of the block rules matched");
    e.tight = !s, e.isEmpty(e.line - 1) && (s = !0), i = e.line, i < n && e.isEmpty(i) && (s = !0, i++, e.line = i);
  }
};
Lu.prototype.parse = function(e, t, n, r) {
  if (!e)
    return;
  const u = new this.State(e, t, n, r);
  this.tokenize(u, u.line, u.lineMax);
};
Lu.prototype.State = Gt;
function Nr(e, t, n, r) {
  this.src = e, this.env = n, this.md = t, this.tokens = r, this.tokens_meta = Array(r.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
Nr.prototype.pushPending = function() {
  const e = new Rt("text", "", 0);
  return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
};
Nr.prototype.push = function(e, t, n) {
  this.pending && this.pushPending();
  const r = new Rt(e, t, n);
  let u = null;
  return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), r.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], u = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(r), this.tokens_meta.push(u), r;
};
Nr.prototype.scanDelims = function(e, t) {
  const n = this.posMax, r = this.src.charCodeAt(e), u = e > 0 ? this.src.charCodeAt(e - 1) : 32;
  let o = e;
  for (; o < n && this.src.charCodeAt(o) === r; )
    o++;
  const i = o - e, s = o < n ? this.src.charCodeAt(o) : 32, a = Ar(u) || Cr(String.fromCharCode(u)), c = Ar(s) || Cr(String.fromCharCode(s)), l = Er(u), d = Er(s), h = !d && (!c || l || a), f = !l && (!a || d || c);
  return { can_open: h && (t || !f || a), can_close: f && (t || !h || c), length: i };
};
Nr.prototype.Token = Rt;
function Yp(e) {
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
function Xp(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !Yp(e.src.charCodeAt(n)); )
    n++;
  return n === e.pos ? !1 : (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
const Qp = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function eg(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  const n = e.pos, r = e.posMax;
  if (n + 3 > r || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  const u = e.pending.match(Qp);
  if (!u) return !1;
  const o = u[1], i = e.md.linkify.matchAtStart(e.src.slice(n - o.length));
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
function tg(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 10)
    return !1;
  const r = e.pending.length - 1, u = e.posMax;
  if (!t)
    if (r >= 0 && e.pending.charCodeAt(r) === 32)
      if (r >= 1 && e.pending.charCodeAt(r - 1) === 32) {
        let o = r - 1;
        for (; o >= 1 && e.pending.charCodeAt(o - 1) === 32; ) o--;
        e.pending = e.pending.slice(0, o), e.push("hardbreak", "br", 0);
      } else
        e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
    else
      e.push("softbreak", "br", 0);
  for (n++; n < u && Re(e.src.charCodeAt(n)); )
    n++;
  return e.pos = n, !0;
}
const mi = [];
for (let e = 0; e < 256; e++)
  mi.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  mi[e.charCodeAt(0)] = 1;
});
function ng(e, t) {
  let n = e.pos;
  const r = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let u = e.src.charCodeAt(n);
  if (u === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < r && (u = e.src.charCodeAt(n), !!Re(u)); )
      n++;
    return e.pos = n, !0;
  }
  let o = e.src[n];
  if (u >= 55296 && u <= 56319 && n + 1 < r) {
    const s = e.src.charCodeAt(n + 1);
    s >= 56320 && s <= 57343 && (o += e.src[n + 1], n++);
  }
  const i = "\\" + o;
  if (!t) {
    const s = e.push("text_special", "", 0);
    u < 256 && mi[u] !== 0 ? s.content = o : s.content = i, s.markup = i, s.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function rg(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 96)
    return !1;
  const u = n;
  n++;
  const o = e.posMax;
  for (; n < o && e.src.charCodeAt(n) === 96; )
    n++;
  const i = e.src.slice(u, n), s = i.length;
  if (e.backticksScanned && (e.backticks[s] || 0) <= u)
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
function ug(e, t) {
  const n = e.pos, r = e.src.charCodeAt(n);
  if (t || r !== 126)
    return !1;
  const u = e.scanDelims(e.pos, !0);
  let o = u.length;
  const i = String.fromCharCode(r);
  if (o < 2)
    return !1;
  let s;
  o % 2 && (s = e.push("text", "", 0), s.content = i, o--);
  for (let a = 0; a < o; a += 2)
    s = e.push("text", "", 0), s.content = i + i, e.delimiters.push({
      marker: r,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: e.tokens.length - 1,
      end: -1,
      open: u.can_open,
      close: u.can_close
    });
  return e.pos += u.length, !0;
}
function Is(e, t) {
  let n;
  const r = [], u = t.length;
  for (let o = 0; o < u; o++) {
    const i = t[o];
    if (i.marker !== 126 || i.end === -1)
      continue;
    const s = t[i.end];
    n = e.tokens[i.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[s.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[s.token - 1].type === "text" && e.tokens[s.token - 1].content === "~" && r.push(s.token - 1);
  }
  for (; r.length; ) {
    const o = r.pop();
    let i = o + 1;
    for (; i < e.tokens.length && e.tokens[i].type === "s_close"; )
      i++;
    i--, o !== i && (n = e.tokens[i], e.tokens[i] = e.tokens[o], e.tokens[o] = n);
  }
}
function og(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  Is(e, e.delimiters);
  for (let r = 0; r < n; r++)
    t[r] && t[r].delimiters && Is(e, t[r].delimiters);
}
const Rc = {
  tokenize: ug,
  postProcess: og
};
function ig(e, t) {
  const n = e.pos, r = e.src.charCodeAt(n);
  if (t || r !== 95 && r !== 42)
    return !1;
  const u = e.scanDelims(e.pos, r === 42);
  for (let o = 0; o < u.length; o++) {
    const i = e.push("text", "", 0);
    i.content = String.fromCharCode(r), e.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: r,
      // Total length of these series of delimiters.
      //
      length: u.length,
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
      open: u.can_open,
      close: u.can_close
    });
  }
  return e.pos += u.length, !0;
}
function Ns(e, t) {
  const n = t.length;
  for (let r = n - 1; r >= 0; r--) {
    const u = t[r];
    if (u.marker !== 95 && u.marker !== 42 || u.end === -1)
      continue;
    const o = t[u.end], i = r > 0 && t[r - 1].end === u.end + 1 && // check that first two markers match and adjacent
    t[r - 1].marker === u.marker && t[r - 1].token === u.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    t[u.end + 1].token === o.token + 1, s = String.fromCharCode(u.marker), a = e.tokens[u.token];
    a.type = i ? "strong_open" : "em_open", a.tag = i ? "strong" : "em", a.nesting = 1, a.markup = i ? s + s : s, a.content = "";
    const c = e.tokens[o.token];
    c.type = i ? "strong_close" : "em_close", c.tag = i ? "strong" : "em", c.nesting = -1, c.markup = i ? s + s : s, c.content = "", i && (e.tokens[t[r - 1].token].content = "", e.tokens[t[u.end + 1].token].content = "", r--);
  }
}
function sg(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  Ns(e, e.delimiters);
  for (let r = 0; r < n; r++)
    t[r] && t[r].delimiters && Ns(e, t[r].delimiters);
}
const Ic = {
  tokenize: ig,
  postProcess: sg
};
function ag(e, t) {
  let n, r, u, o, i = "", s = "", a = e.pos, c = !0;
  if (e.src.charCodeAt(e.pos) !== 91)
    return !1;
  const l = e.pos, d = e.posMax, h = e.pos + 1, f = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (f < 0)
    return !1;
  let p = f + 1;
  if (p < d && e.src.charCodeAt(p) === 40) {
    for (c = !1, p++; p < d && (n = e.src.charCodeAt(p), !(!Re(n) && n !== 10)); p++)
      ;
    if (p >= d)
      return !1;
    if (a = p, u = e.md.helpers.parseLinkDestination(e.src, p, e.posMax), u.ok) {
      for (i = e.md.normalizeLink(u.str), e.md.validateLink(i) ? p = u.pos : i = "", a = p; p < d && (n = e.src.charCodeAt(p), !(!Re(n) && n !== 10)); p++)
        ;
      if (u = e.md.helpers.parseLinkTitle(e.src, p, e.posMax), p < d && a !== p && u.ok)
        for (s = u.str, p = u.pos; p < d && (n = e.src.charCodeAt(p), !(!Re(n) && n !== 10)); p++)
          ;
    }
    (p >= d || e.src.charCodeAt(p) !== 41) && (c = !0), p++;
  }
  if (c) {
    if (typeof e.env.references > "u")
      return !1;
    if (p < d && e.src.charCodeAt(p) === 91 ? (a = p + 1, p = e.md.helpers.parseLinkLabel(e, p), p >= 0 ? r = e.src.slice(a, p++) : p = f + 1) : p = f + 1, r || (r = e.src.slice(h, f)), o = e.env.references[Ou(r)], !o)
      return e.pos = l, !1;
    i = o.href, s = o.title;
  }
  if (!t) {
    e.pos = h, e.posMax = f;
    const _ = e.push("link_open", "a", 1), M = [["href", i]];
    _.attrs = M, s && M.push(["title", s]), e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = p, e.posMax = d, !0;
}
function cg(e, t) {
  let n, r, u, o, i, s, a, c, l = "";
  const d = e.pos, h = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91)
    return !1;
  const f = e.pos + 2, p = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (p < 0)
    return !1;
  if (o = p + 1, o < h && e.src.charCodeAt(o) === 40) {
    for (o++; o < h && (n = e.src.charCodeAt(o), !(!Re(n) && n !== 10)); o++)
      ;
    if (o >= h)
      return !1;
    for (c = o, s = e.md.helpers.parseLinkDestination(e.src, o, e.posMax), s.ok && (l = e.md.normalizeLink(s.str), e.md.validateLink(l) ? o = s.pos : l = ""), c = o; o < h && (n = e.src.charCodeAt(o), !(!Re(n) && n !== 10)); o++)
      ;
    if (s = e.md.helpers.parseLinkTitle(e.src, o, e.posMax), o < h && c !== o && s.ok)
      for (a = s.str, o = s.pos; o < h && (n = e.src.charCodeAt(o), !(!Re(n) && n !== 10)); o++)
        ;
    else
      a = "";
    if (o >= h || e.src.charCodeAt(o) !== 41)
      return e.pos = d, !1;
    o++;
  } else {
    if (typeof e.env.references > "u")
      return !1;
    if (o < h && e.src.charCodeAt(o) === 91 ? (c = o + 1, o = e.md.helpers.parseLinkLabel(e, o), o >= 0 ? u = e.src.slice(c, o++) : o = p + 1) : o = p + 1, u || (u = e.src.slice(f, p)), i = e.env.references[Ou(u)], !i)
      return e.pos = d, !1;
    l = i.href, a = i.title;
  }
  if (!t) {
    r = e.src.slice(f, p);
    const _ = [];
    e.md.inline.parse(
      r,
      e.md,
      e.env,
      _
    );
    const M = e.push("image", "img", 0), A = [["src", l], ["alt", ""]];
    M.attrs = A, M.children = _, M.content = r, a && A.push(["title", a]);
  }
  return e.pos = o, e.posMax = h, !0;
}
const lg = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, dg = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function fg(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 60)
    return !1;
  const r = e.pos, u = e.posMax;
  for (; ; ) {
    if (++n >= u) return !1;
    const i = e.src.charCodeAt(n);
    if (i === 60) return !1;
    if (i === 62) break;
  }
  const o = e.src.slice(r + 1, n);
  if (dg.test(o)) {
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
  if (lg.test(o)) {
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
function hg(e) {
  return /^<a[>\s]/i.test(e);
}
function pg(e) {
  return /^<\/a\s*>/i.test(e);
}
function gg(e) {
  const t = e | 32;
  return t >= 97 && t <= 122;
}
function bg(e, t) {
  if (!e.md.options.html)
    return !1;
  const n = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 60 || r + 2 >= n)
    return !1;
  const u = e.src.charCodeAt(r + 1);
  if (u !== 33 && u !== 63 && u !== 47 && !gg(u))
    return !1;
  const o = e.src.slice(r).match(Gp);
  if (!o)
    return !1;
  if (!t) {
    const i = e.push("html_inline", "", 0);
    i.content = o[0], hg(i.content) && e.linkLevel++, pg(i.content) && e.linkLevel--;
  }
  return e.pos += o[0].length, !0;
}
const mg = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, _g = /^&([a-z][a-z0-9]{1,31});/i;
function xg(e, t) {
  const n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    const o = e.src.slice(n).match(mg);
    if (o) {
      if (!t) {
        const i = o[1][0].toLowerCase() === "x" ? parseInt(o[1].slice(1), 16) : parseInt(o[1], 10), s = e.push("text_special", "", 0);
        s.content = gi(i) ? pu(i) : pu(65533), s.markup = o[0], s.info = "entity";
      }
      return e.pos += o[0].length, !0;
    }
  } else {
    const o = e.src.slice(n).match(_g);
    if (o) {
      const i = Cc(o[0]);
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
function Os(e) {
  const t = {}, n = e.length;
  if (!n) return;
  let r = 0, u = -2;
  const o = [];
  for (let i = 0; i < n; i++) {
    const s = e[i];
    if (o.push(0), (e[r].marker !== s.marker || u !== s.token - 1) && (r = i), u = s.token, s.length = s.length || 0, !s.close) continue;
    t.hasOwnProperty(s.marker) || (t[s.marker] = [-1, -1, -1, -1, -1, -1]);
    const a = t[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let c = r - o[r] - 1, l = c;
    for (; c > a; c -= o[c] + 1) {
      const d = e[c];
      if (d.marker === s.marker && d.open && d.end < 0) {
        let h = !1;
        if ((d.close || s.open) && (d.length + s.length) % 3 === 0 && (d.length % 3 !== 0 || s.length % 3 !== 0) && (h = !0), !h) {
          const f = c > 0 && !e[c - 1].open ? o[c - 1] + 1 : 0;
          o[i] = i - c + f, o[c] = f, s.open = !1, d.end = i, d.close = !1, l = -1, u = -2;
          break;
        }
      }
    }
    l !== -1 && (t[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = l);
  }
}
function yg(e) {
  const t = e.tokens_meta, n = e.tokens_meta.length;
  Os(e.delimiters);
  for (let r = 0; r < n; r++)
    t[r] && t[r].delimiters && Os(t[r].delimiters);
}
function vg(e) {
  let t, n, r = 0;
  const u = e.tokens, o = e.tokens.length;
  for (t = n = 0; t < o; t++)
    u[t].nesting < 0 && r--, u[t].level = r, u[t].nesting > 0 && r++, u[t].type === "text" && t + 1 < o && u[t + 1].type === "text" ? u[t + 1].content = u[t].content + u[t + 1].content : (t !== n && (u[n] = u[t]), n++);
  t !== n && (u.length = n);
}
const po = [
  ["text", Xp],
  ["linkify", eg],
  ["newline", tg],
  ["escape", ng],
  ["backticks", rg],
  ["strikethrough", Rc.tokenize],
  ["emphasis", Ic.tokenize],
  ["link", ag],
  ["image", cg],
  ["autolink", fg],
  ["html_inline", bg],
  ["entity", xg]
], go = [
  ["balance_pairs", yg],
  ["strikethrough", Rc.postProcess],
  ["emphasis", Ic.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", vg]
];
function Or() {
  this.ruler = new ft();
  for (let e = 0; e < po.length; e++)
    this.ruler.push(po[e][0], po[e][1]);
  this.ruler2 = new ft();
  for (let e = 0; e < go.length; e++)
    this.ruler2.push(go[e][0], go[e][1]);
}
Or.prototype.skipToken = function(e) {
  const t = e.pos, n = this.ruler.getRules(""), r = n.length, u = e.md.options.maxNesting, o = e.cache;
  if (typeof o[t] < "u") {
    e.pos = o[t];
    return;
  }
  let i = !1;
  if (e.level < u) {
    for (let s = 0; s < r; s++)
      if (e.level++, i = n[s](e, !0), e.level--, i) {
        if (t >= e.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    e.pos = e.posMax;
  i || e.pos++, o[t] = e.pos;
};
Or.prototype.tokenize = function(e) {
  const t = this.ruler.getRules(""), n = t.length, r = e.posMax, u = e.md.options.maxNesting;
  for (; e.pos < r; ) {
    const o = e.pos;
    let i = !1;
    if (e.level < u) {
      for (let s = 0; s < n; s++)
        if (i = t[s](e, !1), i) {
          if (o >= e.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (i) {
      if (e.pos >= r)
        break;
      continue;
    }
    e.pending += e.src[e.pos++];
  }
  e.pending && e.pushPending();
};
Or.prototype.parse = function(e, t, n, r) {
  const u = new this.State(e, t, n, r);
  this.tokenize(u);
  const o = this.ruler2.getRules(""), i = o.length;
  for (let s = 0; s < i; s++)
    o[s](u);
};
Or.prototype.State = Nr;
function wg(e) {
  const t = {};
  e = e || {}, t.src_Any = yc.source, t.src_Cc = vc.source, t.src_Z = kc.source, t.src_P = hi.source, t.src_ZPCc = [t.src_Z, t.src_P, t.src_Cc].join("|"), t.src_ZCc = [t.src_Z, t.src_Cc].join("|");
  const n = "[><｜]";
  return t.src_pseudo_letter = "(?:(?!" + n + "|" + t.src_ZPCc + ")" + t.src_Any + ")", t.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", t.src_auth = "(?:(?:(?!" + t.src_ZCc + "|[@/\\[\\]()]).)+@)?", t.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", t.src_host_terminator = "(?=$|" + n + "|" + t.src_ZPCc + ")(?!" + (e["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + t.src_ZPCc + "))", t.src_path = "(?:[/?#](?:(?!" + t.src_ZCc + "|" + n + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + t.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + t.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + t.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + t.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + t.src_ZCc + "|[']).)+\\'|\\'(?=" + t.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + t.src_ZCc + "|[.]|$)|" + (e["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + t.src_ZCc + "|$)|;(?!" + t.src_ZCc + "|$)|\\!+(?!" + t.src_ZCc + "|[!]|$)|\\?(?!" + t.src_ZCc + "|[?]|$))+|\\/)?", t.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', t.src_xn = "xn--[a-z0-9\\-]{1,59}", t.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + t.src_xn + "|" + t.src_pseudo_letter + "{1,63})", t.src_domain = "(?:" + t.src_xn + "|(?:" + t.src_pseudo_letter + ")|(?:" + t.src_pseudo_letter + "(?:-|" + t.src_pseudo_letter + "){0,61}" + t.src_pseudo_letter + "))", t.src_host = "(?:(?:(?:(?:" + t.src_domain + ")\\.)*" + t.src_domain + "))", t.tpl_host_fuzzy = "(?:" + t.src_ip4 + "|(?:(?:(?:" + t.src_domain + ")\\.)+(?:%TLDS%)))", t.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + t.src_domain + ")\\.)+(?:%TLDS%))", t.src_host_strict = t.src_host + t.src_host_terminator, t.tpl_host_fuzzy_strict = t.tpl_host_fuzzy + t.src_host_terminator, t.src_host_port_strict = t.src_host + t.src_port + t.src_host_terminator, t.tpl_host_port_fuzzy_strict = t.tpl_host_fuzzy + t.src_port + t.src_host_terminator, t.tpl_host_port_no_ip_fuzzy_strict = t.tpl_host_no_ip_fuzzy + t.src_port + t.src_host_terminator, t.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + t.src_ZPCc + "|>|$))", t.tpl_email_fuzzy = "(^|" + n + '|"|\\(|' + t.src_ZCc + ")(" + t.src_email_name + "@" + t.tpl_host_fuzzy_strict + ")", t.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + t.src_ZPCc + "))((?![$+<=>^`|｜])" + t.tpl_host_port_fuzzy_strict + t.src_path + ")", t.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + t.src_ZPCc + "))((?![$+<=>^`|｜])" + t.tpl_host_port_no_ip_fuzzy_strict + t.src_path + ")", t;
}
function Oo(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    n && Object.keys(n).forEach(function(r) {
      e[r] = n[r];
    });
  }), e;
}
function Bu(e) {
  return Object.prototype.toString.call(e);
}
function kg(e) {
  return Bu(e) === "[object String]";
}
function Eg(e) {
  return Bu(e) === "[object Object]";
}
function Cg(e) {
  return Bu(e) === "[object RegExp]";
}
function Ls(e) {
  return Bu(e) === "[object Function]";
}
function Ag(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const Nc = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function Sg(e) {
  return Object.keys(e || {}).reduce(function(t, n) {
    return t || Nc.hasOwnProperty(n);
  }, !1);
}
const Dg = {
  "http:": {
    validate: function(e, t, n) {
      const r = e.slice(t);
      return n.re.http || (n.re.http = new RegExp(
        "^\\/\\/" + n.re.src_auth + n.re.src_host_port_strict + n.re.src_path,
        "i"
      )), n.re.http.test(r) ? r.match(n.re.http)[0].length : 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(e, t, n) {
      const r = e.slice(t);
      return n.re.no_http || (n.re.no_http = new RegExp(
        "^" + n.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        "(?:localhost|(?:(?:" + n.re.src_domain + ")\\.)+" + n.re.src_domain_root + ")" + n.re.src_port + n.re.src_host_terminator + n.re.src_path,
        "i"
      )), n.re.no_http.test(r) ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : r.match(n.re.no_http)[0].length : 0;
    }
  },
  "mailto:": {
    validate: function(e, t, n) {
      const r = e.slice(t);
      return n.re.mailto || (n.re.mailto = new RegExp(
        "^" + n.re.src_email_name + "@" + n.re.src_host_strict,
        "i"
      )), n.re.mailto.test(r) ? r.match(n.re.mailto)[0].length : 0;
    }
  }
}, Tg = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", Mg = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function Fg(e) {
  e.__index__ = -1, e.__text_cache__ = "";
}
function Rg(e) {
  return function(t, n) {
    const r = t.slice(n);
    return e.test(r) ? r.match(e)[0].length : 0;
  };
}
function Bs() {
  return function(e, t) {
    t.normalize(e);
  };
}
function gu(e) {
  const t = e.re = wg(e.__opts__), n = e.__tlds__.slice();
  e.onCompile(), e.__tlds_replaced__ || n.push(Tg), n.push(t.src_xn), t.src_tlds = n.join("|");
  function r(s) {
    return s.replace("%TLDS%", t.src_tlds);
  }
  t.email_fuzzy = RegExp(r(t.tpl_email_fuzzy), "i"), t.link_fuzzy = RegExp(r(t.tpl_link_fuzzy), "i"), t.link_no_ip_fuzzy = RegExp(r(t.tpl_link_no_ip_fuzzy), "i"), t.host_fuzzy_test = RegExp(r(t.tpl_host_fuzzy_test), "i");
  const u = [];
  e.__compiled__ = {};
  function o(s, a) {
    throw new Error('(LinkifyIt) Invalid schema "' + s + '": ' + a);
  }
  Object.keys(e.__schemas__).forEach(function(s) {
    const a = e.__schemas__[s];
    if (a === null)
      return;
    const c = { validate: null, link: null };
    if (e.__compiled__[s] = c, Eg(a)) {
      Cg(a.validate) ? c.validate = Rg(a.validate) : Ls(a.validate) ? c.validate = a.validate : o(s, a), Ls(a.normalize) ? c.normalize = a.normalize : a.normalize ? o(s, a) : c.normalize = Bs();
      return;
    }
    if (kg(a)) {
      u.push(s);
      return;
    }
    o(s, a);
  }), u.forEach(function(s) {
    e.__compiled__[e.__schemas__[s]] && (e.__compiled__[s].validate = e.__compiled__[e.__schemas__[s]].validate, e.__compiled__[s].normalize = e.__compiled__[e.__schemas__[s]].normalize);
  }), e.__compiled__[""] = { validate: null, normalize: Bs() };
  const i = Object.keys(e.__compiled__).filter(function(s) {
    return s.length > 0 && e.__compiled__[s];
  }).map(Ag).join("|");
  e.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + t.src_ZPCc + "))(" + i + ")", "i"), e.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + t.src_ZPCc + "))(" + i + ")", "ig"), e.re.schema_at_start = RegExp("^" + e.re.schema_search.source, "i"), e.re.pretest = RegExp(
    "(" + e.re.schema_test.source + ")|(" + e.re.host_fuzzy_test.source + ")|@",
    "i"
  ), Fg(e);
}
function Ig(e, t) {
  const n = e.__index__, r = e.__last_index__, u = e.__text_cache__.slice(n, r);
  this.schema = e.__schema__.toLowerCase(), this.index = n + t, this.lastIndex = r + t, this.raw = u, this.text = u, this.url = u;
}
function Lo(e, t) {
  const n = new Ig(e, t);
  return e.__compiled__[n.schema].normalize(n, e), n;
}
function _t(e, t) {
  if (!(this instanceof _t))
    return new _t(e, t);
  t || Sg(e) && (t = e, e = {}), this.__opts__ = Oo({}, Nc, t), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = Oo({}, Dg, e), this.__compiled__ = {}, this.__tlds__ = Mg, this.__tlds_replaced__ = !1, this.re = {}, gu(this);
}
_t.prototype.add = function(t, n) {
  return this.__schemas__[t] = n, gu(this), this;
};
_t.prototype.set = function(t) {
  return this.__opts__ = Oo(this.__opts__, t), this;
};
_t.prototype.test = function(t) {
  if (this.__text_cache__ = t, this.__index__ = -1, !t.length)
    return !1;
  let n, r, u, o, i, s, a, c, l;
  if (this.re.schema_test.test(t)) {
    for (a = this.re.schema_search, a.lastIndex = 0; (n = a.exec(t)) !== null; )
      if (o = this.testSchemaAt(t, n[2], a.lastIndex), o) {
        this.__schema__ = n[2], this.__index__ = n.index + n[1].length, this.__last_index__ = n.index + n[0].length + o;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (c = t.search(this.re.host_fuzzy_test), c >= 0 && (this.__index__ < 0 || c < this.__index__) && (r = t.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (i = r.index + r[1].length, (this.__index__ < 0 || i < this.__index__) && (this.__schema__ = "", this.__index__ = i, this.__last_index__ = r.index + r[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (l = t.indexOf("@"), l >= 0 && (u = t.match(this.re.email_fuzzy)) !== null && (i = u.index + u[1].length, s = u.index + u[0].length, (this.__index__ < 0 || i < this.__index__ || i === this.__index__ && s > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = i, this.__last_index__ = s))), this.__index__ >= 0;
};
_t.prototype.pretest = function(t) {
  return this.re.pretest.test(t);
};
_t.prototype.testSchemaAt = function(t, n, r) {
  return this.__compiled__[n.toLowerCase()] ? this.__compiled__[n.toLowerCase()].validate(t, r, this) : 0;
};
_t.prototype.match = function(t) {
  const n = [];
  let r = 0;
  this.__index__ >= 0 && this.__text_cache__ === t && (n.push(Lo(this, r)), r = this.__last_index__);
  let u = r ? t.slice(r) : t;
  for (; this.test(u); )
    n.push(Lo(this, r)), u = u.slice(this.__last_index__), r += this.__last_index__;
  return n.length ? n : null;
};
_t.prototype.matchAtStart = function(t) {
  if (this.__text_cache__ = t, this.__index__ = -1, !t.length) return null;
  const n = this.re.schema_at_start.exec(t);
  if (!n) return null;
  const r = this.testSchemaAt(t, n[2], n[0].length);
  return r ? (this.__schema__ = n[2], this.__index__ = n.index + n[1].length, this.__last_index__ = n.index + n[0].length + r, Lo(this, 0)) : null;
};
_t.prototype.tlds = function(t, n) {
  return t = Array.isArray(t) ? t : [t], n ? (this.__tlds__ = this.__tlds__.concat(t).sort().filter(function(r, u, o) {
    return r !== o[u - 1];
  }).reverse(), gu(this), this) : (this.__tlds__ = t.slice(), this.__tlds_replaced__ = !0, gu(this), this);
};
_t.prototype.normalize = function(t) {
  t.schema || (t.url = "http://" + t.url), t.schema === "mailto:" && !/^mailto:/i.test(t.url) && (t.url = "mailto:" + t.url);
};
_t.prototype.onCompile = function() {
};
const Wn = 2147483647, zt = 36, _i = 1, Sr = 26, Ng = 38, Og = 700, Oc = 72, Lc = 128, Bc = "-", Lg = /^xn--/, Bg = /[^\0-\x7F]/, Pg = /[\x2E\u3002\uFF0E\uFF61]/g, $g = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, bo = zt - _i, Ut = Math.floor, mo = String.fromCharCode;
function ln(e) {
  throw new RangeError($g[e]);
}
function zg(e, t) {
  const n = [];
  let r = e.length;
  for (; r--; )
    n[r] = t(e[r]);
  return n;
}
function Pc(e, t) {
  const n = e.split("@");
  let r = "";
  n.length > 1 && (r = n[0] + "@", e = n[1]), e = e.replace(Pg, ".");
  const u = e.split("."), o = zg(u, t).join(".");
  return r + o;
}
function $c(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const u = e.charCodeAt(n++);
    if (u >= 55296 && u <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((u & 1023) << 10) + (o & 1023) + 65536) : (t.push(u), n--);
    } else
      t.push(u);
  }
  return t;
}
const Ug = (e) => String.fromCodePoint(...e), Hg = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : zt;
}, Ps = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, zc = function(e, t, n) {
  let r = 0;
  for (e = n ? Ut(e / Og) : e >> 1, e += Ut(e / t); e > bo * Sr >> 1; r += zt)
    e = Ut(e / bo);
  return Ut(r + (bo + 1) * e / (e + Ng));
}, Uc = function(e) {
  const t = [], n = e.length;
  let r = 0, u = Lc, o = Oc, i = e.lastIndexOf(Bc);
  i < 0 && (i = 0);
  for (let s = 0; s < i; ++s)
    e.charCodeAt(s) >= 128 && ln("not-basic"), t.push(e.charCodeAt(s));
  for (let s = i > 0 ? i + 1 : 0; s < n; ) {
    const a = r;
    for (let l = 1, d = zt; ; d += zt) {
      s >= n && ln("invalid-input");
      const h = Hg(e.charCodeAt(s++));
      h >= zt && ln("invalid-input"), h > Ut((Wn - r) / l) && ln("overflow"), r += h * l;
      const f = d <= o ? _i : d >= o + Sr ? Sr : d - o;
      if (h < f)
        break;
      const p = zt - f;
      l > Ut(Wn / p) && ln("overflow"), l *= p;
    }
    const c = t.length + 1;
    o = zc(r - a, c, a == 0), Ut(r / c) > Wn - u && ln("overflow"), u += Ut(r / c), r %= c, t.splice(r++, 0, u);
  }
  return String.fromCodePoint(...t);
}, Hc = function(e) {
  const t = [];
  e = $c(e);
  const n = e.length;
  let r = Lc, u = 0, o = Oc;
  for (const a of e)
    a < 128 && t.push(mo(a));
  const i = t.length;
  let s = i;
  for (i && t.push(Bc); s < n; ) {
    let a = Wn;
    for (const l of e)
      l >= r && l < a && (a = l);
    const c = s + 1;
    a - r > Ut((Wn - u) / c) && ln("overflow"), u += (a - r) * c, r = a;
    for (const l of e)
      if (l < r && ++u > Wn && ln("overflow"), l === r) {
        let d = u;
        for (let h = zt; ; h += zt) {
          const f = h <= o ? _i : h >= o + Sr ? Sr : h - o;
          if (d < f)
            break;
          const p = d - f, _ = zt - f;
          t.push(
            mo(Ps(f + p % _, 0))
          ), d = Ut(p / _);
        }
        t.push(mo(Ps(d, 0))), o = zc(u, c, s === i), u = 0, ++s;
      }
    ++u, ++r;
  }
  return t.join("");
}, jg = function(e) {
  return Pc(e, function(t) {
    return Lg.test(t) ? Uc(t.slice(4).toLowerCase()) : t;
  });
}, qg = function(e) {
  return Pc(e, function(t) {
    return Bg.test(t) ? "xn--" + Hc(t) : t;
  });
}, jc = {
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
    decode: $c,
    encode: Ug
  },
  decode: Uc,
  encode: Hc,
  toASCII: qg,
  toUnicode: jg
}, Gg = {
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
}, Vg = {
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
}, Kg = {
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
}, Wg = {
  default: Gg,
  zero: Vg,
  commonmark: Kg
}, Zg = /^(vbscript|javascript|file|data):/, Jg = /^data:image\/(gif|png|jpeg|webp);/;
function Yg(e) {
  const t = e.trim().toLowerCase();
  return Zg.test(t) ? Jg.test(t) : !0;
}
const qc = ["http:", "https:", "mailto:"];
function Xg(e) {
  const t = fi(e, !0);
  if (t.hostname && (!t.protocol || qc.indexOf(t.protocol) >= 0))
    try {
      t.hostname = jc.toASCII(t.hostname);
    } catch {
    }
  return Ir(di(t));
}
function Qg(e) {
  const t = fi(e, !0);
  if (t.hostname && (!t.protocol || qc.indexOf(t.protocol) >= 0))
    try {
      t.hostname = jc.toUnicode(t.hostname);
    } catch {
    }
  return Yn(di(t), Yn.defaultChars + "%");
}
function St(e, t) {
  if (!(this instanceof St))
    return new St(e, t);
  t || pi(e) || (t = e || {}, e = "default"), this.inline = new Or(), this.block = new Lu(), this.core = new bi(), this.renderer = new nr(), this.linkify = new _t(), this.validateLink = Yg, this.normalizeLink = Xg, this.normalizeLinkText = Qg, this.utils = tp, this.helpers = Nu({}, op), this.options = {}, this.configure(e), t && this.set(t);
}
St.prototype.set = function(e) {
  return Nu(this.options, e), this;
};
St.prototype.configure = function(e) {
  const t = this;
  if (pi(e)) {
    const n = e;
    if (e = Wg[n], !e)
      throw new Error('Wrong `markdown-it` preset "' + n + '", check name');
  }
  if (!e)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return e.options && t.set(e.options), e.components && Object.keys(e.components).forEach(function(n) {
    e.components[n].rules && t[n].ruler.enableOnly(e.components[n].rules), e.components[n].rules2 && t[n].ruler2.enableOnly(e.components[n].rules2);
  }), this;
};
St.prototype.enable = function(e, t) {
  let n = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(u) {
    n = n.concat(this[u].ruler.enable(e, !0));
  }, this), n = n.concat(this.inline.ruler2.enable(e, !0));
  const r = e.filter(function(u) {
    return n.indexOf(u) < 0;
  });
  if (r.length && !t)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + r);
  return this;
};
St.prototype.disable = function(e, t) {
  let n = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(u) {
    n = n.concat(this[u].ruler.disable(e, !0));
  }, this), n = n.concat(this.inline.ruler2.disable(e, !0));
  const r = e.filter(function(u) {
    return n.indexOf(u) < 0;
  });
  if (r.length && !t)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + r);
  return this;
};
St.prototype.use = function(e) {
  const t = [this].concat(Array.prototype.slice.call(arguments, 1));
  return e.apply(e, t), this;
};
St.prototype.parse = function(e, t) {
  if (typeof e != "string")
    throw new Error("Input data should be a String");
  const n = new this.core.State(e, this, t);
  return this.core.process(n), n.tokens;
};
St.prototype.render = function(e, t) {
  return t = t || {}, this.renderer.render(this.parse(e, t), this.options, t);
};
St.prototype.parseInline = function(e, t) {
  const n = new this.core.State(e, this, t);
  return n.inlineMode = !0, this.core.process(n), n.tokens;
};
St.prototype.renderInline = function(e, t) {
  return t = t || {}, this.renderer.render(this.parseInline(e, t), this.options, t);
};
function eb(e) {
  const t = e.renderer.rules.link_open || ((n, r, u, o, i) => i.renderToken(n, r, u));
  e.renderer.rules.link_open = (n, r, u, o, i) => {
    const s = n[r], a = s.attrIndex("target");
    a < 0 ? s.attrPush(["target", "_blank"]) : s.attrs && (s.attrs[a][1] = "_blank");
    const c = s.attrIndex("rel");
    return c < 0 ? s.attrPush(["rel", "noopener noreferrer"]) : s.attrs && (s.attrs[c][1] = "noopener noreferrer"), t(n, r, u, o, i);
  };
}
const tb = (e) => ({
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
}), nb = [
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
], rb = [
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
], ub = [
  ...nb,
  ...rb
], ob = [
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
].sort().reverse(), ib = [
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
].sort().reverse(), sb = [
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
].sort().reverse(), ab = [
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
function cb(e) {
  const t = e.regex, n = tb(e), r = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, u = "and or not only", o = /@-?\w[\w]*(-\w+)*/, i = "[a-zA-Z-][a-zA-Z0-9_-]*", s = [
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
      r,
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
          { begin: ":(" + ib.join("|") + ")" },
          { begin: ":(:)?(" + sb.join("|") + ")" }
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
        begin: "\\b(" + ab.join("|") + ")\\b"
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
              keyword: u,
              attribute: ob.join(" ")
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
        begin: "\\b(" + ub.join("|") + ")\\b"
      }
    ]
  };
}
var Un = "[0-9](_*[0-9])*", Jr = `\\.(${Un})`, Yr = "[0-9a-fA-F](_*[0-9a-fA-F])*", $s = {
  className: "number",
  variants: [
    // DecimalFloatingPointLiteral
    // including ExponentPart
    { begin: `(\\b(${Un})((${Jr})|\\.)?|(${Jr}))[eE][+-]?(${Un})[fFdD]?\\b` },
    // excluding ExponentPart
    { begin: `\\b(${Un})((${Jr})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
    { begin: `(${Jr})[fFdD]?\\b` },
    { begin: `\\b(${Un})[fFdD]\\b` },
    // HexadecimalFloatingPointLiteral
    { begin: `\\b0[xX]((${Yr})\\.?|(${Yr})?\\.(${Yr}))[pP][+-]?(${Un})[fFdD]?\\b` },
    // DecimalIntegerLiteral
    { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
    // HexIntegerLiteral
    { begin: `\\b0[xX](${Yr})[lL]?\\b` },
    // OctalIntegerLiteral
    { begin: "\\b0(_*[0-7])*[lL]?\\b" },
    // BinaryIntegerLiteral
    { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
  ],
  relevance: 0
};
function Gc(e, t, n) {
  return n === -1 ? "" : e.replace(t, (r) => Gc(e, t, n - 1));
}
function lb(e) {
  const t = e.regex, n = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*", r = n + Gc("(?:<" + n + "~~~(?:\\s*,\\s*" + n + "~~~)*>)?", /~~~/g, 2), a = {
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
          "(?:" + r + "\\s+)",
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
              $s,
              e.C_BLOCK_COMMENT_MODE
            ]
          },
          e.C_LINE_COMMENT_MODE,
          e.C_BLOCK_COMMENT_MODE
        ]
      },
      $s,
      c
    ]
  };
}
const zs = "[A-Za-z$_][0-9A-Za-z$_]*", db = [
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
], fb = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Vc = [
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
], Kc = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Wc = [
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
], hb = [
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
], pb = [].concat(
  Wc,
  Vc,
  Kc
);
function gb(e) {
  const t = e.regex, n = (fe, { after: He }) => {
    const je = "</" + fe[0].slice(1);
    return fe.input.indexOf(je, He) !== -1;
  }, r = zs, u = {
    begin: "<>",
    end: "</>"
  }, o = /<[A-Za-z0-9\\._:-]+\s*\/>/, i = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (fe, He) => {
      const je = fe[0].length + fe.index, ke = fe.input[je];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        ke === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        ke === ","
      ) {
        He.ignoreMatch();
        return;
      }
      ke === ">" && (n(fe, { after: je }) || He.ignoreMatch());
      let Ee;
      const xt = fe.input.substring(je);
      if (Ee = xt.match(/^\s*=/)) {
        He.ignoreMatch();
        return;
      }
      if ((Ee = xt.match(/^\s+extends\s+/)) && Ee.index === 0) {
        He.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: zs,
    keyword: db,
    literal: fb,
    built_in: pb,
    "variable.language": hb
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
  }, M = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      h
    ]
  }, k = {
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
                  begin: r + "(?=\\s*(-)|$)",
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
  }, F = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    p,
    _,
    M,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  h.contains = F.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(F)
  });
  const E = [].concat(k, h.contains), x = E.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(E)
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
  }, te = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(r, "(", t.concat(/\./, r), ")*")
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
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, K = {
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
        ...Vc,
        ...Kc
      ]
    }
  }, N = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, ee = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
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
  }, ce = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function v(fe) {
    return t.concat("(?!", fe.join("|"), ")");
  }
  const j = {
    match: t.concat(
      /\b/,
      v([
        ...Wc,
        "super",
        "import"
      ].map((fe) => `${fe}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, oe = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, he = {
    match: [
      /get|set/,
      /\s+/,
      r,
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
  }, Ne = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", Ie = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(Ne)
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
    exports: { PARAMS_CONTAINS: x, CLASS_REFERENCE: K },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      N,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      p,
      _,
      M,
      k,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      K,
      {
        scope: "attr",
        match: r + t.lookahead(":"),
        relevance: 0
      },
      Ie,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          k,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Ne,
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
              { begin: u.begin, end: u.end },
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
      ee,
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
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      oe,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [L]
      },
      j,
      ce,
      te,
      he,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function bb(e) {
  const t = e.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), r = [
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
    keyword: r,
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
  }, h = "[0-9](_?[0-9])*", f = `(\\b(${h}))?\\.(${h})|\\b(${h})\\.`, p = `\\b|${r.join("|")}`, _ = {
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
  }, M = {
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
  }, A = {
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
      M,
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
        contains: [A]
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
          A,
          d
        ]
      }
    ]
  };
}
const bu = "[A-Za-z$_][0-9A-Za-z$_]*", Zc = [
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
], Jc = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Yc = [
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
], Xc = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Qc = [
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
], el = [
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
], tl = [].concat(
  Qc,
  Yc,
  Xc
);
function mb(e) {
  const t = e.regex, n = (fe, { after: He }) => {
    const je = "</" + fe[0].slice(1);
    return fe.input.indexOf(je, He) !== -1;
  }, r = bu, u = {
    begin: "<>",
    end: "</>"
  }, o = /<[A-Za-z0-9\\._:-]+\s*\/>/, i = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (fe, He) => {
      const je = fe[0].length + fe.index, ke = fe.input[je];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        ke === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        ke === ","
      ) {
        He.ignoreMatch();
        return;
      }
      ke === ">" && (n(fe, { after: je }) || He.ignoreMatch());
      let Ee;
      const xt = fe.input.substring(je);
      if (Ee = xt.match(/^\s*=/)) {
        He.ignoreMatch();
        return;
      }
      if ((Ee = xt.match(/^\s+extends\s+/)) && Ee.index === 0) {
        He.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: bu,
    keyword: Zc,
    literal: Jc,
    built_in: tl,
    "variable.language": el
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
  }, M = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      h
    ]
  }, k = {
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
                  begin: r + "(?=\\s*(-)|$)",
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
  }, F = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    p,
    _,
    M,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  h.contains = F.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(F)
  });
  const E = [].concat(k, h.contains), x = E.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(E)
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
  }, te = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(r, "(", t.concat(/\./, r), ")*")
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
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, K = {
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
        ...Yc,
        ...Xc
      ]
    }
  }, N = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, ee = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
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
  }, ce = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function v(fe) {
    return t.concat("(?!", fe.join("|"), ")");
  }
  const j = {
    match: t.concat(
      /\b/,
      v([
        ...Qc,
        "super",
        "import"
      ].map((fe) => `${fe}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, oe = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, he = {
    match: [
      /get|set/,
      /\s+/,
      r,
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
  }, Ne = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", Ie = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(Ne)
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
    exports: { PARAMS_CONTAINS: x, CLASS_REFERENCE: K },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      N,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      p,
      _,
      M,
      k,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      K,
      {
        scope: "attr",
        match: r + t.lookahead(":"),
        relevance: 0
      },
      Ie,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          k,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Ne,
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
              { begin: u.begin, end: u.end },
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
      ee,
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
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      oe,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [L]
      },
      j,
      ce,
      te,
      he,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function _b(e) {
  const t = e.regex, n = mb(e), r = bu, u = [
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
      built_in: u
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
    $pattern: bu,
    keyword: Zc.concat(a),
    literal: Jc,
    built_in: tl.concat(u),
    "variable.language": el
  }, l = {
    className: "meta",
    begin: "@" + r
  }, d = (_, M, A) => {
    const k = _.contains.findIndex((F) => F.label === M);
    if (k === -1)
      throw new Error("can not find mode to replace");
    _.contains.splice(k, 1, A);
  };
  Object.assign(n.keywords, c), n.exports.PARAMS_CONTAINS.push(l);
  const h = n.contains.find((_) => _.scope === "attr"), f = Object.assign(
    {},
    h,
    { match: t.concat(r, t.lookahead(/\s*\?:/)) }
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
const xb = ["innerHTML"], yb = /* @__PURE__ */ Ce({
  __name: "MarkdownRenderer.ce",
  props: {
    source: { type: String }
  },
  setup(e) {
    En.registerLanguage("javascript", gb), En.registerLanguage("python", bb), En.registerLanguage("css", cb), En.registerLanguage("java", lb), En.registerLanguage("typescript", _b);
    const t = e, n = new St({
      html: !0,
      linkify: !0,
      typographer: !0,
      highlight: (u, o) => {
        if (o && En.getLanguage(o))
          try {
            return `<pre><code class="hljs ${o}">` + En.highlight(u, { language: o }).value + "</code></pre>";
          } catch {
          }
        return `<pre><code>${n.utils.escapeHtml(u)}</code></pre>`;
      }
    });
    eb(n);
    const r = re(() => n.render(t.source));
    return (u, o) => (R(), H("div", {
      class: "am-ui-markdown-content",
      innerHTML: r.value
    }, null, 8, xb));
  }
}), vb = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!
  Theme: GitHub
  Description: Light theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-light
  Current colors taken from GitHub's CSS
*/.hljs{color:#24292e;background:#fff}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id{color:#005cc5}.hljs-regexp,.hljs-string,.hljs-meta .hljs-string{color:#032f62}.hljs-built_in,.hljs-symbol{color:#e36209}.hljs-comment,.hljs-code,.hljs-formula{color:#6a737d}.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo{color:#22863a}.hljs-subst{color:#24292e}.hljs-section{color:#005cc5;font-weight:700}.hljs-bullet{color:#735c0f}.hljs-emphasis{color:#24292e;font-style:italic}.hljs-strong{color:#24292e;font-weight:700}.hljs-addition{color:#22863a;background-color:#f0fff4}.hljs-deletion{color:#b31d28;background-color:#ffeef0}`, wb = ".am-ui-markdown-content>*:first-child{margin-block-start:0}.am-ui-markdown-content>*:last-child{margin-block-end:0}.am-ui-markdown-content h1,.am-ui-markdown-content h2,.am-ui-markdown-content h3,.am-ui-markdown-content h4,.am-ui-markdown-content h5,.am-ui-markdown-content h6{margin-top:1.5rem;margin-bottom:1rem}.am-ui-markdown-content p{margin-bottom:1rem;line-height:1.6}.am-ui-markdown-content pre{padding:1rem;border-radius:.5625rem;overflow-x:auto}.am-ui-markdown-content code{padding:.2rem .4rem;border-radius:.375rem;background:var(--code-bg);color:var(--code-color)}.am-ui-markdown-content a{text-decoration:none;color:#3490dc}.am-ui-markdown-content a:hover{text-decoration:underline}.am-ui-markdown-content img{max-width:100%;height:auto}.am-ui-markdown-content table{display:block;width:100%;margin-bottom:1rem;border-collapse:collapse;overflow-x:auto;white-space:wrap}.am-ui-markdown-content table th,.am-ui-markdown-content table td{padding:.75rem;border:.0625rem solid #ddd;text-align:left}.am-ui-markdown-content table th{background-color:var(--bg-table-header)}", nl = /* @__PURE__ */ Ae(yb, [["styles", [vb, wb]]]);
function kb(e) {
  try {
    return new URL(e), !0;
  } catch {
    return !1;
  }
}
function Eb(e) {
  return /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(e);
}
function Cb(e) {
  const t = re(() => kb(e.value)), n = re(() => t.value && Eb(e.value));
  return { isUrl: t, isImg: n };
}
function Pu() {
  const e = Qe(), t = re(() => {
    var f;
    return ((f = e.session) == null ? void 0 : f.agents) ?? [];
  }), n = re(() => Object.fromEntries(t.value.map((f) => [f.id, f])));
  function r(f) {
    return f ? n.value[f] ?? null : null;
  }
  function u(f) {
    const p = f ? e.threadById[f] : null;
    return p ? r(p.agentId) : null;
  }
  const o = re(() => u(e.activeThreadId) ?? t.value[0] ?? null), i = re(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.name) ?? "";
  }), s = re(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.avatar) ?? "";
  }), { isImg: a } = Cb(s), c = re(() => {
    var f;
    return a.value ? (f = o.value) == null ? void 0 : f.avatar : "";
  }), l = re(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.intro) ?? "What's on your mind today?";
  }), d = re(() => {
    var f;
    return ((f = o.value) == null ? void 0 : f.description) ?? "";
  }), h = re(
    () => {
      var f;
      return ((f = o.value) == null ? void 0 : f.promptPlaceholder) ?? "Ask me anything...";
    }
  );
  return {
    agents: t,
    agentById: n,
    getAgentById: r,
    getAgentByThreadId: u,
    activeAgent: o,
    activeAgentName: i,
    activeAgentAvatar: c,
    activeAgentIntro: l,
    activeAgentDescription: d,
    activeAgentPromptPlaceholder: h
  };
}
const Ab = {
  key: 0,
  class: "am-chat-widget__message-avatar"
}, Sb = ["src"], Db = {
  key: 1,
  class: "am-chat-widget__message-content"
}, Tb = {
  key: 2,
  class: "am-chat-widget__message-attachment"
}, Mb = {
  key: 3,
  class: "am-chat-widget__message-content"
}, Fb = /* @__PURE__ */ Ce({
  __name: "ChatMessage.ce",
  props: {
    role: { type: null },
    content: { type: String },
    files: { type: Array }
  },
  setup(e) {
    const { activeAgentAvatar: t } = Pu();
    return (n, r) => (R(), H("div", {
      class: Ft(["am-chat-widget__message", `am-chat-widget__message--${n.role}`])
    }, [
      n.role === q(mt).AGENT ? (R(), H("div", Ab, [
        q(t) ? (R(), H("img", {
          key: 0,
          class: "am-chat-widget__message-avatar-image",
          "aria-label": "New Chat",
          src: q(t)
        }, null, 8, Sb)) : (R(), Ue(q(si), {
          key: 1,
          class: "am-chat-widget__message-avatar-icon",
          "aria-label": "New Chat",
          "stroke-width": 1
        }))
      ])) : Se("", !0),
      n.role === q(mt).AGENT ? (R(), H("div", Db, [
        Y(nl, { source: n.content }, null, 8, ["source"])
      ])) : Se("", !0),
      n.role === q(mt).USER && n.files && n.files.length ? (R(), H("div", Tb, [
        (R(!0), H(Fe, null, tn(n.files, (u) => (R(), Ue(xc, {
          key: u.id,
          name: u.name
        }, null, 8, ["name"]))), 128))
      ])) : Se("", !0),
      n.role === q(mt).USER && n.content ? (R(), H("div", Mb, ct(n.content), 1)) : Se("", !0)
    ], 2));
  }
}), Rb = ".am-chat-widget__message{display:flex;flex-direction:row;margin:0;border-radius:.375rem}.am-chat-widget__message-content{font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:0;display:inline-block;padding:.9375rem;border-radius:.375rem;word-wrap:break-word;overflow-wrap:anywhere}.am-chat-widget__message--user{flex-direction:column;align-items:flex-end;margin-left:17.5%;gap:8px}.am-chat-widget__message--user .am-chat-widget__message-content{max-width:100%;background-color:var(--bg-message-user)}.am-chat-widget__message--agent{justify-content:flex-start;margin-right:17.5%;background-color:transparent}.am-chat-widget__message--agent .am-chat-widget__message-content{max-width:100%}.am-chat-widget__message-avatar{padding-block:.625rem}.am-chat-widget__message-avatar-icon{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon)}.am-chat-widget__message-avatar-image{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon);box-sizing:border-box;width:2rem;height:2rem;padding:0}.am-chat-widget__message-attachment{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:flex-end;gap:.25rem}", Ib = /* @__PURE__ */ Ae(Fb, [["styles", [Rb]]]), Nb = {
  ref: "innerList",
  class: "am-chat-widget-message-list"
}, Ob = /* @__PURE__ */ Ce({
  __name: "ChatMessageList.ce",
  props: {
    messages: { type: Array }
  },
  setup(e) {
    return (t, n) => (R(), H("div", Nb, [
      (R(!0), H(Fe, null, tn(t.messages, (r) => (R(), Ue(Ib, {
        key: r.id,
        role: r.role,
        content: r.content,
        files: r.files
      }, null, 8, ["role", "content", "files"]))), 128))
    ], 512));
  }
}), Lb = ".am-chat-widget-message-list{display:flex;flex-direction:column;box-sizing:border-box;width:100%;padding-top:1.5rem;padding-bottom:1.5rem;gap:1.5rem}", Bb = /* @__PURE__ */ Ae(Ob, [["styles", [Lb]]]), Pb = { class: "am-ui-skeleton-conversation" }, $b = /* @__PURE__ */ Ce({
  __name: "SkeletonConversation.ce",
  props: {
    count: { type: Number }
  },
  setup(e) {
    const n = e.count ?? 8, r = re(
      () => Array.from({ length: n }, (u, o) => [
        "am-ui-skeleton-conversation__entry",
        o % 2 === 0 ? "am-ui-skeleton-conversation__entry--user" : "am-ui-skeleton-conversation__entry--agent"
      ])
    );
    return (u, o) => (R(), H("div", Pb, [
      (R(!0), H(Fe, null, tn(r.value, (i, s) => (R(), H("div", {
        key: s,
        class: Ft(i)
      }, [
        s % 2 === 0 ? (R(), H(Fe, { key: 0 }, [
          Y(jn, { variant: "bubble" }),
          Y(jn, { variant: "avatar" })
        ], 64)) : (R(), H(Fe, { key: 1 }, [
          Y(jn, { variant: "avatar" }),
          Y(jn, { variant: "bubble" })
        ], 64))
      ], 2))), 128))
    ]));
  }
}), zb = ".am-ui-skeleton-conversation{display:flex;flex-direction:column;gap:1.5rem}.am-ui-skeleton-conversation__entry{display:flex;align-items:top}.am-ui-skeleton-conversation__entry .am-ui-skeleton-item--bubble{margin-bottom:0}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--agent{justify-content:flex-start}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--agent .am-ui-skeleton-item--avatar{margin-right:.5rem}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--agent .am-ui-skeleton-item--bubble{width:70%}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--user{justify-content:flex-end}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--user .am-ui-skeleton-item--avatar{margin-left:.5rem}.am-ui-skeleton-conversation__entry.am-ui-skeleton-conversation__entry--user .am-ui-skeleton-item--bubble{width:50%}", Ub = /* @__PURE__ */ Ae($b, [["styles", [zb]]]);
function Hb(e, t, n, r, u = 0) {
  const o = (a) => {
    n.value = a, s(u);
  };
  Ct(
    e,
    async (a) => {
      await Qt();
      const c = a[a.length - 1];
      (c == null ? void 0 : c.role) === mt.USER ? o(!0) : o(!1);
    },
    {
      deep: !0,
      immediate: !0,
      flush: "post"
    }
  );
  const i = async () => {
    n.value = !0, await Qt(), s(u);
  };
  function s(a = 0) {
    const c = t.value;
    if (!c)
      return;
    const l = Math.max(c.scrollHeight + a, 0);
    c.scrollTop = l, r == null || r();
  }
  return {
    scrollToBottom: i
  };
}
const jb = {
  viewBox: "0 0 17 19",
  width: "1.08em",
  height: "1.2em"
};
function qb(e, t) {
  return R(), H("svg", jb, t[0] || (t[0] = [
    V("g", { fill: "none" }, [
      V("path", {
        d: "M13.45874 9.50039 L8.50041 15.04205 L3.54210 9.50039",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      V("path", {
        d: "M8.5 3.95870 V15.04205",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const Gb = ht({ name: "icons-arrow-scroll-bottom", render: qb }), Vb = {
  key: 0,
  class: "am-chat-widget__content"
}, Kb = { class: "am-chat-widget__content-inner" }, Wb = {
  key: 0,
  class: "am-chat-widget__content-scroll-to-bottom"
}, Zb = /* @__PURE__ */ Ce({
  __name: "ChatContent.ce",
  setup(e) {
    const t = Qe(), { activeMessages: n, activeThreadId: r, isLoadingSession: u, hasMessages: o } = At(t), { isLoadingMessages: i } = Iu(r), s = ye(null), a = ye(!0), c = ye(!1);
    function l() {
      a.value = !0;
    }
    const { scrollToBottom: d } = Hb(
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
      const { scrollTop: p, scrollHeight: _, clientHeight: M } = f;
      a.value = p + M >= _ - 1;
    }
    return Fn(() => {
      const f = s.value;
      if (!f)
        return;
      const { scrollTop: p, scrollHeight: _, clientHeight: M } = f;
      a.value = p + M >= _ - 1;
    }), Ct(
      r,
      async (f, p) => {
        f && f !== p && (await Qt(), d());
      },
      { immediate: !0 }
    ), (f, p) => q(o) || !q(o) && (q(i) || q(u)) ? (R(), H("div", Vb, [
      V("div", {
        ref_key: "scrollContainer",
        ref: s,
        class: Ft([
          "am-chat-widget__content-wrapper",
          { "am-chat-widget__content-wrapper--smooth": c.value }
        ]),
        onScroll: h
      }, [
        V("div", Kb, [
          q(u) || q(i) ? (R(), Ue(Ub, {
            key: 0,
            count: 4
          })) : q(i) && q(u) ? Se("", !0) : (R(), Ue(Bb, {
            key: 1,
            "scroll-container": s.value,
            messages: q(n)
          }, null, 8, ["scroll-container", "messages"]))
        ])
      ], 34),
      a.value ? Se("", !0) : (R(), H("div", Wb, [
        Y(Mt, {
          style: "tertiary",
          "icon-only": "",
          small: "",
          "aria-label": "Scroll to bottom of chat",
          onClick: q(d)
        }, {
          icon: Ye(() => [
            Y(q(Gb), { "aria-label": "Scroll to bottom icon" })
          ]),
          _: 1
        }, 8, ["onClick"])
      ]))
    ])) : Se("", !0);
  }
}), Jb = ".am-chat-widget__content{position:relative;display:flex;flex:1;width:100%;min-height:0}.am-chat-widget__content-wrapper{display:flex;flex:1 1 auto;justify-content:center;min-height:0;padding-inline:1.5rem;padding-block:1.5rem;overflow:hidden auto;scroll-behavior:auto;scroll-padding-top:1.5rem;scroll-padding-bottom:1.5rem}.am-chat-widget__content-wrapper--smooth{scroll-behavior:smooth}.am-chat-widget__content-inner{display:flex;flex-direction:column;flex-shrink:0;box-sizing:border-box;width:100%;max-width:39.375rem}@container chat-widget (min-width: 1290px){.am-chat-widget__content-inner{max-width:48rem}}.am-chat-widget__content-scroll-to-bottom{position:absolute;bottom:.625rem;left:50%;z-index:1000;transform:translate(-50%)}", Yb = /* @__PURE__ */ Ae(Zb, [["styles", [Jb]]]), Xb = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function Qb(e, t) {
  return R(), H("svg", Xb, t[0] || (t[0] = [
    Qn(";;;"),
    V("g", { fill: "none" }, [
      V("path", {
        d: "M3 6H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      }),
      V("path", {
        d: "M3 12H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      }),
      V("path", {
        d: "M3 18H21",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round"
      })
    ], -1)
  ]));
}
const em = ht({ name: "icons-hamburger", render: Qb }), tm = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function nm(e, t) {
  return R(), H("svg", tm, t[0] || (t[0] = [
    V("g", { fill: "none" }, [
      V("path", {
        d: "M20.354 15.354A9 9 0 118.646 3.646 7 7 0 0020.354 15.354z",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const rm = ht({ name: "icons-moon", render: nm }), um = {
  viewBox: "0 0 24 24",
  width: "1.2em",
  height: "1.2em"
};
function om(e, t) {
  return R(), H("svg", um, t[0] || (t[0] = [
    ti('<g fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"></circle><line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="4.93" y1="19.07" x2="7.05" y2="16.95" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="16.95" y1="7.05" x2="19.07" y2="4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></g>', 1)
  ]));
}
const im = ht({ name: "icons-sun", render: om }), sm = { class: "am-chat-widget__header" }, am = { class: "am-chat-widget__header-left" }, cm = { class: "am-chat-widget__header-title" }, lm = {
  key: 0,
  class: "am-chat-widget__error-status-icon"
}, dm = { style: { display: "inline-block" } }, fm = { class: "am-chat-widget__header-toolbar" }, hm = /* @__PURE__ */ Ce({
  __name: "ChatHeader.ce",
  setup(e) {
    const { activeAgentName: t } = Pu(), n = Ru(), { hasErrors: r } = bc(), u = () => {
      n.toggle();
    }, o = Yo("theme");
    if (!o)
      throw new Error("Theme context not provided");
    const { mode: i, toggle: s } = o;
    return (a, c) => (R(), H("div", sm, [
      V("div", am, [
        Y(Mt, {
          style: "link",
          "icon-only": "",
          "aria-label": "'Open Sidebar Menu'",
          "hidden-for-desktop": "",
          onClick: u
        }, {
          default: Ye(() => [
            Y(q(em), { "aria-label": "'Open Sidebar Menu Icon'" })
          ]),
          _: 1
        })
      ]),
      V("div", cm, [
        q(r)() ? (R(), H("div", lm, [
          Y(q(cr))
        ])) : Se("", !0),
        V("div", dm, ct(q(t)), 1)
      ]),
      V("div", fm, [
        Y(Mt, {
          style: "link",
          "aria-label": "Change Chat Color Theme",
          onClick: q(s)
        }, {
          default: Ye(() => [
            q(i) === q(hn).DARK ? (R(), Ue(q(im), {
              key: 0,
              "aria-label": "'Light mode icon'"
            })) : (R(), Ue(q(rm), {
              key: 1,
              "aria-label": "'Dark mode icon'"
            }))
          ]),
          _: 1
        }, 8, ["onClick"])
      ])
    ]));
  }
}), pm = ".am-chat-widget__header{display:grid;align-items:center;grid-template-columns:1fr 1fr 1fr;box-sizing:border-box;width:100%;padding:.625rem;color:var(--text-header);border-bottom:.0625rem solid var(--border-header);font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:0}.am-chat-widget__header>:nth-child(1){justify-self:start;display:block}.am-chat-widget__header>:nth-child(2){justify-self:center;display:flex;align-items:center}.am-chat-widget__header>:nth-child(3){justify-self:end;display:block}@container chat-widget (min-width: 768px){.am-chat-widget__header{grid-template-columns:1fr 1fr}.am-chat-widget__header>:nth-child(1){display:none}.am-chat-widget__header>:nth-child(2){justify-self:start}.am-chat-widget__header>:nth-child(3){justify-self:end}}.am-chat-widget__error-status-icon{display:inline-block;width:1.2em;height:1.2em;padding:.5rem .625rem;animation:blink 2s ease-in-out infinite}@keyframes blink{0%,to{opacity:1}50%{opacity:0}}", gm = /* @__PURE__ */ Ae(hm, [["styles", [pm]]]), bm = ["aria-label"], mm = {
  key: 0,
  class: "am-chat-widget__message-avatar"
}, _m = {
  key: 1,
  class: "am-chat-widget__message-content"
}, xm = { class: "ellipsis" }, ym = /* @__PURE__ */ Ce({
  __name: "ChatProgressStatus.ce",
  props: {
    isModeImpact: { type: Boolean }
  },
  setup(e) {
    const t = Qe(), { activeStreamStatus: n } = At(t), r = ye("");
    let u;
    return Ct(
      () => n.value,
      (o) => {
        o || (r.value = "");
      },
      { immediate: !0 }
    ), Fn(() => {
      let o = 0;
      u = window.setInterval(() => {
        if (!n) {
          r.value = "";
          return;
        }
        o = (o + 1) % 4, r.value = ".".repeat(o);
      }, 500);
    }), Jo(() => {
      u && clearInterval(u);
    }), (o, i) => q(n) && q(n) !== q(Jn).IDLE ? (R(), H("div", {
      key: 0,
      class: Ft([
        "amc-chat-widget__progress-status",
        { "amc-chat-widget__progress-status--impact": o.isModeImpact }
      ]),
      "aria-label": q(n),
      role: "status",
      "aria-live": "polite",
      "aria-busy": "true",
      "aria-atomic": "true"
    }, [
      i[0] || (i[0] = V("div", { class: "status" }, null, -1)),
      !o.isModeImpact && q(n) ? (R(), H("div", mm, [
        Y(q(si), {
          class: "am-chat-widget__message-avatar-icon",
          "aria-label": "Chatbot Avatar",
          "stroke-width": 1
        })
      ])) : Se("", !0),
      q(n) ? (R(), H("div", _m, [
        Qn(ct(q(n)), 1),
        V("span", xm, ct(r.value), 1)
      ])) : Se("", !0)
    ], 10, bm)) : Se("", !0);
  }
}), vm = '.am-chat-widget__message-content{max-width:100%;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:0;display:inline-block;padding:.9375rem;border-radius:.375rem;word-wrap:break-word;overflow-wrap:anywhere}.amc-chat-widget__progress-status{display:flex;align-items:center;overflow:hidden;justify-content:flex-start;margin-right:17.5%;background-color:transparent}.amc-chat-widget__progress-status--impact>.am-chat-widget__message-content{padding:.375rem 0 0 .75rem}.amc-chat-widget__progress-status--impact .am-chat-widget__message-content:before{display:inline-block;width:.625rem;height:.625rem;margin-right:1ch;border-radius:10%;background-color:currentcolor;animation:fade-in-out 1s infinite ease-in-out;content:""}.amc-chat-widget__progress-status .am-chat-widget__message-content{display:inline-flex;align-items:center;color:currentcolor}.am-chat-widget__message-avatar{padding-block:.625rem}.am-chat-widget__message-avatar-icon{width:1.125rem;height:1.125rem;padding:.375rem;border:.0625rem solid var(--border-chat-avatar-icon);border-radius:50%;background-color:var(--bg-chat-avatar-icon);color:var(--color-chat-avatar-icon)}@keyframes fade-in-out{0%{opacity:0}50%{opacity:1}to{opacity:0}}.ellipsis{display:inline-block;width:2ch;text-align:left;animation:fade-in-out 1s infinite}', wm = /* @__PURE__ */ Ae(ym, [["styles", [vm]]]);
function rl(e) {
  const t = document.createElement("div");
  return t.innerHTML = e, t.textContent || t.innerText || "";
}
function km(e, t, n) {
  function r() {
    if (!t.value)
      return;
    const o = t.value.innerHTML || "";
    e.value = n.value ? rl(o) : o.trim();
  }
  function u(o) {
    t.value && (o ? t.value.innerHTML !== o && (t.value.innerHTML = o) : t.value.innerHTML = "");
  }
  return Ct(e, (o) => {
    u(o);
  }), Fn(() => {
    t.value && e.value && (t.value.innerHTML = e.value);
  }), {
    updateFromEditor: r
  };
}
const Em = { class: "am-chat-widget__composer" }, Cm = ["data-placeholder", "onKeydown"], Am = /* @__PURE__ */ Ce({
  __name: "ChatTextComposer.ce",
  props: /* @__PURE__ */ Pi({
    strippedHtml: { type: Boolean, default: !1 },
    placeholder: { default: "Ask anything...", type: String },
    attachments: { type: Array }
  }, {
    modelValue: { default: "" },
    modelModifiers: {}
  }),
  emits: /* @__PURE__ */ Pi(["submit"], ["update:modelValue"]),
  setup(e, { expose: t, emit: n }) {
    const r = e, u = Qe(), { activeThreadId: o } = At(u), i = Z0(e, "modelValue"), s = ye(null), { updateFromEditor: a } = km(i, s, ga(r, "strippedHtml")), c = n;
    function l() {
      var p, _;
      const h = ((p = s.value) == null ? void 0 : p.innerHTML) || "", f = r.strippedHtml ? rl(h) : h.trim();
      !f && !((_ = r.attachments) != null && _.length) || c("submit", { value: f });
    }
    const d = async () => {
      var h;
      await Qt(), (h = s.value) == null || h.focus();
    };
    return Ct(
      o,
      async (h, f) => {
        (!h || h && h !== f) && (await Qt(), d());
      },
      { immediate: !0 }
    ), Fn(() => {
      d();
    }), t({ focusInput: d }), (h, f) => (R(), H("div", Em, [
      V("div", {
        ref_key: "editor",
        ref: s,
        class: "am-chat-widget__composer-editor",
        contenteditable: "true",
        "data-placeholder": h.placeholder,
        role: "textbox",
        "aria-multiline": "true",
        onInput: f[0] || (f[0] = //@ts-ignore
        (...p) => q(a) && q(a)(...p)),
        onKeydown: Jd(Tr(l, ["exact", "prevent"]), ["enter"])
      }, null, 40, Cm),
      _0(V("textarea", {
        "onUpdate:modelValue": f[1] || (f[1] = (p) => i.value = p),
        hidden: "",
        name: "message"
      }, null, 512), [
        [Vd, i.value]
      ])
    ]));
  }
}), Sm = ".am-chat-widget__composer{position:relative;max-height:25dvh;overflow:auto;font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-editor{min-height:.625rem;padding:.3125rem 0;outline:none;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45;color:var(--text-input-panel);font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-editor:empty:before{color:var(--text-input-panel);pointer-events:none;content:attr(data-placeholder);font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:400;line-height:1.25rem;letter-spacing:0}.am-chat-widget__composer-textarea{display:none}", Dm = /* @__PURE__ */ Ae(Am, [["styles", [Sm]]]), Tm = ".am-chat-widget__composer-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem}", Mm = {}, Fm = { class: "am-chat-widget__composer-bar" }, Rm = { class: "am-chat-widget__composer-bar-left" }, Im = { class: "am-chat-widget__composer-bar-right" };
function Nm(e, t) {
  return R(), H("div", Fm, [
    V("div", Rm, [
      cu(e.$slots, "left")
    ]),
    V("div", Im, [
      cu(e.$slots, "right")
    ])
  ]);
}
const Om = /* @__PURE__ */ Ae(Mm, [["render", Nm], ["styles", [Tm]]]), Lm = {
  viewBox: "0 0 17 19",
  width: "1.08em",
  height: "1.2em"
};
function Bm(e, t) {
  return R(), H("svg", Lm, t[0] || (t[0] = [
    V("g", { fill: "none" }, [
      V("path", {
        d: "M3.54126 9.49961L8.49959 3.95795L13.4579 9.49961",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      V("path", {
        d: "M8.5 15.0413V3.95795",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const Pm = ht({ name: "icons-arrow-send", render: Bm }), $m = /* @__PURE__ */ Ce({
  __name: "BaseAttachment.ce",
  props: {
    attachment: { type: Object },
    showProgress: { type: Boolean }
  },
  emits: ["remove"],
  setup(e, { emit: t }) {
    const n = e, r = t, u = re(() => ({
      id: n.attachment.id,
      name: n.attachment.file.name,
      url: n.attachment.url,
      progress: n.attachment.progress,
      showProgress: !!n.showProgress,
      removable: !0
      // Assuming all attachments are removable in this context
    }));
    function o(i) {
      r("remove", i);
    }
    return (i, s) => (R(), Ue(xc, {
      id: u.value.id,
      name: u.value.name,
      url: u.value.url,
      progress: u.value.progress,
      "show-progress": u.value.showProgress,
      removable: u.value.removable,
      onRemove: o
    }, null, 8, ["id", "name", "url", "progress", "show-progress", "removable"]));
  }
}), zm = "", Um = /* @__PURE__ */ Ae($m, [["styles", [zm]]]), Hm = { class: "am-ui-attachment-container" }, jm = { class: "am-ui-attachment-list" }, qm = /* @__PURE__ */ Ce({
  __name: "AttachmentList.ce",
  props: {
    attachments: { type: Array },
    showProgress: { type: Boolean }
  },
  emits: ["remove"],
  setup(e, { emit: t }) {
    const n = e, r = t;
    function u(o) {
      r("remove", o);
    }
    return (o, i) => (R(), H("div", Hm, [
      V("div", jm, [
        (R(!0), H(Fe, null, tn(o.attachments, (s) => (R(), Ue(Um, {
          key: s.file.name + s.id,
          attachment: s,
          "show-progress": n.showProgress,
          removable: !0,
          onRemove: (a) => u(s.id)
        }, null, 8, ["attachment", "show-progress", "onRemove"]))), 128))
      ])
    ]));
  }
}), Gm = ".am-ui-attachment-container{overflow-x:auto;padding:0;scrollbar-width:none;-ms-overflow-style:none}.am-ui-attachment-container::-webkit-scrollbar{display:none;width:0;height:0}.am-ui-attachment-list{display:flex;flex-wrap:nowrap;margin:0;padding:0;gap:.75rem;list-style:none}", Vm = /* @__PURE__ */ Ae(qm, [["styles", [Gm]]]), Km = {
  viewBox: "0 0 14 14",
  width: "1.2em",
  height: "1.2em"
};
function Wm(e, t) {
  return R(), H("svg", Km, t[0] || (t[0] = [
    V("g", { fill: "none" }, [
      V("path", {
        d: "M7.72003 11.8135L12.2502 7.17487",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }),
      V("path", {
        d: "M9.33308 3.50007L4.42491 8.50857C4.2062 8.72735 4.08333 9.02405 4.08333 9.3334C4.08333 9.64276 4.2062 9.93946 4.42491 10.1582C4.6437 10.377 4.94039 10.4998 5.24975 10.4998C5.55911 10.4998 5.8558 10.377 6.07458 10.1582L10.9827 5.14974C11.4202 4.71217 11.6659 4.11879 11.6659 3.50007C11.6659 2.88135 11.4202 2.28797 10.9827 1.8504C10.5452 1.41297 9.9518 1.16724 9.33308 1.16724C8.71436 1.16724 8.12098 1.41297 7.68341 1.8504L2.77466 6.85832C2.11823 7.51475 1.74945 8.40507 1.74945 9.3334C1.74945 10.2617 2.11823 11.1521 2.77466 11.8085C3.4311 12.4649 4.32141 12.8337 5.24975 12.8337C6.17808 12.8337 7.0684 12.4649 7.72483 11.8085",
        stroke: "currentColor",
        "stroke-width": "1.41667",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    ], -1)
  ]));
}
const Zm = ht({ name: "icons-clip", render: Wm }), Jm = ["accept"], Ym = /* @__PURE__ */ Ce({
  __name: "AttachmentUploader.ce",
  props: {
    attachments: { type: Array },
    maxFiles: { type: Number },
    attachmentsAllowed: { type: Boolean }
  },
  emits: ["addFiles"],
  setup(e, { emit: t }) {
    const n = t, r = e, u = ye(), o = ye([]), i = re(() => Af(Yt().allowedMimePatterns));
    function s(h) {
      h.currentTarget.blur();
    }
    function a() {
      var h;
      (h = u.value) == null || h.click();
    }
    function c(h) {
      Array.from(h.target.files || []).forEach((p) => {
        const { ok: _, error: M } = l(p);
        if (_)
          o.value.push({ file: p, progress: 0 });
        else
          for (const A of M || [])
            Sh(A, ac.ERROR);
      }), n(
        "addFiles",
        o.value.map((p) => p.file)
      ), o.value = [], h.target.value = "";
    }
    function l(h) {
      const f = [], p = Cf(h, Yt().allowedMimePatterns);
      if (!p.ok) {
        const _ = Sf(p);
        f.push(`${_} (${h.type || "unknown"} - ${h.name})`);
      }
      return h.size > Yt().maxFileSize && f.push(
        `The file is too large (${ms(h.size)}). Max is ${ms(Yt().maxFileSize)}.`
      ), f.length > 0 ? { ok: !1, error: f } : { ok: !0 };
    }
    const d = re(() => {
      if (!r.attachmentsAllowed)
        return !1;
      const h = r.maxFiles ?? 1 / 0;
      return r.attachments.length < h;
    });
    return (h, f) => (R(), H(Fe, null, [
      Y(Mt, {
        style: "secondary",
        "icon-only": "",
        small: "",
        "aria-label": "Attach file",
        disabled: !d.value,
        onMousedown: Tr(s, ["prevent"]),
        onClick: a
      }, {
        icon: Ye(() => [
          Y(q(Zm), { "aria-label": "Attach file icon" })
        ]),
        _: 1
      }, 8, ["disabled"]),
      V("input", {
        ref_key: "fileInput",
        ref: u,
        type: "file",
        accept: i.value,
        hidden: "",
        onChange: c
      }, null, 40, Jm)
    ], 64));
  }
}), Xm = "", Qm = /* @__PURE__ */ Ae(Ym, [["styles", [Xm]]]), e2 = { class: "am-chat-widget__input" }, t2 = { class: "am-chat-widget__input-inner" }, n2 = /* @__PURE__ */ Ce({
  __name: "ChatInputForm.ce",
  setup(e) {
    const t = ye([]), { activeAgentPromptPlaceholder: n } = Pu(), r = Qe(), { activeThreadId: u } = At(r), { isSending: o } = Iu(u), { sendMessage: i } = fu(), s = ye(""), a = ye(!0), c = ye(), l = re(() => o.value || t.value.length === 0 && s.value.trim() === "");
    function d(A) {
      !A.trim() && t.value.length === 0 || (i(A, t.value), s.value = "", t.value = []);
    }
    function h(A) {
      l.value || d(A.value);
    }
    function f(A) {
      var k;
      l.value || ((k = A == null ? void 0 : A.preventDefault) == null || k.call(A), d(s.value));
    }
    function p(A) {
      A.forEach(
        (k) => t.value.push({
          file: k,
          progress: 0,
          id: "",
          url: "",
          name: ""
        })
      );
    }
    function _(A) {
      t.value = t.value.filter((k) => k.id !== A);
    }
    function M(A) {
      var k;
      A.target.closest('button, input[type="file"]') || (k = c.value) == null || k.focusInput();
    }
    return Ct(u, (A, k) => {
      A !== k && (s.value = "");
    }), (A, k) => (R(), H("div", e2, [
      V("div", t2, [
        Y(wm, { "is-mode-impact": !0 }),
        V("form", {
          class: "am-chat-widget__form",
          onSubmit: Tr(f, ["prevent"]),
          onClick: M
        }, [
          a.value && t.value.length ? (R(), Ue(Vm, {
            key: 0,
            attachments: t.value,
            "show-progress": !1,
            onRemove: _
          }, null, 8, ["attachments"])) : Se("", !0),
          Y(Dm, {
            ref_key: "composerRef",
            ref: c,
            modelValue: s.value,
            "onUpdate:modelValue": k[0] || (k[0] = (F) => s.value = F),
            placeholder: q(n),
            "stripped-html": !0,
            attachments: t.value,
            onSubmit: h
          }, null, 8, ["modelValue", "placeholder", "attachments"]),
          Y(Om, null, {
            left: Ye(() => [
              a.value ? (R(), Ue(Qm, {
                key: 0,
                attachments: t.value,
                "max-files": 1,
                "attachments-allowed": !q(o),
                onAddFiles: p
              }, null, 8, ["attachments", "attachments-allowed"])) : Se("", !0)
            ]),
            right: Ye(() => [
              Y(Mt, {
                style: "primary",
                class: "am-chat-widget__input-send-button",
                type: "submit",
                "icon-only": "",
                "is-sending": l.value,
                "aria-label": "Send message",
                onClick: f
              }, {
                icon: Ye(() => [
                  Y(q(Pm), { "aria-label": "Send message icon" })
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
}), r2 = ".am-chat-widget__input{display:flex;flex:0 0 auto;justify-content:center;grid-row:5;box-sizing:border-box;width:100%;padding-bottom:.625rem;justify-self:center;padding-inline:.625rem}@container chat-widget (min-width: 768px){.am-chat-widget__input{padding-bottom:1.5rem}}button.am-chat-widget__input-send-button{box-sizing:border-box;width:2.25rem;height:2.0625rem;padding:0}button.am-chat-widget__input-send-button svg{width:1.0625rem;height:1.1875rem}.am-chat-widget__input-inner{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;width:100%;max-width:39.375rem;padding:0;gap:.375rem}@container chat-widget (min-width: 1290px){.am-chat-widget__input-inner{max-width:48rem}}.am-chat-widget__form{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;width:100%;max-width:39.375rem;padding:.75rem;border:.0625rem solid var(--border-input);border-radius:.5625rem;background-color:var(--bg-input-panel);box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;color:var(--text-input-panel);transition:border-color .15s ease-out;cursor:text;gap:.75rem}.am-chat-widget__form:hover,.am-chat-widget__form:focus-within{border-color:var(--border-input-hover)}@container chat-widget (min-width: 1290px){.am-chat-widget__form{max-width:48rem}}[data-widget-mode=dialog] .am-chat-widget__form{box-shadow:none}", u2 = /* @__PURE__ */ Ae(n2, [["styles", [r2]]]), o2 = {
  key: 0,
  class: "am-chat-widget-state-prompt",
  "aria-hidden": "true"
}, i2 = { class: "am-chat-widget-state-prompt__header" }, s2 = {
  key: 0,
  class: "am-chat-widget-state-prompt__body"
}, a2 = /* @__PURE__ */ Ce({
  __name: "ChatStatePrompt.ce",
  setup(e) {
    const t = Qe(), { activeThreadId: n, isLoadingSession: r, hasMessages: u, errors: o } = At(t), { isLoadingMessages: i } = Iu(n), { activeAgentIntro: s, activeAgentDescription: a } = Pu();
    return (c, l) => !q(u) && !(q(i) || q(r) || q(o).length) ? (R(), H("div", o2, [
      V("div", i2, ct(q(s)), 1),
      q(a) ? (R(), H("div", s2, [
        Y(nl, { source: q(a) }, null, 8, ["source"])
      ])) : Se("", !0)
    ])) : Se("", !0);
  }
}), c2 = ".am-chat-widget-state-prompt{flex:0 0 auto;text-align:center;color:var(--text-thread);font-family:IBM Plex Sans,sans-serif;font-size:1.5rem;font-weight:400;line-height:150%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget-state-prompt{display:flex;flex-direction:column;flex:0 0 auto;justify-content:center;align-items:center;grid-row:3;width:100%;padding-bottom:.625rem;justify-self:center;padding-inline:.9375rem}@container chat-widget (min-width: 768px){[data-thread-state=empty] .am-chat-widget-state-prompt{padding-bottom:1.25rem}}[data-thread-state=empty] .am-chat-widget-state-prompt__header{width:100%;max-width:39.375rem}@container chat-widget (min-width: 1290px){[data-thread-state=empty] .am-chat-widget-state-prompt__header{max-width:48rem}}[data-thread-state=empty] .am-chat-widget-state-prompt__header:not(:last-child){margin-bottom:1rem}[data-thread-state=empty] .am-chat-widget-state-prompt__body{width:100%;max-width:39.375rem;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:400;line-height:150%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget-state-prompt__body p{margin:0;line-height:150%}[data-thread-state=empty] .am-chat-widget-state-prompt__body ul,[data-thread-state=empty] .am-chat-widget-state-prompt__body ol,[data-thread-state=empty] .am-chat-widget-state-prompt__body ul li,[data-thread-state=empty] .am-chat-widget-state-prompt__body ol li{text-align:left}@container chat-widget (min-width: 1290px){[data-thread-state=empty] .am-chat-widget-state-prompt__body{max-width:48rem}}", l2 = /* @__PURE__ */ Ae(a2, [["styles", [c2]]]), d2 = {
  key: 0,
  class: "am-chat-widget__error-msg",
  role: "alert",
  "aria-live": "assertive"
}, f2 = {
  key: 0,
  class: "am-chat-widget__error-msg-icon"
}, h2 = ["src"], p2 = { class: "am-chat-widget__error-msg-content" }, g2 = {
  key: 0,
  class: "am-chat-widget__error-msg-content-title"
}, b2 = { class: "am-chat-widget__error-msg-content-message" }, m2 = {
  key: 1,
  class: "am-chat-widget__error-msg-content-error"
}, _2 = { class: "am-chat-widget__error-msg-action" }, x2 = /* @__PURE__ */ Ce({
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
    const n = e, r = t;
    function u(s) {
      return typeof s == "object" && !("src" in s);
    }
    function o() {
      r("action");
    }
    const i = n.visible ?? !0;
    return (s, a) => q(i) ? (R(), H("div", d2, [
      s.icon ? (R(), H("div", f2, [
        u(s.icon) ? (R(), Ue(M0(s.icon), { key: 0 })) : Se("", !0),
        typeof s.icon == "string" ? (R(), H("img", {
          key: 1,
          src: s.icon
        }, null, 8, h2)) : Se("", !0)
      ])) : Se("", !0),
      V("div", p2, [
        s.title ? (R(), H("h3", g2, ct(s.title), 1)) : Se("", !0),
        V("p", b2, ct(s.message), 1),
        s.errorMsg ? (R(), H("p", m2, ct(s.errorMsg), 1)) : Se("", !0)
      ]),
      V("div", _2, [
        Y(Mt, {
          style: "danger",
          full: "",
          "aria-label": "Error action button",
          onClick: o
        }, {
          default: Ye(() => [
            Qn(ct(s.actionLabel), 1)
          ]),
          _: 1
        })
      ])
    ])) : Se("", !0);
  }
}), y2 = ".am-chat-widget__error-msg{display:flex;align-items:center;box-sizing:border-box;width:85%;max-width:33.4375rem;margin:0 auto;padding:.625rem 1rem 1.25rem;border:.0625rem solid var(--border-error-msg);border-radius:.5625rem;background-color:var(--bg-error-msg);box-shadow:0 .125rem .25rem #3d36444d,0 .125rem .375rem .0625rem #3c40441f}@container chat-widget (min-width: 1290px){.am-chat-widget__error-msg{max-width:652px}}.am-chat-widget__error-msg-icon{display:flex;flex:0 0 auto;align-items:center;margin-right:1rem;padding:0 .5rem;color:var(--color-error-msg-icon);align-self:stretch}.am-chat-widget__error-msg-icon img,.am-chat-widget__error-msg-icon svg{width:1.25rem;height:1.25rem}.am-chat-widget__error-msg-content{flex:1 1 auto;text-align:left}.am-chat-widget__error-msg-content-title{margin:0;font-family:IBM Plex Sans,sans-serif;font-size:.8125rem;font-weight:500;line-height:200%;letter-spacing:0;color:var(--color-error-msg-title)}.am-chat-widget__error-msg-content-message{margin:0 0 .5rem;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0;color:var(--color-error-msg-text)}.am-chat-widget__error-msg-content-error{margin:0;font-family:IBM Plex Sans,sans-serif;font-size:.75rem;font-weight:500;line-height:100%;letter-spacing:0;color:var(--color-error-msg-text)}.am-chat-widget__error-msg-action{display:flex;align-items:flex-end;margin-left:1.5rem;align-self:stretch}[data-widget-mode=dialog] .am-chat-widget__error-msg{box-shadow:none}", v2 = /* @__PURE__ */ Ae(x2, [["styles", [y2]]]), w2 = { class: "am-chat-widget__error-container" }, k2 = /* @__PURE__ */ Ce({
  __name: "ChatErrorContainer.ce",
  setup(e) {
    const t = Qe(), n = re(() => t.errors ?? []), r = ye(null);
    async function u(o) {
      r.value = o.id;
      try {
        o.onRetry && await o.onRetry();
      } catch (i) {
        console.error("Error during retry calling (Error Container):", i);
      } finally {
        r.value = null;
      }
    }
    return (o, i) => (R(), H("div", w2, [
      Y(Ya, {
        name: "fade",
        tag: "div",
        class: "am-chat-widget__error-container-wrapper",
        "enter-active-class": "fade-enter-active",
        "leave-active-class": "fade-leave-active"
      }, {
        default: Ye(() => [
          (R(!0), H(Fe, null, tn(n.value, (s) => (R(), Ue(v2, {
            key: s.id,
            title: s.title,
            message: s.message,
            "error-msg": s.errorMsg,
            "action-label": s.actionLabel,
            visible: s.visible,
            icon: s.icon,
            onAction: (a) => u(s)
          }, null, 8, ["title", "message", "error-msg", "action-label", "visible", "icon", "onAction"]))), 128))
        ]),
        _: 1
      })
    ]));
  }
}), E2 = ".am-chat-widget__error-container{position:relative;flex:0 0 auto;text-align:center;color:var(--text-thread);font-family:IBM Plex Sans,sans-serif;font-size:1.5rem;font-weight:400;line-height:100%;letter-spacing:0}[data-thread-state=empty] .am-chat-widget__error-container{display:flex;flex-direction:column;flex:0 0 auto;justify-content:center;align-items:center;grid-row:4;width:100%;padding-bottom:.625rem;justify-self:center}@container chat-widget (min-width: 768px){[data-thread-state=empty] .am-chat-widget__error-container{padding-bottom:1.25rem}}.am-chat-widget__error-container-wrapper{position:absolute;top:-1.25rem;z-index:1000;display:flex;flex-direction:column;align-items:center;width:100%;transform:translateY(-100%);gap:.75rem}.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}", C2 = /* @__PURE__ */ Ae(k2, [["styles", [E2]]]), A2 = { class: "am-ui-flash-container" }, S2 = { class: "am-ui-flash-msg__text" }, D2 = /* @__PURE__ */ Ce({
  __name: "FlashContainer.ce",
  setup(e) {
    const { state: t } = Dh(), n = re(() => t.value.messages);
    return (r, u) => (R(), H("div", A2, [
      Y(Ya, {
        name: "am-ui-flash",
        tag: "div"
      }, {
        default: Ye(() => [
          (R(!0), H(Fe, null, tn(n.value, (o) => (R(), H("div", {
            key: o.id,
            class: Ft(["am-ui-flash-msg", o.type && `am-ui-flash-msg--${o.type}`])
          }, [
            V("span", S2, ct(o.text), 1),
            Y(Mt, {
              style: "link",
              class: "am-ui-flash-msg__close",
              "aria-label": `Delete flash message: ${o.text}`,
              onClick: (i) => q(mc)(o.id)
            }, {
              default: Ye(() => [
                Y(q(li), { "aria-label": "Icon delete flash message" })
              ]),
              _: 2
            }, 1032, ["aria-label", "onClick"])
          ], 2))), 128))
        ]),
        _: 1
      })
    ]));
  }
}), T2 = ".am-ui-flash-container{position:fixed;top:0;left:50%;z-index:10000;box-sizing:border-box;width:100%;max-width:30rem;padding:1rem;transform:translate(-50%);pointer-events:none;padding-inline:.625rem}.am-ui-flash-container .am-ui-flash-msg{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;padding:.75rem 1rem;border-radius:.1875rem;box-shadow:0 .125rem .25rem #3d36444d,0 .125rem .375rem .0625rem #3c40441f;color:var(--color-error-msg-title);pointer-events:auto;font-family:IBM Plex Sans,sans-serif;font-size:.875rem;font-weight:500;line-height:100%;letter-spacing:0}.am-ui-flash-container .am-ui-flash-msg.am-ui-flash-msg--error{border:.0625rem solid var(--flash-error-border);background:var(--flash-error-bg)}.am-ui-flash-container .am-ui-flash-msg.am-ui-flash-msg--info{border:.0625rem solid var(--flash-info-border);background:var(--flash-info-bg)}.am-ui-flash-container .am-ui-flash-msg.am-ui-flash-msg--success{border:.0625rem solid var(--flash-success-border);background:var(--flash-success-bg)}.am-ui-flash-container .am-ui-flash-msg .am-ui-flash-msg__text{flex:1;margin-right:.5rem}.am-ui-flash-container .am-ui-flash-msg .am-ui-flash-msg__close{margin-left:.5rem;padding:0;border:none;background:none;line-height:100%;color:inherit;cursor:pointer}.am-ui-flash-container .am-ui-flash-msg .am-ui-flash-msg__close svg{width:1rem;height:1rem}[data-widget-mode=dialog] .am-ui-flash-container{position:absolute;top:1rem;width:calc(100% - 2rem);max-width:none}[data-widget-mode=dialog] .am-ui-flash-msg{box-shadow:none}.am-ui-flash-enter-from,.am-ui-flash-leave-to{transform:translateY(-10%);opacity:0}.am-ui-flash-enter-active,.am-ui-flash-leave-active{transition:all .3s ease}", M2 = /* @__PURE__ */ Ae(D2, [["styles", [T2]]]), F2 = ["data-thread-state"], R2 = /* @__PURE__ */ Ce({
  __name: "ChatThread.ce",
  setup(e) {
    const t = Qe(), { activeThreadId: n, isLoadingSession: r, hasMessages: u } = At(t), { isLoadingMessages: o } = Iu(n), i = re(() => r.value || o.value || u.value ? "has-messages" : "empty");
    return (s, a) => (R(), H("div", {
      class: "am-chat-widget__thread",
      "data-thread-state": i.value
    }, [
      Y(gm),
      Y(l2),
      Y(Yb),
      Y(C2),
      Y(u2),
      Y(M2)
    ], 8, F2));
  }
}), I2 = ".am-chat-widget__thread{position:relative;display:flex;flex-direction:column;height:100vh;background-color:var(--bg-thread);color:var(--text-thread);overflow:hidden}.am-chat-widget__thread[data-thread-state=has-messages]{display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch}.am-chat-widget__thread[data-thread-state=empty]{display:grid;grid-template-columns:1fr;grid-template-rows:auto 1fr auto auto auto 1fr;row-gap:0}", N2 = /* @__PURE__ */ Ae(R2, [["styles", [I2]]]), O2 = ["data-theme", "data-widget-mode", "data-widget-position"], L2 = { class: "am-chat-widget__thread-wrapper" }, B2 = /* @__PURE__ */ Ce({
  name: "AmChatWidget",
  inheritAttrs: !1,
  customElement: !0,
  __name: "ChatWidget.ce",
  setup(e) {
    const t = Ru(), n = re(() => t.isOpen), r = () => {
      t.close();
    }, u = ic(), o = Yt();
    u.setTheme(o.themeMode), u.setWidgetMode(o.widgetMode), u.setJwt(o.jwt ?? ""), u.setMaxFileSize(o.maxFileSize ?? 0);
    const i = ye(null), { themeMode: s, toggle: a } = sc(i);
    Aa("theme", { mode: s, toggle: a });
    const c = Qe(), { initChatSession: l } = fu();
    let d = () => {
    };
    return Fn(async () => {
      u.widgetMode === er.DIALOG && t.close(), l(), d = c.subscribeToDeleteThread((h) => {
        fu().deleteThreadFromStore(h.threadId);
      });
    }), D0(() => {
      d();
    }), (h, f) => (R(), H("div", {
      ref_key: "widgetRoot",
      ref: i,
      class: "am-chat-widget",
      "data-theme": q(s),
      "data-widget-mode": q(u).widgetMode,
      "data-visible": !0,
      "data-widget-position": q(o).widgetPosition,
      role: "region",
      "aria-label": "Chat widget"
    }, [
      V("div", {
        class: Ft([
          "am-chat-widget__sidebar-wrapper",
          { "am-chat-widget__sidebar-wrapper--open": n.value }
        ]),
        onClick: Tr(r, ["self"])
      }, [
        Y(t1)
      ], 2),
      n.value ? (R(), H("div", {
        key: 0,
        class: "am-chat-widget__overlay",
        onClick: r
      })) : Se("", !0),
      V("div", L2, [
        Y(N2)
      ])
    ], 8, O2));
  }
}), P2 = ".am-chat-widget{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--flash-error-bg: hsl(5, 50%, 95%);--flash-error-border: hsl(3, 49%, 53%);--flash-info-bg: hsl(205, 60%, 95%);--flash-info-border: hsl(205, 55%, 55%);--flash-success-bg: hsl(125, 50%, 92%);--flash-success-border: hsl(125, 45%, 45%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 80%, 53%);--bg-primary-btn-disabled: hsl(223, 92%, 76%);--text-side-header: hsl(227, 6%, 53%);--text-side: hsl(232, 16%, 27%);--text-side-active: hsl(232, 16%, 27%);--text-side-bg-active: hsl(210, 6%, 86%);--text-thread: hsl(232, 16%, 27%);--bg-thread: hsl(0, 0%, 98%);--bg-side: hsl(240, 14%, 97%);--border-side: hsl(240, 3%, 88%);--color-secondary-btn: hsl(232, 16%, 27%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(240, 6%, 87%);--bg-input-panel: hsl(0, 0%, 100%);--text-input-panel: hsl(233, 7%, 47%);--text-header: hsl(230, 29%, 17%);--border-header: hsl(240, 3%, 88%);--color-chat-avatar-icon: hsl(231, 12%, 34%);--bg-chat-avatar-icon: hsl(210, 6%, 94%);--border-chat-avatar-icon: hsl(228, 6%, 83%);--color-message: hsl(232, 16%, 27%);--bg-message-user: hsl(210, 6%, 94%);--border-input: hsl(240, 5.9%, 90%);--border-input-hover: hsl(240, 6.1%, 87.1%);--color-tertiary-btn: hsl(233, 7%, 47%);--bg-tertiary-btn: hsl(0, 0%, 98%);--border-tertiary-btn: hsl(240, 3%, 88%);--bg-tertiary-hover-btn: hsl(0, 0%, 96%);--bg-tertiary-active-btn: hsl(0, 0%, 94%);--border-tertiary-hover-btn: hsl(240, 3%, 80%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 93.3%);--skeleton-highlight: hsla(0, 0%, 100%, .6);--bg-table-header: hsl(210, 6%, 94%);--code-bg: hsl(0, 0%, 93.3%);--code-color: hsl(0, 0%, 20%);font-family:IBM Plex Sans,sans-serif;font-size:1rem;font-weight:500;line-height:100%;letter-spacing:0;display:flex;overflow:hidden;background-color:var(--bg-thread);container-type:inline-size;container-name:chat-widget}.am-chat-widget[data-visible=false]{transition:opacity .3s ease;opacity:0;pointer-events:none}.am-chat-widget[data-visible=true]{opacity:1;pointer-events:auto}.am-chat-widget[data-theme=dark]{--color-primary-btn: hsl(0, 0%, 100%);--color-error-msg-icon: hsl(232, 7%, 47%);--border-error-msg: hsl(3, 49%, 53%);--bg-error-msg-btn: hsl(3.24, 76.88%, 47.25%);--bg-error-msg-btn-hover: hsl(3.24, 76.88%, 37.25%);--color-error-msg-text: hsl(231, 12%, 34%);--color-error-msg-title: hsl(0, 0%, 0%);--bg-error-msg: hsl(5, 50%, 95%);--flash-error-bg: hsl(5, 50%, 95%);--flash-error-border: hsl(3, 49%, 53%);--flash-info-bg: hsl(205, 60%, 95%);--flash-info-border: hsl(205, 55%, 55%);--flash-success-bg: hsl(125, 50%, 92%);--flash-success-border: hsl(125, 45%, 45%);--bg-primary-btn: hsl(223, 92%, 56%);--bg-primary-btn-hover: hsl(223, 80%, 53%);--bg-primary-btn-disabled: hsl(223, 92%, 76%);--text-side-header: hsl(0, 0%, 63%);--text-side: hsl(0, 0%, 90%);--text-side-active: hsl(0, 0%, 90%);--text-side-bg-active: hsl(0, 0%, 14%);--text-thread: hsl(0, 0%, 90%);--bg-thread: hsl(0, 0%, 18%);--bg-side: hsl(240, 4%, 17%);--border-side: hsl(0, 0%, 30%);--color-secondary-btn: hsl(0, 0%, 90%);--bg-secondary-btn: transparent;--border-secondary-btn: hsl(0, 0%, 26%);--bg-input-panel: hsl(0, 0%, 16%);--text-input-panel: hsl(0, 0%, 70%);--text-header: hsl(0, 0%, 100%);--border-header: hsl(0, 0%, 30%);--color-chat-avatar-icon: hsl(0, 0%, 76%);--bg-chat-avatar-icon: hsl(0, 0%, 23%);--border-chat-avatar-icon: hsl(0, 0%, 33%);--color-message: hsl(0, 0%, 90%);--bg-message-user: hsl(0, 0%, 23%);--border-input: hsl(0, 0%, 27%);--border-input-hover: hsl(0, 0%, 30%);--color-tertiary-btn: hsl(0, 0%, 70%);--bg-tertiary-btn: hsl(0, 0%, 18%);--border-tertiary-btn: hsl(0, 0%, 30%);--bg-tertiary-hover-btn: hsl(0, 0%, 16%);--bg-tertiary-active-btn: hsl(0, 0%, 14%);--border-tertiary-hover-btn: hsl(0, 0%, 20%);--bg-launcher-btn: hsl(0, 0%, 31%);--bg-launcher-btn-hover: hsl(0, 0%, 41%);--color-launcher-btn: hsl(0, 0%, 100%);--skeleton-bg: hsl(0, 0%, 16.5%);--skeleton-highlight: hsla(0, 0%, 100%, .1);--bg-table-header: hsl(0, 0%, 23%);--code-bg: hsl(0, 0%, 26.5%);--code-color: hsl(0, 0%, 90%)}.am-chat-widget__sidebar-wrapper{position:fixed;top:0;bottom:0;left:0;z-index:1500;width:75%;max-width:280px;background:var(--bg-side);color:var(--text-side);transition:transform .3s ease-in-out;transform:translate(-100%);border-right:.0625rem solid var(--border-side);overflow-y:hidden}.am-chat-widget__sidebar-wrapper--open{transform:translate(0)}@container chat-widget (min-width: 768px){.am-chat-widget__sidebar-wrapper{position:relative;display:flex;width:16.25rem;transform:translate(0)}.am-chat-widget__sidebar-wrapper--open{transform:translate(0)}}.am-chat-widget__thread-wrapper{display:flex;flex-direction:column;flex:1 0 100%;background-color:var(--bg-thread);color:var(--text-thread);overflow:hidden;transition:flex-basis .3s ease-in-out}@container chat-widget (min-width: 768px){.am-chat-widget__thread-wrapper{flex:1 0 calc(100% - 16.25rem);transition:flex-basis .3s ease-in-out}}.am-chat-widget__overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1100;background-color:#0006}.am-chat-widget[data-widget-mode=dialog]{position:fixed;right:1.75rem;bottom:5.5rem;width:min(100% - 2rem,557px);height:calc(100vh - 160px);height:min(100% - 100px,557px);border-radius:.5625rem;box-shadow:0 .1875rem .5625rem #3d364426,0 .1875rem .75rem .0625rem #3c40441f;container-type:size}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__overlay{position:absolute;z-index:1100;border-radius:inherit;background-color:#0006;top:0;right:0;bottom:0;left:0}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__sidebar-wrapper{position:absolute;top:0;bottom:0;left:0;width:75%;max-width:280px;background:var(--bg-side);color:var(--text-side);border-right:.0625rem solid var(--border-side);transition:transform .3s ease-in-out;transform:translate(-100%)}.am-chat-widget[data-widget-mode=dialog] .am-chat-widget__sidebar-wrapper--open{transform:translate(0)}.am-chat-widget[data-widget-mode=dialog][data-widget-position=bottom-left]{right:auto;left:1.75rem}", $2 = /* @__PURE__ */ Ae(B2, [["styles", [P2]]]), xi = /* @__PURE__ */ Wa($2), z2 = xi.prototype.connectedCallback;
xi.prototype.connectedCallback = async function(...e) {
  var n;
  z2.apply(this, ...e);
  const t = (n = this._instance) == null ? void 0 : n.appContext.app;
  t && uc(t);
};
customElements.get("am-chat-widget") || customElements.define("am-chat-widget", xi);
let Bo = !1, mu = null;
async function Us() {
  Bo || (mu = document.createElement("am-chat-widget"), document.body.appendChild(mu), Bo = !0);
}
function U2() {
  const e = document.currentScript;
  return {
    mode: (e == null ? void 0 : e.dataset.widgetMode) || "dialog",
    theme: (e == null ? void 0 : e.dataset.theme) || "light",
    jwt: (e == null ? void 0 : e.dataset.jwt) || void 0,
    widgetPosition: (e == null ? void 0 : e.dataset.widgetPosition) || Fu.BOTTOM_RIGHT,
    endpoint: (e == null ? void 0 : e.dataset.endpoint) || "",
    baseUrl: (e == null ? void 0 : e.dataset.baseUrl) || "",
    fileTypes: (e == null ? void 0 : e.dataset.fileTypes) || [],
    maxFileSize: (e == null ? void 0 : e.dataset.maxFileSize) || void 0
  };
}
async function H2(e) {
  const t = { ...U2(), ...e };
  if (Ff({
    widgetMode: t.mode,
    themeMode: t.theme,
    widgetPosition: t.widgetPosition,
    jwt: t.jwt,
    endpoint: t.endpoint,
    apiBaseUrl: t.baseUrl,
    allowedMimePatterns: t.fileTypes,
    maxFileSize: t.maxFileSize
  }), t.mode === er.DIALOG) {
    const n = document.createElement("am-chat-launcher");
    document.body.appendChild(n), n.shadowRoot.querySelector(".am-chat-launcher").setAttribute("data-widget-position", t.widgetPosition ?? Fu.BOTTOM_RIGHT), n.addEventListener("open", async () => {
      if (!Bo)
        await Us(), mu.shadowRoot.querySelector("div.am-chat-widget").setAttribute("data-visible", "true");
      else {
        const i = mu.shadowRoot.querySelector("div.am-chat-widget");
        j2(i);
      }
    });
    return;
  }
  await Us();
}
function j2(e) {
  const t = e.getAttribute("data-visible") === "true";
  e.setAttribute("data-visible", String(!t));
}
typeof window < "u" && (window.initLauncher = H2);
export {
  H2 as initLauncher
};
