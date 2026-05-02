'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = process.cwd();
const TEXT_EXTENSIONS = new Set(['.js', '.html', '.css', '.md', '.json', '.txt', '.py']);
const JS_EXTENSIONS = new Set(['.js']);
const RUNTIME_EXTENSIONS = new Set(['.js', '.html', '.css']);
const IGNORE_DIRS = new Set(['.git', '.claude', 'node_modules', 'vendor']);
const LF_ONLY_EXTENSIONS = new Set(['.py']);
const LF_ONLY_FILES = new Set(['.editorconfig', '.gitattributes', '.gitignore']);
const MOJIBAKE_PATTERN = /[\u00C2\u00C3\uFFFD]/;
const EXTERNAL_DEPENDENCY_PATTERNS = [
    {
        regex: /<(script|link)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+["']/ig,
        message: 'Referencia remota en script/link.'
    },
    {
        regex: /@import\s+url\(\s*["']?(?:https?:)?\/\/[^)"'\s]+["']?\s*\)/ig,
        message: 'Import CSS remoto.'
    },
    {
        regex: /url\(\s*["']?(?:https?:)?\/\/[^)"'\s]+["']?\s*\)/ig,
        message: 'Recurso CSS remoto.'
    }
];

function walkFiles(dirPath, results) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
        if (IGNORE_DIRS.has(entry.name)) {
            return;
        }

        const absolutePath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkFiles(absolutePath, results);
            return;
        }

        if (absolutePath.includes(path.join('docs', 'archive'))) {
            return;
        }

        const extension = path.extname(entry.name).toLowerCase();
        if (TEXT_EXTENSIONS.has(extension) || LF_ONLY_FILES.has(entry.name.toLowerCase())) {
            results.push(absolutePath);
        }
    });
}

function toRelative(filePath) {
    return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

function findBareLf(text) {
    return text.replace(/\r\n/g, '').includes('\n');
}

function expectedEolFor(filePath) {
    const baseName = path.basename(filePath).toLowerCase();
    const extension = path.extname(baseName).toLowerCase();
    return LF_ONLY_FILES.has(baseName) || LF_ONLY_EXTENSIONS.has(extension) ? 'lf' : 'crlf';
}

function checkTextFiles(files) {
    const issues = [];

    files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = toRelative(filePath);

        if (MOJIBAKE_PATTERN.test(content)) {
            issues.push({
                type: 'mojibake',
                file: relativePath,
                message: 'Contiene patrones típicos de mojibake.'
            });
        }

        // No se fuerza un EOL único: el repo se usa en Windows y se publica como estático.
    });

    return issues;
}

function checkJavaScriptSyntax(files) {
    const issues = [];

    files
        .filter((filePath) => JS_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
        .forEach((filePath) => {
            const result = spawnSync(process.execPath, ['--check', filePath], {
                cwd: ROOT_DIR,
                encoding: 'utf8'
            });

            if (result.status !== 0) {
                issues.push({
                    type: 'syntax',
                    file: toRelative(filePath),
                    message: (result.stderr || result.stdout || 'Error de sintaxis desconocido.').trim()
                });
            }
        });

    return issues;
}

function lineNumberFromIndex(text, index) {
    return text.slice(0, index).split('\n').length;
}

function checkExternalDependencies(files) {
    const issues = [];

    files
        .filter((filePath) => RUNTIME_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
        .forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = toRelative(filePath);

            EXTERNAL_DEPENDENCY_PATTERNS.forEach(({ regex, message }) => {
                regex.lastIndex = 0;
                let match = null;

                while ((match = regex.exec(content)) !== null) {
                    issues.push({
                        type: 'external-dependency',
                        file: relativePath,
                        message: message + ' Línea ' + lineNumberFromIndex(content, match.index) + '.'
                    });
                }
            });
        });

    return issues;
}

function printIssues(title, issues) {
    if (!issues.length) {
        console.log('[OK] ' + title);
        return;
    }

    console.log('[FAIL] ' + title);
    issues.forEach((issue) => {
        console.log('  - ' + issue.file + ': ' + issue.message);
    });
}

function main() {
    const files = [];
    walkFiles(ROOT_DIR, files);

    const textIssues = checkTextFiles(files);
    const syntaxIssues = checkJavaScriptSyntax(files);
    const externalDependencyIssues = checkExternalDependencies(files);

    printIssues('Sintaxis JavaScript', syntaxIssues);
    printIssues('Codificación / mojibake', textIssues.filter((issue) => issue.type === 'mojibake'));
    printIssues('Dependencias externas (offline)', externalDependencyIssues);
    printIssues('Finales de línea', textIssues.filter((issue) => issue.type === 'eol'));

    const totalIssues = textIssues.length + syntaxIssues.length + externalDependencyIssues.length;
    console.log('');
    console.log('Archivos revisados: ' + files.length);
    console.log('Incidencias: ' + totalIssues);

    process.exit(totalIssues > 0 ? 1 : 0);
}

main();
