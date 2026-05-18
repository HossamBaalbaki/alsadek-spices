/**
 * Migration: Copy Product data into Stock
 *
 * Run once after applying the Prisma schema migration:
 *   node prisma/migrate-stock.js
 *
 * What it does:
 * 1. For each Product (single type): copies slug, variants, labels, rating,
 *    reviewCount, featured, bestSeller into the linked Stock row.
 * 2. For each Product (bundle type): creates a new Stock row (type="bundle")
 *    with all the product fields, then updates BundleItems to point to it.
 * 3. Updates OrderItems: sets stockId from the linked product's stockId.
 * 4. Updates Reviews: sets stockId from the linked product's stockId.
 *
 * Safe to re-run — skips rows that are already migrated (slug already set).
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  console.log("=== Starting Stock Migration ===\n");

  // ─── 1. Migrate single products → their linked Stock ───────────────────────
  const singleProducts = await prisma.product.findMany({
    where: { type: "single", stockId: { not: null } },
    include: { stock: true },
  });

  console.log(`Found ${singleProducts.length} single products to migrate.`);

  for (const product of singleProducts) {
    const stock = product.stock;
    if (!stock) continue;

    // Skip if already migrated
    if (stock.slug) {
      console.log(`  ✓ Stock #${stock.id} (${stock.nameEn}) already has slug — skipping.`);
      continue;
    }

    // Build a unique slug
    let baseSlug = slugify(product.slug || product.nameEn);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.stock.findUnique({ where: { slug } });
      if (!existing || existing.id === stock.id) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        slug,
        type: "single",
        variants: product.variants,
        labels: product.labels,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
        featured: product.featured ?? false,
        bestSeller: product.bestSeller ?? false,
      },
    });

    console.log(`  ✓ Stock #${stock.id} — migrated from Product #${product.id} (${product.nameEn}), slug: ${slug}`);
  }

  // ─── 2. Migrate bundle products → new Stock rows ───────────────────────────
  const bundleProducts = await prisma.product.findMany({
    where: { type: "bundle" },
    include: { bundleItems: { include: { stock: true } } },
  });

  console.log(`\nFound ${bundleProducts.length} bundle products to migrate.`);

  const bundleProductToStockId = {};

  for (const product of bundleProducts) {
    // Check if already migrated (a BundleItem already has bundleStockId)
    const alreadyMigrated = await prisma.bundleItem.findFirst({
      where: { productId: product.id, bundleStockId: { not: null } },
    });
    if (alreadyMigrated) {
      console.log(`  ✓ Bundle Product #${product.id} (${product.nameEn}) already migrated — skipping.`);
      bundleProductToStockId[product.id] = alreadyMigrated.bundleStockId;
      continue;
    }

    let baseSlug = slugify(product.slug || product.nameEn);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.stock.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Create a new Stock entry for this bundle
    const bundleStock = await prisma.stock.create({
      data: {
        slug,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        images: product.images ?? [],
        categoryId: product.categoryId,
        type: "bundle",
        price: product.price,
        originalPrice: product.originalPrice,
        labels: product.labels,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
        featured: product.featured ?? false,
        bestSeller: product.bestSeller ?? false,
        active: product.active,
        currentStockPcs: product.bundleStock ?? 0,
      },
    });

    bundleProductToStockId[product.id] = bundleStock.id;

    // Update BundleItems to point to new bundle Stock
    await prisma.bundleItem.updateMany({
      where: { productId: product.id },
      data: { bundleStockId: bundleStock.id },
    });

    console.log(`  ✓ Bundle Product #${product.id} (${product.nameEn}) → new Stock #${bundleStock.id}, slug: ${slug}`);
  }

  // ─── 3. Update OrderItems — set stockId ────────────────────────────────────
  const orderItems = await prisma.orderItem.findMany({
    where: { stockId: null, productId: { not: null } },
    include: { product: { select: { id: true, type: true, stockId: true } } },
  });

  console.log(`\nFound ${orderItems.length} order items to update.`);

  for (const item of orderItems) {
    if (!item.product) continue;

    let targetStockId = null;
    if (item.product.type === "single" && item.product.stockId) {
      targetStockId = item.product.stockId;
    } else if (item.product.type === "bundle") {
      targetStockId = bundleProductToStockId[item.product.id] ?? null;
    }

    if (targetStockId) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { stockId: targetStockId },
      });
    }
  }
  console.log(`  ✓ Order items updated.`);

  // ─── 4. Update Reviews — set stockId ──────────────────────────────────────
  const reviews = await prisma.review.findMany({
    where: { stockId: null, productId: { not: null } },
    include: { product: { select: { id: true, type: true, stockId: true } } },
  });

  console.log(`\nFound ${reviews.length} reviews to update.`);

  for (const review of reviews) {
    if (!review.product) continue;

    let targetStockId = null;
    if (review.product.type === "single" && review.product.stockId) {
      targetStockId = review.product.stockId;
    } else if (review.product.type === "bundle") {
      targetStockId = bundleProductToStockId[review.product.id] ?? null;
    }

    if (targetStockId) {
      await prisma.review.update({
        where: { id: review.id },
        data: { stockId: targetStockId },
      });
    }
  }
  console.log(`  ✓ Reviews updated.`);

  console.log("\n=== Migration Complete ===");
  console.log("Verify everything looks correct in the admin panel before removing the Product table.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
