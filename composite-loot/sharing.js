import '../node_modules/html-to-image/dist/html-to-image.js';

const copyBtn = document.getElementById('copy-composite');

console.log(htmlToImage);

copyBtn.addEventListener('click', async () => {
    const builder = document.getElementById('composite-loot-container');

    const blobData = await htmlToImage.toBlob(builder);

    await navigator.clipboard.write([
        new ClipboardItem({
            [blobData.type]: blobData
        })
    ]);
});
