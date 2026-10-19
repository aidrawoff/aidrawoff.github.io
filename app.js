// AI Draw-Off gallery: the newest paintings first (data/index.json), one page per episode (e/<n>.html), and the
// downloads, made here in the visitor's browser from the painting's SVG: sharp at any size, nothing big stored.
(() => {
  const ROOT = location.pathname.includes("/e/") ? "../" : "";
  const FORMATS = [
    { key: "phone", label: "Phone wallpaper", w: 1080, h: 1920 },
    { key: "desktop", label: "Desktop wallpaper", w: 3840, h: 2160 },
    { key: "avatar", label: "Avatar", w: 1024, h: 1024 },
  ];
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const PAGE = 24;

  function vs(e) {
    const p = h("div", "vs");
    const a = h("span", "", e.A.lab); a.style.setProperty("--c", e.A.color);
    const b = h("span", "", e.B.lab); b.style.setProperty("--c", e.B.color);
    p.append(a, document.createTextNode(" vs "), b);
    return p;
  }

  // -- the gallery
  function gallery(list) {
    const grid = document.getElementById("grid"), more = document.getElementById("more"), filters = document.getElementById("filters");
    if (list[0] && list[0].theme) document.body.dataset.theme = list[0].theme;
    const labs = [...new Set(list.flatMap((e) => [e.A.lab, e.B.lab]))].sort();
    let lab = null, shown = PAGE;
    const draw = () => {
      const items = lab ? list.filter((e) => e.A.lab === lab || e.B.lab === lab) : list;
      grid.replaceChildren(...items.slice(0, shown).map(card));
      if (!items.length) grid.replaceChildren(h("p", "note", "No paintings yet."));
      more.hidden = items.length <= shown;
    };
    const button = (name) => {
      const b = h("button", "", name || "All labs");
      b.setAttribute("aria-pressed", String(lab === name));
      b.onclick = () => { lab = name; shown = PAGE; filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
      return b;
    };
    filters.replaceChildren(button(null), ...labs.map(button));
    more.onclick = () => { shown += PAGE; draw(); };
    draw();
  }

  function card(e) {
    const a = h("a", "match"); a.href = `${ROOT}e/${e.n}.html`;
    const pair = h("div", "pair");
    for (const s of ["A", "B"]) {
      const img = h("img"); img.src = `${ROOT}img/${e.n}-${s}.webp`; img.alt = `${e[s].lab}'s painting of ${e.subject}`;
      img.loading = "lazy"; img.width = 360; img.height = 360; img.style.setProperty("--c", e[s].color);
      pair.append(img);
    }
    const meta = h("div", "meta"); meta.append(vs(e), h("span", "", e.date));
    a.append(pair, h("div", "subj", e.subject), meta);
    if (e.credit) a.append(h("div", "credit", `idea by @${e.credit}`));
    return a;
  }

  // -- one episode
  function episode(e) {
    const box = document.getElementById("episode");
    document.body.dataset.theme = e.theme || "";
    const head = h("div", "ep-head");
    head.append(h("div", "eyebrow", `Episode ${e.n} · ${e.date}`), h("h1", "", e.subject), vs(e));
    if (e.credit) head.append(h("div", "credit", `idea by @${e.credit} in the Twitch chat`));
    const grid = h("div", "paintings");
    for (const s of ["A", "B"]) {
      const p = e[s], won = e.winner === s;
      const div = h("div", "painting"); div.style.setProperty("--c", p.color);
      const img = h("img"); img.src = `../svg/${e.n}-${s}.svg`; img.alt = `${p.lab}'s painting of ${e.subject}`; img.width = 512; img.height = 512;
      const who = h("div", "who");
      const name = h("div"); name.append(h("span", "lab", p.lab), h("span", "model", p.model));
      const score = h("div"); if (won) score.append(h("span", "badge", "WINNER"));
      if (p.score != null) score.append(h("span", "score", `${p.score}/40`));
      who.append(name, score);
      div.append(img, who);
      if (p.title) div.append(h("div", "ptitle", `“${p.title}”`));
      const dl = h("div", "downloads");
      for (const f of FORMATS) {
        const b = h("button", "", f.label);
        b.onclick = () => download(`../svg/${e.n}-${s}.svg`, f, `ai-drawoff-ep${e.n}-${p.lab.toLowerCase()}-${f.key}.png`, b);
        dl.append(b);
      }
      div.append(dl);
      grid.append(div);
    }
    box.replaceChildren(head, grid, h("p", "share", "Painted live on twitch.tv/ai_drawoff, judged blind by two rival AI labs. Free to use as your wallpaper or avatar."));
    document.title = `${e.A.lab} vs ${e.B.lab}: ${e.subject} · AI Draw-Off`;
  }

  // -- downloads: the SVG drawn at the format's size; for wallpapers, on a blurred, enlarged copy of itself
  function load(src) {
    return new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  }

  async function download(src, f, name, button) {
    button.disabled = true;
    try {
      const img = await load(src);
      const c = document.createElement("canvas"); c.width = f.w; c.height = f.h;
      const ctx = c.getContext("2d");
      if (f.w === f.h) ctx.drawImage(img, 0, 0, f.w, f.h);
      else {
        const cover = Math.max(f.w, f.h);
        ctx.filter = `blur(${Math.round(cover / 40)}px) brightness(0.7)`;
        ctx.drawImage(img, (f.w - cover * 1.1) / 2, (f.h - cover * 1.1) / 2, cover * 1.1, cover * 1.1);
        ctx.filter = "none";
        const side = Math.round(Math.min(f.w, f.h) * (f.w > f.h ? 0.82 : 0.9));
        ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = side / 18;
        ctx.drawImage(img, (f.w - side) / 2, (f.h - side) / 2, side, side);
        ctx.shadowBlur = 0;
        ctx.font = `600 ${Math.round(Math.min(f.w, f.h) * 0.022)}px sans-serif`; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("AI Draw-Off · twitch.tv/ai_drawoff", f.w / 2, f.h - Math.min(f.w, f.h) * 0.05);
      }
      const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (err) {
      button.textContent = "Couldn't make it, sorry";
    } finally {
      button.disabled = false;
    }
  }

  fetch(`${ROOT}data/index.json`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
    const list = d.episodes || [];
    const ep = document.getElementById("episode");
    if (ep) {
      const e = list.find((x) => String(x.n) === ep.dataset.n);
      if (e) episode(e); else ep.replaceChildren(h("p", "note", "This painting isn't in the gallery yet."));
    } else gallery(list);
  }).catch(() => {
    const grid = document.getElementById("grid");
    if (grid) grid.replaceChildren(h("p", "note", "The gallery couldn't load. Try again in a moment."));
  });
})();
