import json
import os

def calculate_purchase_price(ppv):
    """
    Calcule le prix d'achat grossiste/pharmacien (PPA/PGHT) 
    à partir du PPV (Prix Public de Vente) selon la réglementation marocaine.
    TVA sur les médicaments au Maroc : 7% (diviseur 1.07 pour le hors taxe).
    Les marges du pharmacien par tranche :
    - Tranche 1 (PPV <= 300 DH) : 34% de marge pharmacie.
    - Tranche 2 (300 DH < PPV <= 1000 DH) : 33% de marge pharmacie.
    - Tranche 3 (1000 DH < PPV <= 3000 DH) : 15.6% de marge pharmacie.
    - Tranche 4 (PPV > 3000 DH) : Marge forfaitaire plafonnée (approx. 92.5% du PPV).
    """
    tva_divisor = 1.07
    if ppv <= 300:
        # Prix d'achat HT ≈ PPV / 1.07 * (1 - 0.34)
        ppa = (ppv / tva_divisor) * 0.66
    elif ppv <= 1000:
        # Prix d'achat HT ≈ PPV / 1.07 * (1 - 0.33)
        ppa = (ppv / tva_divisor) * 0.67
    elif ppv <= 3000:
        # Prix d'achat HT ≈ PPV / 1.07 * (1 - 0.156)
        ppa = (ppv / tva_divisor) * 0.844
    else:
        # Prix d'achat HT ≈ PPV / 1.07 * (1 - 0.02) ou plafonnement
        ppa = (ppv / tva_divisor) * 0.95
        
    return round(ppa, 2)

def main():
    json_path = 'js/real_medications.json'
    
    if not os.path.exists(json_path):
        print(f"Erreur : Le fichier {json_path} n'existe pas.")
        return
        
    print(f"Lecture de {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        medications = json.load(f)
        
    print(f"Calcul des prix d'achat pour {len(medications)} médicaments...")
    for med in medications:
        ppv = float(med.get('price', 0))
        med['purchasePrice'] = calculate_purchase_price(ppv)
        
    print(f"Écriture des données enrichies dans {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(medications, f, indent=2, ensure_ascii=False)
        
    print("Base de données mise à jour avec succès !")

if __name__ == '__main__':
    main()
