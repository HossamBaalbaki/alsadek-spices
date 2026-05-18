// ─── GENERATE ORDER NUMBER ───────────────────────────
export function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

// ─── FORMAT PRICE ───────────────────────────
export function formatPrice(price) {
  return Number(price).toFixed(2);
}

// ─── FORMAT DATE ───────────────────────────
export function formatDate(date, locale = "en") {
  return new Date(date).toLocaleDateString(
    locale === "ar" ? "ar-QA" : "en-QA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

// ─── CALCULATE DISCOUNT ───────────────────────────
export function calculateDiscount(price, percent) {
  return price - (price * percent) / 100;
}

// ─── VALIDATE PHONE ───────────────────────────
export function validatePhone(phone) {
  return /^[0-9+\s-]{8,15}$/.test(phone);
}

// ─── VALIDATE EMAIL ───────────────────────────
export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// ─── PAGINATE ───────────────────────────
export function getPagination(page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

// ─── API RESPONSE ───────────────────────────
export function apiSuccess(data, message = "Success") {
  return { success: true, message, data };
}

export function apiError(message = "Error", status = 400) {
  return { success: false, message, status };
}