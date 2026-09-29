CREATE OR REPLACE FUNCTION public.current_band()
 RETURNS age_band LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select age_band from public.profiles
  where user_id = auth.uid() and verification_status = 'verified' and banned_at is null
$function$;