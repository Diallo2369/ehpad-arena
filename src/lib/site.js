// Réglages du site, en un seul endroit.
export const SITE_NAME = "EHPAD Arena";
export const SITE_URL = (import.meta.env.SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
// NOINDEX=1 : site publié mais fermé aux moteurs de recherche (phase de relecture).
export const INDEXABLE = Boolean(SITE_URL) && (import.meta.env.NOINDEX || process.env.NOINDEX) !== "1";
export const CONTACT = "contact@ehpadarena.fr";
// Mesure d'audience Cloudflare Web Analytics : sans cookie, chiffres agrégés. Le jeton n'est pas secret
// (il apparaît dans chaque page). Chargé seulement sur le site ouvert à Google. Vide = mesure désactivée.
export const ANALYTICS_TOKEN = "";
