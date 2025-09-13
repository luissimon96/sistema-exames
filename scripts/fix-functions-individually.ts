#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFunctions() {
  try {
    console.log('🔧 Corrigindo funções individualmente...\n');

    // Fix handle_new_user function
    console.log('1. Corrigindo handle_new_user...');
    await prisma.$executeRawUnsafe(`
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
      $function$
    `);
    console.log('   ✅ handle_new_user corrigida');

    // Fix increment_usage function
    console.log('2. Corrigindo increment_usage...');
    await prisma.$executeRawUnsafe(`
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
      $function$
    `);
    console.log('   ✅ increment_usage corrigida');

    // Verify the fixes
    console.log('\n🔍 Verificando configurações de search_path...');
    const result = await prisma.$queryRaw`
      SELECT 
        p.proname as function_name,
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
      ORDER BY p.proname
    ` as Array<{
      function_name: string;
      has_fixed_search_path: boolean;
      security_definer: boolean;
      search_path_setting: string;
    }>;

    console.log('\n📊 Status de Segurança das Funções:');
    result.forEach(func => {
      const status = func.has_fixed_search_path ? '✅ SEGURO' : '❌ VULNERÁVEL';
      console.log(`   ${func.function_name.padEnd(20)} | Search Path: ${func.search_path_setting.padEnd(20)} | ${status}`);
    });

    const secureCount = result.filter(f => f.has_fixed_search_path).length;
    console.log(`\n🎯 Resumo: ${secureCount}/${result.length} funções estão seguras`);

    if (secureCount === result.length) {
      console.log('\n🎉 Todas as funções foram corrigidas com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir funções:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFunctions();