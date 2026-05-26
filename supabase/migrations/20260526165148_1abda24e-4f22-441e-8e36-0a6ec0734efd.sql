
WITH lookup AS (
  SELECT d.slug AS dim, t.slug AS tag, t.id
  FROM tags t JOIN tag_dimensions d ON d.id = t.dimension_id
),
pairs(content_id, dim, tag) AS (
  VALUES
    -- 5 Languages of Strength (Farsi)
    ('35272b70-42b5-4b69-aa3b-e07aa86d1f83'::uuid, 'door', 'selfcare'),
    ('35272b70-42b5-4b69-aa3b-e07aa86d1f83'::uuid, 'selfcare-category', 'self-kindness'),
    ('35272b70-42b5-4b69-aa3b-e07aa86d1f83'::uuid, 'selfcare-cluster', 'mind'),
    ('35272b70-42b5-4b69-aa3b-e07aa86d1f83'::uuid, 'format', 'education'),
    ('35272b70-42b5-4b69-aa3b-e07aa86d1f83'::uuid, 'language', 'fa'),

    -- BiLingual Power PDF Supplements (companion to Bilingual Strength)
    ('fab6ce0c-553b-4d8d-8ea5-bfdc7eb44c9a'::uuid, 'door', 'immigrant'),
    ('fab6ce0c-553b-4d8d-8ea5-bfdc7eb44c9a'::uuid, 'immigrant', 'emotional-wellness'),
    ('fab6ce0c-553b-4d8d-8ea5-bfdc7eb44c9a'::uuid, 'immigrant', 'english'),
    ('fab6ce0c-553b-4d8d-8ea5-bfdc7eb44c9a'::uuid, 'language', 'fa'),

    -- Bilingual Strength
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'door', 'immigrant'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'door', 'emotion'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'immigrant', 'emotional-wellness'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'immigrant', 'english'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'immigrant', 'identity'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'format', 'podcast'),
    ('ec533c1f-fbcb-4743-ba53-b4f450d74c75'::uuid, 'language', 'en'),

    -- Courageous Character
    ('083ed833-5d25-4605-af58-da38b685aa22'::uuid, 'door', 'selfcare'),
    ('083ed833-5d25-4605-af58-da38b685aa22'::uuid, 'selfcare-cluster', 'mind'),
    ('083ed833-5d25-4605-af58-da38b685aa22'::uuid, 'selfcare-category', 'self-kindness'),
    ('083ed833-5d25-4605-af58-da38b685aa22'::uuid, 'format', 'education'),

    -- Emotion-Based Meditate Sessions
    ('b80d87d3-5b8d-4c30-9e58-731c01483745'::uuid, 'format', 'meditation'),
    ('b80d87d3-5b8d-4c30-9e58-731c01483745'::uuid, 'door', 'selfcare'),
    ('b80d87d3-5b8d-4c30-9e58-731c01483745'::uuid, 'selfcare-cluster', 'mind'),

    -- Emotion-Based Sleep Stories
    ('8bd0c43b-0813-4e51-81c6-54879bf9082b'::uuid, 'format', 'sleep-story'),
    ('8bd0c43b-0813-4e51-81c6-54879bf9082b'::uuid, 'theme', 'sleep'),

    -- Empowered woman (Farsi) — affirmations
    ('db0f3b0a-6a7d-47bf-8d28-562308596b88'::uuid, 'door', 'selfcare'),
    ('db0f3b0a-6a7d-47bf-8d28-562308596b88'::uuid, 'selfcare-cluster', 'mind'),
    ('db0f3b0a-6a7d-47bf-8d28-562308596b88'::uuid, 'selfcare-category', 'self-kindness'),
    ('db0f3b0a-6a7d-47bf-8d28-562308596b88'::uuid, 'language', 'fa'),

    -- Financial Confidence (Farsi)
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'door', 'productivity'),
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'door', 'immigrant'),
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'productivity', 'planning'),
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'immigrant', 'finance'),
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'format', 'education'),
    ('32dc71db-61cc-40fe-a7d7-2e82a99f5944'::uuid, 'language', 'fa'),

    -- Goal Setting (Fa) Ali Lotfi
    ('5aec7927-b453-4139-825f-31c902c8de97'::uuid, 'door', 'productivity'),
    ('5aec7927-b453-4139-825f-31c902c8de97'::uuid, 'productivity', 'planning'),
    ('5aec7927-b453-4139-825f-31c902c8de97'::uuid, 'productivity', 'motivation'),
    ('5aec7927-b453-4139-825f-31c902c8de97'::uuid, 'format', 'education'),

    -- Heidi, Girl of the Alp
    ('1c25b1cd-6981-4656-8f57-e0672d30fb46'::uuid, 'format', 'sleep-story'),
    ('1c25b1cd-6981-4656-8f57-e0672d30fb46'::uuid, 'theme', 'sleep'),
    ('1c25b1cd-6981-4656-8f57-e0672d30fb46'::uuid, 'theme', 'dream'),

    -- Ladyboss: Your Inner-Strength Companion
    ('3e7bdfba-48d9-42e8-97da-d7846294bf6a'::uuid, 'door', 'selfcare'),
    ('3e7bdfba-48d9-42e8-97da-d7846294bf6a'::uuid, 'selfcare-cluster', 'mind'),
    ('3e7bdfba-48d9-42e8-97da-d7846294bf6a'::uuid, 'selfcare-category', 'self-kindness'),
    ('3e7bdfba-48d9-42e8-97da-d7846294bf6a'::uuid, 'format', 'meditation'),

    -- Living With Homesickness (EN)
    ('8a13bfcf-1f9f-431e-a2c3-013f988844ac'::uuid, 'immigrant', 'emotional-wellness'),
    ('8a13bfcf-1f9f-431e-a2c3-013f988844ac'::uuid, 'emotion', 'homesick'),
    ('8a13bfcf-1f9f-431e-a2c3-013f988844ac'::uuid, 'format', 'education'),
    ('8a13bfcf-1f9f-431e-a2c3-013f988844ac'::uuid, 'language', 'en'),

    -- Living With Homesickness (FA)
    ('b9a40303-c4b1-4a30-8480-b742d8e552d7'::uuid, 'immigrant', 'emotional-wellness'),
    ('b9a40303-c4b1-4a30-8480-b742d8e552d7'::uuid, 'emotion', 'homesick'),
    ('b9a40303-c4b1-4a30-8480-b742d8e552d7'::uuid, 'format', 'education'),

    -- Meditation Level 2 (EN)
    ('1bc54273-0490-4cc3-89be-bbeb931fa33e'::uuid, 'door', 'selfcare'),
    ('1bc54273-0490-4cc3-89be-bbeb931fa33e'::uuid, 'selfcare-cluster', 'mind'),
    ('1bc54273-0490-4cc3-89be-bbeb931fa33e'::uuid, 'selfcare-category', 'calm'),
    ('1bc54273-0490-4cc3-89be-bbeb931fa33e'::uuid, 'format', 'meditation'),
    ('1bc54273-0490-4cc3-89be-bbeb931fa33e'::uuid, 'language', 'en'),

    -- One before One Podcast
    ('ef8c782e-575b-40a6-bfc5-1040c7f71f4c'::uuid, 'door', 'productivity'),
    ('ef8c782e-575b-40a6-bfc5-1040c7f71f4c'::uuid, 'productivity', 'motivation'),
    ('ef8c782e-575b-40a6-bfc5-1040c7f71f4c'::uuid, 'format', 'podcast'),

    -- Poolsazi : 101
    ('798b2338-25e6-40ca-b0b4-5d39406f7640'::uuid, 'door', 'productivity'),
    ('798b2338-25e6-40ca-b0b4-5d39406f7640'::uuid, 'productivity', 'planning'),
    ('798b2338-25e6-40ca-b0b4-5d39406f7640'::uuid, 'format', 'education'),
    ('798b2338-25e6-40ca-b0b4-5d39406f7640'::uuid, 'language', 'fa'),

    -- Rain Soundscape
    ('1448017a-4ea7-40bc-89f9-da0a837352b6'::uuid, 'theme', 'relaxation'),
    ('1448017a-4ea7-40bc-89f9-da0a837352b6'::uuid, 'theme', 'sleep'),
    ('1448017a-4ea7-40bc-89f9-da0a837352b6'::uuid, 'theme', 'focus'),
    ('1448017a-4ea7-40bc-89f9-da0a837352b6'::uuid, 'theme', 'calm'),

    -- Ready to Empowered (EN)
    ('baa9b2c7-4b0e-4d3d-9808-af4555797d8f'::uuid, 'door', 'selfcare'),
    ('baa9b2c7-4b0e-4d3d-9808-af4555797d8f'::uuid, 'selfcare-cluster', 'mind'),
    ('baa9b2c7-4b0e-4d3d-9808-af4555797d8f'::uuid, 'selfcare-category', 'self-kindness'),
    ('baa9b2c7-4b0e-4d3d-9808-af4555797d8f'::uuid, 'format', 'education'),
    ('baa9b2c7-4b0e-4d3d-9808-af4555797d8f'::uuid, 'language', 'en'),

    -- Relaxation Soundscapes
    ('476d03d6-fcd8-49e1-817a-4e5709ba9f47'::uuid, 'theme', 'relaxation'),
    ('476d03d6-fcd8-49e1-817a-4e5709ba9f47'::uuid, 'theme', 'calm'),
    ('476d03d6-fcd8-49e1-817a-4e5709ba9f47'::uuid, 'theme', 'unwind'),

    -- Self Care Reset
    ('02a699a2-511b-4132-910a-8af9553053da'::uuid, 'format', 'education'),
    ('02a699a2-511b-4132-910a-8af9553053da'::uuid, 'language', 'en'),

    -- Self Care Reset (Persian)
    ('d7f669ab-4f5e-4d63-a227-468d365d9c31'::uuid, 'format', 'education'),
    ('d7f669ab-4f5e-4d63-a227-468d365d9c31'::uuid, 'language', 'fa'),

    -- Self-Care Meditations
    ('e97c1117-2947-447b-9817-e3530f18bfd8'::uuid, 'format', 'meditation'),
    ('e97c1117-2947-447b-9817-e3530f18bfd8'::uuid, 'selfcare-cluster', 'mind'),
    ('e97c1117-2947-447b-9817-e3530f18bfd8'::uuid, 'selfcare-category', 'self-kindness'),

    -- Somewhere Safe
    ('8b81b885-35fa-4c2c-b623-71471dea50c0'::uuid, 'format', 'sleep-story'),
    ('8b81b885-35fa-4c2c-b623-71471dea50c0'::uuid, 'theme', 'sleep'),

    -- Start Meditation (EN)
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'door', 'selfcare'),
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'selfcare-cluster', 'mind'),
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'selfcare-category', 'calm'),
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'format', 'meditation'),
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'productivity', 'morning-routine'),
    ('25f0d252-3058-4259-8d51-fc3a38c201a4'::uuid, 'language', 'en'),

    -- Start Meditation (Persian)
    ('71c694ab-0a1a-435d-a8de-3bc4deb1e0a4'::uuid, 'door', 'selfcare'),
    ('71c694ab-0a1a-435d-a8de-3bc4deb1e0a4'::uuid, 'selfcare-cluster', 'mind'),
    ('71c694ab-0a1a-435d-a8de-3bc4deb1e0a4'::uuid, 'selfcare-category', 'calm'),
    ('71c694ab-0a1a-435d-a8de-3bc4deb1e0a4'::uuid, 'format', 'meditation'),
    ('71c694ab-0a1a-435d-a8de-3bc4deb1e0a4'::uuid, 'language', 'fa'),

    -- Take Care of Your Body (EN)
    ('ba2c7023-a705-48e3-9310-541ae4367113'::uuid, 'selfcare-cluster', 'body'),
    ('ba2c7023-a705-48e3-9310-541ae4367113'::uuid, 'format', 'education'),
    ('ba2c7023-a705-48e3-9310-541ae4367113'::uuid, 'language', 'en'),

    -- Take Care of Your Environment (EN)
    ('f5341883-e47c-47e1-a690-fe51d3720109'::uuid, 'selfcare-cluster', 'environment'),
    ('f5341883-e47c-47e1-a690-fe51d3720109'::uuid, 'format', 'education'),
    ('f5341883-e47c-47e1-a690-fe51d3720109'::uuid, 'language', 'en'),

    -- Take Care of Your Mind (EN)
    ('b4c3d2c3-170f-46e7-859b-29dbcd2acc2d'::uuid, 'selfcare-cluster', 'mind'),
    ('b4c3d2c3-170f-46e7-859b-29dbcd2acc2d'::uuid, 'format', 'education'),
    ('b4c3d2c3-170f-46e7-859b-29dbcd2acc2d'::uuid, 'language', 'en'),

    -- Take Care of Your Mind (Farsi)
    ('8a1eaabf-f5c9-4522-a406-379d6f79c6d0'::uuid, 'selfcare-cluster', 'mind'),
    ('8a1eaabf-f5c9-4522-a406-379d6f79c6d0'::uuid, 'format', 'education'),
    ('8a1eaabf-f5c9-4522-a406-379d6f79c6d0'::uuid, 'language', 'fa'),

    -- Take Care of Your People (EN)
    ('a2c1e875-3b63-4ff5-a4ba-607bd3aa0ff5'::uuid, 'selfcare-cluster', 'people'),
    ('a2c1e875-3b63-4ff5-a4ba-607bd3aa0ff5'::uuid, 'selfcare-category', 'connection'),
    ('a2c1e875-3b63-4ff5-a4ba-607bd3aa0ff5'::uuid, 'format', 'education'),
    ('a2c1e875-3b63-4ff5-a4ba-607bd3aa0ff5'::uuid, 'language', 'en'),

    -- The Village by the Sea
    ('844c1326-b978-4bc4-8920-c46bac47a16e'::uuid, 'format', 'sleep-story'),
    ('844c1326-b978-4bc4-8920-c46bac47a16e'::uuid, 'theme', 'sleep'),
    ('844c1326-b978-4bc4-8920-c46bac47a16e'::uuid, 'theme', 'unwind'),

    -- Toraware Farsi (financial empowerment mini course)
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'door', 'productivity'),
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'door', 'immigrant'),
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'productivity', 'planning'),
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'immigrant', 'finance'),
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'format', 'education'),
    ('21b49020-63b9-46b1-ad9a-18a25d5a6240'::uuid, 'language', 'fa'),

    -- visualization soundscapes
    ('2f22471c-e2b7-4638-959e-5af15781e839'::uuid, 'theme', 'focus'),
    ('2f22471c-e2b7-4638-959e-5af15781e839'::uuid, 'theme', 'mastery'),
    ('2f22471c-e2b7-4638-959e-5af15781e839'::uuid, 'theme', 'alert')
)
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'playlist', p.content_id, l.id
FROM pairs p
JOIN lookup l ON l.dim = p.dim AND l.tag = p.tag
ON CONFLICT DO NOTHING;
