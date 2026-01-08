/**
 * Checks if a given string is a valid filename by searching for invalid characters.
 * @param {string} fileName The filename to validate.
 * @returns {boolean} True if the filename is valid, false otherwise.
 */
function isValidFileName(fileName: string): boolean {
    const invalidChars = /[\\/\?\*\|:"<>]/;
    return !invalidChars.test(fileName);
}

/**
 * Checks if a given string is a valid HTTP(S) URL using a regular expression.
 * @param {string} url The URL string to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidHttpURL(url: string): boolean {
    const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
        'i',
    ); // fragment locator
    return pattern.test(url);
}

export {
    isValidFileName,
    isValidHttpURL,
};
