-- Sync primary meal images (batch 04, final) — run in Supabase SQL Editor.

begin;

update public.foods f
set
  image_url = v.url,
  image_urls = '[]'::jsonb,
  photo_source = case
    when v.url ilike '%.supabase.co/%' then 'supabase-storage'
    else 'external'
  end,
  photo_attribution = case
    when v.url ilike '%unsplash.com%' then 'Unsplash'
    when v.url ilike '%.supabase.co/%' then 'supabase meals bucket'
    else 'catalog'
  end,
  image_review_status = 'approved'
from (
  values
    ('Tikka Masala', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tikka-masala.jpg'),
    ('Tilapia (cooked)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tilapia-cooked.jpg'),
    ('Toasted Sandwich', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/toasted-sandwich.jpg'),
    ('Tofu (firm)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-firm.png'),
    ('Tofu and Quinoa Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-and-quinoa-bowl.jpg'),
    ('Tofu Buddha Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-buddha-bowl.jpg'),
    ('Tofu Miso Soup', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-miso-soup.jpg'),
    ('Tofu Poke Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-poke-bowl.jpg'),
    ('Tofu Stir Fry', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-stir-fry.jpg'),
    ('Tofu Veggie Noodle Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-veggie-noodle-bowl.jpg'),
    ('Tofu Veggie Stir-Fry', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tofu-veggie-stir-fry.jpg'),
    ('Tom Yum Soup', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tom-yum-soup.jpg'),
    ('Tomato', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tomato.jpg'),
    ('Tomato Basil Soup', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tomato-basil-soup.jpg'),
    ('Tomato Soup', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tomato-soup.jpg'),
    ('Tonkatsu', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tonkatsu.jpg'),
    ('Tropical Smoothie Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tropical-smoothie-bowl.jpg'),
    ('Tuna (water)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-water.jpg'),
    ('Tuna and White Bean Salad', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-and-white-bean-salad.jpg'),
    ('Tuna Nicoise Salad', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-nicoise-salad.jpg'),
    ('Tuna Nigiri', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-nigiri.jpg'),
    ('Tuna Pasta Salad', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-pasta-salad.jpg'),
    ('Tuna Salad Sandwich', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/tuna-salad-sandwich.jpg'),
    ('Turkey Avocado Wrap', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-avocado-wrap.jpg'),
    ('Turkey Breast (cooked)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-breast-cooked.jpg'),
    ('Turkey Chili', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-chili.jpg'),
    ('Turkey Meatball Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-meatball-bowl.webp'),
    ('Turkey Quinoa Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-quinoa-bowl.jpg'),
    ('Turkey Sandwich', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/turkey-sandwich.jpg'),
    ('Vegan Pancakes', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/vegan-pancakes.jpg'),
    ('Vegetable Lentil Soup', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/vegetable-lentil-soup.jpg'),
    ('Vegetable Omelette', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/vegetable-omelette.jpg'),
    ('Vegetable Pho Bowl', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/vegetable-pho-bowl.jpg'),
    ('Vegetable Pizza', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/margherita-pizza.jpg'),
    ('Vegetable Stir Fry', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/vegetable-stir-fry.jpg'),
    ('Veggie Hummus Wrap', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/veggie-hummus-wrap.jpg'),
    ('Waffles', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/waffles.jpg'),
    ('Walnuts', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/walnuts.jpg'),
    ('Watermelon', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/watermelon.jpg'),
    ('White Bread', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/white-bread.jpg'),
    ('White Rice (cooked)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/white-rice-cooked.jpg'),
    ('Whole Wheat Bread', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/whole-wheat-bread.jpg'),
    ('Yogurt (plain)', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/yogurt-plain.jpg'),
    ('Yogurt with Granola', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/yogurt-with-granola.jpg'),
    ('Zucchini', 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/zucchini.jpg')
) as v(name, url)
where f.name = v.name;

commit;
