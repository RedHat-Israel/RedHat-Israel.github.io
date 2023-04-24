export class Logger {
    get prefix() {
        return `[${this.host.localName}${this.host.id ? `#${this.host.id}` : ''}]`;
    }
    /**
     * A boolean value that indicates if the logging should be printed to the console; used for debugging.
     * For use in a JS file or script tag; can also be added in the constructor of a component during development.
     * @example Logger.debugLog(true);
     * @tags debug
     */
    static debugLog(preference = null) {
        // wrap localStorage references in a try/catch; merely referencing it can
        // throw errors in some locked down environments
        try {
            if (preference !== null) {
                Logger.logDebug = !!preference;
                localStorage.pfeLog = !!preference;
            }
            return localStorage.pfeLog === 'true';
        }
        catch (e) {
            return Logger.logDebug;
        }
    }
    /**
     * A logging wrapper which checks the debugLog boolean and prints to the console if true.
     *
     * @example Logger.log("Hello");
     */
    static log(...msgs) {
        if (Logger.debugLog()) {
            // eslint-disable-next-line no-console
            console.log(...msgs);
        }
    }
    /**
     * A console warning wrapper which formats your output with useful debugging information.
     *
     * @example Logger.warn("Hello");
     */
    static warn(...msgs) {
        console.warn(...msgs); // eslint-disable-line no-console
    }
    /**
     * A console error wrapper which formats your output with useful debugging information.
     * For use inside a component's function.
     * @example Logger.error("Hello");
     */
    static error(...msgs) {
        console.error([...msgs].join(' ')); // eslint-disable-line no-console
    }
    /**
     * Local logging that outputs the tag name as a prefix automatically
     *
     * @example this.logger.log("Hello");
     */
    log(...msgs) {
        Logger.log(this.prefix, ...msgs);
    }
    /**
     * Local warning wrapper that outputs the tag name as a prefix automatically.
     * For use inside a component's function.
     * @example this.logger.warn("Hello");
     */
    warn(...msgs) {
        Logger.warn(this.prefix, ...msgs);
    }
    /**
     * Local error wrapper that outputs the tag name as a prefix automatically.
     * For use inside a component's function.
     * @example this.logger.error("Hello");
     */
    error(...msgs) {
        Logger.error(this.prefix, ...msgs);
    }
    constructor(host) {
        this.host = host;
        // We only need one logger instance per host
        if (Logger.instances.get(host)) {
            return Logger.instances.get(host);
        }
        host.addController(this);
        Logger.instances.set(host, this);
    }
    hostConnected() {
        this.log('connected');
    }
}
Logger.instances = new WeakMap();
//# sourceMappingURL=logger.js.map