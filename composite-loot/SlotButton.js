export class SlotButton {
    constructor (slotName) {
        const selector = `#composite-loot-${slotName} .composite-loot-button`;
        this.element = document.querySelector(selector);
        this.slot = this.element.closest('.composite-loot-slot');
        this.slotName = slotName;
    }

    onClick (callback) {
        this.element.addEventListener('click', callback);
    }

    setSlot (url) {
        this.slot.style.backgroundImage = `url(${url})`;
        this.slot.classList.add('slot-active');
    }

    async getCollections () {
        const url = `./collections/${this.slotName}_collections.json`;
        return await (await fetch(url)).json();
    }
}
