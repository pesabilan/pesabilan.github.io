let panier = [];
        let modeDocument = 'facture';

        // Gestion de la monnaie via localStorage
        let deviseActuelle = localStorage.getItem('pe_devise') || "CDF";

        // Initialisation du sélecteur de monnaie
        const selectDevise = document.getElementById('devise-select');
        const inputDeviseLibre = document.getElementById('devise-libre');

        if (["CDF", "USD", "EURO", "FCFA"].includes(deviseActuelle)) {
            selectDevise.value = deviseActuelle;
            inputDeviseLibre.classList.add('hidden');
        } else {
            selectDevise.value = "AUTRE";
            inputDeviseLibre.value = deviseActuelle;
            inputDeviseLibre.classList.remove('hidden');
        }

        function ouvrirAProposPesa() {
            const modal = document.getElementById('pesa-about-modal');
            if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
        }
        function fermerAProposPesa() {
            const modal = document.getElementById('pesa-about-modal');
            if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
        }
        // Identité et personnalisation de l’entreprise, conservées localement.
        const ENTREPRISE_STORAGE_KEY = 'pesa_bilan_identite_entreprise_v1';
        let logoEntrepriseEnCours = '', cachetEntrepriseEnCours = '', signatureEntrepriseEnCours = '';
        function chargerIdentiteEntreprise() {
            try {
                const d = JSON.parse(localStorage.getItem(ENTREPRISE_STORAGE_KEY) || '{}');
                ['nom','telephone','adresse','email','rccm','nif','logoBase64','cachet','signature','redacteur','couleur'].forEach(k=>{ if (typeof d[k] === 'string') CONFIG_BOUTIQUE[k==='logoBase64'?'logoBase64':k] = d[k]; });
                // Migration de l’ancien format local
                if (d.logo && !CONFIG_BOUTIQUE.logoBase64) CONFIG_BOUTIQUE.logoBase64 = d.logo;
            } catch (e) { console.warn('Identité entreprise locale illisible.', e); }
        }
        function appliquerCouleurEntreprise() {
            const c = CONFIG_BOUTIQUE.couleur || '#059669';
            document.documentElement.style.setProperty('--couleur-entreprise', c);
            document.querySelectorAll('button.bg-emerald-600,button.bg-emerald-700,button.bg-blue-600').forEach(b=>{b.style.backgroundColor=c;});
            document.querySelectorAll('button.hover\:bg-emerald-700,button.hover\:bg-emerald-800').forEach(b=>b.style.setProperty('--tw-bg-opacity','1'));
            const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.content=c;
        }
        function actualiserEnteteEntreprise() {
            const set=(id,val)=>{const e=document.getElementById(id); if(e){e.textContent=val||'';e.classList.toggle('hidden',!val);}};
            set('preview-shop-name',CONFIG_BOUTIQUE.nom); set('preview-shop-address',CONFIG_BOUTIQUE.adresse); set('preview-shop-phone',CONFIG_BOUTIQUE.telephone); set('preview-shop-email',CONFIG_BOUTIQUE.email);
            const legal=[CONFIG_BOUTIQUE.rccm?'RCCM : '+CONFIG_BOUTIQUE.rccm:'',CONFIG_BOUTIQUE.nif?'NIF : '+CONFIG_BOUTIQUE.nif:''].filter(Boolean).join(' · '); set('preview-shop-legal',legal);
            const logo=document.getElementById('preview-logo'); logo.src=CONFIG_BOUTIQUE.logoBase64||''; logo.classList.toggle('hidden',!CONFIG_BOUTIQUE.logoBase64);
            const auth=document.getElementById('preview-authentication');
            const author=CONFIG_BOUTIQUE.redacteur||''; document.getElementById('preview-author').textContent=author; document.getElementById('preview-author-wrap').classList.toggle('hidden',!author);
            [['cachet','preview-cachet','preview-cachet-wrap'],['signature','preview-signature','preview-signature-wrap']].forEach(([k,imgId,wrapId])=>{document.getElementById(imgId).src=CONFIG_BOUTIQUE[k]||'';document.getElementById(wrapId).classList.toggle('hidden',!CONFIG_BOUTIQUE[k]);});
            auth.classList.toggle('hidden',!(author||CONFIG_BOUTIQUE.cachet||CONFIG_BOUTIQUE.signature)); appliquerCouleurEntreprise(); actualiserIdentiteInstallation();
        }
        function ouvrirParametresEntreprise() {
            const fields={nom:'entreprise-nom',telephone:'entreprise-telephone',adresse:'entreprise-adresse',email:'entreprise-email',rccm:'entreprise-rccm',nif:'entreprise-nif',redacteur:'entreprise-redacteur'};
            Object.entries(fields).forEach(([k,id])=>document.getElementById(id).value=CONFIG_BOUTIQUE[k]||'');
            document.getElementById('entreprise-couleur').value=CONFIG_BOUTIQUE.couleur||'#059669';
            logoEntrepriseEnCours=CONFIG_BOUTIQUE.logoBase64||''; cachetEntrepriseEnCours=CONFIG_BOUTIQUE.cachet||''; signatureEntrepriseEnCours=CONFIG_BOUTIQUE.signature||'';
            actualiserApercuLogoEntreprise(); actualiserApercuImage('cachet',cachetEntrepriseEnCours); actualiserApercuImage('signature',signatureEntrepriseEnCours);
            document.getElementById('entreprise-settings-modal').classList.remove('hidden'); document.body.style.overflow='hidden';
        }
        function fermerParametresEntreprise(){document.getElementById('entreprise-settings-modal').classList.add('hidden');document.body.style.overflow='';}
        function actualiserApercuLogoEntreprise(){const img=document.getElementById('entreprise-logo-apercu'),statut=document.getElementById('entreprise-logo-statut'),retirer=document.getElementById('entreprise-logo-retirer');img.src=logoEntrepriseEnCours||'';img.classList.toggle('hidden',!logoEntrepriseEnCours);statut.textContent=logoEntrepriseEnCours?'Logo prêt à être enregistré.':'Aucun logo personnalisé sélectionné.';retirer.classList.toggle('hidden',!logoEntrepriseEnCours);}
        function actualiserApercuImage(type,data){const img=document.getElementById('entreprise-'+type+'-apercu'),btn=document.getElementById('entreprise-'+type+'-retirer');img.src=data||'';img.classList.toggle('hidden',!data);btn.classList.toggle('hidden',!data);}
        function connecterImageUpload(inputId,type){document.getElementById(inputId).addEventListener('change',function(e){const f=e.target.files&&e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){alert('Choisissez un fichier image.');e.target.value='';return;}if(f.size>2*1024*1024){alert('Chaque image doit faire 2 Mo maximum.');e.target.value='';return;}const r=new FileReader();r.onload=()=>{if(type==='logo')logoEntrepriseEnCours=String(r.result||'');else if(type==='cachet')cachetEntrepriseEnCours=String(r.result||'');else signatureEntrepriseEnCours=String(r.result||'');if(type==='logo')actualiserApercuLogoEntreprise();else actualiserApercuImage(type,type==='cachet'?cachetEntrepriseEnCours:signatureEntrepriseEnCours);};r.onerror=()=>alert('Impossible de lire cette image.');r.readAsDataURL(f);});}
        connecterImageUpload('entreprise-logo-fichier','logo'); connecterImageUpload('entreprise-cachet-fichier','cachet'); connecterImageUpload('entreprise-signature-fichier','signature');
        document.getElementById('entreprise-logo-retirer').addEventListener('click',()=>{logoEntrepriseEnCours='';document.getElementById('entreprise-logo-fichier').value='';actualiserApercuLogoEntreprise();});
        ['cachet','signature'].forEach(t=>document.getElementById('entreprise-'+t+'-retirer').addEventListener('click',()=>{if(t==='cachet')cachetEntrepriseEnCours='';else signatureEntrepriseEnCours='';document.getElementById('entreprise-'+t+'-fichier').value='';actualiserApercuImage(t,'');}));
        document.getElementById('entreprise-settings-form').addEventListener('submit',function(event){
            event.preventDefault(); const fields={nom:'entreprise-nom',telephone:'entreprise-telephone',adresse:'entreprise-adresse',email:'entreprise-email',rccm:'entreprise-rccm',nif:'entreprise-nif',redacteur:'entreprise-redacteur'}; const d={};
            Object.entries(fields).forEach(([k,id])=>d[k]=document.getElementById(id).value.trim());
            Object.assign(d,{logoBase64:logoEntrepriseEnCours,cachet:cachetEntrepriseEnCours,signature:signatureEntrepriseEnCours,couleur:document.getElementById('entreprise-couleur').value||'#059669'});
            try{localStorage.setItem(ENTREPRISE_STORAGE_KEY,JSON.stringify(d));}catch(e){alert('Impossible d’enregistrer. Réduisez la taille des images et réessayez.');return;}
            Object.assign(CONFIG_BOUTIQUE,d); actualiserEnteteEntreprise(); fermerParametresEntreprise();
        });
        chargerIdentiteEntreprise();


        function actualiserIdentiteInstallation(){
            // L'identité PWA reste stable pour que le navigateur reconnaisse PESA BILAN.
            const nom=(CONFIG_BOUTIQUE.nom||'Pesa Bilan').trim();
            document.title=nom+' — Factures et devis';
            document.querySelector('meta[name="application-name"]')?.setAttribute('content','PESA BILAN');
            document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content','PESA BILAN');
        }
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') { fermerAProposPesa(); fermerParametresEntreprise(); }
        });

        // Gestion du compteur via localStorage
        let numeroFactureActuel = Number(localStorage.getItem('pe_invoice_num') || 1);
        let numeroDevisActuel = Number(localStorage.getItem('pe_quote_num') || 1);

        function getFormattedInvoiceNumber(num) {
            return "FX-" + String(num).padStart(4, '0');
        }
        function getFormattedQuoteNumber(num) {
            return "DEV-" + String(num).padStart(4, '0');
        }
        function ouvrirOngletPesa(onglet) {
            const sauvegarde = onglet === 'sauvegarde';
            document.getElementById('app-workspace').classList.toggle('hidden', sauvegarde);
            document.getElementById('pesa-backup-panel').classList.toggle('hidden', !sauvegarde);
            ['facture','devis','sauvegarde'].forEach(n => {
                const b = document.getElementById('tab-' + (n === 'facture' ? 'facture' : n));
                if (!b) return;
                b.className = 'py-3 rounded-lg text-sm font-bold ' + (n === onglet ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600');
            });
            if (onglet === 'facture' || onglet === 'devis') changerMode(onglet);
            if (sauvegarde) afficherHistoriqueFactures();
        }

        const etatsDocuments = { facture: null, devis: null };
        function capturerEtatDocument() {
            const val = id => document.getElementById(id)?.value ?? '';
            const checked = id => !!document.getElementById(id)?.checked;
            return { panier: panier.map(a=>({...a})), client:val('client-name'), note:val('client-note'), devise:deviseActuelle,
                tva:checked('tva-active'), tauxTVA:val('tva-taux'), deduction:checked('deduction-active'), tauxDeduction:val('deduction-taux'),
                validite:val('devis-validity'), livraison:val('devis-delivery'), paiement:val('devis-payment'), statut:val('statut-select'),
                numeroFacture:val('invoice-number-input'), numeroDevis:val('quote-number-input') };
        }
        function restaurerEtatDocument(etat, mode) {
            const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined)e.value=v;};
            panier = etat?.panier ? etat.panier.map(a=>({...a})) : [];
            set('client-name',etat?.client||''); set('client-note',etat?.note||'');
            set('devis-validity',etat?.validite||''); set('devis-delivery',etat?.livraison||''); set('devis-payment',etat?.paiement||'');
            set('statut-select',etat?.statut||'PAYÉ');
            document.getElementById('tva-active').checked=!!etat?.tva; set('tva-taux',etat?.tauxTVA||'');
            if(document.getElementById('deduction-active')) document.getElementById('deduction-active').checked=!!etat?.deduction;
            set('deduction-taux',etat?.tauxDeduction||'');
            deviseActuelle=etat?.devise||'CDF';
            if (typeof selectDevise!=='undefined' && selectDevise) { if (["CDF","USD","EURO","FCFA"].includes(deviseActuelle)){selectDevise.value=deviseActuelle;inputDeviseLibre.classList.add('hidden');}else{selectDevise.value='AUTRE';inputDeviseLibre.value=deviseActuelle;inputDeviseLibre.classList.remove('hidden');} }
            set('invoice-number-input',etat?.numeroFacture||getFormattedInvoiceNumber(numeroFactureActuel));
            set('quote-number-input',etat?.numeroDevis||getFormattedQuoteNumber(numeroDevisActuel));
            document.getElementById('preview-client').textContent=etat?.client||'Comptant / Client de passage';
            afficherPanier(); synchroniserApercuDocument();
        }
        function changerMode(mode) {
            const ancienMode = modeDocument;
            if (ancienMode === 'facture' || ancienMode === 'devis') etatsDocuments[ancienMode] = capturerEtatDocument();
            modeDocument = mode;
            const devis = mode === 'devis';
            document.getElementById('tab-facture').className = 'py-3 rounded-lg text-sm font-bold ' + (!devis ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600');
            document.getElementById('tab-devis').className = 'py-3 rounded-lg text-sm font-bold ' + (devis ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600');
            document.getElementById('form-title').innerText = devis ? 'Préparer un devis' : 'Créer une facture';
            document.getElementById('invoice-status-wrap').classList.toggle('hidden', devis);
            document.getElementById('devis-options').classList.toggle('hidden', !devis);
            document.getElementById('invoice-number-input').classList.toggle('hidden', devis);
            document.getElementById('quote-number-input').classList.toggle('hidden', !devis);
            const champNumeroDevis = document.getElementById('quote-number-input');
            if (devis && ancienMode !== 'devis') champNumeroDevis.value = getFormattedQuoteNumber(numeroDevisActuel);
            else if (!champNumeroDevis.value.trim()) champNumeroDevis.value = getFormattedQuoteNumber(numeroDevisActuel);
            document.getElementById('devis-actions').classList.toggle('hidden', !devis);
            document.getElementById('pdf-button').innerHTML = devis ? '<span>📥 Générer le devis PDF</span>' : '<span>📥 Générer la facture PDF</span>';
            document.getElementById('preview-invoice-tag').innerText = devis ? 'DEVIS ' + numeroDevisSaisi() : 'FACTURE ' + document.getElementById('invoice-number-input').value;
            document.getElementById('preview-badge-statut').classList.toggle('hidden', devis);
            document.getElementById('preview-client').previousElementSibling.innerText = devis ? 'Proposition destinée à : ' : 'Facturé à : ';
            document.getElementById('client-note').previousElementSibling.innerText = devis ? 'Note au client (facultatif)' : 'Mot ou note pour le client (facultatif)';
            document.getElementById('client-note').placeholder = devis ? 'Ex. Merci de nous faire part de votre décision.' : 'Ex. Merci pour votre achat. À régler avant vendredi.';
            actualiserLibelleTotal();
            if (ancienMode !== mode) restaurerEtatDocument(etatsDocuments[mode], mode);
            document.getElementById('facture-actions')?.classList.toggle('hidden', devis);
            actualiserNoteApercu();
            mettreAJourTVA();
            synchroniserApercuDocument();
            afficherHistoriqueDevis(); afficherHistoriqueFactures();
        }

        function actualiserNoteApercu() {
            const champNote = document.getElementById('client-note');
            const container = document.getElementById('preview-note-container');
            const textElement = document.getElementById('preview-note-text');
            if (!champNote || !container || !textElement) return;
            const lignes = [];
            const note = champNote.value.trim();
            if (note) lignes.push(note);
            if (modeDocument === 'devis') {
                const validite = document.getElementById('devis-validity')?.value;
                const livraison = document.getElementById('devis-delivery')?.value.trim();
                const paiement = document.getElementById('devis-payment')?.value.trim();
                if (validite) lignes.push('Validité du devis : jusqu’au ' + new Date(validite + 'T00:00:00').toLocaleDateString('fr-FR') + '.');
                if (livraison) lignes.push('Délai de livraison / exécution : ' + livraison);
                if (paiement) lignes.push('Conditions de paiement : ' + paiement);
                lignes.push('Ce document est une proposition commerciale et ne constitue pas une facture.');
            }
            // Des paragraphes séparés évitent que les conditions du devis soient collées.
            textElement.textContent = lignes.join('\n\n');
            textElement.style.whiteSpace = 'pre-line';
            textElement.style.lineHeight = '1.6';
            textElement.style.overflowWrap = 'anywhere';
            container.classList.toggle('hidden', lignes.length === 0);
        }

        function synchroniserApercuDocument() {
            const devis = modeDocument === 'devis';
            const champClient = document.getElementById('client-name');
            const apercuClient = document.getElementById('preview-client');
            if (champClient && apercuClient) {
                apercuClient.textContent = champClient.value.trim() || 'Comptant / Client de passage';
            }
            const champNumero = document.getElementById(devis ? 'quote-number-input' : 'invoice-number-input');
            const numero = (champNumero?.value || '').trim() || (devis ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel));
            const tag = document.getElementById('preview-invoice-tag');
            if (tag) tag.textContent = (devis ? 'DEVIS ' : 'FACTURE ') + numero;
            actualiserNoteApercu();
        }

        // Actualisation de secours : resynchronise les champs, l’aperçu et les totaux
        // sans effacer les données saisies ni modifier les articles.
        function actualiserToutLeDocument() {
            const bouton = document.getElementById('refresh-all-preview-btn');
            const statut = document.getElementById('refresh-all-preview-status');
            const erreurs = [];
            const essayer = (nom, action) => {
                try { action(); } catch (e) { erreurs.push(nom + ': ' + (e?.message || e)); console.error('Actualisation — ' + nom, e); }
            };

            // 1) Synchronisation directe des champs : elle ne dépend pas des fonctions de calcul.
            essayer('client', () => {
                const champ = document.getElementById('client-name');
                const cible = document.getElementById('preview-client');
                if (champ && cible) cible.textContent = champ.value.trim() || 'Comptant / Client de passage';
            });
            essayer('numéro', () => {
                const devis = modeDocument === 'devis';
                const champ = document.getElementById(devis ? 'quote-number-input' : 'invoice-number-input');
                const numero = (champ?.value || '').trim() || (devis ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel));
                const cible = document.getElementById('preview-invoice-tag');
                if (cible) cible.textContent = (devis ? 'DEVIS ' : 'FACTURE ') + numero;
            });
            essayer('note et conditions', () => actualiserNoteApercu());
            essayer('entête boutique', () => { if (typeof actualiserEnteteEntreprise === 'function') actualiserEnteteEntreprise(); });
            essayer('libellé du total', () => { if (typeof actualiserLibelleTotal === 'function') actualiserLibelleTotal(); });
            essayer('statut de paiement', () => {
                const champ = document.getElementById('statut-select');
                const badge = document.getElementById('preview-badge-statut');
                if (champ && badge && modeDocument !== 'devis') {
                    badge.textContent = champ.value;
                    badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ' +
                        (champ.value === 'PAYÉ' ? 'bg-emerald-100 text-emerald-700' : champ.value === 'CRÉDIT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700');
                    badge.classList.remove('hidden');
                } else if (badge) badge.classList.toggle('hidden', modeDocument === 'devis');
            });
            // 2) Les calculs sont isolés : une erreur ne bloque pas les champs déjà synchronisés.
            essayer('TVA', () => { if (typeof mettreAJourTVA === 'function') mettreAJourTVA(); });
            essayer('déduction', () => { if (typeof mettreAJourDeduction === 'function') mettreAJourDeduction(); });
            essayer('panier et totaux', () => { if (typeof afficherPanier === 'function') afficherPanier(); });
            // Certaines fonctions de calcul peuvent réécrire des éléments : on réapplique les champs ensuite.
            essayer('synchronisation finale', () => {
                const devis = modeDocument === 'devis';
                const client = document.getElementById('client-name');
                const apercuClient = document.getElementById('preview-client');
                if (client && apercuClient) apercuClient.textContent = client.value.trim() || 'Comptant / Client de passage';
                const champNumero = document.getElementById(devis ? 'quote-number-input' : 'invoice-number-input');
                const numero = (champNumero?.value || '').trim() || (devis ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel));
                const tag = document.getElementById('preview-invoice-tag');
                if (tag) tag.textContent = (devis ? 'DEVIS ' : 'FACTURE ') + numero;
                actualiserNoteApercu();
            });

            if (statut) statut.textContent = erreurs.length
                ? '⚠️ Aperçu synchronisé, mais certaines opérations secondaires ont échoué.'
                : '✅ Tous les champs et l’aperçu sont synchronisés.';
            if (bouton) {
                const ancienTexte = bouton.innerHTML;
                bouton.disabled = true;
                bouton.innerHTML = erreurs.length ? '⚠️ Synchronisation effectuée' : '✅ Aperçu synchronisé';
                setTimeout(() => { bouton.disabled = false; bouton.innerHTML = ancienTexte; }, 1400);
            }
        }

        // Initialisation des données boutique
        actualiserEnteteEntreprise();

        // Initialisation du champ numéro
        const formattedNum = getFormattedInvoiceNumber(numeroFactureActuel);
        document.getElementById('invoice-number-input').value = formattedNum;
        document.getElementById('preview-invoice-tag').innerText = "FACTURE " + formattedNum;
        actualiserLibelleTotal();
        actualiserClientApercu();
        synchroniserApercuDocument();

        // Date du jour
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        document.getElementById('preview-date').innerText = new Date().toLocaleDateString('fr-FR', options);

        // Liaison nom client
        function actualiserClientApercu() {
            const champ = document.getElementById('client-name');
            const cible = document.getElementById('preview-client');
            if (champ && cible) cible.textContent = champ.value.trim() || 'Comptant / Client de passage';
        }
        ['input', 'change', 'keyup', 'paste'].forEach(evt => document.getElementById('client-name').addEventListener(evt, () => { actualiserClientApercu(); synchroniserApercuDocument(); }));

        // Mise à jour de la note et des conditions visibles sur l'aperçu
        ['input', 'change', 'keyup', 'paste'].forEach(evt => document.getElementById('client-note').addEventListener(evt, actualiserNoteApercu));
        ['devis-validity', 'devis-delivery', 'devis-payment'].forEach(id => {
            document.getElementById(id).addEventListener('input', actualiserNoteApercu);
            document.getElementById(id).addEventListener('change', actualiserNoteApercu);
        });

        function gererChangementDevise(val) {
            if (val === "AUTRE") {
                inputDeviseLibre.classList.remove('hidden');
                inputDeviseLibre.focus();
                deviseActuelle = inputDeviseLibre.value.trim() || "FC";
            } else {
                inputDeviseLibre.classList.add('hidden');
                deviseActuelle = val;
            }
            localStorage.setItem('pe_devise', deviseActuelle);
            afficherPanier();
        }

        function changerDeviseLibre(val) {
            deviseActuelle = val.trim() || "FC";
            localStorage.setItem('pe_devise', deviseActuelle);
            afficherPanier();
        }

        function changerStatut() {
            const statut = document.getElementById('statut-select').value;
            const badge = document.getElementById('preview-badge-statut');
            badge.innerText = statut;

            if (statut === "PAYÉ") {
                badge.className = "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700";
            } else if (statut === "CRÉDIT") {
                badge.className = "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-700";
            } else {
                badge.className = "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-200 text-slate-700";
            }
        }

        function mettreAJourNumero(val) {
            const champ = document.getElementById('invoice-number-input');
            const numero = (val || '').trim() || getFormattedInvoiceNumber(numeroFactureActuel);
            document.getElementById('preview-invoice-tag').innerText = 'FACTURE ' + numero;
            if (champ && !champ.value.trim()) { /* le numéro de secours reste visible dans l’aperçu */ }
        }

        // Numéro de devis modifiable manuellement par l'utilisateur.
        function numeroDevisSaisi() {
            const champ = document.getElementById('quote-number-input');
            return (champ.value || '').trim() || getFormattedQuoteNumber(numeroDevisActuel);
        }
        function mettreAJourNumeroDevis(val) {
            const numero = (val || '').trim() || getFormattedQuoteNumber(numeroDevisActuel);
            document.getElementById('preview-invoice-tag').innerText = 'DEVIS ' + numero;
        }
        ['input', 'change', 'keyup'].forEach(evt => {
            document.getElementById('invoice-number-input').addEventListener(evt, e => mettreAJourNumero(e.target.value));
            document.getElementById('quote-number-input').addEventListener(evt, e => mettreAJourNumeroDevis(e.target.value));
        });

        function ajouterArticle() {
            const nom = document.getElementById('item-name').value.trim();
            const qte = parseFloat(document.getElementById('item-qty').value);
            const prix = parseFloat(document.getElementById('item-price').value);

            if(!nom || isNaN(qte) || isNaN(prix) || qte <= 0 || prix < 0) {
                alert("Veuillez remplir correctement les champs de l'article.");
                return;
            }

            panier.push({ nom, qte, prix, total: qte * prix });

            document.getElementById('item-name').value = '';
            document.getElementById('item-qty').value = '1';
            document.getElementById('item-price').value = '';

            afficherPanier();
        }

        function supprimerArticle(index) {
            panier.splice(index, 1);
            afficherPanier();
        }

        function calculerMontants() {
            const sousTotal = panier.reduce((somme, item) => somme + (Number(item.qte) * Number(item.prix)), 0);
            const tvaActive = document.getElementById('tva-active').checked;
            const champTaux = document.getElementById('tva-taux');
            let taux = Number(champTaux.value);
            if (!Number.isFinite(taux) || taux < 0) taux = 0;
            if (taux > 100) taux = 100;
            const montantTVA = tvaActive ? sousTotal * taux / 100 : 0;
            const deductionActive = document.getElementById('deduction-active').checked;
            let tauxDeduction = Number(document.getElementById('deduction-taux').value); if(!Number.isFinite(tauxDeduction)||tauxDeduction<0)tauxDeduction=0;if(tauxDeduction>100)tauxDeduction=100;
            const montantDeduction = deductionActive ? sousTotal * tauxDeduction / 100 : 0;
            return { sousTotal, tvaActive, taux, montantTVA, deductionActive, tauxDeduction, montantDeduction, total: Math.max(0, sousTotal + montantTVA - montantDeduction) };
        }

        function actualiserLibelleTotal() {
            const tvaActive = !!document.getElementById('tva-active')?.checked;
            const label = document.getElementById('total-label');
            if (label) label.textContent = tvaActive ? 'Total TTC :' : 'Total général :';
        }

        function mettreAJourTVA() {
            actualiserLibelleTotal();
            const active = document.getElementById('tva-active').checked;
            document.getElementById('tva-options').classList.toggle('hidden', !active);
            document.getElementById('subtotal-row').classList.toggle('hidden', !(active || document.getElementById('deduction-active').checked));
            document.getElementById('tva-row').classList.toggle('hidden', !active);
            actualiserLibelleTotal();
            afficherPanier();
        }

        function mettreAJourDeduction(){const active=document.getElementById('deduction-active').checked;document.getElementById('deduction-options').classList.toggle('hidden',!active);document.getElementById('deduction-row').classList.toggle('hidden',!active);document.getElementById('subtotal-row').classList.toggle('hidden',!(active||document.getElementById('tva-active').checked));afficherPanier();}

        function afficherPanier() {
            const destination = document.getElementById('cart-items');
            destination.innerHTML = '';

            if (panier.length === 0) {
                destination.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 italic">Aucun article ajouté</td></tr>`;
            }

            panier.forEach((item, index) => {
                const totalLigne = Number(item.qte) * Number(item.prix);
                item.total = totalLigne;
                destination.innerHTML += `
                    <tr class="hover:bg-slate-50">
                        <td class="py-2 pr-2 text-slate-800 font-medium">${item.nom}</td>
                        <td class="py-2 px-1 text-center text-slate-600">${item.qte}</td>
                        <td class="py-2 px-1 text-right text-slate-600">${Number(item.prix).toLocaleString()}</td>
                        <td class="py-2 pl-2 text-right font-semibold text-slate-800">${totalLigne.toLocaleString()} ${deviseActuelle}</td>
                        <td class="py-2 text-center no-print">
                            <button onclick="supprimerArticle(${index})" class="text-red-500 font-bold px-1" aria-label="Supprimer ${String(item.nom).replace(/"/g, '&quot;')}">×</button>
                        </td>
                    </tr>
                `;
            });

            const montants = calculerMontants();
            document.getElementById('cart-subtotal').innerText = montants.sousTotal.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' ' + deviseActuelle;
            document.getElementById('tva-label').innerText = `TVA (${montants.taux} %) :`;
            document.getElementById('cart-tva').innerText = montants.montantTVA.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' ' + deviseActuelle;
            const libelleDeduction=document.getElementById('deduction-nom').value.trim()||'Déduction'; document.getElementById('deduction-label').innerText=`${libelleDeduction} (${montants.tauxDeduction} %) :`;
            document.getElementById('cart-deduction').innerText='− '+montants.montantDeduction.toLocaleString(undefined,{maximumFractionDigits:2})+' '+deviseActuelle;
            document.getElementById('deduction-row').classList.toggle('hidden',!montants.deductionActive);
            document.getElementById('cart-total').innerText = montants.total.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' ' + deviseActuelle;
        }

        async function telechargerPDF() {
            mettreAJourTVA();
            if (panier.length === 0) {
                alert(modeDocument === 'devis' ? 'Ajoutez au moins un article avant de générer le devis !' : "Ajoutez au moins un article avant de générer la facture !");
                return;
            }
            if (typeof html2pdf === 'undefined') {
                // Repli universel : Chrome, Safari et navigateurs mobiles peuvent imprimer
                // ou enregistrer en PDF via leur propre interface système.
                const titreOriginal = document.title;
                const champNumero = document.getElementById(modeDocument === 'devis' ? 'quote-number-input' : 'invoice-number-input');
                const numeroSecours = (champNumero?.value || '').trim() || (modeDocument === 'devis' ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel));
                document.title = (modeDocument === 'devis' ? 'Devis_' : 'Facture_') + numeroSecours;
                window.print();
                document.title = titreOriginal;
                return;
            }
            const devis = modeDocument === 'devis';
            const numero = devis
                ? (document.getElementById('quote-number-input').value.trim() || numeroDevisSaisi())
                : (document.getElementById('invoice-number-input').value.trim() || getFormattedInvoiceNumber(numeroFactureActuel));
            const client = (document.getElementById('client-name').value.trim() || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
            const nomFichier = (devis ? 'Devis_' : 'Facture_') + String(numero).replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + client + '.pdf';
            const apercu = document.getElementById('invoice-preview');
            const badge = document.getElementById('preview-badge-statut');
            const badgeEtaitCache = badge ? badge.classList.contains('hidden') : false;
            if (devis) {
                actualiserNoteApercu();
                if (badge) badge.classList.add('hidden');
            } else if (badge) {
                badge.classList.remove('hidden');
            }
            // Synchroniser explicitement la note dans la copie PDF : cloneNode ne
            // garantit pas toujours le rendu à jour sur tous les navigateurs mobiles.
            actualiserNoteApercu();
            const clone = apercu.cloneNode(true);
            const noteClone = clone.querySelector('#preview-note-text');
            const noteContainerClone = clone.querySelector('#preview-note-container');
            if (noteClone) { noteClone.textContent = document.getElementById('preview-note-text').textContent; noteClone.style.whiteSpace = 'pre-line'; noteClone.style.lineHeight = '1.6'; }
            if (noteContainerClone) noteContainerClone.classList.toggle('hidden', !noteClone || !noteClone.textContent.trim());
            clone.querySelectorAll('.no-print').forEach(el => el.remove());
            clone.style.cssText += ';box-sizing:border-box;width:720px;max-width:none;min-height:auto;height:auto;padding:24px;margin:0 auto;border:none;box-shadow:none;background:#fff;position:relative;left:auto;top:auto;visibility:visible;opacity:1;';
            const zone = document.createElement('div');
            zone.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;overflow:auto;background:#fff;z-index:2147483647;pointer-events:none;';
            const pdfPageContent = document.createElement('div');
            pdfPageContent.style.cssText = 'width:720px;max-width:720px;box-sizing:border-box;display:block;margin:0 auto;background:#fff;overflow:visible;';
            clone.style.margin = '0';
            pdfPageContent.appendChild(clone);
            zone.appendChild(pdfPageContent);
            document.body.appendChild(zone);
            try {
                const originals = apercu.querySelectorAll('input,textarea,select');
                const copies = clone.querySelectorAll('input,textarea,select');
                originals.forEach((el, i) => {
                    if (!copies[i]) return;
                    if (el.type === 'checkbox' || el.type === 'radio') copies[i].checked = el.checked;
                    else copies[i].value = el.value;
                    if (el.tagName === 'TEXTAREA') copies[i].textContent = el.value;
                });
                const options = {
                    margin: [8, 8, 8, 8],
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, windowWidth: 720, logging: false, letterRendering: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'] }
                };
                const blob = await html2pdf().set(options).from(pdfPageContent).outputPdf('blob');
                if (!blob || blob.size < 1000) throw new Error('Le PDF généré est vide.');
                let enregistre = false;
                if (window.showSaveFilePicker) {
                    try {
                        const handle = await window.showSaveFilePicker({ suggestedName: nomFichier, types: [{ description: 'Document PDF', accept: { 'application/pdf': ['.pdf'] } }] });
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        enregistre = true;
                    } catch (err) {
                        if (err && err.name === 'AbortError') return;
                        console.warn('Sélecteur de fichier indisponible, téléchargement classique utilisé.', err);
                    }
                }
                if (!enregistre) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = nomFichier;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 30000);
                }
                enregistrerDocumentHistorique(devis, numero);
                if (devis) {
                    numeroDevisActuel++;
                    localStorage.setItem('pe_quote_num', numeroDevisActuel);
                    document.getElementById('preview-invoice-tag').innerText = 'DEVIS ' + getFormattedQuoteNumber(numeroDevisActuel);
                    const champ = document.getElementById('quote-number-input');
                    if (champ && !champ.value.trim()) champ.value = getFormattedQuoteNumber(numeroDevisActuel);
                } else {
                    numeroFactureActuel++;
                    localStorage.setItem('pe_invoice_num', numeroFactureActuel);
                    const nouveauNum = getFormattedInvoiceNumber(numeroFactureActuel);
                    document.getElementById('invoice-number-input').value = nouveauNum;
                    document.getElementById('preview-invoice-tag').innerText = 'FACTURE ' + nouveauNum;
                }
                alert(enregistre ? 'PDF enregistré avec succès.' : 'PDF généré et téléchargé. Sur Android, cherchez-le dans le dossier Téléchargements.');
            } catch (err) {
                console.error('Erreur de génération PDF :', err);
                alert("Impossible de générer le PDF. Vérifiez la connexion Internet puis réessayez.");
            } finally {
                zone.remove();
                if (badge) badge.classList.toggle('hidden', badgeEtaitCache);
            }
        }

        function obtenirResumeEnvoi() {
            const devis = modeDocument === 'devis';
            const numero = devis
                ? (document.getElementById('quote-number-input').value || getFormattedQuoteNumber(numeroDevisActuel))
                : (document.getElementById('invoice-number-input').value || getFormattedInvoiceNumber(numeroFactureActuel));
            const client = document.getElementById('client-name').value.trim() || 'Client';
            const boutique = document.getElementById('preview-shop-name').innerText.trim() || 'Notre entreprise';
            const total = document.getElementById('cart-total').innerText.trim() || 'à confirmer';
            const note = document.getElementById('client-note').value.trim();
            const validite = devis ? document.getElementById('devis-validity').value : '';
            let message = `Bonjour ${client},\n\nVeuillez trouver les informations de notre ${devis ? 'devis' : 'facture'} ${numero} de ${boutique}.\nMontant total : ${total}.`;
            if (devis && validite) message += `\nValidité du devis jusqu’au : ${validite}.`;
            if (!devis) message += `\nStatut : ${document.getElementById('statut-select').value}.`;
            if (note) message += `\n\nNote : ${note}`;
            message += `\n\nLe PDF du document peut être joint à ce message.\nCordialement,\n${boutique}`;
            return { message, numero, devis, client };
        }

        async function partagerPDF() {
            mettreAJourTVA();
            if (!panier.length) {
                alert(modeDocument === 'devis' ? 'Ajoutez au moins un article avant de partager le devis.' : 'Ajoutez au moins un article avant de partager la facture.');
                return;
            }
            if (typeof html2pdf === 'undefined') {
                alert("La fonction de création PDF n'est pas chargée. Vérifiez la connexion Internet puis réessayez, ou utilisez « Générer le PDF ».");
                return;
            }
            const { message, numero, devis } = obtenirResumeEnvoi();
            const nomFichier = (devis ? 'Devis_' : 'Facture_') + String(numero).replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
            const apercu = document.getElementById('invoice-preview');
            // Synchroniser explicitement la note dans la copie PDF : cloneNode ne
            // garantit pas toujours le rendu à jour sur tous les navigateurs mobiles.
            actualiserNoteApercu();
            const clone = apercu.cloneNode(true);
            const noteClone = clone.querySelector('#preview-note-text');
            const noteContainerClone = clone.querySelector('#preview-note-container');
            if (noteClone) { noteClone.textContent = document.getElementById('preview-note-text').textContent; noteClone.style.whiteSpace = 'pre-line'; noteClone.style.lineHeight = '1.6'; }
            if (noteContainerClone) noteContainerClone.classList.toggle('hidden', !noteClone || !noteClone.textContent.trim());
            clone.querySelectorAll('.no-print').forEach(el => el.remove());
            clone.style.boxSizing = 'border-box';
            clone.style.width = '720px';
            clone.style.maxWidth = 'none';
            clone.style.minHeight = 'auto';
            clone.style.height = 'auto';
            clone.style.padding = '24px';
            clone.style.margin = '0';
            clone.style.border = 'none';
            clone.style.boxShadow = 'none';
            clone.style.background = '#ffffff';
            // html2canvas capture parfois une page blanche si la cible est sous le
            // body (z-index négatif) ou hors écran. On la place temporairement dans
            // une zone blanche visible, puis on la retire après la création du PDF.
            const zoneCapture = document.createElement('div');
            zoneCapture.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;overflow:auto;background:#ffffff;z-index:2147483647;pointer-events:none;';
            clone.style.position = 'relative';
            clone.style.left = 'auto';
            clone.style.top = 'auto';
            clone.style.zIndex = 'auto';
            clone.style.width = '720px';
            clone.style.maxWidth = 'none';
            clone.style.margin = '0 auto';
            clone.style.visibility = 'visible';
            clone.style.opacity = '1';
            const pdfPageContent = document.createElement('div');
            pdfPageContent.style.cssText = 'width:720px;max-width:720px;box-sizing:border-box;display:block;margin:0 auto;background:#fff;overflow:visible;';
            clone.style.margin = '0';
            pdfPageContent.appendChild(clone);
            zoneCapture.appendChild(pdfPageContent);
            document.body.appendChild(zoneCapture);
            try {
                // Copier les valeurs des champs dans le clone : cloneNode seul ne
                // conserve pas toujours la valeur courante des inputs sur mobile.
                const originaux = apercu.querySelectorAll('input, textarea, select');
                const copies = clone.querySelectorAll('input, textarea, select');
                originaux.forEach((el, i) => {
                    if (!copies[i]) return;
                    if (el.tagName === 'SELECT') copies[i].value = el.value;
                    else if (el.type === 'checkbox' || el.type === 'radio') copies[i].checked = el.checked;
                    else copies[i].value = el.value;
                    if (el.tagName === 'TEXTAREA') copies[i].textContent = el.value;
                });
                const options = {
                    margin: [8, 8, 8, 8],
                    filename: nomFichier,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, windowWidth: 720, logging: false, letterRendering: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'] }
                };
                const blob = await html2pdf().set(options).from(pdfPageContent).outputPdf('blob');
                if (!blob || blob.size < 1000) throw new Error('Le PDF généré est vide ou trop petit.');
                const file = new File([blob], nomFichier, { type: 'application/pdf' });
                if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
                    await navigator.share({ files: [file], title: (devis ? 'Devis ' : 'Facture ') + numero, text: message });
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = nomFichier;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 30000);
                    alert('Ce navigateur ne permet pas le partage direct de fichiers. Le PDF a été téléchargé : ouvrez-le puis utilisez Partager pour l’envoyer sur WhatsApp.');
                }
                // Le compteur avance après une génération réussie ou un partage accepté.
                enregistrerDocumentHistorique(devis, numero);
                if (devis) {
                    numeroDevisActuel++;
                    localStorage.setItem('pe_quote_num', String(numeroDevisActuel));
                    const suivant = getFormattedQuoteNumber(numeroDevisActuel);
                    document.getElementById('quote-number-input').value = suivant;
                    document.getElementById('preview-invoice-tag').innerText = 'DEVIS ' + suivant;
                } else {
                    numeroFactureActuel++;
                    localStorage.setItem('pe_invoice_num', String(numeroFactureActuel));
                    const suivant = getFormattedInvoiceNumber(numeroFactureActuel);
                    document.getElementById('invoice-number-input').value = suivant;
                    document.getElementById('preview-invoice-tag').innerText = 'FACTURE ' + suivant;
                }
            } catch (err) {
                if (err && err.name !== 'AbortError') {
                    console.error('Erreur de partage PDF :', err);
                    alert("Impossible de préparer le partage du PDF. Réessayez ou utilisez « Générer le PDF ».");
                }
            } finally {
                zoneCapture.remove();
            }
        }

        function lireNombreDepuisTexte(texte) {
            const nettoye = String(texte || '').replace(/[^0-9,.-]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
            const n = Number(nettoye); return Number.isFinite(n) ? n : 0;
        }
        function enregistrerDocumentHistorique(estDevis, numero) {
            const key = estDevis ? 'pe_devis' : 'pe_factures';
            const totalTexte = document.getElementById('cart-total')?.innerText || '0';
            const doc = {
                id: Date.now(), numero: String(numero || ''),
                client: document.getElementById('client-name').value.trim() || 'Client non précisé',
                note: document.getElementById('client-note').value.trim(),
                validite: document.getElementById('devis-validity')?.value || '',
                livraison: document.getElementById('devis-delivery')?.value || '',
                paiement: document.getElementById('devis-payment')?.value || '',
                devise: deviseActuelle, articles: panier.map(a => ({...a})),
                tvaActive: document.getElementById('tva-active').checked,
                tvaTaux: document.getElementById('tva-taux').value,
                statut: document.getElementById('invoice-status')?.value || '',
                total: lireNombreDepuisTexte(totalTexte), date: new Date().toISOString()
            };
            try {
                const liste = JSON.parse(localStorage.getItem(key) || '[]');
                const existant = liste.findIndex(x => String(x.numero) === doc.numero && String(x.client || '') === doc.client);
                if (existant >= 0) liste.splice(existant, 1);
                liste.unshift(doc);
                localStorage.setItem(key, JSON.stringify(liste));
                if (!estDevis) afficherHistoriqueFactures();
                else afficherHistoriqueDevis();
            } catch (e) { console.error('Historique non enregistré', e); }
        }
        function enregistrerFacture() {
            if (!panier.length) { alert('Ajoutez au moins un article avant d’enregistrer cette facture.'); return; }
            enregistrerDocumentHistorique(false);
            alert('Facture enregistrée sur cet appareil.');
        }
        function afficherHistoriqueFactures() {
            const zone = document.getElementById('factures-history'); if (!zone) return;
            let liste = [];
            try { liste = JSON.parse(localStorage.getItem('pe_factures') || '[]'); } catch(e) {}
            if (!liste.length) { zone.innerHTML = '<p class="text-slate-400 text-xs">Aucune facture enregistrée pour le moment.</p>'; return; }
            zone.innerHTML = liste.map(f => {
                const total = Number(f.total || 0).toLocaleString('fr-FR', {maximumFractionDigits:2});
                return `<div class="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2"><div class="min-w-0"><p class="font-semibold text-slate-800">${echapperHTML(f.numero)} · ${echapperHTML(f.client || 'Client')}</p><p class="text-xs text-slate-500">${f.date ? new Date(f.date).toLocaleDateString('fr-FR') : ''} · ${total} ${echapperHTML(f.devise || '')}</p></div><button onclick="chargerFactureHistorique(${Number(f.id)})" class="text-xs px-3 py-2 rounded bg-blue-100 text-blue-700 shrink-0">Ouvrir</button></div>`;
            }).join('');
        }
        function chargerFactureHistorique(id) {
            const f = (JSON.parse(localStorage.getItem('pe_factures') || '[]')).find(x => Number(x.id) === Number(id));
            if (!f) return;
            ouvrirOngletPesa('facture');
            changerMode('facture');
            panier = (f.articles || []).map(a => ({...a}));
            document.getElementById('client-name').value = f.client || '';
            document.getElementById('client-note').value = f.note || '';
            document.getElementById('tva-active').checked = !!f.tvaActive;
            document.getElementById('tva-taux').value = f.tvaTaux || '';
            document.getElementById('invoice-number-input').value = f.numero || getFormattedInvoiceNumber(numeroFactureActuel);
            deviseActuelle = f.devise || 'CDF';
            if (["CDF", "USD", "EURO", "FCFA"].includes(deviseActuelle)) { selectDevise.value = deviseActuelle; inputDeviseLibre.classList.add('hidden'); }
            else { selectDevise.value = 'AUTRE'; inputDeviseLibre.value = deviseActuelle; inputDeviseLibre.classList.remove('hidden'); }
            document.getElementById('preview-client').innerText = f.client || 'Client non précisé';
            actualiserNoteApercu();
            document.getElementById('preview-invoice-tag').innerText = 'FACTURE ' + (f.numero || '');
            mettreAJourTVA(); afficherPanier();
            alert('Facture chargée. Vérifiez les informations avant de générer à nouveau son PDF.');
        }

        function enregistrerDevis() {
            if (!panier.length) { alert('Ajoutez au moins un article avant d’enregistrer ce devis.'); return; }
            const devis = {
                id: Date.now(), numero: numeroDevisSaisi(),
                client: document.getElementById('client-name').value.trim(),
                note: document.getElementById('client-note').value.trim(),
                validite: document.getElementById('devis-validity').value,
                livraison: document.getElementById('devis-delivery').value.trim(),
                paiement: document.getElementById('devis-payment').value.trim(),
                devise: deviseActuelle, articles: panier.map(a => ({...a})),
                tvaActive: document.getElementById('tva-active').checked,
                tvaTaux: document.getElementById('tva-taux').value,
                date: new Date().toISOString()
            };
            const liste = JSON.parse(localStorage.getItem('pe_devis') || '[]');
            liste.unshift(devis);
            localStorage.setItem('pe_devis', JSON.stringify(liste));
            numeroDevisActuel++;
            localStorage.setItem('pe_quote_num', numeroDevisActuel);
            document.getElementById('quote-number-input').value = getFormattedQuoteNumber(numeroDevisActuel);
            document.getElementById('preview-invoice-tag').innerText = 'DEVIS ' + getFormattedQuoteNumber(numeroDevisActuel);
            afficherHistoriqueDevis();
            alert('Devis enregistré sur cet appareil. Il restera disponible dans ce navigateur.');
        }
        function afficherHistoriqueDevis() {
            const zone = document.getElementById('devis-history');
            if (!zone) return;
            const liste = JSON.parse(localStorage.getItem('pe_devis') || '[]');
            if (!liste.length) { zone.innerHTML = '<p class="text-slate-400 text-xs">Aucun devis enregistré pour le moment.</p>'; return; }
            zone.innerHTML = liste.map(d => `<div class="border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2"><div class="min-w-0"><p class="font-semibold text-slate-800">${echapperHTML(d.numero)} · ${echapperHTML(d.client || 'Client non précisé')}</p><p class="text-xs text-slate-500">${new Date(d.date).toLocaleDateString('fr-FR')} · ${d.articles.reduce((s,a)=>s+Number(a.qte)*Number(a.prix),0).toLocaleString()} ${echapperHTML(d.devise)}</p></div><div class="flex gap-1 shrink-0"><button onclick="chargerDevis(${d.id})" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Ouvrir</button><button onclick="convertirDevisEnFacture(${d.id})" class="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Facture</button></div></div>`).join('');
        }
        function echapperHTML(val) { return String(val ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
        function chargerDevis(id) {
            const d = (JSON.parse(localStorage.getItem('pe_devis') || '[]')).find(x => x.id === id);
            if (!d) return;
            changerMode('devis');
            panier = d.articles.map(a => ({...a}));
            document.getElementById('client-name').value = d.client || '';
            document.getElementById('client-note').value = d.note || '';
            document.getElementById('devis-validity').value = d.validite || '';
            document.getElementById('devis-delivery').value = d.livraison || '';
            document.getElementById('devis-payment').value = d.paiement || '';
            document.getElementById('tva-active').checked = !!d.tvaActive;
            document.getElementById('tva-taux').value = d.tvaTaux || '';
            deviseActuelle = d.devise || 'CDF';
            if (["CDF", "USD", "EURO", "FCFA"].includes(deviseActuelle)) { selectDevise.value = deviseActuelle; inputDeviseLibre.classList.add('hidden'); }
            else { selectDevise.value = 'AUTRE'; inputDeviseLibre.value = deviseActuelle; inputDeviseLibre.classList.remove('hidden'); }
            document.getElementById('preview-client').innerText = d.client || 'Client non précisé';
            document.getElementById('preview-note-text').innerText = d.note || '';
            actualiserNoteApercu();
            document.getElementById('quote-number-input').value = d.numero;
            document.getElementById('preview-invoice-tag').innerText = 'DEVIS ' + d.numero;
            mettreAJourTVA(); afficherPanier(); synchroniserApercuDocument();
        }
        function convertirDevisEnFacture(id) {
            const d = (JSON.parse(localStorage.getItem('pe_devis') || '[]')).find(x => x.id === id);
            if (!d) return;
            changerMode('facture');
            panier = d.articles.map(a => ({...a}));
            document.getElementById('client-name').value = d.client || '';
            document.getElementById('client-note').value = d.note || '';
            document.getElementById('devis-validity').value = '';
            document.getElementById('devis-delivery').value = '';
            document.getElementById('devis-payment').value = '';
            document.getElementById('tva-active').checked = !!d.tvaActive;
            document.getElementById('tva-taux').value = d.tvaTaux || '';
            deviseActuelle = d.devise || 'CDF';
            if (["CDF", "USD", "EURO", "FCFA"].includes(deviseActuelle)) { selectDevise.value = deviseActuelle; inputDeviseLibre.classList.add('hidden'); }
            else { selectDevise.value = 'AUTRE'; inputDeviseLibre.value = deviseActuelle; inputDeviseLibre.classList.remove('hidden'); }
            document.getElementById('preview-client').innerText = d.client || 'Client non précisé';
            document.getElementById('invoice-number-input').value = getFormattedInvoiceNumber(numeroFactureActuel);
            document.getElementById('preview-invoice-tag').innerText = 'FACTURE ' + getFormattedInvoiceNumber(numeroFactureActuel);
            mettreAJourTVA(); afficherPanier(); synchroniserApercuDocument();
            alert('Le devis a été chargé comme nouvelle facture. Vérifiez les informations avant de générer le PDF. Le devis original est conservé.');
        }

        changerStatut();
        changerMode('facture');
        mettreAJourTVA();
        afficherHistoriqueDevis();
        afficherHistoriqueFactures();
