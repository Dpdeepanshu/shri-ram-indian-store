// =====================================================================
//  SHRI RAM INDIAN STORE: SABHI DETAILS YAHAN REPLACE KARO
//  (Yeh ek hi file hai. Yahan badloge to poori site me apne aap badal jaayega.)
// =====================================================================
window.STORE_CONFIG = {
  // ---- Brand ----
  storeName: "SHRI RAM INDIAN STORE",
  tagline: "Clothing, Beauty, Kitchenware aur Fashion Jewellery: sab ek hi dukaan me",
  topbarText: "Poore India me delivery  •  Cash on Delivery available",

  // ---- Contact (REPLACE) ----
  whatsappNumber: "919999999999",         // country code ke saath, bina + / space ke
  phoneDisplay: "+91 99999 99999",        // jaisa site par dikhana hai
  email: "yourname@example.com",
  address: "Shop No. __, Market/Street, City, State - PINCODE",
  hours: "Somvar se Shanivar, 10 AM se 8 PM",
  gstin: "",                              // GST number ho to likho, warna khaali chhod do
  instagram: "",                          // poora link, ya khaali
  facebook: "",                           // poora link, ya khaali

  // ---- Shipping / Policy (REPLACE) ----
  currency: "₹",
  freeShippingAbove: 999,                 // is amount se upar shipping free
  shippingCharge: 60,                     // kam order par shipping charge
  codAvailable: true,                     // Cash on Delivery dena hai to true
  deliveryDays: "5 se 7 working days",
  returnDays: 7,

  // ---- Website link (REPLACE: deploy ke baad jo link mile) ----
  siteUrl: "https://shriramindianstore.pages.dev",

  // ---- Categories (naam/icon badal sakte ho; key chhoti english me rakho) ----
  categories: [
    { key: "clothing",    label: "Clothing",          icon: "👗", blurb: "Kurti, saree, daily wear" },
    { key: "beauty",      label: "Daily Use Beauty",  icon: "💄", blurb: "Skin, hair aur grooming" },
    { key: "kitchenwear", label: "Kitchenwear",       icon: "🍳", blurb: "Rasoi ka zaroori saamaan" },
    { key: "jewellery",   label: "Fashion Jewellery", icon: "💍", blurb: "Jhumke, necklace, bangles" }
  ],

  // ---- Database ----
  // false = products public/data/products.json se
  // true  = products Cloudflare D1 database se (SETUP.md ka Step 9 ke baad)
  useDatabase: false
};
