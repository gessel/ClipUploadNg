// Last file size
var last_file_size = 0;

$(document).ready(function() {
    // Check if we are in edit mode and the required modules are available, then customize the toolbar
    if ($.inArray(mw.config.get('wgAction'), ['edit', 'submit']) !== -1) {
        // Inject the editor
        setupClipboard();
    }
});

// Start setting up the clipboard functionality
function setupClipboard() {
    var ClipSetting = {
        // Base API URL
        base_api_url: "api.php",

        // API responsible for handling uploads
        uploadUrl: "api.php",

        // Temporary filename
        filename: "I_From_CLIP.PNG",

        // Progress text during upload
        progressText: mw.msg("clipup-progressText"),

        // Text for failed upload
        failduploadText: mw.msg("clipup-failduploadText"),

        // Text for error returned from the API
        mwfeedbackerrorText: mw.msg("clipup-mwfeedbackerrorText"),

        // Text for successful upload, with {filename} to be replaced by the actual filename
        urlText: mw.msg("clipup-urlText").replace("%s", "{filename}"),

        // Event triggered when a file is received from the clipboard
        // Parameters: {Blob} file, file size
        onReceivedFile: function(file) {
            var KBSize = Math.round(file.size / 1024);

            // Check file size
            if (typeof(clipup_vars) === "undefined") {
                // Configuration variables do not exist
                this.progressText = mw.msg("clipup-notLoadConfig");
                // Since it's going to fail anyway, maybe add [this.faild]?
            } else if (file.size === last_file_size) {
                // Same size as the previous file, do not upload
                this.progressText = mw.msg("clipup-notsamesize");
            } else if (CheckFileSize(file.size)) {
                // Display toolbar prompt
                this.progressText = mw.msg("clipup-istoolarge").replace("%s", KBSize);
                // File is too large, provide a warning
            } else {
                // File name processing - everything looks good here
                if (clipup_vars.debug) { // If undefined, it should fail too
                    this.filename = "I_From_CLIP.PNG"; // Debug filename
                } else {
                    // Get a unique filename
                    this.filename = getTimeFileNameByClip();
                }
                // This will be pre-processed
                this.progressText = mw.msg("clipup-uploadingText").replace("%s", this.filename).replace("%s", KBSize);
            }

            this.progressText += "\n"; // Add a newline at the end
            ink_go(this.progressText);
            return true;
        },

        // Event triggered when an error occurs during upload
        onErrorUploading: function(return_json) {
            // No specific handling has been done
            mw_inserttag(mw.msg("clipup-errdoingupload"));
        },

        // Event triggered when a file is successfully uploaded
        // Parameter: {Object} json data returned from the server
        onUploadedFile: function(return_json, file) {
            return true;
        },

        // Check if a file can be uploaded before the upload process
        customUploadHandler: function(file) {
            if (typeof(clipup_vars) === "undefined") {
                // No configuration information
                return false;
            } else if (file.size === last_file_size) {
                // File size is the same as the previous file, do not upload
                return false;
            }
            // Final check for file size
            return !CheckFileSize(file.size);
        }
    };

    // Bind the settings
    inlineAttach.attachToInput(document.getElementById("wpTextbox1"), ClipSetting);
}

/**
 * Function to get a time-based filename
 * Purpose: Get a filename with a time stamp
 * Effect: The resulting filename will be similar to Clip_Cap_2013-1-3_23.26.13_0.PNG
 * Parameter: file_index (optional) for the file sequence number
 */
function getTimeFileNameByClip(file_index) {
    if (typeof(file_index) === "undefined") {
        file_index = ""; // Use an empty string if undefined
    } else {
        file_index = "-" + file_index;
    }

    // File extension, currently only handling JPG, as iOS 6 photo albums are in JPG format
    var file_ext = ".PNG";

    // Get the time string
    var timestr = get_format_date("yyMMdd-hhmmss");

    // Get the final new filename by combining the prefix, separator, and timestamp
    return "ClipCapIt" + "-" + timestr + file_ext;
}

// Insert text into the current edit box
function mw_inserttag(str) {
    mw.toolbar.insertTags(str, "", "");
}

// Check the file size, passing in the file size in bits
function CheckFileSize(filesize) {
    return (filesize > clipup_vars.maxfilesize * 1024);
}

// Get the formatted date
get_format_date = function(format) {
    /*
     * format="yyyy-MM-dd hh:mm:ss";
     */
    format = format || "yyyy-MM-dd hh:mm:ss";
    var now = new Date();

    var o = {
        "M+": now.getMonth() + 1,
        "d+": now.getDate(),
        "h+": now.getHours(),
        "m+": now.getMinutes(),
        "s+": now.getSeconds(),
        "q+": Math.floor((now.getMonth() + 3) / 3),
        "S": now.getMilliseconds()
    };

    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (now.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
};
