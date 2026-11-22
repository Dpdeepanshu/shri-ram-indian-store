// Tax invoice builder (SHRI RAM INDIAN STORE format). Prices site par GST-inclusive hain.
(function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc;
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const num = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const rs = (n) => "₹ " + num(n);

  function dmy(ts) {
    const d = new Date(ts || Date.now());
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  }

  // Indian number system me words
  function words(n) {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const two = (x) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
    const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x));
    function whole(x) {
      if (x === 0) return "Zero";
      const parts = [];
      const cr = Math.floor(x / 10000000); x %= 10000000;
      const lk = Math.floor(x / 100000); x %= 100000;
      const th = Math.floor(x / 1000); x %= 1000;
      if (cr) parts.push(three(cr) + " Crore");
      if (lk) parts.push(two(lk) + " Lakh");
      if (th) parts.push(two(th) + " Thousand");
      if (x) parts.push(three(x));
      return parts.join(" ");
    }
    const rupees = Math.floor(n + 1e-9), paise = Math.round((n - rupees) * 100);
    return whole(rupees) + " Rupees" + (paise ? " and " + whole(paise) + " Paise" : "");
  }

  // order: { no, invoiceNo, ts, name, phone, address, city, state, pincode, payment, notes, shipping, lines:[{name,price,qty,category,hsn,gst}] }
  function compute(o) {
    const intra = !o.state || String(o.state).toLowerCase() === String(cfg.sellerState).toLowerCase();
    const rows = (o.lines || []).map((l) => {
      const cat = cfg.categories.find((c) => c.key === l.category) || {};
      const gst = Number(l.gst != null ? l.gst : cat.gst != null ? cat.gst : 18);
      return { name: l.name, hsn: l.hsn || cat.hsn || "", qty: l.qty, unit: "PCS", gst, price: l.price };
    });
    if (Number(o.shipping) > 0) rows.push({ name: "Shipping charges", hsn: cfg.shippingHsn, qty: 1, unit: "", gst: Number(cfg.shippingGst), price: Number(o.shipping) });
    rows.forEach((r) => {
      r.amount = r.price * r.qty;
      r.rate = r2(r.price / (1 + r.gst / 100));
      r.tax = r2(r.amount - r.amount / (1 + r.gst / 100));
    });
    const groups = {};
    rows.forEach((r) => { const g = (groups[r.gst] = groups[r.gst] || { amount: 0 }); g.amount += r.amount; });
    let taxable = 0, tax = 0;
    const taxLines = [];
    Object.keys(groups).sort((x, y) => x - y).forEach((k) => {
      const g = Number(k), amt = groups[k].amount, tb = r2(amt / (1 + g / 100)), tx = r2(amt - tb);
      taxable += tb; tax += tx;
      if (intra) {
        const half = r2(tx / 2);
        taxLines.push(["CGST @" + g / 2 + "%", half], ["SGST @" + g / 2 + "%", r2(tx - half)]);
      } else taxLines.push(["IGST @" + g + "%", tx]);
    });
    const total = rows.reduce((a, r) => a + r.amount, 0);
    return { rows, intra, taxable: r2(taxable), tax: r2(tax), taxLines, total: r2(total), qty: rows.reduce((a, r) => a + (r.unit ? r.qty : 0), 0) };
  }

  function build(o) {
    const c = compute(o), date = dmy(o.ts), place = o.state || cfg.sellerState;
    const invNo = o.invoiceNo || o.no;
    const provisional = !o.invoiceNo;
    const addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).join(", ");
    const party = `<b class="pn">${esc(o.name)}</b><div>${esc(addr)}</div><div>Mobile: ${esc(o.phone)}</div>`;
    return `<div class="inv">
      <div class="itag"><b>${provisional ? "ORDER COPY" : "TAX INVOICE"}</b><span>${provisional ? "PROVISIONAL" : "ORIGINAL FOR RECIPIENT"}</span></div>
      <div class="head">
        <img src="images/logo-sm.png" alt="" width="110" height="110" onerror="this.style.display='none'">
        <div>
          <h1>${esc(cfg.storeName)}</h1>
          <div>${esc(cfg.gstAddress)}</div>
          <div><b>Mobile:</b> ${esc(cfg.invoicePhone || cfg.phoneDisplay)} &nbsp; <b>GSTIN:</b> ${esc(cfg.gstin)}</div>
          <div><b>Email:</b> ${esc(cfg.email)}</div>
          <div><b>MSME:</b> ${esc(cfg.udyam)} &nbsp; <b>Website:</b> ${esc(cfg.siteUrl)}</div>
        </div>
      </div>
      <div class="rule"></div>
      <div class="band"><span><b>Invoice No.:</b> ${esc(invNo)}</span><span><b>Invoice Date:</b> ${date}</span><span><b>Due Date:</b> ${date}</span></div>
      <div class="two">
        <div><div class="lbl">BILL TO</div>${party}<div>Place of Supply: ${esc(place)}</div></div>
        <div><div class="lbl">SHIP TO</div>${party}</div>
      </div>
      <table class="it">
        <thead><tr><th>ITEMS</th><th>HSN</th><th class="r">QTY.</th><th class="r">RATE</th><th class="r">TAX</th><th class="r">AMOUNT</th></tr></thead>
        <tbody>${c.rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.hsn)}</td><td class="r">${r.qty}${r.unit ? " " + r.unit : ""}</td><td class="r">${num(r.rate)}</td><td class="r">${num(r.tax)}<small>(${r.gst}%)</small></td><td class="r">${num(r.amount)}</td></tr>`).join("")}</tbody>
      </table>
      <div class="sub"><b>SUBTOTAL</b><b>${c.qty}</b><b>${rs(c.tax)}</b><b>${rs(c.total)}</b></div>
      <div class="foot">
        <div class="terms"><b>TERMS AND CONDITIONS</b>
          <div>1. Prices include GST. Returns and exchanges are accepted within ${esc(cfg.returnDays)} days as per our Shipping &amp; Returns policy.</div>
          <div>2. All disputes are subject to ${esc(cfg.jurisdictionCity)} jurisdiction only.</div>
          <div>Payment method: ${esc(o.payment || "")}</div>
          <div>Order No.: ${esc(o.no)}</div>
          ${provisional ? "<div>This is a provisional copy of your order. The final tax invoice is issued by the store.</div>" : "<div>This is a computer-generated invoice.</div>"}
        </div>
        <div class="tot">
          <div><span>Taxable Amount</span><span>${rs(c.taxable)}</span></div>
          ${c.taxLines.map((t) => `<div><span>${t[0]}</span><span>${rs(t[1])}</span></div>`).join("")}
          <div class="g"><b>Total Amount</b><b>${rs(c.total)}</b></div>
          <div><span>Received Amount</span><span>₹ 0</span></div>
        </div>
      </div>
      <div class="words"><b>Total Amount (in words)</b><div>${words(c.total)}</div></div>
    </div>`;
  }

  S.invoice = { build, compute, words };
})();
