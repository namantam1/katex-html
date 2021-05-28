const katex = require("katex");

module.exports = (string, options) => {
    const regularExpression = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\\]*(?:\\.[^$\\]*)*\$/g;
    const blockRegularExpression = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]/g;

    const stripDollars = (stringToStrip) =>
        stringToStrip[0] === "$" && stringToStrip[1] !== "$"
            ? stringToStrip.slice(1, -1)
            : stringToStrip.slice(2, -2);

    const getDisplay = (stringToDisplay) =>
        stringToDisplay.match(blockRegularExpression) ? "block" : "inline";

    const renderLatexString = (s, t) => {
        let renderedString;
        try {
            // returns HTML markup
            renderedString = katex.renderToString(s, {
                ...options,
                displayMode: t === "block",
                strict: false,
                output: "html"
            });
        } catch (err) {
            console.error("couldn`t convert string", s);
            return s;
        }
        return renderedString;
    };

    const result = [];

    const latexMatch = string.match(regularExpression);
    const stringWithoutLatex = string.split(regularExpression);

    if (latexMatch) {
        stringWithoutLatex.forEach((s, index) => {
            result.push({
                string: s,
                type: "text"
            });
            if (latexMatch[index]) {
                result.push({
                    string: stripDollars(latexMatch[index]),
                    type: getDisplay(latexMatch[index])
                });
            }
        });
    } else if (string) {
        result.push({
            string,
            type: "text"
        });
    }

    const processResult = (resultToProcess=[]) => {
        const getSpanFromString = (str) => {
            const strs = str?.split(/\r\n|\r|\n/)
            const strsHtml = strs?.map(el => el && `<span>${el}</span>`)
            return strsHtml?.join("<br/>")
        }

        const newResult = resultToProcess.map((r) => {
            if (r.type === "text") {
                return getSpanFromString(r.string);
            }
            return renderLatexString(r.string, r.type);
        });

        return newResult;
    };

    // Returns list of spans with latex and non-latex strings.
    return processResult(result);
};
