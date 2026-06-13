export interface Review {
  id: string;
  author: string;
  initials: string;
  rating: 4 | 5;
  date: string;
  text: string;
  verified: boolean;
}

type ReviewTemplate = {
  author: string;
  initials: string;
  rating: 4 | 5;
  date: string;
  text: string;
  verified: boolean;
};

const KITCHENWARE_TEMPLATES: ReviewTemplate[] = [
  { author: 'Wanjiru Kamau', initials: 'WK', rating: 5, date: '14 May 2025', text: 'Absolutely love this! The quality is outstanding and it has made my cooking so much easier. Highly recommend to anyone looking to upgrade their kitchen.', verified: true },
  { author: 'Otieno Mwangi', initials: 'OM', rating: 4, date: '2 Apr 2025', text: 'Great product, good value for money. Arrived well-packaged and exactly as described. Will definitely order again from Maschon.', verified: true },
  { author: 'Aisha Oduya', initials: 'AO', rating: 5, date: '19 Mar 2025', text: 'I was skeptical at first but this exceeded my expectations. The finish is beautiful and it feels very sturdy. My family is impressed!', verified: false },
  { author: 'Muthoni Kariuki', initials: 'MK', rating: 4, date: '8 Jun 2025', text: 'Solid kitchen item. Delivery was prompt — received it the next day in Nairobi. The product looks even better in person than in the photos.', verified: true },
  { author: 'Kamau Njoroge', initials: 'KN', rating: 5, date: '27 Jan 2025', text: 'Best purchase I have made this year. Easy to clean, durable and the design fits perfectly with my kitchen décor. Five stars without hesitation.', verified: true },
];

const APPLIANCES_TEMPLATES: ReviewTemplate[] = [
  { author: 'Beatrice Adhiambo', initials: 'BA', rating: 5, date: '3 Jun 2025', text: 'This appliance has been a game changer in my home. It works perfectly, is energy efficient and the build quality is impressive. Worth every shilling.', verified: true },
  { author: 'James Kipkoech', initials: 'JK', rating: 4, date: '15 Apr 2025', text: 'Good appliance overall. Setup was straightforward and it works as advertised. The warranty process with Maschon was smooth when I had a question.', verified: true },
  { author: 'Fatuma Hassan', initials: 'FH', rating: 5, date: '22 Feb 2025', text: 'Excellent quality. I have had similar products from other brands and this is by far the best. Silent, efficient and looks premium. Very happy with my purchase.', verified: false },
  { author: 'Njeri Wachira', initials: 'NW', rating: 4, date: '11 May 2025', text: 'Arrived in perfect condition. The performance is great and it saves me a lot of time. Customer service at Maschon was very helpful when I had questions.', verified: true },
  { author: 'Peter Ochieng', initials: 'PO', rating: 5, date: '30 Mar 2025', text: 'Wow, this is incredible value! I shopped around for weeks and Maschon had the best price. The product itself is top-notch. Delivered on time too.', verified: true },
];

const BEDDING_TEMPLATES: ReviewTemplate[] = [
  { author: 'Grace Mwangi', initials: 'GM', rating: 5, date: '7 May 2025', text: 'My daughter absolutely loves this! It transformed her bedroom completely. The quality of the material is beautiful and the installation was easy. Highly recommend.', verified: true },
  { author: 'Susan Ndungu', initials: 'SN', rating: 4, date: '21 Mar 2025', text: 'Very pretty and good quality. It arrived well-packaged and looked even better in person. The bed now looks like something from a magazine!', verified: true },
  { author: 'Esther Wambui', initials: 'EW', rating: 5, date: '14 Apr 2025', text: 'Beautiful addition to our bedroom. The fabric is soft and the color is exactly as shown. Received so many compliments from guests. Will order again.', verified: false },
  { author: 'Lydia Achieng', initials: 'LA', rating: 4, date: '2 Jun 2025', text: 'Great product for the price. It makes the room look so elegant and it was straightforward to set up. Delivery was fast — within two days to Kisumu.', verified: true },
  { author: 'Rose Mutua', initials: 'RM', rating: 5, date: '18 Jan 2025', text: 'My kids were over the moon when they saw this. Quality is excellent and it has held up well for months. Definitely worth the investment.', verified: true },
];

const CARPETS_TEMPLATES: ReviewTemplate[] = [
  { author: 'David Kimani', initials: 'DK', rating: 5, date: '10 May 2025', text: 'This carpet completely transformed our living room. The colours are vibrant, the pile is thick and comfortable underfoot. Very happy with this purchase.', verified: true },
  { author: 'Agnes Wanjiku', initials: 'AW', rating: 4, date: '28 Mar 2025', text: 'Beautiful carpet at a great price. It is easy to vacuum and does not shed. The non-slip backing is a huge bonus — stays perfectly in place.', verified: true },
  { author: 'Thomas Omondi', initials: 'TO', rating: 5, date: '5 Feb 2025', text: 'Superb quality. The pattern looks even more stunning in real life. My entire family has commented on how nice our sitting room looks now. Five stars!', verified: false },
  { author: 'Margaret Njeri', initials: 'MN', rating: 4, date: '16 Apr 2025', text: 'Good quality carpet. It arrived rolled up neatly and laid flat after a day. The colours match the online photos well. Great value.', verified: true },
  { author: 'Joseph Kamau', initials: 'JK', rating: 5, date: '22 May 2025', text: 'Excellent carpet! Thick, soft and very easy to clean. I have had cheaper carpets before that wore out quickly. This one feels built to last.', verified: true },
];

const DECOR_TEMPLATES: ReviewTemplate[] = [
  { author: 'Lucy Wairimu', initials: 'LW', rating: 5, date: '4 Jun 2025', text: 'Perfect for refreshing our living room. The quality is wonderful and the colours are just as vibrant as in the photos. Arrived quickly and well-wrapped.', verified: true },
  { author: 'Emmanuel Opiyo', initials: 'EO', rating: 4, date: '17 Apr 2025', text: 'Nice product, good value. It has added a lovely touch to our home décor. The material feels quality and it was very easy to work with.', verified: true },
  { author: 'Violet Auma', initials: 'VA', rating: 5, date: '9 Mar 2025', text: 'I am really pleased with this. It looks so much more expensive than it is. Everyone who visits asks where I got it from. Definitely ordering more!', verified: false },
  { author: 'Christine Njoki', initials: 'CN', rating: 4, date: '1 May 2025', text: 'Exactly what I needed to update my home without spending a fortune. Good quality, fast shipping and excellent customer service from Maschon.', verified: true },
  { author: 'Brian Onyango', initials: 'BO', rating: 5, date: '25 Feb 2025', text: 'Fantastic product! It does exactly what it promises and the quality is noticeably better than similar items I have bought elsewhere. Very satisfied.', verified: true },
];

const STORAGE_TEMPLATES: ReviewTemplate[] = [
  { author: 'Naomi Kiptoo', initials: 'NK', rating: 5, date: '6 Jun 2025', text: 'This has solved my storage problems completely. It is sturdy, well-made and the assembly instructions were clear. My room is so much more organised now.', verified: true },
  { author: 'Francis Mbugua', initials: 'FM', rating: 4, date: '24 Apr 2025', text: 'Very practical and good quality. It holds up well under weight and the design is neat and unobtrusive. Delivery was on time. Happy with this purchase.', verified: true },
  { author: 'Priscilla Wanjala', initials: 'PW', rating: 5, date: '12 Mar 2025', text: 'Brilliant! Exactly what I was looking for. The build quality is solid and it is much more spacious than I expected. Great value for money.', verified: false },
  { author: 'Samuel Gitau', initials: 'SG', rating: 4, date: '19 May 2025', text: 'Great storage solution. Easy to assemble with two people and looks good in our bedroom. The quality feels durable and should last a long time.', verified: true },
  { author: 'Harriet Akinyi', initials: 'HA', rating: 5, date: '8 Feb 2025', text: 'I have been looking for something like this for ages. It is exactly as described and the quality is impressive. Fast shipping to Mombasa too. Highly recommend.', verified: true },
];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickTemplates(pool: ReviewTemplate[], seed: number): ReviewTemplate[] {
  const offset = seed % (pool.length - 2);
  return [pool[offset], pool[(offset + 1) % pool.length], pool[(offset + 2) % pool.length]];
}

export function getReviews(productId: string): Review[] {
  const prefix = productId.charAt(0).toLowerCase();
  const hash = simpleHash(productId);

  let pool: ReviewTemplate[];
  switch (prefix) {
    case 'k': pool = KITCHENWARE_TEMPLATES; break;
    case 'a': pool = APPLIANCES_TEMPLATES;  break;
    case 'b': pool = BEDDING_TEMPLATES;     break;
    case 'c': pool = CARPETS_TEMPLATES;     break;
    case 'd': pool = DECOR_TEMPLATES;       break;
    case 's': pool = STORAGE_TEMPLATES;     break;
    default:  pool = KITCHENWARE_TEMPLATES;
  }

  return pickTemplates(pool, hash).map((t, idx) => ({
    id: `${productId}-r${idx + 1}`,
    ...t,
  }));
}
