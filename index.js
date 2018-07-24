"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitbox_cli_1 = __importDefault(require("bitbox-cli/lib/bitbox-cli"));
var BITBOX = new bitbox_cli_1.default();
var langs = [
    'english',
    'chinese_simplified',
    'chinese_traditional',
    'korean',
    'japanese',
    'french',
    'italian',
    'spanish'
];
function testAsyncFunction() {
    return __awaiter(this, void 0, void 0, function () {
        var details, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("Test async address details:");
                    return [4 /*yield*/, BITBOX.Address.details("bitcoincash:qzjhzmheyyyt3sjv5qwvxq0wmweun5jfzsrca5hc9y")];
                case 1:
                    details = _c.sent();
                    console.log(details);
                    console.log("Test Price: Current Bitcoin Cash Prices:");
                    _b = (_a = console).log;
                    return [4 /*yield*/, BITBOX.Price.current()];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/];
            }
        });
    });
}
testAsyncFunction();
var lang = langs[Math.floor(Math.random() * langs.length)];
// create 256 bit BIP39 mnemonic
var mnemonic = BITBOX.Mnemonic.generate(256, BITBOX.Mnemonic.wordLists()[lang]);
console.log("BIP44 $BCH Wallet");
console.log("256 bit " + lang + " BIP39 Mnemonic: ", mnemonic);
// root seed buffer
var rootSeed = BITBOX.Mnemonic.toSeed(mnemonic);
// master HDNode
var masterHDNode = BITBOX.HDNode.fromSeed(rootSeed);
// HDNode of BIP44 account
var account = BITBOX.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");
console.log("BIP44 Account: \"m/44'/145'/0'\"");
for (var i = 0; i < 10; i++) {
    var childNode = masterHDNode.derivePath("m/44'/145'/0'/0/" + i);
    console.log("m/44'/145'/0'/0/" + i + ": " + BITBOX.HDNode.toCashAddress(childNode));
}
// derive the first external change address HDNode which is going to spend utxo
var change = BITBOX.HDNode.derivePath(account, "0/0");
// get the cash address
var cashAddress = BITBOX.HDNode.toCashAddress(change);
var hex;
BITBOX.Address.utxo(cashAddress).then(function (result) {
    if (!result[0]) {
        return;
    }
    // instance of transaction builder
    var transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    // original amount of satoshis in vin
    var originalAmount = result[0].satoshis;
    // index of vout
    var vout = result[0].vout;
    // txid of vout
    var txid = result[0].txid;
    // add input with txid and index of vout
    transactionBuilder.addInput(txid, vout);
    // get byte count to calculate fee. paying 1 sat/byte
    var byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 });
    // 192
    // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
    var sendAmount = originalAmount - byteCount;
    // add output w/ address and amount to send
    transactionBuilder.addOutput(cashAddress, sendAmount);
    // keypair
    var keyPair = BITBOX.HDNode.toKeyPair(change);
    // sign w/ HDNode
    var redeemScript;
    transactionBuilder.sign(0, keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, originalAmount);
    // build tx
    var tx = transactionBuilder.build();
    // output rawhex
    var hex = tx.toHex();
    console.log("Transaction raw hex: " + hex);
    // sendRawTransaction to running BCH node
    BITBOX.RawTransactions.sendRawTransaction(hex).then(function (result) {
        console.log("Transaction ID: " + result);
    }, function (err) {
        console.log(err);
    });
}, function (err) {
    console.log(err);
});
