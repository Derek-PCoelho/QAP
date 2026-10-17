#!/bin/bash
# QAP — Emergency Dispatch — abre o jogo com o servidor local (saves, ranking e telemetria).
# Duplo clique no Finder. Se não houver Node.js, abre a versão offline (JOGAR.html).
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi
if ! command -v node >/dev/null 2>&1; then
  for p in /opt/homebrew/bin /usr/local/bin; do
    [ -x "$p/node" ] && export PATH="$p:$PATH"
  done
fi

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js não foi encontrado neste Mac."
  echo "Abrindo a versão offline do jogo (JOGAR.html): funciona inteira, só sem ranking compartilhado."
  echo "Para o modo com servidor, instale o Node.js 18+ (https://nodejs.org) e rode este arquivo de novo."
  (command -v xdg-open >/dev/null && xdg-open "JOGAR.html") || open "JOGAR.html"
  exit 0
fi

# o plantão já está aberto em outra janela? então só abre o navegador
URL="http://127.0.0.1:7270/"
if command -v curl >/dev/null 2>&1 && curl -fs --max-time 2 "$URL"api/health >/dev/null 2>&1; then
  echo "O servidor do QAP já está rodando. Abrindo o navegador..."
  (command -v xdg-open >/dev/null && xdg-open "$URL") || open "$URL"
  exit 0
fi

if [ ! -f dist/server/server.mjs ] || [ ! -f dist/client/index.html ]; then
  echo "Preparando o jogo pela primeira vez (pode levar um minuto)..."
  [ -d node_modules ] || npm install --no-audit --no-fund
  npm run build
fi

echo ""
echo "QAP — servidor local em http://127.0.0.1:7270"
echo "Feche esta janela (ou Ctrl+C) para desligar."
echo ""
node dist/server/server.mjs --open
