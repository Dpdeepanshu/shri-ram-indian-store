// Tax invoice builder (SHRI RAM INDIAN STORE). Prices site par GST-inclusive hain.
// build(order, opts): opts = { type: "retail" | "business", date: "YYYY-MM-DD", sign: true/false,
//                              biz: { name, gstin, address, state, phone } }
(function () {
  const S = window.SRIS, cfg = S.cfg, esc = S.esc;
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const num = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const rs = (n) => "₹ " + num(n);

  // ---------- dates (India time) ----------
  const pad = (n) => String(n).padStart(2, "0");
  function ymdIST(ts) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts || Date.now()));
  }
  function shiftDays(ymd, n) {
    const p = String(ymd).split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }
  const dmy = (ymd) => { const p = String(ymd).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
  let floorYmd = "";
  const setFloor = (ymd) => { floorYmd = /^\d{4}-\d{2}-\d{2}$/.test(String(ymd || "")) ? ymd : ""; };
  const dateRange = () => { const max = ymdIST(); let min = shiftDays(max, -(Number(cfg.invoiceBackdateDays) || 365)); if (floorYmd && floorYmd < min) min = floorYmd; return { min, max }; };
  function clampDate(ymd) {
    const r = dateRange();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd || ""))) return r.max;
    return ymd < r.min ? r.min : ymd > r.max ? r.max : ymd;
  }

  // ---------- address: repeated parts hata kar saaf ek line ----------
  // Customer ne address me hi city / state / PIN likh diya ho to dobara nahi chhapta ("Kheri" jaise adhoore repeat bhi hat jaate hain)
  function joinAddr(parts) {
    const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const segs = [];
    (parts || []).filter(Boolean).forEach((p) => String(p).split(/\s*[,\n]\s*/).forEach((t) => { t = t.trim().replace(/\s+/g, " "); if (t && norm(t)) segs.push(t); }));
    const kept = [];
    segs.forEach((t) => { if (!kept.some((k) => norm(k) === norm(t))) kept.push(t); });
    return kept.filter((t, i) => { const n = norm(t); if (/^\d+$/.test(n)) return true; return !kept.some((k, j) => j !== i && norm(k) !== n && (" " + norm(k) + " ").includes(" " + n + " ")); }).join(", ");
  }

  // ---------- GSTIN ----------
  const GST_STATES = { "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh" };
  const stateCode = (name) => Object.keys(GST_STATES).find((k) => GST_STATES[k].toLowerCase() === String(name || "").toLowerCase()) || "";
  function gstinValid(g) {
    g = String(g || "").toUpperCase();
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g) || !GST_STATES[g.slice(0, 2)]) return false;
    const set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let sum = 0;
    for (let i = 0; i < 14; i++) { const p = set.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(p / 36) + (p % 36); }
    return set[(36 - (sum % 36)) % 36] === g[14];
  }

  // ---------- amount in words (Indian system) ----------
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
    return whole(rupees) + " Rupees" + (paise ? " and " + whole(paise) + " Paise" : "") + " Only";
  }

  // order: { no, invoiceNo, ts, name, phone, address, city, state, pincode, payment, notes, shipping, lines:[{name,price,qty,category,hsn,gst}] }
  function compute(o) {
    const intra = !o.state || String(o.state).toLowerCase() === String(cfg.sellerState).toLowerCase();
    const rows = (o.lines || []).map((l) => {
      const cat = cfg.categories.find((c) => c.key === l.category) || {};
      const gst = Number(l.gst != null ? l.gst : cat.gst != null ? cat.gst : 18);
      return { name: l.name, asin: l.asin || "", hsn: l.hsn || cat.hsn || "", qty: l.qty, unit: "PCS", gst, price: l.price };
    });
    if (Number(o.shipping) > 0) rows.push({ name: "Shipping charges", hsn: cfg.shippingHsn, qty: 1, unit: "", gst: Number(cfg.shippingGst), price: Number(o.shipping) });
    rows.forEach((r) => {
      r.amount = r.price * r.qty;
      r.rate = r2(r.price / (1 + r.gst / 100));
      r.taxable = r2(r.amount / (1 + r.gst / 100));
      r.tax = r2(r.amount - r.taxable);
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
    // HSN-wise summary (business invoice)
    const hs = {};
    rows.forEach((r) => { const key = (r.hsn || "-") + "|" + r.gst; const h = (hs[key] = hs[key] || { hsn: r.hsn || "-", gst: r.gst, amount: 0 }); h.amount += r.amount; });
    const hsn = Object.keys(hs).map((k) => {
      const h = hs[k], tb = r2(h.amount / (1 + h.gst / 100)), tx = r2(h.amount - tb), half = r2(tx / 2);
      return { hsn: h.hsn, gst: h.gst, taxable: tb, tax: tx, cgst: half, sgst: r2(tx - half) };
    });
    const total = rows.reduce((a, r) => a + r.amount, 0);
    return { rows, intra, hsn, taxable: r2(taxable), tax: r2(tax), taxLines, total: r2(total), qty: rows.reduce((a, r) => a + (r.unit ? r.qty : 0), 0) };
  }

  // Retail: sirf QR (COD par bhi). Business: bank details + UPI ID/link + QR.
  function paymentBlock(o, business, total, invNo) {
    const qrImg = cfg.invoiceUpiQr ? `<div class="qrcol"><img src="${esc(cfg.invoiceUpiQr)}" alt="UPI QR code" width="104" height="104"><div class="qrcap">Scan &amp; Pay (UPI)</div></div>` : "";
    const upiLink = cfg.invoiceUpiId ? `upi://pay?pa=${encodeURIComponent(cfg.invoiceUpiId)}&pn=${encodeURIComponent(cfg.storeName)}&am=${Number(total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Invoice " + invNo)}` : "";
    const upiLine = cfg.invoiceUpiId ? `<div class="upi">UPI ID: <b>${esc(cfg.invoiceUpiId)}</b> &nbsp;<a class="upil" href="${upiLink}">Pay ${rs(total)} via UPI</a></div>` : "";
    if (business) {
      const b = cfg.invoiceBank, hasBank = b && b.account;
      if (!hasBank && !qrImg) return "";
      return `<div class="paybox"><div class="pb-main">${hasBank ? `<div class="phd">Bank Details <small>(NEFT / RTGS / IMPS)</small></div>
        <table class="bk">
          <tr><td>Account Name</td><td><b>${esc(b.accountName)}</b></td></tr>
          <tr><td>Bank</td><td>${esc(b.bank)}</td></tr>
          <tr><td>Account No.</td><td><b>${esc(b.account)}</b></td></tr>
          <tr><td>IFSC Code</td><td><b>${esc(b.ifsc)}</b></td></tr>
          ${b.branch ? `<tr><td>Branch</td><td>${esc(b.branch)}</td></tr>` : ""}
        </table>` : ""}${upiLine}
        <div class="pn2">Please mention invoice no. ${esc(invNo)} in the payment remarks.</div></div>${qrImg}</div>`;
    }
    if (!qrImg) return "";
    const cod = /cash/i.test(o.payment || "");
    return `<div class="paybox"><div class="pb-main"><div class="phd">Scan &amp; Pay <small>(UPI)</small></div>
        <div class="pn2">${cod ? "Cash on Delivery: pay " + rs(total) + " in cash, or scan this QR with any UPI app when the parcel arrives." : "Scan this QR with any UPI app to pay " + rs(total) + "."}</div>
        ${upiLine}</div>${qrImg}</div>`;
  }

  function build(o, opts) {
    opts = opts || {};
    const business = opts.type === "business" && opts.biz;
    const biz = business ? opts.biz : null;
    const supplyState = business ? biz.state || o.state : o.state;
    const c = compute(Object.assign({}, o, { state: supplyState }));
    const date = dmy(clampDate(opts.date || ymdIST(o.ts)));
    const place = supplyState || cfg.sellerState, pcode = stateCode(place);
    const invNo = o.invoiceNo || o.no;
    const provisional = !o.invoiceNo;
    const sign = opts.sign !== false;
    const shipAddr = joinAddr([o.address, o.city, o.state, o.pincode]);
    const shipTo = `<b class="pn">${esc(o.name)}</b><div class="pa">${esc(shipAddr)}</div><div>Mobile: ${esc(o.phone)}</div>`;
    const billTo = business
      ? `<b class="pn">${esc(biz.name)}</b>${biz.address ? `<div class="pa">${esc(joinAddr([biz.address]))}</div>` : ""}<div><span class="k">GSTIN:</span> ${esc(biz.gstin)} &nbsp; <span class="k">PAN:</span> ${esc(biz.gstin.slice(2, 12))}</div><div><span class="k">State:</span> ${esc(place)}${pcode ? " (" + pcode + ")" : ""}</div>${biz.phone ? `<div>Mobile: ${esc(biz.phone)}</div>` : ""}`
      : shipTo;
    const dualTax = c.intra;
    const hsnRows = c.hsn.map((h) => dualTax
      ? `<tr><td>${esc(h.hsn)}</td><td class="r">${num(h.taxable)}</td><td class="r">${h.gst / 2}%</td><td class="r">${num(h.cgst)}</td><td class="r">${h.gst / 2}%</td><td class="r">${num(h.sgst)}</td><td class="r">${num(h.tax)}</td></tr>`
      : `<tr><td>${esc(h.hsn)}</td><td class="r">${num(h.taxable)}</td><td class="r">${h.gst}%</td><td class="r">${num(h.tax)}</td><td class="r">${num(h.tax)}</td></tr>`).join("");
    const hsnTable = business ? `<div class="hsn"><div class="lbl2">HSN / SAC SUMMARY</div><table class="it sm"><thead>${dualTax
      ? `<tr><th>HSN/SAC</th><th class="r">Taxable Value</th><th class="r">CGST Rate</th><th class="r">CGST Amt</th><th class="r">SGST Rate</th><th class="r">SGST Amt</th><th class="r">Total Tax</th></tr>`
      : `<tr><th>HSN/SAC</th><th class="r">Taxable Value</th><th class="r">IGST Rate</th><th class="r">IGST Amt</th><th class="r">Total Tax</th></tr>`}</thead><tbody>${hsnRows}</tbody></table></div>` : "";

    const signBlock = `<div class="sign">
      <div class="for">For <b>${esc(cfg.storeName)}</b></div>
      <div class="ss">${sign ? `<img class="stamp" src="${esc(cfg.invoiceStamp)}" alt="Company stamp" onerror="this.style.display='none'"><img class="sig" src="${esc(cfg.invoiceSignature)}" alt="Signature" onerror="this.style.display='none'">` : ""}</div>
      <div class="line">Authorised Signatory${cfg.signatoryName ? `<small>${esc(cfg.signatoryName)}</small>` : ""}</div>
    </div>`;
    const site = String(cfg.siteUrl || "").replace(/\/$/, "");
    // Is invoice ka apna link (PDF me bhi clickable): customer online verify kar sake
    const vUrl = o.vk && o.no ? site + "/invoice.html?no=" + encodeURIComponent(o.no) + "&k=" + encodeURIComponent(o.vk) : "";

    return `<div class="inv">
      <div class="top">
        <img class="lg" src="images/logo.png" alt="" width="88" height="88" onerror="this.style.display='none'">
        <div class="cop">
          <h1>${esc(cfg.storeName)}</h1>
          <div class="ad">${esc(cfg.gstAddress)}</div>
          <div class="ct"><span><i>GSTIN</i> ${esc(cfg.gstin)}</span><span><i>Mobile</i> <a href="tel:+91${esc(String(cfg.invoicePhone || cfg.phoneDisplay).replace(/\D/g, "").slice(-10))}">${esc(cfg.invoicePhone || cfg.phoneDisplay)}</a></span><span><i>Email</i> <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></span><span><i>MSME</i> ${esc(cfg.udyam)}</span></div>
        </div>
        <div class="ttl"><b>${provisional ? "ORDER COPY" : "TAX INVOICE"}</b><span>${provisional ? "PROVISIONAL" : "ORIGINAL FOR RECIPIENT"}</span></div>
      </div>
      <div class="goldrule"></div>
      <div class="meta">
        <div><small>Invoice No.</small><b>${esc(invNo)}</b></div>
        <div><small>Invoice Date</small><b>${date}</b></div>
        <div><small>Order No.</small><b>${esc(o.no)}</b></div>
        <div><small>Payment</small><b>${esc(o.payment || "-")}</b></div>
        <div><small>Place of Supply</small><b>${esc(place)}${pcode ? " (" + pcode + ")" : ""}</b></div>
        ${business ? `<div><small>Reverse Charge</small><b>No</b></div>` : ""}
      </div>
      <div class="two">
        <div class="pty"><div class="lbl">BILL TO${business ? " (BUSINESS)" : ""}</div>${billTo}</div>
        <div class="pty"><div class="lbl">SHIP TO</div>${shipTo}</div>
      </div>
      <div class="tw"><table class="it">
        <thead><tr><th class="c">#</th><th>Description of Goods</th><th>HSN</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Taxable</th><th class="r">GST</th><th class="r">Amount</th></tr></thead>
        <tbody>${c.rows.map((r, i) => `<tr><td class="c">${i + 1}</td><td class="dsc"><div class="in">${esc(r.name)}</div>${r.asin ? `<div class="asin">ASIN: <span>${esc(r.asin)}</span></div>` : ""}</td><td>${esc(r.hsn)}</td><td class="r">${r.qty}${r.unit ? " " + r.unit : ""}</td><td class="r">${num(r.rate)}</td><td class="r">${num(r.taxable)}</td><td class="r">${num(r.tax)}<small>(${r.gst}%)</small></td><td class="r">${num(r.amount)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td></td><td colspan="2"><b>SUBTOTAL</b></td><td class="r"><b>${c.qty}</b></td><td></td><td class="r"><b>${num(c.taxable)}</b></td><td class="r"><b>${num(c.tax)}</b></td><td class="r"><b>${num(c.total)}</b></td></tr></tfoot>
      </table></div>
      <div class="mid">
        <div class="left">
          <div class="words"><small>Total Amount (in words)</small><b>${words(c.total)}</b></div>
          ${paymentBlock(o, business, c.total, invNo)}
        </div>
        <div class="tot">
          <div><span>Taxable Amount</span><span>${rs(c.taxable)}</span></div>
          ${c.taxLines.map((t) => `<div><span>${t[0]}</span><span>${rs(t[1])}</span></div>`).join("")}
          <div class="g"><b>Total Amount</b><b>${rs(c.total)}</b></div>
          <div><span>Received Amount</span><span>₹ 0</span></div>
          <div><span>Balance Due</span><span>${rs(c.total)}</span></div>
        </div>
      </div>
      ${hsnTable}
      <div class="foot">
        <div class="terms"><b>TERMS AND CONDITIONS</b>
          <div>1. Prices include GST. Returns and exchanges are accepted within ${esc(cfg.returnDays)} days as per our Shipping &amp; Returns policy.</div>
          <div>2. All disputes are subject to ${esc(cfg.jurisdictionCity)} jurisdiction only. E. &amp; O.E.</div>
          ${provisional ? "<div>3. This is a provisional copy of your order. The final tax invoice is issued by the store.</div>" : "<div>3. This is a computer-generated invoice.</div>"}
        </div>
        ${signBlock}
      </div>
      <div class="thanks">Thank you for shopping with <b>${esc(cfg.storeName)}</b> &nbsp;|&nbsp; <a href="${esc(site)}/" target="_blank" rel="noopener">${esc(site)}</a>${vUrl ? `<div class="vfy">Verify this invoice online: <a href="${esc(vUrl)}" target="_blank" rel="noopener">${esc(vUrl)}</a></div>` : ""}</div>
    </div>`;
  }

  S.invoice = { setFloor, build, compute, words, gstinValid, stateCode, GST_STATES, ymdIST, dateRange, clampDate, joinAddr };
})();
