<?php
/**
 * Initialization file for the ClipUpload extension.
 *
 * @link https://www.mediawiki.org/wiki/Extension:ClipUpload Documentation
 * @link https://www.mediawiki.org/wiki/Extension_talk:ClipUpload Support
 * @link https://github.com/SLboat/ClipUpload/issues Issue tracker
 * @link https://github.com/SLboat/ClipUpload Source Code
 * @link http://see.sl088.com Author
 *
 * @ingroup Extensions
 *
 * @license http://www.gnu.org/copyleft/gpl.html GNU General Public License 2.0 or later
 * @author Slboat
 */

if ( !defined( 'MEDIAWIKI' ) ) {
    echo "This file is an extension to the MediaWiki software and cannot be used standalone.\n";
    die( 1 );
}

$wgExtensionCredits['parserhook'][] = [
    'path' => __FILE__,
    'name' => 'ClipUpload',
    'url' => 'https://www.mediawiki.org/wiki/Extension:ClipUpload',
    'descriptionmsg' => 'clipup-desc',
    'version' => '1.3.1',
    'author' => '[http://see.sl088.com SLboat]',
    'license-name' => 'GPL-2.0+',
];

$wgMessagesDirs['ClipUpload'] = __DIR__ . '/i18n';
$wgExtensionMessagesFiles['ClipUploadMagic'] = __DIR__ . '/ClipUpload.i18n.magic.php';

$wgHooks['EditPage::showEditForm:initial'][] = 'ClipSetup';

$wgResourceModules['ext.ClipUpload'] = [
    'scripts' => [
        'js/paste.js',
        'js/inline-attach.js',
        'js/clipupload.js',
        'js/ink-go.js',
    ],
    'messages' => [
        'clipup-desc',
        'clipup-notLoadConfig',
        'clipup-progressText',
        'clipup-failduploadText',
        'clipup-uploadingText',
        'clipup-urlText',
        'clipup-notsamesize',
        'clipup-istoolarge',
        'clipup-errdoingupload',
        'clipup-mwfeedbackerrorText',
    ],
    'localBasePath' => __DIR__,
    'remoteExtPath' => 'ClipUpload',
];

$wgClipUpComment = 'This file was uploaded from the clipboard ([[Category:Clipboard upload]]).';
$wgClipUpMaxFileSize = 500; // Maximum file size in kilobytes
$wgClipUpCheckSameFileSize = false; // Check if the uploaded file has the same size

function ClipSetup( $editPage ) {
    $config = $editPage->getConfig();

    $configData = [
        'comment' => $config->ClipUpComment,
        'maxFileSize' => $config->ClipUpMaxFileSize,
        'checkSameFileSize' => $config->ClipUpCheckSameFileSize,
    ];

    $configJson = json_encode( $configData );

    $editPage->getOutput()->addInlineScript(
        "var clipUpConfig = $configJson;"
    );

    $editPage->getOutput()->addModules( 'ext.ClipUpload' );

    return true;
}
