// Store centralisé pour l'ERP Pharmaceutique - PharmaStore
const STORAGE_KEY = 'PHARMA_ERP_STATE';

function generateMedicationsDatabase() {
  const categories = [
    { name: 'Analgésique', molecules: ['Paracétamol', 'Codéine', 'Tramadol', 'Morphine'], drugs: ['Doliprane', 'Dafalgan', 'Efferalgan', 'Codoliprane', 'Tramal', 'Aspegic', 'Ixprim'] },
    { name: 'Antibiotique', molecules: ['Amoxicilline', 'Acide clavulanique', 'Ciprofloxacine', 'Azithromycine', 'Céfixime'], drugs: ['Clamoxyl', 'Augmentin', 'Ciflox', 'Zeclar', 'Oroken', 'Pyostacine'] },
    { name: 'Cardiologie', molecules: ['Atorvastatine', 'Amlodipine', 'Losartan', 'Ramipril', 'Bisoprolol'], drugs: ['Tahor', 'Amlor', 'Cozaar', 'Triatec', 'Cardensiel', 'Kardegic', 'Loxen'] },
    { name: 'Diabète', molecules: ['Metformine', 'Gliclazide', 'Glimépiride', 'Sitagliptine'], drugs: ['Glucophage', 'Diamicron', 'Amarel', 'Januvia', 'Stagid', 'Galvus'] },
    { name: 'Gastro-entérologie', molecules: ['Alginate de sodium', 'Ésoméprazole', 'Phloroglucinol', 'Lopéramide', 'Diosmectite'], drugs: ['Gaviscon', 'Inexium', 'Spasfon', 'Imodium', 'Smecta', 'Météospasmyl', 'Vogalène'] },
    { name: 'Anti-inflammatoire', molecules: ['Ibuprofène', 'Diclofénac', 'Naproxène', 'Kétoprofène'], drugs: ['Nurofen', 'Voltarène', 'Apranax', 'Profenid', 'Advil', 'Celebrex'] },
    { name: 'Anti-allergique', molecules: ['Desloratadine', 'Loratadine', 'Cétirizine'], drugs: ['Aerius', 'Clarityne', 'Zyrtec', 'Kestin', 'Wirlin'] },
    { name: 'Voies respiratoires', molecules: ['Salbutamol', 'Carbocistéine', 'Fluticasone'], drugs: ['Ventoline', 'Rhinathiol', 'Flixonase', 'Pulmicort', 'Atrovent'] },
    { name: 'Parapharmacie', molecules: ['Eau Thermale', 'Filtres UV', 'Phyto-extraits'], drugs: ['Avène Crème', 'Bioderma Photoderm', 'Klorane Shampoing', 'La Roche-Posay Anthelios', 'Nuxe Huile'] },
    { name: 'Vitamines & Suppléments', molecules: ['Acide ascorbique', 'Magnésium', 'Vitamine D', 'Zinc'], drugs: ['Cebion Vitamine', 'Mag2 Magnésium', 'Uvedose', 'Zincotil', 'Supradyn'] },
    { name: 'Dermatologie', molecules: ['Trolamine', 'Bétaméthasone', 'Acide fusidique'], drugs: ['Biafine', 'Diproson', 'Fucidine', 'Diprosalic', 'Ketoderm'] }
  ];

  const formats = ['100mg', '250mg', '500mg', '1g', 'Comprimés', 'Sirop', 'Suspension', 'Gélules', 'Pommade', 'Sachets'];
  const list = [];
  let idCounter = 1;

  categories.forEach(cat => {
    cat.drugs.forEach(drug => {
      cat.molecules.forEach(mol => {
        formats.forEach(form => {
          if (Math.random() > 0.15) { // Keep 85% of combinations
            const price = parseFloat((15 + Math.random() * 280).toFixed(2));
            const stock = Math.floor(Math.random() * 160);
            const minStock = Math.floor(5 + Math.random() * 25);
            const batchNum = `BT-${cat.name.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const cipCode = `340093${String(idCounter).padStart(6, '0')}`;
            
            const expiryYear = 2026 + Math.floor(Math.random() * 4);
            const expiryMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
            const expiryDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');

            list.push({
              id: String(idCounter++),
              name: `${drug} ${form}`,
              molecule: mol,
              category: cat.name,
              stock: stock,
              minStock: minStock,
              price: price,
              expiry: `${expiryYear}-${expiryMonth}-${expiryDay}`,
              batch: batchNum,
              code: cipCode
            });
          }
        });
      });
    });
  });

  return list;
}

const INITIAL_STATE = {
  medications: generateMedicationsDatabase(),
  patients: [
    { id: '1', name: 'Jean Dupont', phone: '0612345678', email: 'jean.dupont@email.com', chronicDisease: 'Hypertension', mutuelle: 'MGEN (70%)' },
    { id: '2', name: 'Marie Martin', phone: '0687654321', email: 'marie.martin@email.com', chronicDisease: 'Diabète Type 2', mutuelle: 'CNSS (80%)' },
    { id: '3', name: 'Youssef Alami', phone: '0711223344', email: 'youssef.alami@email.com', chronicDisease: 'Aucune', mutuelle: 'CNOPS (90%)' }
  ],
  suppliers: [
    { id: '1', name: 'Cooper Maroc', contact: 'Rachid Benslimane', email: 'contact@cooper.ma', phone: '0522404040' },
    { id: '2', name: 'Promopharma', contact: 'Salma Naciri', email: 'orders@promopharma.ma', phone: '0522353535' },
    { id: '3', name: 'Sothema', contact: 'Karim Filali', email: 'sales@sothema.ma', phone: '0522505050' }
  ],
  sales: [
    { id: 'S001', date: '2026-06-05T10:14:00Z', items: [{ medicationId: '1', quantity: 2, price: 13.50 }, { medicationId: '3', quantity: 1, price: 32.20 }], total: 59.20, mutuelleRate: 0.70, paidByPatient: 17.76, paidByMutuelle: 41.44, patientId: '1' },
    { id: 'S002', date: '2026-06-06T14:32:00Z', items: [{ medicationId: '7', quantity: 3, price: 19.90 }], total: 59.70, mutuelleRate: 0, paidByPatient: 59.70, paidByMutuelle: 0, patientId: null },
    { id: 'S003', date: '2026-06-07T09:45:00Z', items: [{ medicationId: '5', quantity: 1, price: 55.10 }, { medicationId: '1', quantity: 1, price: 13.50 }], total: 68.60, mutuelleRate: 0.90, paidByPatient: 6.86, paidByMutuelle: 61.74, patientId: '3' },
    { id: 'S004', date: '2026-06-08T11:20:00Z', items: [{ medicationId: '8', quantity: 1, price: 118.50 }], total: 118.50, mutuelleRate: 0.80, paidByPatient: 23.70, paidByMutuelle: 94.80, patientId: '2' },
    { id: 'S005', date: '2026-06-09T16:15:00Z', items: [{ medicationId: '1', quantity: 5, price: 13.50 }], total: 67.50, mutuelleRate: 0, paidByPatient: 67.50, paidByMutuelle: 0, patientId: null },
    { id: 'S006', date: '2026-06-10T17:40:00Z', items: [{ medicationId: '3', quantity: 2, price: 32.20 }, { medicationId: '6', quantity: 1, price: 28.40 }], total: 92.80, mutuelleRate: 0.70, paidByPatient: 27.84, paidByMutuelle: 64.96, patientId: '1' },
    { id: 'S007', date: '2026-06-11T09:15:00Z', items: [{ medicationId: '1', quantity: 2, price: 13.50 }], total: 27.00, mutuelleRate: 0, paidByPatient: 27.00, paidByMutuelle: 0, patientId: null },
    { id: 'S008', date: '2026-06-11T11:45:00Z', items: [{ medicationId: '7', quantity: 2, price: 19.90 }, { medicationId: '5', quantity: 2, price: 55.10 }], total: 150.00, mutuelleRate: 0.90, paidByPatient: 15.00, paidByMutuelle: 135.00, patientId: '3' }
  ],
  settings: {
    pharmacyName: 'Grande Pharmacie de la Gare',
    address: 'Place de la Gare, Casablanca, Maroc',
    taxRate: 0.07,
    theme: 'dark'
  },
  reservations: [
    { id: 'R001', date: '2026-06-11T12:00:00Z', patientName: 'Nabil Elmiri', patientPhone: '0677889900', items: [{ medicationId: '1', quantity: 2, price: 13.50 }], total: 27.00, status: 'pending', prescriptionUploaded: true }
  ],
  webshop: {
    siteTitle: 'Ma Pharmacie Connectée',
    siteAccent: '#10b981',
    isOnline: true,
    bannerText: 'Réservez vos produits en ligne et récupérez-les en Click & Collect sous 30 min !'
  }
};

class PharmaStore {
  constructor() {
    this.state = this._loadState();
  }

  async initDatabase() {
    // If medications is empty, has fewer than 5000 items, or lacks purchasePrice, force reload
    const hasPurchasePrice = this.state.medications && this.state.medications.length > 0 && 
                             this.state.medications[0].hasOwnProperty('purchasePrice');
    
    if (!this.state.medications || this.state.medications.length < 5000 || !hasPurchasePrice) {
      try {
        const response = await fetch('js/real_medications.json');
        const data = await response.json();
        this.state.medications = data;
        this._saveState();
        console.log(`Base de données chargée : ${data.length} médicaments officiels du Maroc avec prix d'achat.`);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de médicaments officiels :", error);
      }
    }
  }

  _loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this._saveState(INITIAL_STATE);
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    const parsed = JSON.parse(raw);
    // Force upgrades if the store has fewer medications than the new INITIAL_STATE dictionary
    if (!parsed.medications || parsed.medications.length < INITIAL_STATE.medications.length) {
      parsed.medications = INITIAL_STATE.medications;
      this._saveState(parsed);
    }
    return parsed;
  }

  _saveState(stateToSave = this.state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    // Emit custom event for reactivity across modules
    window.dispatchEvent(new CustomEvent('pharmastore-update', { detail: this.state }));
  }

  // Getters
  getMedications() { return this.state.medications; }
  getPatients() { return this.state.patients; }
  getSuppliers() { return this.state.suppliers; }
  getSales() { return this.state.sales; }
  getSettings() { return this.state.settings; }
  getReservations() { return this.state.reservations || []; }
  getWebshop() { return this.state.webshop || { siteTitle: 'Ma Pharmacie Connectée', siteAccent: '#10b981', isOnline: true, bannerText: 'Réservez vos produits en ligne et récupérez-les en Click & Collect sous 30 min !' }; }

  // System Date context helper (simulating today is June 11, 2026)
  getCurrentDate() {
    return new Date('2026-06-11T14:30:00');
  }

  // Alerts calculations
  getAlerts() {
    const alerts = [];
    const currentDate = this.getCurrentDate();
    
    this.state.medications.forEach(med => {
      // Expiration Alert
      const expDate = new Date(med.expiry);
      const diffTime = expDate - currentDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        alerts.push({
          type: 'danger',
          message: `Le produit "${med.name}" (Lot: ${med.batch}) est expiré depuis le ${med.expiry}.`,
          date: med.expiry,
          category: 'expiry'
        });
      } else if (diffDays <= 45) {
        alerts.push({
          type: 'warning',
          message: `Le produit "${med.name}" (Lot: ${med.batch}) expire très bientôt (le ${med.expiry}, dans ${diffDays} jours).`,
          date: med.expiry,
          category: 'expiry'
        });
      }

      // Stock Alert
      if (med.stock === 0) {
        alerts.push({
          type: 'danger',
          message: `Rupture totale de stock pour le médicament "${med.name}".`,
          date: 'Immédiat',
          category: 'stock'
        });
      } else if (med.stock <= med.minStock) {
        alerts.push({
          type: 'warning',
          message: `Stock critique pour "${med.name}" (${med.stock} restants, Seuil: ${med.minStock}).`,
          date: 'Immédiat',
          category: 'stock'
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.type === 'danger' && b.type !== 'danger') return -1;
      if (a.type !== 'danger' && b.type === 'danger') return 1;
      return 0;
    });
  }

  // Mutations - Medications
  saveMedication(med) {
    if (med.id) {
      const idx = this.state.medications.findIndex(m => m.id === med.id);
      if (idx !== -1) this.state.medications[idx] = { ...this.state.medications[idx], ...med };
    } else {
      med.id = String(Date.now());
      this.state.medications.push(med);
    }
    this._saveState();
  }

  deleteMedication(id) {
    this.state.medications = this.state.medications.filter(m => m.id !== id);
    this._saveState();
  }

  // Mutations - Patients
  savePatient(pat) {
    if (pat.id) {
      const idx = this.state.patients.findIndex(p => p.id === pat.id);
      if (idx !== -1) this.state.patients[idx] = { ...this.state.patients[idx], ...pat };
    } else {
      pat.id = String(Date.now());
      this.state.patients.push(pat);
    }
    this._saveState();
  }

  deletePatient(id) {
    this.state.patients = this.state.patients.filter(p => p.id !== id);
    this._saveState();
  }

  // Mutations - Suppliers
  saveSupplier(sup) {
    if (sup.id) {
      const idx = this.state.suppliers.findIndex(s => s.id === sup.id);
      if (idx !== -1) this.state.suppliers[idx] = { ...this.state.suppliers[idx], ...sup };
    } else {
      sup.id = String(Date.now());
      this.state.suppliers.push(sup);
    }
    this._saveState();
  }

  deleteSupplier(id) {
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this._saveState();
  }

  // Sales Processing
  addSale(saleData) {
    // Verify & update stocks
    saleData.items.forEach(item => {
      const med = this.state.medications.find(m => m.id === item.medicationId);
      if (med) {
        med.stock = Math.max(0, med.stock - item.quantity);
      }
    });

    const newSale = {
      id: 'S' + String(this.state.sales.length + 1).padStart(3, '0'),
      date: new Date().toISOString(),
      ...saleData
    };

    this.state.sales.push(newSale);
    this._saveState();
    return newSale;
  }

  // Theme Settings
  updateTheme(theme) {
    this.state.settings.theme = theme;
    this._saveState();
  }

  updatePharmacyDetails(details) {
    this.state.settings = { ...this.state.settings, ...details };
    this._saveState();
  }

  updateWebshop(config) {
    this.state.webshop = { ...this.state.webshop, ...config };
    this._saveState();
  }

  addReservation(res) {
    const newRes = {
      id: 'R' + String((this.state.reservations || []).length + 1).padStart(3, '0'),
      date: new Date().toISOString(),
      status: 'pending',
      ...res
    };
    if (!this.state.reservations) this.state.reservations = [];
    this.state.reservations.push(newRes);
    this._saveState();
    return newRes;
  }

  updateReservationStatus(id, status) {
    const idx = (this.state.reservations || []).findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.reservations[idx].status = status;
      // If completed, convert to a sale
      if (status === 'completed') {
        const res = this.state.reservations[idx];
        this.addSale({
          items: res.items,
          total: res.total,
          mutuelleRate: 0,
          paidByPatient: res.total,
          paidByMutuelle: 0,
          patientId: null
        });
      }
      this._saveState();
    }
  }
}

const store = new PharmaStore();
window.PharmaStore = store; // Make globally accessible
export default store;
