USE digital_museum;

INSERT INTO museums (name, location, description, image_url)
VALUES
  (
    'Easy Addict Museum of Digital Culture',
    'Berlin, Germany',
    'Interactive museum focused on internet culture, game art, and digital storytelling.',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04,https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7,https://images.unsplash.com/photo-1502086223501-7ea6ecd79368'
  ),
  (
    'Easy Addict Museum of Ancient Worlds',
    'Athens, Greece',
    'Collection of artifacts spanning Mediterranean civilizations and early trade routes.',
    'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83,https://images.unsplash.com/photo-1554907984-15263bfd63bd,https://images.unsplash.com/photo-1529429612779-c8e40ef2f36c'
  );

INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
SELECT
  m.id,
  'Neon Arcade Console',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f,https://images.unsplash.com/photo-1511512578047-dfb367046420,https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42',
  'Restored cabinet from a late-1980s arcade hall with original controls.',
  'Arcade cabinets became social hubs for competitive play and youth culture in the late 20th century.',
  'Digital History',
  'arcade,video-games,technology'
FROM museums m
WHERE m.name = 'Easy Addict Museum of Digital Culture';

INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
SELECT
  m.id,
  'Pixel Mosaic Wall',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853,https://images.unsplash.com/photo-1518773553398-650c184e0bb3,https://images.unsplash.com/photo-1515169067868-5387ec356754',
  'Large-scale mosaic built from retro-style pixel tiles and LEDs.',
  'Pixel art aesthetics emerged from hardware limits and later became a deliberate visual language.',
  'Digital Art',
  'pixel-art,led,installation'
FROM museums m
WHERE m.name = 'Easy Addict Museum of Digital Culture';

INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
SELECT
  m.id,
  'Aegean Bronze Helmet',
  'https://images.unsplash.com/photo-1524492449090-c8f9a5d6f5f4,https://images.unsplash.com/photo-1561214115-f2f134cc4912,https://images.unsplash.com/photo-1610701596007-11502861dcfa',
  'Bronze ceremonial helmet discovered near an ancient coastal settlement.',
  'Bronze armor pieces signaled both military function and social rank in early city-states.',
  'Ancient Warfare',
  'bronze,helmet,aegean'
FROM museums m
WHERE m.name = 'Easy Addict Museum of Ancient Worlds';

INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
SELECT
  m.id,
  'Maritime Trade Ledger Tablet',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a,https://images.unsplash.com/photo-1456324504439-367cee3b3c32,https://images.unsplash.com/photo-1513128034602-7814ccaddd4e',
  'Inscribed tablet documenting cargo, ports, and merchant contracts.',
  'Administrative tablets reveal the complexity of trade systems linking ports across the Mediterranean.',
  'Economic History',
  'tablet,trade,inscription'
FROM museums m
WHERE m.name = 'Easy Addict Museum of Ancient Worlds';
