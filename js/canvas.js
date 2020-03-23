const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//let qr = new QR(`There\\'s a frood who really knows where his towel is!`, 5, "Q",0);
let qr= new QR("hola",7,"Q",0)
qr.addPatterns();
qr.loadData(qr.getFinalForm().toString());
qr.mask();
qr.formatInfo();
qr.draw(ctx);