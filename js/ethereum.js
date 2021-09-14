import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";

export let provider;

if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
}
else {
    console.log('No wallet present, connecting to Ethereum via Cloudflare');
    const RPC_ENDPOINT = 'https://cloudflare-eth.com/';
    provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
}

export function getCollectionContract (address) {
    const abi = [
        "function tokenURI(uint256 _tokenId) external view returns (string memory)",
        "function balanceOf(address owner) external view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)"
    ];

    return new ethers.Contract(address, abi, provider);
}

export function sanitizeURI (uri) {
    if (uri.startsWith('ipfs://')) {
        return `https://cloudflare-ipfs.com/ipfs/${uri.replace('ipfs://', '')}`;
    }
    else return uri;
}

export async function getTokenImage (contractAddress, tokenId) {
    const metadata = await getTokenMetadata(contract, tokenId);
    return sanitizeURI(metadata.image);
}

export async function getTokenMetadata (contractAddress, tokenId) {
    const contract = getCollectionContract(contractAddress);
    const metadataURI = await contract.tokenURI(tokenId);
    const metadataHttpURI = sanitizeURI(metadataURI);
    return await (await fetch(metadataHttpURI)).json();
}
