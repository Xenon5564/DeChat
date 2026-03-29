const AVATAR_COLORS = ["#5865F2", "#3BA55D", "#FAA61A", "#EB459E", "#ED4245", "#99AAB5"];

export const processAvatar = async (previewURL) => {
    if (!previewURL) return null;

    return new Promise((resolve) => {
        const img = new Image();
        img.src = previewURL;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            const minSide = Math.min(img.width, img.height);
            const startX = (img.width - minSide) / 2;
            const startY = (img.height - minSide) / 2;

            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, 128, 128);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
    });
};

export const generateAvatar = (username) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const firstChar = username.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    const color = AVATAR_COLORS[charCode % AVATAR_COLORS.length];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 64px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(firstChar, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/jpeg', 0.8);
};
