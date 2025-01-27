declare module "oconf" {
    interface OconfOptions {
        /**
         * Current working directory.
         */
        cwd?: string;

        /**
         * Use relaxed JSON format.
         */
        relaxed?: boolean;

        /**
         * Absolute path or glob pattern for ignoring included files.
         */
        ignore?: string | string[];

        /**
         * Only values in #public objects will be extracted.
         */
        public?: boolean;
    }

    interface Oconf {
        load(rootFileName: string | string[], options?: OconfOptions): any;
    }

    const oconf: Oconf;
    export = oconf;
}
