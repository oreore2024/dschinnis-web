// Bregenzer Dschinnis: Termine aus termine.txt laden und anzeigen.
(function(){
  const M=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const W=["So","Mo","Di","Mi","Do","Fr","Sa"];
  const pad=n=>String(n).padStart(2,"0");
  const $=id=>document.getElementById(id);

  // Datei-Name der Kalenderdatei, identisch zu slug() in tools/build_ics.py
  function slug(d,title){
    let t=title.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");
    t=t.replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40).replace(/-+$/,"");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${t}`;
  }

  function parse(txt){
    const out=[];
    txt.split(/\r?\n/).forEach((line,i)=>{
      const l=line.trim(); if(!l||l.startsWith("#"))return;
      const f=l.split("|").map(x=>x.trim());
      const m=(f[0]||"").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if(!m){console.warn("termine.txt Zeile "+(i+1)+": Datum unlesbar:",l);return;}
      const tm=(f[1]||"").replace(/\s/g,"").match(/^(\d{1,2}):(\d{2})(?:[-–](\d{1,2}):(\d{2}))?$/);
      const d=new Date(+m[3],+m[2]-1,+m[1],tm?+tm[1]:0,tm?+tm[2]:0);
      const until=tm&&tm[3]?new Date(+m[3],+m[2]-1,+m[1],+tm[3],+tm[4]):null;
      let t=f[2]||"Termin",star=false; if(t.startsWith("*")){star=true;t=t.slice(1).trim();}
      out.push({d,until,allDay:!tm,t,star,o:f[3]||"",info:f[4]||""});
    });
    // Ganztägige Termine am selben Tag nach den Terminen mit Uhrzeit
    const key=e=>+e.d+(e.allDay?86399000:0);
    return out.sort((a,b)=>key(a)-key(b));
  }

  function stamp(d,day){const s=`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;return day?s:`${s}T${pad(d.getHours())}${pad(d.getMinutes())}00`;}
  function gcal(e){
    const end=e.until?new Date(e.until):new Date(e.d);if(!e.until){e.allDay?end.setDate(end.getDate()+1):end.setHours(end.getHours()+3);}
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(e.t)
      +"&dates="+stamp(e.d,e.allDay)+"/"+stamp(end,e.allDay)+"&ctz=Europe/Vienna"
      +"&details="+encodeURIComponent((e.info?e.info+"\n":"")+"Bregenzer Dschinnis · dschinnis.fun")
      +(e.o?"&location="+encodeURIComponent(e.o):"");
  }

  function render(list){
    const now=new Date(),ol=$("events");ol.innerHTML="";
    const upcoming=list.filter(e=>{const end=new Date(e.d);end.setHours(23,59,59);return end>=now;});
    if(!upcoming.length){ol.innerHTML='<li class="empty">Gerade stehen keine Termine an. Spätestens am 11.11. sind wir wieder da!</li>';}
    upcoming.forEach(e=>{
      const li=document.createElement("li");
      li.className="ev"+(e.star?" star":"");
      const hm=x=>pad(x.getHours())+":"+pad(x.getMinutes());
      const time=e.allDay?"ganztägig":hm(e.d)+(e.until?"–"+hm(e.until):"")+" Uhr";
      li.innerHTML=`<div class="date"><b>${e.d.getDate()}</b><span>${M[e.d.getMonth()]}</span></div>
        <div><h3></h3><p class="meta"><span>${W[e.d.getDay()]} · ${time}</span><span class="o"></span></p><p class="info"></p></div>
        <div class="acts"><details class="save"><summary>Speichern</summary><div class="menu">
          <a class="ics">iPhone / Outlook</a>
          <a class="g" target="_blank" rel="noopener">Google Kalender ↗</a></div></details></div>`;
      li.querySelector("h3").textContent=e.t;
      li.querySelector(".o").textContent=e.o;
      const inf=li.querySelector(".info"); e.info?inf.textContent=e.info:inf.remove();
      li.querySelector(".ics").href="ics/"+slug(e.d,e.t)+".ics";
      li.querySelector(".g").href=gcal(e);
      if(e.o){const a=document.createElement("a");a.className="map";a.target="_blank";a.rel="noopener";a.textContent="Karte ↗";
        a.href="https://www.openstreetmap.org/search?query="+encodeURIComponent(e.o);li.querySelector(".acts").appendChild(a);}
      ol.appendChild(li);
    });
    countdown(upcoming.filter(e=>e.d>now||e.allDay)[0]);
  }

  let timer;
  function countdown(nx){
    if(!nx){$("n-title").textContent="Bis zum nächsten Fasching!";$("n-where").textContent="Saisonstart ist immer am 11.11.";$("n-count").hidden=true;return;}
    $("n-title").textContent=nx.t;
    $("n-where").textContent=nx.d.toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})+(nx.o?" · "+nx.o:"");
    const tick=()=>{const s=Math.max(0,(nx.d-new Date())/1000);$("c-d").textContent=Math.floor(s/86400);$("c-h").textContent=Math.floor(s%86400/3600);$("c-m").textContent=Math.floor(s%3600/60);};
    tick();clearInterval(timer);timer=setInterval(tick,30000);
  }

  // Abo-Links für den Gesamtkalender
  const feed=location.host+location.pathname.replace(/[^/]*$/,"")+"termine.ics";
  const abo=$("abo-ios"),aboG=$("abo-google");
  if(abo)abo.href="webcal://"+feed;
  if(aboG)aboG.href="https://calendar.google.com/calendar/r?cid="+encodeURIComponent("webcal://"+feed);

  // Kopieren-Buttons
  document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",()=>{
    const el=$(b.dataset.copy),done=()=>{b.textContent="Kopiert";setTimeout(()=>b.textContent="Kopieren",1600);};
    const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="Markiert";};
    try{navigator.clipboard.writeText(el.textContent).then(done,sel);}catch(err){sel();}
  }));

  fetch("termine.txt",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text();})
    .then(t=>render(parse(t)))
    .catch(()=>{$("events").innerHTML='<li class="empty">Termine konnten nicht geladen werden. Aktuelles findest du auf <a href="https://www.instagram.com/bregenzer.dschinnis">Instagram</a>.</li>';countdown(null);});
})();
