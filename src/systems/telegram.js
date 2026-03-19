export let tg = null;

export function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes();
    }
}