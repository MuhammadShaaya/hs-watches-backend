function generateOrderNumber() {
  const num = Math.floor(10000 + Math.random() * 89999);
  return `ORD-${num}`;
}

function generateSku(prefix = "HS") {
  const rand = Math.floor(100 + Math.random() * 899);
  return `${prefix}-${rand}-${Date.now().toString().slice(-4)}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { generateOrderNumber, generateSku, slugify };
