DO $$
DECLARE r3 uuid := '0dc55cb3-2c32-42b5-957f-c4c76e9a688a'; u uuid; em text;
BEGIN
  FOREACH em IN ARRAY ARRAY['roshanabeautystudio@yahoo.com','mahsa_3905@yahoo.com','roya.mo.nejad@gmail.com','counselling.adibrad@gmail.com','mahshid.nazari@yahoo.com'] LOOP
    SELECT id INTO u FROM profiles WHERE lower(email)=em LIMIT 1;
    IF u IS NULL THEN SELECT primary_user_id INTO u FROM account_email_aliases WHERE email=em LIMIT 1; END IF;
    CONTINUE WHEN u IS NULL;
    IF EXISTS (SELECT 1 FROM course_enrollments WHERE user_id=u AND program_slug='casigads') THEN
      UPDATE course_enrollments SET round_id=r3 WHERE user_id=u AND program_slug='casigads';
      DELETE FROM course_enrollments WHERE user_id=u AND program_slug='smartig';
    ELSE
      UPDATE course_enrollments SET program_slug='casigads', course_name=COALESCE((SELECT title FROM program_catalog WHERE slug='casigads'), course_name), round_id=r3 WHERE user_id=u AND program_slug='smartig';
    END IF;
    UPDATE audience_presets SET include_user_ids = (SELECT array_agg(DISTINCT x) FROM unnest(coalesce(include_user_ids,'{}') || u) x) WHERE id='5d71797f-300b-4f34-a455-1f059ab5f6f8';
    u := NULL;
  END LOOP;
  FOREACH em IN ARRAY ARRAY['kami_3030@yahoo.com','azitamokarimi@gmail.com'] LOOP
    SELECT id INTO u FROM profiles WHERE lower(email)=em LIMIT 1;
    CONTINUE WHEN u IS NULL;
    UPDATE course_enrollments SET round_id=r3 WHERE user_id=u AND program_slug='casigads';
    UPDATE audience_presets SET include_user_ids = (SELECT array_agg(DISTINCT x) FROM unnest(coalesce(include_user_ids,'{}') || u) x) WHERE id='5d71797f-300b-4f34-a455-1f059ab5f6f8';
    u := NULL;
  END LOOP;
END $$;