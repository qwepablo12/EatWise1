export interface FoodProduct {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

function mapProduct(product: any): FoodProduct | null {
  if (!product) return null;
  const nutriments = product.nutriments ?? {};
  const name = product.product_name || product.generic_name || 'Unknown product';

  // Open Food Facts reports per-100g by default; that's a reasonable
  // single-serving estimate for a quick add, same spirit as the AI parser.
  const calories = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0;
  const protein = nutriments['proteins_100g'] ?? 0;
  const fat = nutriments['fat_100g'] ?? 0;
  const carbs = nutriments['carbohydrates_100g'] ?? 0;

  if (!calories && !protein && !fat && !carbs) return null;

  return {
    name,
    calories: Math.round(Number(calories)),
    protein: Math.round(Number(protein)),
    fat: Math.round(Number(fat)),
    carbs: Math.round(Number(carbs)),
  };
}

export async function getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1) return null;
  return mapProduct(data.product);
}

export async function searchProducts(query: string): Promise<FoodProduct[]> {
  if (!query.trim()) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=15`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  return products.map(mapProduct).filter((p: FoodProduct | null): p is FoodProduct => p !== null);
}
