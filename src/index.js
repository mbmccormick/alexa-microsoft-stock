var Stock = require("google-stocks");
var Moment = require("moment-timezone");
var StockNews = require("google-finance");

exports.handler = function (event, context, callback) {
    if (event.source == "aws.events") {
        printDebugInformation("Received keep alive request from " + event.resources[0] + ".");

        return callback(null, "Success");
    }

    Stock(['MSFT'], function (err, data) {
        var quote = data[0];

        var exchange = quote.e;
        var ticker = quote.t;
        var lastTrade = Moment.tz(quote.lt_dts.slice(0, -1), "America/New_York");
        var price = quote.l_fix;
        var change = quote.cp_fix.replace("+", "").replace("-", "");

        StockNews.companyNews({ symbol: 'MSFT' }, function (err, data) {
            var news = data;

            var headlines = "";
            for (var i = 0; i < news.length; i++) {
                if (i == 3) {
                    break;
                }

                headlines += " ... " + news[i].title;
            }

            var uid = exchange + ":" + ticker + ":" + lastTrade.toISOString();
            var updateDate = lastTrade.toISOString();
            var titleText = "$MSFT update for " + lastTrade.format("MMMM D, YYYY [at] h:mma");

            var mainText;

            var now = Moment();
            if (now.diff(lastTrade, "minutes") < 5) {
                // currently trading
                mainText = "Microsoft Corporation is currently trading at $" + price + " per share, " + (change > 0 ? "up" : "down") + " " + change + " points from the previous close. Here are the latest headlines:" + headlines;
            }
            else {
                var calendarOptions = {
                    sameDay: "[today]",
                    nextDay: "[tomorrow]",
                    nextWeek: "dddd",
                    lastDay: "[yesterday]",
                    lastWeek: "[last] dddd",
                    sameElse: "[on] dddd"
                };

                // trading closed
                mainText = "Microsoft Corporation closed at $" + price + " per share " + lastTrade.calendar(null, calendarOptions) + ", " + (change > 0 ? "up" : "down") + " " + change + " points from the previous close. Here are the latest headlines:" + headlines;
            }

            var redirectionUrl = "https://www.google.com/finance?q=NASDAQ:MSFT";

            callback(null, {
                "uid": uid,
                "updateDate": updateDate,
                "titleText": titleText,
                "mainText": mainText,
                "redirectionUrl": redirectionUrl
            });
        });
    });
};