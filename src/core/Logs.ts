import fs from "node:fs";
import path from "node:path";
import type Client from "../classes/Client.js";

export default class Logs {
    client: Client;
    maxFileSize: number;
    logFilePath = "/build/logs";

    constructor(client: Client) {
        this.client = client;
        this.maxFileSize = this.client.config.logs.max_file_size * 1024 * 1024;
    }

    getLogFile = () => {
        if (!fs.existsSync(`${process.cwd()}${this.logFilePath}`)) {
            fs.mkdirSync(`${process.cwd()}${this.logFilePath}`);
        }

        if (!fs.existsSync(`${process.cwd()}${this.logFilePath}/amethyst.log`)) {
            fs.writeFileSync(`${process.cwd()}${this.logFilePath}/amethyst.log`, "");
        }

        return path.join(`${process.cwd()}${this.logFilePath}/amethyst.log`);
    };

    manageLogSize = async () => {
        const logFile = this.getLogFile();

        const stats = fs.statSync(logFile);
        if (!(stats.size >= this.maxFileSize)) return;

        const content = fs.readFileSync(logFile, "utf8");
        const logLines = content.split("\n").filter((line) => line.trim() !== "");

        let reductedContent = logLines.join("\n");
        while (Buffer.byteLength(reductedContent, "utf8") >= this.maxFileSize) {
            reductedContent = reductedContent.split("\n").slice(1).join("\n");
        }

        fs.writeFileSync(logFile, reductedContent, "utf8");
    };

    writeLogFile = async (type: "error" | "success" | "info" | "verbose" | "warn" | "deprecated", message: unknown) => {
        const logFile = this.getLogFile();

        try {
            const stack = new Error().stack as string;
            const stackArray = stack.split("\n");
            let stackline = stackArray[2]; // "		at FUNCTION (file:///FULLPATH:LINE:COL)"
            // remove the "		at " at the start
            stackline = stackline.replace("    at ", "");

            const stacklineArray = stackline.split(" ");
            let FunctionName: string | undefined = stacklineArray[0];
            // console.log(stacklineArray)
            let Path = stacklineArray[1] || stacklineArray[0]; // (file:///FULLPATH:LINE:COL)
            if (!Path) {
                Path = stacklineArray[0];
                FunctionName = undefined;
            }

            // Remove everything but the last part
            const PathArray = Path.split("/");
            Path = PathArray[PathArray.length - 1];
            // Remove the last ")"
            Path = Path.replace(")", "");

            const infoLine = FunctionName ? `${FunctionName} at ${Path}` : Path;
            if (typeof message === "object") {
                message = JSON.stringify(message, null, 2);
            }

            const fullMessage = `[${new Date().toISOString().replace("T", " ").replace("Z", "")}] [${type.toUpperCase()}] (${infoLine}) ${message}\n`;
            fs.appendFileSync(logFile, fullMessage, "utf-8");
            await this.manageLogSize();
        } catch (error) {
            if (!(error instanceof Error)) return;

            console.error(error);
            console.error(error.stack);
        }
    };

    readLogFile = () => {
        const logFile = this.getLogFile();

        const content = fs.readFileSync(logFile, "utf-8");
        const logLines = content.split("\n");
        logLines.pop(); // Remove the most recently added log line
        return logLines.join("\n");
    };

    init = async () => {
        if (fs.existsSync(`${process.cwd()}${this.logFilePath}`)) {
            if (fs.existsSync(`${process.cwd()}${this.logFilePath}/amethyst.log`)) {
                fs.writeFileSync(`${process.cwd()}${this.logFilePath}/amethyst.log`, "");
            }
        }
    };
}
