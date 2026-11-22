# Changes (audit round)

Checkout: phone paste (+91/spaces) fix, qty cap 20, out-of-stock auto-remove, order confirmation page keeps payment details (UPI link with order no.), double-submit guard, field-focus validation.
CSS: [hidden] now always hides (empty cart showed the form), @import order.
Admin: image paths like images/products/x.jpg now accepted (edit was failing), banner if useDatabase=false, safer edit/save errors.
API /api/orders: phone normalise, city + payment validation, out-of-stock check, merges duplicate lines, optional FREE_SHIPPING_ABOVE / SHIPPING_CHARGE env vars.
Typo: "INDIA STORE" -> "INDIAN STORE" (header, logo alt).
