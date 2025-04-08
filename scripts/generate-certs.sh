#!/bin/bash

# Script para gerar certificados SSL para desenvolvimento local
# Requer mkcert (https://github.com/FiloSottile/mkcert)

# Verificar se mkcert está instalado
if ! command -v mkcert &> /dev/null; then
    echo "mkcert não está instalado. Por favor, instale-o primeiro."
    echo "Instruções: https://github.com/FiloSottile/mkcert#installation"
    exit 1
fi

# Criar diretório para certificados
mkdir -p certs

# Gerar certificados
echo "Gerando certificados SSL para desenvolvimento local..."
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo "Certificados gerados com sucesso em ./certs/"
echo "Agora você pode iniciar o servidor com HTTPS usando 'npm run dev'"
