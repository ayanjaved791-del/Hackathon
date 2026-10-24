/* =========================================================
   HCM Lite · camera.js — Camera check-in (bonus)
   getUserMedia() + navigator.geolocation + face-api (CDN).
   Resolves with { faceVerified, location } or null if cancelled.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { ui } = HCM;
  const FACE_JS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js";
  const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/";

  let faceReady = null;
  function loadFace() {
    if (faceReady) return faceReady;
    faceReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = FACE_JS; s.async = true;
      s.onload = () => window.faceapi.nets.tinyFaceDetector.loadFromUri(MODELS).then(resolve, reject);
      s.onerror = () => reject(new Error("Could not load face detection"));
      document.head.appendChild(s);
    }).catch((e) => { faceReady = null; throw e; });
    return faceReady;
  }

  function distance(a, b) {
    const R = 6371e3, toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function locate() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ error: "Location not supported" });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
        (e) => resolve({ error: e.message || "Location denied" }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function open() {
    return new Promise((resolve) => {
      const office = HCM.db.company().office;
      let stream = null, raf = 0, state = { face: false, loc: null, inside: !office };
      let settled = false;
      const finish = (val) => { if (settled) return; settled = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); resolve(val); };

      const m = ui.modal({
        title: "Camera check-in",
        wide: true,
        body: `
          <div class="cam">
            <div class="cam-view">
              <video playsinline muted autoplay></video>
              <div class="cam-frame"><i></i><i></i><i></i><i></i></div>
              <div class="cam-scan"></div>
              <p class="cam-msg">Starting camera…</p>
            </div>
            <ul class="cam-checks">
              <li data-k="cam"><span class="dot"></span><div><b>Camera</b><small>Waiting for permission</small></div></li>
              <li data-k="face"><span class="dot"></span><div><b>Face detected</b><small>Loading detector…</small></div></li>
              <li data-k="loc"><span class="dot"></span><div><b>${office ? "Inside office area" : "Location"}</b><small>Finding you…</small></div></li>
            </ul>
          </div>`,
        actions: [
          { label: "Cancel", onClick: (c) => { finish(null); c(); } },
          { label: `${ui.icon("check")} Check in`, cls: "btn-primary", onClick: (c) => {
            if (!state.face) return ui.toast("We need to see your face first.", "bad");
            if (!state.inside) return ui.toast("You seem to be outside the office area.", "bad");
            finish({ faceVerified: true, location: state.loc && !state.loc.error ? state.loc : null, method: "camera" }); c();
          } },
        ],
      });
      const root = m.el;
      new MutationObserver((_, o) => { if (!document.body.contains(root)) { o.disconnect(); finish(null); } }).observe(document.body, { childList: true });

      const set = (k, ok, text) => {
        const li = root.querySelector(`[data-k="${k}"]`);
        li.classList.toggle("ok", ok === true); li.classList.toggle("bad", ok === false);
        li.querySelector("small").textContent = text;
      };
      const video = root.querySelector("video"), msg = root.querySelector(".cam-msg");
      const btn = root.querySelector('[data-act="1"]');
      const refresh = () => { btn.disabled = !(state.face && state.inside); };
      refresh();

      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
        .then((s) => {
          stream = s; video.srcObject = s; set("cam", true, "Live"); msg.textContent = "Look at the camera";
          return loadFace().then(() => {
            set("face", null, "Scanning…");
            const opts = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            let busy = false, hits = 0;
            const loop = async () => {
              if (settled) return;
              if (!busy && video.readyState >= 2) {
                busy = true;
                const det = await window.faceapi.detectSingleFace(video, opts).catch(() => null);
                busy = false;
                hits = det ? Math.min(hits + 1, 3) : Math.max(0, hits - 1);
                const ok = hits >= 2;
                if (ok !== state.face) {
                  state.face = ok; root.querySelector(".cam-view").classList.toggle("locked", ok);
                  set("face", ok ? true : null, ok ? `Confidence ${Math.round((det?.score || 0.9) * 100)}%` : "Scanning…");
                  msg.textContent = ok ? "Face verified ✓" : "Look at the camera";
                  refresh();
                }
              }
              raf = requestAnimationFrame(loop);
            };
            loop();
          });
        })
        .catch((e) => {
          set("cam", false, e.name === "NotAllowedError" ? "Permission denied" : e.message || "Unavailable");
          set("face", false, "Needs the camera");
          msg.textContent = "Camera unavailable — use quick check-in instead";
        });

      locate().then((loc) => {
        state.loc = loc;
        if (loc.error) {
          set("loc", office ? false : null, loc.error);
          state.inside = !office;
        } else if (office) {
          const d = distance(loc, office);
          state.inside = d <= office.radius;
          set("loc", state.inside, `${Math.round(d)} m from office (limit ${office.radius} m)`);
        } else {
          set("loc", true, `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} · ±${loc.accuracy} m`);
        }
        refresh();
      });
    });
  }

  HCM.camera = { open, locate, distance };
})();
