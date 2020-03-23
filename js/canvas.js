const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let qr= new QR("hola",1,"Q",2)
qr.draw(ctx);