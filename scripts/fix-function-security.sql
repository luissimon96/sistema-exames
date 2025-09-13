-- 🔧 Fix Function Search Path Security Issues
-- Add SET search_path to functions to prevent path manipulation attacks

-- =============================================================================
-- Fix handle_new_user function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$ 
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    usage_month,
    usage_reset_date
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    EXTRACT(
      MONTH
      FROM NOW()
    ),
    (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
  );
  RETURN NEW;
END;
$function$;

-- =============================================================================
-- Fix increment_usage function  
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_usage(user_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$ 
BEGIN
  UPDATE public.profiles
  SET usage_count = usage_count + 1
  WHERE id = user_id_param;
END;
$function$;

-- =============================================================================
-- Additional Security: Create function to check search_path settings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_function_security()
 RETURNS TABLE(
   function_name text,
   has_fixed_search_path boolean,
   security_definer boolean,
   search_path_setting text
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    p.proname::text as function_name,
    (p.proconfig IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM unnest(p.proconfig) as config 
       WHERE config LIKE 'search_path=%'
     )) as has_fixed_search_path,
    p.prosecdef as security_definer,
    COALESCE(
      (SELECT config FROM unnest(p.proconfig) as config 
       WHERE config LIKE 'search_path=%' LIMIT 1),
      'not set'
    ) as search_path_setting
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('handle_new_user', 'increment_usage')
  ORDER BY p.proname;
$function$;