import { provider, getTokenMetadata } from '../js/ethereum.js';
import { iconsByIndex } from './icons.js';

fetch('./rarity.json').then(async response => {
    const data = await response.json();

    const occurencesRequest = fetch('./occurences.json');
    let occurencesJson = occurencesRequest.then(async r => await r.json());

    const xLootAddress = '0x8bf2f876e2dcd2cae9c3d272f325776c82da366d';
    const tokenIdInput = document.getElementById('token-id-input');
    const checkRarityButton = document.getElementById('check-rarity');
    const lootCard = document.getElementById('loot-card');
    const lootRanking = document.getElementById('loot-ranking');
    const iconsCredit = document.getElementById('icons-credit');
    const legend = document.getElementById('legend');
    const legendTitle = document.getElementById('legend-title');

    async function getItemsFromMetadata (metadata) {
        const svgString = await (await fetch(metadata.image)).text();
        const el = document.createElement('div');

        el.innerHTML = svgString;
        const itemEls = el.querySelectorAll('text');
        const items = [...itemEls].map(el => el.textContent);

        return items;
    }

    function getRanking (tokenId) {
        return data.find(bag => bag.lootId === parseInt(tokenId)).rarest;
    }

    function getCardRarity (tokenId) {
        const ranking = getRanking(tokenId);
        if (ranking < 100) return 'mythical';
        else if (ranking < 600) return 'legendary';
        else if (ranking < 1200) return 'epic';
        else if (ranking < 3000) return 'rare';
        else if (ranking < 6000) return 'uncommon';
        else return 'common';
    }

    async function getItemRarity (item) {
        const occurences = await occurencesJson;
        const count = occurences[item];
        if (count === 1) return 'mythical';
        else if (count < 10) return 'legendary';
        else if (count < 50) return 'epic';
        else if (count < 200) return 'rare';
        else if (count < 500) return 'uncommon';
        else return 'common';
    }

    function renderRanking (tokenId) {
        const ranking = getRanking(tokenId);
        lootRanking.textContent = `Ranking: #${ranking}`;
    }

    function renderCard (items, tokenId) {
        const ranking = getCardRarity(tokenId);
        lootCard.innerHTML = '';
        lootCard.dataset.ranking = ranking;
        lootCard.dataset.token = tokenId;

        items.forEach(async (item, i) => {
            const el = document.createElement('li');
            const rarity = await getItemRarity(item);
            el.classList.add('loot-item', rarity);
            el.innerHTML = `
                <span class="loot-icon">${iconsByIndex[i]}</span>
                <span class="loot-item-name">${item}</span>
            `;
            lootCard.appendChild(el);
        });
    }

    function showCard () {
        lootRanking.hidden = false;
        lootCard.hidden = false;
        iconsCredit.hidden = false;
        legendTitle.hidden = false;
        legend.hidden = false;
    }

    async function fetchAndDisplayRarity (tokenId) {
        checkRarityButton.disable = true;

        const metadata = await getTokenMetadata(xLootAddress, tokenId);
        const items = await getItemsFromMetadata(metadata);

        renderRanking(tokenId);
        renderCard(items, tokenId);
        showCard();

        checkRarityButton.disable = false;
    }

    async function onTokenSelect () {
        const tokenId = tokenIdInput.value;
        await fetchAndDisplayRarity(tokenId);
        history.pushState({ tokenId }, '', `?token=${tokenId}`);
    }

    checkRarityButton.addEventListener('click', async () => {
        onTokenSelect();
    });

    tokenIdInput.addEventListener('keypress', async event => {
        if (event.which === 13) onTokenSelect();
    });

    window.addEventListener('popstate', event => {
        const tokenId = event.state.tokenId;
        tokenIdInput.value = tokenId;
        fetchAndDisplayRarity(tokenId);
    });

    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    if (token) {
        tokenIdInput.value = token;
        history.replaceState({ tokenId: token }, '');
        fetchAndDisplayRarity(token);
    }
});
