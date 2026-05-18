import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [bundleMax, singlePrices] = await Promise.all([
      prisma.product.aggregate({
        where: { active: true, type: "bundle" },
        _max: { price: true },
      }),
      // Raw query to extract max price from variants JSON array for single products
      prisma.$queryRaw`
        SELECT MAX(CAST(elem->>'price' AS FLOAT)) AS max_price
        FROM products,
             jsonb_array_elements(variants::jsonb) AS elem
        WHERE active = true
          AND type = 'single'
          AND variants IS NOT NULL
      `,
    ]);

    const bundleMaxPrice = Number(bundleMax._max.price || 0);
    const singleMaxPrice = Number(singlePrices[0]?.max_price || 0);
    const maxPrice = Math.ceil(Math.max(bundleMaxPrice, singleMaxPrice, 100));

    return NextResponse.json(
      { success: true, maxPrice },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("GET /api/products/price-range error:", error);
    return NextResponse.json({ success: true, maxPrice: 500 });
  }
}
