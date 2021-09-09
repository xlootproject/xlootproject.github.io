import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";

class SlotButton {
    constructor (slotName) {
        const selector = `#lootaverse-${slotName} .lootaverse-button`;
        this.element = document.querySelector(selector);
        this.slot = this.element.closest('.lootaverse-slot');
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
        const url = `../js/lootaverse/${this.slotName}_collections.json`;
        return await (await fetch(url)).json();
    }
}

class EditModal {
    constructor (elementId, conn) {
        this.element = document.getElementById(elementId);
        this.component = new bootstrap.Modal(this.element);
        this.title = this.element.querySelector('.modal-title');
        this.dropdown = this.element.querySelector('.dropdown');
        this.dropdownButton = this.dropdown.querySelector('[data-bs-toggle]');
        this.menu = this.dropdown.querySelector('.dropdown-menu');
        this.input = this.element.querySelector('#token-id-input');
        this.img = this.element.querySelector('#token-image');
        this.saveButton = this.element.querySelector('#token-save');

        this.selectedCollection = null;

        this.element.addEventListener('hidden.bs.modal', () => {
            this.reset();
        });

        this.menu.addEventListener('click', event => {
            const selected = event.target.closest('[data-collection-contract]');
            this.dropdownButton.textContent = `Collection: ${selected.textContent}`;
            this.selectedCollection = selected.dataset.collectionContract;
            this.input.disabled = false;
        });

        this.input.addEventListener('change', async () => {
            const abi = [
                "function tokenURI(uint256 _tokenId) external view returns (string memory)"
            ];

            const contract = new ethers.Contract(this.selectedCollection, abi, conn);

            const metadataURI = await contract.tokenURI(this.input.value);
            const metadataHttpURI = this.sanitizeURI(metadataURI);
            const metadata = await (await fetch(metadataHttpURI)).json();
            const imageURI = this.sanitizeURI(metadata.image);
            this.img.src = imageURI;
            this.saveButton.disabled = false;
        });

        this.saveButton.addEventListener('click', () => {
            if (this.img.src) this.onSaveCallback(this.img.src);
            this.component.hide();
        });
    }

    open () {
        this.component.show();
    }

    reset () {
        this.title.textContent = '';
        this.dropdownButton.textContent = 'Choose collection...';
        this.menu.innerHTML = '';
        this.input.value = '';
        this.input.disabled = true;
        this.img.src = '';
        this.selectedCollection = null;
        this.saveButton.disabled = true;
    }

    onSave (callback) {
        this.onSaveCallback = callback;
    }

    populateCollections (collections) {
        this.menu.innerHTML = `
            ${collections.map(collection => `
                <li data-collection-contract="${collection.contract}">
                    <a class="dropdown-item" href="#">
                        ${collection.name}
                    </a>
                </li>
            `).join('')}
        `;
    }

    setTitle (title) {
        this.title.textContent = title;
    }

    sanitizeURI (uri) {
        if (uri.startsWith('ipfs://')) {
            return `https://cloudflare-ipfs.com/ipfs/${uri.replace('ipfs://', '')}`;
        }
        else return uri;
    }
}

async function init () {
    const RPC_ENDPOINT = 'https://cloudflare-eth.com/';
    const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);

    const avatarSlotButton = new SlotButton('avatar');
    const statsSlotButton = new SlotButton('stats');
    const inventorySlotButton = new SlotButton('inventory');
    const modal = new EditModal('edit-modal', provider);

    avatarSlotButton.onClick(async () => {
        const collections = await avatarSlotButton.getCollections();
        modal.populateCollections(collections);
        modal.setTitle('Choose your avatar');
        modal.onSave(url => { avatarSlotButton.setSlot(url); });
        modal.open();
    });

    statsSlotButton.onClick(async () => {
        const collections = await statsSlotButton.getCollections();
        modal.populateCollections(collections);
        modal.setTitle('Choose your stats');
        modal.onSave(url => { statsSlotButton.setSlot(url); });
        modal.open();
    });

    inventorySlotButton.onClick(async () => {
        const collections = await inventorySlotButton.getCollections();
        modal.populateCollections(collections);
        modal.setTitle('Choose your inventory');
        modal.onSave(url => { inventorySlotButton.setSlot(url); });
        modal.open();
    });
}

init();
