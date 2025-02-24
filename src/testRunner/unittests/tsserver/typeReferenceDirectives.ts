import {
    baselineTsserverLogs,
    createLoggerWithInMemoryLogs,
    createSession,
    openFilesForSession,
} from "../helpers/tsserver";
import {
    createServerHost,
    File,
    libFile,
} from "../helpers/virtualFileSystemWithWatch";

describe("unittests:: tsserver:: typeReferenceDirectives", () => {
    it("when typeReferenceDirective contains UpperCasePackage", () => {
        const libProjectLocation = `/user/username/projects/myproject/lib`;
        const typeLib: File = {
            path: `${libProjectLocation}/@types/UpperCasePackage/index.d.ts`,
            content: `declare class BrokenTest {
    constructor(name: string, width: number, height: number, onSelect: Function);
    Name: string;
    SelectedFile: string;
}`,
        };
        const appLib: File = {
            path: `${libProjectLocation}/@app/lib/index.d.ts`,
            content: `/// <reference types="UpperCasePackage" />
declare class TestLib {
    issue: BrokenTest;
    constructor();
    test(): void;
}`,
        };
        const testProjectLocation = `/user/username/projects/myproject/test`;
        const testFile: File = {
            path: `${testProjectLocation}/test.ts`,
            content: `class TestClass1 {

    constructor() {
        var l = new TestLib();

    }

    public test2() {
        var x = new BrokenTest('',0,0,null);

    }
}`,
        };
        const testConfig: File = {
            path: `${testProjectLocation}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: {
                    module: "amd",
                    typeRoots: ["../lib/@types", "../lib/@app"],
                },
            }),
        };

        const files = [typeLib, appLib, testFile, testConfig, libFile];
        const host = createServerHost(files);
        const session = createSession(host, { logger: createLoggerWithInMemoryLogs(host) });
        openFilesForSession([testFile], session);
        host.writeFile(appLib.path, appLib.content.replace("test()", "test2()"));
        host.runQueuedTimeoutCallbacks();
        baselineTsserverLogs("typeReferenceDirectives", "when typeReferenceDirective contains UpperCasePackage", session);
    });

    it("when typeReferenceDirective is relative path and in a sibling folder", () => {
        const projectPath = `/user/username/projects/myproject/background`;
        const file: File = {
            path: `${projectPath}/a.ts`,
            content: "let x = 10;",
        };
        const tsconfig: File = {
            path: `${projectPath}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: {
                    types: [
                        "../typedefs/filesystem",
                    ],
                },
            }),
        };
        const filesystem: File = {
            path: `/user/username/projects/myproject/typedefs/filesystem.d.ts`,
            content: `interface LocalFileSystem { someProperty: string; }`,
        };
        const files = [file, tsconfig, filesystem, libFile];
        const host = createServerHost(files);
        const session = createSession(host, { logger: createLoggerWithInMemoryLogs(host) });
        openFilesForSession([file], session);
        baselineTsserverLogs("typeReferenceDirectives", "when typeReferenceDirective is relative path and in a sibling folder", session);
    });
});
