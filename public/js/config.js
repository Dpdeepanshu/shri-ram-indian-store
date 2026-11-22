// =====================================================================
//  SHRI RAM INDIAN STORE: sabhi details yahan hain (Hinglish comments sirf owner ke liye).
//  Yahan badloge to poori site me apne aap badal jaayega.
// =====================================================================
window.STORE_CONFIG = {
  // ---- Brand ----
  storeName: "SHRI RAM INDIAN STORE",
  tagline: "Hair care, skincare, makeup and leather accessories for men from one trusted store in Lucknow.",
  topbarText: "Delivery across India  |  Cash on Delivery and UPI accepted",

  // ---- Business registrations (GST certificate aur Udyam certificate se) ----
  legalName: "HIMANSHU YADAV",
  businessType: "Proprietorship",
  gstin: "09BBSPY0206Q1ZR",
  gstType: "Regular",
  gstSince: "21 March 2024",
  gstAddress: "Belrayan, near Belrayan Railway Station, Bhedauri, Lakhimpur Kheri, Uttar Pradesh - 262906",
  udyam: "UDYAM-UP-50-0303331",
  udyamClass: "Micro enterprise (Retailer/Ecommerce)",
  udyamSince: "24 September 2026",

  // ---- Contact ----
  whatsappNumber: "918887730348",         // country code ke saath, bina + / space ke
  phoneDisplay: "+91 88877 30348",
  email: "himanshuyadavaz12@gmail.com",
  address: "538A/1528A, Triveni Nagar 3rd, 60 Feeta Road, Lucknow, Uttar Pradesh - 226020",  // Udyam certificate ka address
  hours: "Monday to Saturday, 10 AM to 8 PM",   // TODO: asli timing check karo
  instagram: "",                          // poora link, ya khaali
  facebook: "",                           // poora link, ya khaali

  // ---- Payment ----
  // upiId / upiQrImage / bank details bharoge to checkout aur Payments page par apne aap dikhenge.
  // Khaali chhodoge to "details WhatsApp par share hongi" likha aayega.
  upiId: "",                              // jaise: yourname@bank
  upiQrImage: "",                         // jaise: images/upi-qr.png (QR photo public/images me daalo)
  bankName: "", bankAccountName: "", bankAccountNumber: "", bankIfsc: "",
  codAvailable: true,

  // ---- Invoice (order ke baad customer ko milta hai) ----
  // Website orders ki alag series rakhi hai taaki aapke manual invoices (SRIS/2627/2008...) se na takraye.
  // Database ON ho to number server se milta hai (prefix + 0001, 0002...). Prefix/start badalna ho to
  // Cloudflare variables INVOICE_PREFIX aur INVOICE_START set karo (config se same rakho).
  webInvoicePrefix: "SRIS/WEB/2627/",
  webInvoiceStart: 1,
  invoicePhone: "9598101409",              // jo number aapke invoice par chhapta hai (site ke WhatsApp number se alag hai, check karo)
  sellerState: "Uttar Pradesh",            // GSTIN 09 = Uttar Pradesh (isi state me CGST+SGST, baaki states me IGST)
  jurisdictionCity: "Lucknow",             // invoice terms me "disputes subject to ___ jurisdiction"
  shippingHsn: "996812",                   // shipping charge ka SAC (courier)
  shippingGst: 18,

  // ---- Shipping / Policy ----
  currency: "₹",
  freeShippingAbove: 999,
  shippingCharge: 60,
  deliveryDays: "5 to 7 working days",
  returnDays: 7,

  // ---- Website link ----
  siteUrl: "https://shri-ram-indian-store.pages.dev",

  // ---- Categories (key chhoti english me rakho; icon = common.js ke ICONS me se naam) ----
  // hsn / gst: invoice me use hote hain (GST % inclusive hai). CA se check kar lo; kisi product ka alag ho to
  // products.json me us product par "hsn" aur "gst" likh do (admin ke DB products ke liye category wala chalega).
  categories: [
    { key: "beauty",      label: "Hair & Body Care",  icon: "beauty",  blurb: "Hair oil, cleanser and hair colour", hsn: "33059090", gst: 18 },
    { key: "skincare",    label: "Skincare",          icon: "beauty",  blurb: "Serums, masks and glow essentials",  hsn: "33049990", gst: 18 },
    { key: "makeup",      label: "Makeup",            icon: "beauty",  blurb: "Foundation, strobe cream and kits",  hsn: "33049990", gst: 18 },
    { key: "accessories", label: "Men's Accessories", icon: "wallet",  blurb: "Leather wallets and everyday carry", hsn: "42023120", gst: 18 }
  ],

  // ---- Database ----
  useDatabase: true

};
