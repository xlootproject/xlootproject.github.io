import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";

export class EditModal {
    constructor (elementId, provider) {
        this.provider = provider;
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
            this.selectedCollection = this.getCollectionFromOptionElement(selected);
            this.input.disabled = false;
            this.input.value = '';
            this.img.style.backgroundImage = '';
            this.imgSrc = null;
        });

        this.input.addEventListener('change', async () => {
            const contract = this.getCollectionContract(this.selectedCollection);
            const metadataURI = await contract.tokenURI(this.input.value);
            const metadataHttpURI = this.sanitizeURI(metadataURI);
            const metadata = await (await fetch(metadataHttpURI)).json();
            const imageURI = this.sanitizeURI(metadata.image);
            this.img.style.backgroundImage = `url(${imageURI})`;
            this.imgSrc = imageURI;
            this.saveButton.disabled = false;
        });

        this.saveButton.addEventListener('click', () => {
            if (this.imgSrc) this.onSaveCallback(this.imgSrc);
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
        this.imgSrc = null;
        this.img.style.backgroundImage = '';
        this.selectedCollection = null;
        this.saveButton.disabled = true;
        this.collections = null;
    }

    onSave (callback) {
        this.onSaveCallback = callback;
    }

    populateCollections (collections) {
        this.collections = collections;
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

    getCollectionFromOptionElement (element) {
        const address = element.dataset.collectionContract;

        return this.collections.find(
            collection => collection.contract === address
        );
    }

    getCollectionContract (collection) {
        const abi = [
            "function tokenURI(uint256 _tokenId) external view returns (string memory)"
        ];

        return new ethers.Contract(collection.contract, abi, this.provider);
    }
}
