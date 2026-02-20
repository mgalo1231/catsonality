// ===== 画像圧縮ユーティリティ =====
// アップロード前に画像をリサイズ・圧縮してbase64サイズを削減

/**
 * 画像ファイルを圧縮してbase64 data URLを返す
 * @param {File} file - 画像ファイル
 * @param {Object} options - オプション
 * @param {number} options.maxWidth - 最大幅（デフォルト: 1200px）
 * @param {number} options.maxHeight - 最大高さ（デフォルト: 1200px）
 * @param {number} options.quality - JPEG品質 0-1（デフォルト: 0.8）
 * @returns {Promise<string>} 圧縮されたbase64 data URL
 */
function compressImage(file, options = {}) {
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    const quality = options.quality || 0.8;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // リサイズ計算
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Canvasで圧縮
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG形式で出力（PNGより大幅に小さい）
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
        reader.readAsDataURL(file);
    });
}
