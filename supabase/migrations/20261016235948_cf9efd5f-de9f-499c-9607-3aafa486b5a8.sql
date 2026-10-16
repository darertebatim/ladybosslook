ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_payment_notes text, ADD COLUMN IF NOT EXISTS payment_reference text, ADD COLUMN IF NOT EXISTS recorded_by uuid;

CREATE OR REPLACE FUNCTION public.record_manual_payment(p_payment_id uuid, p_email text, p_name text, p_program_slug text, p_product_name text, p_amount integer, p_currency text, p_method text, p_paid_at timestamptz, p_notes text DEFAULT NULL, p_reference text DEFAULT NULL, p_enroll boolean DEFAULT true, p_round_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 v_user_id uuid; v_profile public.profiles%ROWTYPE; v_program public.program_catalog%ROWTYPE; v_round uuid; v_existing uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can record manual payments' USING ERRCODE='42501'; END IF;
 IF p_payment_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Enter a positive payment amount'; END IF;
 IF p_currency IS NULL OR lower(p_currency) NOT IN ('usd','cad','eur','gbp') THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
 IF p_method IS NULL OR p_method NOT IN ('zelle','interac','wire_transfer','cash','paypal','other') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
 IF p_paid_at IS NULL OR p_paid_at > now() + interval '1 day' THEN RAISE EXCEPTION 'Enter a valid payment date'; END IF;
 IF length(coalesce(p_notes,'')) > 2000 OR length(coalesce(p_reference,'')) > 200 THEN RAISE EXCEPTION 'Notes or reference is too long'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_payment_id::text, 0));
 SELECT id INTO v_existing FROM public.orders WHERE id=p_payment_id;
 IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
 SELECT primary_user_id INTO v_user_id FROM public.account_email_aliases WHERE lower(email)=lower(trim(p_email)) LIMIT 1;
 IF v_user_id IS NULL THEN SELECT id INTO v_user_id FROM public.profiles WHERE lower(email)=lower(trim(p_email)) LIMIT 1; END IF;
 IF v_user_id IS NULL THEN RAISE EXCEPTION 'Customer account not found. Create the user first in User Management.'; END IF;
 v_user_id := coalesce(public.family_primary_of(v_user_id), v_user_id);
 SELECT * INTO v_profile FROM public.profiles WHERE id=v_user_id;
 IF p_program_slug IS NOT NULL THEN
   SELECT * INTO v_program FROM public.program_catalog WHERE slug=p_program_slug;
   IF NOT FOUND THEN RAISE EXCEPTION 'Program not found'; END IF;
 ELSIF p_enroll THEN RAISE EXCEPTION 'Select a program to enroll the student';
 END IF;
 IF coalesce(nullif(trim(v_program.title),''),nullif(trim(p_product_name),'')) IS NULL THEN RAISE EXCEPTION 'Enter a product name'; END IF;
 IF p_enroll THEN
   PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_program_slug, 0));
   IF p_round_id IS NOT NULL THEN
     SELECT id INTO v_round FROM public.program_rounds WHERE id=p_round_id AND program_slug=p_program_slug AND status IN ('active','upcoming') AND (owner_user_id IS NULL OR owner_user_id=v_user_id);
     IF v_round IS NULL THEN RAISE EXCEPTION 'This round is not available for this student and program'; END IF;
   ELSIF v_program.is_one_on_one IS NOT TRUE THEN
     SELECT r.id INTO v_round FROM public.program_auto_enrollment a JOIN public.program_rounds r ON r.id=a.round_id WHERE a.program_slug=p_program_slug AND r.program_slug=p_program_slug AND r.status IN ('active','upcoming') AND r.owner_user_id IS NULL LIMIT 1;
   END IF;
   SELECT id INTO v_existing FROM public.course_enrollments WHERE user_id=v_user_id AND program_slug=p_program_slug ORDER BY enrolled_at DESC LIMIT 1;
   IF v_existing IS NULL THEN
     INSERT INTO public.course_enrollments(user_id,course_name,program_slug,status,round_id,sessions_purchased) VALUES(v_user_id,v_program.title,p_program_slug,'active',v_round,v_program.default_session_count);
   ELSE
     UPDATE public.course_enrollments SET status='active',round_id=coalesce(round_id,v_round),sessions_purchased=coalesce(sessions_purchased,v_program.default_session_count) WHERE id=v_existing;
   END IF;
 END IF;
 INSERT INTO public.orders(id,user_id,email,name,amount,currency,status,product_name,program_slug,payment_type,stripe_session_id,created_at,usd_amount,usd_exchange_rate,manual_payment_notes,payment_reference,recorded_by)
 VALUES(p_payment_id,v_user_id,lower(trim(p_email)),coalesce(nullif(trim(p_name),''),v_profile.full_name,''),p_amount,lower(p_currency),'paid',coalesce(v_program.title,trim(p_product_name)),p_program_slug,p_method,'manual_' || p_method || '_' || p_payment_id::text,p_paid_at,CASE WHEN lower(p_currency)='usd' THEN p_amount ELSE NULL END,CASE WHEN lower(p_currency)='usd' THEN 1 ELSE NULL END,nullif(trim(p_notes),''),nullif(trim(p_reference),''),auth.uid());
 RETURN p_payment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_manual_payment(uuid,text,text,text,text,integer,text,text,timestamptz,text,text,boolean,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_manual_payment(uuid,text,text,text,text,integer,text,text,timestamptz,text,text,boolean,uuid) TO authenticated;
