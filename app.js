/* =========================================
   FASTREAM - APP.JS
   Versione 1.1
   ========================================= */

const DEFAULT_BASE_DOMAIN = "www.nomesitostreaming";
const STORAGE_KEY = "fastreamConfig";

/* ELEMENTI DELLA PAGINA */

const elements = {
    loading: document.getElementById("loadingScreen"),
    setup: document.getElementById("setupScreen"),
    success: document.getElementById("successScreen"),

    extension: document.getElementById("extensionInput"),
    connect: document.getElementById("connectBtn"),

    settings: document.getElementById("settingsBtn"),
    advanced: document.getElementById("advancedSettings"),

    fullUrl: document.getElementById("fullUrlInput"),
    baseDomain: document.getElementById("baseDomainInput"),

    saveSettings: document.getElementById("saveSettingsBtn"),
    closeSettings: document.getElementById("closeSettingsBtn"),

    error: document.getElementById("errorMessage")
};


/* CONFIGURAZIONE */

function loadConfig() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Errore lettura configurazione:", error);
    }

    return {
        baseDomain: DEFAULT_BASE_DOMAIN,
        extension: "",
        lastUrl: ""
    };
}

let config = loadConfig();


function saveConfig() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(config)
    );
}


/* GESTIONE SCHERMATE */

function showSetup() {
    if (elements.loading) {
        elements.loading.style.display = "none";
    }

    if (elements.success) {
        elements.success.style.display = "none";
    }

    if (elements.setup) {
        elements.setup.style.display = "block";
    }

    if (elements.extension) {
        elements.extension.value = config.extension || "";
    }
}


function showError(message) {
    if (!elements.error) {
        alert(message);
        return;
    }

    elements.error.textContent = message;
    elements.error.style.display = "block";
}


function hideError() {
    if (elements.error) {
        elements.error.style.display = "none";
    }
}


/* COSTRUZIONE INDIRIZZO */

function normalizeUrl(value) {
    let url = value.trim();

    if (!url) {
        return "";
    }

    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    try {
        const parsed = new URL(url);

        if (!parsed.hostname.includes(".")) {
            return "";
        }

        return parsed.href;
    } catch (error) {
        return "";
    }
}


function buildUrl() {
    const extension = elements.extension
        ? elements.extension.value.trim()
        : "";

    if (!extension) {
        return "";
    }

    const cleanExtension = extension
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/^\/+/, "");

    const base = config.baseDomain || DEFAULT_BASE_DOMAIN;

    return normalizeUrl(base + "." + cleanExtension);
}


/* APERTURA DIRETTA DEL SITO */

function openWebsite(url) {
    const validUrl = normalizeUrl(url);

    if (!validUrl) {
        showError("Inserisci un indirizzo valido.");
        return;
    }

    hideError();

    config.lastUrl = validUrl;
    saveConfig();

    window.location.assign(validUrl);
}


/* PULSANTE CONNETTI */

function connectDomain() {
    const url = buildUrl();

    if (!url) {
        showError("Inserisci un'estensione del dominio valida.");
        return;
    }

    config.extension = elements.extension.value.trim();

    saveConfig();

    openWebsite(url);
}


/* IMPOSTAZIONI AVANZATE */

function openAdvancedSettings() {
    if (elements.advanced) {
        elements.advanced.style.display = "block";
    }

    if (elements.baseDomain) {
        elements.baseDomain.value = config.baseDomain || DEFAULT_BASE_DOMAIN;
    }

    if (elements.fullUrl) {
        elements.fullUrl.value = config.lastUrl || "";
    }
}


function closeAdvancedSettings() {
    if (elements.advanced) {
        elements.advanced.style.display = "none";
    }
}


function saveAdvancedSettings() {
    const newBase = elements.baseDomain
        ? elements.baseDomain.value.trim()
        : "";

    const newUrl = elements.fullUrl
        ? elements.fullUrl.value.trim()
        : "";

    if (newBase) {
        config.baseDomain = newBase
            .replace(/^https?:\/\//i, "")
            .replace(/\/+$/, "");
    }

    if (newUrl) {
        const validUrl = normalizeUrl(newUrl);

        if (!validUrl) {
            showError("L'indirizzo completo non è valido.");
            return;
        }

        config.lastUrl = validUrl;
    }

    saveConfig();

    closeAdvancedSettings();

    showSetup();
}


/* EVENTI */

if (elements.connect) {
    elements.connect.addEventListener("click", connectDomain);
}

if (elements.extension) {
    elements.extension.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            connectDomain();
        }
    });
}

if (elements.settings) {
    elements.settings.addEventListener("click", openAdvancedSettings);
}

if (elements.closeSettings) {
    elements.closeSettings.addEventListener("click", closeAdvancedSettings);
}

if (elements.saveSettings) {
    elements.saveSettings.addEventListener("click", saveAdvancedSettings);
}


/* AVVIO FASTREAM */

function initializeFastream() {
    hideError();

    // Se esiste un indirizzo salvato,
    // aprilo direttamente senza verifiche preventive.

    if (config.lastUrl) {
        window.location.assign(config.lastUrl);
        return;
    }

    // Altrimenti mostra la schermata iniziale.

    showSetup();
}

initializeFastream();