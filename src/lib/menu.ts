// The Boathouse menu. Photos live in public/images/menu/<category>/<dish>.jpg
// (alternate shots as <dish>-alt.*); a missing file shows a neutral tile.

export type MenuTag = "bestseller" | "vegan";

export type OptionChoice = { id: string; name: string; price?: number };

// A set of choices on the dish sheet: "required" groups take exactly one
// choice, optional ones take any number.
export type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  prompt?: string; // required groups: shown on the Add button until chosen
  choices: OptionChoice[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // PKR
  image: string;
  tag?: MenuTag;
  options?: OptionGroup[];
  soldOut?: boolean;
};

// Chosen option ids per group id.
export type Selections = Record<string, string[]>;

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export const restaurant = {
  name: "The Boathouse",
  rating: 4.8,
  guests: "2,729+",
  area: "F 8/3, Islamabad",
  hours: "8 AM - 1 AM",
  table: 1,
  serviceTime: "15-20 min",
  heroImage: "images/boathouse-hero.png",
  logo: "images/boathouse-logo.png",
  loyaltyImage: "images/loyalty-club.png",
  tableCode: "4821", // shared with guests so they join the same bill
  server: "Alex", // named on the tip and review screens
  phone: "+92 51 0000000", // placeholder: "Need help? Call" on the order tracking page
  // Receipt settings. Menu prices are tax-inclusive; the receipt shows the
  // sales tax contained in the food amount at this rate (confirm with the
  // restaurant: Islamabad charges a lower rate on card/digital payments).
  salesTaxRate: 0.05,
  ntn: "", // National Tax Number, printed on receipts when set
};

export const inviteUrl = `tabletappk.com/t/${restaurant.table}?c=${restaurant.tableCode}`;

export const menu: MenuCategory[] = [
  {
    id: "breakfast",
    name: "Breakfast",
    items: [
      {
        id: "boathouse-breakfast",
        name: "Boathouse Breakfast",
        description:
          "Two eggs your way, beef bacon, chicken sausage, hash brown, sweet potato fries, a fluffy pancake, grilled tomato and mushrooms",
        price: 1895,
        image: "images/menu/breakfast/boathouse-breakfast.jpg",
        tag: "bestseller",
      },
      {
        id: "big-breakfast",
        name: "The Big Breakfast",
        description:
          "Our biggest plate: chicken sausages, beef bacon, black pudding, fried eggs, grilled tomato, mushrooms, baked beans and toasted sourdough",
        price: 2295,
        image: "images/menu/breakfast/big-breakfast.jpg",
      },
      {
        id: "vegetarian-breakfast",
        name: "Vegetarian Breakfast",
        description:
          "Fried eggs, potato cake, hash brown, baked beans, grilled tomato, garlic mushrooms and buttered toast",
        price: 1595,
        image: "images/menu/breakfast/vegetarian-breakfast.jpg",
      },
      {
        id: "vegan-breakfast",
        name: "Vegan Breakfast",
        description:
          "Smashed avocado, baked beans, saut\u00e9ed spinach, garlic mushrooms, crispy potatoes, sweet potato fries and toasted sourdough",
        price: 1595,
        image: "images/menu/breakfast/vegan-breakfast.jpg",
        tag: "vegan",
      },
      {
        id: "cheese-omelette",
        name: "Cheese Omelette",
        description:
          "Three-egg omelette folded with mature cheddar, served with skinny fries and a crunchy garden salad",
        price: 1195,
        image: "images/menu/breakfast/cheese-omelette.jpg",
      },
      {
        id: "spinach-omelette",
        name: "Spinach Omelette",
        description:
          "Three-egg omelette with wilted spinach and herbs, served with skinny fries and a crunchy garden salad",
        price: 1295,
        image: "images/menu/breakfast/spinach-omelette.jpg",
      },
      {
        id: "ham-and-cheese-omelette",
        name: "Ham & Cheese Omelette",
        description:
          "Three-egg omelette with smoked turkey ham and cheddar, served with skinny fries and a crunchy garden salad",
        price: 1395,
        image: "images/menu/breakfast/ham-and-cheese-omelette.jpg",
      },
      {
        id: "mushroom-and-herb-omelette",
        name: "Mushroom & Herb Omelette",
        description:
          "Three-egg omelette with saut\u00e9ed mushrooms and fresh herbs, served with skinny fries and a crunchy garden salad",
        price: 1295,
        image: "images/menu/breakfast/mushroom-and-herb-omelette.jpg",
      },
    ],
  },
  {
    id: "eggs-and-brunch",
    name: "Eggs & Brunch",
    items: [
      {
        id: "eggs-benedict",
        name: "Eggs Benedict",
        description:
          "Two poached eggs on potato cakes with crispy beef bacon and silky hollandaise",
        price: 1495,
        image: "images/menu/eggs-and-brunch/eggs-benedict.jpg",
        tag: "bestseller",
      },
      {
        id: "eggs-royale",
        name: "Eggs Royale",
        description:
          "Poached eggs on toasted muffins with smoked salmon, wilted spinach and hollandaise",
        price: 1695,
        image: "images/menu/eggs-and-brunch/eggs-royale.jpg",
      },
      {
        id: "eggs-florentine",
        name: "Eggs Florentine",
        description:
          "Poached eggs on toasted muffins with buttered spinach and hollandaise",
        price: 1395,
        image: "images/menu/eggs-and-brunch/eggs-florentine.jpg",
      },
      {
        id: "avocado-toast-poached-egg",
        name: "Avocado Toast & Poached Egg",
        description:
          "Smashed avocado on toasted seeded sourdough with a soft poached egg and chilli oil",
        price: 1395,
        image: "images/menu/eggs-and-brunch/avocado-toast-poached-egg.jpg",
      },
      {
        id: "smoked-salmon-bagel",
        name: "Smoked Salmon Bagel",
        description:
          "Toasted bagel with smoked salmon and smashed avocado, served with creamy scrambled eggs",
        price: 1795,
        image: "images/menu/eggs-and-brunch/smoked-salmon-bagel.jpg",
      },
      {
        id: "cheesy-herb-rarebit",
        name: "Cheesy Herb Rarebit",
        description:
          "Toasted sourdough topped with a bubbling herb and cheddar rarebit, with a sweet tomato relish",
        price: 1195,
        image: "images/menu/eggs-and-brunch/cheesy-herb-rarebit.jpg",
      },
    ],
  },
  {
    id: "pancakes",
    name: "Pancakes",
    items: [
      {
        id: "buttermilk-pancakes",
        name: "Buttermilk Pancakes",
        description:
          "A stack of fluffy buttermilk pancakes with warm maple syrup and a fresh strawberry",
        price: 1095,
        image: "images/menu/pancakes/buttermilk-pancakes.jpg",
      },
      {
        id: "bacon-and-maple-pancakes",
        name: "Bacon & Maple Pancakes",
        description:
          "Fluffy pancakes layered with crispy beef bacon, dusted with icing sugar and served with maple syrup",
        price: 1395,
        image: "images/menu/pancakes/bacon-and-maple-pancakes.jpg",
      },
      {
        id: "lemon-and-sugar-pancakes",
        name: "Lemon & Sugar Pancakes",
        description:
          "Classic pancakes with fresh lemon and a generous sprinkle of sugar",
        price: 995,
        image: "images/menu/pancakes/lemon-and-sugar-pancakes.jpg",
      },
      {
        id: "berries-and-cream-pancakes",
        name: "Berries & Cream Pancakes",
        description:
          "Mini pancakes topped with whipped cream, strawberries, blueberries and raspberries",
        price: 1295,
        image: "images/menu/pancakes/berries-and-cream-pancakes.jpg",
      },
      {
        id: "banoffee-biscoff-pancakes",
        name: "Banoffee Biscoff Pancakes",
        description:
          "Pancakes piled with sliced banana, whipped cream, salted caramel and Lotus Biscoff biscuits",
        price: 1395,
        image: "images/menu/pancakes/banoffee-biscoff-pancakes.jpg",
      },
      {
        id: "cookies-and-cream-pancakes",
        name: "Cookies & Cream Pancakes",
        description:
          "Pancakes with whipped cream, chocolate sauce and Oreo cookies",
        price: 1395,
        image: "images/menu/pancakes/cookies-and-cream-pancakes.jpg",
        tag: "bestseller",
      },
    ],
  },
  {
    id: "sandwiches-and-wraps",
    name: "Sandwiches & Wraps",
    items: [
      {
        id: "boathouse-club",
        name: "Boathouse Club",
        description:
          "Triple-decker with grilled chicken, beef bacon, fried egg, lettuce and tomato, topped with a crispy hash brown",
        price: 1395,
        image: "images/menu/sandwiches-and-wraps/boathouse-club.jpg",
        tag: "bestseller",
      },
      {
        id: "blt",
        name: "BLT",
        description:
          "Crispy beef bacon, crisp lettuce and ripe tomato with mayo on toasted white bloomer",
        price: 1195,
        image: "images/menu/sandwiches-and-wraps/blt.jpg",
      },
      {
        id: "tuna-melt",
        name: "Tuna Melt",
        description:
          "Toasted sandwich with creamy tuna mayo and melted cheddar",
        price: 1195,
        image: "images/menu/sandwiches-and-wraps/tuna-melt.jpg",
      },
      {
        id: "bacon-and-cheese-ciabatta",
        name: "Bacon & Cheese Ciabatta",
        description:
          "Warm ciabatta filled with beef bacon and melted cheese, served with fresh leaves",
        price: 1295,
        image: "images/menu/sandwiches-and-wraps/bacon-and-cheese-ciabatta.jpg",
      },
      {
        id: "peri-peri-chicken-wrap",
        name: "Peri-Peri Chicken Wrap",
        description:
          "Spicy peri-peri chicken, roasted peppers, rice and lettuce in a toasted tortilla",
        price: 1295,
        image: "images/menu/sandwiches-and-wraps/peri-peri-chicken-wrap.jpg",
      },
      {
        id: "chicken-caesar-wrap",
        name: "Chicken Caesar Wrap",
        description:
          "Grilled chicken, crisp lettuce, parmesan and Caesar dressing in a soft tortilla wrap",
        price: 1295,
        image: "images/menu/sandwiches-and-wraps/chicken-caesar-wrap.jpg",
      },
      {
        id: "bacon-and-egg-sandwich",
        name: "Bacon & Egg Sandwich",
        description:
          "Beef bacon and a fried egg in thick-cut white bread, with ketchup on the side",
        price: 995,
        image: "images/menu/sandwiches-and-wraps/bacon-and-egg-sandwich.jpg",
      },
      {
        id: "egg-and-cheese-sandwich",
        name: "Egg & Cheese Sandwich",
        description:
          "Fried eggs and melted cheese in thick-cut white bread, with ketchup on the side",
        price: 845,
        image: "images/menu/sandwiches-and-wraps/egg-and-cheese-sandwich.jpg",
      },
      {
        id: "bacon-sandwich",
        name: "Bacon Sandwich",
        description:
          "A generous stack of beef bacon in thick-cut white bread, with ketchup on the side",
        price: 895,
        image: "images/menu/sandwiches-and-wraps/bacon-sandwich.jpg",
      },
      {
        id: "sausage-sandwich",
        name: "Sausage Sandwich",
        description:
          "Grilled chicken sausages on toasted seeded bread, with ketchup on the side",
        price: 995,
        image: "images/menu/sandwiches-and-wraps/sausage-sandwich.jpg",
      },
      {
        id: "sausage-and-bacon-sandwich",
        name: "Sausage & Bacon Sandwich",
        description:
          "Chicken sausages and beef bacon on toasted seeded bread, with ketchup on the side",
        price: 1095,
        image: "images/menu/sandwiches-and-wraps/sausage-and-bacon-sandwich.jpg",
      },
      {
        id: "sausage-baguette",
        name: "Sausage Baguette",
        description:
          "Grilled chicken sausages in a warm, crusty baguette, with ketchup on the side",
        price: 1095,
        image: "images/menu/sandwiches-and-wraps/sausage-baguette.jpg",
      },
    ],
  },
  {
    id: "burgers-and-hot-dogs",
    name: "Burgers & Hot Dogs",
    items: [
      {
        id: "boathouse-stack-burger",
        name: "Boathouse Stack Burger",
        description:
          "Beef patty with cheddar, beef bacon and burger sauce, crowned with onion rings and a pickle",
        price: 1895,
        image: "images/menu/burgers-and-hot-dogs/boathouse-stack-burger.jpg",
        tag: "bestseller",
      },
      {
        id: "classic-smash-burger",
        name: "Classic Smash Burger",
        description:
          "Smashed beef patty with melted cheese, lettuce and our house burger sauce in a toasted brioche bun",
        price: 1495,
        image: "images/menu/burgers-and-hot-dogs/classic-smash-burger.jpg",
      },
      {
        id: "crispy-chicken-stack",
        name: "Crispy Chicken Stack",
        description:
          "Crispy fried chicken fillet with beef bacon, cheese and burger sauce, topped with onion rings",
        price: 1695,
        image: "images/menu/burgers-and-hot-dogs/crispy-chicken-stack.jpg",
      },
      {
        id: "pulled-beef-burger",
        name: "Pulled Beef Burger",
        description:
          "Beef patty topped with slow-cooked BBQ pulled beef and fresh leaves in a sesame brioche bun",
        price: 1795,
        image: "images/menu/burgers-and-hot-dogs/pulled-beef-burger.jpg",
      },
      {
        id: "loaded-hot-dog",
        name: "Loaded Hot Dog",
        description:
          "Beef frank in a soft bun with caramelised onions, ketchup and American mustard",
        price: 995,
        image: "images/menu/burgers-and-hot-dogs/loaded-hot-dog.jpg",
      },
    ],
  },
  {
    id: "mains-and-salads",
    name: "Mains & Salads",
    items: [
      {
        id: "sticky-bbq-ribs",
        name: "Sticky BBQ Ribs",
        description:
          "A full rack of slow-cooked beef ribs glazed in smoky BBQ sauce, with sweet potato fries",
        price: 2795,
        image: "images/menu/mains-and-salads/sticky-bbq-ribs.jpg",
      },
      {
        id: "fish-and-chips",
        name: "Fish & Chips",
        description:
          "Beer-battered fish with chunky chips, garden peas, tartare sauce and lemon",
        price: 1995,
        image: "images/menu/mains-and-salads/fish-and-chips.jpg",
        tag: "bestseller",
      },
      {
        id: "chicken-tenders-and-fries",
        name: "Chicken Tenders & Fries",
        description:
          "Golden breaded chicken tenders with skinny fries, fresh leaves and garlic mayo",
        price: 1395,
        image: "images/menu/mains-and-salads/chicken-tenders-and-fries.jpg",
      },
      {
        id: "bangers-and-mash",
        name: "Bangers & Mash",
        description:
          "Chicken sausages on creamy mash, smothered in rich onion gravy",
        price: 1495,
        image: "images/menu/mains-and-salads/bangers-and-mash.jpg",
      },
      {
        id: "chicken-caesar-salad",
        name: "Chicken Caesar Salad",
        description:
          "Crisp romaine, grilled chicken, beef bacon, tomato and parmesan, tossed in our house Caesar dressing",
        price: 1495,
        image: "images/menu/mains-and-salads/chicken-caesar-salad.jpg",
      },
      {
        id: "mac-and-cheese",
        name: "Mac & Cheese",
        description:
          "Baked macaroni in a rich three-cheese sauce with broccoli and a golden crumb",
        price: 1195,
        image: "images/menu/mains-and-salads/mac-and-cheese.jpg",
      },
    ],
  },
  {
    id: "fries-and-sides",
    name: "Fries & Sides",
    items: [
      {
        id: "loaded-pulled-beef-fries",
        name: "Loaded Pulled Beef Fries",
        description:
          "Skinny fries piled with BBQ pulled beef and drizzled with garlic mayo",
        price: 1295,
        image: "images/menu/fries-and-sides/loaded-pulled-beef-fries.jpg",
        tag: "bestseller",
      },
      {
        id: "bacon-and-cheese-fries",
        name: "Bacon & Cheese Fries",
        description:
          "Skinny fries smothered in melted cheese and crispy beef bacon",
        price: 995,
        image: "images/menu/fries-and-sides/bacon-and-cheese-fries.jpg",
      },
      {
        id: "cheesy-fries",
        name: "Cheesy Fries",
        description:
          "Skinny fries topped with bubbling melted cheddar",
        price: 795,
        image: "images/menu/fries-and-sides/cheesy-fries.jpg",
      },
      {
        id: "hash-brown",
        name: "Hash Brown",
        description:
          "A golden, crispy potato hash brown",
        price: 295,
        image: "images/menu/fries-and-sides/hash-brown.jpg",
        tag: "vegan",
      },
    ],
  },
  {
    id: "desserts-and-shakes",
    name: "Desserts & Shakes",
    items: [
      {
        id: "apple-pie",
        name: "Apple Pie",
        description:
          "Warm, buttery apple pie with a golden pastry crust",
        price: 795,
        image: "images/menu/desserts-and-shakes/apple-pie.jpg",
      },
      {
        id: "carrot-cake",
        name: "Carrot Cake",
        description:
          "Moist spiced carrot cake layered with cream cheese frosting and walnuts",
        price: 795,
        image: "images/menu/desserts-and-shakes/carrot-cake.jpg",
      },
      {
        id: "chocolate-cannoli",
        name: "Chocolate Cannoli",
        description:
          "Crisp Sicilian pastry shell filled with smooth chocolate cream",
        price: 595,
        image: "images/menu/desserts-and-shakes/chocolate-cannoli.jpg",
      },
      {
        id: "pistachio-cannoli",
        name: "Pistachio Cannoli",
        description:
          "Crisp Sicilian pastry shell filled with pistachio cream",
        price: 595,
        image: "images/menu/desserts-and-shakes/pistachio-cannoli.jpg",
      },
      {
        id: "vanilla-cannoli",
        name: "Vanilla Cannoli",
        description:
          "Crisp Sicilian pastry shell filled with vanilla ricotta cream",
        price: 595,
        image: "images/menu/desserts-and-shakes/vanilla-cannoli.jpg",
      },
      {
        id: "chocolate-sfogliatella",
        name: "Chocolate Sfogliatella",
        description:
          "Flaky, layered Italian pastry filled with chocolate and dusted with icing sugar",
        price: 695,
        image: "images/menu/desserts-and-shakes/chocolate-sfogliatella.jpg",
      },
      {
        id: "double-chocolate-muffin",
        name: "Double Chocolate Muffin",
        description:
          "Rich chocolate muffin packed with chocolate chunks",
        price: 495,
        image: "images/menu/desserts-and-shakes/double-chocolate-muffin.jpg",
      },
      {
        id: "banana-walnut-muffin",
        name: "Banana Walnut Muffin",
        description:
          "Soft banana muffin with a crunchy walnut topping",
        price: 495,
        image: "images/menu/desserts-and-shakes/banana-walnut-muffin.jpg",
      },
      {
        id: "cookies-and-cream-shake",
        name: "Cookies & Cream Shake",
        description:
          "Thick chocolate shake blended with Oreo cookies, topped with whipped cream and chocolate sauce",
        price: 895,
        image: "images/menu/desserts-and-shakes/cookies-and-cream-shake.jpg",
        tag: "bestseller",
      },
      {
        id: "vanilla-shake",
        name: "Vanilla Shake",
        description:
          "Classic thick vanilla milkshake topped with whipped cream",
        price: 795,
        image: "images/menu/desserts-and-shakes/vanilla-shake.jpg",
      },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    items: [
      {
        id: "coca-cola",
        name: "Coca-Cola",
        description:
          "Ice-cold 150ml can",
        price: 250,
        image: "images/menu/drinks/coca-cola.jpg",
      },
      {
        id: "diet-coke",
        name: "Diet Coke",
        description:
          "Ice-cold 150ml can, no sugar",
        price: 250,
        image: "images/menu/drinks/diet-coke.jpg",
      },
      {
        id: "tonic-water",
        name: "Schweppes Tonic Water",
        description:
          "Ice-cold 150ml can",
        price: 250,
        image: "images/menu/drinks/tonic-water.jpg",
      },
    ],
  },
  {
    id: "sauces",
    name: "Sauces",
    items: [
      {
        id: "ketchup",
        name: "Ketchup",
        description:
          "Classic tomato ketchup",
        price: 100,
        image: "images/menu/sauces/ketchup.jpg",
        tag: "vegan",
      },
      {
        id: "garlic-mayo",
        name: "Garlic Mayo",
        description:
          "Creamy garlic mayonnaise",
        price: 150,
        image: "images/menu/sauces/garlic-mayo.jpg",
      },
      {
        id: "bbq-sauce",
        name: "BBQ Sauce",
        description:
          "Smoky, sweet barbecue sauce",
        price: 150,
        image: "images/menu/sauces/bbq-sauce.jpg",
        tag: "vegan",
      },
      {
        id: "sweet-chilli-sauce",
        name: "Sweet Chilli Sauce",
        description:
          "Sticky sweet chilli dipping sauce",
        price: 150,
        image: "images/menu/sauces/sweet-chilli-sauce.jpg",
        tag: "vegan",
      },
      {
        id: "brown-sauce",
        name: "Brown Sauce",
        description:
          "Tangy, spiced brown sauce",
        price: 100,
        image: "images/menu/sauces/brown-sauce.jpg",
        tag: "vegan",
      },
      {
        id: "american-mustard",
        name: "American Mustard",
        description:
          "Smooth yellow American mustard",
        price: 100,
        image: "images/menu/sauces/american-mustard.jpg",
        tag: "vegan",
      },
      {
        id: "tomato-salsa",
        name: "Tomato Salsa",
        description:
          "Chunky tomato and chilli salsa",
        price: 150,
        image: "images/menu/sauces/tomato-salsa.jpg",
        tag: "vegan",
      },
    ],
  },
];

export const allItems = menu.flatMap((category) => category.items);
export const findItem = (id: string) => allItems.find((item) => item.id === id);

const eggsYourWay: OptionGroup = {
  id: "eggs",
  name: "Eggs your way",
  required: true,
  prompt: "Choose your eggs",
  choices: [
    { id: "fried", name: "Fried" },
    { id: "scrambled", name: "Scrambled" },
    { id: "poached", name: "Poached" },
  ],
};
const breakfastExtras: OptionGroup = {
  id: "extras",
  name: "Add extras",
  required: false,
  choices: [
    { id: "extra-bacon", name: "Extra beef bacon", price: 250 },
    { id: "extra-egg", name: "Extra egg", price: 150 },
    { id: "hash-brown", name: "Hash brown", price: 150 },
  ],
};
const burgerExtras: OptionGroup = {
  id: "extras",
  name: "Add extras",
  required: false,
  choices: [
    { id: "extra-cheese", name: "Extra cheese", price: 100 },
    { id: "beef-bacon", name: "Beef bacon", price: 200 },
    { id: "onion-rings", name: "Onion rings", price: 200 },
  ],
};
const sideChoice: OptionGroup = {
  id: "side",
  name: "Add a side",
  required: false,
  choices: [
    { id: "fries", name: "Skinny fries", price: 250 },
    { id: "side-salad", name: "Side salad", price: 250 },
  ],
};
const shakeExtras: OptionGroup = {
  id: "extras",
  name: "Add extras",
  required: false,
  choices: [{ id: "extra-cream", name: "Extra whipped cream", price: 100 }],
};

const itemOptions: Record<string, OptionGroup[]> = {
  "boathouse-breakfast": [eggsYourWay, breakfastExtras],
  "big-breakfast": [eggsYourWay, breakfastExtras],
  "vegetarian-breakfast": [eggsYourWay],
  "eggs-benedict": [
    {
      id: "base",
      name: "Choose your base",
      required: true,
      prompt: "Choose your base",
      choices: [
        { id: "potato-cake", name: "Potato cake" },
        { id: "english-muffin", name: "English muffin" },
      ],
    },
  ],
  "boathouse-stack-burger": [burgerExtras, sideChoice],
  "classic-smash-burger": [burgerExtras, sideChoice],
  "crispy-chicken-stack": [burgerExtras, sideChoice],
  "pulled-beef-burger": [burgerExtras, sideChoice],
  "blt": [sideChoice],
  "tuna-melt": [sideChoice],
  "boathouse-club": [sideChoice],
  "fish-and-chips": [
    {
      id: "peas",
      name: "Peas",
      required: true,
      prompt: "Choose your peas",
      choices: [
        { id: "garden-peas", name: "Garden peas" },
        { id: "mushy-peas", name: "Mushy peas" },
      ],
    },
  ],
  "chicken-caesar-salad": [
    {
      id: "extras",
      name: "Add extras",
      required: false,
      choices: [
        { id: "extra-chicken", name: "Extra chicken", price: 350 },
        { id: "boiled-egg", name: "Boiled egg", price: 150 },
      ],
    },
  ],
  "cookies-and-cream-shake": [shakeExtras],
  "vanilla-shake": [shakeExtras],
};

// Demo: dishes the kitchen has run out of today.
const soldOutIds = new Set(["pistachio-cannoli", "mac-and-cheese"]);

// Attach options and availability to their dishes (kept separate so the menu
// above stays readable).
for (const item of allItems) {
  item.options = itemOptions[item.id];
  item.soldOut = soldOutIds.has(item.id);
}

// Dishes with a required choice can't be quick-added; they open the card.
export const hasRequiredOptions = (item: MenuItem) => (item.options ?? []).some((group) => group.required);

// The first required group with nothing chosen yet, if any.
export const firstMissingRequired = (item: MenuItem, selections: Selections) =>
  (item.options ?? []).find((group) => group.required && !selections[group.id]?.length);

export function selectedChoices(item: MenuItem, selections: Selections) {
  return (item.options ?? []).flatMap((group) =>
    group.choices.filter((choice) => selections[group.id]?.includes(choice.id)),
  );
}

export const unitPrice = (item: MenuItem, selections: Selections) =>
  item.price + selectedChoices(item, selections).reduce((sum, choice) => sum + (choice.price ?? 0), 0);

export const formatPrice = (pkr: number) => `PKR ${pkr}`;
export const formatAmount = (pkr: number) => pkr.toLocaleString("en-US");
