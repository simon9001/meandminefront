export interface StaticProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug?: string;
  badge?: 'new' | 'bestseller' | 'sale';
  rating?: number;
  reviewCount?: number;
  description?: string;
}

// Adapter: converts a StaticProduct to the backend Product shape for use with ProductCard
export function staticToProduct(p: StaticProduct) {
  const catSlug = p.category.toLowerCase().replace(/\s+/g, '-');
  return {
    id:                   p.id,
    name:                 p.name,
    slug:                 p.slug ?? p.id,
    shortDescription:     p.description,
    basePrice:            p.originalPrice ?? p.price,
    salePrice:            p.originalPrice ? p.price : undefined,
    currency:             'KES',
    status:               'active' as const,
    primaryImageUrl:      p.image,
    averageRating:        p.rating ?? 0,
    reviewCount:          p.reviewCount ?? 0,
    orderCount:           0,
    stockWarningThreshold: 5,
    isFeatured:           p.badge === 'bestseller',
    isNewArrival:         p.badge === 'new',
    isBestSeller:         p.badge === 'bestseller',
    category:             { id: catSlug, name: p.category, slug: catSlug },
  };
}

export const PRODUCTS: StaticProduct[] = [
  /* Kitchenware */
  { id: 'k1',  name: 'Marble Dinnerware Set',              category: 'Kitchenware', price: 3500,  image: 'https://picsum.photos/seed/marble-dinnerware-set/800/800',           badge: 'bestseller', slug: 'marble-dinnerware-set',       rating: 4.7, reviewCount: 89,  description: 'Elegant marble-finish ceramic set for 6. Includes dinner plates, side plates and soup bowls. Microwave & dishwasher safe.' },
  { id: 'k2',  name: 'Stainless Steel Cookware Set',       category: 'Kitchenware', price: 4200,  originalPrice: 5500, image: 'https://picsum.photos/seed/stainless-cookware-set/800/800',  badge: 'sale',       slug: 'stainless-cookware-set',      rating: 4.6, reviewCount: 112, description: '7-piece non-stick stainless steel cookware. Two saucepots (2.5L + 4L), casserole 6L and bonus frying pan. Induction compatible.' },
  { id: 'k3',  name: 'Gold Insulated Hotpot Set',          category: 'Kitchenware', price: 2800,  image: 'https://picsum.photos/seed/gold-hotpot-set/800/800',                             slug: 'gold-hotpot-set',             rating: 4.4, reviewCount: 34,  description: 'Double-wall insulated hotpot set in gold trim. Keeps food warm up to 6 hours. Includes 4.5L and 2.5L pots.' },
  { id: 'k4',  name: 'Rashnik Food Grinder 350W',          category: 'Kitchenware', price: 1800,  image: 'https://picsum.photos/seed/rashnik-food-grinder/800/800',                        slug: 'rashnik-food-grinder',        rating: 4.2, reviewCount: 27,  description: '350W multi-function food processor with stainless steel blades. Chop, blend and grind with ease.' },
  { id: 'k5',  name: 'Signature 4-in-1 Blender',           category: 'Kitchenware', price: 2200,  originalPrice: 2800, image: 'https://picsum.photos/seed/signature-4in1-blender/800/800', badge: 'sale',       slug: 'signature-4in1-blender',      rating: 4.5, reviewCount: 58,  description: 'Versatile 4-in-1 blender with 1.5L jar, grinder, juice extractor and smoothie cups. 700W motor.' },
  { id: 'k6',  name: 'Double-Layer Egg Cooker',            category: 'Kitchenware', price: 950,   image: 'https://picsum.photos/seed/double-layer-egg-cooker/800/800',                     slug: 'double-layer-egg-cooker',     rating: 4.3, reviewCount: 19,  description: 'Steam up to 14 eggs simultaneously. Auto shut-off, BPA-free tray, rapid heating element.' },
  { id: 'k7',  name: 'Blue Marble Plates Set',             category: 'Kitchenware', price: 1800,  image: 'https://picsum.photos/seed/blue-marble-plates/800/800',          badge: 'new',        slug: 'blue-marble-plates',          rating: 4.6, reviewCount: 41,  description: 'Trendy blue marble-print melamine plates. Set of 6. Lightweight, shatterproof and easy to clean.' },
  { id: 'k8',  name: 'Stainless Steel Frying Pan Set',     category: 'Kitchenware', price: 2400,  image: 'https://picsum.photos/seed/stainless-frying-pan-set/800/800',    badge: 'new',        slug: 'stainless-frying-pan-set',    rating: 4.5, reviewCount: 36,  description: '5-piece non-stick frying pan set. Sizes: 20cm, 24cm, 28cm plus two lids. Even heat distribution.' },
  { id: 'k9',  name: 'Selven Quilted Hotpot Set',          category: 'Kitchenware', price: 3200,  image: 'https://picsum.photos/seed/selven-quilted-hotpot/800/800',                       slug: 'selven-quilted-hotpot',       rating: 4.4, reviewCount: 22,  description: 'Fabric-quilted hotpot set for elegant table presentation. Keeps food warm for up to 4 hours.' },
  { id: 'k10', name: '2-Tier Metal Fruit Basket',          category: 'Kitchenware', price: 1200,  image: 'https://picsum.photos/seed/2tier-fruit-basket/800/800',                          slug: '2tier-fruit-basket',          rating: 4.3, reviewCount: 31,  description: 'Sturdy 2-tier metal fruit and vegetable basket. Powder-coated finish, freestanding design.' },
  { id: 'k11', name: 'Kunshion Marble Knife Set',          category: 'Kitchenware', price: 2800,  image: 'https://picsum.photos/seed/kunshion-knife-set/800/800',          badge: 'new',        slug: 'kunshion-knife-set',          rating: 4.7, reviewCount: 55,  description: '6-piece marble-handle knife set with acrylic block. Stainless steel blades, razor-sharp edges.' },
  { id: 'k12', name: 'Mika Pressure Cooker',               category: 'Kitchenware', price: 2500,  image: 'https://picsum.photos/seed/mika-pressure-cooker/800/800',                        slug: 'mika-pressure-cooker',        rating: 4.5, reviewCount: 47,  description: '4L aluminium pressure cooker with safety valve and locking lid. Reduces cooking time by up to 70%.' },
  { id: 'k13', name: 'Redberry Aluminium Pressure Cooker', category: 'Kitchenware', price: 3200,  image: 'https://picsum.photos/seed/redberry-pressure-cooker/800/800',                    slug: 'redberry-pressure-cooker',    rating: 4.4, reviewCount: 38,  description: '6L heavy-duty aluminium pressure cooker. Multi-purpose: steam, stew and boil. Safety certified.' },
  { id: 'k14', name: 'Electric Egg Cooker 7-Egg',          category: 'Kitchenware', price: 850,   image: 'https://picsum.photos/seed/electric-egg-cooker-7/800/800',      badge: 'new',        slug: 'electric-egg-cooker-7',       rating: 4.2, reviewCount: 14,  description: 'Compact 7-egg electric cooker with boil, steam and poach functions. Automatic shut-off.' },
  /* Appliances */
  { id: 'a1',  name: 'Icona London Microwave Oven',        category: 'Appliances', price: 12500, image: 'https://picsum.photos/seed/icona-london-microwave/800/800',    badge: 'bestseller',  slug: 'icona-london-microwave',      rating: 4.6, reviewCount: 73,  description: '20L digital microwave with 5 power levels, timer and defrost function. Elegant stainless steel interior.' },
  { id: 'a2',  name: 'Eurochet Deluxe Gas Stove',          category: 'Appliances', price: 18000, originalPrice: 22000, image: 'https://picsum.photos/seed/eurochet-gas-stove/800/800', badge: 'sale',        slug: 'eurochet-gas-stove',          rating: 4.5, reviewCount: 61,  description: '4-burner tempered glass gas cooker with automatic ignition and cast iron pan supports. LPG compatible.' },
  { id: 'a3',  name: 'Sonar Hot & Cold Dispenser',         category: 'Appliances', price: 8500,  image: 'https://picsum.photos/seed/sonar-hot-cold-dispenser/800/800', badge: 'bestseller',  slug: 'sonar-hot-cold-dispenser',    rating: 4.8, reviewCount: 134, description: 'Premium hot and cold water dispenser with LED temperature display. Bottom-load design, child-lock hot tap. 12-month warranty.' },
  { id: 'a4',  name: 'Sonar C3 Water Dispenser White',     category: 'Appliances', price: 7800,  image: 'https://picsum.photos/seed/sonar-c3-dispenser-white/800/800',                  slug: 'sonar-c3-dispenser-white',    rating: 4.5, reviewCount: 48,  description: 'Top-load hot and cold water dispenser in clean white finish. Compact design for kitchens and offices.' },
  { id: 'a5',  name: 'Ailyons Coffee & Dispenser Combo',   category: 'Appliances', price: 9500,  image: 'https://picsum.photos/seed/ailyons-coffee-dispenser/800/800',                  slug: 'ailyons-coffee-dispenser',    rating: 4.4, reviewCount: 29,  description: 'Water dispenser with built-in coffee maker. Serves hot water and brewed coffee simultaneously.' },
  { id: 'a6',  name: 'Olelon 2-Burner Glass Gas Stove',    category: 'Appliances', price: 5500,  image: 'https://picsum.photos/seed/olelon-2burner-gas-stove/800/800',  badge: 'new',         slug: 'olelon-2burner-gas-stove',    rating: 4.3, reviewCount: 22,  description: '2-burner tempered glass gas stove with auto ignition. Space-saving tabletop design. LPG compatible.' },
  { id: 'a7',  name: 'Ecomax Mini Fridge 120L',            category: 'Appliances', price: 14500, image: 'https://picsum.photos/seed/ecomax-mini-fridge-120l/800/800',  badge: 'new',         slug: 'ecomax-mini-fridge-120l',     rating: 4.5, reviewCount: 67,  description: '120L energy-efficient mini fridge with freezer compartment. Ideal for bedroom, office or small kitchen. A+ rated.' },
  { id: 'a8',  name: 'Hisense Microwave Oven 20L',         category: 'Appliances', price: 15500, image: 'https://picsum.photos/seed/hisense-microwave-20l/800/800',    badge: 'new',         slug: 'hisense-microwave-20l',       rating: 4.7, reviewCount: 82,  description: 'Hisense 20L solo microwave with digital controls, 6 auto-cook programs and 800W output. Mirror glass door.' },
  { id: 'a9',  name: 'Syinix Semi-Auto Washing Machine',   category: 'Appliances', price: 28000, image: 'https://picsum.photos/seed/syinix-washing-machine/800/800',                   slug: 'syinix-washing-machine',      rating: 4.4, reviewCount: 43,  description: '6kg semi-automatic twin-tub washing machine. Separate wash and spin cycles, transparent lid.' },
  { id: 'a10', name: 'Hisense Washer-Dryer 10kg/6kg',      category: 'Appliances', price: 95000, image: 'https://picsum.photos/seed/hisense-washer-dryer-10kg/800/800', badge: 'new',        slug: 'hisense-washer-dryer-10kg',   rating: 4.6, reviewCount: 37,  description: 'Hisense 10kg/6kg washer-dryer combo. 15 wash programs, steam function, Wi-Fi enabled. Energy class B.' },
  /* Bedding & Canopies */
  { id: 'b1',  name: 'Purple Princess Bed Canopy',         category: 'Bedding',    price: 3200,  image: 'https://picsum.photos/seed/purple-princess-canopy/800/800',  badge: 'bestseller',  slug: 'purple-princess-canopy',      rating: 4.8, reviewCount: 97,  description: 'Dreamy circular ceiling-mount princess canopy in rich purple. Mosquito net included. Fits single and double beds.' },
  { id: 'b2',  name: 'White Four-Post Bed Canopy',         category: 'Bedding',    price: 4500,  image: 'https://picsum.photos/seed/white-four-post-canopy/800/800',                   slug: 'white-four-post-canopy',      rating: 4.6, reviewCount: 54,  description: 'Elegant white four-post bed canopy frame with sheer curtains. Easy self-assembly, universal fit.' },
  { id: 'b3',  name: 'Pink Round Ceiling Mosquito Net',    category: 'Bedding',    price: 1800,  image: 'https://picsum.photos/seed/pink-ceiling-mosquito-net/800/800',                slug: 'pink-ceiling-mosquito-net',   rating: 4.4, reviewCount: 32,  description: 'Round ceiling-hung mosquito net in soft pink. Fine mesh for maximum protection. Suitable for all bed sizes.' },
  /* Carpets */
  { id: 'c1',  name: 'Abstract JY-307 Carpet Beige',       category: 'Carpets',    price: 5500,  image: 'https://picsum.photos/seed/abstract-beige-carpet/800/800',   badge: 'bestseller',  slug: 'abstract-beige-carpet',       rating: 4.7, reviewCount: 88,  description: 'JY-307 premium abstract-pattern carpet in warm beige tones. Non-slip backing, stain-resistant fibre. Available in multiple sizes.' },
  { id: 'c2',  name: 'Geometric Green & Gold Carpet',      category: 'Carpets',    price: 6800,  image: 'https://picsum.photos/seed/geometric-green-carpet/800/800',                   slug: 'geometric-green-carpet',      rating: 4.6, reviewCount: 64,  description: 'Bold geometric pattern in forest green and gold. Thick pile, soft underfoot. Ideal for living rooms and bedrooms.' },
  { id: 'c3',  name: 'Art Deco Black & Gold Carpet',       category: 'Carpets',    price: 7200,  image: 'https://picsum.photos/seed/artdeco-black-carpet/800/800',    badge: 'new',         slug: 'artdeco-black-carpet',        rating: 4.5, reviewCount: 41,  description: 'Art deco black-and-gold pattern carpet. Dense pile, anti-slip base. Adds a sophisticated look to any room.' },
  /* Home Décor */
  { id: 'd1',  name: 'Tribal Cushion Cover Set',           category: 'Home Décor', price: 1200,  image: 'https://picsum.photos/seed/tribal-cushion-covers/800/800',                    slug: 'tribal-cushion-covers',       rating: 4.5, reviewCount: 38,  description: 'Set of 4 tribal-print cushion covers in black and white. 45×45cm, zip closure, machine washable.' },
  { id: 'd2',  name: 'Floral Yellow Cushion Covers',       category: 'Home Décor', price: 980,   image: 'https://picsum.photos/seed/floral-yellow-cushions/800/800',                   slug: 'floral-yellow-cushions',      rating: 4.4, reviewCount: 26,  description: 'Set of 4 floral cushion covers in sunny yellow. Soft polyester, 45×45cm, adds a pop of colour.' },
  { id: 'd3',  name: 'Devoted Quote Cushion Covers',       category: 'Home Décor', price: 980,   image: 'https://picsum.photos/seed/devoted-quote-cushions/800/800',                   slug: 'devoted-quote-cushions',      rating: 4.3, reviewCount: 19,  description: 'Inspirational "Devoted" quote print cushion covers. Set of 4, 45×45cm, zip closure.' },
  { id: 'd4',  name: 'White Marble Contact Paper Roll',    category: 'Home Décor', price: 650,   image: 'https://picsum.photos/seed/white-marble-contact-paper/800/800',                slug: 'white-marble-contact-paper',  rating: 4.5, reviewCount: 44,  description: '60cm×5m self-adhesive white marble contact paper. Waterproof, removable, ideal for kitchen counters and furniture.' },
  { id: 'd5',  name: 'Grey Marble Contact Paper Roll',     category: 'Home Décor', price: 650,   image: 'https://picsum.photos/seed/grey-marble-contact-paper/800/800',                 slug: 'grey-marble-contact-paper',   rating: 4.4, reviewCount: 31,  description: '60cm×5m self-adhesive grey marble contact paper. Premium thickness, bubble-free application.' },
  { id: 'd6',  name: 'Non-Slip Yoga Mat',                  category: 'Home Décor', price: 1500,  image: 'https://picsum.photos/seed/non-slip-yoga-mat/800/800',                         slug: 'non-slip-yoga-mat',           rating: 4.6, reviewCount: 52,  description: '6mm thick non-slip yoga mat with alignment lines. TPE material, eco-friendly, includes carry strap.' },
  { id: 'd7',  name: 'Under Door Space Sealer',            category: 'Home Décor', price: 450,   image: 'https://picsum.photos/seed/under-door-sealer/800/800',                         slug: 'under-door-sealer',           rating: 4.3, reviewCount: 28,  description: 'Self-adhesive foam door bottom seal strip. Blocks dust, insects and cold drafts. Fits doors up to 90cm wide.' },
  /* Storage */
  { id: 's1',  name: 'Fabric Portable Wardrobe Maroon',    category: 'Storage',    price: 3800,  originalPrice: 4500, image: 'https://picsum.photos/seed/fabric-wardrobe-maroon/800/800', badge: 'sale', slug: 'fabric-wardrobe-maroon',      rating: 4.5, reviewCount: 69,  description: 'Portable fabric wardrobe in rich maroon. 8-section hanging rail, 2 shoe racks, zippered cover. No tools needed.' },
  { id: 's2',  name: 'Foldable Clothes Drying Rack',       category: 'Storage',    price: 2800,  image: 'https://picsum.photos/seed/foldable-drying-rack/800/800',                     slug: 'foldable-drying-rack',        rating: 4.4, reviewCount: 47,  description: 'Heavy-duty foldable clothes drying rack with 3 tiers and 16 rails. Holds up to 15kg. Compact fold for storage.' },
  { id: 's3',  name: 'Metal Clothes Drying Rack',          category: 'Storage',    price: 1800,  image: 'https://picsum.photos/seed/metal-drying-rack-grey/800/800',                   slug: 'metal-drying-rack-grey',      rating: 4.3, reviewCount: 33,  description: 'Space-saving grey powder-coated metal drying rack. Adjustable rail heights, 12kg capacity.' },
  { id: 's4',  name: '7-Tier Steel Shoe Rack',             category: 'Storage',    price: 2500,  image: 'https://picsum.photos/seed/7tier-steel-shoe-rack/800/800',    badge: 'new',         slug: '7tier-steel-shoe-rack',       rating: 4.6, reviewCount: 55,  description: '7-tier chrome steel shoe rack. Holds up to 28 pairs of shoes. Easy assembly, adjustable shelf heights.' },
  { id: 's5',  name: 'Adjustable Ironing Board',           category: 'Storage',    price: 2200,  image: 'https://picsum.photos/seed/adjustable-ironing-board/800/800',                 slug: 'adjustable-ironing-board',    rating: 4.4, reviewCount: 39,  description: 'Adjustable height ironing board with 100% cotton cover and iron rest. Non-slip feet, folds flat.' },
];

export const CATEGORY_SLUGS: Record<string, string> = {
  'kitchenware': 'Kitchenware',
  'appliances':  'Appliances',
  'bedding':     'Bedding',
  'carpets':     'Carpets',
  'home-decor':  'Home Décor',
  'storage':     'Storage',
};
