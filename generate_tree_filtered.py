import os

# Pastas a ignorar
EXCLUDE_DIRS = {"venv", "__pycache__", "node_modules", ".git", ".mypy_cache", ".pytest_cache", "build", "dist", ".idea", ".vscode"}

# Nome do ficheiro de saída
OUTPUT_FILE = "tree_filtrada.txt"

def write_tree(base_path, file_writer, indent=""):
    try:
        entries = sorted(os.listdir(base_path))
    except (PermissionError, FileNotFoundError):
        return

    for entry in entries:
        full_path = os.path.join(base_path, entry)
        if os.path.isdir(full_path):
            if entry in EXCLUDE_DIRS:
                continue
            file_writer.write(f"{indent}{entry}/\n")
            write_tree(full_path, file_writer, indent + "    ")
        else:
            file_writer.write(f"{indent}{entry}\n")

def main():
    base_path = os.getcwd()  # Diretório atual onde correr o script
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(f"Tree de {base_path} (excluindo pastas comuns de ambiente)\n\n")
        write_tree(base_path, f)
    print(f"✅ Tree gerada com sucesso em '{OUTPUT_FILE}'")

if __name__ == "__main__":
    main()
