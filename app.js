(async function init(){
  const rootEl = document.getElementById("linksRoot");

  const escapeHtml = (str) => String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  const iconSvg = (id) => {
    const common = 'class="lcIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"';
    switch(String(id || "").toLowerCase()){
      case "twitch":
        return `<svg ${common}><path d="M6 5h14v10l-4 4h-4l-2 2H8v-2H6V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 9v5M14 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
      case "youtube":
        return `<svg ${common}><path d="M10 9.5l6 3.5-6 3.5v-7z" fill="currentColor"/><path d="M21 12c0 4-1 6-9 6S3 16 3 12 4 6 12 6s9 2 9 6z" stroke="currentColor" stroke-width="1.8"/></svg>`;
      case "tiktok":
        return `<svg ${common}><path d="M14 6c1.1 1.7 2.7 2.7 4.5 2.9v3c-1.8-.1-3.4-.8-4.5-1.7v6.1c0 2.6-2.1 4.7-4.7 4.7S4.6 20.6 4.6 18s2.1-4.7 4.7-4.7c.3 0 .6 0 .9.1v3c-.3-.1-.6-.2-.9-.2-1 0-1.8.8-1.8 1.8s.8 1.8 1.8 1.8 1.8-.8 1.8-1.8V6h3z" fill="currentColor"/></svg>`;
      case "steam":
        return `<svg ${common}><path d="M7.5 16.5l2.6 1.1a3 3 0 104-4l-1.1-2.6A4.8 4.8 0 1110 19.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.8" cy="8.3" r="2.1" stroke="currentColor" stroke-width="1.8"/><circle cx="9.2" cy="17.2" r="1.2" fill="currentColor"/></svg>`;
      case "amazon":
        return `<svg ${common}><path d="M6.5 10.5c0-2.2 1.8-4 4-4H14c2.2 0 4 1.8 4 4v7H6.5v-7z" stroke="currentColor" stroke-width="1.8"/><path d="M9 10h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 19.2c2.8 1.6 7.2 1.6 10 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
      case "about":
        return `<svg ${common}><circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 20c1.4-3.4 4-5.2 6.5-5.2S17.1 16.6 18.5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
      case "focus":
        return `<svg ${common}><path d="M7 17c4-1 6-3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 6h2a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 20H6a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
  };

  const calculateLevel = () => {
    const birthDate = new Date(1989, 1, 28); // Feb = 1 (0-indexed)
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  rootEl.innerHTML = `
    <div class="linkCard" style="pointer-events:none; opacity:0.85;">
      <div class="lcInner">
        <div class="lcTop">
          <h2 class="lcName">Loading…</h2>
          <span class="pill">links.json</span>
        </div>
        <p class="lcHint">Booting Ashen hub</p>
      </div>
    </div>
  `;

  try{
    const jsonUrl = new URL("links.json", window.location.href);
    const res = await fetch(jsonUrl, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status} while fetching links.json`);
    const data = await res.json();

    // Theme
    const root = document.documentElement;
    const theme = data.theme || {};
    if (theme.font) root.style.setProperty("--font", theme.font);
    if (theme.ashenPink) root.style.setProperty("--ashen-pink", theme.ashenPink);
    if (theme.ashenPurple) root.style.setProperty("--ashen-purple", theme.ashenPurple);
    if (Number.isFinite(theme.radius)) root.style.setProperty("--radius", `${theme.radius}px`);

    const sections = Array.isArray(data.sections) ? data.sections : [];
    const totalItems = sections.reduce((sum, s) => sum + (Array.isArray(s.items) ? s.items.length : 0), 0);

    if (totalItems === 0){
      rootEl.innerHTML = `
        <div class="linkCard" style="pointer-events:none; opacity:0.9;">
          <div class="lcInner">
            <div class="lcTop">
              <h2 class="lcName">No links found</h2>
              <span class="pill">Add items</span>
            </div>
            <p class="lcHint">Add items to sections[].items in links.json.</p>
          </div>
        </div>
      `;
      return;
    }

    const sectionHtml = sections.map(section => {
      const sectionName = String(section.name || "");
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return "";

      const key = sectionName.trim().toLowerCase();
      const gridClass =
        key === "socials" ? "grid grid--socials" :
        key === "wishlists" ? "grid grid--wishlists" :
        key === "about" ? "grid grid--about" :
        key === "what im doing" ? "grid grid--focus" :
        "grid grid--wishlists";

      const cards = items.map(item => {
        const id = String(item.id || "");
        const label = escapeHtml(item.label || "Link");

        const type = String(item.type || "").toLowerCase();
        const isText = (type === "text") || (typeof item.text === "string");
        const isPresence = (type === "presence");

        if (isPresence){
          return `
            <div class="linkCard isText" data-presence="1">
              <span class="rail" aria-hidden="true"></span>
              <div class="lcInner">
                <div class="lcTop">
                  <div class="lcTitleRow">
                    ${iconSvg(id)}
                    <h3 class="lcName" title="${label}">${label}</h3>
                  </div>
                </div>
                <div id="focusValue" class="focusSlot">Checking Discord…</div>
              </div>
            </div>
          `;
        }

        if (isText){
          let rawText = item.text || "";
          rawText = rawText.replaceAll("{level}", String(calculateLevel()));
          const text = escapeHtml(rawText).replaceAll("\n", "<br>");
          return `
            <div class="linkCard isText">
              <span class="rail" aria-hidden="true"></span>
              <div class="lcInner">
                <div class="lcTop">
                  <div class="lcTitleRow">
                    ${iconSvg(id)}
                    <h3 class="lcName" title="${label}">${label}</h3>
                  </div>
                </div>
                ${text ? `<div class="aboutText">${text}</div>` : ``}
              </div>
            </div>
          `;
        }

        const url = String(item.url || "#");
        const hint = escapeHtml(item.hint || "");
        const pill = escapeHtml(item.pill || "Open");

        const rail = item.rail || {};
        let railStyle = "";
        if (rail.type === "solid" && rail.color){
          railStyle = `background:${rail.color};`;
        } else if (rail.type === "gradient" && rail.from && rail.to){
          railStyle = `background:linear-gradient(180deg, ${rail.from}, ${rail.to});`;
        } else {
          railStyle = `background:linear-gradient(180deg, var(--ashen-pink), var(--ashen-purple));`;
        }

        return `
          <a class="linkCard" href="${url}" target="_blank" rel="noopener noreferrer">
            <span class="rail" aria-hidden="true" style="${railStyle}"></span>
            <div class="lcInner">
              <div class="lcTop">
                <div class="lcTitleRow">
                  ${iconSvg(id)}
                  <h3 class="lcName" title="${label}">${label}</h3>
                </div>
                <span class="pill">${pill}</span>
              </div>
              ${hint ? `<p class="lcHint">${hint}</p>` : ``}
            </div>
          </a>
        `;
      }).join("");

      return `
        <section>
          <div class="sectionTitle">${escapeHtml(sectionName)}</div>
          <div class="${gridClass}">
            ${cards}
          </div>
        </section>
      `;
    }).join("");

    rootEl.innerHTML = sectionHtml || "";

    // Lanyard
    const focusEl = document.getElementById("focusValue");
    const discord = data.discord || {};
    const userId = String(discord.userId || "").trim();

    if (focusEl){
      if (!userId){
        focusEl.textContent = "Set your Discord userId in links.json";
      } else {
        try{
          const pres = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`, { cache: "no-store" });
          if(!pres.ok) throw new Error(`HTTP ${pres.status}`);
          const payload = await pres.json();
          const activities = payload?.data?.activities || [];

          const isValidName = (a) => a && typeof a.name === "string" && a.name.trim().length > 0;
          const isNotCustom = (a) => a.name.toLowerCase() !== "custom status";

          const gameAct = activities.find(a => isValidName(a) && isNotCustom(a) && a.type === 0);
          const mediaAct = activities.find(a => isValidName(a) && isNotCustom(a) && (a.type === 3 || a.type === 2));

          if (gameAct){
            focusEl.textContent = gameAct.name;
          } else if (mediaAct){
            const platform = mediaAct.name || "";
            const details = (typeof mediaAct.details === "string" && mediaAct.details.trim()) ? mediaAct.details.trim() : "";
            const artist = (typeof mediaAct.state === "string" && mediaAct.state.trim()) ? mediaAct.state.trim() : "";
            const artistUrl = (typeof mediaAct.state_url === "string" && mediaAct.state_url.trim()) ? mediaAct.state_url.trim() : "";
            const rawThumb = mediaAct?.assets?.large_image || "";
            const mediaUrl = mediaAct?.assets?.large_url || "";

            let thumbUrl = "";
            if (typeof rawThumb === "string" && rawThumb.startsWith("mp:external/")){
              const parts = rawThumb.split("/");
              if (parts.length >= 4 && (parts[2] === "https" || parts[2] === "http")){
                thumbUrl = `${parts[2]}://${parts.slice(3).join("/")}`;
              }
            } else if (typeof rawThumb === "string" && (rawThumb.startsWith("https://") || rawThumb.startsWith("http://"))){
              thumbUrl = rawThumb;
            }

            const safeTitle = escapeHtml(details || "Watching");
            const safePlatform = escapeHtml(platform || "Media");
            const safeArtist = escapeHtml(artist);
            const safeMediaUrl = escapeHtml(mediaUrl);
            const safeThumbUrl = escapeHtml(thumbUrl);

            const artistHtml = artistUrl
              ? `<a href="${escapeHtml(artistUrl)}" target="_blank" rel="noopener noreferrer">${safeArtist}</a>`
              : safeArtist;

                let lineHtml = "";

                if (platform.toLowerCase() === "youtube"){
                  lineHtml = artist
                    ? `${artist} - ${details || ""}`
                    : (details || "");
                }
                else if (platform.toLowerCase() === "musicbee"){
                  // MusicBee already gives artist - album in details
                  const parts = (details || "").split(" - ");
                  const artistName = parts[0] || "";
                  const albumName = parts.slice(1).join(" - ");
                  const trackName = artist || "";

                  lineHtml = `${artistName} - ${trackName}`;
                }
                else if (details){
                  lineHtml = details;
                }

            if (thumbUrl){
              const imgHtml = mediaUrl
                ? `<a href="${safeMediaUrl}" target="_blank" rel="noopener noreferrer"><img class="focusThumb" src="${safeThumbUrl}" alt="${safeTitle}"></a>`
                : `<img class="focusThumb" src="${safeThumbUrl}" alt="${safeTitle}">`;

              focusEl.innerHTML = `
                <div class="focusMedia">
                  ${imgHtml}
                  <div class="focusText">
                    <div class="focusLine">${lineHtml}</div>
                  </div>
                </div>
              `;
            } else {
              focusEl.textContent = platform.toLowerCase() === "youtube" && artist
                ? `YouTube — ${artist}${details ? ` — ${details}` : ""}`
                : (details ? `${platform} — ${details}` : platform);
            }
          } else {
            focusEl.textContent = "Currently quiet";
          }
        } catch (e){
          focusEl.textContent = "Couldn't read Discord status";
          console.error(e);
        }
      }
    }

  } catch (err) {
    const attempted = new URL("links.json", window.location.href).toString();
    rootEl.innerHTML = `
      <div class="linkCard" style="pointer-events:none; opacity:0.9;">
        <div class="lcInner">
          <div class="lcTop">
            <h2 class="lcName">Couldn't load links.json</h2>
            <span class="pill">Debug</span>
          </div>
          <p class="lcHint">
            Tried: ${escapeHtml(attempted)}<br/>
            Error: ${escapeHtml(String(err.message || err))}
          </p>
        </div>
      </div>
    `;
    console.error(err);
  }
})();