// Required Modules
var request = require('request');
var cheerio = require('cheerio');
var handlebars = require("handlebars");
var fs = require("fs");

// Helpers
var getHandlebarsPartials = require("./helpers/getHandlebarsPartials");

// External Sources
require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var html = require("../template/market.html");
var descriptions = require("./descriptions.json");
var sources = require("./markets.json");

// Options
var jsonExport = true;
var url = "http://www.kerb.in";

sources["markets"].forEach(function(source) {
    request({
    "uri": source["uri"]
    }, function(err, resp, body){
        var $ = cheerio.load(body);
    
        // Create Structure for data
        var output = {};
        output["lastUpdated"] = Date();
        output["url"] = url;
        output["marketName"] = $(".col_left h3:first-of-type").text();

        // Target panel on Kerb website
        $(".rota_panel > ul > li").each(function(index) {
            index = "date-" + index;
            output[index] = {};
            output[index]["traders"] = [];
            output[index]["date"] = $(this).attr("rel");
            var numOfTraders = $(this).find("ul li").length;
    
            $(this).find("ul li").each(function(subIndex) {
                var handle = $(this).find("h4 a").attr("href").replace("/traders/", "").replace("/", "");
                var trader = {};
                trader["handle"] = handle;
                trader["standName"] = $(this).find("h4 a").text().replace(" (inKERBating)", "").replace(" - Seychelles Kitchen", "");
                if (descriptions[handle] != void(0)) {
                    trader["description"] = descriptions[handle];
                } else {
                    trader["description"] = $(this).find("p").text();
                }
                trader["href"] = $(this).find("h4 a").attr("href");
                trader["image"] = $(this).find("a > img").attr("src");
                if (numOfTraders - 1 == subIndex) {
                    trader["last"] = true;
                }
                output[index]["traders"].push(trader);
            });
        });

        // Create Folder
        if (!fs.existsSync("../" + source["handle"])) {
            fs.mkdir('../' + source["handle"], function (err) {
                if (err) {
                    throw err;
                } else {
                    console.log("Folder created for " + source["handle"]);
                }
            });
        }

        // Check if data is returned
        if(typeof output["date-0"] === 'undefined'){
            console.log("No data for " + source["handle"] + ", nothing written");
        } else {
            // Compile html using template.html
            
            var template = handlebars.compile(html);
            var result = template(output);

            // Output file
            fs.writeFile("../" + source["handle"] + "/index.html", result, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("File Written");
                }
            });

            if (jsonExport == true) {
                fs.writeFile("../" + source["handle"] + "/api.json", JSON.stringify(output), function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Json Written");
                    }
                });
            }
        }
    });
});

var port = process.env.PORT || 5000;