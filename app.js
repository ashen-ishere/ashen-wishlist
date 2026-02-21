(async function init(){
  const rootEl = document.getElementById("linksRoot");
  if (!rootEl){
    // If this fires, your HTML doesn't have <div id="linksRoot">...</div>
    console.error("Missing #linksRoot in HTML");
    return;
  }

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

  const formatTime = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2,"0")}`;
  };

  const extractExternalHttps = (largeImage) => {
    // Example:
    // mp:external/.../https/i.ytimg.com/vi/.../mqdefault.jpg
    const s = String(largeImage || "");
    const marker = "/https/";
    const idx = s.indexOf(marker);
    if (idx === -1) return "";
    const tail = s.slice(idx + marker.length);
    return `https://${tail}`;
  };

  const pickActivities = (activities) => {
    const list = Array.isArray(activities) ? activities : [];

    const normalized = list
      .filter(a => a && typeof a.name === "string" && a.name.trim())
      .filter(a => String(a.name).toLowerCase() !== "custom status");

    const isYouTube = (a) => String(a.name).toLowerCase() === "youtube";
    const isMusicBee = (a) => String(a.name).toLowerCase() === "musicbee";
    const isGame = (a) => Number(a.type) === 0 && !isMusicBee(a); // MusicBee can show as type 0 too

    const yt = normalized.filter(isYouTube);
    const games = normalized.filter(isGame);
    const mb = normalized.filter(isMusicBee);

    // include other “watch/listen” presences if you want later
    const others = normalized.filter(a => !isYouTube(a) && !isGame(a) && !isMusicBee(a));

    // Priority: YouTube -> Game -> MusicBee -> Others
    return [...yt, ...games, ...mb, ...others];
  };

  const renderActivityCard = (act) => {
    const name = String(act.name || "");
    const type = Number(act.type);

    // default outputs
    let artist = "";
    let track = "";
    let album = "";
    let artistUrl = "";

    // thumb: only if we can get a real https image
    const thumbUrl = extractExternalHttps(act?.assets?.large_image);

    // timestamps
    const ts = act.timestamps || {};
    const startMs = typeof ts.start === "number" ? ts.start : null;
    const endMs = typeof ts.end === "number" ? ts.end : null;

    let meta = "";
    if (startMs && endMs && endMs > startMs){
      const now = Date.now();
      const elapsed = (now - startMs) / 1000;
      const total = (endMs - startMs) / 1000;
      meta = `${formatTime(elapsed)} / ${formatTime(total)}`;
    } else if (startMs && !endMs){
      // show elapsed only (best effort)
      const now = Date.now();
      const elapsed = (now - startMs) / 1000;
      meta = `${formatTime(elapsed)}`;
    }

    // YouTube (WatchDis)
    // details = video title, state = channel name, state_url = channel url
    if (name.toLowerCase() === "youtube"){
      artist = String(act.state || "").trim();
      track = String(act.details || "").trim();
      artistUrl = String(act.state_url || "").trim();
      // no reliable "album" for youtube; keep blank
    }
    // MusicBee (best-effort mapping)
    // state often track, details often "Artist - Album"
    else if (name.toLowerCase() === "musicbee"){
      track = String(act.state || "").trim();
      const d = String(act.details || "").trim();

      // try split "Artist - Album"
      const parts = d.split(" - ");
      if (parts.length >= 2){
        artist = parts[0].trim();
        album = parts.slice(1).join(" - ").trim();
      } else {
        // fallback: treat details as album-ish
        album = d;
      }
    }
    // Game presence
    else if (type === 0){
      // for games, Discord usually uses name as the game title
      artist = ""; // not applicable
      track = String(act.name || "").trim();
      album = ""; // not applicable
    }
    // Other presences
    else {
      track = String(act.details || act.name || "").trim();
      album = String(act.state || "").trim();
    }

    // Build display lines
    let line1 = "";
    if (artist && track){
      line1 = `${artist} - ${track}`;
    } else if (track){
      line1 = track;
    } else {
      line1 = name || "Activity";
    }

    let line2 = "";
    // If YouTube: make artist clickable (but avoid repeating if line1 already includes artist)
    if (name.toLowerCase() === "youtube" && artist){
      const safeArtist = escapeHtml(artist);
      if (artistUrl){
        line2 = `<a class="artistLink" href="${escapeHtml(artistUrl)}" target="_blank" rel="noopener noreferrer">${safeArtist}</a>`;
      } else {
        line2 = safeArtist;
      }
    } else if (album){
      line2 = escapeHtml(album);
    }

    const thumb = thumbUrl
      ? `<div class="thumb"><img src="${escapeHtml(thumbUrl)}" alt="" loading="lazy"></div>`
      : `<div class="thumb" aria-hidden="true"></div>`;

    return `
      <div class="activityCard">
        <div class="activityInner">
          ${thumb}
          <div class="activityText">
            <div class="activityLine1" title="${escapeHtml(line1)}">${escapeHtml(line1)}</div>
            ${line2 ? `<div class="activityLine2">${line2}</div>` : ``}
            ${meta ? `<div class="activityMeta">${escapeHtml(meta)}</div>` : ``}
          </div>
        </div>
      </div>
    `;
  };

  // Loading state
  rootEl.innerHTML = `
    <div class="linkCard" style="pointer-events:none; opacity:0.85;">
      <div class="lcInner">
        <div class="lcTop">
          <h2 class="lcName">Loading...</h2>
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
        key === "what im doing" ? "grid grid--doing" :
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

                <div class="activitiesGrid" id="activitiesGrid">
                  <div class="activityCard">
                    <div class="activityInner">
                      <div class="thumb" aria-hidden="true"></div>
                      <div class="activityText">
                        <div class="activityLine1">Checking Discord...</div>
                        <div class="activityLine2"> </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          `;
        }

        if (isText){
          let rawText = item.text || "";
          const level = calculateLevel();
          rawText = rawText.replaceAll("{level}", String(level));

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
          <a class="linkCard" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
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

    // --- Lanyard → Activities ---
    const grid = document.getElementById("activitiesGrid");
    const discord = data.discord || {};
    const userId = String(discord.userId || "").trim();

    if (grid){
      if (!userId || userId === "PUT_YOUR_DISCORD_USER_ID_HERE"){
        grid.innerHTML = `<div class="activityCard"><div class="activityInner"><div class="thumb"></div><div class="activityText"><div class="activityLine1">Set your Discord userId in links.json</div></div></div></div>`;
      } else {
        try{
          const pres = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`, { cache: "no-store" });
          if(!pres.ok) throw new Error(`HTTP ${pres.status}`);

          const payload = await pres.json();
          const activities = payload?.data?.activities || [];
          const picked = pickActivities(activities);

          if (!picked.length){
            grid.innerHTML = `<div class="activityCard"><div class="activityInner"><div class="thumb"></div><div class="activityText"><div class="activityLine1">Currently quiet</div></div></div></div>`;
          } else {
            grid.classList.toggle("isMulti", picked.length > 1);
            grid.innerHTML = picked.map(renderActivityCard).join("");
          }
        } catch (e){
          grid.innerHTML = `<div class="activityCard"><div class="activityInner"><div class="thumb"></div><div class="activityText"><div class="activityLine1">Couldn't read Discord status</div></div></div></div>`;
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