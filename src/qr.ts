class QR {
    version: number;
    text: string;
    lvlCorrection: string;
    mode: string;
    ccm: number;
    capacity: any;
    antilog: number[];
    ecc: number;
    d: number;
    board: any[];
    maskNumber: number;


    constructor(text: string, version: number, lvlCorrection: string, maskNumber: number) {
        this.text = text;
        this.version = version;
        this.lvlCorrection = lvlCorrection;
        this.mode = "0100";
        this.ccm = 0; //character count mode
        this.antilog = [1, 2, 4, 8, 16, 32, 64, 128, 29, 58, 116, 232, 205, 135, 19, 38, 76, 152, 45, 90, 180, 117, 234, 201, 143, 3, 6, 12, 24, 48, 96, 192, 157, 39, 78, 156, 37, 74, 148, 53, 106, 212, 181, 119, 238, 193, 159, 35, 70, 140, 5, 10, 20, 40, 80, 160, 93, 186, 105, 210, 185, 111, 222, 161, 95, 190, 97, 194, 153, 47, 94, 188, 101, 202, 137, 15, 30, 60, 120, 240, 253, 231, 211, 187, 107, 214, 177, 127, 254, 225, 223, 163, 91, 182, 113, 226, 217, 175, 67, 134, 17, 34, 68, 136, 13, 26, 52, 104, 208, 189, 103, 206, 129, 31, 62, 124, 248, 237, 199, 147, 59, 118, 236, 197, 151, 51, 102, 204, 133, 23, 46, 92, 184, 109, 218, 169, 79, 158, 33, 66, 132, 21, 42, 84, 168, 77, 154, 41, 82, 164, 85, 170, 73, 146, 57, 114, 228, 213, 183, 115, 230, 209, 191, 99, 198, 145, 63, 126, 252, 229, 215, 179, 123, 246, 241, 255, 227, 219, 171, 75, 150, 49, 98, 196, 149, 55, 110, 220, 165, 87, 174, 65, 130, 25, 50, 100, 200, 141, 7, 14, 28, 56, 112, 224, 221, 167, 83, 166, 81, 162, 89, 178, 121, 242, 249, 239, 195, 155, 43, 86, 172, 69, 138, 9, 18, 36, 72, 144, 61, 122, 244, 245, 247, 243, 251, 235, 203, 139, 11, 22, 44, 88, 176, 125, 250, 233, 207, 131, 27, 54, 108, 216, 173, 71, 142, 1];
        let listECCxB = [{ "L": 7, "M": 10, "Q": 13, "H": 17 }, { "L": 10, "M": 16, "Q": 22, "H": 28 }, { "L": 15, "M": 26, "Q": 18, "H": 22 }, { "L": 20, "M": 18, "Q": 26, "H": 16 }, { "L": 26, "M": 24, "Q": 18, "H": 22 }, { "L": 18, "M": 16, "Q": 24, "H": 28 }, { "L": 20, "M": 18, "Q": 18, "H": 26 }, { "L": 24, "M": 22, "Q": 22, "H": 26 }, { "L": 30, "M": 22, "Q": 20, "H": 24 }, { "L": 18, "M": 26, "Q": 24, "H": 28 }, { "L": 20, "M": 30, "Q": 28, "H": 24 }, { "L": 24, "M": 22, "Q": 26, "H": 28 }, { "L": 26, "M": 22, "Q": 24, "H": 22 }, { "L": 30, "M": 24, "Q": 20, "H": 24 }, { "L": 22, "M": 24, "Q": 30, "H": 24 }, { "L": 24, "M": 28, "Q": 24, "H": 30 }, { "L": 28, "M": 28, "Q": 28, "H": 28 }, { "L": 30, "M": 26, "Q": 28, "H": 28 }, { "L": 28, "M": 26, "Q": 26, "H": 26 }, { "L": 28, "M": 26, "Q": 30, "H": 28 }, { "L": 28, "M": 26, "Q": 28, "H": 30 }, { "L": 28, "M": 28, "Q": 30, "H": 24 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 26, "M": 28, "Q": 30, "H": 30 }, { "L": 28, "M": 28, "Q": 28, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }, { "L": 30, "M": 28, "Q": 30, "H": 30 }];
        this.ecc = listECCxB[this.version - 1][this.lvlCorrection];
        this.maskNumber= maskNumber;

        this.d = ((this.version - 1) * 4) + 21;
        this.board = [];

        for (let i = 0; i < this.d; i++) {
            const row = [];
            this.board.push(row);
            for (let j = 0; j < this.d; j++) {
                const col = 0;
                row.push(col);
            }
        }
    }

    complete(original, nZeros: number) {
        let zeros = '0';
        zeros = zeros.padStart(nZeros, '0');
        let newText = original.toString(2);
        return zeros.substr(newText.length) + newText;
    }

    // Data Encoding 

    firstPart() {
        let capacity = [{ "L": 17, "M": 14, "Q": 11, "H": 7 }, { "L": 32, "M": 26, "Q": 20, "H": 14 }, { "L": 53, "M": 42, "Q": 32, "H": 24 }, { "L": 78, "M": 62, "Q": 46, "H": 34 }, { "L": 106, "M": 84, "Q": 60, "H": 44 }, { "L": 134, "M": 106, "Q": 74, "H": 58 }, { "L": 154, "M": 122, "Q": 86, "H": 64 }, { "L": 192, "M": 152, "Q": 108, "H": 84 }, { "L": 230, "M": 180, "Q": 130, "H": 98 }, { "L": 271, "M": 213, "Q": 151, "H": 119 }, { "L": 321, "M": 251, "Q": 177, "H": 137 }, { "L": 367, "M": 287, "Q": 203, "H": 155 }, { "L": 425, "M": 331, "Q": 241, "H": 177 }, { "L": 458, "M": 362, "Q": 258, "H": 194 }, { "L": 520, "M": 412, "Q": 292, "H": 220 }, { "L": 586, "M": 450, "Q": 322, "H": 250 }, { "L": 644, "M": 504, "Q": 364, "H": 280 }, { "L": 718, "M": 560, "Q": 394, "H": 310 }, { "L": 792, "M": 624, "Q": 442, "H": 338 }, { "L": 858, "M": 666, "Q": 482, "H": 382 }, { "L": 929, "M": 711, "Q": 509, "H": 403 }, { "L": 1003, "M": 779, "Q": 565, "H": 439 }, { "L": 1091, "M": 857, "Q": 611, "H": 461 }, { "L": 1171, "M": 911, "Q": 661, "H": 511 }, { "L": 1273, "M": 997, "Q": 715, "H": 535 }, { "L": 1367, "M": 1059, "Q": 751, "H": 593 }, { "L": 1465, "M": 1125, "Q": 805, "H": 625 }, { "L": 1528, "M": 1190, "Q": 868, "H": 658 }, { "L": 1628, "M": 1264, "Q": 908, "H": 698 }, { "L": 1732, "M": 1370, "Q": 982, "H": 742 }, { "L": 1840, "M": 1452, "Q": 1030, "H": 790 }, { "L": 1952, "M": 1538, "Q": 1112, "H": 842 }, { "L": 2068, "M": 1628, "Q": 1168, "H": 898 }, { "L": 2188, "M": 1722, "Q": 1228, "H": 958 }, { "L": 2303, "M": 1809, "Q": 1283, "H": 983 }, { "L": 2431, "M": 1911, "Q": 1351, "H": 1051 }, { "L": 2563, "M": 1989, "Q": 1423, "H": 1093 }, { "L": 2699, "M": 2099, "Q": 1499, "H": 1139 }, { "L": 2809, "M": 2213, "Q": 1579, "H": 1219 }, { "L": 2953, "M": 2331, "Q": 1663, "H": 1273 }];

        this.capacity = capacity[this.version - 1][this.lvlCorrection];
        if (this.text.length <= this.capacity) {
            console.log("texto con dimensión correctas")
        } else { console.log("dimensiones de texto incorrecta") }


        //character count mode
        if (this.version < 40) {
            if (this.version < 9) {
                this.ccm = 8;
            } else if (this.version < 26) { this.ccm = 16; }
            else { this.ccm = 16; }
        } else {
            console.log("fuera de rango");
        }

        //character count indicator
        let cci = this.complete(this.text.length.toString(2), this.ccm)

        return (this.mode + cci);
    }


    msgEncoding() {
        let msgCod = [];
        for (let i = 0; i < this.text.length; i++) {
            msgCod.push(this.complete(this.text.charCodeAt(i).toString(2), 8));
        }
        return msgCod.join('');
    }

    dataEncoding() {
        let data = this.firstPart() + this.msgEncoding();

        let totalNumberData = [{ "L": 19, "M": 16, "Q": 13, "H": 9 }, { "L": 34, "M": 28, "Q": 22, "H": 16 }, { "L": 55, "M": 44, "Q": 34, "H": 26 }, { "L": 80, "M": 64, "Q": 48, "H": 36 }, { "L": 108, "M": 86, "Q": 62, "H": 46 }, { "L": 136, "M": 108, "Q": 76, "H": 60 }, { "L": 156, "M": 124, "Q": 88, "H": 66 }, { "L": 194, "M": 154, "Q": 110, "H": 86 }, { "L": 232, "M": 182, "Q": 132, "H": 100 }, { "L": 274, "M": 216, "Q": 154, "H": 122 }, { "L": 324, "M": 254, "Q": 180, "H": 140 }, { "L": 370, "M": 290, "Q": 206, "H": 158 }, { "L": 428, "M": 334, "Q": 244, "H": 180 }, { "L": 461, "M": 365, "Q": 261, "H": 197 }, { "L": 523, "M": 415, "Q": 295, "H": 223 }, { "L": 589, "M": 453, "Q": 325, "H": 253 }, { "L": 647, "M": 507, "Q": 367, "H": 283 }, { "L": 721, "M": 563, "Q": 397, "H": 313 }, { "L": 795, "M": 627, "Q": 445, "H": 341 }, { "L": 861, "M": 669, "Q": 485, "H": 385 }, { "L": 932, "M": 714, "Q": 512, "H": 406 }, { "L": 1006, "M": 782, "Q": 568, "H": 442 }, { "L": 1094, "M": 860, "Q": 614, "H": 464 }, { "L": 1174, "M": 914, "Q": 664, "H": 514 }, { "L": 1276, "M": 1000, "Q": 718, "H": 538 }, { "L": 1370, "M": 1062, "Q": 754, "H": 596 }, { "L": 1468, "M": 1128, "Q": 808, "H": 628 }, { "L": 1531, "M": 1193, "Q": 871, "H": 661 }, { "L": 1631, "M": 1267, "Q": 911, "H": 701 }, { "L": 1735, "M": 1373, "Q": 985, "H": 745 }, { "L": 1843, "M": 1455, "Q": 1033, "H": 793 }, { "L": 1955, "M": 1541, "Q": 1115, "H": 845 }, { "L": 2071, "M": 1631, "Q": 1171, "H": 901 }, { "L": 2191, "M": 1725, "Q": 1231, "H": 961 }, { "L": 2306, "M": 1812, "Q": 1286, "H": 986 }, { "L": 2434, "M": 1914, "Q": 1354, "H": 1054 }, { "L": 2566, "M": 1992, "Q": 1426, "H": 1096 }, { "L": 2702, "M": 2102, "Q": 1502, "H": 1142 }, { "L": 2812, "M": 2216, "Q": 1582, "H": 1222 }, { "L": 2956, "M": 2334, "Q": 1666, "H": 1276 }]
        let requiredBits = totalNumberData[this.version - 1][this.lvlCorrection];

        console.log("required: ", requiredBits)

        // add terminator
        if (data.length < requiredBits * 8) {
            if (data.length + 4 <= requiredBits) { data += "0000" } else { data += "00" }
        }

        // add pad bytes
        while (data.length % 8 !== 0) {
            data += this.complete("", 1);
        }

        // get CWs
        let arrayCW = [];
        for (let i = 0; i < data.length; i += 8) {
            arrayCW.push(parseInt(data.slice(i, i + 8), 2))
        }

        // complete total cws
        let last236 = false;
        while (arrayCW.length < requiredBits) {
            arrayCW.push(last236 ? 17 : 236);
            last236 = !last236;
        }

        return (arrayCW);
    }

    // Error encoding 

    getAntilog(val) { return this.antilog[val] }

    getStep(g0: number[], g1: number[]) {
        let array = [];
        for (let i = 0; i < g0.length; i++) {
            for (let j = 0; j < g1.length; j++) {

                let value = g0[i] + g1[j] < 255 ? g0[i] + g1[j] : g0[i] + g1[j] - 255;
                let index = i + j;

                if (array[index] == undefined) {
                    array[index] = value;
                }
                else {
                    const lval = this.getAntilog(array[index]) ^ this.getAntilog(value)
                    array[index] = this.antilog.indexOf(lval);
                }
            }
        }
        return array;
    }

    getPoly(n: number) {
        if (n === 1) { return [0, 0] }
        else { return this.getStep((this.getPoly(n - 1)), [0, n - 1]); }
    }

    makeIteration(v: number[], a: number[]) {
        let first = v[0];
        let multA = this.antilog.indexOf(first)
        while (v.length < this.ecc + 1) { v.push(0); }

        function addA(val: number) { return (val + multA < 255) ? val + multA : val + multA - 255 }
        let apot = a.map(addA).map((val) => this.antilog[val])

        function Xor(val: number, index: number) { return val ^ apot[index] }
        let newValues = v.map(Xor).slice(1)

        return newValues;
    }

    getCorrection(values: number[]) {
        let apot0 = this.getPoly(this.ecc);

        let iterations = [...values];
        for (let i = 0; i < values.length; i++) {
            iterations = this.makeIteration(iterations, apot0)
        }

        return iterations;
    }

    makeGroups(data: number[]) {
        let group1 = []
        let group2 = []
        let blocks = [{ "L": [1, 19, 0, 0], "M": [1, 16, 0, 0], "Q": [1, 13, 0, 0], "H": [1, 9, 0, 0] }, { "L": [1, 34, 0, 0], "M": [1, 28, 0, 0], "Q": [1, 22, 0, 0], "H": [1, 16, 0, 0] }, { "L": [1, 55, 0, 0], "M": [1, 44, 0, 0], "Q": [2, 17, 0, 0], "H": [2, 13, 0, 0] }, { "L": [1, 80, 0, 0], "M": [2, 32, 0, 0], "Q": [2, 24, 0, 0], "H": [4, 9, 0, 0] }, { "L": [1, 108, 0, 0], "M": [2, 43, 0, 0], "Q": [2, 15, 2, 16], "H": [2, 11, 2, 12] }, { "L": [2, 68, 0, 0], "M": [4, 27, 0, 0], "Q": [4, 19, 0, 0], "H": [4, 15, 0, 0] }, { "L": [2, 78, 0, 0], "M": [4, 31, 0, 0], "Q": [2, 14, 4, 15], "H": [4, 13, 1, 14] }, { "L": [2, 97, 0, 0], "M": [2, 38, 2, 39], "Q": [4, 18, 2, 19], "H": [4, 14, 2, 15] }, { "L": [2, 116, 0, 0], "M": [3, 36, 2, 37], "Q": [4, 16, 4, 17], "H": [4, 12, 4, 13] }, { "L": [2, 68, 2, 69], "M": [4, 43, 1, 44], "Q": [6, 19, 2, 20], "H": [6, 15, 2, 16] }, { "L": [4, 81, 0, 0], "M": [1, 50, 4, 51], "Q": [4, 22, 4, 23], "H": [3, 12, 8, 13] }, { "L": [2, 92, 2, 93], "M": [6, 36, 2, 37], "Q": [4, 20, 6, 21], "H": [7, 14, 4, 15] }, { "L": [4, 107, 0, 0], "M": [8, 37, 1, 38], "Q": [8, 20, 4, 21], "H": [12, 11, 4, 12] }, { "L": [3, 115, 1, 116], "M": [4, 40, 5, 41], "Q": [11, 16, 5, 17], "H": [11, 12, 5, 13] }, { "L": [5, 87, 1, 88], "M": [5, 41, 5, 42], "Q": [5, 24, 7, 25], "H": [11, 12, 7, 13] }, { "L": [5, 98, 1, 99], "M": [7, 45, 3, 46], "Q": [15, 19, 2, 20], "H": [3, 15, 13, 16] }, { "L": [1, 107, 5, 108], "M": [10, 46, 1, 47], "Q": [1, 22, 15, 23], "H": [2, 14, 17, 15] }, { "L": [5, 120, 1, 121], "M": [9, 43, 4, 44], "Q": [17, 22, 1, 23], "H": [2, 14, 19, 15] }, { "L": [3, 113, 4, 114], "M": [3, 44, 11, 45], "Q": [17, 21, 4, 22], "H": [9, 13, 16, 14] }, { "L": [3, 107, 5, 108], "M": [3, 41, 13, 42], "Q": [15, 24, 5, 25], "H": [15, 15, 10, 16] }, { "L": [4, 116, 4, 117], "M": [17, 42, 0, 0], "Q": [17, 22, 6, 23], "H": [19, 16, 6, 17] }, { "L": [2, 111, 7, 112], "M": [17, 46, 0, 0], "Q": [7, 24, 16, 25], "H": [34, 13, 0, 0] }, { "L": [4, 121, 5, 122], "M": [4, 47, 14, 48], "Q": [11, 24, 14, 25], "H": [16, 15, 14, 16] }, { "L": [6, 117, 4, 118], "M": [6, 45, 14, 46], "Q": [11, 24, 16, 25], "H": [30, 16, 2, 17] }, { "L": [8, 106, 4, 107], "M": [8, 47, 13, 48], "Q": [7, 24, 22, 25], "H": [22, 15, 13, 16] }, { "L": [10, 114, 2, 115], "M": [19, 46, 4, 47], "Q": [28, 22, 6, 23], "H": [33, 16, 4, 17] }, { "L": [8, 122, 4, 123], "M": [22, 45, 3, 46], "Q": [8, 23, 26, 24], "H": [12, 15, 28, 16] }, { "L": [3, 117, 10, 118], "M": [3, 45, 23, 46], "Q": [4, 24, 31, 25], "H": [11, 15, 31, 16] }, { "L": [7, 116, 7, 117], "M": [21, 45, 7, 46], "Q": [1, 23, 37, 24], "H": [19, 15, 26, 16] }, { "L": [5, 115, 10, 116], "M": [19, 47, 10, 48], "Q": [15, 24, 25, 25], "H": [23, 15, 25, 16] }, { "L": [13, 115, 3, 116], "M": [2, 46, 29, 47], "Q": [42, 24, 1, 25], "H": [23, 15, 28, 16] }, { "L": [17, 115, 0, 0], "M": [10, 46, 23, 47], "Q": [10, 24, 35, 25], "H": [19, 15, 35, 16] }, { "L": [17, 115, 1, 116], "M": [14, 46, 21, 47], "Q": [29, 24, 19, 25], "H": [11, 15, 46, 16] }, { "L": [13, 115, 6, 116], "M": [14, 46, 23, 47], "Q": [44, 24, 7, 25], "H": [59, 16, 1, 17] }, { "L": [12, 121, 7, 122], "M": [12, 47, 26, 48], "Q": [39, 24, 14, 25], "H": [22, 15, 41, 16] }, { "L": [6, 121, 14, 122], "M": [6, 47, 34, 48], "Q": [46, 24, 10, 25], "H": [2, 15, 64, 16] }, { "L": [17, 122, 4, 123], "M": [29, 46, 14, 47], "Q": [49, 24, 10, 25], "H": [24, 15, 46, 16] }, { "L": [4, 122, 18, 123], "M": [13, 46, 32, 47], "Q": [48, 24, 14, 25], "H": [42, 15, 32, 16] }, { "L": [20, 117, 4, 118], "M": [40, 47, 7, 48], "Q": [43, 24, 22, 25], "H": [10, 15, 67, 16] }, { "L": [19, 118, 6, 119], "M": [18, 47, 31, 48], "Q": [34, 24, 34, 25], "H": [20, 15, 61, 16] }];
        let blocksXlevel = blocks[this.version - 1][this.lvlCorrection];
        //console.log("blocks", blocksXlevel);

        let initial = 0;
        for (let j = 0; j < blocksXlevel[0]; j++) {
            group1.push(data.slice(initial, blocksXlevel[1] + initial))
            initial += blocksXlevel[1];
        }
        if (blocksXlevel[2] != 0) {
            for (let j = 0; j < blocksXlevel[2]; j++) {
                group2.push(data.slice(initial, blocksXlevel[3] + initial))
                initial += blocksXlevel[3];
            }
        }
        return [group1, group2];
    }

    errorEncoding(group1: any[], group2: any[]) {
        //let [group1, group2] =this.makeGroups(this.dataEncoding());

        let correction1 = group1.map(val => this.getCorrection(val))
        let correction2 = group2.map(val => this.getCorrection(val))

        return [correction1, correction2];
    }

    // Final Structure 

    interleave(group1: any[], group2: any[]) {
        const majLong = group2.length == 0 || group1[0].length > group2[0].length ? group1[0].length : group2[0].length;

        const ngroup = group1.concat(group2);
        let all = []; let value = null;

        for (let j = 0; j < majLong; j++) {
            for (let i = 0; i < ngroup.length; i++) {
                value = ngroup[i][j];
                if (value !== undefined) { all.push(value) }
            }
        }
        return all;
    }

    getFinalForm() {
        const [dataG1, dataG2] = this.makeGroups(this.dataEncoding());
        const [errorG1, errorG2] = this.errorEncoding(dataG1, dataG2);
        const interData = this.interleave(dataG1, dataG2);
        //console.log("interData", interData);
        const interError = this.interleave(errorG1, errorG2);
        //console.log("interError", interError);

        const interJoin = interData.concat(interError);
        //console.log(interJoin)

        let bits = interJoin.map((v) => v.toString(2))
        bits = bits.map((v) => this.complete(v, 8))
        //console.log(bits);

        const remainderBits = [0, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0]
        const remainderxVersion = remainderBits[this.version - 1];
        let bitzero = "0";

        //console.log(bits.join('') + bitzero.repeat(remainderxVersion));
        return (bits.join('') + bitzero.repeat(remainderxVersion));
    }

    // draw

    getColor(n: number) {
        let value = null;

        switch (n) {
            case 0: value = "white"; break;
            case 1: value = "black"; break;
            case 2: value = "antiquewhite"; break;//  espacios en blanco de patrones
            case 3: value = "lightskyblue"; break; //información
            case 4: value = "gray"; break;//"gray"; patrones
            default: value = "white";
        }
        return value;
    }

    draw(ctx) {
        const sizeRect = ctx.canvas.width / this.d;
        for (let i = 0; i < this.d; i++) {
            for (let j = 0; j < this.d; j++) {
                ctx.beginPath();
                ctx.rect(j * sizeRect, i * sizeRect, sizeRect, sizeRect);
                ctx.fillStyle = this.getColor(this.board[i][j])
                //this.board[i][j]===1?"black":"white";
                ctx.fill();
                ctx.lineWidth = .3;
                ctx.strokeStyle = "black";
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    // add Function Patterns
    addPatterns() {
        const alignLocation = [[6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]]

        /** Patrón de búsqueda */
        for (let i = 0; i < 7; i++) {
            //[row,col]
            // cuadrado arriba izq 
            this.board[i][0] = 4;
            this.board[i][6] = 4;
            this.board[0][i] = 4;
            this.board[6][i] = 4;
            // separador arriba izq
            this.board[i][7] = 2;
            this.board[7][i] = 2;
            this.board[7][7] = 2;

            // cuadrado abajo izq 
            this.board[this.d - 1 - i][0] = 4;
            this.board[this.d - 1 - i][6] = 4;
            this.board[this.d - 7][i] = 4;
            this.board[this.d - 1][i] = 4;
            // separador abajo izq
            this.board[this.d - 1 - i][7] = 2;
            this.board[this.d - 8][i] = 2;
            this.board[this.d - 8][7] = 2;

            // cuadrado arriba der
            this.board[i][this.d - 7] = 4;
            this.board[i][this.d - 1] = 4;
            this.board[0][this.d - 1 - i] = 4;
            this.board[6][this.d - 1 - i] = 4;
            // separador arriba der
            this.board[i][this.d - 8] = 2;
            this.board[7][this.d - 1 - i] = 2;
            this.board[7][this.d - 8] = 2;

            // cuadrados 3x3
            if (i > 1 && i < 5) {
                // cuadrado arriba izq (3x3)
                this.board[2][i] = 4;
                this.board[3][i] = 4;
                this.board[4][i] = 4;
                // cuadrado abajo izq (3x3)
                this.board[this.d - 5][i] = 4;
                this.board[this.d - 4][i] = 4;
                this.board[this.d - 3][i] = 4;
                // cuadrado arriba der (3x3)
                this.board[2][this.d - 1 - i] = 4;
                this.board[3][this.d - 1 - i] = 4;
                this.board[4][this.d - 1 - i] = 4;

            }
            //cuadrados blanco 4x4
            if (i > 0 && i < 6) {
                // arriba izq
                this.board[i][1] = 2;
                this.board[i][5] = 2;
                this.board[1][i] = 2;
                this.board[5][i] = 2;
                // abajo izq
                this.board[this.d - 1 - i][1] = 2;
                this.board[this.d - 1 - i][5] = 2;
                this.board[this.d - 6][i] = 2;
                this.board[this.d - 2][i] = 2;
                // arriba der
                this.board[i][this.d - 6] = 2;
                this.board[i][this.d - 2] = 2;
                this.board[1][this.d - 1 - i] = 2;
                this.board[5][this.d - 1 - i] = 2;
            }
        }


        // modulo dark
        this.board[(this.version * 4) + 9][8] = 4;

        // patrón de alineación
        if (this.version >= 2) {
            let pointsA = alignLocation[this.version - 2];
            console.log(pointsA);

            for (let i = 0; i < pointsA.length; i++) {
                for (let j = 0; j < pointsA.length; j++) {
                    if (this.board[pointsA[i]][pointsA[j]] == 0) {
                        this.board[pointsA[i]][pointsA[j]] = 4;
                        const poi = pointsA[i];
                        const poj = pointsA[j];

                        //lineas horizontales cuadrado 5x5
                        for (let k = poj - 2; k < poj + 3; k++) {
                            this.board[poi - 2][k] = 4;
                            this.board[poi + 2][k] = 4;

                            if (k > poj - 2 && k < poj + 2) {
                                this.board[poi - 1][k] = 2;
                                this.board[poi + 1][k] = 2;
                            }


                        }

                        for (let k = poi - 2; k < poi + 3; k++) {
                            //lineas verticales cuadrado 5x5
                            this.board[k][poj - 2] = 4;
                            this.board[k][poj + 2] = 4;

                            //lineas verticales cuadrado blanco 3x3
                            if (k > poi - 2 && k < poi + 2) {
                                this.board[k][poj - 1] = 2;
                                this.board[k][poj + 1] = 2;
                            }

                        }
                    }

                }
            }
        }

        // patrones de sincronización
        for (let i = 7; i < this.d - 7; i++) {
            if (i % 2 === 0) {
                this.board[6][i] = 4;
                this.board[i][6] = 4;
            }
            else {
                this.board[6][i] = 2;
                this.board[i][6] = 2;
            }
        }

        //información de area
        if (this.version < 7) {
            for (let i = 0; i < 8; i++) {
                // información de area (arriba izq)
                if (i != 6) {
                    this.board[i][8] = 3;
                    this.board[8][i] = 3;
                    this.board[8][8] = 3;
                }

                // información de area (abajo izq)
                if (this.board[this.d - 1 - i][8] != 4) { this.board[this.d - 1 - i][8] = 3; }

                // información de area (arriba der)
                this.board[8][this.d - 1 - i] = 3;
            }
        }
        else {
            for (let i = 0; i < 6; i++) {
                this.board[this.d - 9][i] = 3;
                this.board[this.d - 10][i] = 3;
                this.board[this.d - 11][i] = 3;

                this.board[i][this.d - 9] = 3;
                this.board[i][this.d - 10] = 3;
                this.board[i][this.d - 11] = 3;
            }
        }
    }

    loadData(train: string) {
        let lim = 0;
        let limMax = train.length;

        for (let j = this.d - 1; j >= 0; j = j - 2) {
            if (j % 4 == 0) {
                for (let i = this.d - 1; i >= 0 && lim < limMax; i--) {
                    //console.log(i, j);

                    if (this.board[i][j] == 0 && lim < limMax) {
                        this.board[i][j] = Number(train[lim]);
                        lim = lim + 1;
                    }

                    if (this.board[i][j - 1] == 0 && lim < limMax) {
                        this.board[i][j - 1] = Number(train[lim]);
                        lim = lim + 1;
                    }
                }
            }
            else {
                for (let i = 0; i <= this.d - 1 && lim < limMax; i++) {
                    //console.log(i, j);
                    if (this.board[i][j] == 0 && lim < limMax) {
                        this.board[i][j] = Number(train[lim]);
                        lim = lim + 1;
                    }

                    if (this.board[i][j - 1] == 0 && lim < limMax) {
                        this.board[i][j - 1] = Number(train[lim]);
                        lim = lim + 1;
                    }
                }
            }


        }
    }

    mask() {
        if (this.maskNumber == 0) {
            for (let j = 0; j < this.d; j++) {
                for (let i = 0; i < this.d; i++) {
                    if ((i + j) % 2 == 0) {
                        switch (this.board[i][j]) {
                            case 0: this.board[i][j] = 1; break;
                            case 1: this.board[i][j] = 0; break;
                            //default: console.log("hi");
                        }
                    }
                }
            }
        }
    }

    formatInfo() {
        let arrayInfo=[{"L":"111011111000100", "M":"101010000010010","Q":"011010101011111","H":"001011010001001"},{"L":"111001011110011", "M":"101000100100101","Q":"011000001101000","H":"001001110111110"},{"L":"111110110101010", "M":"101111001111100","Q":"011111100110001","H":"001110011100111"},{"L":"111100010011101", "M":"101101101001011","Q":"011101000000110","H":"001100111010000"},{"L":"110011000101111", "M":"100010111111001","Q":"010010010110100","H":"000011101100010"},{"L":"110001100011000", "M":"100000011001110","Q":"010000110000011","H":"000001001010101"},{"L":"110110001000001", "M":"100111110010111","Q":"010111011011010","H":"000110100001100"},{"L":"110100101110110", "M":"100101010100000","Q":"010101111101101","H":"000100000111011"}];
        
        if (this.version < 7) {
            let info = arrayInfo[this.maskNumber][this.lvlCorrection];
            console.log(info);
            let ii = 0; let iii = 0;
            this.board[8][8] = Number(info[7]) == 1 ? 4 : 2;
            for (let i = 0; i < 8; i++) {
                // información de area (arriba izq)
                if (i != 6) {
                    //console.log(info[i])
                    this.board[8][i] = Number(info[ii]) == 1 ? 4 : 2;
                    ii++;
                }

                if (i != 1) {
                    this.board[7 - i][8] = Number(info[7 + i]) == 1 ? 4 : 2;
                }

                // información de area (abajo izq)
                if (this.board[this.d - 1 - i][8] != 4) { this.board[this.d - 1 - i][8] = Number(info[i]) == 1 ? 4 : 2;; }

                // información de area (arriba der)
                this.board[8][this.d - 1 - i] = Number(info[info.length - 1 - i]) == 1 ? 4 : 2;;
            }
        }

    }

}

/*
let qr = new QR(`There\\'s a frood who really knows where his towel is!`, 5, "Q")

const canvas:any = document.getElementById("canvas");
const ctx:any = canvas.getContext("2d");

qr.draw();
*/
//console.log("modo+cci",qr.firstPart());
//console.log("mensaje: ",qr.msgEncoding())
//console.log("data coding", qr.dataEncoding());
//console.log("data groups", qr.makeGroups(qr.dataEncoding()))
/*let arr=
[[[67,85,70,134,87,38,85,194,119,50,6,18,6,103,38],
[246,246,66,7,118,134,242,7,38,86,22,198,199,146,6]],
[[182,230,247,119,50,7,118,134,87,38,82,6,134,151,50,7],
[70,247,118,86,194,6,151,50,16,236,17,236,17,236,17,236]]];

console.log("error_test", qr.errorEncoding(arr));
*/

//console.log(qr.getFinalForm());
