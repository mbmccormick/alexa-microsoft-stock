var Stock = require("google-stocks");
var Moment = require("moment-timezone");

exports.handler = function (event, context, callback) {
    if (event.source == "aws.events") {
        printDebugInformation("Received keep alive request from " + event.resources[0] + ".");

        return callback(null, "Success");
    }

    Stock(['MSFT'], function (error, data) {
        var quote = data[0];

        var exchange = quote.e;
        var ticker = quote.t;
        var lastTrade = Moment.tz(quote.lt_dts.slice(0, -1), "America/New_York");
        var price = quote.l_fix;
        var change = quote.cp_fix.replace("+", "").replace("-", "");

        var uid = exchange + ":" + ticker + ":" + lastTrade.toISOString();
        var updateDate = lastTrade.toISOString();
        var titleText = "$MSFT update for " + lastTrade.format("MMMM D, YYYY [at] h:mma");

        var mainText;

        var now = Moment();
        if (now.diff(lastTrade, "minutes") < 5) {
            // currently trading
            mainText = "Microsoft Corporation is currently trading at $" + price + " per share, " + (change > 0 ? "up" : "down") + " " + change + " points from the previous close.";
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
            mainText = "Microsoft Corporation closed at $" + price + " per share " + lastTrade.calendar(null, calendarOptions) + ", " + (change > 0 ? "up" : "down") + " " + change + " points from the previous close.";
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
};
