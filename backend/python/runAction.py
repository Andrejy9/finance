import sys
import json
import importlib

def main(library, function_name, *args):
    try:
        # Importa dinamicamente il modulo richiesto
        module = importlib.import_module(library)

        # Ottieni il riferimento alla funzione da chiamare
        function_to_call = getattr(module, function_name)

        # Esegui la funzione con gli argomenti dinamici
        result = function_to_call(*args)

        # Stampa il risultato in formato JSON
        print(json.dumps(result))

        # Imposta l'exit code in base al risultato
        sys.exit(0 if result.get("success", False) else 1)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Errore critico: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Uso: python run_action.py <libreria> <funzione> [arg1 arg2 ...]"
        }))
        sys.exit(1)

    # Chiama main con libreria, funzione, e argomenti variabili
    main(sys.argv[1], sys.argv[2], *sys.argv[3:])