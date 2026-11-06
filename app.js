const DEFAULT_BASE = "www.nomesitostreaming";

const STORAGE_KEY = "fastream_config";

const elements = {
    loading: document.getElementById("loadingScreen"),
    setup: document.getElementById("setupScreen"),
    success: document.getElementById("successScreen"),

    form: document.getElementById("domainForm"),

    extension: document.getElementById("extensionInput"),
    prefix: document.getElementById("domainPrefix"),

    advanced: document.getElementById("advancedPanel"),
    advancedButton: document.getElementById("advancedButton"),

    fullDomain: document.getElementById("fullDomainInput"),
    baseDomain: document.getElementById("baseDomainInput"),

    saveAdvanced: document.getElementById("saveAdvancedButton"),

    settings: document.getElementById("settingsButton"),

    error: document.getElementById("errorMessage"),
    connect: document.querySelector(".connect-button")
};

function getConfig() {

    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        return null;
    }

}

function saveConfig(config) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(config)
    );

}

function showScreen(screen) {

    elements.loading.classList.add("hidden");
    elements.setup.classList.add("hidden");
    elements.success.classList.add("hidden");

    screen.classList.remove("hidden");

}

function showError(message) {

    elements.error.textContent = message;

}

function normalizeUrl(value) {

    let url;

    try {

        url = new URL(
            value.includes("://")
                ? value
                : "https://" + value
        );

    } catch {

        return null;

    }

    if (!["http:", "https:"].includes(url.protocol)) {
        return null;
    }

    if (!url.hostname || !url.hostname.includes(".")) {
        return null;
    }

    if (url.username || url.password) {
        return null;
    }

    return url.href;

}

function buildUrl(base, extension) {

    return normalizeUrl(
        `https://${base}.${extension}`
    );

}

/*
  Verifica best-effort della raggiungibilità.

  no-cors permette la richiesta senza leggere
  la risposta del sito esterno.

  Non distingue HTTP 404 da HTTP 200.
  Verifica soltanto se la richiesta riesce
  a completarsi a livello di rete.
*/

async function checkDomain(url) {

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 6000);

    try {

        await fetch(url, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal
        });

        return true;

    } catch {

        return false;

    } finally {

        clearTimeout(timeout);

    }

}

function showSetup(config = null) {

    showScreen(elements.setup);

    elements.error.textContent = "";

    const base = config?.base || DEFAULT_BASE;

    elements.prefix.textContent = base + ".";

    elements.baseDomain.value = base;

    elements.extension.value = config?.extension || "";

    elements.fullDomain.value = config?.fullUrl || "";

}

function openSite(url) {

    window.location.assign(url);

}

async function connectDomain(url, config) {

    elements.connect.disabled = true;

    showScreen(elements.loading);

    document.getElementById("loadingText").textContent =
        "Verifica del dominio...";

    const reachable = await checkDomain(url);

    if (!reachable) {

        showSetup(config);

        showError(
            "Impossibile verificare il dominio. Controlla l'indirizzo e riprova."
        );

        elements.connect.disabled = false;

        return;

    }

    saveConfig(config);

    openSite(url);

}

async function initialize() {

    const config = getConfig();

    if (!config || !config.url) {

        showSetup();

        return;

    }

    showScreen(elements.loading);

    document.getElementById("loadingText").textContent =
        "Bentornato su Fastream...";

    const reachable = await checkDomain(config.url);

    if (reachable) {

        openSite(config.url);

    } else {

        showSetup(config);

        showError(
            "Il dominio salvato non sembra raggiungibile. Inserisci quello aggiornato."
        );

    }

}

/* Inserimento nuova estensione */

elements.form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const extension = elements.extension.value
        .trim()
        .replace(/^\./, "")
        .toLowerCase();

    if (!/^[a-z0-9-]+$/.test(extension)) {

        showError("Inserisci un'estensione valida.");

        return;

    }

    const base = elements.baseDomain.value.trim();

    if (!/^[a-z0-9.-]+$/i.test(base)) {

        showError("Il dominio base non è valido.");

        return;

    }

    const url = buildUrl(base, extension);

    if (!url) {

        showError("Impossibile costruire il dominio.");

        return;

    }

    const config = {
        mode: "extension",
        base,
        extension,
        url
    };

    await connectDomain(url, config);

});

/* Apertura impostazioni avanzate */

elements.advancedButton.addEventListener("click", () => {

    elements.advanced.classList.toggle("hidden");

});

/* Apertura rapida delle impostazioni */

elements.settings.addEventListener("click", () => {

    const config = getConfig();

    showSetup(config);

    elements.advanced.classList.remove("hidden");

});

/* Salvataggio dominio completo */

elements.saveAdvanced.addEventListener("click", async () => {

    const url = normalizeUrl(
        elements.fullDomain.value.trim()
    );

    if (!url) {

        showError("Inserisci un indirizzo completo valido.");

        return;

    }

    const config = {
        mode: "full",
        url,
        fullUrl: url,
        base: elements.baseDomain.value.trim() || DEFAULT_BASE,
        extension: ""
    };

    await connectDomain(url, config);

});

/* Avvio */

initialize();

/* Registrazione Service Worker */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")
            .catch(error => {
                console.error("Service Worker:", error);
            });

    });

}