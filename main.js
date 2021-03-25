// ----------------------------------------------- Variables -----------------------------------------------------
const Discord = require("discord.js");
let bot = new Discord.Client();
const puppeteer = require("puppeteer-core");
const itemData = require("./itemData.json");
const chalk = require("chalk");

const token = ""; // Your discord bot token

const guildID = ""; // Your server id

let browserPath = ""; // Chrome browser path
let extensionPath = ""; // Float checker extension path

let browser = "";
let page = "";
let p1Float = "";
let p2Float = "";
let p3Float = "";
let p4Float = "";
let p5Float = "";
let vpnCount = 1;
let pages = [];

// ------------------------------------------------- Main --------------------------------------------------------

start();

bot.on("ready", async () => { console.log("\nbot has logged into discord\n"); });

async function start() {
    console.log("bot has started");

    bot.login(token);

    browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: false,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`
        ]
    });
    console.log("browser has started\n");

    page = await browser.newPage();

    await switchVPN();

    while (true) {
        for (let i = 0; i < itemData.list.length; i++) {
            for (let j = 0; j < itemData.list[i].inputs.length; j++) {
                if (itemData.list[i].inputs[j].priority === "null") continue;
                for (let k = 0; k < itemData.list[i].inputs[j].skins.length; k++) {
                    let results = await getPageResults(itemData.list[i].inputs[j].skins[k].url, i, j, k);
                    let fullyLoadedItems = 0;
                    for (let r = 0; r < results.length; r++) {
                        if (results[r].price && results[r].float) {
                            fullyLoadedItems++;
                            if (results[r].float <= itemData.list[i].inputs[j].float && results[r].price <= itemData.list[i].inputs[j].price && results[r].price.length < 5) {
                                console.log(chalk.cyanBright(itemData.list[i].inputs[j].skins[k].name + " Float: " + results[r].float + " Price: " + results[r].price + "\n"));
                                if (results[r].float === p1Float) { continue; }
                                if (results[r].float === p2Float) { continue; }
                                if (results[r].float === p3Float) { continue; }
                                if (results[r].float === p4Float) { continue; }
                                if (results[r].float === p5Float) { continue; }
                                p5Float = p4Float
                                p4Float = p3Float
                                p3Float = p2Float;
                                p2Float = p1Float;
                                p1Float = results[r].float;
                                await alertUser(i, j, k, r);
                            }
                        }
                    }
                    if (fullyLoadedItems >= 100) console.log("Fully Loaded Items ==> " + chalk.green(fullyLoadedItems + "/100"));
                    else if (fullyLoadedItems >= 70) console.log("Fully Loaded Items ==> " + chalk.yellow(fullyLoadedItems + "/100"));
                    else console.log("Fully Loaded Items ==> " + chalk.red(fullyLoadedItems + "/100"));
                }
            }
        }
    }
}

async function updateConsole(i, j, k) {
    console.log("");
    console.log("-------------------------------Active Search------------------------------");
    console.log("Case: " + itemData.list[i].case + " : " + (k + 1) + "/" + itemData.list[i].inputs[j].skins.length)
    console.log("Item: " + itemData.list[i].inputs[j].skins[k].name);
    console.log("Float: <" + itemData.list[i].inputs[j].targetFloat);
    console.log("Price: <" + itemData.list[i].inputs[j].price);
    console.log("");
}

async function alertUser(i, j, k, r) {
    if (!itemData.list[i].user) return;

    let msg = "";
    if (itemData.list[i].inputs[j].priority === "insane") msg += "🥵";
    else if (itemData.list[i].inputs[j].priority === "elevated") msg += "⭐ ";

    msg += itemData.list[i].inputs[j].skins[k].name;
    msg += "\nTarget Float: " + itemData.list[i].inputs[j].targetFloat;
    msg += "\nFloat: " + pageResults[r].float.substring(0, 7);
    msg += "\nPrice: " + pageResults[r].price;
    msg += "\n" + itemData.list[i].inputs[j].skins[k].url; // .substring(8) for no "https://"

    try {
        await bot.guilds.cache.get(guildID).members.cache.find(m => m.nickname === itemData.list[i].user).user.send(msg);
    }
    catch (error) {
        console.log(error);
        console.log("discord error");
        try {
            await bot.guilds.cache.get(guildID).members.cache.find(m => m.nickname === itemData.list[i].user).user.send(msg);
        }
        catch (err) {
            console.log(err);
            console.log("2x discord error");
        }
    }
}

async function switchVPN() {
    let dataString = "";
    let count = 0;
    let exitValue = false;

    console.log("");
    console.log("-------------------------------Switching VPN------------------------------");

    const { exec } = require("child_process");
    const myScript = exec(`/home/pi/Bots/Market-Bot/vpns/bootVPN${vpnCount}.sh`); // use your vpn path
    myScript.stdout.on("data", (data) => { dataString += data; });
    myScript.stderr.on("data", (data) => { console.error(data); });

    while (!exitValue) {
        await page.waitFor(2 * 1000);
        if ((count % 3) === 0) console.log(`Trying to connect to VPN ${vpnCount}`);
        if (dataString.includes("Initialization Sequence Completed")) {
            exitValue = true;
            console.log(`Successfully switched to VPN ${vpnCount}`);
            nextVPN();
            return;
        }
        else if (count >= 8) {
            console.log(`VPN server ${vpnCount} too too long to connect...`)
            exitValue = true;
            nextVPN();
            await switchVPN();
            return;
        }
        count++;
    }

    function nextVPN() {
        if (vpnCount === 3) vpnCount = 1;
        else vpnCount++;
        return;
    }
}

async function getPageResults(url, i, j, k) {
    try {
        await page.goto(url);
    }
    catch (error) {
        console.log(error);
        console.log("\ncouldnt load the page so error was caught\n");
        await page.waitFor(10 * 1000);
        return getPageResults(url, i, j, k);
    }

    if (await page.$(".error_ctn")) {
        await switchVPN();
        return getPageResults(url, i , j, k);
    }

    try {
        await page.waitForSelector("#pageSize");
    }
    catch (error) {
        console.log(error);
        console.log("\npagesize button wasnt found on the page so error was caught\n");
        await page.waitFor(10 * 1000);
        return getPageResults(url, i, j, k);
    }

    updateConsole(i, j, k);

    await page.select("select#pageSize", "100");
    await page.waitFor(4.5 * 1000); // page.waitForNavigation();

    pageResults = await page.$$eval(".market_listing_row", rows => {
        return rows.map(row => {
            const properties = {};
            let priceRow = row.querySelector(".market_listing_price");
            let rawItemPrice = priceRow ? priceRow.innerText : '';
            let preItemPrice = rawItemPrice.substring(1);
            let itemPrice = preItemPrice.replace(",", "");

            let floatElement = row.querySelector(".csgofloat-itemfloat");
            let rawItemFloat = floatElement ? floatElement.innerText : '';
            let itemFloat = rawItemFloat.substring(7, 23);

            properties.price = itemPrice;
            properties.float = itemFloat;

            return properties;
        });
    });

    pageResults.shift();

    return pageResults;
}