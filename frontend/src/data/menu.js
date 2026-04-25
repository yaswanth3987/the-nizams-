export const categoriesData = [
    { id: 12, name: 'Nizami Mandi', sub: 'Aromatic rice with tender meat' },
    { id: 2, name: 'Non Veg Starters', sub: "Appetizers from the Nizam's table" },
    { id: 13, name: 'Mandi Platters', sub: 'Grand feast platters for sharing' },
    { id: 1, name: 'Biryani Thaali', sub: 'Complete meal platters for family & friends' },
    { id: 3, name: 'Sea Food', sub: 'Fresh catches from the ocean' },
    { id: 4, name: 'Mix Grill', sub: 'Ultimate grilled platter' },
    { id: 5, name: 'Veg Starters', sub: 'Vegetarian appetizers' },
    { id: 6, name: 'Veg Main Course', sub: 'Hearty vegetarian curries' },
    { id: 7, name: 'Chicken Main Course', sub: 'Classic chicken curries' },
    { id: 8, name: 'Karahi', sub: 'Traditional wok-cooked curries' },
    { id: 9, name: 'Mutton Main Course', sub: 'Traditional mutton specialties' },
    { id: 10, name: 'Rice', sub: 'Fragrant basmati rice' },
    { id: 11, name: 'Biryani', sub: 'Aromatic slow-cooked biryanis' },
    { id: 14, name: 'Breads (Naan & Roti)', sub: 'Freshly baked in our tandoor' },
    { id: 15, name: 'Desserts', sub: 'Sweet traditional delicacies' },
    { id: 16, name: 'Drinks', sub: 'Refreshing beverages' },
    { id: 17, name: 'Lassi', sub: 'Traditional yoghurt drinks' },
    { id: 18, name: 'Milk Shakes', sub: 'Creamy indulgent shakes' },
    { id: 19, name: 'Mock Tails', sub: 'Refreshing non-alcoholic cocktails' },
    { id: 20, name: "Extra's", sub: 'Accompaniments and sides' },
];

export const menuData = [
    // Non Veg Starters
    { id: 'nvs1', name: 'CHICKEN 65', price: 9.99, category: 'Non Veg Starters', spice: 2, veg: false, isPopular: true, image: '/chicken-65.webp' },
    { id: 'nvs2', name: 'CHILLI CHICKEN', price: 9.99, category: 'Non Veg Starters', spice: 3, veg: false, image: '/chilli-chicken.webp' },
    { id: 'nvs3', name: 'CHICKEN MAJESTIC', price: 11.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/majestic-chicken.webp' },
    { id: 'nvs4', name: 'CHICKEN TIKKA KEBAB (4 PCS)', price: 11.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/chicken-tikka-kebab.webp' },
    { id: 'nvs5', name: 'CHICKEN SEEKH KEBAB (4 PCS)', price: 10.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/chicken-seekh-kebab.webp' },
    { id: 'nvs6', name: 'PEPPER CHICKEN', price: 11.99, category: 'Non Veg Starters', spice: 3, veg: false },
    { id: 'nvs7', name: 'CHICKEN TANDOORI FULL', price: 14.99, category: 'Non Veg Starters', spice: 2, veg: false, isRecommended: true, image: '/chicken-tandoori-full.webp' },
    { id: 'nvs8', name: 'CHICKEN TANDOORI HALF', price: 9.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/chicken-tandoori-half.webp' },
    { id: 'nvs9', name: 'CHICKEN TANGDI (4 PCS)', price: 9.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/chicken-tangdi.webp' },
    { id: 'nvs10', name: 'LAMB SEEKH KEBAB (4 PCS)', price: 11.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/lamb-seekh-kebab.webp' },
    { id: 'nvs11', name: 'LAMB CHOPS (4 PCS)', price: 12.99, category: 'Non Veg Starters', spice: 2, veg: false, image: '/lamb-chops.webp' },
    { id: 'nvs12', name: 'MUTTON HALEEM', price: 14.99, category: 'Non Veg Starters', spice: 1, veg: false, isPopular: true, image: '/mutton-haleem.webp' },
    { id: 'nvs13', name: 'MUTTON MARAG', price: 14.99, category: 'Non Veg Starters', spice: 1, veg: false, image: '/mutton-marag.png' },

    // Sea Food
    { id: 'sf1', name: 'MASALA FISH (1 PC)', price: 7.99, category: 'Sea Food', spice: 2, veg: false, image: '/masala-fish.webp' },
    { id: 'sf2', name: 'APOLLO FISH', price: 14.99, category: 'Sea Food', spice: 2, veg: false, image: '/apollo-fish.png' },
    { id: 'sf3', name: 'TANDOORI GRILLED FISH', price: 14.99, category: 'Sea Food', spice: 2, veg: false, image: '/tandoori-grill-fish.webp' },
    { id: 'sf4', name: 'CHILLI GARLIC PRAWNS', price: 14.99, category: 'Sea Food', spice: 3, veg: false, image: '/chilli-garlic-prawns.png' },

    // Veg Starters
    { id: 'vs1', name: 'VEG SPRING ROLL (6 PCS)', price: 7.99, category: 'Veg Starters', spice: 1, veg: true, image: '/veg-spring-roll-6pcs.png' },
    { id: 'vs2', name: 'TANDOORI PANEER TIKKA', price: 10.99, category: 'Veg Starters', spice: 2, veg: true, image: '/tandoori-paneer-tikka.png' },

    // Biryani
    { id: 'b1', name: 'VEG DUM BIRYANI (SINGLE)', price: 7.99, category: 'Biryani', spice: 2, veg: true, image: '/veg-dum-biryani-single.jpg' },
    { id: 'b2', name: 'CHICKEN BIRYANI (SINGLE)', price: 8.99, category: 'Biryani', spice: 2, veg: false, isPopular: true, image: '/chicken-biryani-single.jpg' },
    { id: 'b3', name: 'CHICKEN BIRYANI (DOUBLE)', price: 16.99, category: 'Biryani', spice: 2, veg: false, group: 2, image: '/chicken-biryani-double.jpg' },
    { id: 'b4', name: 'CHICKEN BIRYANI (FAMILY)', price: 22.99, category: 'Biryani', spice: 2, veg: false, group: 4, image: '/chicken-biryani-family.jpg' },
    { id: 'b5', name: 'CHICKEN BIRYANI (JUMBO)', price: 29.99, category: 'Biryani', spice: 2, veg: false, group: 6, image: '/chicken-biryani-jumbo.jpg' },
    { id: 'b6', name: 'LAMB BIRYANI (SINGLE)', price: 11.99, category: 'Biryani', spice: 2, veg: false, image: '/lamb-biryani-single.jpg' },
    { id: 'b7', name: 'LAMB BIRYANI (DOUBLE)', price: 19.99, category: 'Biryani', spice: 2, veg: false, group: 2, image: '/lamb-biryani-double.jpg' },
    { id: 'b8', name: 'LAMB BIRYANI (FAMILY)', price: 29.99, category: 'Biryani', spice: 2, veg: false, group: 4, image: '/lamb-biryani-family.png' },
    { id: 'b9', name: 'LAMB BIRYANI (JUMBO)', price: 39.99, category: 'Biryani', spice: 2, veg: false, group: 6, image: '/lamb-biryani-jumbo.jpg' },

    // Biryani Thaali
    { id: 'bt1', name: 'THAALI FOR 2 (LAMB)', price: 29.99, category: 'Biryani Thaali', desc: '1 Double Biryani, Chicken 65, Chilli Chicken, 1 Pc Tandoori, 1 Naan, 1 Rumali, 2 Drinks', spice: 2, veg: false, group: 2, isRecommended: true, image: '/lamb-biryani-thaali-for-2-people.webp' },
    { id: 'bt2', name: 'THAALI FOR 2 (CHICKEN)', price: 25.99, category: 'Biryani Thaali', desc: '1 Double Biryani, Chicken 65, Chilli Chicken, 1 Pc Tandoori, 1 Naan, 1 Rumali, 2 Drinks', spice: 2, veg: false, group: 2, image: '/chicken-biryani-thaali-for-2-people.webp' },
    { id: 'bt3', name: 'THAALI FOR 4 (LAMB)', price: 59.99, category: 'Biryani Thaali', desc: '2 Double Biryani, 2 Pc Tandoori, 2 Naan, 2 Rumali, 4 Drinks', spice: 2, veg: false, group: 4, image: '/lamb-biryani-thaali-for-4-people.webp' },
    { id: 'bt4', name: 'THAALI FOR 4 (CHICKEN)', price: 54.99, category: 'Biryani Thaali', desc: '2 Double Biryani, 2 Pc Tandoori, 2 Naan, 2 Rumali, 4 Drinks', spice: 2, veg: false, group: 4, image: '/chicken-biryani-thaali-for-4-people.webp' },

    // Chicken Main Course
    { id: 'cmc1', name: 'DUM KA CHICKEN', price: 12.99, category: 'Chicken Main Course', spice: 2, veg: false, image: '/dum-ka-chicken.jpg' },
    { id: 'cmc2', name: 'BUTTER CHICKEN', price: 12.99, category: 'Chicken Main Course', spice: 1, veg: false, isPopular: true, image: '/Butter Chicken.jpg' },

    // Mutton Main Course
    { id: 'mmc1', name: 'BHEJA FRY MASALA', price: 14.99, category: 'Mutton Main Course', spice: 2, veg: false, image: '/Bheja Fry Mumbai.jpg' },
    { id: 'mmc2', name: 'GURDA FRY MASALA', price: 14.99, category: 'Mutton Main Course', spice: 2, veg: false, image: '/Gurda fry Masal.jpg' },
    { id: 'mmc3', name: 'KALEJI FRY MASALA', price: 14.99, category: 'Mutton Main Course', spice: 2, veg: false, image: '/Kaleji fry masala.jpg' },
    { id: 'mmc4', name: 'TALAWA GOSHT', price: 16.99, category: 'Mutton Main Course', spice: 2, veg: false, isRecommended: true, image: '/Talawa Gosht.jpg' },
    { id: 'mmc5', name: 'MUTTON MASALA', price: 16.99, category: 'Mutton Main Course', spice: 2, veg: false, image: '/mutton masala.jpg' },

    // Rice
    { id: 'r1', name: 'PLAIN RICE', price: 4.99, category: 'Rice', spice: 0, veg: true, image: '/Instant Pot Basmati Rice.jpg' },
    { id: 'r2', name: 'ZEERA RICE', price: 5.99, category: 'Rice', spice: 0, veg: true, image: '/Zeera Rice.jpg' },

    // Veg Main Course
    { id: 'vmc1', name: 'TADKA DAL', price: 9.99, category: 'Veg Main Course', spice: 1, veg: true, image: '/Dal Tadka.jpg' },
    { id: 'vmc2', name: 'DAL FRY', price: 12.99, category: 'Veg Main Course', spice: 1, veg: true, image: '/Dal Fry.jpg' },
    { id: 'vmc3', name: 'SHAHI PANEER', price: 12.99, category: 'Veg Main Course', spice: 1, veg: true, image: '/shahi paneer.jpg' },
    { id: 'vmc4', name: 'PANEER BUTTER MASALA', price: 12.99, category: 'Veg Main Course', spice: 1, veg: true, image: '/paneer butter masala.jpg' },

    // Nizami Mandi
    { id: 'nm1', name: 'CHICKEN MANDI (1 PERSON)', price: 11.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 1, image: '/chicken Mandi 1 person.jpg' },
    { id: 'nm2', name: 'CHICKEN MANDI (2 PERSONS)', price: 18.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 2, image: '/Chicken Mandi 2 persons.jpg' },
    { id: 'nm3', name: 'CHICKEN MANDI JUICY (1 PERSON)', price: 13.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 1, image: '/chicken juicy mandi 1 person.jpg' },
    { id: 'nm4', name: 'CHICKEN MANDI JUICY (2 PERSONS)', price: 20.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 2, image: '/chicken juicy mandi 2 persons.jpg' },
    { id: 'nm5', name: 'LAMB MANDI (1 PERSON)', price: 13.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 1, image: '/Lamb-Mandi-1 person.jpg' },
    { id: 'nm6', name: 'LAMB MANDI (2 PERSONS)', price: 21.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 2, image: '/Lamb mandi 2 persons.jpg' },
    { id: 'nm7', name: 'LAMB MANDI JUICY (1 PERSON)', price: 15.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 1 },
    { id: 'nm8', name: 'LAMB MANDI JUICY (2 PERSONS)', price: 23.99, category: 'Nizami Mandi', spice: 1, veg: false, group: 2, image: '/amb mandi juicy 2 persons.jpg' },
    { id: 'nm9', name: 'CHICKEN 65 MANDI', price: 12.99, category: 'Nizami Mandi', spice: 1, veg: false, image: '/chicken 65 mandi.jpg' },
    { id: 'nm10', name: 'CHICKEN TIKKA MANDI', price: 12.99, category: 'Nizami Mandi', spice: 1, veg: false, image: '/chicken tikka mandi.png' },
    { id: 'nm11', name: 'FISH MANDI', price: 12.99, category: 'Nizami Mandi', spice: 1, veg: false, image: '/Fish Mandi.jpg' },

    // Mandi Platters
    { id: 'mp1', name: 'MINGLED MINI PLATTER (3 PERSONS)', price: 39.99, category: 'Mandi Platters', desc: 'Lamb 1pc, Chicken Leg 1pc, Fish 1pc, Chicken 65', spice: 1, veg: false, group: 3, platterItems: [{name: 'Lamb', qty: '1pc'}, {name: 'Chicken Leg', qty: '1pc'}, {name: 'Fish', qty: '1pc'}, {name: 'Chicken 65', qty: 'Portion'}] },
    { id: 'mp2', name: 'BLENDED PLATTER (5 PERSONS)', price: 64.99, category: 'Mandi Platters', desc: 'Lamb 2pcs, Chicken Leg 2pcs, Fish 2pcs, Chicken Tikka 2pcs, Chicken 65, Lamb Chops 2pcs', spice: 1, veg: false, group: 5, platterItems: [{name: 'Lamb', qty: '2pcs'}, {name: 'Chicken Leg', qty: '2pcs'}, {name: 'Fish', qty: '2pcs'}, {name: 'Chicken Tikka', qty: '2pcs'}, {name: 'Chicken 65', qty: 'Portion'}, {name: 'Lamb Chops', qty: '2pcs'}] },
    { id: 'mp3', name: 'JUMBLED PLATTER (7 PERSONS)', price: 84.99, category: 'Mandi Platters', desc: 'Lamb 3pcs, Chicken Leg 3pcs, Fish 3pcs, Chicken Tikka 3pcs, Chicken 65, Lamb Chops 3pcs', spice: 1, veg: false, group: 7, platterItems: [{name: 'Lamb', qty: '3pcs'}, {name: 'Chicken Leg', qty: '3pcs'}, {name: 'Fish', qty: '3pcs'}, {name: 'Chicken Tikka', qty: '3pcs'}, {name: 'Chicken 65', qty: 'Portion'}, {name: 'Lamb Chops', qty: '3pcs'}] },
    { id: 'mp4', name: "NIZAMI'S SPECIAL PLATTER", price: 119.00, category: 'Mandi Platters', desc: 'Lamb 3pcs, Chicken Legs 3pcs, Fish 3pcs, Chicken Tikka 3pcs, Chicken 65, Lamb Chops 3pcs, Half Faham', spice: 1, veg: false, group: 8, platterItems: [{name: 'Lamb', qty: '3pcs'}, {name: 'Chicken Leg', qty: '3pcs'}, {name: 'Fish', qty: '3pcs'}, {name: 'Chicken Tikka', qty: '3pcs'}, {name: 'Chicken 65', qty: 'Portion'}, {name: 'Lamb Chops', qty: '3pcs'}, {name: 'Half Faham', qty: '1pc'}] },

    // Extra's
    { id: 'ex1', name: 'SOUP', price: 2.49, category: "Extra's", spice: 0, veg: true },
    { id: 'ex2', name: 'MANDI RICE', price: 6.99, category: "Extra's", spice: 0, veg: true },
    { id: 'ex3', name: 'CHICKEN PIECE', price: 6.99, category: "Extra's", spice: 1, veg: false },
    { id: 'ex4', name: 'CHICKEN TIKKA (2 PCS)', price: 6.99, category: "Extra's", spice: 2, veg: false },
    { id: 'ex5', name: 'CHICKEN 65', price: 6.99, category: "Extra's", spice: 2, veg: false },
    { id: 'ex6', name: 'FISH PIECE', price: 7.99, category: "Extra's", spice: 1, veg: false },
    { id: 'ex7', name: 'LAMB PIECE', price: 8.99, category: "Extra's", spice: 1, veg: false },
    { id: 'ex8', name: 'LAMB CHOPS (2 PCS)', price: 7.99, category: "Extra's", spice: 2, veg: false },
    { id: 'ex9', name: 'MANDI SAUCE', price: 1.99, category: "Extra's", spice: 1, veg: true },
    { id: 'ex10', name: 'MAYONNAISE', price: 2.49, category: "Extra's", spice: 0, veg: true },

    // Breads (Naan & Roti)
    { id: 'br1', name: 'PLAIN NAAN / PLAIN ROTI', price: 1.99, category: 'Breads (Naan & Roti)', spice: 0, veg: true },
    { id: 'br2', name: 'BUTTER NAAN / BUTTER ROTI', price: 2.49, category: 'Breads (Naan & Roti)', spice: 0, veg: true, image: '/butter-naan.webp' },
    { id: 'br3', name: 'GARLIC NAAN', price: 2.99, category: 'Breads (Naan & Roti)', spice: 0, veg: true },
    { id: 'br4', name: 'CHEESE NAAN', price: 2.99, category: 'Breads (Naan & Roti)', spice: 0, veg: true, image: '/cheese-naan.webp' },
    { id: 'br5', name: 'CHILLI CHEESE NAAN', price: 2.99, category: 'Breads (Naan & Roti)', spice: 1, veg: true },
    { id: 'br6', name: 'CHILLI GARLIC NAAN', price: 3.49, category: 'Breads (Naan & Roti)', spice: 1, veg: true },
    { id: 'br7', name: 'CHEESE GARLIC NAAN', price: 3.49, category: 'Breads (Naan & Roti)', spice: 0, veg: true },
    { id: 'br8', name: 'KEEMA NAAN', price: 3.49, category: 'Breads (Naan & Roti)', spice: 1, veg: false },

    // Desserts
    { id: 'd1', name: 'ICE CREAM (2 SCOOPS)', price: 4.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd2', name: 'GULAB JAMUN (2 PCS)', price: 4.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd3', name: 'SHAHI TUKDA (4 PCS)', price: 5.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd4', name: 'QUBANI KA MEETHA', price: 6.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd5', name: 'QUBANI KA MEETHA WITH ICE CREAM', price: 8.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd6', name: 'GAJAR KA HALWA', price: 7.99, category: 'Desserts', spice: 0, veg: true },
    { id: 'd7', name: 'SUNRISE DELIGHT (REGULAR)', price: 8.99, category: 'Desserts', spice: 0, veg: true, isNew: true },
    { id: 'd8', name: 'SUNRISE DELIGHT (LARGE)', price: 18.99, category: 'Desserts', spice: 0, veg: true },

    // Lassi
    { id: 'l1', name: 'SWEET LASSI (GLASS)', price: 4.99, category: 'Lassi', spice: 0, veg: true },
    { id: 'l2', name: 'SWEET LASSI (JUG)', price: 12.99, category: 'Lassi', spice: 0, veg: true, group: 4 },
    { id: 'l3', name: 'SALT LASSI (GLASS)', price: 4.99, category: 'Lassi', spice: 0, veg: true },
    { id: 'l4', name: 'SALT LASSI (JUG)', price: 12.99, category: 'Lassi', spice: 0, veg: true, group: 4 },
    { id: 'l5', name: 'MANGO LASSI (GLASS)', price: 5.99, category: 'Lassi', spice: 0, veg: true },
    { id: 'l6', name: 'MANGO LASSI (JUG)', price: 14.99, category: 'Lassi', spice: 0, veg: true, group: 4 },

    // Milk Shakes
    { id: 'ms1', name: 'MANGO MILK SHAKE', price: 7.99, category: 'Milk Shakes', spice: 0, veg: true },
    { id: 'ms2', name: 'OREO BISCUIT MILK SHAKE', price: 7.99, category: 'Milk Shakes', spice: 0, veg: true },
    { id: 'ms3', name: 'FERRERO MILK SHAKE', price: 8.99, category: 'Milk Shakes', spice: 0, veg: true },
    { id: 'ms4', name: 'KITKAT MILK SHAKE', price: 8.99, category: 'Milk Shakes', spice: 0, veg: true },
    { id: 'ms5', name: 'CHOCOLATE MILK SHAKE', price: 8.99, category: 'Milk Shakes', spice: 0, veg: true },

    // Mock Tails
    { id: 'mt1', name: 'VIRGIN MOJITO', price: 6.99, category: 'Mock Tails', spice: 0, veg: true },
    { id: 'mt2', name: 'BLUE LAGOON', price: 6.99, category: 'Mock Tails', spice: 0, veg: true },
    { id: 'mt3', name: 'PINA COLADA', price: 7.99, category: 'Mock Tails', spice: 0, veg: true },
    { id: 'mt4', name: 'FRUIT PUNCH', price: 7.99, category: 'Mock Tails', spice: 0, veg: true },

    // Drinks
    { id: 'dr1', name: 'SOFT DRINKS', price: 1.49, desc: 'Coke, Diet Coke, Pepsi, Diet Pepsi, 7Up, Mirinda, Tango', category: 'Drinks', spice: 0, veg: true },
    { id: 'dr2', name: 'THUMS UP / JEERA SODA / RED BULL', price: 2.49, category: 'Drinks', spice: 0, veg: true },
    { id: 'dr3', name: 'WATER BOTTLE', price: 1.50, category: 'Drinks', spice: 0, veg: true }
];
