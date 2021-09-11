import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";
import { SlotButton } from './SlotButton.js';
import { EditModal } from './EditModal.js';

let provider;

if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
}
else {
    console.log('No wallet present, connecting to Ethereum via Cloudflare');
    const RPC_ENDPOINT = 'https://cloudflare-eth.com/';
    provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
}

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
