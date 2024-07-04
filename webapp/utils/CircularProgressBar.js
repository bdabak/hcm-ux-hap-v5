var CircularProgressBar = (function () {
  "use strict";
  const t = {
      colorSlice: "#00a1ff",
      fontColor: "#222",
      fontSize: "1.2rem",
      fontWeight: 400,
      lineargradient: !1,
      number: !0,
      round: !1,
      fill: "none",
      unit: "%",
      rotation: -90,
      size: 60,
      stroke: 7,
    },
    e = (t) => {
      let { rotation: e, animationSmooth: n } = t;
      return `transform:rotate(${e}deg);transform-origin: 50% 50%;${
        n ? `transition: stroke-dashoffset ${n}` : ""
      }`;
    },
    n = (t) => ({ "stroke-dasharray": t || "264" }),
    o = (t) => {
      let { round: e } = t;
      return { "stroke-linecap": e ? "round" : "" };
    },
    r = (t) => ({ "font-size": t.fontSize, "font-weight": t.fontWeight }),
    i = (t) => document.querySelector(t),
    s = (t, e) => {
      let { lineargradient: n, index: o, colorSlice: r } = e;
      t.setAttribute("stroke", n ? `url(#linear-${o})` : r);
    },
    a = (t, e) => {
      for (const n in e) t?.setAttribute(n, e[n]);
    },
    c = (t) => document.createElementNS("http://www.w3.org/2000/svg", t),
    l = (t, e) => {
      const n = c("tspan");
      return n.classList.add(t), e && (n.textContent = e), n;
    },
    d = (t, e, n) => {
      const o = 264 - (t / 100) * (n ? 2.64 * (100 - n) : 264);
      return e ? -o : o;
    },
    f = function (t, e, n) {
      return void 0 === n && (n = "beforeend"), t.insertAdjacentElement(n, e);
    };
  return class {
    constructor(t, e) {
      void 0 === e && (e = {}), (this.t = t), (this.o = e);
      const n = document.querySelectorAll(`#${t}`),
        o = [].slice.call(n);
      o.map((t, n) => {
        const o = JSON.parse(t.getAttribute("data-pie"));
        t.setAttribute("data-pie-index", o.index || e.index || n + 1);
      }),
        (this.i = o);
    }
    initial(t) {
      const e = t || this.i;
      Array.isArray(e) ? e.map((t) => this.l(t)) : this.l(e);
    }
    h(t, d, h) {
      const u = this.t;
      h.number &&
        f(
          t,
          ((t, e) => {
            const n = c("text");
            n.classList.add(`circle-rating-text`),
              f(n, l(`${e}-percent-${t.index}`)),
              f(n, l(`circle-rating-unit`, ` ${t.unit}`));
            const o = {
              x: "50%",
              y: "50%",
              fill: t.fontColor,
              "text-anchor": "middle",
              dy: t.textPosition || "0.35em",
              ...r(t),
            };
            return a(n, o), n;
          })(h, u)
        );
      const $ = i(`.${u}-circle-${h.index}`),
        m = {
          fill: "none",
          "stroke-width": h.stroke,
          "stroke-dashoffset": "264",
          ...n(),
          ...o(h),
        };
      a($, m),
        this.animationTo({ ...h, element: $ }, !0),
        $.setAttribute("style", e(h)),
        s($, h),
        d.setAttribute("style", `width:${h.size}px;height:${h.size}px;`);
    }
    animationTo(e, n) {
      void 0 === n && (n = !1);
      const o = this.t,
        c = JSON.parse(
          i(`[data-pie-index="${e.index}"]`).getAttribute("data-pie")
        ),
        l = i(`.${o}-circle-${e.index}`);
      if (!l) return;
      const f = n ? e : { ...t, ...c, ...e, ...this.o };
      if ((n || s(l, f), !n && f.number)) {
        const t = { fill: f.fontColor, ...r(f) },
          e = i(`.${o}-text-${f.index}`);
        a(e, t);
      }
      const h = i(`.${o}-percent-${e.index}`);
      if (f.animationOff)
        return (
          f.number && (h.textContent = `${f.percent}`),
          void l.setAttribute("stroke-dashoffset", d(f.percent, f.inverse))
        );
      let u = JSON.parse(l.getAttribute("data-angel"));
      const $ = Math.round(e.percent);
      if (
        (0 === $ &&
          (f.number && (h.textContent = "0"),
          l.setAttribute("stroke-dashoffset", "264")),
        $ > 100 || $ < 0 || u === $)
      )
        return;
      let m,
        p = n ? 0 : u;
      const g = 1e3 / (f.speed || 1e3);
      let x = performance.now();
      const k = (t) => {
        m = requestAnimationFrame(k);
        const e = t - x;
        e >= g - 0.1 &&
          ((x = t - (e % g)), (p = p < f.percent ? p + 1 : p - 1)),
          l.setAttribute("stroke-dashoffset", d(p, f.inverse, f.cut)),
          h && f.number && (h.textContent = `${p}`),
          l.setAttribute("data-angel", p),
          l.parentNode.setAttribute("aria-valuenow", p),
          p === $ && cancelAnimationFrame(m);
      };
      requestAnimationFrame(k);
    }
    l(e) {
      const n = e.getAttribute("data-pie-index"),
        o = JSON.parse(e.getAttribute("data-pie")),
        r = { ...t, ...o, index: n, ...this.o },
        i = c("svg"),
        s = {
          role: "progressbar",
          width: r.size,
          height: r.size,
          viewBox: "0 0 100 100",
          "aria-valuemin": "0",
          "aria-valuemax": "100",
        };
      a(i, s),
        r.colorCircle && i.appendChild(this.u(r)),
        r.lineargradient &&
          i.appendChild(
            ((t) => {
              let { index: e, lineargradient: n } = t;
              const o = c("defs"),
                r = c("linearGradient");
              r.id = `linear-${e}`;
              const i = [].slice.call(n);
              o.appendChild(r);
              let s = 0;
              return (
                i.map((t) => {
                  const e = c("stop");
                  a(e, { offset: `${s}%`, "stop-color": `${t}` }),
                    r.appendChild(e),
                    (s += 100 / (i.length - 1));
                }),
                o
              );
            })(r)
          ),
        i.appendChild(this.u(r, "top")),
        e.appendChild(i),
        this.h(i, e, r);
    }
    u(t, r) {
      void 0 === r && (r = "bottom");
      const i = c("circle");
      let s = {};
      if (t.cut) {
        const r = 264 - 2.64 * (100 - t.cut);
        s = {
          "stroke-dashoffset": t.inverse ? -r : r,
          style: e(t),
          ...n(),
          ...o(t),
        };
      }
      const l = {
        fill: t.fill,
        stroke: t.colorCircle,
        "stroke-width": t.strokeBottom || t.stroke,
        ...s,
      };
      t.strokeDasharray && Object.assign(l, { ...n(t.strokeDasharray) });
      const d = {
        cx: "50%",
        cy: "50%",
        r: 42,
        "shape-rendering": "geometricPrecision",
        ...("top" === r ? { class: `${this.t}-circle-${t.index}` } : l),
      };
      return a(i, d), i;
    }
  };
})();
//# sourceMappingURL=circularProgressBar.min.js.map
