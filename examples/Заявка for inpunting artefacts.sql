INSERT INTO artifacts (
  museum_id,
  name,
  image_url,
  description,
  historical_background,
  category,
  tags
)
SELECT
  m.id,
  'Book Cover Plaque: Christ in Majesty with Evangelist Symbols',
  '',
  'Ivory Romanesque book cover plaque depicting Christ in Majesty seated in a double mandorla, blessing with one hand while holding a book in the other. He is supported by angels and flanked by cherubim, with the symbols of the four evangelists placed in the corners. A highly symbolic theological composition emphasizing divine authority and the Gospels.',
  'Romanesque period, c. 1025–1060 CE (11th century), made in Cologne, Germany. Material: elephant ivory. Dimensions: H 13.4 cm, W 9.8 cm, D 1.2 cm. Inventory number: OA 2603. Originally part of the Louis-Charles Timbal Collection (acquired 1882). Now held in the Musée du Louvre, Department of Medieval, Renaissance and Modern Decorative Arts. Associated with Ottonian/Romanesque artistic tradition emphasizing imperial and theological iconography in ivory book covers.',
  'Medieval Europe',
  'roman,romanesque,ivory,book cover,christ in majesty,cologne,evangelists,ottonian art,medieval christianity,louvre,religious art,elephant ivory'
FROM museums m
WHERE m.name = 'Louvre Museum';