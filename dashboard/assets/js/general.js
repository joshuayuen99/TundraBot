// prefix text
$("input #prefix").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

// join messages checkbox
$("#logMessagesCheckbox").change(function() {
    if ($(this).prop("checked")) { // checked
        $("#logMessagesChannel").prop("required", true);
        $("#logMessagesChannel").prop("disabled", false);

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    } else { // unchecked
        $("#logMessagesChannel").prop("required", false);
        $("#logMessagesChannel").prop("disabled", true);
        $("#logMessagesChannel").removeClass("is-valid");
        $("#logMessagesChannel").removeClass("is-invalid");

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    }
});

// join messages channel scroll
$("select#logMessagesChannel").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

// welcome message checkbox
$("#welcomeMessageCheckbox").change(function() {
    if ($(this).prop("checked")) { // checked
        $("#welcomeMessage").prop("required", true);
        $("#welcomeMessage").prop("disabled", false);
        $("#welcomeMessageChannel").prop("required", true);
        $("#welcomeMessageChannel").prop("disabled", false);

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    } else { // unchecked
        $("#welcomeMessage").prop("required", false);
        $("#welcomeMessage").prop("disabled", true);
        $("#welcomeMessage").removeClass("is-valid");
        $("#welcomeMessage").removeClass("is-invalid");
        $("#welcomeMessageChannel").prop("required", false);
        $("#welcomeMessageChannel").prop("disabled", true);
        $("#welcomeMessageChannel").removeClass("is-valid");
        $("#welcomeMessageChannel").removeClass("is-invalid");

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    }
});

// welcome message text
$("textarea#welcomeMessage").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

// welcome message channel scroll
$("select#welcomeMessageChannel").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

// join messages checkbox
$("#joinMessagesCheckbox").change(function() {
    if ($(this).prop("checked")) { // checked
        $("#joinMessagesChannel").prop("required", true);
        $("#joinMessagesChannel").prop("disabled", false);

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    } else { // unchecked
        $("#joinMessagesChannel").prop("required", false);
        $("#joinMessagesChannel").prop("disabled", true);
        $("#joinMessagesChannel").removeClass("is-valid");
        $("#joinMessagesChannel").removeClass("is-invalid");

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    }
});

// join messages channel scroll
$("select#joinMessagesChannel").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

// leave messages checkbox
$("#leaveMessagesCheckbox").change(function() {
    if ($(this).prop("checked")) { // checked
        $("#leaveMessagesChannel").prop("required", true);
        $("#leaveMessagesChannel").prop("disabled", false);

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    } else { // unchecked
        $("#leaveMessagesChannel").prop("required", false);
        $("#leaveMessagesChannel").prop("disabled", true);
        $("#leaveMessagesChannel").removeClass("is-valid");
        $("#leaveMessagesChannel").removeClass("is-invalid");

        // check if submit button should be clickable
        $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
    }
});

// leave messages channel scroll
$("select#leaveMessagesChannel").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});

$(document).ready(function() {
    // check if submit button should be clickable
    $("button.submitButton").attr("disabled", !$("form")[0].checkValidity());
});