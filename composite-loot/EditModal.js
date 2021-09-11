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
        this.ethConnectButton = this.element.querySelector('#connect-wallet');
        this.nftGallery = this.element.querySelector('#nft-gallery');
        this.nftGalleryWarn = this.element.querySelector('#nft-gallery-warn');

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
            const imageURI = await this.getTokenImage(contract, this.input.value);
            this.setImagePreview(imageURI);
        });

        this.saveButton.addEventListener('click', () => {
            if (this.imgSrc) this.onSaveCallback(this.imgSrc);
            this.component.hide();
        });

        this.ethConnectButton.addEventListener('click', async () => {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) return;
            
            this.address = accounts[0];

            this.populateNFTGallery();
        });
    }

    open () {
        this.component.show();

        if (this.address) {
                this.populateNFTGallery();
        }
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
        this.nftGallery.innerHTML = '';
        this.nftGalleryWarn.hidden = true;
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

    async getTokenImage (contract, tokenId) {
        const metadataURI = await contract.tokenURI(tokenId);
        const metadataHttpURI = this.sanitizeURI(metadataURI);
        const metadata = await (await fetch(metadataHttpURI)).json();
        return this.sanitizeURI(metadata.image);
    }

    getCollectionFromOptionElement (element) {
        const address = element.dataset.collectionContract;

        return this.collections.find(
            collection => collection.contract === address
        );
    }

    getCollectionContract (collection) {
        const abi = [
            "function tokenURI(uint256 _tokenId) external view returns (string memory)",
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)"
        ];

        return new ethers.Contract(collection.contract, abi, this.provider);
    }

    async populateNFTGallery () {
        this.ethConnectButton.hidden = true;

        const tokenPromises = this.collections.map(collection => {
            return {
                collection,
                contract: this.getCollectionContract(collection)
            };
        }).map(async ({ collection, contract }) => {
            return {
                contract,
                tokensOwned: (await contract.balanceOf(this.address)).toNumber()
            };
        }).map(async result => {
            const { contract, tokensOwned } = await result;

            if (tokensOwned === 0) return Promise.resolve([]);

            return Promise.all(
                [...Array(tokensOwned).keys()].map(async index => {
                    const result = contract.tokenOfOwnerByIndex(this.address, index);
                    const tokenId = await result;
                    return { contract, tokenId };
                })
            );
        }).map(async result => {
            const tokensFromCollection = await result;

            const renderPromises = tokensFromCollection.map(async token => {
                const { contract, tokenId } = token;
                const imageURI = await this.getTokenImage(contract, tokenId);
                return { contract, tokenId, imageURI };
            }).map(async result => {
                const { contract, tokenId, imageURI } = await result;
                const el = document.createElement('li');
                el.setAttribute('data-collection', contract.address);
                el.setAttribute('data-token-id', tokenId);
                el.classList.add('nft-gallery-token');
                el.style.backgroundImage = `url(${imageURI})`;

                const label = document.createElement('span');
                label.classList.add('nft-token-label');
                label.textContent = `#${tokenId}`;
                el.appendChild(label);

                el.addEventListener('click', () => {
                    this.setImagePreview(imageURI);
                });

                return el;
            }).map(async result => {
                const tokenPreviewEl = await result;
                this.nftGallery.appendChild(tokenPreviewEl);
            });

            return Promise.all(renderPromises);
        });

        const results = await Promise.all(tokenPromises);
        const count = results.reduce((sum, r) => sum + r.length, 0);

        if (count === 0) {
            this.nftGalleryWarn.hidden = false;
        }
    }

    setImagePreview (imageURI) {
        this.img.style.backgroundImage = `url(${imageURI})`;
        this.imgSrc = imageURI;
        this.saveButton.disabled = false;
    }
}
