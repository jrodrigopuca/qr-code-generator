const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const txt = document.getElementById("txt");

let qr = new QR("hello", 1, "H", 1);
qr.draw(ctx);

txt.addEventListener("input", ()=>{ 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text=txt.value;
    const {version, lvlCorrection, length} =getBetterQR(text);
    console.table({version, lvlCorrection, length})
    qr = new QR(text, version, lvlCorrection, 1);
    qr.draw(ctx);

});