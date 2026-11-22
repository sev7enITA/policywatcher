# Note per revisione Apple/TestFlight — bozza

**Non inviata.** Versione 0.1.0 (1), app `online.policywatcher.safari`, estensione `online.policywatcher.safari.Extension`. Runtime condiviso 3.8.3.3. Non sono richiesti account dell'app, abbonamenti o acquisti in-app. Contatto del publisher, team Apple e titolarità degli identificativi devono essere completati dal publisher prima dell'upload; non sono inventati in questo kit.

L'app iOS contiene l'estensione Safari e una guida locale EN/IT. Avvia l'app, poi cerca Safari in Impostazioni, apri Estensioni e abilita PolicyWatcher. In alternativa usa il menu Altro/Pagina di Safari > Estensioni. Concedi soltanto l'accesso richiesto per la pagina pubblica da verificare.

Usa la notifica sintetica inclusa, mai una casella personale, un'email riservata o un documento reale di un cliente. In Safari richiama l'estensione, leggi l'informativa e continua. Analizza il testo selezionato/la notifica visibile oppure usa l'inserimento manuale. Prima dell'invio controlla organizzazione, dominio mittente, URL ufficiale, categorie e date. Il testo grezzo non fa parte della richiesta. L'accesso temporaneo alla pagina parte da un gesto dell'utente; non esistono uno script persistente su tutti i siti o API della casella di posta.

La destinazione prevista è `https://policywatcher.online/api/policy-inquiries`. L'invio degli indizi confermati è un'operazione primaria del prodotto e può creare una pratica di revisione; non approva automaticamente fonti o scansioni. Prima dei test esterni il publisher deve approvare destinazione e fixture. Questo audit non ha inviato richieste di produzione.

I risultati distinguono confronti pubblicati, organizzazione monitorata senza confronto pubblicato, indizi ambigui/in conflitto e coda di revisione umana. Offline, rate limit e indisponibilità dello storage hanno esiti espliciti. La copertura è configurata e incompleta; non è consulenza legale, certificazione o garanzia di rilevamento completo.

L'estensione non seleziona Engine 6. Il sito pubblico usa la stabile 5.5.0; Engine 6 Preview è un ambiente amministrativo distinto con risultati privati e non è necessario per revisionare questo client.

Prima dell'invio sostituire la bozza con la procedura effettivamente collaudata e allegare le ricevute finali. Il contenitore si avvia in un simulatore iPhone isolato, ma attivazione Safari, injection, permessi e query live complete non sono ancora qualificati. Usare TestFlight per la beta; la pubblicazione ordinaria su App Store richiede una fase successiva.
