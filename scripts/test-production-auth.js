#!/usr/bin/env node

// 🧪 Script para Testar Autenticação em Produção
// Execute: node scripts/test-production-auth.js

const https = require('https');
const http = require('http');

// Configuração
const PRODUCTION_URL = 'https://sistema-exames.vercel.app'; // ⚠️ ALTERE PARA SUA URL
const TEST_TIMEOUT = 10000; // 10 segundos

console.log('🧪 Testando Autenticação em Produção');
console.log('====================================');
console.log(`🌐 URL: ${PRODUCTION_URL}`);
console.log('');

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Testes
async function runTests() {
  const tests = [
    {
      name: 'Página principal',
      test: async () => {
        const response = await makeRequest(PRODUCTION_URL);
        return {
          success: response.statusCode === 200,
          details: `Status: ${response.statusCode}`
        };
      }
    },
    
    {
      name: 'Página de login',
      test: async () => {
        const response = await makeRequest(`${PRODUCTION_URL}/login`);
        return {
          success: response.statusCode === 200,
          details: `Status: ${response.statusCode}`
        };
      }
    },
    
    {
      name: 'API NextAuth settings',
      test: async () => {
        const response = await makeRequest(`${PRODUCTION_URL}/api/auth/providers`);
        const success = response.statusCode === 200;
        let details = `Status: ${response.statusCode}`;
        
        if (success) {
          try {
            const providers = JSON.parse(response.body);
            const providerNames = Object.keys(providers);
            details += ` | Providers: ${providerNames.join(', ')}`;
          } catch (e) {
            details += ' | Erro ao parsear providers';
          }
        }
        
        return { success, details };
      }
    },
    
    {
      name: 'CSRF token',
      test: async () => {
        const response = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
        const success = response.statusCode === 200;
        let details = `Status: ${response.statusCode}`;
        
        if (success) {
          try {
            const csrf = JSON.parse(response.body);
            details += csrf.csrfToken ? ' | CSRF token presente' : ' | CSRF token ausente';
          } catch (e) {
            details += ' | Erro ao parsear CSRF';
          }
        }
        
        return { success, details };
      }
    },
    
    {
      name: 'Session endpoint',
      test: async () => {
        const response = await makeRequest(`${PRODUCTION_URL}/api/auth/session`);
        const success = response.statusCode === 200;
        let details = `Status: ${response.statusCode}`;
        
        if (success) {
          try {
            const session = JSON.parse(response.body);
            details += session.user ? ' | Usuário logado' : ' | Sessão vazia (normal)';
          } catch (e) {
            details += ' | Erro ao parsear sessão';
          }
        }
        
        return { success, details };
      }
    }
  ];

  console.log('🔍 Executando testes...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`   ${test.name.padEnd(25)} ... `);
    
    try {
      const result = await test.test();
      if (result.success) {
        console.log(`✅ PASS | ${result.details}`);
        passed++;
      } else {
        console.log(`❌ FAIL | ${result.details}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR | ${error.message}`);
      failed++;
    }
  }

  console.log('');
  console.log('📊 Resumo dos Testes:');
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📋 Total: ${passed + failed}`);
  
  const percentage = Math.round((passed / (passed + failed)) * 100);
  console.log(`   🎯 Taxa de sucesso: ${percentage}%`);

  console.log('');
  
  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
    console.log('   A autenticação parece estar funcionando corretamente.');
  } else if (passed > failed) {
    console.log('⚠️  Alguns testes falharam, mas a aplicação está funcionando parcialmente.');
    console.log('   Verifique os logs do Vercel para mais detalhes.');
  } else {
    console.log('❌ Muitos testes falharam!');
    console.log('   Verifique a configuração e as variáveis de ambiente.');
  }

  console.log('');
  console.log('🔧 Para debug adicional:');
  console.log(`   vercel logs ${PRODUCTION_URL.replace('https://', '').replace('http://', '')}`);
  console.log('   vercel env ls');
}

// Verificar se a URL foi configurada
if (PRODUCTION_URL.includes('sistema-exames.vercel.app')) {
  console.log('⚠️  ATENÇÃO: Atualize a variável PRODUCTION_URL no script com sua URL real!');
  console.log('');
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});