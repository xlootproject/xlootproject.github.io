import '../node_modules/html-to-image/dist/html-to-image.js';

const copyBtn = document.getElementById('copy-composite');

copyBtn.addEventListener('click', async () => {
    const builder = document.getElementById('composite-loot-container');
    const backgroundColor = getComputedStyle(document.body).backgroundColor;

    const blobData = await htmlToImage.toBlob(builder, {
        backgroundColor
    });

    await navigator.clipboard.write([
        new ClipboardItem({
            [blobData.type]: blobData
        })
    ]);
});
