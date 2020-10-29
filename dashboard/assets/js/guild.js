$(".tabs a, #sidebarExtension h4").on("click", function() {
    $(".tabs a").removeClass("active");
    setModule($(this).attr("id"));
});

function setModule(name) {
    $(".module").hide();
    $(`#${name}Module`).show();
    $(`#${name}`).addClass("active");
}

$("input").on("input", function() {
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

setModule("overview");