(async function init(){

  const rootEl = document.getElementById("linksRoot");

  const escapeHtml = (str) => String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  function formatElapsed(start){
    if(!start) return "";
    const diff = Date.now() - start;
    const seconds = Math.floor(diff / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")} elapsed`;
  }

  try{

    const res = await fetch("links.json",{cache:"no-store"});
    const data = await res.json();

    const discord = data.discord || {};
    const userId = discord.userId;

    const focusEl = document.getElementById("focusValue");
    if(!focusEl) return;

    if(!userId){
      focusEl.textContent = "Set Discord userId";
      return;
    }

    const pres = await fetch(`https://api.lanyard.rest/v1/users/${userId}`,{cache:"no-store"});
    const payload = await pres.json();
    const activities = payload?.data?.activities || [];

    let selected = null;

    // Priority: YouTube > Netflix > MusicBee > Game
    const priorityOrder = ["YouTube","Netflix","MusicBee"];

    for(const name of priorityOrder){
      selected = activities.find(a => a.name === name);
      if(selected) break;
    }

    if(!selected){
      selected = activities.find(a => a.type === 0);
    }

    if(!selected){
      focusEl.textContent = "Currently quiet";
      return;
    }

    const elapsed = formatElapsed(selected?.timestamps?.start);

    let line = "";
    let album = "";
    let thumb = "";
    let url = selected?.assets?.large_url || "";

    if(selected.name === "YouTube"){
      const artist = selected.state || "";
      const track = selected.details || "";
      line = `${artist} - ${track}`;
      if(selected.assets?.large_image?.includes("http")){
        thumb = "https://" + selected.assets.large_image.split("https://")[1];
      }
    }

    else if(selected.name === "MusicBee"){
      const details = selected.details || "";
      const track = selected.state || "";
      if(details.includes(" - ")){
        const parts = details.split(" - ");
        const artist = parts[0];
        album = parts.slice(1).join(" - ");
        line = `${artist} - ${track}`;
      }
    }

    else if(selected.name === "Netflix"){
      line = selected.details || "";
    }

    else{
      line = selected.name;
    }

    const thumbHtml = thumb
      ? `<img class="focusThumb" src="${escapeHtml(thumb)}">`
      : "";

    focusEl.innerHTML = `
      <div class="focusMedia">
        ${thumbHtml}
        <div class="focusText">
          <div class="focusLine">${escapeHtml(line)}</div>
          ${album ? `<div class="focusMeta">${escapeHtml(album)}</div>` : ""}
          ${elapsed ? `<div class="focusMeta">${escapeHtml(elapsed)}</div>` : ""}
        </div>
      </div>
    `;

  }catch(e){
    console.error(e);
  }

})();