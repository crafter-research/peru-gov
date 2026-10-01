export const THEME_KEY = "peru-gov-theme";

/**
 * Runs before paint (inlined in <head>) so a pinned theme never flashes.
 * Middleware allows it by sha256 hash: React cannot nonce a dangerouslySetInnerHTML script,
 * and the hash stays correct as long as test/csp.test.ts passes.
 */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
