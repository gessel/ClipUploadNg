/*jslint newcap: true */
/*global XMLHttpRequest: false, inlineAttach: false, FormData: false */
/*
 * Inline Text Attachment
 *
 * Copyright 2012 Roy van Kaathoven.
 * Contact: royvankaathoven@hotmail.com
 *
 * Licensed under the MIT License.
 */
(function(document, window) {
    "use strict";

    /**
     * Simple function to merge the given objects
     * Merge with default values, using the provided values if set.
     * @param {Object[]} objects - Multiple object parameters
     * @returns {Object} - Merged object
     */
    function merge(...objects) {
        const result = {};
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = obj[key];
                }
            }
        }
        return result;
    }

    /**
     * @param {Object} options - Configuration options
     * @param {Object} instance - Editor instance
     */
    window.inlineAttach = function(options, instance) {
        const settings = merge(options, inlineAttach.defaults);
        const editor = instance;
        const filenameTag = "{filename}";
        let lastValue; // Last inserted value
        const me = this;

        /**
         * Upload a given file blob
         * @param {Blob} file - File blob to upload
         */
        this.uploadFile = function(file) {
            const formData = new FormData();
            const xhr = new XMLHttpRequest();

            // Attach the file. If coming from clipboard, add a default filename (only works in Chrome for now)
            // http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
            formData.append(settings.uploadFieldName, file, `image-${Date.now()}.png`);

            formData.append("action", "upload");
            // Keep file upload warnings - considering their importance
            // formData.append("ignorewarnings", true);

            // Filename is important
            formData.append("filename", settings.filename);
            // Include comment
            formData.append("comment", clipup_vars.comment);
            formData.append("format", "json");
            // Token is here
            formData.append("token", mw.user.tokens.get("editToken"));

            // TODO: Rewrite the POST data to include more parameters
            xhr.open("POST", settings.uploadUrl);
            xhr.onload = function() {
                // If HTTP status is OK or Created
                if (xhr.status === 200 || xhr.status === 201) {
                    const data = JSON.parse(xhr.responseText);
                    // Trigger uploaded file event, pass back the returned data and the original file
                    me.onUploadedFile(data, file);
                } else {
                    // Trigger upload error event, don't return anything
                    me.onErrorUploading();
                }
            };
            xhr.send(formData);
        };

        /**
         * Check if the given file is allowed
         * @param {File} file - File to check
         * @returns {boolean} - Whether the file is allowed
         */
        this.isAllowedFile = function(file) {
            return settings.allowedTypes.includes(file.type);
        };

        /**
         * When a file has finished uploading
         * @param {Object} data - Upload response data
         * @param {File} uploadedFile - Uploaded file
         */
        this.onUploadedFile = function(data, uploadedFile) {
            const result = settings.onUploadedFile(data, uploadedFile);
            let replaceValue = null;
            let filename;

            // Check for errors
            if (data.error) {
                // Replace with appropriate final error message
                replaceValue = settings.mwfeedbackerrorText.replace("%s", data.error.info);
            } else {
                const returnJson = data.upload;
                // Check the return status
                if (returnJson.result === "Success") {
                    filename = returnJson.filename;
                    // Final replace value
                    replaceValue = settings.urlText.replace(filenameTag, filename);
                } else if (returnJson.result === "Warning") {
                    let lastWarningName;
                    for (let warningType in returnJson.warnings) {
                        lastWarningName = warningType;
                    }
                    // Here we get the warning type
                    if (lastWarningName === "duplicate") {
                        // Write the duplicate name
                        filename = returnJson.warnings.duplicate[0];
                        replaceValue = settings.urlText.replace(filenameTag, filename);
                    } else if (lastWarningName === "exists") {
                        // Already exists
                        filename = returnJson.warnings.exists;
                        replaceValue = settings.urlText.replace(filenameTag, filename);
                    } else {
                        // Other warning messages, just prompt
                        replaceValue = settings.failduploadText.replace("%s", lastWarningName);
                    }
                }
            }

            if (result !== false && replaceValue) {
                replaceValue += "\n"; // Always add multiple newlines
                // Let the factory handle it
                ink_replace(lastValue, replaceValue);
            }
        };

        /**
         * Custom upload handler
         * @param {Blob} file - File to upload
         * @returns {boolean} - Whether to prevent default upload behavior
         */
        this.customUploadHandler = function(file) {
            return settings.customUploadHandler(file);
        };

        /**
         * When a file didn't upload properly.
         * Override by passing your own onErrorUploading function with settings.
         */
        this.onErrorUploading = function() {
            // By default, delete everything
            ink_replace(lastValue, "");
            if (settings.customErrorHandler()) {
                window.alert(settings.errorText);
            }
        };

        /**
         * Append a line of text at the bottom, ensuring there aren't unnecessary newlines
         * @param {string} previous - Current content
         * @param {string} appended - Value which should be appended after the current content
         * @returns {string} - Formatted text with the appended value
         */
        function appendInItsOwnLine(previous, appended) {
            return (previous + "\n\n[[D]]" + appended)
                .replace(/(\n{2,})\[\[D\]\]/, "\n")
                .replace(/^(\n*)/, "");
        }

        /**
         * When a file has been received by a drop or paste event
         * @param {Blob} file - Received file
         */
        this.onReceivedFile = function(file) {
            // Record and set here, a truthy value is returned to ensure validity
            const result = settings.onReceivedFile(file);
            if (result !== false) {
                lastValue = settings.progressText;
                // Insert the information marker to be inserted, official behavior is to append it at the end
                // We changed it back to wiki style
                // editor.setValue(appendInItsOwnLine(editor.getValue(), lastValue));
            }
        };

        /**
         * Catches the paste event
         * @param {Event} event - Paste event
         * @param {Object} data - Paste data
         * @returns {boolean} - If a file is handled
         */
        this.onPaste = function(event, data) {
            this.onReceivedFile(data.blob);

            if (this.customUploadHandler(data.blob)) {
                this.uploadFile(data.blob);
            }

            return true;
        };
    };

    /**
     * Editor
     */
    window.inlineAttach.Editor = function(instance) {
        const input = instance;

        return {
            getValue: function() {
                return input.value;
            },
            setValue: function(value) {
                input.value = value;
            }
        };
    };

    /**
     * Default configuration
     */
    window.inlineAttach.defaults = {
        // URL to upload the attachment
        uploadUrl: "upload_attachment.php",
        // Request field name where the attachment will be placed in the form data
        uploadFieldName: "file",
        // Where is the filename placed in the response
        downloadFieldName: "filename",
        allowedTypes: ["image/jpeg", "image/png", "image/jpg", "image/gif"],

        /**
         * Will be inserted on a drop or paste event
         */
        progressText: "![Uploading file...]()",

        /**
         * When a file has successfully been uploaded, the last inserted text
         * will be replaced by the urlText, the {filename} tag will be replaced
         * by the filename that has been returned by the server
         */
        urlText: "![file]({filename})",

        /**
         * When a file is received by drag-drop or paste
         */
        onReceivedFile: function() {},

        /**
         * Custom upload handler
         * @returns {boolean} - When false is returned, it will prevent default upload behavior
         */
        customUploadHandler: function() {
            return true;
        },

        /**
         * Custom error handler. Runs after removing the placeholder text and before the alert().
         * Return false from this function to prevent the alert dialog.
         * @returns {boolean} - When false is returned, it will prevent default error behavior
         */
        customErrorHandler: function() {
            return true;
        },

        /**
         * Text for default error when uploading
         */
        errorText: "Error uploading file",

        /**
         * When a file has successfully been uploaded
         */
        onUploadedFile: function() {}
    };

    /**
     * Attach to a standard input field
     * @param {HTMLElement} input - Input field element
     * @param {Object} options - Configuration options
     */
    window.inlineAttach.attachToInput = function(input, options) {
        options = options || {};

        const editor = new inlineAttach.Editor(input);
        const inlineattach = new inlineAttach(options, editor);

        $(input).pastableTextarea();

        $(input).on("pasteImage", function(event, data) {
            inlineattach.onPaste(event, data);
        });
    };
})(document, window);
