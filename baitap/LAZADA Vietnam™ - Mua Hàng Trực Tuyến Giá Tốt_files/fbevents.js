<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<head>
		<meta name="robots" content="noindex,nofollow" />
		<meta content="yes" name="apple-mobile-web-app-capable" />
        	<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
		
		<link rel="icon" type="image/vnd.microsoft.icon" href="img/favicon.ico"/>                          <link rel="shortcut icon" type="image/vnd.microsoft.icon" href="img/favicon.ico"/>         
		<link id="dynamicCSS" rel="stylesheet" type="text/css" href="/UserCheck/css/Blob_dynamic_css" />
		<link id="staticCSS" rel="stylesheet" type="text/css" href="/UserCheck/css/Blob_static.css" />

		
				<script type="text/javascript">
			//Create a dynamic element to allow sending of the document mode of IE.
			//This way we can notify PHP that it can display modern content instead of classic, despite the browser's reporting of being IE7.
			var headID = document.getElementsByTagName("head")[0];         
			var cssNode = document.createElement('link');
			cssNode.type = 'text/css';
			cssNode.rel = 'stylesheet';
			cssNode.href = "/UserCheck/css/UserCheckCSS" + (document.documentMode !== undefined ? "?documentMode=" + document.documentMode : "");
			headID.appendChild(cssNode);
		
			
/*
========================================================================================================================
PORTAL IS - ESSENTIALS INCLUSION - START
________________________________________________________________________________________________________________________
*/
// Set global PORTAL_IS namespace.
window.PORTAL_IS = {};

// Set namespace.
PORTAL_IS.CONF = {};

PORTAL_IS.CONF.AJAX_REQ_TIMEOUT = 15000;

// These properties describes the external references of the portal.
PORTAL_IS.CONF.MULTI_PORTALS = {};
PORTAL_IS.CONF.MULTI_PORTALS.EXTERNAL_PATH 		= "";
PORTAL_IS.CONF.MULTI_PORTALS.EXTERNAL_PORT		= 443;
PORTAL_IS.CONF.MULTI_PORTALS.EXTERNAL_HOST		= "192.168.0.0";
PORTAL_IS.CONF.MULTI_PORTALS.EXTERNAL_SCHEME	= "https";
PORTAL_IS.CONF.MULTI_PORTALS.XSRF_TOKEN			= "";

// The current web application name.
PORTAL_IS.CONF.WEBAPP_NAME = "UserCheck";

// Debug configurations
PORTAL_IS.CONF.MAX_STACK_SIZE = 1000;
PORTAL_IS.CONF.QUIET_MODE		= "on".toLowerCase() == "on";
PORTAL_IS.CONF.DEBUG_LEVEL 	= 0;


// Set namespace.
window.PORTAL_IS.L10N = {}

// Localization object.
//=============================================================================================
function __L10N()
{
	this.strings = new Array();
	this.browserLangs = new Array();

	this.init = function()
	{
		var obj = {"UC_TITLE":"Check Point UserCheck","UC_TITLE_MOBILE_DLP":"Check Point UserCheck Mobile DLP","BUTTON.OK":"OK","BUTTON.CANCEL":"Cancel","BUTTON.SEND":"Send","BUTTON.DISCARD":"Discard","BUTTON.APPROVE":"Approve","BUTTON.CONFIRM":"Confirm","WRONG_ID":"This notification page has expired. You can safely close the page or ","TIMEOUT":"This notification page has expired. You can safely close the page or ","RETRY":"reload the original page.","REPORT_SUCCESS":"Report was sent successfully.","REPORT_ERROR":"An error occured while sending the report.","REQUIRED_FIELDS":"Required fields","ENTER_TEXT":"Enter text","RETURN_TO_SITE":"Return to site","UC.BLOCKED_IFRAME":"Learn more...","UC.INFO_IFRAME":"Click to resolve...","PLEASE_WAIT":"Please wait . . .","NO_SCRIPT":"This portal requires browser which support JavaScript.<br>Please make sure that you are using an updated browser and that JavaScript is enabled.","MSGBOX_TITLE_CONFIRMATION":"Confirmation","MSGBOX_TITLE_JUSTIFICATION":"Justification","MSGBOX_TITLE_APPROVER":"Approver","MSGBOX_TITLE_WARNING":"Warning","MSGBOX_TITLE_ATTENTION":"Attention","MSGBOX_TITLE_ERROR":"Error","MSGBOX_TITLE_REPORT_ERROR":"Report an error","MSGBOX_TITLE_EXTEND_EXPIRATION":"Extend expiration date","DEFAULT_GENERIC_CLIENT_ERROR":"An unexpected error has occurred.\nYou may still be able to continue working normally.\nPlease retry accessing the web page in a short while.\n\n","DEFAULT_GENERIC_TIMEOUT_CLIENT_ERROR":"You may not access this page, or this page has expired.\nPlease sign in.","LOG_REFERENCE_ID":"Log reference id: ","ERROR.LINK.SEND_ERROR_REPORT":"Send error report","ERROR.LINK.IM_HAVING_PROBLEMS":"I am having problems with this Portal.","CHECKPOINT_COPY_RIGHTS":"&copy;2016 Check Point Software Technologies Ltd.","EMAIL_SENT":"The email has been sent","EMAIL_DISCARDED":"The email has been discarded","EMAIL_ALREADY_SENT":"The email has already been sent","EMAIL_ALREADY_DISCARDED":"The email has already been discarded","UNKOWN_INCIDENT_STATUS":"An unexpected error has occurred.\nThe incident status is unknown","REVIEW_TEXT":"Review issue in portal","MAIL.ITEM.ATTACHMENTS":"Attachments","HTTP_LEARNING":"To complete the operation, <b>please return to site and resend the information<\/b>, thanks.","HTTP_LEARNING_ERROR_MSG":"Sending the message cannot be approved,<\/br> please contact your system administrator.","HTTP_LEARNING_ERROR_TOOLTIP":"Sending the message cannot be approved, please contact your system administrator.","IE6_MESSAGE1":"Please upgrade your browser in order to use UserCheck","IE6_MESSAGE2":"This site doesn't support this browser (Internet Explorer 6).<br\/>This site is supports Internet explorer 7, Chrome, Firefox, and Opera.","CP_SCRUB_WAIT_MESSAGE":"Please wait while loading files...","CP_SCRUB_RESULT_SUCCESS":"Threat Prevention didn't detect cleanable parts","CP_SCRUB_RESULT_FAILURE":"File structure may be corrupted","CP_SCRUB_RESULT_TIMEOUT":"","CP_SCRUB_RESULT_UNSUPPORTED_FILE":"File contents do not match the extension","CP_SCRUB_RESULT_NOT_SCRUBBED":"","CP_SCRUB_RESULT_INTERNAL_ERROR":"","CP_SCRUB_RESULT_NO_VALID_CONTRACT":"","CP_SCRUB_RESULT_SKIPPED_BY_TE_CONFIDENCE":"","CP_SCRUB_RESULT_OUT_OF_MEMORY":"","CP_SCRUB_RESULT_DOCSEC_FILE":"File encrypted using Checkpoint's Document Security","CP_SCRUB_RESULT_ENCRYPTED_FILE":"contains encrypted data","CP_SCRUB_RESULT_SKIPPED_BY_SCRIPT":"","CP_SCRUB_RESULT_DISK_LIMIT_REACHED":"","CP_SCRUB_INVALID_EMAIL":"Invalid Email Address","CP_SCRUB_SEND_MAIL_STRING":"Send the original mail to me:","CP_SCRUB_SEND_EMAIL_EXAMPLE":"john@hackme.com","CP_SCRUB_SEND_EMAIL_SUCCESS":"Mail was sent successfully, please check your inbox","CP_SCRUB_SEND_EMAIL_ERROR":"Could not send mail to the recipient, please verify your address","CTNT_EMAIL_CONFIRM":"Thank you for your input. To complete the operation, <b>please resend the email<\/b>.\n <br\/>It is safe to close this page."};
		
		for(val in obj)
			this.strings[val] = obj[val];
			
		obj = ["vi-VN","vi;q=0.9","en-GB;q=0.8","en;q=0.7","fr-FR;q=0.6","fr;q=0.5","en-US;q=0.4"];
		
		for(val in obj)
		{
			this.browserLangs[val] = obj[val].split(';')[0];
		}
	}

	this.getStr = function(stringId)
	{
		return this.strings[stringId];
	}
	
	this.selectLanguage = function(languageArray)
	{
		for(lang in this.browserLangs)
		{
			if(languageArray[this.browserLangs[lang]] === true)
				return this.browserLangs[lang];
				
			if(languageArray[this.browserLangs[lang].substring(0, 2)] === true)
				return this.browserLangs[lang].substring(0, 2);
		}
		
		//If nothing succeeded, return the default.
		return "en";
	}
	
	this.reloadLanguageTo = function(lang, fallbackLang, callback)
	{
		var requestData = {};
		
		requestData.lang = lang;
		requestData.fallbackLang = fallbackLang;

		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetTranslationData");
	
		sendAsynchronousRequest(sAbsoluteURL,
								flattenObject(requestData),
								this.asyncReloadLangHandler,
								this,
								[callback]);
	}
	
	this.asyncReloadLangHandler = function(xhrStatus, xhrResponse, callback)
	{
		if (xhrStatus != 200)
		{
			DEBUG.out('Retreiving translation data failed. ('+xhrStatus+')', DEBUG.ERROR);
			return;
		}
		
		var obj = JSON.parse(xhrResponse);
		this.strings = null; //Ensure removing of old values.
		this.strings = new Array();
		
		for(val in obj)
			this.strings[val] = obj[val];
			
		callback();
	}
}
//=============================================================================================

//Localization object.
L10N_Obj = new __L10N();
L10N_Obj.init();
PORTAL_IS.L10N.L10N_Obj = L10N_Obj;

/*
________________________________________________________________________________________________________________________

PORTAL IS - ESSENTIALS INCLUSION - END
========================================================================================================================
*/
			var noJSCrypto = "true";
		</script>
		<script type="text/javascript" src="js/Blob.js"></script>
		<script type="text/javascript">
			

// Create namespace
window.UserCheck = {};
window.UserCheck.tools = {};

// =======================================================================================
function parseSender(value)
{
	return value.address;
}
// =======================================================================================


// =======================================================================================
// Render recipient list from and array.
// String[] recipientsArr   - Array of recipients.
// [int ellipsisLimit]      - A string beyond this length will be cut and added ellipsis. Optional, default is 0 - no ellipsis.
// [bool useLinebreakes]    - Should a line break be added after each recipient. Optional, default is true.
function recipientsArr2StrInTable(recipientsArr, ellipsisLimit, useLinebreakes)
{
    if (ellipsisLimit == undefined)
    {
        ellipsisLimit = 0;
    }

    if (useLinebreakes == undefined)
    {
        useEllipsis = true;
    }

	var recipientsList = "";

	for (var i=0; i<recipientsArr.length; i++)
	{
		recipientsList += HTMLEncode(recipientsArr[i].address);
		if (i < recipientsArr.length-1)
		{
			recipientsList += ", ";
			if (useLinebreakes)
			{
			    recipientsList += "<br>";
            }
		}
	}

	if (ellipsisLimit > 0)
	{
	    //recipientsList = Ext.util.Format.ellipsis(recipientsList, ellipsisLimit);
	    recipientsList = recipientsList;
    }

	return recipientsList;
}
// =======================================================================================


// =======================================================================================
// Render recipient list from and array.
// Sender sender            - The sender data.
// [int ellipsisLimit]      - A string beyond this length will be cut and added ellipsis. Optional, default is 0 - no ellipsis.
// [bool useLinebreakes]    - Should a line break be added after each recipient. Optional, default is true.
function getSenderName(sender, ellipsisLimit)
{
    var output = "";

    if (ellipsisLimit == undefined)
    {
        ellipsisLimit = 0;
    }

    if (sender.name.empty())
    {
        output = sender.address;
    }
    else
    {
        output = sender.name;
    }

//	if (ellipsisLimit > 0)
//	{
//	    output = Ext.util.Format.ellipsis(output, ellipsisLimit);
//    }

	 return output;
}
// =======================================================================================


// =======================================================================================
// Render recipient list from and array.
// String sender            - The subject string.
// [int ellipsisLimit]      - A string beyond this length will be cut and added ellipsis. Optional, default is 0 - no ellipsis.
// [bool useLinebreakes]    - Should a line break be added after each recipient. Optional, default is true.
function getSubject(subject, ellipsisLimit)
{
    var output = subject;

    if (ellipsisLimit == undefined)
    {
        ellipsisLimit = 0;
    }

//	if (ellipsisLimit > 0)
//	{
//	    output = Ext.util.Format.ellipsis(output, ellipsisLimit);
//    }

	 return output;
}
// =======================================================================================


// =======================================================================================
// tranform recipients array to string
function recipientsArr2Str(recipientsArr,type) 
{
    var recipientsList = "";
    var address = "";
    var commaNeeded = false;
    for (var i=0; i<recipientsArr.length; i++)
    {
        if (type == recipientsArr[i].recipientType)
        {
            if (!commaNeeded)
                commaNeeded = true;
            else                                
                recipientsList += ", ";
                
            address = HTMLEncode(recipientsArr[i].address);
            if (recipientsArr[i].isExternal)
            {
                address = '<span ' + GetDomainColor(recipientsArr[i].address)+' >' + address + '</span>'
            }  
            recipientsList += address;
        }
    }

    return recipientsList;
}

// =======================================================================================
function arr2Str(arr)
{
    var str = "";
    var commaNeeded = false;
    for (var i=0; i<arr.length; i++)
    {
        if (!commaNeeded)
        {
            commaNeeded = true;
        }
        else
        {
            str += ", ";
        }
        str += arr[i];
    }

    return str;
}

function GetDomainColor(str)
{
    // var highlightColors = new Array("FFFF00","00FF00","00FFFF","FF00FF","FF0000","FFFF99","99FF99","CCFFFF","FFCCFF", "FF9999")
	var highlightColors = new Array("FFFF00","FF00FF","FF0000","FFBB00","FF9999");
    domainName = GetDomainName(str);
    if (domainName==null) return null;

    hash=0;
    for (i=0; i<domainName.length; i++)
    {
        hash += domainName.charCodeAt(i);
    }
    hash = hash % (highlightColors.length);
    return 'style="background-color: #' + highlightColors[hash] + '; text-decoration: underline;"';
}

/*
// =======================================================================================
UserCheck.tools.clearContainer = function(containerId)
{
    DEBUG.out("Clear container: "+containerId);
	var container = Ext.getCmp(containerId);
    if ((container) && (container.items))
    {
        container.items.each(
            function(item)
            {
             container.remove(item, true);
            }
        );
    }
}
// =======================================================================================
*/

// Override poral_is error handler.
//=============================================================================================
window.genericTimeoutHandler = function(portalException)
{
	DEBUG.out("UserCheck::genericTimeoutHandler.");

	if ((portalException == undefined) || (portalException == null))
	{
		portalException = new PortalException();
	}
	
	// Assign action to the Ok button.
	// The event is added in order to get the exception, if it is set, that is set as the error message OK button attribute. see showPortalErrorMessage
	postErrorHandler = function(event)
	{
		// Check if redirected due to timeout.
		if (getCookie("isRedirectedDueTimeout") == "1")
		{
			// Delete the cookie to allow future errors.
			setCookie("isRedirectedDueTimeout", "0", 0);

			// TODO: Redirect to error page.
			return;
		}

		// Set cookie in order to prevent error loops.
		setCookie("isRedirectedDueTimeout", "1", 5*60);

		genericPostErrorHandler(event);

		// Reload the page.
		document.location.href=document.location.href;
	}

	// TODO: Get message from resource bundle.
	//var errMsg = "Your session has expired or timed out.\nYou will be redirected to the login page.\n\n";
	showPortalErrorMessage(portalException, postErrorHandler, true);
}
//=============================================================================================



//=============================================================================================
window.genericErrorHandler = function(portalException, callback)
{
	DEBUG.out("UserCheck::genericErrorHandler.");
	if ((portalException == undefined) || (portalException == null))
	{
		portalException = new PortalException();
	}

	if (isNothingness(callback))
	{
		callback = new Callback();
	}

	// Assign action to the Ok button.
	// The event is added in order to get the exception, if it is set, that is set as the error message OK button attribute. see showPortalErrorMessage
	postErrorHandler = function(event)
	{
		genericPostErrorHandler(event);
        callback.call();
		// No reload of the page.
	}

	showPortalErrorMessage(portalException, postErrorHandler, true);
	return true; // This is required for the execption to stop from being passed to the browser.
}
//=============================================================================================



//=============================================================================================
window.genericPostErrorHandler = function(event)
{
	DEBUG.out("UserCheck::genericPostErrorHandler.");
	// Just hide the error.
	hidePortalErrorMessage();
}
//=============================================================================================

//=============================================================================================
UserCheck.tools.sendErrorReport = function(userDesc, callback)
{
	DEBUG.out("UserCheck.tools.sendErrorReport in.");

    var sAbsoluteURL = getURL("data/submitErrorReport");
    var report = encodeURIComponent(DEBUG.compileErrorReport());
    var userDesc = encodeURIComponent(userDesc);

	var sendErrorReportCallback = new Callback();
	sendErrorReportCallback.methodReference = UserCheck.tools.handleErrorReportResponse;
	sendErrorReportCallback.args.push(callback);

	// Send report with no error handlers.
	PORTAL_IS.AJAX_MGR.sendAsyncReq(sAbsoluteURL, "report="+report+"&userDesc="+userDesc, sendErrorReportCallback, null, null, "Sending of error report failed.");	

	// Set error flag.
	PORTAL_IS.TOOLS.errorMsgShown = false;	
}
//=============================================================================================

//=============================================================================================
UserCheck.tools.handleErrorReportResponse = function(xhrStatus, xhrResponse, callback)
{
	DEBUG.out("UserCheck.tools.handleErrorReportResponse in.");

	// Set error flag.
	PORTAL_IS.TOOLS.errorMsgShown = false;

	if (isNothingness(callback))
	{
		callback = new Callback();
	}

	if (xhrStatus != 200)
	{
		// TODO: Handle error.
		DEBUG.out('Submitting error report failed. ('+xhrStatus+')', DEBUG.ERROR);
		callback.call();
		showPortalMessage("Sending of error report failed.");
		return;
	}

	callback.call();
	
	showPortalMessage("Error report was sent successfully.\nThank you for your support.", null, UserCheck.MESSAGE_TYPE.Confirmation);
}
//=============================================================================================

//=============================================================================================
UserCheck.tools.showErrorReport = function(callback)
{
	DEBUG.out("UserCheck.tools.showErrorReport in.");

	// Create new callback with send report and store previous callback in it.
	submitCallback = new Callback();
	submitCallback.methodReference 	= DEBUG.sendErrorReport;
	submitCallback.args = [callback];

	// Create new callback for cancel.
	cancelCallback = new Callback();
	cancelCallback.methodReference 	= function()
	{
		// Clear error flag. 
		PORTAL_IS.TOOLS.errorMsgShown = false;
		callback.call();
	};

    // Hide any opened boxes.
    PORTAL_IS.TOOLS.hideGeneralContainer();
    PORTAL_IS.TOOLS.hideDialog();
    hidePortalMessage();
    hidePortalErrorMessage();

 	PORTAL_IS.TOOLS.showDialog(	"Please describe the encountered problem in the text box below.",
 							"NOTICE: The report might include personal information from your mail items.\nThe report will not include your credentials.",
 							"I was trying to (e.g. review an email):\n\nWork flow which led to this error (e.g. access via email link):\n\nI am unable to:",
 							"Report an error",
 							submitCallback, cancelCallback, null, null, null, null, true);

	// Set error flag. 
	PORTAL_IS.TOOLS.errorMsgShown = true;
}
//=============================================================================================


//=============================================================================================


//=============================================================================================

DEBUG.showErrorReport = UserCheck.tools.showErrorReport;
DEBUG.sendErrorReport = UserCheck.tools.sendErrorReport;

UserCheck.tools.oTimeoutManager =
{
	timerID: -1,
	startTimeoutTimer: function(duration, callback)
	{
		var milisecs = duration * 1000;
        if (milisecs > 2147483646)
        {

            milisecs = 2147483646;

        }
		DEBUG.out("UserCheck.tools.TimeoutManager: Starting timer for " + duration + " seconds.");
		window.TimeoutManagerCallback = callback;
		this.timerID = setTimeout("this.TimeoutManagerCallback();", milisecs);
	},
	stopTimeoutTimer: function()
	{
		clearTimeout(timerID);
		timerID = -1;
	}
};

UserCheck.DataObj = {};

// TODO: This should be defined as an "interface" class and other view managers should implement it.

// UC's view manager.
window.UCViewManager = function()
{
	this.lastRenderedCustomContentContainers = new Array();
	this.defaultContainer = 'portal_main_view';
	this.ignoreHashChange = false;
    this.wait = null;
    this.requestParams = null;

	// Hash to view mapping, enables us to set display another value than the actual view name.
	//==================================================================================================================
	this.hashViewMap = new Array();
	//   		      Hash name									View name
	//__________________________________________________________________________________________________________________
	this.hashViewMap["UserAction"]								=	"UserAction";
	this.hashViewMap["MainWithMenuView"]					=	"MainWithMenuView";
	this.hashViewMap["Menu"]								=	"Menu";
	this.hashViewMap["Logout"]								=	"Logout";
	this.hashViewMap["MainView"]							=	"MainView";
	this.hashViewMap["Error"]								=	"Error";

	// Get View name from Hash name.
	this.hash2View = function(hash)
	{
		var view = this.hashViewMap[hash];

		if (isNothingness(view))
		{
			view = "UserAction";
		}
		return view;
	}

	// Get Hash name from View name.
	this.view2Hash = function(view)
	{
		var hash = "UserAction";
		for (key in this.hashViewMap)
		{
			if (this.hashViewMap[key] == view)
			{
				var hash = key;
			}
		}
		return hash;
	}
	//==================================================================================================================

    // Initialize view manager.
	//=============================================================================================
	this.init = function()
	{
		DEBUG.out("UCViewManager::init");

		// Bind history change handler.
		$(window).bind('hashchange', viewManager.handleHistoryChange);

        // Check address bar's hash and set desired view if exists.
		var desiredView = this.parseHash().view;
		if (isNothingness(desiredView))
		{
			desiredView = "";
		}

		DEBUG.out("UCViewManager::init, desired view: [" + desiredView + "]");
		this.gotoNextView(desiredView);
	}
	//=============================================================================================



    // Handle history changes (back/reload).
    // Overriding default handling.
	//=============================================================================================
	this.handleHistoryChange = function(e, ui)
	{	
		// In some cases the hash is changed and no view load is required, checking if so.
		if (!viewManager.ignoreHashChange && ui != undefined)
		{
			// Parse view from hash.
			var desiredView = viewManager.parseHash().view;
			DEBUG.out("UCViewManager::handleHistoryChange, desired view:" + desiredView);
			viewManager.gotoNextView(desiredView);
		}
		else
		{
			DEBUG.out("UCViewManager::handleHistoryChange, hash changed ignored.");	
		}

		// Reset the ignore flag.
        viewManager.ignoreHashChange = false;
	}
	//=============================================================================================


	// Queries the server for next desired view and than call for rendering it.
	// Will call upon callback when done rendering the view.
	//=============================================================================================
	this.gotoNextView = function(requestedView, callback)
	{
    	DEBUG.out("UCViewManager::gotoNextView");

    	if (isNothingness(callback))
    	{
    	    callback = new Callback();
		}

        // Check what is the next view.
        var sAbsoluteURL 	= PORTAL_IS.TOOLS.getURL("GetNextView");
		var parameters 		= (isNothingness(requestedView)) ? ("") : ("requestedView=" + encodeURIComponent(requestedView));

		var gotoNextViewCallback = new Callback();
			gotoNextViewCallback.methodReference    = this.handleGotoNextViewRequest;
			gotoNextViewCallback.thisArgument       = this;
			gotoNextViewCallback.args               = [callback];

        PORTAL_IS.AJAX_MGR.sendAsyncReq(sAbsoluteURL, parameters, gotoNextViewCallback);
	}
	//=============================================================================================


	// Handle next view query.
	//=============================================================================================
	this.handleGotoNextViewRequest = function(xhrStatus, xhrResponse, callback)
	{
		DEBUG.out("UCViewManager::handleGotoNextViewRequest");

		if (isNothingness(callback))
    	{
    	    callback = new Callback();
		}

		if (xhrStatus != 200)
		{
			DEBUG.out('Retreiving next view failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}

		var nextViewJSONObj = JSON.parse(xhrResponse);
        var nextView = nextViewJSONObj.view;
		DEBUG.out("UCViewManager::handleGotoNextViewRequest, next view:" + nextView);

		// Extract the data (request params) from hash and relay it onto next hash.
		// As hash changing handler will be passed back to this method we set the Ignore flag to TRUE
		// and call for the gotoView method.
		viewManager.changeHash(nextView, viewManager.parseHash().data, true);

		viewManager.gotoView(nextView, callback);
	}
	//=============================================================================================


	// Get view contents (CSS, JS and HTML).
	// Will call upon callback when done rendering the view.
	//=============================================================================================
	this.gotoView = function(view, callback)
	{
        DEBUG.out("UCViewManager::gotoView view: ["+view+"]");

        if (callback == undefined)
    	{
    	    callback = new Callback();
		}

		var hash = this.parseHash().view;
		var parameters = (hash == "") ? ("view="+encodeURIComponent(hash)) : ( "requestedView=" + encodeURIComponent(view) + "&view="+encodeURIComponent(hash) );

		sendAsynchronousRequest(PORTAL_IS.TOOLS.getURL("viewManager/GetViewData"),
								parameters,
								this.handleNewView,
								this,
								[callback]);
	}
	//=============================================================================================


    // Handle new view rendering.
	//=============================================================================================
	this.handleNewView = function(xhrStatus, xhrResponse, callback)
	{
		if (callback == undefined)
    	{
    	    callback = new Callback();
		}

		if (xhrStatus != 200)
		{
			// TODO: Handle error.
			DEBUG.out('Retreiving view failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}

		var newViewJSONObj = JSON.parse(xhrResponse);
        var newView = newViewJSONObj.view;
		DEBUG.out("UCViewManager::handleNewView, Parsed from JSON - view:" + newView);


		var useDefaultContainerId   = true;
		var requiredContainerId     = "";
		var requiredView            = "";
		var requireSecureConnection = false;

		switch (newView)
		{
			default: // View will be rendered into main page view.
				useDefaultContainerId   = true;
				requiredContainerId     = this.defaultContainer;
			break;
		}

		// Check if in https, redirect if not.
		if ((requireSecureConnection) && (location.protocol.toLowerCase() == 'http:'))
		{			
			newLocation = location.href.replace(/http:/i, "https:");
			location.href = newLocation;
			return;
		}

		var containerId = this.defaultContainer;
		if (!useDefaultContainerId)
		{
			containerId = requiredContainerId;
		}

		//var container = Ext.getCmp(containerId);
		var container = document.getElementById(containerId);

        if (container != undefined)
		{

			DEBUG.out('Render new view ('+newViewJSONObj.view+') into [' + (useDefaultContainerId ? "DefaultContainer" : requiredContainerId) + "].");

			// Render CSS. - Not needed, all CSS loads from one blob file.
			//evaluateCSS(newViewJSONObj.css, "");

			// Clear existing content.
			container.innerHTML = "";

			// If the html content is not empty, render it into a new pane.
			container.innerHTML = newViewJSONObj.html;

			// Render JavaScript Content.
			evaluateJavaScript(newViewJSONObj.javascript);

		}
		else if (requiredContainerId == this.defaultContainer)
		{

			DEBUG.out('Default view is missing and will be rendered...');
			this.renderDefaultView();
			this.handleNewView(xhrStatus, xhrResponse, callback);

		}
		else // The container is not present and needs to be rendered first.
		{

			DEBUG.out('Required view ('+requiredContainerId+') is missing and needs to be rendered first.');

			// Set the previous view results in a callback, it will be called when finished rendering of the login sequence page.
			var requiredViewCallback = new Callback();
			requiredViewCallback.methodReference    = this.handleNewView;
			requiredViewCallback.thisArgument       = this;
			requiredViewCallback.args               = [200, xhrResponse]; // Set fake status and response.

			// Request specific view.
			this.gotoView(requiredView, requiredViewCallback);

		}

		// TODO: detect loops.


		// Done here, call the callback.
		//this.wait.hide();
        callback.call();
	}
	//=============================================================================================






	// CUSTOM CONTENT RELATED METHODS
	// _________________________________________________________________________________________________________________

	// Get the view's custom Content.
	//=============================================================================================
	this.getViewCustomContent = function(view)
	{
		this.clearLastCustomContent();

		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("JSONViewData/GetViewCustomContent");
		sendAsynchronousRequest(sAbsoluteURL,
								"view="+view,
								this.renderCustomContent,
								this,
								[]);
	}
	//=============================================================================================


	// Render the custom content.
	//=============================================================================================
	this.renderCustomContent = function(xhrStatus, xhrResponse, callbackObj)
	{
		DEBUG.out('Render custom content.');
		callback = new Callback(callbackObj);

		if (xhrStatus != 200)
		{
			// TODO: Handle error.
			DEBUG.out('Retreiving custom content failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}

		// The container Id is: "CustomContent_<VIEW NAME>_<RESOURCE KEY>".
		// For example: the "ISW" view and the resource key of "top" will be rendered into "CustomContent_ISW_top".

		var newCustomContentJSONObj = JSON.parse(xhrResponse);
        var keyArr  = newCustomContentJSONObj.keyArr;
        var view    = newCustomContentJSONObj.view

		// Override view.
		switch (view)
		{
			case "ICS":                 // No brake, group these views.
			case "Authentication":
			case "ISW":
			case "MultiChallenge":
			case "IswEntry":
				var usedView = "LoginSequencePage";
			break;

			default:
				var usedView = view;
			break;
		}

        // Iterate on each of the custom content object.
        var customContent, containerId, key;
        //for (var key in keyMap)
        for (var i=0; i<keyArr.length; i++)
		{
			key = keyArr[i][0];
			customContent = keyArr[i][1];
			containerId = "CustomContent_"+usedView+"_"+key;
			DEBUG.out('Render custom content: usedView:['+usedView+"] into:["+containerId+"]");
            this.evaluateCustomContent(customContent, containerId);
            this.lastRenderedCustomContentContainers.push(containerId);
		}

		// Call the callback.
		callback.call();
	}

    // Encapsulate conditional rendering of the custom content.
	this.evaluateCustomContent = function(customContent, containerId)
	{
		destinationRef = document.getElementById(containerId);
		if ( (destinationRef != null) && (destinationRef != undefined) )
		{
			evaluateHTMLContent(customContent, destinationRef);
		}
	}
	//=============================================================================================


	// Clear last rendered containers.
	//=============================================================================================
	this.clearLastCustomContent = function()
	{
		for (var containerIndex in this.lastRenderedCustomContentContainers)
		{
			this.evaluateCustomContent("&nbsp;", this.lastRenderedCustomContentContainers[containerIndex]);
		}

		this.lastRenderedCustomContentContainers = new Array();
	}
    //=============================================================================================

	// Render default view.
    //=============================================================================================
    this.renderDefaultView = function()
    {}
	//==================================================================================================================

	//==================================================================================================================
	this.logoutButtonHandler = function()
    {}
    //==================================================================================================================





    // DEPRECATED METHODS
	// _________________________________________________________________________________________________________________

	// DEPRECATED, use viewManager.gotoNextView instead.
	//==================================================================================================================
	this.gotoNextState = function(callback)
	{
		this.gotoNextView(null, callback);
		return;
    }
	//==================================================================================================================
}

// Extend ViewManager (Portal IS).
UCViewManager.prototype = new ViewManager();
window.viewManager = new UCViewManager();

        </script>
        
		<title>Check Point UserCheck</title>
	</head>

	<body class="usercheck_body_background_class" unselectable="on">
		<noscript>
			This portal requires browser which support JavaScript.<br>Please make sure that you are using an updated browser and that JavaScript is enabled.		</noscript>
				<div id='portalErrorMessage' class="portalErrorMessageDivHide">

		<table cellpadding="0px" cellspacing="0px" class="portalErrorMessageTableContainer" width="100%">
			<tr>
				<td align="center">

					<table cellpadding="0px" cellspacing="0px" class="portalErrorMessageTable">

						<tr id="portalErrorMessage_title_container_row" class="portalMessage_title show" width="100%">
							<td id="portalErrorMessage_title_container" height="10px" valign="middle" align="left" colspan="2">&nbsp;</td>
						</tr>

						<tr>
							<td id="portalErrorMessage_container" align="left" style="padding: 10px;" colspan="2">&nbsp;</td>
						</tr>
						
						<tr>

							<td>
								<table cellpadding="0px" cellspacing="0px" width="100%"style=" padding: 10px;">
									<tr>
										<td id="portalMessage_error_report_container" align="left" valign="buttom" class="hide">
											<span id="portalMessage_error_report_link" onclick="DEBUG.showErrorReport();" class="portal_link" style="left: 10px;">
												Send error report											</span>
										</td>
										<td id="portalMessage_error_button_container" align="right" height="10px;" valign="buttom">
											<button id="portalErrorMessage_button" class="portalErrorMessage_button" onclick="hidePortalErrorMessage();">
												OK											</button>
										</td>
									</tr>
								</table>
							</td>

						</tr>

					</table>

				</td>
			</tr>
		</table>

	</div>
	

		<div id='portalMessage' class="portalMessageDivHide">

		<table cellpadding="0px" cellspacing="0px" class="portalMessageTableContainer" width="100%">
			<tr>
				<td align="center">

					<table cellpadding="0px" cellspacing="0px" class="portalMessageTable">

						<tr id="portalMessage_title_container_row" class="portalMessage_title show">
							<td id="portalMessage_title_container" class="portalMessage_title_td" valign="middle" align="left">
								&nbsp;
							</td>
						</tr>

						<tr>
							<td id="portalMessage_container" align="left" style="padding: 10px;">
								&nbsp;
							</td>
						</tr>

						<tr id="portalMessage_textarea_container_row" class="hide">
							<td id="portalMessage_textarea_container" align="left" style="padding: 10px;">
							</td>
						</tr>

						<tr id="portalMessage_validation_message_container_row" class="show">
							<td id="portalMessage_validation_message_container" align="left" class="portalMessage_validation_submessage" style="padding: 10px;">
								&nbsp;
							</td>
						</tr>

						<tr id="portalMessage_submessage_container_row" class="hide">
							<td id="portalMessage_submessage_container" align="left" class="portalMessage_submessage" style="padding: 10px;">
								&nbsp;
							</td>
						</tr>

						<tr>
							<td align="center" height="10px;" valign="buttom" style="padding: 10px;" colspan="2">
								<div id="portalMessage_ok_button_container" class="show" style="text-align: right;">
									<button id="portalMessage_button" class="portalMessage_button" onclick="hidePortalMessage();">
										OK									</button>
								</div>

								<div id="portalMessage_bool_button_container" class="hide">
									<button id="portalMessage_yes_button" class="portalMessage_button" onclick="hidePortalMessage();">
										BUTTON.YES									</button>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
									<button id="portalMessage_no_button" class="portalMessage_button" onclick="hidePortalMessage();">
										BUTTON.NO									</button>
								</div>

								<div id="portalMessage_submit_button_container" class="hide">
									<button id="portalMessage_submit_button" class="portalMessage_button" onclick="hidePortalMessage();">
										BUTTON.SUBMIT									</button>
									&nbsp;&nbsp;&nbsp;
									<button id="portalMessage_cancel_button" class="portalMessage_button" onclick="hidePortalMessage();">
										Cancel									</button>
								</div>
							</td>
						</tr>
					</table>

				</td>
			</tr>
		</table>

	</div>
	

		<div id='portalGeneralContainer' class="portalMessageDivHide">

		<table cellpadding="0px" cellspacing="0px" class="portalMessageTableContainer" width="100%">
			<tr>
				<td align="center">

					<table cellpadding="0px" cellspacing="0px" class="portalMessageTable">

						<tr id="portalGeneralContainer_title_container_row" class="portalMessage_title show" width="100%">
							<td id="portalGeneralContainer_title_container" height="10px" valign="middle" align="left">
								&nbsp;
							</td>
						</tr>

						<tr>
							<td id="portalGeneralContainer_container" align="left" style="padding: 10px;">
								&nbsp;
							</td>
						</tr>

					</table>

				</td>
			</tr>
		</table>

	</div>
	

	<div id='PortalErrorScreenShader' class="screenShaderHide">
		<table cellpadding="0px" cellspacing="0px" width="100%" height="100%">
			<tr>
				<td>&nbsp;</td>
			</tr>
		</table>
	</div>



	<div id='PortalScreenShader' class="screenShaderHide">
		<table cellpadding="0px" cellspacing="0px" width="100%" height="100%">
			<tr>
				<td>&nbsp;</td>
			</tr>
		</table>
	</div>


		<div id="portal_main_view" class="div_expanded" unselectable="on">
			<table height="100%" width="100%" border="0" cellpadding="0" cellspacing="0" class="">
				<tr>
					<td id="portal_center_div" valign="top" unselectable="on" class="usercheck_main_background_class">
						<div id="portal_top_pane_div" class="usercheck_header_class">
							
<!--position: fixed; bottom: -1px; left: 50%; margin-left: -435px; -->

<table width="100%" cellpadding="0" cellspacing="0" class="usercheck_header_table_class usercheck_content_table_class">
	<!--<tr>
		<td id="usercheck_header_right_logo" class="usercheck_header_right_class" unselectable="on">-->
			<img class="usercheck_company_logo_class" id="usercheck_company_logo" ></img>
		<!--</td>
	</tr>-->
</table>
						</div>
						<div class="usercheck_message_icon_class" id="usercheck_img_div" unselectable="on">&nbsp;</div>
						<div id="usercheck_title_div" class="usercheck_title_class" unselectable="on">&nbsp;</div>						
						<div style="text-align: center;" unselectable="on">
							<table id="usercheck_content_table" cellpadding="0" cellspacing="0" class="usercheck_content_table_class">
						<tr>
									<td>
										<div id="usercheck_main_div" class="usercheck_message_class" unselectable="on">&nbsp;</div>
									</td>
						</tr>
						<tr>
									<td>
										<div id="usercheck_error_div" unselectable="on">&nbsp;</div>
									</td>
						</tr>
						<tr>
									<td>
										<div style= "text-align:center;" id="usercheck_return_to_site_div" class="usercheck_message_class">&nbsp;</div>
									</td>
						</tr>
							</table>
						</div>
						<table class="usercheck_buttons_table_class" unselectable="on">
						<tr>
							<td>
								<center>
									<div id="usercheck_cancel_div" class="usercheck_ok_button_div_class" style="margin-left:40%;">&nbsp;</div>
								</center>
							</td>
							<td>
								<center>
									<div id="usercheck_ok_div" class="usercheck_ok_button_div_class" style="margin-right:40%;">&nbsp;</div>
								</center>
							</td>
						</tr>
						</table>
						<div id="usercheck_logo_img_div" class="usercheck_logo_img_div_class" unselectable="on">&nbsp;</div>	
					</td>
				</tr>
				<tr>
					<td id ="usercheck_footer_td" class="usercheck_footer_class usercheck_footer_height_class">
						<div id="portal_bottom_pane_div">
							
<!--position: fixed; bottom: -1px; left: 50%; margin-left: -435px; -->

<table id="footer_table_logo" cellpadding="0" cellspacing="0" class="usercheck_footer_table_class footer_no_logo">
	<tr>
		<td class="usercheck_footer_height_class">
			<div id="usercheck_language_selection_div" class="usercheck_lang_select_div_class" style="display: block;">
				Language: <select id="usercheck_language_selection" class="usercheck_lang_select_class" onchange="javascript:window.oUserAction.handleLanguageChange();">
				</select>
			</div>
		</td>
	</tr>
</table>						</div>
					</td>
				</tr>
			</table>
		</div>
	</body>


    <script type="text/javascript">

	//Continue the background image on IE6-7 graphics design.
	if(window.browserDetails.browserType == window.BrowserType.IE && window.browserDetails.browserVersion <= 7 && (document.documentMode === undefined || document.documentMode <= 7))
	{
		var footer_td = document.getElementById('usercheck_footer_td');
		footer_td.setAttribute("className", footer_td.getAttribute("className") + " usercheck_main_background_class");
	}
	
		UserCheck.DataObj.IID = "91425901-379F-7957-8152-D235D7825722";
	
	UserCheck.DataObj.frame = 0;
	

	/*this is a common object for PortalMain and PortalMainDlp. functions here should be empty */
window.UserActionCommon = function()
{
	this.DlpHttpLearning = function(adminMessage,HttpLearningEnabled)
	{

	}
	this.DlpHideCancelBtn = function(action)
	{
	
	}
}

window.oUserActionCommon = new window.UserActionCommon();


var g_userID = "";
var g_refreshFiles = false;
var g_BlockSendMail = false;

window.UserAction = function()
{
	this.incidentObject = {};
	this.textAreaText = "";
	
	this.getCorrectClass = function()
	{
		var correctClass = "class";
		
		//Choose the correct class attribute name (in IE6-7 we need "className" instead of "class") according to IE version - but check for compatibility first!
		if(window.browserDetails.browserType == window.BrowserType.IE && window.browserDetails.browserVersion <= 7 && document.documentMode === undefined)
		{
			correctClass = "className";
		}
		
		return correctClass;
	}

	// Initialize.
	//=============================================================================================
	this.init = function(cancelPage)
	{
		if(window.browserDetails.browserType == window.BrowserType.IE && window.browserDetails.browserVersion <= 7 && document.documentMode === undefined)
		{
			document.getElementById('usercheck_main_div').innerHTML = "<h3>" + PORTAL_IS.L10N.L10N_Obj.getStr("IE6_MESSAGE1") + "</h3><p>"+ PORTAL_IS.L10N.L10N_Obj.getStr("IE6_MESSAGE2") + "</p>";
			return;
		}
		if (typeof cancelPage == 'undefined')
		{
			cancelPage = false;
		}
		var requestData = 	{
			                	IID: "-1",
								UserID: "",
								IsThinPortal: false,
								UserLang: "",
								GetCancelPage: cancelPage
							};
		
		requestData.IID = UserCheck.DataObj.IID;
		
		var cookie = getCookie('UserCheck_UserID');
		requestData.UserID = cookie != null ? cookie : "";
		
		requestData.IsThinPortal = window.isThinPortal === true ? true : false;
		
		var selectedLanguage = getCookie('UserCheck_Selected_Language');
		if(selectedLanguage == null)
		{
			selectedLanguage = "";
		}
		requestData.UserLang = selectedLanguage;
		
		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetUserCheckIncidentData");
		
		if (window.isThinPortal === true)
		{
			//Create a custom timeout handler for the thin portal.
			PORTAL_IS.AJAX_MGR.customTimeoutHandler = function()
			{
				window.location = "about:blank";
			}
		}
		
		sendAsynchronousRequest(sAbsoluteURL,
								flattenObject(requestData),
								this.handleUserCheckIncidentData,
								this,
								[new Callback()]);
	}
	
	//Toggles the button's state from enabled to disabled and vice versa.
	this.setButtonMode = function(buttonState, buttonID)
	{
		var button = document.getElementById(buttonID);
		if(button == null)
			return;
		
		var correctClass = window.oUserAction.getCorrectClass();
		
		if(buttonState)
		{
			//Enable the button.
			button.setAttribute(correctClass, "button");
			button.onclick = function(){ javascript:oUserAction.submitOK(); }; 
			
			button.style.cursor = "pointer";
		}
		else
		{
			//Disable the button.
			button.setAttribute(correctClass, "button buttonDisabled");
			button.onclick = null;
			
			button.style.cursor = "default";
		}
	}
	
	//Changes the button CSS class (support for IE6-8). buttonCLS is for additional classes to be added to the button.
	this.setButtonState = function(state, buttonID, buttonCLS)
	{
		if (!buttonID)
		{
			buttonID = 'UserCheck_OK_Button';
			buttonCLS = '';
		}
		
		var correctClass = window.oUserAction.getCorrectClass();
	
		var button = document.getElementById(buttonID);
		
		if(button.getAttribute(correctClass).indexOf("Disabled") == -1)
		{
			//The button is not disabled.			
			button.setAttribute(correctClass, "button button" + state + " " + buttonCLS);
		}
	}

    //Changes the button CSS class (support for IE6-8). buttonCLS is for additional classes to be added to the button.
	this.setSendButtonState = function(state, buttonID, buttonCLS)
	{
		if (!buttonID)
		{
			buttonID = 'UserCheck_OK_Button';
			buttonCLS = '';
		}
        
		var correctClass = window.oUserAction.getCorrectClass();
	
		var button = document.getElementById(buttonID);
        
		if(button.getAttribute(correctClass).indexOf("Disabled") == -1)
		{
			//The button is not disabled.			
			button.setAttribute(correctClass, buttonCLS);
		}
	}
	
	this.handleUserCheckIncidentData = function(xhrStatus, xhrResponse, callback)
	{
		DEBUG.out("UserAction::handleUserCheckIncidentData");

		if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		
		if (xhrStatus != 200)
		{
			DEBUG.out('Retreiving UserCheck Incident Data failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}
		
		this.incidentObject = JSON.parse(xhrResponse);
		var Languages = this.incidentObject.Languages;
		var UserCheckLogoID = this.incidentObject.UserCheckLogoID;
		var RedirectToAddr = this.incidentObject.RedirectToAddr;
		var AutoRedirect = this.incidentObject.AutoRedirect;
		var ExternalSystemURL = this.incidentObject.ExternalSystemURL;
		var Action = this.incidentObject.Action;
		var Variables = this.incidentObject.Variables;
		
		this.incidentObject.HasBeenCancelled = false;
		
		setCookie('UserCheck_UserID', this.incidentObject.UserID, 31556926);

		if (Variables['product'] != 'Threat Extraction')
		{
		  if(AutoRedirect == true && RedirectToAddr != "")
		  {
			  if (window.isThinPortal === undefined)
			  {
			  //We have an address and auto redirect is true so redirect to that URL.
				  // if (RedirectToAddr.indexOf('http://') != 0)
				  if ((RedirectToAddr.indexOf('http://') != 0)  &&(RedirectToAddr.indexOf('https://') != 0))
					  RedirectToAddr = "http://" + RedirectToAddr;
  
			  window.location = RedirectToAddr;
			  }
			  else
				  window.location = "about:blank"; //No reason to redirect in the Thin Portal
		  }
		}
		else
		{
			if (Action == "SCRUB-SUCCESS")
			{
				// in scrub success page, if not mobile or thin, give more space for the list of original files names and info
				if(window.browserDetails.isMobile() === false && window.isThinPortal === undefined)
				{
					var content_table = document.getElementById("usercheck_content_table");
					if (content_table != null)
					{
						content_table.style.tableLayout="auto";
					}
					
					var message_div = document.getElementById("usercheck_main_div");
					if (message_div != null)
					{
						message_div.style.minWidth="auto";
						message_div.style.maxWidth="1000px";
						message_div.style.wordWrap="normal";
						message_div.style.overflow="auto";
					}
				}
				
				var requestData = 	{
							IID: "-1"
						};
				requestData.IID = UserCheck.DataObj.IID;
				var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetScrubFiles");
				sendAsynchronousRequest(sAbsoluteURL,
						flattenObject(requestData),
						this.handleScrubbingFiles,
						this,
						[new Callback()]);
			}
		}
			
		if(ExternalSystemURL != "")
			//We have an external system address so redirect to that URL.
			// window.location = ExternalSystemURL + (this.incidentObject.ForwardParams == true ? "?IncidentID=" + UserCheck.DataObj.IID + "&UserID=" + this.incidentObject.UserID : "");
			if (this.incidentObject.ForwardParams == true)
			{
							window.location = ExternalSystemURL + "?IncidentID=" + UserCheck.DataObj.IID + "&UserID=" + this.incidentObject.UserID;
			}
			else
			{
							window.location = ExternalSystemURL;
			}


			
		this.prepareLanguageSelection();
			
		if(window.self !== window.top)
		{
			//We are inside a frame. Display small version of the portal and give link to a full version of the portal in new tab/window.
			
			var url = '<a href="' + window.location + "&frame=1" + '" target="_blank">';
			if (Action == "SCRUB-SUCCESS")
			{
				Action = "INFORM";
			}
			url += draw_img_tag(getURL("img/" + Action.toLowerCase() + ".png")) + '&nbsp;&nbsp;';
			url += Action == 'BLOCK' ? PORTAL_IS.L10N.L10N_Obj.getStr("UC.BLOCKED_IFRAME") : PORTAL_IS.L10N.L10N_Obj.getStr("UC.INFO_IFRAME");
			url += '</a>';
		
			document.body.innerHTML = url;
			document.body.style.backgroundImage = 'none';
			document.body.style.textAlign = 'center';
			document.body.style.verticalAlign = 'text-bottom';	
		}
		
		//Decide which footer to display according to the action type (for Block and Limit we display footer without CP logo).
		if(window.isThinPortal === true)
		{
			var thin_table = document.getElementById('usercheck_thin_table');
			if(thin_table != null && Action != 'BLOCK' && Action != 'LIMIT')
			{
				var correctClass = window.oUserAction.getCorrectClass();
				
				thin_table.setAttribute(correctClass, "usercheck_main_mobile_background_class with_logo");
			}
		}
		else
		{
		var logo_footer = document.getElementById('footer_table_logo');
		if(logo_footer != null && Action != 'BLOCK' && Action != 'LIMIT')
		{
			var correctClass = window.oUserAction.getCorrectClass();
			
			logo_footer.setAttribute(correctClass, "usercheck_footer_table_class footer_logo");
		}
		}
		
		if(Action == 'BLOCK'){
			document.getElementById("usercheck_title_div").style.color = "#ed5552";
			document.getElementById("usercheck_logo_img_div").style.display = "none";
		}else{
			document.getElementById("usercheck_title_div").style.color = "#0d87cd";
		}
		g_userID = this.incidentObject.UserID;
		
		if (Action == "SCRUB-SUCCESS")
		{
			Action = "INFORM";
		}
		//Draw incident image according to the incident type
		if(document.getElementById('usercheck_img_div') !== null){
			document.getElementById('usercheck_img_div').innerHTML = draw_img_tag(getURL("img/" + Action.toLowerCase() + ".png"));	
		
		}
		
		if(this.incidentObject.IsLogoConfigured)
		{
			//The page has a logo defined in the GUI - load it.
			
			//Desktop header.
			var header_right_logo = document.getElementById('usercheck_header_right_logo');
			if(header_right_logo != null)
				if(window.browserDetails.browserType == window.BrowserType.IE && window.browserDetails.browserVersion <= 7)
					header_right_logo.style.display = "block";
				else
					header_right_logo.style.display = "table-cell";
					
			var header_right_empty = document.getElementById('usercheck_header_right_empty');
			if(header_right_empty != null)
				header_right_empty.style.display = "none";
				
			//Mobile header.
			var mobile_header = document.getElementById('header_mobile_div');
			if(mobile_header != null)
			{
				mobile_header.style.display = "block";
			}
			
			//Company logo.
			var company_logo = document.getElementById('usercheck_company_logo');
			if(company_logo != null)
				company_logo.src = getURL("images/interactions/" + UserCheckLogoID + ".png");
		}
		else
		{
			 //If there is no logo defined, hide it as it will cause an error on IE
			//additionally, according to preview design the agent should not have logo in this case too
			var company_logo = document.getElementById('usercheck_company_logo');
			if(company_logo != null)
				company_logo.style.display = "none";
		}
			
		//Start the timeout manager. Do not start this for TeX as its timeout is huge and will fail verification in the daemon
		if (Variables['product'] != 'Threat Extraction')
			UserCheck.tools.oTimeoutManager.startTimeoutTimer(this.incidentObject.Expiration - 15, this.handleTimeout);
			
		if (UserCheck.DataObj.GetSingleIncidentReview !== undefined && UserCheck.DataObj.GetSingleIncidentReview == 1)
		{
			window.singleIncident = new SingleIncident();
			singleIncident.init();
		}			
			
		callback.call();
	}
	
	this.submitOK = function()
	{
		//This function determines if it is OK to proceed with sending a response if all validation criteria are met.
	
		//If we are in a Block action in thin portal, just redirect to about:blank.
		if (window.isThinPortal === true && window.oUserAction.incidentObject.Action === "BLOCK")
		{
			window.location = "about:blank";
		}
	
		if(document.getElementById('UserCheck_Textual_Input') != null)
			//Verify we have the real textarea!
			if(document.getElementById('UserCheck_Textual_Input').value !== undefined)
				//Unfocus the text-area.
				document.getElementById('UserCheck_Textual_Input').blur();
	
		if(!window.oUserAction.highlightInput())
			//There was some user input missing - don't continue.
			return;
	
		var cookie = getCookie('UserCheck_UserID');
	
		var requestData = {};
		
		requestData.IID = "-1";
		requestData.UserOption = "OK";
		
		requestData.UserID = cookie;
		requestData.IsReasonExist = true;
		if(document.getElementById('UserCheck_Textual_Input') != null)
		{
			var reason = document.getElementById('UserCheck_Textual_Input').value;

			//If the reason box is not found, there is nothing to enforce.
			if(reason === undefined)
			{
				reason = "";
				requestData.IsReasonExist = false;
			}
			else if(window.oUserAction.incidentObject.IsReasonEnforced === true && (reason.length == 0 || reason.length > 400))
				return;
				
			requestData.Reason = reason;
		}
		else
		{
			requestData.IsReasonExist = false;
		}
		
		//Sometimes the cookie is not written correctly, so used global user.
		if(requestData.UserID == null || requestData.UserID == "")
			requestData.UserID = g_userID;
		
		requestData.IID = UserCheck.DataObj.IID;

		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetUserCheckUserChoiceData");
	
		sendAsynchronousRequest(sAbsoluteURL,
								flattenObject(requestData),
								this.handleUserCheckChoiceData,
								this,
								[new Callback()]);
	}
	
	this.submitCancel = function()
	{
		if(window.oUserAction.incidentObject.CancelURL !== undefined && window.oUserAction.incidentObject.CancelURL !== "")
		{		
			window.location = window.oUserAction.incidentObject.CancelURL;
			return;
		}
		else
		{
			if (window.isThinPortal == true)
			{
				window.location = "about:blank";
				return;
			}
			this.init(true);
		}	
	}
	
	this.handleUserCheckChoiceData = function(xhrStatus, xhrResponse, callback)
	{
		try
		{
			window.external.OKButtonClickedResponseReceived('Done handling request');			
		}
		catch(err)
		{
			//do nothing, this is probably the fat client
		}

		DEBUG.out("UserAction::handleUserCheckChoiceData");

		if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		
		if (xhrStatus != 200)
		{
			DEBUG.out('Retreiving UserCheck Incident Data failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}
	
		var newViewJSONObj = JSON.parse(xhrResponse);
		
		var RedirectToAddr = newViewJSONObj.RedirectToAddr;
		if (window.oUserAction.incidentObject.Variables['product'] != 'Threat Extraction')
		{
		    if(RedirectToAddr != "")
		    {
			    var frame = "0";
			    
			    frame = UserCheck.DataObj.frame;
			    //handle case of Ok on an email message approval of a context awareness violation. In this case we dont want to redirect, but show a message that tells to resend
                            if (window.oUserAction.incidentObject.Variables['violation_protocol'] === 'Email message' && window.oUserAction.incidentObject.Variables['product'] === 'apcl'){
				var usercheck_main_div = document.getElementById('usercheck_main_div');
				if (usercheck_main_div != null)
					usercheck_main_div.innerHTML = "<p>" +PORTAL_IS.L10N.L10N_Obj.getStr("CTNT_EMAIL_CONFIRM")+"</p>";
				var okbtnDiv = document.getElementById('usercheck_ok_div');
				var cancelbtnDiv = document.getElementById('usercheck_cancel_div');
				if (okbtnDiv != null && cancelbtnDiv != null){
					okbtnDiv.style.display = "none";
					cancelbtnDiv.style.display = "none";
				}
				return;
			    }
		    
			    if(typeof frame === "undefined" || frame == "0" || frame == "")
			    {
				    if (window.isThinPortal === undefined)
				    {
					    //We have an address so redirect to that URL.
					    if ((RedirectToAddr.indexOf('http://') != 0)  &&(RedirectToAddr.indexOf('https://') != 0))
						    RedirectToAddr = "http://" + RedirectToAddr;
					    window.location = RedirectToAddr;
				    }
				    else
					    window.location = "about:blank";
			    }
			    else
			    {
				    if (window.isThinPortal === undefined)
				    {
				    //We have an address so redirect to that URL in the parent frame.
					    if ((RedirectToAddr.indexOf('http://') != 0)  &&(RedirectToAddr.indexOf('https://') != 0))
						    RedirectToAddr = "http://" + RedirectToAddr;
    
				    window.opener.location = RedirectToAddr;
				    }
				    else
				    {
					    window.opener.location = "about:blank";
				    }
				    window.close();
			    }
		    }
		    else
		    {
			    var frame = "0";
			    frame = UserCheck.DataObj.frame;
			    if(typeof frame === "undefined" || frame == "0" || frame == "")
			    {
				    if (window.isThinPortal == true)
				    {
					    window.location = "about:blank";
				    }
			    }
			    else
			    {
				    if (window.isThinPortal == true)
				    {
					    window.opener.location = "about:blank";
				    }
				    window.close();
			    }
		    }
	  	}
		else
		{
			window.location.reload();
		}
	}
	this.handleUserReportWrongCategoryData = function(xhrStatus, xhrResponse, callback)
	{
		
		DEBUG.out("UserAction::handleUserLogData");

		
		
		
	}
	
	this.handleTimeout = function()
	{
		var requestData = 	{
			                	IID: "-1"
							};
		
		requestData.IID = UserCheck.DataObj.IID;
		
		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("ExtendTimeout");
		
		sendAsynchronousRequest(sAbsoluteURL,
								flattenObject(requestData),
								window.oUserAction.handleTimeoutExtension,
								this,
								[new Callback()]);
	}
	
	this.handleTimeoutExtension = function(xhrStatus, xhrResponse, callback)
	{
		DEBUG.out("UserAction::handleTimeoutExtension");

		if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		
		if (xhrStatus != 200)
		{
			if (window.isThinPortal === undefined)
			{
				DEBUG.out('Retreiving UserCheck Timeout Extension data failed. ('+xhrStatus+')', DEBUG.ERROR);
				callback.call();
				return;
			}
			else
			{
				window.location = "about:blank";
				return;
			}
		}
		var extensionObject = JSON.parse(xhrResponse);
		
		if(extensionObject.ReturnCode == "SUCCESS")
		{
			UserCheck.tools.oTimeoutManager.startTimeoutTimer(extensionObject.Expiration - 15, window.oUserAction.handleTimeout);
		}
		else
		{
			if(window.isThinPortal === undefined)
			{
			var button = document.getElementById('UserCheck_OK_Button');
			if(button !=null)
				button.style.display = "none";
			var select = document.getElementById('usercheck_language_selection');
			if(select != null)
				select.disabled = true;
			
			showPortalMessage(PORTAL_IS.L10N.L10N_Obj.getStr("TIMEOUT") + " <a href='" + window.oUserAction.incidentObject.RedirectToAddr + "'>" + PORTAL_IS.L10N.L10N_Obj.getStr("RETRY") + "</a>", null, PORTAL_IS.MESSAGE_TYPE.Display, true);
		}
			else
			{
				/* If we are in thin portal, redirect to about:blank
				   so that client can catch it and act accordingly. */
				window.location = "about:blank";
			}
		}
	}
	
	//Prepare for language selection.
	this.prepareLanguageSelection = function()
	{
		var Languages = this.incidentObject.Languages;
		var prevSelectedLanguage = null;
		var userSelected = false;
		if (UserCheck.DataObj.Lang != "" && UserCheck.DataObj.Lang !== undefined)
		{
			prevSelectedLanguage = UserCheck.DataObj.Lang;
			userSelected = true;
		}
		else if (this.incidentObject.PreferredLang != "")
		{
			prevSelectedLanguage = this.incidentObject.PreferredLang;
		}
		else
		{
			prevSelectedLanguage = getCookie('UserCheck_Selected_Language');
		}
		var count = 0;
		
		//If there is no cookie, get the browser locale.
		if(prevSelectedLanguage == null)
		{
			var langArr = {};
			for(var Language in Languages)
			{
				langArr[Languages[Language].LanguageCode] = true;
			}
			
			prevSelectedLanguage = PORTAL_IS.L10N.L10N_Obj.selectLanguage(langArr);
		}
		
		if(document.getElementById('usercheck_language_selection_div') != null)
		{
			count = 0;
			var select = document.getElementById('usercheck_language_selection');
			select.options.length = 0;
			for(var Language in Languages)
			{
				select = document.getElementById('usercheck_language_selection');
				select.options[select.options.length] = new Option(Languages[Language].Language, Language, false, Language === prevSelectedLanguage);
				count++;
			}
			//Display language selection only if NOT in thin portal.
			if(count > 1 && window.isThinPortal === undefined)
				document.getElementById('usercheck_language_selection_div').style.display = "block";
			else
			{
				document.getElementById('usercheck_language_selection_div').style.display = "none";
			}
				
		}
		this.handleLanguageChange(true, userSelected);
	}
	
	//Handles language change.
	this.handleLanguageChange = function(noReloadLang, userSelected)
	{
		var select = document.getElementById('usercheck_language_selection');
		var selectedLanguage = select.options[select.selectedIndex].value;
		if(noReloadLang === true)
		{
			//No need to load the language - if it is already loaded.
			this.asyncLanguageChangeCallback(userSelected);
		}
		else
		{
			//Reload language strings.
			PORTAL_IS.L10N.L10N_Obj.reloadLanguageTo(selectedLanguage, "en", this.asyncLanguageChangeCallback);
		}

	}
		
	this.checkBoxExists = function(adminMessage)
	{
		if(adminMessage.indexOf("UserCheck_Confirm_Checkbox") != -1)
			return true;
			
		return false;
	}
	
	this.textareaExists = function(adminMessage)
	{
		if(adminMessage.indexOf("UserCheck_Textual_Input") != -1)
			return true;
			
		return false;
	}
	
	this.asyncLanguageChangeCallback = function(userSelected)
	{
		if (userSelected === undefined)
		{
			userSelected = true;
		}
		var select = document.getElementById('usercheck_language_selection');
		var check = document.getElementById('UserCheck_Confirm_Checkbox');
		
		var selectedLanguage = "Default";
		if(select != null)
			selectedLanguage = select.options[select.selectedIndex].value;
		var checkBoxValue = check != null ? check.checked : false;
		
		//Save cookie for the selected language. Only if it is from a User Selection.
		if (userSelected)
		{
			setCookie('UserCheck_Selected_Language', selectedLanguage == "Default" ? "en" : selectedLanguage, 31556926, "/");
			var cookieVal = getCookie('UserCheck_UserID');
            
			var handleUpdateUserDataResponse = function(xhrStatus, xhrResponse, callback){
				var newURL = window.location.href;
				var langLoc = newURL.indexOf("&Lang=");
				if (langLoc != -1)
				{
					newURL = newURL.substring(0, langLoc);
				}
				window.location = newURL;
			}

			sendAsynchronousRequest(getURL("UpdateUserData"),
					"Language="+encodeURIComponent(selectedLanguage) + "&IID="+encodeURIComponent(UserCheck.DataObj.IID)+"&UserID="+cookieVal,
					handleUpdateUserDataResponse,
					this,
					[new Callback()]);			
		}
		else
		{

        		//Keep this value globally for other funcs.
        		window.oUserAction.incidentObject.SelectedLanguage = selectedLanguage;
        	
        		var Languages = window.oUserAction.incidentObject.Languages;
        		var TitleText = Languages[selectedLanguage].TitleText;
        		var AdminMessage  = Languages[selectedLanguage].AdminMessage;
        		var CancelMessage = Languages[selectedLanguage].CancelMessage;
        		var OKButtonMessage  = window.oUserAction.incidentObject.OKButtonMessage[selectedLanguage];
        		var CancelButtonMessage  = window.oUserAction.incidentObject.CancelButtonMessage[selectedLanguage];
        		var SendButtonMessage	= window.oUserAction.incidentObject.SendButtonMessage[selectedLanguage];
        		var MiddleButtonMessage	= window.oUserAction.incidentObject.MiddleButtonMessage[selectedLanguage];
        		var HTTPLearningEnabled = window.oUserAction.incidentObject.HTTPLearningEnabled;
        		var PageTitle = Languages[selectedLanguage].PageTitle;
        		
        		document.getElementById('usercheck_title_div').innerHTML = TitleText;
        		
        		if(window.oUserAction.incidentObject.HasBeenCancelled === undefined || window.oUserAction.incidentObject.HasBeenCancelled === false)
        		{
        			if (window.oUserAction.incidentObject.IncidentStatus == 0 || window.oUserAction.incidentObject.IncidentStatus == 2 || window.oUserAction.incidentObject.IncidentStatus == 8)//ok or cancel or ok_scrubbing
        			{
        				document.getElementById('usercheck_main_div').innerHTML = AdminMessage;
        			}
        			else if (window.oUserAction.incidentObject.IncidentStatus == 3)// sent
        			{
        				// if http learning is enabled on action succeded show the HTTP_LEARNING message
        				if (HTTPLearningEnabled == true && window.oUserAction.incidentObject.RedirectToAddr != "") 
        				{
        					var usercheck_main_div = document.getElementById('usercheck_main_div')
        					if (usercheck_main_div != null)
        						usercheck_main_div.innerHTML = "<p>" +PORTAL_IS.L10N.L10N_Obj.getStr("HTTP_LEARNING")+"</p>";
        				}
        				else // an SMTP message 
        				{
        					document.getElementById('usercheck_main_div').innerHTML = AdminMessage;
        				}
        			}
        			else if (window.oUserAction.incidentObject.IncidentStatus == 4)//discarded
        			{
        				document.getElementById('usercheck_main_div').innerHTML = AdminMessage;
        			}
        			else if (window.oUserAction.incidentObject.IncidentStatus == 5)//already sent
        			{
        				if (HTTPLearningEnabled == true && window.oUserAction.incidentObject.RedirectToAddr != "")
        				{
        					//if approved http and then refreshed the page
        					var usercheck_main_div = document.getElementById('usercheck_main_div')
        					if (usercheck_main_div != null)
        						usercheck_main_div.innerHTML = "<p>" +PORTAL_IS.L10N.L10N_Obj.getStr("HTTP_LEARNING")+"</p>";
        				}
        				else
        				{
        					document.getElementById('usercheck_main_div').innerHTML = AdminMessage;
        					var return_to_site_div = document.getElementById('usercheck_return_to_site_div')					
        					if (return_to_site_div != null)
        						return_to_site_div.innerHTML = "<p style='color: #FF5000;font-weight: bold;'>" +PORTAL_IS.L10N.L10N_Obj.getStr("EMAIL_ALREADY_SENT") +"</p>";
        				}
        			}
        			else if (window.oUserAction.incidentObject.IncidentStatus == 6)//already discarded
        			{
        				document.getElementById('usercheck_main_div').innerHTML = AdminMessage;
        				var return_to_site_div = document.getElementById('usercheck_return_to_site_div')					
        				if (return_to_site_div != null)
        					return_to_site_div.innerHTML = "<p style='color: #FF5000;font-weight: bold;'>" +PORTAL_IS.L10N.L10N_Obj.getStr("EMAIL_ALREADY_DISCARDED") +"</p>";			
        			}
        			else
        			{
        				document.getElementById('usercheck_main_div').innerHTML = "<p>" + PORTAL_IS.L10N.L10N_Obj.getStr("UNKOWN_INCIDENT_STATUS") + "</p>" + window.oUserAction.incidentObject.IncidentStatus;
        			}
        			
        			
        			var btnDiv = document.getElementById('usercheck_ok_div');
        			if (btnDiv != null)
        				btnDiv.innerHTML = OKButtonMessage;
        			btnDiv = document.getElementById('usercheck_cancel_div');
        			if (btnDiv != null){
        				btnDiv.innerHTML = CancelButtonMessage;
					if(window.oUserAction.incidentObject.Action == "BLOCK"){
						document.getElementById('usercheck_cancel_div').style.display = "none";
						if( document.getElementById('usercheck_ok_div') != null){
							//alert("entered first");
							document.getElementById('usercheck_ok_div').style.marginRight = "auto";
							document.getElementById('usercheck_ok_div').style.marginLeft = "auto";
						}
						var dlp_block_div = document.getElementById('usercheck_cancel_div');
						if(dlp_block_div != null)
						{
							document.getElementById('usercheck_cancel_div').style.marginTop = "0px";
						}
						dlp_block_div = document.getElementById('usercheck_scrollable_div'); //if this is the client
						if(dlp_block_div != null){
							document.getElementById('usercheck_scrollable_div').style.height = "250px";							
						}
					}
						if(window.oUserAction.incidentObject.Action == "ASK"){
							var is_client = document.getElementById('usercheck_scrollable_div'); //if this is the client
							if(is_client != null){
								var checkBox_td = document.getElementById('UserCheck_checkbox_td');
								if(checkBox_td != null){											//for ask client with checkbox, move padding-top to 0px
									document.getElementById('UserCheck_checkbox_td').style.paddingTop = "0px";
								}
							}
						}
					}
        			btnDiv = document.getElementById('usercheck_send_div');
        			// show the send button on SMTP (which is actually the send button) OR show it on inform action (which is actually OK button)
        			if (btnDiv != null && (window.oUserAction.incidentObject.RedirectToAddr == "" || window.oUserAction.incidentObject.Action == "INFORM") )
        			{
        				btnDiv.innerHTML = SendButtonMessage;
						var is_client = document.getElementById('usercheck_scrollable_div'); //if this is the client
						if(is_client != null)
						{							
							document.getElementById('usercheck_send_div').style.marginLeft = "15%";
							
						}else
						{
							document.getElementById('usercheck_send_div').style.marginLeft = "auto";
						}
						if(document.getElementById('usercheck_middle_div') != null)
							{
								document.getElementById('usercheck_middle_div').style.marginRight = "auto";
								document.getElementById('usercheck_middle_div').style.marginLeft = "auto";
							}
        			}else if(btnDiv != null && window.oUserAction.incidentObject.Action == "ASK"){
						document.getElementById('usercheck_send_div').style.display = "none";						
        			}
        			btnDiv = document.getElementById('usercheck_middle_div');
        			if (btnDiv != null)
        			{
        					btnDiv.innerHTML = MiddleButtonMessage;
        			}
        			var goBackDiv = document.getElementById('usercheck_return_to_site_div');
        			if (goBackDiv)
        			{
        				// show return to site only when its http violation AND if the action is: sent or discarded or already sent or already discarded or cancelled.
        				if (window.oUserAction.incidentObject.RedirectToAddr != "" && (window.oUserAction.incidentObject.IncidentStatus == 3 || window.oUserAction.incidentObject.IncidentStatus == 4 || window.oUserAction.incidentObject.IncidentStatus == 5 || window.oUserAction.incidentObject.IncidentStatus == 6 || window.oUserAction.incidentObject.IncidentStatus == 2))
        				{
        					goBackDiv.innerHTML = '<a href="' + window.oUserAction.incidentObject.RedirectToAddr + '">' + PORTAL_IS.L10N.L10N_Obj.getStr("RETURN_TO_SITE") + '</a>'; 
        				}
        			}
        		}
        		else
        			document.getElementById('usercheck_main_div').innerHTML = CancelMessage;
        	
        		var page_title = document.getElementById('usercheck_page_title');
        		if(page_title != null)
        			page_title.innerHTML = PageTitle;
        		
        		var span = document.getElementById('UserCheck_OK_Button_span');
        		if(span != null)
        			span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr('BUTTON.OK');
        		if(span != null && window.oUserAction.incidentObject.Variables['product'] == 'Threat Extraction')
				{
					span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr('BUTTON.CONFIRM');
				}				
        		span = document.getElementById('UserCheck_Cancel_Button_span');
        		if(span != null)
        			span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr('BUTTON.CANCEL');
        			
        		span = document.getElementById('UserCheck_Send_Button_span');
        		if(span != null)
        			span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr('BUTTON.SEND');
        		span = document.getElementById('UserCheck_Middle_Button_span');
        		if(span != null)
        		{
        			if (window.oUserAction.incidentObject.RedirectToAddr == ""){
        			span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr('BUTTON.DISCARD');
					}
        			else{
        				span.innerHTML = PORTAL_IS.L10N.L10N_Obj.getStr("BUTTON.APPROVE");
						span.style.paddingRight = "27px";
						span.style.paddingLeft = "29px";
        		}		
        			
        		}		
        		var reportLink = document.getElementById('UserCheck_Wrong_Category');
        		if(reportLink != null)
        		{
        			var correctClass = window.oUserAction.getCorrectClass();
        			
        			reportLink.setAttribute(correctClass, "usercheck_url_class");
        		
        			reportLink.onclick = function(e) { window.oUserAction.sendReport(); }
        		}
        		
        		//Clear the error message when switching language.
        		var errorElement = document.getElementById('usercheck_error_div');
        		if(errorElement != null)
        			errorElement.innerHTML = "&nbsp;";
        		
        		//Keep TextArea default text to disallow it as input.
        		var textarea_element = null;
        		
        		if(window.oUserAction.textareaExists(AdminMessage))
        		{
        			textarea_element = document.getElementById('UserCheck_Textual_Input');
        			//If the textarea is an incorrect element or length is correct, check passes.
        			if(textarea_element.value === undefined)
        			{
        				//This element is not really our text area so we don't need it.
        				textarea_element = null;
        			}
        		}
        		
        		if(textarea_element != null)
        		{
        			window.oUserAction.textAreaText = textarea_element.value;
        			
        			var correctClass = window.oUserAction.getCorrectClass();
        			textarea_element.setAttribute(correctClass, "usercheck_message_class usercheck_textual_input_class usercheck_textual_input_class_required");
        			
        			textarea_element.onfocus = function() { window.oUserAction.clearRequiredInput(); };
        		}
        		//disable the approve button only on PortalMaindlp. on thin client approve button should always be enabled
        		if (window.oUserAction.incidentObject.RedirectToAddr != "" && window.isThinPortal != true)
        		{
        			window.oUserActionCommon.DlpHttpLearning(AdminMessage,HTTPLearningEnabled);
        		}
		    // hiding the cancel and middle button on inform and block on dlp only
		    window.oUserActionCommon.DlpHideCancelBtn(window.oUserAction.incidentObject.Action);
		}
	}
	
	//Sends report for wrong category.
	this.sendReport = function()
	{
		var Variables = window.oUserAction.incidentObject.Variables;
		
		var resource = Variables['resource'] === undefined ? "" : Variables['resource'];
		var hmac = Variables['resource_hmac'] === undefined ? "" : Variables['resource_hmac'];
		var version = Variables['version'];
		var product = Variables['product'];
		
		//Get the application name. If this variable has been modified (added application icon for example), take the original.
		var appname = Variables['application_name_orig'];
		var malwareID = Variables['application_id'];
		if(appname === undefined)
			appname = Variables['application_name'];
			
		var base64UrlEncode = function(input) { return $.base64Encode(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '') };	
			
		//Encode to base64 URL form spec.
		appname = base64UrlEncode(appname);
		resource = base64UrlEncode(resource);
		
		//URL of the external URL
		var url = window.location.protocol + "//cws.checkpoint.com/MISCAT/miscat/1.0?resource=" + resource + "&hmac=" + hmac + "&appname=" + appname + "&version=" + version + "&product=" + product + "&malwareID=" + malwareID;
	
		//Display a portal messge indicating the action was successful. On mobile devices we use the built-in message display.
		if(window.browserDetails.isMobile())
			alert(PORTAL_IS.L10N.L10N_Obj.getStr("REPORT_SUCCESS"));
		else
			showPortalMessage('<table><tr><td>' + draw_img_tag_span(getURL("images/confirmation.png")) + '&nbsp;&nbsp;</td><td>' + PORTAL_IS.L10N.L10N_Obj.getStr("REPORT_SUCCESS") + '</td></tr></table>', null, PORTAL_IS.MESSAGE_TYPE.Confirmation, true, false);
		
		var img = new Image();
		img.src = url;
		
		var reportLink = document.getElementById('UserCheck_Wrong_Category');
		
		var correctClass = window.oUserAction.getCorrectClass();

		//Disable the link.
		reportLink.setAttribute(correctClass, "usercheck_url_class usercheck_disabled_url_class");
		
		//send log on wrong category	
		var cookie = getCookie('UserCheck_UserID');
	
		var requestData = {};
		
		requestData.IID = "-1";
		requestData.UserOption = "LOG-WRONG-CATEGORY";
		requestData.UserID = cookie;
		requestData.IsReasonExist = false;
		
		
		//Sometimes the cookie is not written correctly, so used global user.
		if(requestData.UserID == null || requestData.UserID == "")
			requestData.UserID = g_userID;
		
		requestData.IID = UserCheck.DataObj.IID;

		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetUserCheckUserChoiceData");
	
		sendAsynchronousRequest(sAbsoluteURL,
								flattenObject(requestData),
								this.handleUserReportWrongCategoryData,
								this,
								[new Callback()]);
								
		//Nothing should happen on click from now on.
		reportLink.onclick = function() { };
	}
	
	this.handleReportTimeout = function()
	{
		var elem = document.getElementById('testID');
		document.getElementsByTagName('head')[0].removeChild(elem);
	}

	//Verifies the input of the user, including checkbox and textarea.
	this.highlightInput = function()
	{
		var checkbox_element = null;
		var textarea_element = null;
		var checkbox_ready = false;
		var textarea_ready = false;
		
		var AdminMessage = window.oUserAction.incidentObject.Languages[window.oUserAction.incidentObject.SelectedLanguage].AdminMessage;
	
		//If the checkbox exists (and it is a correct element), its value will determine the button status.
		if(window.oUserAction.incidentObject.IsCheckBoxEnforced == true && window.oUserAction.checkBoxExists(AdminMessage) == true && document.getElementById('UserCheck_Confirm_Checkbox').checked !== undefined)
		{
			checkbox_element = document.getElementById('UserCheck_Confirm_Checkbox');
			checkbox_ready = checkbox_element.checked;
		}
		else
			checkbox_ready = true;
			
		//If the reason textbox exists and is enforced, its value will determine the button status.
		if(window.oUserAction.incidentObject.IsReasonEnforced === true && window.oUserAction.textareaExists(AdminMessage))
		{
			textarea_element = document.getElementById('UserCheck_Textual_Input');
	
			//If the textarea is an incorrect element or length is correct, check passes.
			if(textarea_element.value === undefined)
			{
				textarea_ready = true;
				//This element is not really our text area so we don't need it.
				textarea_element = null;
			}
			else
			{
				if (textarea_element.value.length > 0 && textarea_element.value.length <= 400 && textarea_element.value != PORTAL_IS.L10N.L10N_Obj.getStr("ENTER_TEXT") && textarea_element.value != window.oUserAction.textAreaText)
					textarea_ready = true;
				else
					textarea_ready = false;
			}
		}
		else
			textarea_ready = true;
			
		var all_ready = checkbox_ready === true && textarea_ready === true;
			
		var correctClass = window.oUserAction.getCorrectClass();
         var elememt_to_scroll = null;
	
		if(checkbox_element != null)
		{

			checkbox_element.parentNode.parentNode.parentNode.parentNode.setAttribute(correctClass, (checkbox_ready ? "usercheck_red_no_highlight" : "usercheck_red_highlight" ));
              elememt_to_scroll = checkbox_ready ? elememt_to_scroll : checkbox_element.parentNode.parentNode.parentNode.parentNode;
		}
		
		if(textarea_element != null)
		{
			textarea_element.setAttribute(correctClass, "usercheck_message_class usercheck_textual_input_class " + (textarea_ready ? "usercheck_red_no_highlight" : "usercheck_red_highlight usercheck_textual_input_class_required" ));
			elememt_to_scroll = textarea_ready ? elememt_to_scroll : textarea_element;
			if(!textarea_ready)
			{
				if(window.oUserAction.textAreaText === "" || textarea_element.value !== window.oUserAction.textAreaText)
				{
					if(window.oUserAction.textAreaText != "")
						textarea_element.value = window.oUserAction.textAreaText;
					else
				textarea_element.value = PORTAL_IS.L10N.L10N_Obj.getStr("ENTER_TEXT");
				}
				textarea_element.onfocus = function() { window.oUserAction.clearRequiredInput(); };
			}
		}

		if(!textarea_ready && !checkbox_ready && checkbox_element!=null && textarea_element!=null)
		{
			if(checkbox_element.parentNode.parentNode.parentNode.parentNode.offsetTop > textarea_element.offsetTop)
				elememt_to_scroll = checkbox_element;
			
		}

		if(elememt_to_scroll!=null){
			elememt_to_scroll.scrollIntoView(false);
			var scrollableDiv = document.getElementById("usercheck_scrollable_div");
			if (scrollableDiv !== null)
				scrollableDiv.scrollLeft = 0;
		}
        
		var errorElement = document.getElementById('usercheck_error_div');
		if(errorElement != null)
			errorElement.innerHTML = all_ready ? "" : "<br/><span style='color: #FF0000;'>* " + PORTAL_IS.L10N.L10N_Obj.getStr("REQUIRED_FIELDS") + "</span>";
		
		return all_ready;
	}
	
	this.clearRequiredInput = function()
	{
		textarea_element = document.getElementById('UserCheck_Textual_Input');
		
		textarea_element.value = "";
		
		var correctClass = window.oUserAction.getCorrectClass();
		
		if(textarea_element.getAttribute(correctClass).indexOf("usercheck_red_highlight") !== -1){
		textarea_element.setAttribute(correctClass, "usercheck_message_class usercheck_textual_input_class usercheck_red_highlight");
		}
		else
			textarea_element.setAttribute(correctClass, "usercheck_message_class usercheck_textual_input_class");
		
		textarea_element.onfocus = function() { };
	}

	this.sendMail  = function()
	{
		DEBUG.out("UserAction::sendMail");
        	this.last_action = 'sent';
		
		if(!window.oUserAction.highlightInput())
			//There was some user input missing - don't continue.
			return;
			
		var reason = "";
		if(document.getElementById('UserCheck_Textual_Input') != null)
		{
			reason = document.getElementById('UserCheck_Textual_Input').value;
			//If the reason box is not found, there is nothing to enforce.
			if(reason === undefined)
			{
				reason = "";
			}
		}


		var sendMailCallback = new Callback();
		sendMailCallback.methodReference 	= this.handleConfirmationData;
		sendMailCallback.thisArgument		= this;
		sendMailCallback.args.push(new Callback());
		PORTAL_IS.AJAX_MGR.sendAsyncReq(	getURL("EmailSend"),
											"mailId="+encodeURIComponent(UserCheck.DataObj.IID)+
											"&justification="+encodeURIComponent(reason)+"&action=DLP-CHOICE-ACTION-SEND",
											sendMailCallback,
											null,
											null,
											"Sending email failed.");


	}
	
	this.discardMail = function()
	{
		DEBUG.out("UserAction::deleteMail");
       		 this.last_action = 'delete';
		
		var sendMailCallback = new Callback();
		sendMailCallback.methodReference 	= this.handleConfirmationData;
		sendMailCallback.thisArgument		= this;
		sendMailCallback.args.push(new Callback());
		PORTAL_IS.AJAX_MGR.sendAsyncReq(	getURL("EmailSend"),
											"mailId="+encodeURIComponent(UserCheck.DataObj.IID)+
											"&justification="+encodeURIComponent("")+"&action=DLP-CHOICE-ACTION-DISCARD",
											sendMailCallback,
											null,
											null,
											"Sending email failed.");


	}
	
	this.handleConfirmationData = function(xhrStatus, xhrResponse, callback)
	{
		DEBUG.out("UserAction::handleConfirmationData ");
		if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		if (xhrStatus != 200)
		{
			// TODO: Handle error.
			DEBUG.out('Retreiving Single Incident Review Data failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}
		var newViewJSONObj = JSON.parse(xhrResponse);
		var message = newViewJSONObj.message;
		var lastChanged = newViewJSONObj.lastChanged;
		var succeeded = newViewJSONObj.succeeded;
		if (lastChanged != -1 && lastChanged != 0)
		{
            //message += " ";
            //message += convertToGmt(lastChanged);
            //this.emailData.date = convertToGmt(lastChanged);
        }
		//@@NA add test if this is from Thin Portal and only then redirect to about:blank
        // window.location = "about:blank";
		if (succeeded)
		{
			var cookie = getCookie('UserCheck_UserID');
			var requestData = {};
			requestData.IID = "-1";
			requestData.UserID = cookie;
			requestData.IsReasonExist = true;
			requestData.Reason = "";
			requestData.UserOption = "SEND";
			if (newViewJSONObj.action == "DLP-CHOICE-ACTION-DISCARD")
			{
				requestData.UserOption = "DISCARD";
			}
				
			if (newViewJSONObj.action === undefined || newViewJSONObj.action != "DLP-CHOICE-ACTION-SEND")			
			{
				requestData.IsReasonExist = false;
			}
			else
			{
			if(document.getElementById('UserCheck_Textual_Input') != null)
			{
				var reason = document.getElementById('UserCheck_Textual_Input').value;

				//If the reason box is not found, there is nothing to enforce.
				if(reason === undefined)
				{
					reason = "";
					requestData.IsReasonExist = false;
				}
				else if(window.oUserAction.incidentObject.IsReasonEnforced === true && (reason.length == 0 || reason.length > 400))
					return;
					
				requestData.Reason = reason;
			}
			else
			{
				requestData.IsReasonExist = false;
			}
			}
			//Sometimes the cookie is not written correctly, so used global user.
			if(requestData.UserID == null || requestData.UserID == "")
				requestData.UserID = g_userID;
			requestData.IID = UserCheck.DataObj.IID;
			
			var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetUserCheckUserChoiceData");
				
			sendAsynchronousRequest(sAbsoluteURL,
									flattenObject(requestData),
									this.handleUserCheckChoiceData,
									this,
									[new Callback()]);
		}
						
	}
	
	this.goToBlank = function()
	{
		window.location = "about:blank";
	}
	
	this.ApproveHttp = function()
	{
		this.sendMail();
	}
	
	this.name_show = function(target)
	{
		document.getElementById(target).style.display = 'inline';
	}
	this.name_hide = function(target)
	{
		document.getElementById(target).style.display = 'none';
	}
	this.expand_link = function(target,data)
	{
		//simple code for chrome and FF
		//document.getElementById(target).innerHTML = data;

		//workaround for IE to do the same in 6 lines:(
		var newdiv = document.createElement("div");
		newdiv.innerHTML = data
		newdiv.style.display = 'inline';
		var container = document.getElementById(target);
		container.removeChild( container.firstChild );
		container.appendChild(newdiv);
	}
	this.createScrubbingLinks = function(attachments, isExtended)
	{
		var scrub_files_out = "<ul id= \"te_links\" style=\"list-style-type: none;text-align:left;word-break: break-all;\">";
		var cutoff_len = 35;
		for (var i = 0;i<attachments.length;i++)
		{
			var filename = attachments[i].fileName;
			var orig_filename = attachments[i].fileName;
			var elipsis = "";
			var chars = filename.split("");
			var elipsis_arg = "elipsis_"+  i;
			var filename_arg = "fname_" + i;
			if(chars.length > cutoff_len){
                                filename = attachments[i].fileName.split("",cutoff_len).join("");
                        	elipsis = "...";
                        }
			var elipsis_html = "<span id =\"" + elipsis_arg + "\" title=\"Click to expand\" ><a href=\"#\" style=\"color:#333333;font-weight:bold\" onclick= \"window.oUserAction.name_hide('" + elipsis_arg + "');window.oUserAction.expand_link('" + filename_arg +"','" + orig_filename + "');\">" + elipsis + "</a></span>";
			if (attachments[i].fileStatus == "FILE-STATUS-APPROVED-BY-TE" || attachments[i].fileStatus == "FILE-STATUS-AVAILABLE" || attachments[i].fileStatus == "FILE-STATUS-AVAILABLE-SUSPICIOUS")
			{
				var image = "images/confirmation.png";
				var comment = "";
				var toolTip = "Click to download";
				var removedParts = attachments[i].removedParts;
				if (isExtended == true)
				{
					if(removedParts != "")
					{
						removedParts = removedParts.replace(/\n/g,", ");
						comment = " contains " + removedParts;
					}
					else
					{
						 comment = ("CP_SCRUB_RESULT_SUCCESS" != attachments[i].scrubResult) ? PORTAL_IS.L10N.L10N_Obj.getStr(attachments[i].scrubResult) : "";
					}
				}
				scrub_files_out += "<li title=\"" + toolTip + "\"><img style=\"padding-bottom: 1px;\" src=\"" + image + "\" width=\"20\" height=\"20\"/>&nbsp;" + "<a href=\"ScrubGetFile?IID="+UserCheck.DataObj.IID+"&fileID="+attachments[i].fileId+"\" TARGET=\"_blank\"><span id =\"" + filename_arg + "\" style=\"font-weight:bold;color:#1b81ff\">" + filename + "</span></a>" + elipsis_html + "<span style=\"color:#333333;font-weight:bold\">" + comment + "</span></li>"
			}
			else
			{
				var description = "";
				var img = "";
				var toolTip = "";
                g_BlockSendMail = true;
				if (attachments[i].fileStatus == "FILE-STATUS-WAITING-FOR-TE")
				{
					g_refreshFiles = true;
					description = "scanning...";
					img = "img/loader.gif";
					toolTip = "Please wait while file is being scanned";
				}
				else if (attachments[i].fileStatus == "FILE-STATUS-BLOCKED-BY-TE")
				{
					description = "blocked - file is malicious";
					img = "img/block.png";
					toolTip = "File is malicious - blocked for download";
				}
				else if (attachments[i].fileStatus == "FILE-STATUS-BLOCKED-BY-POLICY")
				{
					description = "blocked according to company policy";
					img = "img/block.png";
					toolTip = "File is blocked for download according to company policy";
				}
				scrub_files_out += "<li title=\"" + toolTip + "\"><img src=\"" + img + "\" width=\"20\" height=\"20\"/>&nbsp;<span id =\"" + filename_arg + "\">" + filename + "</span>" + elipsis_html + " <span style=\"color:LightSteelBlue\">(" + description + ")</span></li>"
			}
		}
		scrub_files_out += "</ul><div id=\"refresh_timer_div\"></div>";
		return scrub_files_out;
	}

    this.isEmailAddressValid = function(inputvalue)
    {	
        var pattern=/^[^@;\s<>]+@[^@;\s<>]+\.[^@;\s<>]+$/;
        if(pattern.test(inputvalue))
        {         
            return true;   
        }
        else
        {   
            return false; 
        }
    }
    
    this.highlightScrubInput = function()
    {
        var correctClass = window.oUserAction.getCorrectClass();
        var textarea_ready = false;
        textarea_element = document.getElementById('send_original_email_textarea');
        var errorElement = document.getElementById('scrub_error_div');
        var isValidEmail = false;
        //If the textarea is an incorrect element or length is correct, check passes.
        if(textarea_element.value != null)
        { 
            
            if (textarea_element.value.length > 0 && textarea_element.value.length <= 128 && textarea_element.value != PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_EXAMPLE"))
            {   
                    
                    isValidEmail = window.oUserAction.isEmailAddressValid(textarea_element.value);
                    error_string = isValidEmail ? "" : PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_EMAIL_INVALID");
                    if(errorElement != null)
                    {
                        errorElement.innerHTML = isValidEmail ? "" : "<br/><span style='color: #FF0000; display=inline'>* " + PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_INVALID_EMAIL") + "</span>";
                    }
                    
                    textarea_ready = isValidEmail ? true : false;
            }
            else
            {
                    textarea_ready = false;
                    if(errorElement != null)
                    {
                        errorElement.innerHTML = "<br/><span style='color: #FF0000; display=inline'>* " + PORTAL_IS.L10N.L10N_Obj.getStr("REQUIRED_FIELDS") + "</span>";
                    }
                    
            }
            textarea_element.setAttribute(correctClass, (textarea_ready ? "usercheck_red_no_highlight" : "usercheck_red_highlight " ));
			if(!textarea_ready)
			{
				if(textarea_element.value === "")
				{   
                    textarea_element.value = PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_EXAMPLE");
                    textarea_element.setAttribute(correctClass, "usercheck_red_highlight");
				}
                if(textarea_element.value === PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_EXAMPLE"))
                {
                    textarea_element.onfocus = function() { window.oUserAction.clearScrubRequiredInput(); };
                }
			}
        }
        
        var scrub_send_email_result = document.getElementById('scrub_send_email_result_div');
        if(scrub_send_email_result != null)
        {
            scrub_send_email_result.innerHTML = "";
        }
        
        return textarea_ready;
    }
    
    this.clearScrubRequiredInput = function()
    {
            textarea_element = document.getElementById('send_original_email_textarea');
            
            textarea_element.value = "";
            var correctClass = window.oUserAction.getCorrectClass();
            
            if(textarea_element.getAttribute(correctClass) && textarea_element.getAttribute(correctClass).indexOf("usercheck_red_highlight") !== -1)
                textarea_element.setAttribute(correctClass, "usercheck_red_highlight");
            else
                textarea_element.setAttribute(correctClass, "");
            
            textarea_element.onfocus = function() { };
    }
        
    this.ScrubSendOriginalMail = function(IID)
    {
        receipientarea_element = document.getElementById('send_original_email_textarea');
        if(receipientarea_element != null)
        {
            if(document.getElementById('send_original_email_textarea').value !== undefined)
                //Unfocus the text-area.
                document.getElementById('send_original_email_textarea').blur();
            if(!window.oUserAction.highlightScrubInput())
                //There was some user input missing - don't continue.
                return;
            textarea_element = document.getElementById('send_original_email_textarea');
            
            var recipient = textarea_element.value;
            setCookie('Scrub_UserEmail', recipient, 31556926);
            
            var requestData = {};
			requestData.IID = IID;
			requestData.RECIPIENT = recipient;
            
            var sAbsoluteURL = PORTAL_IS.TOOLS.getURL('data/SendScrubOrigMail');
				
			sendAsynchronousRequest(sAbsoluteURL,
									flattenObject(requestData),
									this.handleScrubSendEmailResponse,
									this,
									[new Callback()]);
            
        }
    }
    
    this.handleScrubSendEmailResponse = function(xhrStatus, xhrResponse, callback)
    {
        if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		
		if (xhrStatus != 200)
		{
			DEBUG.out('Scrub Sending Email failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}
        
        this.SendingEmailStatus = JSON.parse(xhrResponse);
        this.result = this.SendingEmailStatus.mailActionStatus;
        
        var scrub_send_email_result = document.getElementById('scrub_send_email_result_div');
        if(scrub_send_email_result == null)
        {
           return;  
        }
        
        if( "MAIL-SENT-SUCCESSFULLY" == this.result)
        {
            scrub_send_email_result.innerHTML = "<br/><span style='color: #FF5000;'>" + PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_SUCCESS") + "</span>";
        }
        else
        {
            setCookie('Scrub_UserEmail',PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_EXAMPLE") , 30);
            scrub_send_email_result.innerHTML = "<br/><span style='color: #FF0000;'>" + PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_ERROR") + "</span>";
        }
        
        
    }
    
    this.createScrubbingSendOrigMailOption = function()
	{
        var send_orig_option = "";
        var cookie = getCookie('Scrub_UserEmail');
        var image = "images/confirmation.png";
        var toolTip = "Click for sending the original mail";
        
        if(g_BlockSendMail == true)
        {
            image = "img/block.png";
            toolTip = "Mail is blocked for download according to company policy";
            if(g_refreshFiles == true)
            {
                image = "img/loader.gif";
				toolTip = "Please wait while files are being scanned";
            }
        }
        
		var defaultStr = cookie != null ? cookie : PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_EMAIL_EXAMPLE");
        var string_element = "<span";
        string_element += (g_BlockSendMail == true) ? " style=\"color:LightSteelBlue\" >" : ">";
        string_element +=  PORTAL_IS.L10N.L10N_Obj.getStr("CP_SCRUB_SEND_MAIL_STRING");
        string_element +=  " &nbsp;&nbsp;";
        
        var textarea_element = "<textarea id=\"send_original_email_textarea\" class =\"usercheck_textual_input_class_required\" style=\"width: 180px; height: 20px; font-size: 14px; vertical-align: top;\" xcontenteditable=\"true\" unselectable=\"off\"";
        textarea_element += (g_BlockSendMail == true) ? "disabled" : "";
        textarea_element += ">" +defaultStr + "</textarea>&nbsp;&nbsp;";
        
        var error_element = "<span><span id=\"scrub_error_div\" unselectable=\"on\"><br><span style=\"color: #FF0000;\"></span></span>";
        var result_element = "<span id=\"scrub_send_email_result_div\" unselectable=\"on\"><br></span>";
        
        var send_button_element = "<a id=\"send_original_email_button\" title=\"" + toolTip + "\" class=\"SendButtonNormal\"  onclick=\"window.oUserAction.ScrubSendOriginalMail('" + UserCheck.DataObj.IID + "')\"  unselectable=\"on\"><span id=\"send_original_email_span\" unselectable=\"off\"\></span></a>&nbsp&nbsp</span>";

        send_orig_option = "<div id=\"send_original_email_div\">";
        send_orig_option += "<ul id=\"send_original_email_ul\" style=\"list-style-type: none;padding: 0;\">";
        send_orig_option += "<li><img src=\"" + image + "\" width=\"20\" height=\"20\"/>&nbsp;&nbsp;";
        send_orig_option += string_element;
        send_orig_option += textarea_element;
        
        send_orig_option += (g_BlockSendMail == false) ? send_button_element : "";
        send_orig_option += error_element;
        send_orig_option += result_element;
        
        send_orig_option += "</li>";
        send_orig_option += "</ul>";
        send_orig_option += "</div>";
        return send_orig_option;
    }
	
	this.handleScrubbingFiles = function(xhrStatus, xhrResponse, callback)
	{
		if (callback == undefined)
    	{
    	    callback = new Callback();
		}
		
		if (xhrStatus != 200)
		{
			DEBUG.out('Retreiving UserCheck Incident Data failed. ('+xhrStatus+')', DEBUG.ERROR);
			callback.call();
			return;
		}
		
		this.scrubbingResponse = JSON.parse(xhrResponse);
		
		var attachments = [];			
		if( Object.prototype.toString.call( this.scrubbingResponse.data.attachments ) != '[object Array]' ) {
			attachments[0] = this.scrubbingResponse.data.attachments;
		}
		else
		{
			attachments = this.scrubbingResponse.data.attachments;
		}
		
		g_refreshFiles = false;
		g_BlockSendMail = false;
		var scrub_links_simple = document.getElementById('links_simple');		
		if (scrub_links_simple != null)
		{
			if (scrub_links_simple.hasChildNodes())
				scrub_links_simple.removeChild(scrub_links_simple.childNodes[0]);
			var tmp = document.createElement("div");
			tmp.innerHTML = window.oUserAction.createScrubbingLinks(attachments, false);
			scrub_links_simple.appendChild(tmp);
		}
		
		var scrub_links_extended = document.getElementById('links_extended');
		if (scrub_links_extended != null)
		{
			if (scrub_links_extended.hasChildNodes())
				scrub_links_extended.removeChild(scrub_links_extended.childNodes[0]);
			var tmp = document.createElement("div");
			tmp.innerHTML = window.oUserAction.createScrubbingLinks(attachments, true);
			scrub_links_extended.appendChild(tmp);
		}
		document.getElementById('usercheck_content_table').style.width = 'auto';
		
        var scrub_wait_massage = document.getElementById('scrub_wait_message');
		if (scrub_wait_massage != null)
		{	
			scrub_wait_massage.style.display = 'none';
		}

        var scrub_send_orig_mail = document.getElementById('scrub_send_orig_mail');		
		if (scrub_send_orig_mail != null)
		{
			if (scrub_send_orig_mail.hasChildNodes())
				scrub_send_orig_mail.removeChild(scrub_send_orig_mail.childNodes[0]);
			var tmp = document.createElement("div");
			tmp.innerHTML = window.oUserAction.createScrubbingSendOrigMailOption();
			scrub_send_orig_mail.appendChild(tmp);
            var scrub_orig_eml_textarea = document.getElementById('send_original_email_textarea');
            if(scrub_orig_eml_textarea != null)
            {
                scrub_orig_eml_textarea.onfocus = function() { window.oUserAction.clearScrubRequiredInput(); };
            }
            
            if(g_BlockSendMail == true)
            {
                this.setButtonMode(false,'send_original_email_button')
            }
		}
		
		if (g_refreshFiles)
		{
			UserCheck.tools.oTimeoutManager.startTimeoutTimer(30, window.oUserAction.refreshScrubbingFiles);
		}
		callback.call();
	}
	
	this.refreshScrubbingFiles = function()
	{
		var requestData = 	{
				IID: "-1"
			};
		requestData.IID = UserCheck.DataObj.IID;
		var sAbsoluteURL = PORTAL_IS.TOOLS.getURL("data/GetScrubFiles");
		sendAsynchronousRequest(sAbsoluteURL,
				flattenObject(requestData),
				window.oUserAction.handleScrubbingFiles,
				this,
				[new Callback()]);
	}
	
    this.showOrHideRemovedPartsfromFiles = function(FileIndex)
    {       
        var infoimg_element = document.getElementById('infoimg_' + FileIndex);
        var removed_parts_element = document.getElementById('removed_parts_' + FileIndex);
        
        if ( infoimg_element != null && removed_parts_element != null )
        {           
            if( removed_parts_element.style.display === "none" )
            {
                infoimg_element.style.display = 'none';
                removed_parts_element.style.display = 'inline';
            }
            else 
            {
                infoimg_element.style.display = "inline";
                removed_parts_element.style.display = 'none';
            }
        }
    }
	
} //END: window.UserAction = function()

window.oUserAction = new UserAction();
oUserAction.init();
	
    </script>

</html>
