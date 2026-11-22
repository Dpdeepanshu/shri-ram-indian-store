(function () {
  const S = window.SRIS, $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  // login ke baad kahan jaana hai (sirf apni site ke pages)
  const nextRaw = params.get("next") || "account.html";
  const next = /^[a-z0-9_-]+\.html(\?[\w=&%-]*)?$/i.test(nextRaw) ? nextRaw : "account.html";
  let pendingEmail = "";
  const forms = { login: $("fLogin"), signup: $("fSignup"), verify: $("fVerify"), forgot: $("fForgot"), reset: $("fReset") };
  const titles = { login: "Login", signup: "Create your account", verify: "Verify your email", forgot: "Forgot password", reset: "Reset password" };

  function show(m) {
    Object.keys(forms).forEach((k) => (forms[k].hidden = k !== m));
    $("tabs").hidden = !(m === "login" || m === "signup");
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    $("title").textContent = titles[m];
    document.querySelectorAll("[data-err]").forEach((e) => (e.textContent = ""));
    document.querySelectorAll("[data-ok]").forEach((e) => (e.textContent = ""));
  }
  const err = (f, m) => { f.querySelector("[data-err]").textContent = m; };
  const ok = (f, m) => { f.querySelector("[data-ok]").textContent = m; };
  async function post(url, body) {
    const r = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, d };
  }
  function busy(f, on) { f.querySelectorAll("button[type=submit]").forEach((b) => (b.disabled = on)); }
  const devNote = (f, d) => { if (d && d.devOtp) ok(f, "Test mode code: " + d.devOtp); };

  if (params.get("why") === "order") $("why").hidden = false;
  if (!S.cfg.useDatabase) { document.querySelector(".auth-card").innerHTML = "<p>Login is not enabled yet. Please contact the store.</p>"; return; }
  S.me().then((u) => { if (u) location.replace(next); });

  document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.m)));
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-go]"); if (a) { e.preventDefault(); show(a.dataset.go); } });
  $("sPhone").addEventListener("input", (e) => { const d = S.normalizePhone(e.target.value); if (d !== e.target.value) e.target.value = d.slice(0, 10); });
  [$("vCode"), $("rCode")].forEach((i) => i.addEventListener("input", () => (i.value = i.value.replace(/\D/g, "").slice(0, 6))));

  function toVerify(email, d) {
    pendingEmail = email; $("vMail").textContent = email; show("verify"); devNote(forms.verify, d); $("vCode").focus();
  }

  forms.login.addEventListener("submit", async (e) => {
    e.preventDefault(); const f = forms.login, email = $("lEmail").value.trim(), pw = $("lPass").value;
    if (!email || !pw) return err(f, "Enter your email and password.");
    busy(f, true); const r = await post("/api/auth/login", { email, password: pw }).catch(() => null); busy(f, false);
    if (!r) return err(f, "Could not reach the server. Please try again.");
    if (r.d.needVerify) return toVerify(r.d.email || email, r.d);
    if (!r.ok) return err(f, r.d.error || "Could not log in.");
    location.href = next;
  });

  forms.signup.addEventListener("submit", async (e) => {
    e.preventDefault(); const f = forms.signup;
    const b = { name: $("sName").value.trim(), email: $("sEmail").value.trim(), phone: S.normalizePhone($("sPhone").value), password: $("sPass").value };
    if (b.name.length < 2) return err(f, "Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email)) return err(f, "Please enter a valid email address.");
    if (!/^[6-9]\d{9}$/.test(b.phone)) return err(f, "Please enter a valid 10-digit mobile number.");
    if (b.password.length < 8) return err(f, "Password must be at least 8 characters.");
    busy(f, true); const r = await post("/api/auth/signup", b).catch(() => null); busy(f, false);
    if (!r) return err(f, "Could not reach the server. Please try again.");
    if (!r.ok) return err(f, r.d.error || "Could not create the account.");
    toVerify(r.d.email || b.email.toLowerCase(), r.d);
  });

  forms.verify.addEventListener("submit", async (e) => {
    e.preventDefault(); const f = forms.verify, code = $("vCode").value;
    if (!/^\d{6}$/.test(code)) return err(f, "Please enter the 6-digit code.");
    busy(f, true); const r = await post("/api/auth/verify", { email: pendingEmail, code }).catch(() => null); busy(f, false);
    if (!r) return err(f, "Could not reach the server. Please try again.");
    if (!r.ok) return err(f, r.d.error || "Wrong code.");
    location.href = next;
  });
  async function resend(f, purpose) {
    const r = await post("/api/auth/resend", { email: pendingEmail, purpose }).catch(() => null);
    if (!r) return err(f, "Could not reach the server.");
    if (!r.ok) return err(f, r.d.error || "Could not send the code.");
    err(f, ""); ok(f, "A new code has been sent."); devNote(f, r.d);
  }
  $("vResend").addEventListener("click", (e) => { e.preventDefault(); resend(forms.verify, "verify"); });
  $("rResend").addEventListener("click", (e) => { e.preventDefault(); resend(forms.reset, "reset"); });

  forms.forgot.addEventListener("submit", async (e) => {
    e.preventDefault(); const f = forms.forgot, email = $("fEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(f, "Please enter a valid email address.");
    busy(f, true); const r = await post("/api/auth/forgot", { email }).catch(() => null); busy(f, false);
    if (!r) return err(f, "Could not reach the server. Please try again.");
    if (!r.ok) return err(f, r.d.error || "Could not send the code.");
    pendingEmail = email.toLowerCase(); $("rMail").textContent = pendingEmail; show("reset"); devNote(forms.reset, r.d);
  });

  forms.reset.addEventListener("submit", async (e) => {
    e.preventDefault(); const f = forms.reset;
    if (!/^\d{6}$/.test($("rCode").value)) return err(f, "Please enter the 6-digit code.");
    if ($("rPass").value.length < 8) return err(f, "Password must be at least 8 characters.");
    busy(f, true); const r = await post("/api/auth/reset", { email: pendingEmail, code: $("rCode").value, password: $("rPass").value }).catch(() => null); busy(f, false);
    if (!r) return err(f, "Could not reach the server. Please try again.");
    if (!r.ok) return err(f, r.d.error || "Could not reset the password.");
    location.href = next;
  });

  if (params.get("mode") === "signup") show("signup"); else show("login");
})();
