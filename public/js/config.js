// =====================================================================
//  SHRI RAM INDIAN STORE: sabhi details yahan hain (Hinglish comments sirf owner ke liye).
//  Yahan badloge to poori site me apne aap badal jaayega.
// =====================================================================
window.STORE_CONFIG = {
  // ---- Brand ----
  storeName: "SHRI RAM INDIAN STORE",
  tagline: "Clothing, beauty, kitchenware and fashion jewellery from one trusted store in Lucknow.",
  topbarText: "Delivery across India  |  Cash on Delivery and UPI accepted",

  // ---- Business registrations (GST certificate aur Udyam certificate se) ----
  legalName: "HIMANSHU YADAV",
  businessType: "Proprietorship",
  gstin: "09BBSPY0206Q1ZR",
  gstType: "Regular",
  gstSince: "21 March 2024",
  gstAddress: "Belrayan, near Belrayan Railway Station, Bhedauri, Lakhimpur Kheri, Uttar Pradesh - 262906",
  udyam: "UDYAM-UP-50-0303331",
  udyamClass: "Micro enterprise (Trading)",
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

  // ---- Invoice numbering (abhi site me use nahi hota) ----
  invoicePrefix: "SRIS/2627/",
  invoiceStartNumber: 2001,

  // ---- Shipping / Policy ----
  currency: "₹",
  freeShippingAbove: 999,
  shippingCharge: 60,
  deliveryDays: "5 to 7 working days",
  returnDays: 7,

  // ---- Website link ----
  siteUrl: "https://shri-ram-indian-store.pages.dev",

  // ---- Categories (key chhoti english me rakho; icon = common.js ke ICONS me se naam) ----
  categories: [
    { key: "clothing",    label: "Clothing",          icon: "dress",   blurb: "Kurtis, sarees and everyday wear" },
    { key: "beauty",      label: "Daily Use Beauty",  icon: "beauty",  blurb: "Skin, hair and grooming essentials" },
    { key: "kitchenwear", label: "Kitchenwear",       icon: "kitchen", blurb: "Cookware and kitchen basics" },
    { key: "jewellery",   label: "Fashion Jewellery", icon: "ring",    blurb: "Earrings, necklace sets and bangles" }
  ],

  // ---- Database ----
  useDatabase: false
};
