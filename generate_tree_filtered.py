import os
import fnmatch # Importe este módulo para correspondência de padrões (wildcards)

def gerar_arvore_projeto_com_exclusoes(caminho_raiz, ficheiro_saida):
    # --- AQUI É ONDE PODE FACILMENTE ADICIONAR AS SUAS EXCLUSÕES ---
    # Use nomes exatos de ficheiros, ou padrões com '*' para curingas.
    # Para diretórios, adicione '/' no final do nome.
    EXCLUIR_PADROES = [
        # Ficheiros de teste e versões antigas que mencionou
        'diagnostic.py',
        'server_test.py',
        'test_firestore.py',
        'SimpleTest.js',
        'AdminPanel_old.js',
        'AdminPanel_metade.js',
        'server.py.backup.original',
        'tours_fixed_original.py',
        'ninerocks.tours.json',
        'test_google_pay.html',
        'test_result.md',
        'abre_repositorio.py',
        'fecha_repositorio.py',
        'generate_tree_filtered.py', # Excluir o próprio script de geração
        'git_check_changes.ps1',
        'fix-frontend.ps1',
        'setup_debug.py',
        'migrateToursToFirestore.js',
        'repo_visibility_log.txt',
        'tree_filtrada.txt', # O ficheiro de saída anterior (se for o nome)
        'tree_filtrada_final.txt', # O ficheiro de saída atual
        'e --abort', # Este parece ser um resquício de comando
        'start_backend.py',
        'test_map_locations_firestore.py',
        'test_paypal.py',
        'test_permissions.py',
        'test_stripe_setup_fixed.py',
        'test_firestore.js',
        'start_frontend.py',
        'AdminTourManager_old.js',
        'PremiumPaymentComponent_old.jsx',
        'TestFirebase.js',
        'useEmbeddedPayment_original.js'
        # Pastas de ambiente e build (para garantir que são ignoradas globalmente)
        '.git/',
        '.firebase/',
        'node_modules/',
        'venv/',
        'build/', # Se a pasta 'build' não for a raiz do seu frontend
        '__pycache__/',
        '*.pyc', # Ficheiros de cache Python
        '*.log', # Ficheiros de log
        '*.tmp', # Ficheiros temporários
        '*.map', # Ficheiros de sourcemap
        '*.cache', # Ficheiros de cache
        '*.tsbuildinfo', # Ficheiros de build TypeScript

        # Padrões de ficheiros de teste e outros que não interessam
        '*.test.js',
        '*.test.jsx',
        '*.test.ts',
        '*.test.tsx',
        '*.spec.js',
        '*.spec.ts',
        '*.stories.js',
        '*.stories.jsx',
        '*.stories.ts',
        '*.stories.tsx',
        '*.snap', # Ficheiros de snapshot de testes
        '*.d.ts', # Ficheiros de declaração TypeScript (se não os quiser na árvore)
    ]

    def deve_excluir(caminho_absoluto, e_diretorio):
        nome_item = os.path.basename(caminho_absoluto)
        # Para diretórios, adicione um separador de caminho para a correspondência exata
        if e_diretorio:
            nome_item += os.sep

        for padrao in EXCLUIR_PADROES:
            # Se o padrão for um diretório (termina em / ou \), verifica se o caminho do diretório corresponde
            if padrao.endswith(os.sep) and fnmatch.fnmatch(caminho_absoluto + os.sep, os.path.join(caminho_raiz, padrao)):
                return True
            # Se o padrão não for um diretório ou for um curinga, verifica o nome do item
            elif fnmatch.fnmatch(nome_item, padrao):
                return True
        return False

    with open(ficheiro_saida, 'w', encoding='utf-8') as f:
        f.write(f"Tree de {caminho_raiz} (excluindo pastas e ficheiros indesejados)\n\n")

        for dirpath, dirnames, filenames in os.walk(caminho_raiz):
            # Filtrar diretórios primeiro, para que os.walk não entre neles
            dirnames_para_manter = []
            for dname in dirnames:
                caminho_completo_dir = os.path.join(dirpath, dname)
                if not deve_excluir(caminho_completo_dir, e_diretorio=True):
                    dirnames_para_manter.append(dname)
            dirnames[:] = dirnames_para_manter # Modifica a lista in-place para os.walk

            # Filtrar ficheiros
            filenames_para_manter = []
            for fname in filenames:
                caminho_completo_file = os.path.join(dirpath, fname)
                if not deve_excluir(caminho_completo_file, e_diretorio=False):
                    filenames_para_manter.append(fname)

            # Calcular o nível para indentação
            # Apenas mostra o conteúdo dentro de 'backend' e 'frontend'
            caminho_relativo = os.path.relpath(dirpath, caminho_raiz)
            
            # Se não estiver em backend ou frontend, e não for a raiz, salta
            if caminho_relativo != '.' and \
               not caminho_relativo.startswith('backend') and \
               not caminho_relativo.startswith('frontend'):
                continue

            # Se for a raiz, e a raiz for excluída, salta
            if caminho_relativo == '.' and deve_excluir(caminho_raiz, e_diretorio=True):
                 continue

            level = caminho_relativo.count(os.sep) if caminho_relativo != '.' else 0
            indent = '    ' * level

            # Escrever o diretório atual
            if caminho_relativo == '.':
                f.write(f"{os.path.basename(caminho_raiz)}/\n")
            else:
                f.write(f"{indent}{os.path.basename(dirpath)}{os.sep}\n")

            # Escrever os ficheiros filtrados
            for fname in filenames_para_manter:
                f.write(f"{indent}    {fname}\n")

# --- Exemplo de como usar (adapte ao seu script) ---
if __name__ == '__main__':
    project_root_dir = r'C:\Users\paulo\Desktop\9-Rocks-Tours-Git' # O seu diretório raiz
    output_file_name = 'tree backend & frontend.txt'

    # Chame a função com as suas exclusões personalizadas
    gerar_arvore_projeto_com_exclusoes(project_root_dir, output_file_name)
    print(f"Structure backend & frontend {output_file_name}")