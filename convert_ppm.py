import os
import sys
import urllib.request
import json
import random

# Official CNOPS drug database URL
URL = "https://data.gov.ma/data/fr/dataset/2cdfd9f4-289d-4e9a-8998-50bd03f8e874/resource/094733f5-5434-4163-b837-df0e7b665127/download/ref-des-medicaments-cnops-2014.xlsx"
FILE_NAME = "cnops_medicaments.xlsx"
JSON_OUTPUT = "js/real_medications.json"

def download_file():
    print("Téléchargement du référentiel officiel CNOPS...")
    urllib.request.urlretrieve(URL, FILE_NAME)
    print("Téléchargement terminé.")

def categorize(name, dci):
    name_l = name.lower()
    dci_l = dci.lower() if isinstance(dci, str) else ""

    # Simple keyword mapping for categories
    if "paracétamol" in dci_l or "paracetamol" in dci_l or "codéine" in dci_l or "ibuprofène" in dci_l or "aspirine" in dci_l or "analg" in dci_l:
        return "Analgésique"
    elif "amoxicilline" in dci_l or "clavulan" in dci_l or "antibio" in dci_l or "céf" in dci_l or "mycine" in dci_l:
        return "Antibiotique"
    elif "losartan" in dci_l or "amlodipine" in dci_l or "cardio" in dci_l or "atorvastatine" in dci_l or "tens" in dci_l:
        return "Cardiologie"
    elif "metformine" in dci_l or "diab" in dci_l or "glicl" in dci_l:
        return "Diabète"
    elif "phloroglucinol" in dci_l or "gastro" in dci_l or "smecta" in name_l or "gaviscon" in name_l or "omeprazole" in dci_l:
        return "Gastro-entérologie"
    elif "desloratadine" in dci_l or "loratadine" in dci_l or "cetirizine" in dci_l or "allerg" in dci_l:
        return "Anti-allergique"
    elif "salbutamol" in dci_l or "ventoline" in name_l or "respi" in dci_l:
        return "Voies respiratoires"
    elif "vitamine" in name_l or "vitamine" in dci_l or "calcium" in dci_l or "magnésium" in dci_l:
        return "Vitamines & Suppléments"
    elif "derme" in dci_l or "crème" in name_l or "creme" in name_l or "pommade" in name_l:
        return "Dermatologie"
    else:
        # Fallback categories
        fallbacks = ["Analgésique", "Cardiologie", "Antibiotique", "Gastro-entérologie", "Anti-inflammatoire"]
        return random.choice(fallbacks)

def parse_and_convert():
    import pandas as pd
    
    print("Lecture et conversion du fichier Excel...")
    # Load XLSX
    df = pd.read_excel(FILE_NAME)
    
    # Clean column names (strip spaces and lowercase)
    df.columns = [str(c).strip() for c in df.columns]
    print("Colonnes détectées :", df.columns.tolist())
    
    # Try to map columns based on typical CNOPS format
    # Columns usually: 'CODE_CIP', 'NOM_COMMERCIAL', 'DCI', 'PPM' / 'PPV', 'TYPE'
    cip_col = next((c for c in df.columns if 'CIP' in c or 'CODE' in c), None)
    name_col = next((c for c in df.columns if 'NOM' in c or 'COMMERCIAL' in c or 'DESIGNATION' in c), None)
    dci_col = next((c for c in df.columns if 'DCI' in c or 'MOLECULE' in c or 'SUBSTANCE' in c), None)
    price_col = next((c for c in df.columns if 'PPV' in c or 'PPM' in c or 'PRIX' in c), None)
    
    if not (cip_col and name_col and price_col):
        print("Erreur: Colonnes requises non trouvées dans l'Excel.")
        print(f"Trouvé: CIP={cip_col}, Nom={name_col}, Prix={price_col}")
        sys.exit(1)
        
    print(f"Mappage des colonnes : Code={cip_col}, Nom={name_col}, DCI={dci_col}, Prix={price_col}")
    
    medications = []
    id_counter = 1
    
    for _, row in df.iterrows():
        name = str(row[name_col]).strip()
        code = str(row[cip_col]).strip()
        
        # Parse Price
        try:
            price = float(str(row[price_col]).replace(',', '.').strip())
        except Exception:
            continue # Skip row if price cannot be parsed
            
        dci = str(row[dci_col]).strip() if dci_col and not pd.isna(row[dci_col]) else "Non spécifié"
        category = categorize(name, dci)
        
        # Generate mock details for inventory simulation
        stock = random.randint(10, 180)
        min_stock = random.randint(5, 25)
        
        # Random expiry date between 2026-08-01 and 2029-12-31
        expiry_year = 2026 + random.randint(0, 3)
        expiry_month = str(random.randint(1, 12)).zfill(2)
        expiry_day = str(random.randint(1, 28)).zfill(2)
        
        batch = f"BT-{category[:2].upper()}-{random.randint(1000, 9900)}"
        
        # Clean Code to remove float conversion (.0)
        if code.endswith('.0'):
            code = code[:-2]
            
        medications.append({
          "id": str(id_counter),
          "name": name,
          "molecule": dci,
          "category": category,
          "stock": stock,
          "minStock": min_stock,
          "price": price,
          "expiry": f"{expiry_year}-{expiry_month}-{expiry_day}",
          "batch": batch,
          "code": code
        })
        
        id_counter += 1
        
    # Write to JSON
    os.makedirs(os.path.dirname(JSON_OUTPUT), exist_ok=True)
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(medications, f, ensure_ascii=False, indent=2)
        
    print(f"Conversion terminée ! {len(medications)} médicaments réels écrits dans {JSON_OUTPUT}.")

if __name__ == "__main__":
    download_file()
    parse_and_convert()
