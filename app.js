let panier = [];
        let modeDocument = 'facture';
        let currentDocumentCreatedAt = new Date().toISOString();

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
                ['nom','telephone','adresse','email','rccm','nif','logoBase64','cachet','signature','redacteur','couleur'].forEach(k=>{ if (typeof d[k] === 'string') CONFIG_BOUTIQUE[k] = d[k]; }); if(typeof d.qrFactures==='boolean')CONFIG_BOUTIQUE.qrFactures=d.qrFactures; if(typeof d.qrDevis==='boolean')CONFIG_BOUTIQUE.qrDevis=d.qrDevis;
                // Migration de l’ancien format local
                if (d.logo && !CONFIG_BOUTIQUE.logoBase64) CONFIG_BOUTIQUE.logoBase64 = d.logo;
            } catch (e) { console.warn('Identité entreprise locale illisible.', e); }
        }
        function appliquerCouleurEntreprise() {
            const c = CONFIG_BOUTIQUE.couleur || '#059669';
            document.documentElement.style.setProperty('--couleur-entreprise', c);
            document.querySelectorAll('button.bg-emerald-600,button.bg-emerald-700,button.bg-blue-600').forEach(b=>{b.style.backgroundColor=c;});
            document.querySelectorAll('button[class*="hover:bg-emerald-700"],button[class*="hover:bg-emerald-800"]').forEach(b=>b.style.setProperty('--tw-bg-opacity','1'));
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
            document.getElementById('entreprise-qr-factures').checked=CONFIG_BOUTIQUE.qrFactures===true; document.getElementById('entreprise-qr-devis').checked=CONFIG_BOUTIQUE.qrDevis===true;
            logoEntrepriseEnCours=CONFIG_BOUTIQUE.logoBase64||''; cachetEntrepriseEnCours=CONFIG_BOUTIQUE.cachet||''; signatureEntrepriseEnCours=CONFIG_BOUTIQUE.signature||'';
            actualiserApercuLogoEntreprise(); actualiserApercuImage('cachet',cachetEntrepriseEnCours); actualiserApercuImage('signature',signatureEntrepriseEnCours);
            document.getElementById('entreprise-settings-modal').classList.remove('hidden'); document.body.style.overflow='hidden';
        }
        function fermerParametresEntreprise(){document.getElementById('entreprise-settings-modal').classList.add('hidden');document.body.style.overflow='';}
        function actualiserApercuLogoEntreprise(){const img=document.getElementById('entreprise-logo-apercu'),statut=document.getElementById('entreprise-logo-statut'),retirer=document.getElementById('entreprise-logo-retirer');img.src=logoEntrepriseEnCours||'';img.classList.toggle('hidden',!logoEntrepriseEnCours);statut.textContent=logoEntrepriseEnCours?'Logo prêt à être enregistré.':'Aucun logo personnalisé sélectionné.';retirer.classList.toggle('hidden',!logoEntrepriseEnCours);}
        function actualiserApercuImage(type,data){const img=document.getElementById('entreprise-'+type+'-apercu'),btn=document.getElementById('entreprise-'+type+'-retirer');img.src=data||'';img.classList.toggle('hidden',!data);btn.classList.toggle('hidden',!data);}
        function connecterImageUpload(inputId,type){document.getElementById(inputId).addEventListener('change',function(e){const f=e.target.files&&e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){alert('Choisissez un fichier image.');e.target.value='';return;}if(f.size>2*1024*1024){alert('Chaque image doit faire 2 Mo maximum.');e.target.value='';return;}const r=new FileReader();r.onload=()=>{if(type==='logo')logoEntrepriseEnCours=String(r.result||'');else if(type==='cachet')cachetEntrepriseEnCours=String(r.result||'');else signatureEntrepriseEnCours=String(r.result||'');if(type==='logo')actualiserApercuLogoEntreprise();else actualiserApercuImage(type,type==='cachet'?cachetEntrepriseEnCours:signatureEntrepriseEnCours);};r.onerror=()=>alert('Impossible de lire cette image.');r.readAsDataURL(f);});}
        connecterImageUpload('entreprise-logo-fichier','logo'); connecterImageUpload('entreprise-cachet-fichier','cachet'); connecterImageUpload('entreprise-signature-fichier','signature');

        // Pavé de signature manuscrite : compatible tactile et souris.
        (function initialiserPaveSignature() {
            const canvas = document.getElementById('entreprise-signature-pavé');
            const effacer = document.getElementById('entreprise-signature-effacer-dessin');
            const utiliser = document.getElementById('entreprise-signature-utiliser-dessin');
            const statut = document.getElementById('entreprise-signature-statut-dessin');
            if (!canvas || !effacer || !utiliser || !statut) return;
            const ctx = canvas.getContext('2d');
            let dessinEnCours = false, dessinPresent = false, dernierPoint = null;
            function redimensionnerPave() {
                const rect = canvas.getBoundingClientRect();
                if (!rect.width) return;
                const ratio = Math.max(1, window.devicePixelRatio || 1);
                const ancien = dessinPresent ? canvas.toDataURL('image/png') : '';
                canvas.width = Math.round(rect.width * ratio);
                canvas.height = Math.round(150 * ratio);
                ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
                ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#172554';
                if (ancien) {
                    const image = new Image();
                    image.onload = () => ctx.drawImage(image, 0, 0, rect.width, 150);
                    image.src = ancien;
                }
            }
            function position(e) {
                const r = canvas.getBoundingClientRect();
                return { x: e.clientX - r.left, y: e.clientY - r.top };
            }
            canvas.addEventListener('pointerdown', e => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                e.preventDefault(); canvas.setPointerCapture?.(e.pointerId);
                dessinEnCours = true; dernierPoint = position(e);
                ctx.beginPath(); ctx.moveTo(dernierPoint.x, dernierPoint.y); ctx.lineTo(dernierPoint.x + 0.1, dernierPoint.y + 0.1); ctx.stroke();
                dessinPresent = true; statut.textContent = 'Signature en cours de dessin.';
            });
            canvas.addEventListener('pointermove', e => {
                if (!dessinEnCours || !dernierPoint) return;
                e.preventDefault(); const point = position(e);
                ctx.beginPath(); ctx.moveTo(dernierPoint.x, dernierPoint.y); ctx.lineTo(point.x, point.y); ctx.stroke();
                dernierPoint = point;
            });
            function terminerDessin() { dessinEnCours = false; dernierPoint = null; if (dessinPresent) statut.textContent = 'Dessin prêt. Appuyez sur « Utiliser cette signature » pour le valider.'; }
            canvas.addEventListener('pointerup', terminerDessin);
            canvas.addEventListener('pointercancel', terminerDessin);
            canvas.addEventListener('lostpointercapture', terminerDessin);
            effacer.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height); dessinPresent = false;
                statut.textContent = 'Dessin effacé. Vous pouvez recommencer.';
            });
            utiliser.addEventListener('click', () => {
                if (!dessinPresent) { alert('Dessinez d’abord votre signature dans le pavé.'); return; }
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = canvas.width; exportCanvas.height = canvas.height;
                const exportCtx = exportCanvas.getContext('2d');
                exportCtx.fillStyle = '#ffffff'; exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                exportCtx.drawImage(canvas, 0, 0);
                signatureEntrepriseEnCours = exportCanvas.toDataURL('image/png');
                document.getElementById('entreprise-signature-fichier').value = '';
                actualiserApercuImage('signature', signatureEntrepriseEnCours);
                statut.textContent = 'Signature ajoutée. Cliquez sur « Enregistrer » pour la conserver.';
            });
            window.addEventListener('resize', () => { if (!dessinEnCours) redimensionnerPave(); });
            if ('ResizeObserver' in window) new ResizeObserver(() => { if (!dessinEnCours) redimensionnerPave(); }).observe(canvas);
            // Le pavé peut être caché au chargement : ResizeObserver l'initialise à son ouverture.
            requestAnimationFrame(redimensionnerPave);
        })();
        document.getElementById('entreprise-logo-retirer').addEventListener('click',()=>{logoEntrepriseEnCours='';document.getElementById('entreprise-logo-fichier').value='';actualiserApercuLogoEntreprise();});
        ['cachet','signature'].forEach(t=>document.getElementById('entreprise-'+t+'-retirer').addEventListener('click',()=>{if(t==='cachet')cachetEntrepriseEnCours='';else signatureEntrepriseEnCours='';document.getElementById('entreprise-'+t+'-fichier').value='';actualiserApercuImage(t,'');}));
        document.getElementById('entreprise-settings-form').addEventListener('submit',function(event){
            event.preventDefault(); const fields={nom:'entreprise-nom',telephone:'entreprise-telephone',adresse:'entreprise-adresse',email:'entreprise-email',rccm:'entreprise-rccm',nif:'entreprise-nif',redacteur:'entreprise-redacteur'}; const d={};
            Object.entries(fields).forEach(([k,id])=>d[k]=document.getElementById(id).value.trim());
            Object.assign(d,{logoBase64:logoEntrepriseEnCours,cachet:cachetEntrepriseEnCours,signature:signatureEntrepriseEnCours,couleur:document.getElementById('entreprise-couleur').value||'#059669',qrFactures:document.getElementById('entreprise-qr-factures').checked,qrDevis:document.getElementById('entreprise-qr-devis').checked});
            try{localStorage.setItem(ENTREPRISE_STORAGE_KEY,JSON.stringify(d));}catch(e){alert('Impossible d’enregistrer. Réduisez la taille des images et réessayez.');return;}
            Object.assign(CONFIG_BOUTIQUE,d); actualiserEnteteEntreprise(); actualiserCodeQR(); fermerParametresEntreprise();
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
            if (event.key === 'Escape') { fermerAProposPesa(); fermerParametresEntreprise(); fermerHistoriqueDocuments(); }
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
                tva:checked('tva-active'), tauxTVA:val('tva-taux'), deduction:checked('deduction-active'), tauxDeduction:val('deduction-taux'), nomDeduction:val('deduction-nom'),
                validite:val('devis-validity'), livraison:val('devis-delivery'), paiement:val('devis-payment'), statut:val('statut-select'), garantie:val('facture-garantie'), createdAt:currentDocumentCreatedAt,
                numeroFacture:val('invoice-number-input'), numeroDevis:val('quote-number-input') };
        }
        function restaurerEtatDocument(etat, mode) {
            const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined)e.value=v;};
            panier = etat?.panier ? etat.panier.map(a=>({...a})) : [];
            set('client-name',etat?.client||''); set('client-note',etat?.note||'');
            set('devis-validity',etat?.validite||''); set('devis-delivery',etat?.livraison||''); set('devis-payment',etat?.paiement||''); set('facture-garantie',etat?.garantie||''); currentDocumentCreatedAt=etat?.createdAt||new Date().toISOString();
            set('statut-select',etat?.statut||'PAYÉ');
            document.getElementById('tva-active').checked=!!etat?.tva; set('tva-taux',etat?.tauxTVA||'');
            if(document.getElementById('deduction-active')) document.getElementById('deduction-active').checked=!!etat?.deduction;
            set('deduction-taux',etat?.tauxDeduction||''); set('deduction-nom',etat?.nomDeduction||'');
            document.getElementById('deduction-options')?.classList.toggle('hidden',!etat?.deduction);
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
            document.getElementById('garantie-wrap')?.classList.toggle('hidden',devis);
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

        function dateLisibleDocument(iso){const d=new Date(iso||Date.now());return Number.isNaN(d.getTime())?new Date().toLocaleDateString('fr-FR'):d.toLocaleDateString('fr-FR');}
        function donneesQRDocument(){
            const devis=modeDocument==='devis'; const numero=(document.getElementById(devis?'quote-number-input':'invoice-number-input')?.value||'').trim();
            const total=document.getElementById('cart-total')?.innerText||'0 '+deviseActuelle;
            const d={type:devis?'DEVIS':'FACTURE',entreprise:CONFIG_BOUTIQUE.nom||'Entreprise',telephone:CONFIG_BOUTIQUE.telephone||'',email:CONFIG_BOUTIQUE.email||'',adresse:CONFIG_BOUTIQUE.adresse||'',numero:numero,client:document.getElementById('client-name')?.value.trim()||'Client non précisé',date_creation:currentDocumentCreatedAt,date_emission:dateLisibleDocument(currentDocumentCreatedAt),montant:total,devise:deviseActuelle};
            if(devis){d.date_expiration=document.getElementById('devis-validity')?.value||'';}else{d.statut_paiement=document.getElementById('statut-select')?.value||'ATTENTE';d.garantie=document.getElementById('facture-garantie')?.value.trim()||'';}
            return d;
        }
        function actualiserCodeQR(){
            const actif=modeDocument==='devis'?CONFIG_BOUTIQUE.qrDevis===true:CONFIG_BOUTIQUE.qrFactures===true;
            const wrap=document.getElementById('preview-qr-wrap'),img=document.getElementById('preview-qr-image'); if(!wrap||!img)return;
            if(!actif){wrap.classList.add('hidden');img.removeAttribute('src');return;}
            try{if(typeof QRCodeOffline!=='function')throw new Error('Moteur QR indisponible');
                const qr=new QRCodeOffline(0,1);
                const texteQR=JSON.stringify(donneesQRDocument()); const texteUTF8=unescape(encodeURIComponent(texteQR)); qr.addData(texteUTF8);qr.make();
                const n=qr.getModuleCount(),cell=5,margin=4,size=(n+margin*2)*cell,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
                const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.fillStyle='#000';
                for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect((c+margin)*cell,(r+margin)*cell,cell,cell);
                img.src=canvas.toDataURL('image/png');wrap.classList.remove('hidden');
            }catch(e){console.error('Génération QR impossible',e);wrap.classList.add('hidden');}
        }
        function actualiserGarantieApercu(){const v=document.getElementById('facture-garantie')?.value.trim()||'';const w=document.getElementById('preview-warranty');const t=document.getElementById('preview-warranty-text');if(w&&t){t.textContent=v;w.classList.toggle('hidden',!v||modeDocument==='devis');}}

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
            actualiserNoteApercu(); actualiserCodeQR(); actualiserGarantieApercu();
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
                actualiserNoteApercu(); actualiserCodeQR(); actualiserGarantieApercu();
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
        document.getElementById('preview-date').innerText = dateLisibleDocument(currentDocumentCreatedAt);

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
            if(typeof actualiserCodeQR==='function')actualiserCodeQR();
        }

        // Prépare une capture PDF indépendante de la largeur de l'écran.
        // La surface capturée correspond à la largeur complète d'une page A4.
        // Le padding intérieur symétrique assure la marge visuelle et le centrage.
        async function creerBlobDocumentPDF(apercu, nomFichier) {
            const clone = apercu.cloneNode(true);
            const noteOriginale = document.getElementById('preview-note-text');
            const noteClone = clone.querySelector('#preview-note-text');
            const noteContainerClone = clone.querySelector('#preview-note-container');
            if (noteClone && noteOriginale) {
                noteClone.textContent = noteOriginale.textContent;
                noteClone.style.whiteSpace = 'pre-line';
                noteClone.style.lineHeight = '1.6';
            }
            if (noteContainerClone) noteContainerClone.classList.toggle('hidden', !noteClone || !noteClone.textContent.trim());
            clone.querySelectorAll('.no-print').forEach(el => el.remove());

            // Les champs HTML ne conservent pas toujours leur valeur courante avec cloneNode.
            const originaux = apercu.querySelectorAll('input, textarea, select');
            const copies = clone.querySelectorAll('input, textarea, select');
            originaux.forEach((el, i) => {
                if (!copies[i]) return;
                if (el.type === 'checkbox' || el.type === 'radio') copies[i].checked = el.checked;
                else copies[i].value = el.value;
                if (el.tagName === 'TEXTAREA') copies[i].textContent = el.value;
            });

            // Largeur complète d'une page A4 à 96 dpi (210 mm ≈ 794 px).
            // On capture la page entière sans marge PDF externe : cela évite
            // le double calcul largeur/marges qui pouvait décaler le contenu.
            const largeurCapture = 794;
            const zone = document.createElement('div');
            zone.setAttribute('aria-hidden', 'true');
            zone.style.cssText = `position:fixed!important;left:0!important;top:0!important;width:${largeurCapture}px!important;min-width:${largeurCapture}px!important;max-width:${largeurCapture}px!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;z-index:2147483647!important;pointer-events:none!important;transform:none!important;direction:ltr!important;`;
            clone.style.cssText += `;display:block!important;box-sizing:border-box!important;width:${largeurCapture}px!important;min-width:${largeurCapture}px!important;max-width:${largeurCapture}px!important;height:auto!important;min-height:0!important;padding:32px!important;margin:0!important;border:0;border-radius:0;box-shadow:none;background:#fff;position:relative;left:auto;top:auto;right:auto;transform:none;overflow:visible;visibility:visible;opacity:1;`;
            clone.querySelectorAll('.overflow-x-auto').forEach(el => {
                el.style.overflow = 'visible';
                el.style.maxWidth = 'none';
            });
            clone.style.textAlign = 'left';
            clone.style.alignItems = 'stretch';
            zone.appendChild(clone);
            document.body.appendChild(zone);

            try {
                if (document.fonts && document.fonts.ready) await document.fonts.ready;
                const images = Array.from(clone.querySelectorAll('img'));
                await Promise.all(images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                }));
                const options = {
                    // La capture fait déjà exactement la largeur A4 (210 mm).
                    // Pas de marges externes ici : les 32 px de padding du clone
                    // créent des marges égales à gauche et à droite dans le PDF.
                    margin: 0,
                    filename: nomFichier,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        scrollX: 0,
                        scrollY: 0,
                        x: 0,
                        y: 0,
                        width: largeurCapture,
                        windowWidth: largeurCapture,
                        logging: false,
                        letterRendering: true
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                    // Évite les sauts CSS hérités du navigateur dans le clone.
                    pagebreak: { mode: [], avoid: ['tr', 'img'] }
                };
                const blob = await html2pdf().set(options).from(clone).outputPdf('blob');
                if (!blob || blob.size < 1000) throw new Error('Le PDF généré est vide ou trop petit.');
                return blob;
            } finally {
                zone.remove();
            }
        }

        async function telechargerPDF() {
            actualiserCodeQR(); actualiserGarantieApercu();
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
            actualiserNoteApercu();
            let blob;
            try {
                blob = await creerBlobDocumentPDF(apercu, nomFichier);
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
            actualiserCodeQR(); actualiserGarantieApercu();
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
            actualiserNoteApercu();
            let blob;
            try {
                blob = await creerBlobDocumentPDF(apercu, nomFichier);
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
                id: Date.now(), numero: String(numero || ''), createdAt: currentDocumentCreatedAt, garantie: document.getElementById('facture-garantie')?.value.trim() || '',
                client: document.getElementById('client-name').value.trim() || 'Client non précisé',
                note: document.getElementById('client-note').value.trim(),
                validite: document.getElementById('devis-validity')?.value || '',
                livraison: document.getElementById('devis-delivery')?.value || '',
                paiement: document.getElementById('devis-payment')?.value || '',
                devise: deviseActuelle, articles: panier.map(a => ({...a})),
                tvaActive: document.getElementById('tva-active').checked,
                tvaTaux: document.getElementById('tva-taux').value,
                statut: document.getElementById('statut-select')?.value || 'PAYÉ',
                deductionActive: !!document.getElementById('deduction-active')?.checked,
                deductionTaux: document.getElementById('deduction-taux')?.value || '',
                deductionNom: document.getElementById('deduction-nom')?.value || '',
                total: lireNombreDepuisTexte(totalTexte), date: currentDocumentCreatedAt,
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
        let typeHistoriqueOuvert = 'facture';
        let pageHistoriqueDocuments = 0;
        const TAILLE_PAGE_HISTORIQUE = 20;
        function ouvrirHistoriqueDocuments(type) {
            typeHistoriqueOuvert = type === 'devis' ? 'devis' : 'facture';
            const modal = document.getElementById('documents-history-modal');
            const titre = document.getElementById('documents-history-title');
            const sousTitre = document.getElementById('documents-history-subtitle');
            const recherche = document.getElementById('documents-history-search');
            if (!modal || !titre || !recherche) {
                throw new Error('Éléments de la fenêtre historique introuvables.');
            }
            titre.textContent = typeHistoriqueOuvert === 'devis' ? 'Mes devis' : 'Mes factures';
            if (sousTitre) sousTitre.textContent = 'Les 20 documents les plus récents sont affichés. La recherche parcourt tout l’historique.';
            recherche.value = '';
            pageHistoriqueDocuments = 0;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            afficherHistoriqueFactures();
            afficherHistoriqueDevis();
            afficherListeHistoriqueDocuments();
            setTimeout(() => recherche.focus(), 80);
        }
        window.ouvrirHistoriqueDocuments = ouvrirHistoriqueDocuments;
        function fermerHistoriqueDocuments() {
            const modal = document.getElementById('documents-history-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        }
        function donneesHistoriqueDocuments(type) {
            const key = type === 'devis' ? 'pe_devis' : 'pe_factures';
            try {
                const liste = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(liste) ? liste.slice().sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) : [];
            } catch (e) { console.error('Historique illisible :', e); return []; }
        }
        function calculerTotalDocumentHistorique(doc) {
            if (Number.isFinite(Number(doc.total)) && doc.total !== undefined && doc.total !== null) return Number(doc.total);
            return (doc.articles || []).reduce((s,a) => s + Number(a.qte || 0) * Number(a.prix || 0), 0);
        }
        function afficherListeHistoriqueDocuments() {
            const zone = document.getElementById('documents-history-list');
            const recherche = document.getElementById('documents-history-search');
            const compteur = document.getElementById('documents-history-count');
            if (!zone) return;
            const type = typeHistoriqueOuvert;
            const listeComplete = donneesHistoriqueDocuments(type);
            const normaliserRecherche = valeur => String(valeur ?? '').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const terme = normaliserRecherche(recherche?.value || '').trim();
            const correspondants = terme ? listeComplete.filter(doc => {
                const total = calculerTotalDocumentHistorique(doc);
                const date = doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : '';
                const champs = [doc.numero, doc.client, date, total, total.toLocaleString('fr-FR'), doc.devise, (doc.articles || []).map(a => a.nom || a.article || a.designation || '').join(' ')];
                return normaliserRecherche(champs.join(' ')).includes(terme);
            }) : listeComplete;
            const nombrePages = Math.max(1, Math.ceil(correspondants.length / TAILLE_PAGE_HISTORIQUE));
            pageHistoriqueDocuments = Math.min(pageHistoriqueDocuments, nombrePages - 1);
            const debut = pageHistoriqueDocuments * TAILLE_PAGE_HISTORIQUE;
            const affiches = correspondants.slice(debut, debut + TAILLE_PAGE_HISTORIQUE);
            if (compteur) compteur.textContent = terme
                ? `${correspondants.length} résultat(s) trouvé(s) · ${affiches.length} affiché(s)`
                : `${listeComplete.length} document(s) enregistré(s) · 20 affichés au maximum par page`;
            const precedent = document.getElementById('documents-history-prev');
            const suivant = document.getElementById('documents-history-next');
            const pageLabel = document.getElementById('documents-history-page');
            const pagination = document.getElementById('documents-history-pagination');
            if (precedent) precedent.disabled = pageHistoriqueDocuments <= 0;
            if (suivant) suivant.disabled = pageHistoriqueDocuments >= nombrePages - 1;
            if (pageLabel) pageLabel.textContent = `${pageHistoriqueDocuments + 1} / ${nombrePages}`;
            if (pagination) pagination.classList.toggle('invisible', nombrePages <= 1);
            if (!affiches.length) {
                zone.innerHTML = `<div class="text-center py-10"><p class="text-2xl mb-2">🔎</p><p class="text-sm font-semibold text-slate-700">${terme ? 'Aucun document correspondant' : 'Aucun document enregistré pour le moment.'}</p><p class="text-xs text-slate-400 mt-1">${terme ? 'Essayez un autre numéro, nom de client, date ou montant.' : 'Vos documents enregistrés apparaîtront ici.'}</p></div>`;
                return;
            }
            zone.innerHTML = affiches.map(doc => {
                const total = calculerTotalDocumentHistorique(doc).toLocaleString('fr-FR', {maximumFractionDigits:2});
                const date = doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : '';
                const id = Number(doc.id);
                const boutonPrincipal = type === 'devis'
                    ? `<div class="flex gap-1 shrink-0"><button onclick="chargerDevis(${id})" class="text-xs px-3 py-2 rounded-lg bg-blue-100 text-blue-700">Ouvrir</button><button onclick="convertirDevisEnFacture(${id})" class="text-xs px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700">Facture</button></div>`
                    : `<button onclick="chargerFactureHistorique(${id})" class="text-xs px-3 py-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">Ouvrir</button>`;
                return `<div class="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2"><div class="min-w-0"><p class="font-semibold text-slate-800 truncate">${echapperHTML(doc.numero || '')} · ${echapperHTML(doc.client || 'Client non précisé')}</p><p class="text-xs text-slate-500 mt-1">${date} · ${total} ${echapperHTML(doc.devise || '')}</p></div>${boutonPrincipal}</div>`;
            }).join('');
        }
        function changerPageHistoriqueDocuments(decalage) {
            pageHistoriqueDocuments = Math.max(0, pageHistoriqueDocuments + Number(decalage || 0));
            afficherListeHistoriqueDocuments();
            document.getElementById('documents-history-list')?.scrollTo({top: 0, behavior: 'smooth'});
        }
        function afficherHistoriqueFactures() {
            // L’historique complet reste dans localStorage ; seule la fenêtre en affiche 20 à la fois.
            const zone = document.getElementById('factures-history');
            if (zone) zone.innerHTML = '';
            if (typeHistoriqueOuvert === 'facture' && !document.getElementById('documents-history-modal')?.classList.contains('hidden')) afficherListeHistoriqueDocuments();
        }
        function appliquerDocumentHistorique(doc, mode) {
            if (!doc || (mode !== 'facture' && mode !== 'devis')) return false;

            // IMPORTANT : basculer d'abord l'interface dans le bon mode. Ensuite seulement,
            // injecter les données historiques afin qu'aucune restauration d'état ne les écrase.
            if (modeDocument !== mode) changerMode(mode);

            const valeur = (id, v) => {
                const el = document.getElementById(id);
                if (el) el.value = v == null ? '' : String(v);
            };
            const coche = (id, v) => {
                const el = document.getElementById(id);
                if (el) el.checked = !!v;
            };

            modeDocument = mode;
            panier = Array.isArray(doc.articles) ? doc.articles.map(a => ({ ...a })) : [];

            valeur('client-name', doc.client || '');
            valeur('client-note', doc.note || '');
            valeur('devis-validity', mode === 'devis' ? (doc.validite || '') : '');
            valeur('devis-delivery', mode === 'devis' ? (doc.livraison || '') : '');
            valeur('devis-payment', mode === 'devis' ? (doc.paiement || '') : ''); valeur('facture-garantie', mode === 'facture' ? (doc.garantie || '') : ''); currentDocumentCreatedAt=doc.createdAt||doc.date||new Date().toISOString();
            const dateEl=document.getElementById('preview-date'); if(dateEl)dateEl.textContent=dateLisibleDocument(currentDocumentCreatedAt);
            valeur(mode === 'devis' ? 'quote-number-input' : 'invoice-number-input',
                doc.numero || (mode === 'devis' ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel)));

            deviseActuelle = doc.devise || 'CDF';
            if (selectDevise && inputDeviseLibre) {
                if (['CDF', 'USD', 'EURO', 'FCFA'].includes(deviseActuelle)) {
                    selectDevise.value = deviseActuelle;
                    inputDeviseLibre.value = '';
                    inputDeviseLibre.classList.add('hidden');
                } else {
                    selectDevise.value = 'AUTRE';
                    inputDeviseLibre.value = deviseActuelle;
                    inputDeviseLibre.classList.remove('hidden');
                }
            }

            coche('tva-active', doc.tvaActive);
            valeur('tva-taux', doc.tvaTaux || '');
            coche('deduction-active', doc.deductionActive);
            valeur('deduction-taux', doc.deductionTaux || '');
            valeur('deduction-nom', doc.deductionNom || '');
            document.getElementById('deduction-options')?.classList.toggle('hidden', !doc.deductionActive);

            // Le statut n'a de sens que pour une facture. Un devis reste un devis.
            valeur('statut-select', mode === 'devis' ? 'PAYÉ' :
                (['PAYÉ', 'CRÉDIT', 'ATTENTE'].includes(doc.statut) ? doc.statut : 'PAYÉ'));

            // Synchronisation complète formulaire / lignes / montants / aperçu.
            document.getElementById('preview-client').textContent = doc.client || 'Comptant / Client de passage';
            document.getElementById('preview-invoice-tag').textContent =
                (mode === 'devis' ? 'DEVIS ' : 'FACTURE ') +
                (doc.numero || (mode === 'devis' ? getFormattedQuoteNumber(numeroDevisActuel) : getFormattedInvoiceNumber(numeroFactureActuel)));
            document.getElementById('preview-badge-statut')?.classList.toggle('hidden', mode === 'devis');
            if (mode !== 'devis' && typeof changerStatut === 'function') changerStatut();
            actualiserLibelleTotal();
            if (typeof mettreAJourTVA === 'function') mettreAJourTVA();
            if (typeof mettreAJourDeduction === 'function') mettreAJourDeduction();
            afficherPanier();
            actualiserNoteApercu();
            synchroniserApercuDocument();

            // Mémoriser le document chargé comme état courant, pas comme brouillon précédent.
            etatsDocuments[mode] = capturerEtatDocument();
            return true;
        }

        function chargerFactureHistorique(id) {
            const f = donneesHistoriqueDocuments('facture').find(x => Number(x.id) === Number(id));
            if (!f) return;
            fermerHistoriqueDocuments();
            ouvrirOngletPesa('facture');
            appliquerDocumentHistorique(f, 'facture');
        }

        function enregistrerDevis() {
            if (!panier.length) { alert('Ajoutez au moins un article avant d’enregistrer ce devis.'); return; }
            const devis = {
                id: Date.now(), numero: numeroDevisSaisi(), createdAt: currentDocumentCreatedAt,
                client: document.getElementById('client-name').value.trim(),
                note: document.getElementById('client-note').value.trim(),
                validite: document.getElementById('devis-validity').value,
                livraison: document.getElementById('devis-delivery').value.trim(),
                paiement: document.getElementById('devis-payment').value.trim(),
                devise: deviseActuelle, articles: panier.map(a => ({...a})),
                tvaActive: document.getElementById('tva-active').checked,
                tvaTaux: document.getElementById('tva-taux').value,
                deductionActive: !!document.getElementById('deduction-active')?.checked,
                deductionTaux: document.getElementById('deduction-taux')?.value || '',
                deductionNom: document.getElementById('deduction-nom')?.value || '',
                date: currentDocumentCreatedAt
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
            // Les devis restent tous conservés ; l’affichage détaillé se fait dans la fenêtre dédiée.
            const zone = document.getElementById('devis-history');
            if (zone) zone.innerHTML = '';
            if (typeHistoriqueOuvert === 'devis' && !document.getElementById('documents-history-modal')?.classList.contains('hidden')) afficherListeHistoriqueDocuments();
        }
        function echapperHTML(val) { return String(val ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
        function chargerDevis(id) {
            const d = donneesHistoriqueDocuments('devis').find(x => Number(x.id) === Number(id));
            if (!d) return;
            fermerHistoriqueDocuments();
            ouvrirOngletPesa('devis');
            appliquerDocumentHistorique(d, 'devis');
        }
        function convertirDevisEnFacture(id) {
            const d = donneesHistoriqueDocuments('devis').find(x => Number(x.id) === Number(id));
            if (!d) return;
            fermerHistoriqueDocuments();
            ouvrirOngletPesa('facture');
            const nouvelleFacture = {
                ...d,
                numero: getFormattedInvoiceNumber(numeroFactureActuel),
                validite: '', livraison: '', paiement: '',
                statut: 'ATTENTE',
                id: Date.now(), createdAt: new Date().toISOString()
            };
            appliquerDocumentHistorique(nouvelleFacture, 'facture');
            document.getElementById('statut-select').value = 'ATTENTE';
            changerStatut();
            etatsDocuments.facture = capturerEtatDocument();
        }



        ['client-name','invoice-number-input','quote-number-input','statut-select','facture-garantie','devis-validity'].forEach(id=>{const el=document.getElementById(id);if(el){el.addEventListener('input',()=>{actualiserCodeQR();actualiserGarantieApercu();});el.addEventListener('change',()=>{actualiserCodeQR();actualiserGarantieApercu();});}});
                document.getElementById('documents-history-search')?.addEventListener('input', function(){ pageHistoriqueDocuments = 0; afficherListeHistoriqueDocuments(); });

        // Expose explicitement les fonctions appelées depuis les boutons HTML.
        // Cela évite les problèmes de résolution des gestionnaires inline selon le navigateur.
        window.ouvrirHistoriqueDocuments = ouvrirHistoriqueDocuments;
        window.fermerHistoriqueDocuments = fermerHistoriqueDocuments;
        window.changerPageHistoriqueDocuments = changerPageHistoriqueDocuments;
        window.chargerFactureHistorique = chargerFactureHistorique;
        window.chargerDevis = chargerDevis;
        window.convertirDevisEnFacture = convertirDevisEnFacture;

        changerStatut();
        changerMode('facture');
        mettreAJourTVA();
        afficherHistoriqueDevis();
        afficherHistoriqueFactures();
