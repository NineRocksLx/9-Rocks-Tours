// check-imports.js - Coloca na raiz do frontend
const fs = require('fs');
const path = require('path');

function findFirebaseImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'build'].includes(file)) {
      findFirebaseImports(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Procura por imports problemáticos
      const incorrectImports = [
        "from '../firebase'",
        "from \"../firebase\"",
        "import '../firebase'",
        "import \"../firebase\"",
        "require('../firebase')",
        "require(\"../firebase\")"
      ];
      
      incorrectImports.forEach(pattern => {
        if (content.includes(pattern)) {
          console.log(`❌ PROBLEMA ENCONTRADO em ${filePath}:`);
          console.log(`   Import incorreto: ${pattern}`);
          console.log(`   Deve ser: '../config/firebase'`);
          console.log('');
        }
      });
      
      // Procura por imports corretos para verificação
      if (content.includes("from '../config/firebase'") || content.includes('from "../config/firebase"')) {
        console.log(`✅ Import correto em ${filePath}`);
      }
    }
  }
}

console.log('🔍 Verificando imports do Firebase...\n');
findFirebaseImports('./src');
console.log('\n✨ Verificação concluída!');