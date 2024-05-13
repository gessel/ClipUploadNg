/**
 * Paste.js - A JavaScript module for handling clipboard paste events
 * 
 * This module provides functionality to capture data from the clipboard when
 * the user performs a paste operation. It supports both Internet Explorer
 * and standard browsers (Chrome, Firefox, Safari).
 * 
 * Dependencies:
 * - jQuery
 */

(function($) {
    /**
     * Binds a paste event handler to the specified input element.
     * 
     * @param {HTMLElement} inputElement The input element to bind the paste event handler to.
     * @param {Object} settings An object containing the settings for the paste handler.
     */
    function bindPasteHandler(inputElement, settings) {
        // Check if the browser supports the Clipboard API
        var isClipboardApiSupported = navigator.clipboard !== undefined;

        // Bind the paste event handler
        $(inputElement).on('paste', function(e) {
            // Handle the paste event differently for Internet Explorer
            if (isIE()) {
                handlePasteForIE(e, settings);
            } else {
                handlePasteForStandardBrowsers(e, settings, isClipboardApiSupported);
            }
        });
    }

    /**
     * Handles the paste event for Internet Explorer.
     * 
     * @param {Event} e The paste event object.
     * @param {Object} settings An object containing the settings for the paste handler.
     */
    function handlePasteForIE(e, settings) {
        // Get the clipboard data as a file
        var clipboardData = window.clipboardData.getData('Text');
        var file = getFileFromClipboardData(clipboardData);

        // Call the onReceivedFile callback
        if (file && settings.onReceivedFile) {
            settings.onReceivedFile(file);
        }
    }

    /**
     * Handles the paste event for standard browsers (Chrome, Firefox, Safari).
     * 
     * @param {Event} e The paste event object.
     * @param {Object} settings An object containing the settings for the paste handler.
     * @param {boolean} isClipboardApiSupported A flag indicating if the Clipboard API is supported.
     */
    function handlePasteForStandardBrowsers(e, settings, isClipboardApiSupported) {
        // Check if the Clipboard API is supported
        if (isClipboardApiSupported) {
            handlePasteWithClipboardAPI(e, settings);
        } else {
            handlePasteWithClipboardData(e, settings);
        }
    }

    /**
     * Handles the paste event using the Clipboard API.
     * 
     * @param {Event} e The paste event object.
     * @param {Object} settings An object containing the settings for the paste handler.
     */
    function handlePasteWithClipboardAPI(e, settings) {
        // Prevent the default paste behavior
        e.preventDefault();

        // Get the clipboard data as a file
        navigator.clipboard.read().then(function(clipboardData) {
            var file = getFileFromClipboardData(clipboardData);

            // Call the onReceivedFile callback
            if (file && settings.onReceivedFile) {
                settings.onReceivedFile(file);
            }
        });
    }

    /**
     * Handles the paste event using the clipboard data object.
     * 
     * @param {Event} e The paste event object.
     * @param {Object} settings An object containing the settings for the paste handler.
     */
    function handlePasteWithClipboardData(e, settings) {
        // Get the clipboard data as a file
        var clipboardData = e.clipboardData || e.originalEvent.clipboardData;
        var file = getFileFromClipboardData(clipboardData);

        // Call the onReceivedFile callback
        if (file && settings.onReceivedFile) {
            settings.onReceivedFile(file);
        }
    }

    /**
     * Checks if the current browser is Internet Explorer.
     * 
     * @returns {boolean} A flag indicating if the current browser is Internet Explorer.
     */
    function isIE() {
        return (
            navigator.appName === 'Microsoft Internet Explorer' ||
            (navigator.appName === 'Netscape' &&
                /Trident/.test(navigator.userAgent))
        );
    }

    /**
     * Extracts a file from the clipboard data.
     * 
     * @param {DataTransfer|ClipboardData} clipboardData The clipboard data object.
     * @returns {File|null} The extracted file, or null if no file was found.
     */
    function getFileFromClipboardData(clipboardData) {
        var file = null;

        if (clipboardData && clipboardData.items) {
            var items = clipboardData.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    file = items[i].getAsFile();
                    break;
                }
            }
        }

        return file;
    }

    /**
     * Exposes the bindPasteHandler function to the global scope.
     */
    window.bindPasteHandler = bindPasteHandler;
})(jQuery);
