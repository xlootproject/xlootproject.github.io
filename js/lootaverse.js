import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";

class SlotButton {
    constructor (slotName) {
        const selector = `#lootaverse-${slotName} .lootaverse-button`;
        this.element = document.querySelector(selector);
    }

    onClick (callback) {
        this.element.addEventListener('click', callback);
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
            console.log('Fetched token metadata', metadata);
            this.img.src = imageURI;
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
        this.img.src = '';
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

    console.log('Testing Ethereum connection...');
    console.log('Block number is...', await provider.getBlockNumber());

    const avatarSlotButton = new SlotButton('avatar');
    const statsSlotButton = new SlotButton('stats');
    const inventorySlotButton = new SlotButton('inventory');
    const modal = new EditModal('edit-modal', provider);

    avatarSlotButton.onClick(() => {
        modal.populateCollections([
            { name: 'Forgotten Runes Wizard\'s Cult', contract: '0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42' },
            { name: 'MetaHero Universe', contract: '0x6dc6001535e15b9def7b0f6a20a2111dfa9454e2' },
        ]);

        modal.setTitle('Choose your avatar');

        modal.open();
    });

    statsSlotButton.onClick(() => {
        modal.populateCollections([
            { name: 'Characters (for Adventurers)', contract: '0x7403ac30de7309a0bf019cda8eec034a5507cbb3' },
            { name: 'Role for Metaverse', contract: '0xcd4d337554862f9bc9ffffb67465b7d643e4e3ad' },
        ]);

        modal.setTitle('Choose your stats');

        modal.open();
    });

    inventorySlotButton.onClick(() => {
        modal.populateCollections([
            { name: 'Loot', contract: '0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7' },
            { name: 'xLoot', contract: '0x8bf2f876e2dcd2cae9c3d272f325776c82da366d' }
        ]);

        modal.setTitle('Choose your inventory');

        modal.open();
    });
}

init();
