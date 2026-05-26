
-- Map theme tags → selfcare-category tags and migrate content_tags
WITH mapping(theme_slug, sc_slug) AS (
  VALUES
    ('alert','productivity'),
    ('calm','calm'),
    ('destress','calm'),
    ('dream','sleep'),
    ('energy','movement'),
    ('focus','productivity'),
    ('mastery','productivity'),
    ('panic','calm'),
    ('relaxation','calm'),
    ('sleep','sleep'),
    ('stamina','movement'),
    ('unwind','calm')
),
theme_dim AS (SELECT id FROM tag_dimensions WHERE slug = 'theme'),
sc_dim AS (SELECT id FROM tag_dimensions WHERE slug = 'selfcare-category'),
theme_tags AS (
  SELECT t.id AS theme_tag_id, t.slug AS theme_slug
  FROM tags t WHERE t.dimension_id = (SELECT id FROM theme_dim)
),
sc_tags AS (
  SELECT t.id AS sc_tag_id, lower(t.slug) AS sc_slug
  FROM tags t WHERE t.dimension_id = (SELECT id FROM sc_dim)
),
resolved AS (
  SELECT tt.theme_tag_id, st.sc_tag_id
  FROM theme_tags tt
  JOIN mapping m ON m.theme_slug = tt.theme_slug
  JOIN sc_tags st ON st.sc_slug = m.sc_slug
)
INSERT INTO content_tags (content_type, content_id, tag_id)
SELECT ct.content_type, ct.content_id, r.sc_tag_id
FROM content_tags ct
JOIN resolved r ON r.theme_tag_id = ct.tag_id
ON CONFLICT DO NOTHING;

-- Delete the theme dimension (cascades to its tags + content_tags rows)
DELETE FROM tag_dimensions WHERE slug = 'theme';
