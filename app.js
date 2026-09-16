const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const state = {
  q: "", district: "", band: "", type: "", gender: "", moi: "",
  view: "table", sort: "rank", dir: 1, compare: new Set(),
};

const bandGroup = b => b.replace(/[ABC]/,"");

function filtered() {
  const q = state.q.trim().toLowerCase();
  let rows = window.HK_SCHOOLS.filter(s => {
    if (q && !(s.zh.toLowerCase().includes(q) || s.en.toLowerCase().includes(q) || s.d.includes(q))) return false;
    if (state.district && s.d !== state.district) return false;
    if (state.band) {
      if (state.band.length === 1) { if (bandGroup(s.band) !== state.band) return false; }
      else if (s.band !== state.band) return false;
    }
    if (state.type && s.type !== state.type) return false;
    if (state.gender && s.gender !== state.gender) return false;
    if (state.moi && s.moi !== state.moi) return false;
    return true;
  });
  rows.sort((a,b) => {
    let va = a[state.sort], vb = b[state.sort];
    if (typeof va === "string") return va.localeCompare(vb, "zh-Hant") * state.dir;
    return (va - vb) * state.dir;
  });
  return rows;
}

function badge(cls, text) {
  return `<span class="badge ${cls}">${text}</span>`;
}

function render() {
  const rows = filtered();
  $("#count").textContent = `顯示 ${rows.length} / ${window.HK_SCHOOLS.length} 間（精選參考庫）`;
  const tableWrap = $("#tableView");
  const cardsWrap = $("#cardView");
  if (state.view === "table") {
    tableWrap.style.display = "block";
    cardsWrap.style.display = "none";
    $("#tbody").innerHTML = rows.map(s => `
      <tr>
        <td class="serif">${s.rank}</td>
        <td><span class="zh">${s.zh}</span><span class="en">${s.en}</span></td>
        <td>${badge("b-"+s.band, "Band "+s.band)}</td>
        <td>${s.d}</td>
        <td>${badge("t-"+s.type, s.type)}</td>
        <td>${s.gender}</td>
        <td class="m-${s.moi}">${s.moi}</td>
        <td>
          <div class="actions">
            <button data-open="${s.id}">詳情</button>
            <button data-cmp="${s.id}">${state.compare.has(s.id) ? "已選" : "對比"}</button>
          </div>
        </td>
      </tr>
    `).join("");
  } else {
    tableWrap.style.display = "none";
    cardsWrap.style.display = "grid";
    cardsWrap.innerHTML = rows.map(s => `
      <article class="card" data-open="${s.id}">
        <div class="card-top">
          <div class="rank-num">#${s.rank}</div>
          ${badge("b-"+s.band, "Band "+s.band)}
        </div>
        <h3 class="serif">${s.zh}</h3>
        <div class="en">${s.en}</div>
        <div class="meta">
          ${badge("t-"+s.type, s.type)}
          <span class="badge">${s.d}</span>
          <span class="badge">${s.gender}</span>
          <span class="badge m-${s.moi}">${s.moi}</span>
        </div>
      </article>
    `).join("");
  }
  renderCompare();
}

function renderCompare() {
  const bar = $("#compare");
  const ids = [...state.compare];
  if (!ids.length) { bar.classList.remove("show"); return; }
  bar.classList.add("show");
  const names = ids.map(id => window.HK_SCHOOLS.find(s => s.id === id).zh);
  $("#cmpText").innerHTML = `已選 <b>${ids.length}</b> 間：${names.join("、")}`;
}

function openSchool(id) {
  const s = window.HK_SCHOOLS.find(x => x.id === Number(id));
  if (!s) return;
  $("#modalBg").classList.add("open");
  $("#modal").innerHTML = `
    <div class="kicker">SCHOOL FILE</div>
    <h3 class="serif">${s.zh}</h3>
    <p class="en">${s.en}</p>
    <div class="grid2">
      <div class="kv"><span>參考名次</span><b>#${s.rank}</b></div>
      <div class="kv"><span>坊間 Banding</span><b>Band ${s.band}</b></div>
      <div class="kv"><span>地區</span><b>${s.d}</b></div>
      <div class="kv"><span>資助類別</span><b>${s.type}</b></div>
      <div class="kv"><span>性別</span><b>${s.gender}校</b></div>
      <div class="kv"><span>教學語言</span><b>${s.moi}</b></div>
      <div class="kv"><span>學費參考</span><b>${s.fee}</b></div>
      <div class="kv"><span>資料年份</span><b>2026 學年</b></div>
    </div>
    <p>${s.note}</p>
    <div class="warn">Banding 同排名都唔係教育局官方評級。派位應同時睇校網、面試、校風同子女適配。</div>
    <div style="margin-top:14px;display:flex;gap:8px">
      <button class="ghost" data-cmp="${s.id}">加入對比</button>
      <button class="ghost" id="closeModal">關閉</button>
    </div>
  `;
}

function openCompareModal() {
  const schools = [...state.compare].map(id => window.HK_SCHOOLS.find(s => s.id === id));
  $("#modalBg").classList.add("open");
  $("#modal").innerHTML = `
    <div class="kicker">COMPARE</div>
    <h3 class="serif">學校對比</h3>
    <div class="table-wrap" style="margin-top:14px">
      <table>
        <thead><tr><th>項目</th>${schools.map(s=>`<th>${s.zh}</th>`).join("")}</tr></thead>
        <tbody>
          ${["rank","band","d","type","gender","moi","fee"].map(k=>{
            const label = {rank:"參考名次",band:"Banding",d:"地區",type:"類別",gender:"性別",moi:"教學語言",fee:"學費"}[k];
            return `<tr><td>${label}</td>${schools.map(s=>`<td>${k==="rank"?"#"+s[k]:s[k]}</td>`).join("")}</tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
    <button class="ghost" id="closeModal" style="margin-top:14px">關閉</button>
  `;
}

function bind() {
  $("#q").addEventListener("input", e => { state.q = e.target.value; render(); });
  $("#district").innerHTML = `<option value="">全部地區</option>` + window.DISTRICTS.map(d=>`<option>${d}</option>`).join("");
  ["district","band","type","gender","moi"].forEach(k => {
    $(`#${k}`).addEventListener("change", e => { state[k] = e.target.value; render(); });
  });
  $$("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    state.view = btn.dataset.view;
    $$("[data-view]").forEach(b => b.classList.toggle("on", b===btn));
    render();
  }));
  $$("th[data-sort]").forEach(th => th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (state.sort === key) state.dir *= -1; else { state.sort = key; state.dir = 1; }
    render();
  }));
  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    const cmp = e.target.closest("[data-cmp]");
    if (open) openSchool(open.dataset.open);
    if (cmp) {
      const id = Number(cmp.dataset.cmp);
      if (state.compare.has(id)) state.compare.delete(id);
      else {
        if (state.compare.size >= 3) { alert("最多同時對比 3 間"); return; }
        state.compare.add(id);
      }
      render();
    }
    if (e.target.id === "closeModal" || e.target.id === "modalBg") $("#modalBg").classList.remove("open");
  });
  $("#doCompare").addEventListener("click", openCompareModal);
  $("#clearCompare").addEventListener("click", () => { state.compare.clear(); render(); });
  $("#reset").addEventListener("click", () => {
    state.q = state.district = state.band = state.type = state.gender = state.moi = "";
    $("#q").value = "";
    ["district","band","type","gender","moi"].forEach(k => $(`#${k}`).value = "");
    render();
  });
}

bind();
render();
